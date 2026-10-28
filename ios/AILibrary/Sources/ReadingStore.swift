import CryptoKit
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

/// A read-only, bounded interchange format. Restore can share this decoder later;
/// accepting a backup never writes defaults or selects a destination namespace.
enum ReadingBackupCodec {
    static let maximumRawBytes = 1_048_576
    static let maximumEnvelopeBytes = 2_097_152
    private static let format = "dev.pero3.aiagentlibrary.reading-backup"
    private static let scope = "normal-library"

    enum Failure: LocalizedError, Equatable {
        case noRecords, unavailable, savingSuspended, unsupportedScope, invalid, tooLarge, changed
        var errorDescription: String? {
            switch self {
            case .noRecords: return "まだ記録がありません。記事を開くか、しおりを付けてから書き出してください。"
            case .unavailable: return "読書記録の復旧が必要なため書き出せません。元の記録は変更していません。"
            case .savingSuspended: return "保存内容の変化を確認したため、読書記録の保存と編集を止めています。アプリを開き直して保存内容を確認してください。"
            case .unsupportedScope: return "本文表示テストの読書記録は書き出せません。"
            case .invalid: return "この読書記録の形式には書き出しが対応していません。元の記録は変更していません。アプリを削除せず、この状態を開発者へお知らせください。"
            case .tooLarge: return "読書記録が書き出しの容量上限を超えています。元の記録は変更していません。"
            case .changed: return "保存内容が変わったため書き出しを中止しました。アプリを開き直して、保存されている読書記録を確認してください。"
            }
        }
    }

    struct Counts: Codable, Equatable {
        let bookmarks: Int
        let positions: Int
        init(bookmarks: Int, positions: Int) { self.bookmarks = bookmarks; self.positions = positions }
        init(from decoder: Decoder) throws {
            let f = try fields(decoder, required: ["bookmarks", "positions"])
            bookmarks = try f.decode(Int.self, forKey: Key("bookmarks"))
            positions = try f.decode(Int.self, forKey: Key("positions"))
            guard bookmarks >= 0, positions >= 0 else { throw Failure.invalid }
        }
    }
    struct Validated {
        let rawData: Data
        let counts: Counts
        let createdAt: String
        let appVersion: String
    }

    static func encode(rawData: Data, createdAt: Date, appVersion: String) throws -> Data {
        let counts = try validateRaw(rawData)
        guard createdAt.timeIntervalSince1970.isFinite, validAppVersion(appVersion) else { throw Failure.invalid }
        let envelope = Envelope(format: format, schemaVersion: 1, scope: scope,
            createdAt: dateFormatter().string(from: createdAt), appVersion: appVersion,
            rawBase64: rawData.base64EncodedString(), sha256: digest(rawData), counts: counts)
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
        let data = try encoder.encode(envelope)
        // Both directions use the same acceptance contract, including size limits.
        _ = try decode(data)
        return data
    }

    static func decode(_ data: Data) throws -> Validated {
        guard data.count <= maximumEnvelopeBytes else { throw Failure.tooLarge }
        do {
            try UniqueJSONKeys.check(data)
            let value = try JSONDecoder().decode(Envelope.self, from: data)
            guard value.format == format, value.schemaVersion == 1, value.scope == scope,
                  validAppVersion(value.appVersion),
                  let date = dateFormatter().date(from: value.createdAt),
                  dateFormatter().string(from: date) == value.createdAt,
                  value.rawBase64.utf8.count <= ((maximumRawBytes + 2) / 3) * 4,
                  let raw = Data(base64Encoded: value.rawBase64),
                  raw.base64EncodedString() == value.rawBase64,
                  value.sha256 == digest(raw),
                  try validateRaw(raw) == value.counts else { throw Failure.invalid }
            return Validated(rawData: raw, counts: value.counts,
                             createdAt: value.createdAt, appVersion: value.appVersion)
        } catch let error as Failure { throw error }
        catch { throw Failure.invalid }
    }

    fileprivate static func validateRaw(_ data: Data) throws -> Counts {
        guard data.count <= maximumRawBytes else { throw Failure.tooLarge }
        do {
            try UniqueJSONKeys.check(data)
            let value = try JSONDecoder().decode(RawState.self, from: data)
            return Counts(bookmarks: value.bookmarkCount, positions: value.positionCount)
        } catch let error as Failure { throw error }
        catch { throw Failure.invalid }
    }
    private static func digest(_ data: Data) -> String {
        SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
    }
    private static func validAppVersion(_ value: String) -> Bool {
        !value.isEmpty && value.utf8.count <= 128 &&
        value.unicodeScalars.allSatisfy { !CharacterSet.controlCharacters.contains($0) }
    }
    private static func dateFormatter() -> ISO8601DateFormatter {
        let formatter = ISO8601DateFormatter()
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }
    private struct Key: CodingKey {
        let stringValue: String
        let intValue: Int? = nil
        init(_ value: String) { stringValue = value }
        init?(stringValue: String) { self.init(stringValue) }
        init?(intValue: Int) { return nil }
    }
    private static func fields(_ decoder: Decoder, required: Set<String>, optional: Set<String> = []) throws
        -> KeyedDecodingContainer<Key> {
        let result = try decoder.container(keyedBy: Key.self)
        let actual = Set(result.allKeys.map(\.stringValue))
        guard required.isSubset(of: actual), actual.isSubset(of: required.union(optional)) else { throw Failure.invalid }
        return result
    }
    private struct RawState: Decodable {
        let bookmarkCount: Int
        let positionCount: Int
        init(from decoder: Decoder) throws {
            let f = try fields(decoder, required: ["bookmarks", "positions"], optional: ["lastArticleID"])
            let bookmarks = try f.decode([String].self, forKey: Key("bookmarks"))
            guard Set(bookmarks).count == bookmarks.count else { throw Failure.invalid }
            bookmarkCount = bookmarks.count
            positionCount = try f.decode([String: RawPosition].self, forKey: Key("positions")).count
            _ = try f.decodeIfPresent(String.self, forKey: Key("lastArticleID"))
        }
    }
    private struct RawPosition: Decodable {
        init(from decoder: Decoder) throws {
            let f = try fields(decoder, required: ["fraction"], optional: ["heading", "blockID", "anchor"])
            let fraction = try f.decode(Double.self, forKey: Key("fraction"))
            guard fraction.isFinite, (0...1).contains(fraction) else { throw Failure.invalid }
            _ = try f.decodeIfPresent(String.self, forKey: Key("heading"))
            _ = try f.decodeIfPresent(String.self, forKey: Key("blockID"))
            _ = try f.decodeIfPresent(RawAnchor.self, forKey: Key("anchor"))
        }
    }
    private struct RawAnchor: Decodable {
        init(from decoder: Decoder) throws {
            let f = try fields(decoder, required: ["version", "documentDigest", "blockFingerprint"],
                optional: ["headingFingerprint", "intraBlockFraction"])
            guard try f.decode(Int.self, forKey: Key("version")) == 1,
                  ContentValidator.isDigest(try f.decode(String.self, forKey: Key("documentDigest"))),
                  ContentValidator.isDigest(try f.decode(String.self, forKey: Key("blockFingerprint"))) else { throw Failure.invalid }
            if let heading = try f.decodeIfPresent(String.self, forKey: Key("headingFingerprint")),
               !ContentValidator.isDigest(heading) { throw Failure.invalid }
            if let progress = try f.decodeIfPresent(Double.self, forKey: Key("intraBlockFraction")),
               !progress.isFinite || !(0...1).contains(progress) { throw Failure.invalid }
        }
    }
    private struct Envelope: Codable {
        let format: String
        let schemaVersion: Int
        let scope: String
        let createdAt: String
        let appVersion: String
        let rawBase64: String
        let sha256: String
        let counts: Counts
        init(format: String, schemaVersion: Int, scope: String, createdAt: String, appVersion: String,
             rawBase64: String, sha256: String, counts: Counts) {
            self.format = format; self.schemaVersion = schemaVersion; self.scope = scope
            self.createdAt = createdAt; self.appVersion = appVersion
            self.rawBase64 = rawBase64; self.sha256 = sha256; self.counts = counts
        }
        init(from decoder: Decoder) throws {
            let f = try fields(decoder, required: ["format", "schemaVersion", "scope", "createdAt", "appVersion", "rawBase64", "sha256", "counts"])
            format = try f.decode(String.self, forKey: Key("format"))
            schemaVersion = try f.decode(Int.self, forKey: Key("schemaVersion"))
            scope = try f.decode(String.self, forKey: Key("scope"))
            createdAt = try f.decode(String.self, forKey: Key("createdAt"))
            appVersion = try f.decode(String.self, forKey: Key("appVersion"))
            rawBase64 = try f.decode(String.self, forKey: Key("rawBase64"))
            sha256 = try f.decode(String.self, forKey: Key("sha256"))
            counts = try f.decode(Counts.self, forKey: Key("counts"))
        }
    }

    /// JSONDecoder alone accepts duplicate object keys. Check keys recursively
    /// before typed decoding, with bounded depth and no file/network access.
    private struct UniqueJSONKeys {
        let bytes: [UInt8]
        var cursor = 0
        static func check(_ data: Data) throws {
            var parser = Self(bytes: Array(data))
            try parser.value(depth: 0)
            parser.whitespace()
            guard parser.cursor == parser.bytes.count else { throw Failure.invalid }
        }
        mutating func whitespace() {
            while cursor < bytes.count, [9, 10, 13, 32].contains(bytes[cursor]) { cursor += 1 }
        }
        mutating func take(_ byte: UInt8) throws {
            whitespace()
            guard cursor < bytes.count, bytes[cursor] == byte else { throw Failure.invalid }
            cursor += 1
        }
        mutating func stringRange() throws -> Range<Int> {
            whitespace()
            let start = cursor
            try take(34)
            while cursor < bytes.count {
                let byte = bytes[cursor]; cursor += 1
                if byte == 34 { return start..<cursor }
                if byte == 92 { cursor += 1 }
            }
            throw Failure.invalid
        }
        mutating func value(depth: Int) throws {
            guard depth <= 8 else { throw Failure.invalid }
            whitespace()
            guard cursor < bytes.count else { throw Failure.invalid }
            switch bytes[cursor] {
            case 123:
                cursor += 1; whitespace()
                if cursor < bytes.count, bytes[cursor] == 125 { cursor += 1; return }
                var keys = Set<String>()
                while true {
                    let range = try stringRange()
                    let key = try JSONDecoder().decode(String.self, from: Data(bytes[range]))
                    guard keys.insert(key).inserted else { throw Failure.invalid }
                    try take(58); try value(depth: depth + 1); whitespace()
                    guard cursor < bytes.count else { throw Failure.invalid }
                    if bytes[cursor] == 125 { cursor += 1; return }
                    try take(44)
                }
            case 91:
                cursor += 1; whitespace()
                if cursor < bytes.count, bytes[cursor] == 93 { cursor += 1; return }
                while true {
                    try value(depth: depth + 1); whitespace()
                    guard cursor < bytes.count else { throw Failure.invalid }
                    if bytes[cursor] == 93 { cursor += 1; return }
                    try take(44)
                }
            case 34: _ = try stringRange()
            default:
                let start = cursor
                while cursor < bytes.count, ![9, 10, 13, 32, 44, 93, 125].contains(bytes[cursor]) { cursor += 1 }
                guard cursor > start else { throw Failure.invalid }
            }
        }
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
    /// Observed persistence changes require a fresh store before ordinary edits resume.
    /// This is not a lock or a guarantee against unobserved external writers.
    private(set) var readingSaveSuspended = false
    private var mutationGeneration: UInt64 = 0
    private enum ReadingPersistenceIdentity: Equatable { case absent, data(Data), unsupported }
    /// Exact loaded bytes or the latest raw produced by our own write attempt.
    /// A readback still decides whether those bytes are actually present.
    private var expectedReadingIdentity: ReadingPersistenceIdentity = .absent
    // Cap damaged input before parsing/copying it. Healthy writes keep the legacy format.
    static let maximumRecoveryBytes = 1_048_576
    var bookmarks: Set<String> { state.bookmarks }
    var lastArticleID: String? { state.lastArticleID }

    init(defaults: UserDefaults = .standard, key: String = "library.reading.v1") {
        self.defaults = defaults
        self.key = key
        state = State()
        guard defaults.object(forKey: key) != nil else { return }
        expectedReadingIdentity = .unsupported
        guard let data = defaults.data(forKey: key) else { recoveryIssue = .unsupported; return }
        guard data.count <= Self.maximumRecoveryBytes else { recoveryIssue = .tooLarge; return }
        expectedReadingIdentity = .data(data)
        do {
            state = try JSONDecoder().decode(State.self, from: data)
            if state.needsRecovery { recoveryIssue = .partial; originalForRecovery = data }
        } catch { recoveryIssue = .unreadable; originalForRecovery = data }
    }

    /// Read only the bound namespace's persisted bytes, never the tolerant live state.
    func exportBackup(createdAt: Date, appVersion: String) throws -> Data {
        guard !readingSaveSuspended else { throw ReadingBackupCodec.Failure.savingSuspended }
        guard recoveryIssue == nil else { throw ReadingBackupCodec.Failure.unavailable }
        let generation = mutationGeneration
        let observed = observedReadingIdentity()
        guard observed == expectedReadingIdentity else {
            suspendUnlessOwnHealthyEdit(since: generation)
            throw ReadingBackupCodec.Failure.changed
        }
        if observed == .absent, stateIsEmpty { throw ReadingBackupCodec.Failure.noRecords }
        guard case .data(let raw) = observed, persistedStateMatchesMemory(raw) else {
            suspendUnlessOwnHealthyEdit(since: generation)
            throw ReadingBackupCodec.Failure.changed
        }
        let data = try ReadingBackupCodec.encode(rawData: raw, createdAt: createdAt, appVersion: appVersion)
        let current = observedReadingIdentity()
        guard generation == mutationGeneration, current == observed, current == expectedReadingIdentity else {
            suspendUnlessOwnHealthyEdit(since: generation)
            throw ReadingBackupCodec.Failure.changed
        }
        return data
    }

    private func observedReadingIdentity() -> ReadingPersistenceIdentity {
        guard defaults.object(forKey: key) != nil else { return .absent }
        guard let data = defaults.data(forKey: key) else { return .unsupported }
        return .data(data)
    }
    private var stateIsEmpty: Bool {
        !state.needsRecovery && state.bookmarks.isEmpty && state.positions.isEmpty && state.lastArticleID == nil
    }
    private func persistedStateMatchesMemory(_ data: Data) -> Bool {
        guard data.count <= Self.maximumRecoveryBytes,
              let saved = try? JSONDecoder().decode(State.self, from: data),
              !saved.needsRecovery, !state.needsRecovery else { return false }
        return saved.bookmarks == state.bookmarks && saved.positions == state.positions &&
               saved.lastArticleID == state.lastArticleID
    }
    private func suspendUnlessOwnHealthyEdit(since generation: UInt64) {
        // A serialized own edit may have completed inside a provider/test callback.
        // Refresh once, and accept it only if both the strict raw and live state agree.
        if generation != mutationGeneration {
            let refreshedGeneration = mutationGeneration
            let refreshed = observedReadingIdentity()
            if case .data(let raw) = refreshed, refreshed == expectedReadingIdentity,
               (try? ReadingBackupCodec.validateRaw(raw)) != nil, persistedStateMatchesMemory(raw),
               refreshedGeneration == mutationGeneration { return }
        }
        readingSaveSuspended = true
    }

    /// Preserve the source before replacing it with readable records and live edits.
    /// A failed backup, existing backup, or changed source never overwrites the main key.
    @discardableResult
    func recoverReadableState() -> Bool {
        guard !readingSaveSuspended else { return false }
        guard recoveryIssue?.canRecover == true, let original = originalForRecovery else { return false }
        mutationGeneration &+= 1
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
        expectedReadingIdentity = .data(data)
        defaults.set(data, forKey: key)
        guard defaults.data(forKey: key) == data else { recoveryIssue = .writeFailed; return false }
        state.needsRecovery = false
        originalForRecovery = nil
        recoveryIssue = nil
        return true
    }

    func toggleBookmark(_ id: String) {
        guard !readingSaveSuspended else { return }
        mutationGeneration &+= 1
        if !state.bookmarks.insert(id).inserted { state.bookmarks.remove(id) }
        save()
    }

    func markOpened(_ articleID: String) {
        guard !readingSaveSuspended, state.lastArticleID != articleID else { return }
        mutationGeneration &+= 1
        state.lastArticleID = articleID
        save()
    }

    func record(articleID: String, heading: String?, fraction: Double, blockID: String? = nil,
                anchor: NativeReadingAnchor? = nil) {
        guard !readingSaveSuspended, fraction.isFinite else { return }
        mutationGeneration &+= 1
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
        guard recoveryIssue == nil, !readingSaveSuspended else { return }
        if let data = try? JSONEncoder().encode(state) {
            expectedReadingIdentity = .data(data)
            defaults.set(data, forKey: key)
        }
    }
}
