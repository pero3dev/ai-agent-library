import Foundation

struct ReadingPosition: Codable, Equatable, Sendable {
    let heading: String?
    let fraction: Double
    let blockID: String?

    init(heading: String?, fraction: Double, blockID: String? = nil) {
        self.heading = heading
        self.fraction = fraction.isFinite ? min(1, max(0, fraction)) : 0
        self.blockID = blockID
    }

    private enum CodingKeys: String, CodingKey { case heading, fraction, blockID }
    init(from decoder: Decoder) throws {
        let fields = try? decoder.container(keyedBy: CodingKeys.self)
        let heading = try? fields?.decodeIfPresent(String.self, forKey: .heading)
        let fraction = (try? fields?.decodeIfPresent(Double.self, forKey: .fraction)) ?? 0
        let block = try? fields?.decodeIfPresent(String.self, forKey: .blockID)
        self.init(heading: heading ?? nil, fraction: fraction, blockID: block ?? nil)
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

    func record(articleID: String, heading: String?, fraction: Double, blockID: String? = nil) {
        guard fraction.isFinite else { return }
        state.positions[articleID] = ReadingPosition(heading: heading, fraction: fraction, blockID: blockID)
        state.lastArticleID = articleID
        save()
    }

    func position(for article: LibraryArticle) -> ReadingPosition {
        guard let saved = state.positions[article.id] else { return ReadingPosition(heading: nil, fraction: 0) }
        let heading = article.headings.contains { $0.id == saved.heading } ? saved.heading : nil
        return ReadingPosition(heading: heading, fraction: saved.fraction, blockID: saved.blockID)
    }

    func position(for article: LibraryArticle, document: NativeDocument) -> ReadingPosition {
        let saved = position(for: article)
        guard document.article_id == article.id, !document.blocks.isEmpty else {
            return ReadingPosition(heading: saved.heading, fraction: saved.fraction)
        }
        let direct = saved.blockID.flatMap { document.topLevelBlockID(containing: $0) }
        let headingBlock = saved.heading.flatMap { document.topLevelBlockID(forHeading: $0) }
        let index = min(document.blocks.count - 1, Int(saved.fraction * Double(document.blocks.count - 1)))
        let block = direct ?? headingBlock ?? document.blocks[index].id
        return ReadingPosition(heading: document.headingID(forBlock: block) ?? saved.heading,
                               fraction: saved.fraction, blockID: block)
    }

    private func save() {
        if let data = try? JSONEncoder().encode(state) { defaults.set(data, forKey: key) }
    }
}
