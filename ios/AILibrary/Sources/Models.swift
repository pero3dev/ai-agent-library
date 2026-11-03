import Foundation

// JSON keeps the exporter's snake_case keys so the format is shared with the website build.
struct ContentManifest: Codable, Sendable {
    let schema_version: Int
    let revision: String
    let articles: [LibraryArticle]
    let audio: [AudioEpisode]
    let files: [String: String]

    var containsTestFixtures: Bool { articles.contains(where: \.isTestFixture) }
}

struct LibraryArticle: Codable, Hashable, Identifiable, Sendable {
    let id: String
    let title: String
    let summary: String
    let category: String
    let level: String
    let last_updated: String
    let source_path: String
    let source_sha256: String
    let document_path: String?
    let html_path: String?
    let search_text: String
    let headings: [ArticleHeading]
    let audio_id: String?
    let is_test_fixture: Bool?

    var isTestFixture: Bool {
        is_test_fixture == true || id == "test-fixtures/native-reader" || source_path == "ios/fixtures/native-reader.md"
    }

    init(id: String, title: String, summary: String, category: String, level: String, last_updated: String,
         source_path: String, source_sha256: String, document_path: String? = nil, html_path: String? = nil,
         search_text: String, headings: [ArticleHeading], audio_id: String?, is_test_fixture: Bool? = nil) {
        self.id = id; self.title = title; self.summary = summary; self.category = category; self.level = level
        self.last_updated = last_updated; self.source_path = source_path; self.source_sha256 = source_sha256
        self.document_path = document_path; self.html_path = html_path; self.search_text = search_text
        self.headings = headings; self.audio_id = audio_id
        self.is_test_fixture = is_test_fixture
    }
}

struct ArticleHeading: Codable, Hashable, Identifiable, Sendable {
    let id: String
    let title: String
    let level: Int
}

/// Navigation-only context. Search terms are not part of a saved reading record.
struct ReaderRoute: Hashable, Sendable {
    let articleID: String
    var heading: String? = nil
    var searchQuery: String? = nil
}

struct AudioEpisode: Codable, Hashable, Identifiable, Sendable {
    let id: String
    let title: String
    let article_id: String
    let url: String
    let duration_seconds: Double
    let sha256: String
    let credit: String
    let license_url: String
    let source_digest: String
    let source_is_current: Bool
    let chapters: [AudioChapter]
}

struct AudioChapter: Codable, Hashable, Identifiable, Sendable {
    let id: String
    let title: String
    let start_seconds: Double
}

enum AudioTime {
    // The package contract supports episodes up to 24 hours. Keep conversion
    // bounded even when a value comes from saved state or AVFoundation.
    static let maximumDurationSeconds: Double = 24 * 60 * 60

    static func displaySeconds(_ seconds: Double) -> Int {
        guard seconds.isFinite, seconds > 0 else { return 0 }
        return Int(min(seconds, maximumDurationSeconds))
    }
}

struct ContentSnapshot: Sendable {
    let root: URL
    let manifest: ContentManifest
    private let generationLease: ContentSnapshotLease?

    init(root: URL, manifest: ContentManifest) {
        self.init(root: root, manifest: manifest, generationLease: nil)
    }

    private init(root: URL, manifest: ContentManifest, generationLease: ContentSnapshotLease?) {
        self.root = root
        self.manifest = manifest
        self.generationLease = generationLease
    }

    func retainingGenerationLease(_ lease: ContentSnapshotLease) -> ContentSnapshot {
        ContentSnapshot(root: root, manifest: manifest, generationLease: lease)
    }

    var readAccessRoot: URL {
        let directory = root.standardizedFileURL.resolvingSymlinksInPath().standardizedFileURL
        return URL(fileURLWithPath: directory.path, isDirectory: true)
    }

    func article(id: String) -> LibraryArticle? {
        manifest.articles.first { $0.id == id }
    }

    func episode(for article: LibraryArticle) -> AudioEpisode? {
        manifest.audio.first { $0.id == article.audio_id }
    }

    func document(for article: LibraryArticle) throws -> NativeDocument {
        guard manifest.schema_version == 2, self.article(id: article.id) == article else {
            throw ContentError.invalid("記事の参照先が無効です。")
        }
        return try withExtendedLifetime(generationLease) {
            try NativeDocumentValidator.load(article: article, manifest: manifest, root: root)
        }
    }
}

enum LibrarySearch {
    static func normalize(_ text: String) -> String {
        let folded = text.folding(options: [.caseInsensitive, .widthInsensitive, .diacriticInsensitive],
                                  locale: Locale(identifier: "ja_JP"))
        return folded.applyingTransform(.hiraganaToKatakana, reverse: false) ?? folded
    }

    static func matches(_ article: LibraryArticle, query: String) -> Bool {
        matches(article, terms: normalizedTerms(query))
    }

    static func matches(_ article: LibraryArticle, terms: [String]) -> Bool {
        guard !terms.isEmpty else { return true }
        let text = normalizedText(for: article)
        return terms.allSatisfy { text.contains($0) }
    }

    static func normalizedText(for article: LibraryArticle) -> String {
        normalize([article.title, article.summary, article.category, article.search_text].joined(separator: " "))
    }

    static func normalizedTerms(_ query: String) -> [String] {
        var seen = Set<String>()
        return normalize(query).split(whereSeparator: { $0.isWhitespace }).map(String.init)
            .filter { seen.insert($0).inserted }
    }
}

/// Immutable normalized text for one loaded article set. Construct this with its
/// snapshot off the main actor, then replace both together when content changes.
struct LibrarySearchIndex: Sendable {
    private struct Entry: Sendable {
        let article: LibraryArticle
        let text: String
    }
    private let entries: [String: Entry]

    init(articles: [LibraryArticle]) {
        var entries: [String: Entry] = [:]
        for article in articles {
            entries[article.id] = Entry(article: article, text: LibrarySearch.normalizedText(for: article))
        }
        self.entries = entries
    }

    func matches(_ article: LibraryArticle, terms: [String]) -> Bool {
        guard !terms.isEmpty else { return true }
        // IDs can survive content revisions. A caller with another snapshot or
        // a partial index must get the current article's uncached result.
        guard let entry = entries[article.id], entry.article == article else {
            return LibrarySearch.matches(article, terms: terms)
        }
        return terms.allSatisfy { entry.text.contains($0) }
    }
}

/// Transient list conditions. Apply these to the store's visible article scope,
/// so the normal library and the separate reader-test library stay isolated.
struct LibraryArticleFilter: Equatable, Sendable {
    var query = ""
    var category: String?
    var level: String?
    var bookmarksOnly = false
    var tag: String?

    var isActive: Bool {
        category != nil || level != nil || tag != nil || bookmarksOnly || !LibrarySearch.normalizedTerms(query).isEmpty
    }

    func articles(in articles: [LibraryArticle], bookmarks: Set<String>, articleTags: [String: [String]] = [:],
                  searchIndex: LibrarySearchIndex? = nil) -> [LibraryArticle] {
        let terms = LibrarySearch.normalizedTerms(query)
        return articles.filter { article in
            (category == nil || article.category == category) &&
            (level == nil || article.level == level) &&
            (tag.map { articleTags[article.id]?.contains($0) == true } ?? true) &&
            (!bookmarksOnly || bookmarks.contains(article.id)) &&
            (searchIndex?.matches(article, terms: terms) ?? LibrarySearch.matches(article, terms: terms))
        }
    }

    static func categories(in articles: [LibraryArticle]) -> [String] {
        Array(Set(articles.map(\.category))).sorted()
    }

    static func levels(in articles: [LibraryArticle]) -> [String] {
        Array(Set(articles.map(\.level))).sorted()
    }

    static func tags(in articles: [LibraryArticle], articleTags: [String: [String]]) -> [String] {
        Array(Set(articles.flatMap { articleTags[$0.id] ?? [] }.filter { !$0.isEmpty })).sorted()
    }

    mutating func reset() { self = Self() }
}

/// Apply a raw index order only within the caller's article scope. Unknown or
/// repeated IDs cannot remove articles, and unlisted articles retain their order.
enum LibraryArticleOrder {
    static func ordered(_ articles: [LibraryArticle], articleIDs: [String]) -> [LibraryArticle] {
        let scope = Set(articles.map(\.id))
        var ranks: [String: Int] = [:]
        for id in articleIDs where scope.contains(id) && ranks[id] == nil { ranks[id] = ranks.count }
        return articles.enumerated().sorted { lhs, rhs in
            let left = ranks[lhs.element.id] ?? Int.max
            let right = ranks[rhs.element.id] ?? Int.max
            return left == right ? lhs.offset < rhs.offset : left < right
        }.map(\.element)
    }
}

/// One owned-generation acquisition, shared by every copy of its snapshot. This
/// process-local ledger is advisory: zero is not permission to remove a package.
/// Storage URLs are lexical scopes, not filesystem identities or alias checks.
final class ContentSnapshotLease: @unchecked Sendable {
    private struct Key: Hashable, Sendable {
        let scope: String
        let generation: UUID
    }

    private final class Ledger: @unchecked Sendable {
        private let lock = NSLock()
        private var counts: [Key: Int] = [:]

        func acquire(_ key: Key) {
            lock.lock()
            defer { lock.unlock() }
            counts[key, default: 0] += 1
        }

        func release(_ key: Key) {
            lock.lock()
            defer { lock.unlock() }
            if let count = counts[key], count > 1 { counts[key] = count - 1 }
            else { counts.removeValue(forKey: key) }
        }

        func acquisitions(in scope: String) -> [UUID: Int] {
            lock.lock()
            defer { lock.unlock() }
            var result: [UUID: Int] = [:]
            for (key, count) in counts where key.scope == scope { result[key.generation] = count }
            return result
        }
    }

    // A single ledger avoids a registry of weak coordinators whose dead URL keys
    // could accumulate. It stores only live keys, never repositories or tokens.
    private static let sharedLedger = Ledger()
    private let key: Key
    private let ledger: Ledger

    private init(key: Key, ledger: Ledger) {
        self.key = key
        self.ledger = ledger
        ledger.acquire(key)
    }

    deinit { ledger.release(key) }

    static func acquire(storageRoot: URL, generation: UUID) -> ContentSnapshotLease? {
        guard let scope = scope(storageRoot) else { return nil }
        return ContentSnapshotLease(key: Key(scope: scope, generation: generation), ledger: sharedLedger)
    }

    static func advisoryAcquisitions(in storageRoot: URL) -> [UUID: Int] {
        guard let scope = scope(storageRoot) else { return [:] }
        return sharedLedger.acquisitions(in: scope)
    }

    private static func scope(_ root: URL) -> String? {
        guard root.isFileURL, root.host == nil || root.host == "" || root.host == "localhost",
              root.user == nil, root.password == nil, root.port == nil, root.query == nil, root.fragment == nil else { return nil }
        var path = root.path
        while path.count > 1, path.hasSuffix("/") { path.removeLast() }
        let components = path.split(separator: "/", omittingEmptySubsequences: false)
        guard path.hasPrefix("/"), !components.contains("."), !components.contains(".."),
              !components.dropFirst().contains("") else { return nil }
        return path
    }
}
