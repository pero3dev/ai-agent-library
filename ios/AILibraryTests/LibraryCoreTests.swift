import AVFoundation
import CryptoKit
import Foundation
import XCTest
@testable import AILibrary

final class LibraryCoreTests: XCTestCase {
    private var directory: URL!

    override func setUpWithError() throws {
        directory = FileManager.default.temporaryDirectory.appendingPathComponent("library-core-test-" + UUID().uuidString)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    }

    override func tearDownWithError() throws { try FileManager.default.removeItem(at: directory) }

    private var pixel: Data { Data(base64Encoded: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJe8AAAAASUVORK5CYII=")! }
    private var image: NativeAsset { NativeAsset(light: "assets/pixel.png", dark: "assets/pixel.png", width: 1, height: 1, scale: 1, baseline: 0) }

    private func document() -> NativeDocument {
        NativeDocument(schema_version: 1, article_id: "example", source_sha256: String(repeating: "a", count: 64), blocks: [
            NativeBlock(id: "heading", type: "heading", heading_id: "intro", level: 2, inlines: [NativeInline(type: "text", text: "導入")]),
            NativeBlock(id: "paragraph", type: "paragraph", inlines: [NativeInline(type: "text", text: "本文")]),
            NativeBlock(id: "math", type: "math", asset: image, source: "x", accessibility_text: "エックス")])
    }

    private func fixture(_ name: String, revision: String = "v1", document: NativeDocument? = nil,
                         isTestFixture: Bool? = nil) throws -> URL {
        let root = directory.appendingPathComponent(name)
        try FileManager.default.createDirectory(at: root.appendingPathComponent("articles"), withIntermediateDirectories: true)
        try FileManager.default.createDirectory(at: root.appendingPathComponent("assets"), withIntermediateDirectories: true)
        let data = try JSONEncoder().encode(document ?? self.document())
        try data.write(to: root.appendingPathComponent("articles/example.json"))
        try pixel.write(to: root.appendingPathComponent("assets/pixel.png"))
        let files = ["articles/example.json": SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined(),
                     "assets/pixel.png": SHA256.hash(data: pixel).map { String(format: "%02x", $0) }.joined()]
        let manifest = ContentManifest(schema_version: 2, revision: revision,
            articles: [article(isTestFixture: isTestFixture)], audio: [], files: files)
        try JSONEncoder().encode(manifest).write(to: root.appendingPathComponent("manifest.json"))
        return root
    }

    private func article(id: String = "example", category: String = "基礎", level: String = "beginner",
                         searchText: String = "Tools API えーじぇんと", isTestFixture: Bool? = nil) -> LibraryArticle {
        LibraryArticle(id: id, title: "ＡＩ エージェント", summary: "日本語の学習", category: category, level: level, last_updated: "2026-10-22",
                       source_path: "docs/example.md", source_sha256: String(repeating: "a", count: 64), document_path: "articles/example.json", search_text: searchText,
                       headings: [ArticleHeading(id: "intro", title: "導入", level: 2)], audio_id: nil, is_test_fixture: isTestFixture)
    }

    private var futureSchemaCases: [(name: String, manifest: Int, document: Int)] {
        [(name: "manifest", manifest: 3, document: 1), (name: "document", manifest: 2, document: 2)]
    }

    private func futurePackage(_ name: String, manifestSchema: Int, documentSchema: Int) throws -> URL {
        let originalDocument = document()
        let futureDocument = NativeDocument(schema_version: documentSchema, article_id: originalDocument.article_id,
            source_sha256: originalDocument.source_sha256, blocks: originalDocument.blocks)
        let root = try fixture(name, revision: "future", document: futureDocument)
        let manifestURL = root.appendingPathComponent("manifest.json")
        let originalManifest = try JSONDecoder().decode(ContentManifest.self, from: Data(contentsOf: manifestURL))
        try JSONEncoder().encode(ContentManifest(schema_version: manifestSchema, revision: originalManifest.revision,
            articles: originalManifest.articles, audio: originalManifest.audio, files: originalManifest.files)).write(to: manifestURL)
        // Only schema compatibility is invalid; the document binding and all file hashes remain valid.
        XCTAssertEqual(try ContentValidator.sha256(at: root.appendingPathComponent("articles/example.json")),
                       originalManifest.files["articles/example.json"])
        return root
    }

    private func readerTestPackage(_ name: String) throws -> URL {
        let root = try fixture(name)
        let original = try ContentValidator.validate(root: root).manifest
        let testArticle = LibraryArticle(id: "test-fixtures/native-reader", title: "本文表示テスト", summary: "表示確認用の記事", category: "テスト", level: "beginner",
            last_updated: "2026-10-25", source_path: "ios/fixtures/native-reader.md", source_sha256: article().source_sha256,
            document_path: "articles/native-reader-test.json", search_text: "テスト", headings: [ArticleHeading(id: "intro", title: "テスト", level: 2)],
            audio_id: nil, is_test_fixture: true)
        let document = NativeDocument(schema_version: 1, article_id: testArticle.id, source_sha256: testArticle.source_sha256, blocks: [
            NativeBlock(id: "test-heading", type: "heading", heading_id: "intro", level: 2, inlines: [NativeInline(type: "text", text: "テスト")]),
            NativeBlock(id: "test-link", type: "paragraph", inlines: [NativeInline(type: "link", children: [NativeInline(type: "text", text: "通常記事の見出し")],
                target: NativeLink(kind: "article", article_id: "example", heading_id: "intro"))])])
        let data = try JSONEncoder().encode(document)
        try data.write(to: root.appendingPathComponent("articles/native-reader-test.json"))
        var files = original.files
        files["articles/native-reader-test.json"] = SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
        try JSONEncoder().encode(ContentManifest(schema_version: 2, revision: "reader-test", articles: original.articles + [testArticle],
                                                 audio: [], files: files)).write(to: root.appendingPathComponent("manifest.json"))
        return root
    }

    private func replaceFile(_ root: URL, path: String, data: Data) throws {
        let manifest = try JSONDecoder().decode(ContentManifest.self, from: Data(contentsOf: root.appendingPathComponent("manifest.json")))
        try data.write(to: root.appendingPathComponent(path))
        var files = manifest.files
        files[path] = SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
        try JSONEncoder().encode(ContentManifest(schema_version: manifest.schema_version, revision: manifest.revision,
            articles: manifest.articles, audio: manifest.audio, files: files)).write(to: root.appendingPathComponent("manifest.json"))
    }

    func testSearchNormalizesWidthCaseKanaAndMultipleTerms() {
        XCTAssertTrue(LibrarySearch.matches(article(), query: "ai API"))
        XCTAssertTrue(LibrarySearch.matches(article(), query: "ｴｰｼﾞｪﾝﾄ"))
        XCTAssertTrue(LibrarySearch.matches(article(), query: "エージェント tools"))
        XCTAssertFalse(LibrarySearch.matches(article(), query: "tools unknown"))
    }

    func testArticleFilterCombinesCategoryLevelSearchAndBookmarks() {
        let articles = [article(id: "match", category: "concepts", level: "basic"),
                        article(id: "other-level", category: "concepts", level: "advanced"),
                        article(id: "other-category", category: "foundations", level: "basic"),
                        article(id: "other-text", category: "concepts", level: "basic", searchText: "別の本文"),
                        article(id: "not-bookmarked", category: "concepts", level: "basic")]
        let bookmarks: Set<String> = ["match", "other-level", "other-category", "other-text"]
        let filter = LibraryArticleFilter(query: "ＴＯＯＬＳ api", category: "concepts", level: "basic", bookmarksOnly: true)
        XCTAssertEqual(filter.articles(in: articles, bookmarks: bookmarks).map(\.id), ["match"])

        var changed = filter
        changed.bookmarksOnly = false
        XCTAssertEqual(changed.articles(in: articles, bookmarks: bookmarks).map(\.id), ["match", "not-bookmarked"])
        changed = filter
        changed.category = nil
        XCTAssertEqual(changed.articles(in: articles, bookmarks: bookmarks).map(\.id), ["match", "other-category"])
        changed = filter
        changed.level = nil
        XCTAssertEqual(changed.articles(in: articles, bookmarks: bookmarks).map(\.id), ["match", "other-level"])
        changed = filter
        changed.query = ""
        XCTAssertEqual(changed.articles(in: articles, bookmarks: bookmarks).map(\.id), ["match", "other-text"])
    }

    func testArticleFilterResetRestoresOrderAfterNoResults() {
        let articles = [article(id: "second"), article(id: "first", category: "concepts", level: "expert")]
        var filter = LibraryArticleFilter(query: "unmatched", category: "removed", level: "advanced", bookmarksOnly: true)
        XCTAssertTrue(filter.isActive)
        XCTAssertTrue(filter.articles(in: articles, bookmarks: ["first"]).isEmpty)
        filter.reset()
        XCTAssertFalse(filter.isActive)
        XCTAssertNil(filter.category)
        XCTAssertNil(filter.level)
        XCTAssertFalse(filter.bookmarksOnly)
        XCTAssertEqual(filter.query, "")
        XCTAssertEqual(filter.articles(in: articles, bookmarks: ["first"]).map(\.id), ["second", "first"])
        filter.query = " \t\n　"
        XCTAssertFalse(filter.isActive)
        XCTAssertEqual(filter.articles(in: articles, bookmarks: []).map(\.id), ["second", "first"])
    }

    func testArticleFilterOptionsKeepUnknownValuesAndUseOnlySuppliedScope() {
        let normal = [article(id: "one", category: "concepts", level: "basic"),
                      article(id: "two", category: "foundations", level: "future-level"),
                      article(id: "three", category: "concepts", level: "basic")]
        let fixtureOnly = [article(id: "test-fixtures/native-reader", category: "テスト", level: "fixture-level", isTestFixture: true)]
        XCTAssertEqual(LibraryArticleFilter.categories(in: normal), ["concepts", "foundations"])
        XCTAssertEqual(LibraryArticleFilter.levels(in: normal), ["basic", "future-level"])
        XCTAssertEqual(LibraryArticleFilter.categories(in: fixtureOnly), ["テスト"])
        XCTAssertEqual(LibraryArticleFilter.levels(in: fixtureOnly), ["fixture-level"])
        XCTAssertEqual(LibraryArticleFilter(level: "future-level").articles(in: normal, bookmarks: []).map(\.id), ["two"])
        XCTAssertTrue(LibraryArticleFilter(category: "テスト").articles(in: normal, bookmarks: []).isEmpty)
        XCTAssertTrue(LibraryArticleFilter.categories(in: []).isEmpty)
        XCTAssertTrue(LibraryArticleFilter.levels(in: []).isEmpty)
    }

    private func searchDocument() -> NativeDocument {
        let text: (String) -> NativeInline = { NativeInline(type: "text", text: $0) }
        return NativeDocument(schema_version: 1, article_id: "example", source_sha256: article().source_sha256, blocks: [
            NativeBlock(id: "search-intro", type: "heading", heading_id: "intro", level: 2, inlines: [text("第一章")]),
            NativeBlock(id: "partial", type: "paragraph", inlines: [text("Alpha Alpha Alpha")]),
            NativeBlock(id: "styled", type: "paragraph", inlines: [text("ＡＩ soft"),
                NativeInline(type: "strong", children: [text("max")]),
                NativeInline(type: "emphasis", children: [text(" えーじぇんと ")]),
                NativeInline(type: "code", text: "cafe\u{301}"),
                NativeInline(type: "link", children: [text(" LinkLabel")],
                    target: NativeLink(kind: "external", url: "https://example.com/only-url-secret"))]),
            NativeBlock(id: "breaks", type: "paragraph", inlines: [text("before"), NativeInline(type: "soft_break"),
                text("after"), NativeInline(type: "hard_break"), text("next")]),
            NativeBlock(id: "list-container", type: "list", ordered: true, start: 8, items: [
                NativeListItem(id: "parent-item", blocks: [
                    NativeBlock(id: "parent-text", type: "paragraph", inlines: [text("Parentword")]),
                    NativeBlock(id: "nested-quote", type: "quote", blocks: [
                        NativeBlock(id: "nested-hit", type: "paragraph", inlines: [text("Needle Agent")])]),
                    NativeBlock(id: "nested-list", type: "list", ordered: false, start: 1, items: [
                        NativeListItem(id: "grandchild-item", blocks: [
                            NativeBlock(id: "grandchild-hit", type: "paragraph", inlines: [text("孫のTarget")])])])])]),
            NativeBlock(id: "details-heading", type: "heading", heading_id: "details", level: 2, inlines: [text("詳細節")]),
            NativeBlock(id: "quote-container", type: "quote", blocks: [
                NativeBlock(id: "quote-hit", type: "paragraph", inlines: [text("Quote distinct")])]),
            NativeBlock(id: "code-hit", type: "code", language: "python", text: "  MAX_STEPS = 20\n\tprint('done')\n"),
            NativeBlock(id: "table-hit", type: "table", table: NativeTable(header: [[text("Left")], [text("Right")]],
                rows: [[[text("CellValue")], [NativeInline(type: "math", asset: image, source: "x^{2}", accessibility_text: "分数の見本")]]],
                alignments: ["left", "right"])),
            NativeBlock(id: "diagram-hit", type: "diagram", asset: image,
                source: "graph TD; A-->FLOW_TARGET", accessibility_text: "図の流れ"),
            NativeBlock(id: "math-hit", type: "math", asset: image,
                source: "\\frac{QK^{\\top}}{\\sqrt{d_k}}", accessibility_text: "クエリの二乗"),
            NativeBlock(id: "all-terms", type: "paragraph", inlines: [text("alpha beta")])])
    }

    func testNormalizedSearchTermsAndNavigationDefaults() {
        XCTAssertEqual(LibrarySearch.normalizedTerms(" ＡＰＩ\tAPI\nCAFÉ cafe\u{301} "), ["api", "cafe"])
        XCTAssertTrue(LibrarySearch.normalizedTerms(" \n\t　").isEmpty)
        XCTAssertTrue(LibrarySearch.matches(article(), query: ""))
        XCTAssertTrue(LibrarySearch.matches(article(), query: "TOOLS tools ＡＰＩ"))
        let normal = ReaderRoute(articleID: "example")
        XCTAssertNil(normal.heading)
        XCTAssertNil(normal.searchQuery)
        XCTAssertNotEqual(normal, ReaderRoute(articleID: "example", searchQuery: "tools"))
        XCTAssertEqual(ReaderRoute(articleID: "example", heading: "intro").heading, "intro")
    }

    func testNativeSearchPrefersAllTermsAndDocumentOrderRatherThanOccurrences() {
        let document = searchDocument()
        XCTAssertEqual(document.searchHit(query: "ALPHA alpha beta")?.blockID, "all-terms")
        let distributed = NativeDocument(schema_version: 1, article_id: "example", source_sha256: article().source_sha256,
            blocks: [NativeBlock(id: "first", type: "paragraph", inlines: [NativeInline(type: "text", text: "alpha alpha alpha")]),
                     NativeBlock(id: "second", type: "paragraph", inlines: [NativeInline(type: "text", text: "beta")])])
        XCTAssertEqual(distributed.searchHit(query: "alpha beta")?.blockID, "first")
        XCTAssertNil(distributed.searchHit(query: "alpha beta")?.headingID)
        let tie = NativeDocument(schema_version: 1, article_id: "example", source_sha256: article().source_sha256,
            blocks: [NativeBlock(id: "first", type: "paragraph", inlines: [NativeInline(type: "text", text: "tie")]),
                     NativeBlock(id: "second", type: "paragraph", inlines: [NativeInline(type: "text", text: "tie")])])
        XCTAssertEqual(tie.searchHit(query: "tie")?.blockID, "first")
    }

    func testNativeSearchPreservesNestedTargetsStylesAndStructuredText() {
        let document = searchDocument()
        for query in ["softmax", "ＡＩ ｴｰｼﾞｪﾝﾄ", "cafe", "LinkLabel"] {
            XCTAssertEqual(document.searchHit(query: query)?.blockID, "styled", query)
        }
        XCTAssertEqual(document.searchHit(query: "before after next")?.blockID, "breaks")
        XCTAssertNil(document.searchHit(query: "beforeafter"))
        XCTAssertNil(document.searchHit(query: "only-url-secret"))
        XCTAssertEqual(document.searchHit(query: "Parentword Needle Agent"),
                       NativeSearchHit(blockID: "nested-hit", containerBlockID: "list-container", headingID: "intro"))
        XCTAssertEqual(document.searchHit(query: "孫のtarget"),
                       NativeSearchHit(blockID: "grandchild-hit", containerBlockID: "list-container", headingID: "intro"))
        XCTAssertEqual(document.searchHit(query: "Quote distinct"),
                       NativeSearchHit(blockID: "quote-hit", containerBlockID: "quote-container", headingID: "details"))
        for (query, expected) in [("MAX_STEPS", "code-hit"), ("Left 分数", "table-hit"), ("x^{2}", "table-hit"),
                                  ("FLOW_TARGET", "diagram-hit"), ("図の流れ", "diagram-hit"),
                                  ("d_k", "math-hit"), ("クエリ", "math-hit"), ("詳細節", "details-heading")] {
            XCTAssertEqual(document.searchHit(query: query)?.blockID, expected, query)
        }
        XCTAssertNil(document.searchHit(query: "LeftRight"), "Adjacent table cells must not form a word")
    }

    func testNativeSearchReturnsNoBodyTargetForEmptyOrMetadataOnlyMatches() {
        let document = searchDocument()
        for query in ["", " \t\n　", "not-in-document"] { XCTAssertNil(document.searchHit(query: query)) }
        XCTAssertTrue(LibrarySearch.matches(article(), query: "基礎"))
        XCTAssertNil(document.searchHit(query: "基礎"))
        let empty = NativeDocument(schema_version: 1, article_id: "example", source_sha256: article().source_sha256, blocks: [])
        XCTAssertNil(empty.searchHit(query: "anything"))
    }

    func testAudioDisplayBoundsBeforeIntegerConversion() {
        XCTAssertEqual(AudioTime.maximumDurationSeconds, 86_400)
        for value in [Double.nan, Double.infinity, -Double.infinity, -Double.greatestFiniteMagnitude, -1, 0] {
            XCTAssertEqual(AudioTime.displaySeconds(value), 0)
        }
        XCTAssertEqual(AudioTime.displaySeconds(61.9), 61)
        XCTAssertEqual(AudioTime.displaySeconds(86_399.9), 86_399)
        for value in [86_400.0, 86_400.0.nextUp, 1e300, Double.greatestFiniteMagnitude] {
            XCTAssertEqual(AudioTime.displaySeconds(value), 86_400)
        }
    }

    func testAudioDurationAndChapterLimitsRejectInvalidUpdates() throws {
        let root = try fixture("audio-time")
        let original = try JSONDecoder().decode(ContentManifest.self, from: Data(contentsOf: root.appendingPathComponent("manifest.json")))
        func write(duration: Double, starts: [Double] = [0]) throws {
            let episode = AudioEpisode(id: "audio-time", title: "時間境界", article_id: "example",
                url: "https://example.com/audio.mp3", duration_seconds: duration,
                sha256: String(repeating: "a", count: 64), credit: "test", license_url: "https://example.com/license",
                source_digest: String(repeating: "a", count: 64), source_is_current: true,
                chapters: starts.enumerated().map { AudioChapter(id: "chapter-\($0.offset)", title: "章", start_seconds: $0.element) })
            try JSONEncoder().encode(ContentManifest(schema_version: original.schema_version, revision: original.revision,
                articles: original.articles, audio: [episode], files: original.files)).write(to: root.appendingPathComponent("manifest.json"))
        }
        for duration in [0.25, 86_400.0] {
            try write(duration: duration)
            XCTAssertEqual(try ContentValidator.validate(root: root).manifest.audio[0].duration_seconds, duration)
        }
        try write(duration: 86_400, starts: [0, 86_400.0.nextDown])
        let repository = ContentRepository(bundledRoot: root, storageRoot: directory.appendingPathComponent("audio-time-storage"))
        _ = try repository.install(from: root)
        for duration in [0.0, -1, 86_400.0.nextUp, 1e300, Double.greatestFiniteMagnitude] {
            try write(duration: duration)
            XCTAssertThrowsError(try ContentValidator.validate(root: root))
            XCTAssertThrowsError(try repository.install(from: root))
            XCTAssertEqual(try repository.load().manifest.audio[0].duration_seconds, 86_400)
        }
        for start in [-0.1, 86_400.0, 1e300] {
            try write(duration: 86_400, starts: [start])
            XCTAssertThrowsError(try ContentValidator.validate(root: root))
        }
    }

    func testFixtureMetadataIsOptionalAndReservedIdentityRemainsTestOnly() throws {
        let original = try JSONEncoder().encode(article())
        XCTAssertNil(try JSONDecoder().decode(LibraryArticle.self, from: original).is_test_fixture)
        XCTAssertFalse(article().isTestFixture)
        XCTAssertTrue(article(isTestFixture: true).isTestFixture)
        var fields = try JSONSerialization.jsonObject(with: original) as! [String: Any]
        fields["id"] = "test-fixtures/native-reader"
        XCTAssertTrue(try JSONDecoder().decode(LibraryArticle.self, from: JSONSerialization.data(withJSONObject: fields)).isTestFixture)
        fields["id"] = "example"
        fields["source_path"] = "ios/fixtures/native-reader.md"
        XCTAssertTrue(try JSONDecoder().decode(LibraryArticle.self, from: JSONSerialization.data(withJSONObject: fields)).isTestFixture)
        fields["is_test_fixture"] = "true"
        XCTAssertThrowsError(try JSONDecoder().decode(LibraryArticle.self, from: JSONSerialization.data(withJSONObject: fields)))
    }

    func testFixtureImportIsRejectedBeforeNormalContentChangesAndNormalLoadFallsBack() throws {
        let bundled = try fixture("fixture-normal")
        let update = try fixture("fixture-update", revision: "normal-v2")
        let testing = try readerTestPackage("fixture-testing")
        XCTAssertTrue(try ContentValidator.validate(root: testing).manifest.containsTestFixtures)
        let storage = directory.appendingPathComponent("fixture-normal-storage")
        let normal = ContentRepository(bundledRoot: bundled, storageRoot: storage)
        _ = try normal.install(from: update)
        let pointerURL = storage.appendingPathComponent("current.json")
        let pointer = try Data(contentsOf: pointerURL)
        XCTAssertThrowsError(try normal.install(from: testing))
        XCTAssertEqual(try Data(contentsOf: pointerURL), pointer)
        XCTAssertEqual(try normal.load().manifest.revision, "normal-v2")
        XCTAssertEqual(try FileManager.default.contentsOfDirectory(atPath: storage.appendingPathComponent("versions").path).count, 1)
        let testStorage = directory.appendingPathComponent("fixture-test-storage")
        let testRepository = ContentRepository(bundledRoot: testing, storageRoot: testStorage, allowsTestFixtures: true)
        let installed = try testRepository.install(from: testing)
        XCTAssertEqual(installed.manifest.articles.count, 2)
        XCTAssertEqual(try testRepository.load().manifest.revision, "reader-test")
        XCTAssertEqual(try Data(contentsOf: pointerURL), pointer)
        XCTAssertEqual(try ContentRepository(bundledRoot: bundled, storageRoot: testStorage).load().manifest.revision, "v1")
        XCTAssertTrue(FileManager.default.fileExists(atPath: installed.root.path))
        XCTAssertThrowsError(try ContentRepository(bundledRoot: testing, storageRoot: directory.appendingPathComponent("fixture-unused")).load())
    }

    @MainActor
    func testReaderTestLibraryKeepsCrossLinkTargetsAndSeparateReadingState() async throws {
        let bundled = try fixture("store-normal")
        let testing = try readerTestPackage("store-testing")
        let normalSuite = "ailibrary-fixture-normal-" + UUID().uuidString
        let testSuite = "ailibrary-fixture-test-" + UUID().uuidString
        let normalDefaults = try XCTUnwrap(UserDefaults(suiteName: normalSuite))
        let testDefaults = try XCTUnwrap(UserDefaults(suiteName: testSuite))
        defer {
            normalDefaults.removePersistentDomain(forName: normalSuite)
            testDefaults.removePersistentDomain(forName: testSuite)
        }
        let normalReading = ReadingStore(defaults: normalDefaults)
        normalReading.toggleBookmark("example")
        normalReading.record(articleID: "example", heading: "intro", fraction: 0.2)
        normalDefaults.set(55.0, forKey: "ios.audio.example.position")
        let records = normalDefaults.data(forKey: "library.reading.v1")
        let normal = LibraryStore(reading: normalReading, bundledRoot: bundled,
                                  storageRoot: directory.appendingPathComponent("store-normal-storage"))
        let testingStore = LibraryStore(reading: ReadingStore(defaults: testDefaults), bundledRoot: testing, isTestLibrary: true,
                                        storageRoot: directory.appendingPathComponent("store-test-storage"))
        await normal.load()
        await testingStore.load()
        XCTAssertEqual(normal.listedArticles.map(\.id), ["example"])
        XCTAssertEqual(testingStore.listedArticles.map(\.id), ["test-fixtures/native-reader"])
        let snapshot = try XCTUnwrap(testingStore.snapshot)
        let testArticle = try XCTUnwrap(snapshot.article(id: "test-fixtures/native-reader"))
        XCTAssertNotNil(snapshot.article(id: "example"))
        XCTAssertEqual(try snapshot.document(for: testArticle).allBlocks.count, 2)
        XCTAssertFalse(testingStore.allowsAudioPlayback)
        XCTAssertFalse(testingStore.allowsContentImport)
        XCTAssertTrue(normal.allowsAudioPlayback)
        testingStore.toggleBookmark(testArticle.id)
        testingStore.record(articleID: "example", heading: "intro", fraction: 0.8)
        XCTAssertEqual(ReadingStore(defaults: testDefaults).position(for: article()).fraction, 0.8)
        XCTAssertEqual(normalDefaults.data(forKey: "library.reading.v1"), records)
        XCTAssertEqual(normalDefaults.double(forKey: "ios.audio.example.position"), 55)
        await testingStore.install(from: bundled)
        XCTAssertEqual(testingStore.snapshot?.manifest.revision, "reader-test")
        await normal.install(from: testing)
        XCTAssertEqual(normal.snapshot?.manifest.revision, "v1")
        XCTAssertNotNil(normal.message)
        XCTAssertEqual(normalDefaults.data(forKey: "library.reading.v1"), records)
    }

    func testNativeDocumentRoundTripAndContractRejection() throws {
        let root = try fixture("native")
        let snapshot = try ContentValidator.validate(root: root)
        XCTAssertEqual(try snapshot.document(for: article()), document())
        XCTAssertEqual(document().topLevelBlockID(forHeading: "intro"), "heading")
        let heading = document().blocks[0]
        for block in [NativeBlock(id: "bad", type: "html"), NativeBlock(id: "bad", type: "paragraph"),
                      NativeBlock(id: "heading", type: "thematic_break"),
                      NativeBlock(id: "bad", type: "paragraph", inlines: [NativeInline(type: "unknown")]),
                      NativeBlock(id: "bad", type: "paragraph", inlines: [NativeInline(type: "link", children: [NativeInline(type: "text", text: "x")], target: NativeLink(kind: "article", article_id: "example", heading_id: "missing"))]),
                      NativeBlock(id: "bad", type: "paragraph", inlines: [NativeInline(type: "link", children: [NativeInline(type: "text", text: "x")], target: NativeLink(kind: "external", url: "https://user:password@example.com"))]),
                      NativeBlock(id: "bad", type: "math", asset: NativeAsset(light: "../outside.png", dark: "../outside.png", width: 1, height: 1, scale: 1), source: "x", accessibility_text: "x"),
                      NativeBlock(id: "bad", type: "math", asset: NativeAsset(light: image.light, dark: image.dark, width: 100, height: 1, scale: 1), source: "x", accessibility_text: "x")] {
            let value = NativeDocument(schema_version: 1, article_id: "example", source_sha256: article().source_sha256, blocks: [heading, block])
            XCTAssertThrowsError(try NativeDocumentValidator.validate(value, article: article(), manifest: snapshot.manifest, root: root))
        }
        let wrongSource = NativeDocument(schema_version: 1, article_id: "example", source_sha256: String(repeating: "b", count: 64), blocks: document().blocks)
        XCTAssertThrowsError(try NativeDocumentValidator.validate(wrongSource, article: article(), manifest: snapshot.manifest, root: root))
        let wrongSchema = NativeDocument(schema_version: 2, article_id: "example", source_sha256: article().source_sha256, blocks: document().blocks)
        XCTAssertThrowsError(try NativeDocumentValidator.validate(wrongSchema, article: article(), manifest: snapshot.manifest, root: root))
        var deep = NativeBlock(id: "leaf", type: "paragraph", inlines: [NativeInline(type: "text", text: "x")])
        for index in 0...NativeDocumentValidator.maximumDepth { deep = NativeBlock(id: "quote-\(index)", type: "quote", blocks: [deep]) }
        let tooDeep = NativeDocument(schema_version: 1, article_id: "example", source_sha256: article().source_sha256, blocks: [heading, deep])
        XCTAssertThrowsError(try NativeDocumentValidator.validate(tooDeep, article: article(), manifest: snapshot.manifest, root: root))
    }

    func testRejectsTraversalAndHashMismatch() throws {
        for path in ["../file", "/file", "a//b", "a/./b", "a\\b", "a/%2e", "a:b"] { XCTAssertFalse(ContentValidator.isSafeRelativePath(path)) }
        XCTAssertTrue(ContentValidator.isSafeRelativePath("assets/図.svg"))
        let root = try fixture("valid")
        XCTAssertEqual(try ContentValidator.validate(root: root).manifest.revision, "v1")
        try Data("tampered".utf8).write(to: root.appendingPathComponent("articles/example.json"))
        XCTAssertThrowsError(try ContentValidator.validate(root: root))
    }

    func testMissingNativeFieldsAndOversizedPNGAreRejectedAfterValidHash() throws {
        let missing = try fixture("missing-field")
        var object = try JSONSerialization.jsonObject(with: JSONEncoder().encode(document())) as! [String: Any]
        object.removeValue(forKey: "blocks")
        try replaceFile(missing, path: "articles/example.json", data: JSONSerialization.data(withJSONObject: object))
        XCTAssertThrowsError(try ContentValidator.validate(root: missing))
        let oversized = try fixture("oversized-png")
        var bytes = [UInt8](pixel); bytes.replaceSubrange(16..<20, with: [0, 0, 32, 1]) // 8193px: one over the shared renderer limit.
        try replaceFile(oversized, path: "assets/pixel.png", data: Data(bytes))
        XCTAssertThrowsError(try ContentValidator.validate(root: oversized))
    }

    func testFutureSchemasRejectUpdatesAndPreserveCurrentVersionAndReadingRecords() throws {
        for scenario in futureSchemaCases {
            let bundled = try fixture("future-install-\(scenario.name)-bundle", revision: "bundled")
            let update = try fixture("future-install-\(scenario.name)-accepted", revision: "accepted")
            let future = try futurePackage("future-install-\(scenario.name)-source",
                manifestSchema: scenario.manifest, documentSchema: scenario.document)
            let storage = directory.appendingPathComponent("future-install-\(scenario.name)-storage")
            let repository = ContentRepository(bundledRoot: bundled, storageRoot: storage)
            let accepted = try repository.install(from: update)
            let pointerURL = storage.appendingPathComponent("current.json")
            let pointerBefore = try Data(contentsOf: pointerURL)
            let acceptedDocument = try Data(contentsOf: accepted.root.appendingPathComponent("articles/example.json"))
            let suite = "library-future-install-test-" + UUID().uuidString
            let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
            defer { defaults.removePersistentDomain(forName: suite) }
            let reading = ReadingStore(defaults: defaults)
            reading.toggleBookmark("example")
            reading.record(articleID: "example", heading: "intro", fraction: 0.42, blockID: "paragraph")
            let savedRecords = try XCTUnwrap(defaults.data(forKey: "library.reading.v1"))

            XCTAssertThrowsError(try ContentValidator.validate(root: future), scenario.name)
            XCTAssertThrowsError(try repository.install(from: future), scenario.name)
            XCTAssertEqual(try repository.load().manifest.revision, "accepted", scenario.name)
            XCTAssertEqual(try Data(contentsOf: pointerURL), pointerBefore, scenario.name)
            XCTAssertEqual(try Data(contentsOf: accepted.root.appendingPathComponent("articles/example.json")), acceptedDocument)
            XCTAssertEqual(try FileManager.default.contentsOfDirectory(atPath: storage.appendingPathComponent("versions").path).count, 1)
            XCTAssertTrue(FileManager.default.fileExists(atPath: future.path))
            XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), savedRecords)
            let restored = ReadingStore(defaults: defaults)
            XCTAssertEqual(restored.bookmarks, ["example"])
            XCTAssertEqual(restored.position(for: article()).fraction, 0.42)
            XCTAssertEqual(restored.position(for: article()).blockID, "paragraph")
        }
    }

    func testStoredFutureSchemasFallBackWithoutDeletingPackagesOrReadingRecords() throws {
        for scenario in futureSchemaCases {
            let bundled = try fixture("future-load-\(scenario.name)-bundle", revision: "bundled")
            let future = try futurePackage("future-load-\(scenario.name)-source",
                manifestSchema: scenario.manifest, documentSchema: scenario.document)
            let storage = directory.appendingPathComponent("future-load-\(scenario.name)-storage")
            let versions = storage.appendingPathComponent("versions")
            try FileManager.default.createDirectory(at: versions, withIntermediateDirectories: true)
            let id = UUID().uuidString
            let stored = versions.appendingPathComponent(id)
            try FileManager.default.copyItem(at: future, to: stored)
            let manifestBefore = try Data(contentsOf: stored.appendingPathComponent("manifest.json"))
            let pointer = try JSONSerialization.data(withJSONObject: ["directory": id])
            let pointerURL = storage.appendingPathComponent("current.json")
            try pointer.write(to: pointerURL)
            let suite = "library-future-load-test-" + UUID().uuidString
            let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
            defer { defaults.removePersistentDomain(forName: suite) }
            let reading = ReadingStore(defaults: defaults)
            reading.toggleBookmark("example")
            reading.record(articleID: "example", heading: "intro", fraction: 0.42, blockID: "paragraph")
            let savedRecords = try XCTUnwrap(defaults.data(forKey: "library.reading.v1"))

            let repository = ContentRepository(bundledRoot: bundled, storageRoot: storage)
            let fallback = try repository.load()
            XCTAssertEqual(fallback.manifest.revision, "bundled", scenario.name)
            XCTAssertEqual(fallback.root.standardizedFileURL, bundled.standardizedFileURL)
            XCTAssertEqual(try fallback.document(for: article()), document())
            XCTAssertThrowsError(try repository.install(from: stored), scenario.name)
            XCTAssertEqual(try Data(contentsOf: stored.appendingPathComponent("manifest.json")), manifestBefore)
            XCTAssertEqual(try Data(contentsOf: pointerURL), pointer)
            XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), savedRecords)
            let restored = ReadingStore(defaults: defaults)
            XCTAssertEqual(restored.bookmarks, ["example"])
            XCTAssertEqual(restored.position(for: article()).fraction, 0.42)
            XCTAssertEqual(restored.position(for: article()).blockID, "paragraph")
        }
    }

    func testOldHTMLPackageFallsBackWithoutDeletingUserData() throws {
        let bundled = try fixture("native-bundle")
        let storage = directory.appendingPathComponent("legacy-storage")
        let id = UUID().uuidString
        let legacy = storage.appendingPathComponent("versions").appendingPathComponent(id)
        try FileManager.default.createDirectory(at: legacy, withIntermediateDirectories: true)
        let html = Data("<h1>legacy</h1>".utf8)
        try html.write(to: legacy.appendingPathComponent("article.html"))
        let oldArticle = LibraryArticle(id: "example", title: "Old", summary: "", category: "", level: "beginner", last_updated: "2026-10-22",
            source_path: "docs/example.md", source_sha256: article().source_sha256, html_path: "article.html", search_text: "", headings: [], audio_id: nil)
        let manifest = ContentManifest(schema_version: 1, revision: "legacy", articles: [oldArticle], audio: [],
            files: ["article.html": SHA256.hash(data: html).map { String(format: "%02x", $0) }.joined()])
        try JSONEncoder().encode(manifest).write(to: legacy.appendingPathComponent("manifest.json"))
        try JSONSerialization.data(withJSONObject: ["directory": id]).write(to: storage.appendingPathComponent("current.json"))
        let repository = ContentRepository(bundledRoot: bundled, storageRoot: storage)
        let suite = "library-fallback-test-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark("example")
        reading.record(articleID: "example", heading: "intro", fraction: 0.42)
        XCTAssertEqual(try repository.load().manifest.schema_version, 2)
        XCTAssertThrowsError(try repository.install(from: legacy))
        XCTAssertTrue(FileManager.default.fileExists(atPath: legacy.path))
        XCTAssertEqual(ReadingStore(defaults: defaults).bookmarks, ["example"])
        XCTAssertEqual(ReadingStore(defaults: defaults).position(for: article()).fraction, 0.42)
    }

    func testRejectsSymbolicLinksAndUnlistedFiles() throws {
        let root = try fixture("link")
        try FileManager.default.createSymbolicLink(at: root.appendingPathComponent("outside"), withDestinationURL: directory)
        XCTAssertThrowsError(try ContentValidator.validate(root: root))
        try FileManager.default.removeItem(at: root.appendingPathComponent("outside"))
        try Data("extra".utf8).write(to: root.appendingPathComponent("extra.js"))
        XCTAssertThrowsError(try ContentValidator.validate(root: root))
    }

    func testFailedValidationAndActivationPreserveCurrentVersion() throws {
        let bundled = try fixture("bundle")
        let update = try fixture("update", revision: "v2")
        let storage = directory.appendingPathComponent("storage")
        let repository = ContentRepository(bundledRoot: bundled, storageRoot: storage)
        XCTAssertEqual(try repository.install(from: update).manifest.revision, "v2")
        let third = try fixture("third", revision: "v3")
        let failing = ContentRepository(bundledRoot: bundled, storageRoot: storage, writePointer: { _, _ in throw CocoaError(.fileWriteNoPermission) })
        XCTAssertThrowsError(try failing.install(from: third))
        XCTAssertEqual(try repository.load().manifest.revision, "v2")
        try Data("changed".utf8).write(to: third.appendingPathComponent("articles/example.json"))
        XCTAssertThrowsError(try repository.install(from: third))
        XCTAssertEqual(try repository.load().manifest.revision, "v2")
        let versions = try FileManager.default.contentsOfDirectory(atPath: storage.appendingPathComponent("versions").path)
        XCTAssertEqual(versions.count, 1)
    }

    func testReadAccessRootKeepsTheSameContentDirectoryAndBundledFiles() throws {
        let root = try fixture("read-access/Content")
        let manifestData = try Data(contentsOf: root.appendingPathComponent("manifest.json"))
        let validated = try ContentValidator.validate(root: root)
        let manifest = validated.manifest
        let files = manifest.files
        let parent = root.deletingLastPathComponent()
        try FileManager.default.createDirectory(at: parent.appendingPathComponent("unused"), withIntermediateDirectories: true)
        try Data("outside the content package".utf8).write(to: parent.appendingPathComponent("outside.txt"))
        let alias = directory.appendingPathComponent("read-access-alias")
        try FileManager.default.createSymbolicLink(at: alias, withDestinationURL: parent)
        let expectedDirectory = try FileManager.default.attributesOfItem(atPath: root.path)
        let expectedFileSystem = try XCTUnwrap(expectedDirectory[.systemNumber] as? NSNumber)
        let expectedFileNumber = try XCTUnwrap(expectedDirectory[.systemFileNumber] as? NSNumber)
        for path in [alias.path + "/Content", alias.path + "/unused/../Content"] {
            let input = URL(fileURLWithPath: path, isDirectory: false)
            let snapshot = ContentSnapshot(root: input, manifest: validated.manifest)
            let access = snapshot.readAccessRoot
            let actualDirectory = try FileManager.default.attributesOfItem(atPath: access.path)
            XCTAssertTrue(access.hasDirectoryPath)
            let components = access.pathComponents
            XCTAssertFalse(components.contains("."))
            XCTAssertFalse(components.contains(".."))
            // Foundation can retain system spellings such as /tmp; the package alias must be removed.
            XCTAssertFalse(components.contains(alias.lastPathComponent))
            XCTAssertEqual(actualDirectory[.systemNumber] as? NSNumber, expectedFileSystem)
            XCTAssertEqual(actualDirectory[.systemFileNumber] as? NSNumber, expectedFileNumber)
            for relative in ["articles/example.json", "assets/pixel.png"] {
                let file = access.appendingPathComponent(relative)
                XCTAssertTrue(file.pathComponents.starts(with: access.pathComponents))
                XCTAssertEqual(try Data(contentsOf: file), try Data(contentsOf: root.appendingPathComponent(relative)))
            }
            XCTAssertFalse(FileManager.default.fileExists(atPath: access.appendingPathComponent("outside.txt").path))
            XCTAssertEqual(snapshot.root, input)
            XCTAssertFalse(snapshot.root.hasDirectoryPath)
            XCTAssertEqual(snapshot.manifest.revision, manifest.revision)
            XCTAssertEqual(snapshot.manifest.files, files)
            XCTAssertEqual(try Data(contentsOf: root.appendingPathComponent("manifest.json")), manifestData)
        }
    }

    func testReadingRecordsSurviveReloadAndRemovedHeadingsFallBackToFraction() throws {
        let suite = "library-test-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let first = ReadingStore(defaults: defaults)
        first.toggleBookmark("example")
        first.record(articleID: "example", heading: "intro", fraction: 0.42)
        let restored = ReadingStore(defaults: defaults)
        XCTAssertEqual(restored.bookmarks, ["example"])
        XCTAssertEqual(restored.lastArticleID, "example")
        XCTAssertEqual(restored.position(for: article()), ReadingPosition(heading: "intro", fraction: 0.42))
        restored.markOpened("another-article")
        XCTAssertEqual(ReadingStore(defaults: defaults).lastArticleID, "another-article")
        XCTAssertEqual(restored.position(for: article()).fraction, 0.42)
        restored.record(articleID: "example", heading: "removed", fraction: 2)
        XCTAssertEqual(restored.position(for: article()), ReadingPosition(heading: nil, fraction: 1))
        restored.record(articleID: "example", heading: nil, fraction: .nan)
        XCTAssertEqual(restored.position(for: article()).fraction, 1)
    }

    func testOldReadingJSONMigratesWithoutClearingBookmarks() throws {
        let suite = "library-migration-test-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        defaults.set(Data("{\"bookmarks\":[\"example\"],\"positions\":{\"example\":{\"heading\":\"intro\",\"fraction\":0.42}},\"lastArticleID\":\"example\"}".utf8), forKey: "library.reading.v1")
        let migrated = ReadingStore(defaults: defaults)
        XCTAssertEqual(migrated.bookmarks, ["example"])
        XCTAssertEqual(migrated.position(for: article(), document: document()).blockID, "heading")
        migrated.record(articleID: "example", heading: "intro", fraction: 0.42, blockID: "paragraph")
        XCTAssertEqual(ReadingStore(defaults: defaults).position(for: article(), document: document()).blockID, "paragraph")
        migrated.record(articleID: "example", heading: "intro", fraction: 0.42, blockID: "removed")
        XCTAssertEqual(migrated.position(for: article(), document: document()).blockID, "heading")
        defaults.set(Data("{\"bookmarks\":[\"example\"],\"positions\":{\"example\":{\"heading\":5,\"fraction\":\"invalid\",\"blockID\":\"removed\"}}}".utf8), forKey: "library.reading.v1")
        let damaged = ReadingStore(defaults: defaults)
        XCTAssertEqual(damaged.bookmarks, ["example"])
        XCTAssertNotNil(damaged.position(for: article(), document: document()).blockID.flatMap { document().block(id: $0) })
    }

    private func readingDocument(_ blocks: [NativeBlock]) -> NativeDocument {
        NativeDocument(schema_version: 1, article_id: "example", source_sha256: article().source_sha256, blocks: blocks)
    }
    private func readingHeading(_ id: String, _ text: String) -> NativeBlock {
        NativeBlock(id: id, type: "heading", heading_id: id, level: 2, inlines: [NativeInline(type: "text", text: text)])
    }
    private func readingParagraph(_ id: String, _ text: String) -> NativeBlock {
        NativeBlock(id: id, type: "paragraph", inlines: [NativeInline(type: "text", text: text)])
    }
    private var readingDigest: String { String(repeating: "a", count: 64) }
    private var revisedReadingDigest: String { String(repeating: "b", count: 64) }

    func testReadingAnchorRestoresSameDocumentAndSurvivesInsertionAndHeadingRename() throws {
        let old = readingDocument([readingHeading("old-heading", "旧見出し"), readingParagraph("old-target", "読書中の本文")])
        let anchor = try XCTUnwrap(old.readingAnchor(blockID: "old-target", documentDigest: readingDigest))
        let saved = ReadingPosition(heading: "old-heading", fraction: 1, blockID: "old-target", anchor: anchor)
        XCTAssertEqual(old.readingBlockID(for: saved, documentDigest: readingDigest), "old-target")
        let changed = readingDocument([readingHeading("new-heading", "改名した見出し"), readingParagraph("inserted", "追加段落"),
                                       readingParagraph("new-target", "読書中の本文"), readingParagraph("end", "末尾")])
        XCTAssertEqual(changed.readingBlockID(for: saved, documentDigest: revisedReadingDigest), "new-target")
        XCTAssertEqual(changed.readingBlockID(for: saved), "new-target", "Unknown digest must use semantic comparison")
    }

    func testReadingAnchorChangedOrDeletedParagraphFallsBackToMatchingHeading() throws {
        let old = readingDocument([readingHeading("old-heading", "変わらない見出し"), readingParagraph("target", "読書中")])
        let anchor = try XCTUnwrap(old.readingAnchor(blockID: "target", documentDigest: readingDigest))
        let saved = ReadingPosition(heading: "old-heading", fraction: 1, blockID: "target", anchor: anchor)
        for body in [[], [readingParagraph("target", "書き換えた別の本文")]] {
            let changed = readingDocument([readingParagraph("front", "先頭"), readingHeading("new-heading", "変わらない見出し")] + body)
            XCTAssertEqual(changed.readingBlockID(for: saved, documentDigest: revisedReadingDigest), "new-heading")
        }
    }

    func testReadingAnchorDisambiguatesRepeatedParagraphByUniqueHeadingAfterSectionMove() throws {
        let old = readingDocument([readingHeading("section-a", "第一節"), readingParagraph("target", "同じ本文"),
                                   readingHeading("section-b", "第二節"), readingParagraph("other", "同じ本文")])
        let anchor = try XCTUnwrap(old.readingAnchor(blockID: "target", documentDigest: readingDigest))
        let saved = ReadingPosition(heading: "section-a", fraction: 0.3, blockID: "target", anchor: anchor)
        let changed = readingDocument([readingHeading("new-b", "第二節"), readingParagraph("target", "同じ本文"),
                                       readingHeading("new-a", "第一節"), readingParagraph("correct", "同じ本文")])
        XCTAssertEqual(changed.readingBlockID(for: saved, documentDigest: revisedReadingDigest), "correct")
        let ambiguousInSection = readingDocument(changed.blocks + [readingParagraph("duplicate", "同じ本文")])
        XCTAssertEqual(ambiguousInSection.readingBlockID(for: saved, documentDigest: revisedReadingDigest), "new-a")
    }

    func testReadingAnchorAmbiguousHeadingsUseFractionWithoutTrustingReassignedID() throws {
        let old = readingDocument([readingHeading("old", "重複見出し"), readingParagraph("target", "同じ本文")])
        let anchor = try XCTUnwrap(old.readingAnchor(blockID: "target", documentDigest: readingDigest))
        let saved = ReadingPosition(heading: "old", fraction: 1, blockID: "target", anchor: anchor)
        let changed = readingDocument([readingHeading("first", "重複見出し"), readingParagraph("target", "同じ本文"),
                                       readingHeading("second", "重複見出し"), readingParagraph("last", "同じ本文")])
        XCTAssertEqual(changed.readingBlockID(for: saved, documentDigest: revisedReadingDigest), "last")
        XCTAssertEqual(changed.readingBlockID(for: ReadingPosition(heading: nil, fraction: 0.5, blockID: "target")), "target",
                       "Legacy records must retain their existing direct-ID behavior")
        XCTAssertNil(readingDocument([]).readingBlockID(for: saved, documentDigest: revisedReadingDigest))
    }

    func testReadingFingerprintsIgnoreGeneratedAssetsAndIDsButKeepMeaning() throws {
        let originalMath = NativeBlock(id: "math-old", type: "math", asset: image, source: "x^{2}", accessibility_text: "二乗")
        let newImage = NativeAsset(light: "assets/new-light.png", dark: "assets/new-dark.png", width: 800, height: 400, scale: 2)
        let regeneratedMath = NativeBlock(id: "math-new", type: "math", asset: newImage, source: "x^{2}", accessibility_text: "二乗")
        let old = readingDocument([readingHeading("heading-old", "見出し"), originalMath])
        let changed = readingDocument([readingHeading("heading-new", "見出し"), regeneratedMath])
        let first = try XCTUnwrap(old.readingAnchor(blockID: "math-old", documentDigest: readingDigest))
        let second = try XCTUnwrap(changed.readingAnchor(blockID: "math-new", documentDigest: revisedReadingDigest))
        XCTAssertEqual(first.blockFingerprint, second.blockFingerprint)
        XCTAssertEqual(first.headingFingerprint, second.headingFingerprint)
        var edited = regeneratedMath; edited.source = "x^{3}"
        XCTAssertNotEqual(first.blockFingerprint,
                          readingDocument([edited]).readingAnchor(blockID: "math-new", documentDigest: readingDigest)?.blockFingerprint)
        XCTAssertNil(old.readingAnchor(blockID: "removed", documentDigest: readingDigest))
        XCTAssertNil(old.readingAnchor(blockID: "math-old", documentDigest: "invalid"))
    }

    func testReadingFingerprintsRetainCodeWhitespaceAndNestedTableListQuoteContent() throws {
        let text: (String) -> NativeInline = { NativeInline(type: "text", text: $0) }
        let variants: [(NativeBlock, NativeBlock)] = [
            (NativeBlock(id: "block", type: "code", language: "python", text: "  x\n"),
             NativeBlock(id: "block", type: "code", language: "python", text: " x\n")),
            (NativeBlock(id: "block", type: "table", table: NativeTable(header: [[text("列")]], rows: [[[text("旧値")]]], alignments: ["left"])),
             NativeBlock(id: "block", type: "table", table: NativeTable(header: [[text("列")]], rows: [[[text("新値")]]], alignments: ["left"]))),
            (NativeBlock(id: "block", type: "list", ordered: true, start: 8, items: [NativeListItem(id: "old", blocks: [readingParagraph("p", "旧値")])]),
             NativeBlock(id: "block", type: "list", ordered: true, start: 8, items: [NativeListItem(id: "new", blocks: [readingParagraph("p", "新値")])])),
            (NativeBlock(id: "block", type: "quote", blocks: [readingParagraph("p", "旧値")]),
             NativeBlock(id: "block", type: "quote", blocks: [readingParagraph("p", "新値")]))]
        for (old, changed) in variants {
            let first = try XCTUnwrap(readingDocument([old]).readingAnchor(blockID: "block", documentDigest: readingDigest))
            let second = try XCTUnwrap(readingDocument([changed]).readingAnchor(blockID: "block", documentDigest: readingDigest))
            XCTAssertNotEqual(first.blockFingerprint, second.blockFingerprint, old.type)
        }
    }

    func testReadingAnchorRoundTripAndResolutionDoNotWriteOrClearOtherRecords() throws {
        let suite = "library-anchor-test-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let doc = document()
        let anchor = try XCTUnwrap(doc.readingAnchor(blockID: "paragraph", documentDigest: readingDigest))
        let first = ReadingStore(defaults: defaults)
        first.toggleBookmark("example")
        first.record(articleID: "other", heading: nil, fraction: 0.8)
        first.record(articleID: "example", heading: "intro", fraction: 0.5, blockID: "paragraph", anchor: anchor)
        let before = defaults.data(forKey: "library.reading.v1")
        let restored = ReadingStore(defaults: defaults)
        XCTAssertEqual(restored.position(for: article()).anchor, anchor)
        XCTAssertEqual(restored.position(for: article(), document: doc, documentDigest: readingDigest).blockID, "paragraph")
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), before)
        let decoded = try XCTUnwrap(try JSONSerialization.jsonObject(with: XCTUnwrap(before)) as? [String: Any])
        XCTAssertNotNil((decoded["positions"] as? [String: Any])?["other"])
        XCTAssertEqual(restored.bookmarks, ["example"])
    }

    func testUnknownOrMalformedAnchorPreservesLegacyPositionAndOtherRecords() throws {
        let suite = "library-invalid-anchor-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let unknownVersion = "{\"version\":2,\"documentDigest\":\"\(readingDigest)\",\"blockFingerprint\":\"\(readingDigest)\"}"
        let invalidHeading = "{\"version\":1,\"documentDigest\":\"\(readingDigest)\",\"blockFingerprint\":\"\(readingDigest)\",\"headingFingerprint\":7}"
        for anchor in [unknownVersion, invalidHeading,
                       "{\"version\":1,\"documentDigest\":\"invalid\",\"blockFingerprint\":\"invalid\"}", "\"invalid\""] {
            let json = "{\"bookmarks\":[\"example\"],\"positions\":{\"example\":{\"heading\":\"intro\",\"fraction\":0.5,\"blockID\":\"paragraph\",\"anchor\":\(anchor)},\"other\":{\"fraction\":0.8}},\"lastArticleID\":\"other\"}"
            let before = Data(json.utf8)
            defaults.set(before, forKey: "library.reading.v1")
            let reading = ReadingStore(defaults: defaults)
            XCTAssertNil(reading.position(for: article()).anchor)
            XCTAssertEqual(reading.position(for: article(), document: document(), documentDigest: readingDigest).blockID, "paragraph")
            XCTAssertEqual(reading.bookmarks, ["example"])
            XCTAssertEqual(reading.lastArticleID, "other")
            XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), before)
            reading.markOpened("example")
            let rewritten = try XCTUnwrap(defaults.data(forKey: "library.reading.v1"))
            let object = try XCTUnwrap(try JSONSerialization.jsonObject(with: rewritten) as? [String: Any])
            XCTAssertNotNil((object["positions"] as? [String: Any])?["other"])
        }
    }
}

/// These tests never play a permitted URL or activate an audio session. Each test
/// uses a private defaults suite rather than the app's listening/reading records.
@MainActor
final class AudioPlayerTests: XCTestCase {
    private let releaseID = "01-concepts--agent-loop-3c6f324e5d0d-7ab8a0e6323a-47803c3cb76f-p01"
    private let releaseDigest = "47803c3cb76f5e737a3d2f11a8878886590d4159363f52c453bd44396214942e"
    private var releaseURL: String {
        "https://github.com/pero3dev/ai-agent-library/releases/download/"
            + "audio-agent-loop-3c6f324e5d0d4a60-7ab8a0e6323a20e7/"
            + "\(releaseID)-47803c3cb76f5e73.mp3"
    }

    private func episode(url: String? = nil, id: String? = nil, digest: String? = nil) -> AudioEpisode {
        AudioEpisode(id: id ?? releaseID, title: "テスト音声", article_id: "example", url: url ?? releaseURL,
                     duration_seconds: 120, sha256: digest ?? releaseDigest, credit: "テスト",
                     license_url: "https://voicevox.hiroshiba.jp/nemo/term/", source_digest: String(repeating: "a", count: 64),
                     source_is_current: true,
                     chapters: [AudioChapter(id: "first", title: "導入", start_seconds: 0),
                                AudioChapter(id: "middle", title: "中盤", start_seconds: 40),
                                AudioChapter(id: "last", title: "最後", start_seconds: 80)])
    }

    private func freshDefaults() throws -> UserDefaults {
        let suite = "ailibrary-audio-test-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        addTeardownBlock { UserDefaults(suiteName: suite)?.removePersistentDomain(forName: suite) }
        return defaults
    }

    private func drainMainQueue() async {
        await withCheckedContinuation { continuation in
            DispatchQueue.main.async { continuation.resume() }
        }
    }

    func testOnlyExactReleasedAudioIdentityIsAllowed() {
        XCTAssertEqual(AudioPlayer.allowedAudioURL(for: episode())?.absoluteString, releaseURL)
        for url in [releaseURL.replacingOccurrences(of: "https://", with: "http://"),
                    releaseURL.replacingOccurrences(of: "github.com/", with: "github.com.evil.example/"),
                    releaseURL.replacingOccurrences(of: "github.com/", with: "user:password@github.com/"),
                    releaseURL.replacingOccurrences(of: "github.com/", with: "github.com:443/"),
                    releaseURL + "?download=1", releaseURL + "#fragment",
                    releaseURL.replacingOccurrences(of: "/releases/", with: "/%72eleases/")] {
            XCTAssertNil(AudioPlayer.allowedAudioURL(for: episode(url: url)))
        }
        XCTAssertNil(AudioPlayer.allowedAudioURL(for: episode(id: "different-release")))
        XCTAssertNil(AudioPlayer.allowedAudioURL(for: episode(digest: String(repeating: "0", count: 64))))
    }

    func testInitializationRestoresClampedPositionAndSupportedRateWithoutPreparingMedia() throws {
        let defaults = try freshDefaults()
        let key = "ios.audio.\(releaseID)"
        defaults.set(150.0, forKey: key + ".position")
        defaults.set(1.5, forKey: key + ".rate")
        let avPlayer = AVPlayer()
        let restored = AudioPlayer(episode: episode(), defaults: defaults, makePlayer: { avPlayer })
        XCTAssertEqual(restored.position, 120)
        XCTAssertEqual(restored.playbackRate, 1.5)
        XCTAssertEqual(restored.currentChapter?.id, "last")
        XCTAssertNil(avPlayer.currentItem)
        XCTAssertEqual(avPlayer.rate, 0)
        XCTAssertFalse(restored.isPlaybackRequested)
        XCTAssertFalse(restored.isPlaying)
        XCTAssertFalse(restored.isBuffering)
        defaults.set(Double.nan, forKey: key + ".position")
        defaults.set(3.0, forKey: key + ".rate")
        let corrupted = AudioPlayer(episode: episode(), defaults: defaults)
        XCTAssertEqual(corrupted.position, 0)
        XCTAssertEqual(corrupted.playbackRate, 1)
    }

    func testSeekSkipChapterAndRatePersistWithoutStartingPlayback() throws {
        let defaults = try freshDefaults()
        let avPlayer = AVPlayer()
        let player = AudioPlayer(episode: episode(), defaults: defaults, makePlayer: { avPlayer })
        player.seek(to: 39.9)
        XCTAssertEqual(player.currentChapter?.id, "first")
        player.skip(by: 0.1)
        XCTAssertEqual(player.currentChapter?.id, "middle")
        player.selectChapter(episode().chapters[2])
        XCTAssertEqual(player.position, 80)
        player.setRate(1.75)
        for invalidRate in [Double.nan, Double.infinity, 0, 3] { player.setRate(invalidRate) }
        player.seek(to: .nan)
        player.skip(by: .infinity)
        XCTAssertEqual(player.position, 80)
        XCTAssertEqual(player.playbackRate, 1.75)
        XCTAssertNil(avPlayer.currentItem)
        XCTAssertEqual(avPlayer.rate, 0)
        XCTAssertFalse(player.isPlaybackRequested)
        let restored = AudioPlayer(episode: episode(), defaults: defaults)
        XCTAssertEqual(restored.position, 80)
        XCTAssertEqual(restored.playbackRate, 1.75)
        XCTAssertEqual(restored.currentChapter?.id, "last")
        player.skip(by: 1000)
        XCTAssertEqual(player.position, 120)
        player.skip(by: -1000)
        XCTAssertEqual(player.position, 0)
    }

    func testChangingRateAlsoUpdatesPendingBufferingSpeed() throws {
        let avPlayer = AVPlayer()
        let player = AudioPlayer(episode: episode(), defaults: try freshDefaults(), makePlayer: { avPlayer })
        // An empty player can wait at a requested rate without creating an asset,
        // fetching media, or activating AVAudioSession.
        avPlayer.rate = 1
        defer { avPlayer.pause() }
        XCTAssertFalse(player.isPlaying)
        player.setRate(1.75)
        XCTAssertEqual(avPlayer.defaultRate, 1.75)
        XCTAssertEqual(avPlayer.rate, 1.75)
        XCTAssertNil(avPlayer.currentItem)
    }

    func testRetryRecreatesFailedPlayerAndKeepsSavedProgressWithoutNetwork() throws {
        let defaults = try freshDefaults()
        var creations = 0
        let player = AudioPlayer(episode: episode(url: "https://example.invalid/audio.mp3"), defaults: defaults,
                                 makePlayer: {
            creations += 1
            return creations == 1 ? FailedAudioAVPlayer() : AVPlayer()
        })
        player.seek(to: 55)
        player.setRate(1.5)
        player.retry()
        XCTAssertEqual(creations, 2)
        XCTAssertNotNil(player.errorMessage)
        XCTAssertFalse(player.isPlaybackRequested)
        XCTAssertEqual(player.position, 55)
        XCTAssertEqual(player.playbackRate, 1.5)
        let restored = AudioPlayer(episode: episode(), defaults: defaults)
        XCTAssertEqual(restored.position, 55)
        XCTAssertEqual(restored.playbackRate, 1.5)
    }

    func testNotificationsStopSafelyAndDoNotAutoplayIdlePlayer() async throws {
        let avPlayer = AVPlayer()
        let player = AudioPlayer(episode: episode(), defaults: try freshDefaults(), makePlayer: { avPlayer })
        player.seek(to: 55)
        NotificationCenter.default.post(name: AVAudioSession.interruptionNotification, object: nil,
            userInfo: [AVAudioSessionInterruptionTypeKey: AVAudioSession.InterruptionType.began.rawValue])
        await drainMainQueue()
        player.play() // While interrupted this must return before item/session creation.
        XCTAssertFalse(player.isPlaybackRequested)
        XCTAssertNotNil(player.statusMessage)
        XCTAssertNil(avPlayer.currentItem)
        NotificationCenter.default.post(name: AVAudioSession.interruptionNotification, object: nil,
            userInfo: [AVAudioSessionInterruptionTypeKey: AVAudioSession.InterruptionType.ended.rawValue,
                       AVAudioSessionInterruptionOptionKey: AVAudioSession.InterruptionOptions.shouldResume.rawValue])
        await drainMainQueue()
        XCTAssertFalse(player.isPlaybackRequested)
        XCTAssertNil(avPlayer.currentItem)
        NotificationCenter.default.post(name: AVAudioSession.routeChangeNotification, object: nil,
            userInfo: [AVAudioSessionRouteChangeReasonKey: AVAudioSession.RouteChangeReason.oldDeviceUnavailable.rawValue])
        await drainMainQueue()
        XCTAssertFalse(player.isPlaybackRequested)
        XCTAssertTrue(player.statusMessage?.contains("接続が切れた") == true)
        XCTAssertEqual(player.position, 55)
        NotificationCenter.default.post(name: AVAudioSession.mediaServicesWereResetNotification, object: nil)
        await drainMainQueue()
        XCTAssertNotNil(player.errorMessage)
        XCTAssertFalse(player.isPlaying)
        XCTAssertFalse(player.isPlaybackRequested)
        XCTAssertNil(avPlayer.currentItem)
    }
}

private final class FailedAudioAVPlayer: AVPlayer {
    override var status: AVPlayer.Status { .failed }
}
