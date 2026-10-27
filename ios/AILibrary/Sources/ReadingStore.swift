import Foundation

/// Optional local metadata. Invalid or future versions are ignored independently
/// of the legacy position and the other articles' records.
struct NativeReadingAnchor: Codable, Equatable, Sendable {
    let version: Int
    let documentDigest: String
    let blockFingerprint: String
    let headingFingerprint: String?
    /// Relative reading-line position in a measured top-level block, independent
    /// of wrapping/point size. Legacy `ReadingPosition.fraction` is unchanged.
    private(set) var intraBlockFraction: Double?

    init?(documentDigest: String, blockFingerprint: String, headingFingerprint: String? = nil,
          intraBlockFraction: Double? = nil) {
        guard ContentValidator.isDigest(documentDigest), ContentValidator.isDigest(blockFingerprint),
              headingFingerprint.map(ContentValidator.isDigest) ?? true else { return nil }
        version = 1
        self.documentDigest = documentDigest
        self.blockFingerprint = blockFingerprint
        self.headingFingerprint = headingFingerprint
        self.intraBlockFraction = Self.validFraction(intraBlockFraction)
    }

    static func validFraction(_ value: Double?) -> Double? {
        guard let value, value.isFinite, (0...1).contains(value) else { return nil }
        return value
    }

    var withoutIntraBlockFraction: Self {
        var copy = self
        copy.intraBlockFraction = nil
        return copy
    }

    private enum CodingKeys: String, CodingKey {
        case version, documentDigest, blockFingerprint, headingFingerprint, intraBlockFraction
    }
    init(from decoder: Decoder) throws {
        let fields = try decoder.container(keyedBy: CodingKeys.self)
        let version = try fields.decode(Int.self, forKey: .version)
        let digest = try fields.decode(String.self, forKey: .documentDigest)
        let block = try fields.decode(String.self, forKey: .blockFingerprint)
        let heading = try fields.decodeIfPresent(String.self, forKey: .headingFingerprint)
        // An invalid optional progress field must not discard a valid semantic
        // anchor or the independently decoded legacy fields.
        let progress = try? fields.decodeIfPresent(Double.self, forKey: .intraBlockFraction)
        guard version == 1, let value = Self(documentDigest: digest, blockFingerprint: block,
                                             headingFingerprint: heading, intraBlockFraction: progress ?? nil) else {
            throw DecodingError.dataCorruptedError(forKey: .version, in: fields,
                                                  debugDescription: "Unsupported or invalid reading anchor")
        }
        self = value
    }
}

struct ReadingPosition: Codable, Equatable, Sendable {
    let heading: String?
    let fraction: Double
    let blockID: String?
    let anchor: NativeReadingAnchor?

    init(heading: String?, fraction: Double, blockID: String? = nil, anchor: NativeReadingAnchor? = nil) {
        self.heading = heading
        self.fraction = fraction.isFinite ? min(1, max(0, fraction)) : 0
        self.blockID = blockID
        self.anchor = anchor
    }

    private enum CodingKeys: String, CodingKey { case heading, fraction, blockID, anchor }
    init(from decoder: Decoder) throws {
        let fields = try? decoder.container(keyedBy: CodingKeys.self)
        let heading = try? fields?.decodeIfPresent(String.self, forKey: .heading)
        let fraction = (try? fields?.decodeIfPresent(Double.self, forKey: .fraction)) ?? 0
        let block = try? fields?.decodeIfPresent(String.self, forKey: .blockID)
        let anchor = try? fields?.decodeIfPresent(NativeReadingAnchor.self, forKey: .anchor)
        self.init(heading: heading ?? nil, fraction: fraction, blockID: block ?? nil, anchor: anchor ?? nil)
    }
}

/// Only an actual top/end-marker measurement can construct the renderer's sample.
/// The buffer has no clocks/tasks/defaults: delayed tasks hold a token, and a
/// cancelled/superseded task cannot save a newer sample on its earlier deadline.
struct NativeReadingSample: Equatable, Sendable {
    let heading: String?
    let blockID: String
    let fraction: Double
    let intraBlockFraction: Double
}

struct NativeReadingProgressBuffer {
    private(set) var pending: NativeReadingSample?
    private(set) var lastSaved: NativeReadingSample?
    private(set) var token: UInt64 = 0

    mutating func stage(_ sample: NativeReadingSample) -> UInt64? {
        token &+= 1
        guard sample.fraction.isFinite, (0...1).contains(sample.fraction),
              NativeReadingAnchor.validFraction(sample.intraBlockFraction) != nil else { return nil }
        pending = sample == lastSaved ? nil : sample
        return pending == nil ? nil : token
    }

    mutating func cancelDelay() { token &+= 1 }

    mutating func takeForSaving(expectedToken: UInt64? = nil, restoring: Bool) -> NativeReadingSample? {
        guard !restoring, expectedToken == nil || expectedToken == token,
              let sample = pending else { return nil }
        pending = nil
        token &+= 1
        guard sample != lastSaved else { return nil }
        lastSaved = sample
        return sample
    }
}

/// Production completion/recording gate, shared with the persistence regressions.
/// A proxy's intermediate position must not overwrite an automatic resume goal.
struct NativeReadingPlacementRequest {
    enum Purpose { case automaticResume, automaticReflow, explicitNavigation }
    let purpose: Purpose
    let userPanEpoch: UInt64
    let generation: UUID

    init(purpose: Purpose, userPanEpoch: UInt64, generation: UUID = UUID()) {
        self.purpose = purpose
        self.userPanEpoch = userPanEpoch
        self.generation = generation
    }
}

struct NativeReadingProgressSession {
    enum CompletionEffect: Equatable {
        case measuredAlignment, measuredUserPan
        case preserveAutomaticPosition, preserveUnreachedNavigation
        case ignoreSuperseded

        var acceptsMeasurement: Bool {
            self == .measuredAlignment || self == .measuredUserPan
        }
        var consumesOneShot: Bool { acceptsMeasurement }
        // A latest user-pan measurement may consume the old intent, but must
        // never move accessibility focus back to that cancelled destination.
        var restoresRequestedFocus: Bool { self == .measuredAlignment }
    }
    struct Completion {
        let effect: CompletionEffect
        let delayToken: UInt64?
    }
    private var buffer = NativeReadingProgressBuffer()
    private(set) var blockedAtUserPanEpoch: UInt64?
    private var activeGeneration: UUID?
    private var placementUserPanEpoch: UInt64?
    private var placementInFlight = false

    mutating func beginPlacement(_ request: NativeReadingPlacementRequest) {
        activeGeneration = request.generation
        placementUserPanEpoch = request.userPanEpoch
        placementInFlight = true
        if case .explicitNavigation = request.purpose { blockedAtUserPanEpoch = nil }
        buffer.cancelDelay()
    }

    func userPanBeforeReplacement(userPanEpoch: UInt64) -> UInt64? {
        guard placementInFlight, let epoch = placementUserPanEpoch, epoch != userPanEpoch else { return nil }
        return epoch
    }

    mutating func cancelUnreachedPlacement(userPanEpoch: UInt64) {
        blockedAtUserPanEpoch = userPanEpoch
        activeGeneration = nil
        placementUserPanEpoch = nil
        placementInFlight = false
        buffer.cancelDelay()
    }

    mutating func permitsTracking(userPanEpoch: UInt64) -> Bool {
        guard !placementInFlight else { return false }
        guard let blocked = blockedAtUserPanEpoch else { return true }
        guard blocked != userPanEpoch else { return false }
        blockedAtUserPanEpoch = nil
        return true
    }

    mutating func stageMeasured(_ sample: NativeReadingSample, userPanEpoch: UInt64) -> UInt64? {
        guard permitsTracking(userPanEpoch: userPanEpoch) else { return nil }
        return buffer.stage(sample)
    }

    // The storage layer needs only the observed alignment result. Keeping this
    // boundary independent of the UI policy preserves the Foundation CLI inputs.
    mutating func completePlacement(placementAligned: Bool,
        request: NativeReadingPlacementRequest, currentUserPanEpoch: UInt64,
        isUserInteracting: Bool, measured: NativeReadingSample?) -> Completion {
        guard placementInFlight, activeGeneration == request.generation else {
            return Completion(effect: .ignoreSuperseded, delayToken: nil)
        }
        placementInFlight = false
        let userMoved = currentUserPanEpoch != request.userPanEpoch || isUserInteracting
        let effect: CompletionEffect
        if userMoved { effect = .measuredUserPan }
        else if placementAligned, measured != nil { effect = .measuredAlignment }
        else {
            switch request.purpose {
            case .automaticResume, .automaticReflow: effect = .preserveAutomaticPosition
            case .explicitNavigation: effect = .preserveUnreachedNavigation
            }
        }
        guard effect.acceptsMeasurement else {
            // Also gate later preference callbacks at the intermediate offset.
            // A root replacement changes the placement epoch, not userPanEpoch.
            blockedAtUserPanEpoch = currentUserPanEpoch
            buffer.cancelDelay()
            return Completion(effect: effect, delayToken: nil)
        }
        blockedAtUserPanEpoch = nil
        return Completion(effect: effect, delayToken: measured.flatMap { buffer.stage($0) })
    }

    mutating func takeForSaving(expectedToken: UInt64? = nil, restoring: Bool) -> NativeReadingSample? {
        buffer.takeForSaving(expectedToken: expectedToken, restoring: restoring || placementInFlight)
    }
}

/// Only local reading records; no account, analytics or network synchronization.
final class ReadingStore {
    /// Raw data stays at the original key until the user chooses recovery.
    /// A single fixed backup is never replaced by a later recovery attempt.
    enum RecoveryIssue: Equatable {
        case partial, unreadable, unsupported, tooLarge, backupExists, backupFailed, writeFailed, changed

        var canRecover: Bool { self == .partial || self == .unreadable }
        var message: String {
            switch self {
            case .partial:
                return "保存した読書記録の一部を読み取れません。読み取れるしおりと読書位置を表示しています。"
            case .unreadable:
                return "保存した読書記録を読み取れません。元のデータを保護しています。"
            case .unsupported, .tooLarge:
                return "保存した読書記録の形式またはサイズを確認できないため、元のデータを保護しています。アプリを削除せず、この状態を開発者へお知らせください。"
            case .backupExists:
                return "以前の退避データがあるため、復旧を中止しました。現在の記録と退避データは上書きしていません。アプリを削除せず、この状態を開発者へお知らせください。"
            case .backupFailed:
                return "元の記録の退避を確認できないため、復旧を中止しました。保存データは上書きしていません。アプリを削除せず、この状態を開発者へお知らせください。"
            case .writeFailed:
                return "復旧した記録の保存を確認できません。元のデータは退避しています。アプリを削除せず、この状態を開発者へお知らせください。"
            case .changed:
                return "保存データが変わったため、復旧を中止しました。アプリを開き直して記録を確認してください。"
            }
        }
    }

    private struct State: Codable {
        var bookmarks: Set<String> = []
        var positions: [String: ReadingPosition] = [:]
        var lastArticleID: String?
        var needsRecovery = false
        init() {}
        private enum CodingKeys: String, CodingKey { case bookmarks, positions, lastArticleID }

        private struct Element<Value: Decodable>: Decodable {
            let value: Value?
            init(from decoder: Decoder) throws { value = try? Value(from: decoder) }
        }

        /// Decode each legacy field independently, keeping valid sibling records.
        /// Optional invalid/future anchors still fall back to the legacy position.
        private struct Position: Decodable {
            let value: ReadingPosition?
            let needsRecovery: Bool
            private enum CodingKeys: String, CodingKey { case heading, fraction, blockID, anchor }
            init(from decoder: Decoder) throws {
                guard let fields = try? decoder.container(keyedBy: CodingKeys.self) else {
                    value = nil; needsRecovery = true; return
                }
                var damaged = false
                func field<Value: Decodable>(_ type: Value.Type, _ key: CodingKeys) -> Value? {
                    do { return try fields.decodeIfPresent(type, forKey: key) }
                    catch { damaged = true; return nil }
                }
                let heading = field(String.self, .heading)
                let fraction = field(Double.self, .fraction) ?? 0
                let block = field(String.self, .blockID)
                // Optional semantic metadata is intentionally independent of the
                // legacy record. Keep its established future/invalid fallback.
                let anchor = (try? fields.decodeIfPresent(NativeReadingAnchor.self, forKey: .anchor)) ?? nil
                if !fraction.isFinite || !(0...1).contains(fraction) { damaged = true }
                value = ReadingPosition(heading: heading, fraction: fraction, blockID: block, anchor: anchor)
                needsRecovery = damaged
            }
        }

        init(from decoder: Decoder) throws {
            let fields = try decoder.container(keyedBy: CodingKeys.self)
            do {
                let entries = try fields.decodeIfPresent([Element<String>].self, forKey: .bookmarks) ?? []
                bookmarks = Set(entries.compactMap(\.value))
                needsRecovery = entries.contains { $0.value == nil }
            } catch { needsRecovery = true }
            do {
                let entries = try fields.decodeIfPresent([String: Position].self, forKey: .positions) ?? [:]
                positions = entries.compactMapValues(\.value)
                needsRecovery = needsRecovery || entries.values.contains { $0.needsRecovery }
            } catch { needsRecovery = true }
            do { lastArticleID = try fields.decodeIfPresent(String.self, forKey: .lastArticleID) }
            catch { needsRecovery = true }
        }
    }
    private let defaults: UserDefaults
    private let key: String
    private var state: State
    private var originalForRecovery: Data?
    private(set) var recoveryIssue: RecoveryIssue?
    // Cap damaged input before parsing/copying it. Healthy writes keep the legacy format.
    static let maximumRecoveryBytes = 1_048_576
    var bookmarks: Set<String> { state.bookmarks }
    var lastArticleID: String? { state.lastArticleID }

    init(defaults: UserDefaults = .standard, key: String = "library.reading.v1") {
        self.defaults = defaults
        self.key = key
        state = State()
        guard defaults.object(forKey: key) != nil else { return }
        guard let data = defaults.data(forKey: key) else { recoveryIssue = .unsupported; return }
        guard data.count <= Self.maximumRecoveryBytes else { recoveryIssue = .tooLarge; return }
        do {
            state = try JSONDecoder().decode(State.self, from: data)
            if state.needsRecovery { recoveryIssue = .partial; originalForRecovery = data }
        } catch { recoveryIssue = .unreadable; originalForRecovery = data }
    }

    /// Preserve the source before replacing it with readable records and live edits.
    /// A failed backup, existing backup, or changed source never overwrites the main key.
    @discardableResult
    func recoverReadableState() -> Bool {
        guard recoveryIssue?.canRecover == true, let original = originalForRecovery else { return false }
        guard defaults.data(forKey: key) == original else { recoveryIssue = .changed; return false }
        let backupKey = key + ".recovery.v1"
        guard defaults.object(forKey: backupKey) == nil else { recoveryIssue = .backupExists; return false }
        guard let data = try? JSONEncoder().encode(state), data.count <= Self.maximumRecoveryBytes else {
            recoveryIssue = .tooLarge; return false
        }
        defaults.set(original, forKey: backupKey)
        guard defaults.data(forKey: backupKey) == original else { recoveryIssue = .backupFailed; return false }
        // Check again after the backup operation before touching the original key.
        guard defaults.data(forKey: key) == original else { recoveryIssue = .changed; return false }
        defaults.set(data, forKey: key)
        guard defaults.data(forKey: key) == data else { recoveryIssue = .writeFailed; return false }
        state.needsRecovery = false
        originalForRecovery = nil
        recoveryIssue = nil
        return true
    }

    func toggleBookmark(_ id: String) {
        if !state.bookmarks.insert(id).inserted { state.bookmarks.remove(id) }
        save()
    }

    func markOpened(_ articleID: String) {
        guard state.lastArticleID != articleID else { return }
        state.lastArticleID = articleID
        save()
    }

    func record(articleID: String, heading: String?, fraction: Double, blockID: String? = nil,
                anchor: NativeReadingAnchor? = nil) {
        guard fraction.isFinite else { return }
        state.positions[articleID] = ReadingPosition(heading: heading, fraction: fraction, blockID: blockID, anchor: anchor)
        state.lastArticleID = articleID
        save()
    }

    func position(for article: LibraryArticle) -> ReadingPosition {
        guard let saved = state.positions[article.id] else { return ReadingPosition(heading: nil, fraction: 0) }
        let heading = article.headings.contains { $0.id == saved.heading } ? saved.heading : nil
        return ReadingPosition(heading: heading, fraction: saved.fraction, blockID: saved.blockID, anchor: saved.anchor)
    }

    func position(for article: LibraryArticle, document: NativeDocument, documentDigest: String? = nil) -> ReadingPosition {
        let saved = position(for: article)
        guard document.article_id == article.id, !document.blocks.isEmpty else {
            return ReadingPosition(heading: saved.heading, fraction: saved.fraction,
                                   anchor: saved.anchor?.withoutIntraBlockFraction)
        }
        let resolved = document.readingResolution(for: saved, documentDigest: documentDigest)
        let block = resolved?.blockID
        let anchor = resolved?.restoresSameBlock == true ? saved.anchor : saved.anchor?.withoutIntraBlockFraction
        return ReadingPosition(heading: block.flatMap { document.headingID(forBlock: $0) } ?? saved.heading,
                               fraction: saved.fraction, blockID: block, anchor: anchor)
    }

    private func save() {
        guard recoveryIssue == nil else { return }
        if let data = try? JSONEncoder().encode(state) { defaults.set(data, forKey: key) }
    }
}
