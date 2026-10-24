import Foundation

/// Optional local metadata. Invalid or future versions are ignored independently
/// of the legacy position and the other articles' records.
struct NativeReadingAnchor: Codable, Equatable, Sendable {
    let version: Int
    let documentDigest: String
    let blockFingerprint: String
    let headingFingerprint: String?

    init?(documentDigest: String, blockFingerprint: String, headingFingerprint: String? = nil) {
        guard ContentValidator.isDigest(documentDigest), ContentValidator.isDigest(blockFingerprint),
              headingFingerprint.map(ContentValidator.isDigest) ?? true else { return nil }
        version = 1
        self.documentDigest = documentDigest
        self.blockFingerprint = blockFingerprint
        self.headingFingerprint = headingFingerprint
    }

    private enum CodingKeys: String, CodingKey { case version, documentDigest, blockFingerprint, headingFingerprint }
    init(from decoder: Decoder) throws {
        let fields = try decoder.container(keyedBy: CodingKeys.self)
        let version = try fields.decode(Int.self, forKey: .version)
        let digest = try fields.decode(String.self, forKey: .documentDigest)
        let block = try fields.decode(String.self, forKey: .blockFingerprint)
        let heading = try fields.decodeIfPresent(String.self, forKey: .headingFingerprint)
        guard version == 1, let value = Self(documentDigest: digest, blockFingerprint: block,
                                             headingFingerprint: heading) else {
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

/// Only local reading records; no account, analytics or network synchronization.
final class ReadingStore {
    private struct State: Codable {
        var bookmarks: Set<String> = []
        var positions: [String: ReadingPosition] = [:]
        var lastArticleID: String?
        init() {}
        private enum CodingKeys: String, CodingKey { case bookmarks, positions, lastArticleID }
        init(from decoder: Decoder) throws {
            let fields = try decoder.container(keyedBy: CodingKeys.self)
            bookmarks = (try? fields.decodeIfPresent(Set<String>.self, forKey: .bookmarks)) ?? []
            positions = (try? fields.decodeIfPresent([String: ReadingPosition].self, forKey: .positions)) ?? [:]
            lastArticleID = try? fields.decodeIfPresent(String.self, forKey: .lastArticleID)
        }
    }
    private let defaults: UserDefaults
    private let key: String
    private var state: State
    var bookmarks: Set<String> { state.bookmarks }
    var lastArticleID: String? { state.lastArticleID }

    init(defaults: UserDefaults = .standard, key: String = "library.reading.v1") {
        self.defaults = defaults
        self.key = key
        state = defaults.data(forKey: key).flatMap { try? JSONDecoder().decode(State.self, from: $0) } ?? State()
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
            return ReadingPosition(heading: saved.heading, fraction: saved.fraction, anchor: saved.anchor)
        }
        let block = document.readingBlockID(for: saved, documentDigest: documentDigest)
        return ReadingPosition(heading: block.flatMap { document.headingID(forBlock: $0) } ?? saved.heading,
                               fraction: saved.fraction, blockID: block, anchor: saved.anchor)
    }

    private func save() {
        if let data = try? JSONEncoder().encode(state) { defaults.set(data, forKey: key) }
    }
}
