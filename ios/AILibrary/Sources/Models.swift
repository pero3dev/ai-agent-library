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
        return try NativeDocumentValidator.load(article: article, manifest: manifest, root: root)
    }
}

enum LibrarySearch {
    static func normalize(_ text: String) -> String {
        let folded = text.folding(options: [.caseInsensitive, .widthInsensitive, .diacriticInsensitive],
                                  locale: Locale(identifier: "ja_JP"))
        return folded.applyingTransform(.hiraganaToKatakana, reverse: false) ?? folded
    }

    static func matches(_ article: LibraryArticle, query: String) -> Bool {
        let terms = normalizedTerms(query)
        let text = normalize([article.title, article.summary, article.category, article.search_text].joined(separator: " "))
        return terms.allSatisfy { text.contains($0) }
    }

    static func normalizedTerms(_ query: String) -> [String] {
        var seen = Set<String>()
        return normalize(query).split(whereSeparator: { $0.isWhitespace }).map(String.init)
            .filter { seen.insert($0).inserted }
    }
}

/// Transient list conditions. Apply these to the store's visible article scope,
/// so the normal library and the separate reader-test library stay isolated.
struct LibraryArticleFilter: Equatable, Sendable {
    var query = ""
    var category: String?
    var level: String?
    var bookmarksOnly = false

    var isActive: Bool {
        category != nil || level != nil || bookmarksOnly || !LibrarySearch.normalizedTerms(query).isEmpty
    }

    func articles(in articles: [LibraryArticle], bookmarks: Set<String>) -> [LibraryArticle] {
        articles.filter { article in
            (category == nil || article.category == category) &&
            (level == nil || article.level == level) &&
            (!bookmarksOnly || bookmarks.contains(article.id)) &&
            LibrarySearch.matches(article, query: query)
        }
    }

    static func categories(in articles: [LibraryArticle]) -> [String] {
        Array(Set(articles.map(\.category))).sorted()
    }

    static func levels(in articles: [LibraryArticle]) -> [String] {
        Array(Set(articles.map(\.level))).sorted()
    }

    mutating func reset() { self = Self() }
}
