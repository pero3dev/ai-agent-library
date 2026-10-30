import AVFoundation
import Combine
import CryptoKit
import Foundation
import XCTest
@testable import AILibrary

/// Fault injection remains inside a private defaults suite and performs no I/O outside it.
private final class ReadingRecoveryWriteDefaults: UserDefaults {
    var rejectedKey: String?
    var changedBackup = false
    var sourceChangedDuringBackup: String?
    override func set(_ value: Any?, forKey defaultName: String) {
        guard defaultName != rejectedKey else { return }
        if changedBackup, defaultName.hasSuffix(".recovery.v1") {
            super.set(Data("unexpected".utf8), forKey: defaultName)
        } else { super.set(value, forKey: defaultName) }
        if defaultName.hasSuffix(".recovery.v1"), let key = sourceChangedDuringBackup {
            super.set(Data("changed during backup".utf8), forKey: key)
        }
    }
}

/// Export probes stay inside a random suite and never touch production defaults.
private final class ReadingBackupProbeDefaults: UserDefaults {
    var writeCalls = 0
    var watchedKey: String?
    var replacementAfterRead: Data?
    override func set(_ value: Any?, forKey defaultName: String) {
        writeCalls += 1
        super.set(value, forKey: defaultName)
    }
    override func data(forKey defaultName: String) -> Data? {
        let value = super.data(forKey: defaultName)
        if defaultName == watchedKey, let replacementAfterRead {
            watchedKey = nil
            super.set(replacementAfterRead, forKey: defaultName)
        }
        return value
    }
}

/// One-shot observed-writer seam. All values stay in a fresh synthetic domain.
private final class ReadingSaveSuspensionProbeDefaults: UserDefaults {
    var setKeys: [String] = []
    var watchedKey: String?
    var readsUntilCallback = 1
    var afterRead: (() -> Void)?
    var rejectedSetKeys = Set<String>()
    private var injecting = false
    override func set(_ value: Any?, forKey defaultName: String) {
        if injecting { super.set(value, forKey: defaultName); return }
        setKeys.append(defaultName)
        guard !rejectedSetKeys.contains(defaultName) else { return }
        super.set(value, forKey: defaultName)
    }
    override func data(forKey defaultName: String) -> Data? {
        let value = super.data(forKey: defaultName)
        if defaultName == watchedKey, let callback = afterRead {
            readsUntilCallback -= 1
            if readsUntilCallback == 0 { afterRead = nil; callback() }
        }
        return value
    }
    func inject(_ value: Any?, forKey key: String) {
        injecting = true
        defer { injecting = false }
        if let value { super.set(value, forKey: key) }
        else { super.removeObject(forKey: key) }
    }
}

/// Exact-key failure injection for restore tests, isolated from production defaults.
private final class ReadingRestoreProbeDefaults: UserDefaults {
    var setKeys: [String] = []
    var removeKeys: [String] = []
    var rejectedSetKeys: Set<String> = []
    var rejectedRemoveKeys: Set<String> = []
    var replacementSetValues: [String: Data] = [:]
    var afterSet: ((String) -> Void)?
    var beforeDataRead: ((String) -> Void)?
    var afterDataRead: ((String) -> Void)?
    private var directInjection = false
    private var removing = false
    override func set(_ value: Any?, forKey defaultName: String) {
        if directInjection || removing { super.set(value, forKey: defaultName); return }
        setKeys.append(defaultName)
        guard !rejectedSetKeys.contains(defaultName) else { return }
        if let replacement = replacementSetValues[defaultName] { super.set(replacement, forKey: defaultName) }
        else { super.set(value, forKey: defaultName) }
        afterSet?(defaultName)
    }
    override func removeObject(forKey defaultName: String) {
        if directInjection { super.removeObject(forKey: defaultName); return }
        removeKeys.append(defaultName)
        guard !rejectedRemoveKeys.contains(defaultName) else { return }
        removing = true
        defer { removing = false }
        super.removeObject(forKey: defaultName)
    }
    override func data(forKey defaultName: String) -> Data? {
        beforeDataRead?(defaultName)
        let value = super.data(forKey: defaultName)
        afterDataRead?(defaultName)
        return value
    }
    // Direct injection is a separate writer, not an engine write in the ledger.
    func inject(_ value: Any?, forKey key: String) {
        directInjection = true
        defer { directInjection = false }
        if let value { super.set(value, forKey: key) }
        else { super.removeObject(forKey: key) }
    }
    func resetLedger() { setKeys.removeAll(); removeKeys.removeAll() }
}

private final class ReadingRestoreActorProbeDefaults: UserDefaults {
    var writeCalls = 0
    var denyPrimaryWrite = false
    let watchedPrimary = "library.reading.v1"
    override func set(_ value: Any?, forKey defaultName: String) {
        writeCalls += 1
        if denyPrimaryWrite, defaultName == watchedPrimary { return }
        super.set(value, forKey: defaultName)
    }
}


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

    private func retentionPackage(_ name: String, revision: String) throws -> URL {
        let lateAsset = NativeAsset(light: "assets/late-\(revision).png", dark: "assets/late-\(revision).png",
                                    width: 1, height: 1, scale: 1, baseline: 0)
        let value = NativeDocument(schema_version: 1, article_id: "example", source_sha256: article().source_sha256, blocks: [
            NativeBlock(id: "heading", type: "heading", heading_id: "intro", level: 2,
                        inlines: [NativeInline(type: "text", text: "導入")]),
            NativeBlock(id: "paragraph", type: "paragraph", inlines: [NativeInline(type: "text", text: "本文 \(revision)")]),
            NativeBlock(id: "math", type: "math", asset: lateAsset, source: "x", accessibility_text: "エックス")])
        let root = try fixture(name, revision: revision, document: value)
        try replaceFile(root, path: lateAsset.light, data: pixel)
        return root
    }

    private func retentionInventory(_ root: URL) throws -> [String: Data] {
        let base = root.standardizedFileURL.path + "/"
        let entries = try XCTUnwrap(FileManager.default.enumerator(at: root,
            includingPropertiesForKeys: [.isRegularFileKey], options: []))
        var files: [String: Data] = [:]
        for case let url as URL in entries {
            if try url.resourceValues(forKeys: [.isRegularFileKey]).isRegularFile == true {
                files[String(url.standardizedFileURL.path.dropFirst(base.count))] = try Data(contentsOf: url)
            }
        }
        return files
    }

    private func retentionDefaults() throws -> UserDefaults {
        let suite = "ailibrary-storage-retention-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        addTeardownBlock { UserDefaults(suiteName: suite)?.removePersistentDomain(forName: suite) }
        return defaults
    }

    private let roadmapID = "00-overview/learning-roadmap"
    private let secondLearningID = "00-overview/second"

    private func learningPackage(_ name: String, revision: String = "learning-v1", validIndex: Bool = true,
                                 order: [String]? = nil) throws -> URL {
        let root = try fixture(name, revision: revision)
        try FileManager.default.removeItem(at: root.appendingPathComponent("articles/example.json"))
        var files = ["assets/pixel.png": SHA256.hash(data: pixel).map { String(format: "%02x", $0) }.joined()]
        var articles: [LibraryArticle] = []
        let digest = article().source_sha256
        for (index, id) in [secondLearningID, roadmapID].enumerated() {
            let path = "articles/learning-\(index).json"
            let document = NativeDocument(schema_version: 1, article_id: id, source_sha256: digest, blocks: self.document().blocks)
            let data = try JSONEncoder().encode(document)
            try data.write(to: root.appendingPathComponent(path))
            files[path] = SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
            articles.append(LibraryArticle(id: id, title: "学習 \(index)", summary: "学習記事", category: "概要", level: "beginner",
                last_updated: "2026-10-25", source_path: "docs/\(id).md", source_sha256: digest, document_path: path,
                search_text: "Tools API", headings: [ArticleHeading(id: "intro", title: "導入", level: 2)], audio_id: nil))
        }
        let target: [String: Any] = ["type": "article", "article_id": roadmapID, "heading_id": "intro"]
        let payload: [String: Any] = ["schema_version": validIndex ? 1 : 2,
            "source_sha256": ["docs/\(roadmapID).md": digest, "docs/\(secondLearningID).md": digest,
                              "docs/00-overview/README.md": digest, "GLOSSARY.md": digest],
            "article_tags": [roadmapID: ["roadmap", "shared"], secondLearningID: ["second", "shared"]],
            "chapters": [["id": "00-overview", "title": "概要", "description": "学習する", "article_ids": order ?? [roadmapID, secondLearningID]]],
            "routes": Array("ABCDEFGH").map { ["id": String($0), "label": "学ぶ", "persona": "読者",
                                               "steps": [["inlines": [["type": "link", "text": "本文", "target": target]]]]] },
            "glossary": [["id": "agent", "name": "エージェント", "english": NSNull(), "summary": "説明",
                           "links": [["label": "本文", "target": target]]]]]
        let data = try JSONSerialization.data(withJSONObject: payload, options: [.sortedKeys])
        try FileManager.default.createDirectory(at: root.appendingPathComponent("assets/learning"), withIntermediateDirectories: true)
        try data.write(to: root.appendingPathComponent(NativeLearningIndex.path))
        files[NativeLearningIndex.path] = SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
        try JSONEncoder().encode(ContentManifest(schema_version: 2, revision: revision, articles: articles, audio: [], files: files))
            .write(to: root.appendingPathComponent("manifest.json"))
        return root
    }

    private final class DelayedLearningLoader {
        let started = XCTestExpectation(description: "Older snapshot read started")
        let release = DispatchSemaphore(value: 0)
        private let lock = NSLock()
        private var calls = 0
        private let first: Result<ContentSnapshot, Error>
        private let next: Result<ContentSnapshot, Error>

        init(first: Result<ContentSnapshot, Error>, next: ContentSnapshot) { self.first = first; self.next = .success(next) }
        init(first: Result<ContentSnapshot, Error>, next: Result<ContentSnapshot, Error>) { self.first = first; self.next = next }
        func load() throws -> ContentSnapshot {
            lock.lock(); let number = calls; calls += 1; lock.unlock()
            if number == 0 {
                started.fulfill()
                guard release.wait(timeout: .now() + 10) == .success else { throw ContentError.invalid("Test snapshot read timed out") }
                return try first.get()
            }
            return try next.get()
        }
    }

    func testLearningTagFilterCombinesAllConditionsWithinItsArticleScope() {
        let articles = [article(id: "other-tag", category: "concepts", level: "basic"),
                        article(id: "match", category: "concepts", level: "basic"),
                        article(id: "other-category", category: "foundations", level: "basic"),
                        article(id: "other-level", category: "concepts", level: "advanced"),
                        article(id: "other-query", category: "concepts", level: "basic", searchText: "別の本文"),
                        article(id: "no-bookmark", category: "concepts", level: "basic")]
        let tags = Dictionary(uniqueKeysWithValues: articles.map { ($0.id, $0.id == "other-tag" ? ["different"] : ["agent"]) })
            .merging(["test-only": ["hidden"]]) { first, _ in first }
        let bookmarks = Set(articles.map(\.id)).subtracting(["no-bookmark"])
        var filter = LibraryArticleFilter(query: "tools API", category: "concepts", level: "basic", bookmarksOnly: true, tag: "agent")
        XCTAssertEqual(filter.articles(in: articles, bookmarks: bookmarks, articleTags: tags).map(\.id), ["match"])
        filter.tag = nil
        XCTAssertEqual(filter.articles(in: articles, bookmarks: bookmarks, articleTags: tags).map(\.id), ["other-tag", "match"])
        XCTAssertEqual(filter.articles(in: articles, bookmarks: bookmarks).map(\.id), ["other-tag", "match"])
        filter.tag = "missing"
        XCTAssertTrue(filter.articles(in: articles, bookmarks: bookmarks, articleTags: tags).isEmpty)
        filter.reset()
        XCTAssertNil(filter.tag)
        XCTAssertFalse(filter.isActive)
        XCTAssertEqual(LibraryArticleFilter.tags(in: articles, articleTags: tags), ["agent", "different"])
        XCTAssertEqual(LibraryArticleFilter.tags(in: [], articleTags: tags), [])
    }

    func testLearningArticleOrderKeepsUnknownDuplicateAndUnlistedIDsSafe() {
        let articles = [article(id: "b"), article(id: "a"), article(id: "c"), article(id: "a")]
        XCTAssertEqual(LibraryArticleOrder.ordered(articles, articleIDs: []).map(\.id), ["b", "a", "c", "a"])
        XCTAssertEqual(LibraryArticleOrder.ordered(articles, articleIDs: ["unknown", "c", "c", "a", "test-only"]).map(\.id), ["c", "a", "a", "b"])
        XCTAssertEqual(LibraryArticleOrder.ordered(articles, articleIDs: ["unknown"]).map(\.id), articles.map(\.id))
    }

    @MainActor
    func testStoreLoadsOptionalLearningIndexWithoutChangingLegacyArticleScope() async throws {
        let suite = "ailibrary-learning-legacy-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let reading = ReadingStore(defaults: defaults)
        for (name, root, testing) in [("normal", try fixture("learning-old-normal"), false),
                                      ("fixture", try readerTestPackage("learning-old-fixture"), true)] {
            let store = LibraryStore(reading: reading, bundledRoot: root, isTestLibrary: testing,
                                     storageRoot: directory.appendingPathComponent("learning-unused-" + name))
            await store.load()
            XCTAssertNotNil(store.snapshot)
            XCTAssertNil(store.learningIndex)
            XCTAssertNil(store.learningError)
            XCTAssertNil(store.loadError)
            XCTAssertEqual(store.orderedListedArticles.map(\.id), store.listedArticles.map(\.id))
            XCTAssertTrue(store.listedArticles.allSatisfy { $0.isTestFixture == testing })
        }
    }

    @MainActor
    func testStoreLearningIndexOrdersArticlesAndInvalidMetadataCanRetry() async throws {
        let root = try learningPackage("learning-invalid", validIndex: false)
        let suite = "ailibrary-learning-retry-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark(roadmapID)
        reading.record(articleID: roadmapID, heading: "intro", fraction: 0.5, blockID: "paragraph")
        let records = try XCTUnwrap(defaults.data(forKey: "library.reading.v1"))
        let store = LibraryStore(reading: reading, bundledRoot: root, storageRoot: directory.appendingPathComponent("learning-retry-unused"))
        await store.load()
        let loaded = try XCTUnwrap(store.snapshot)
        XCTAssertNotNil(try loaded.document(for: loaded.manifest.articles[0]))
        XCTAssertNil(store.learningIndex)
        XCTAssertNotNil(store.learningError)
        XCTAssertNil(store.loadError)
        XCTAssertEqual(store.orderedListedArticles.map(\.id), [secondLearningID, roadmapID])
        XCTAssertEqual(store.bookmarks, [roadmapID])
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), records)

        var payload = try JSONSerialization.jsonObject(with: Data(contentsOf: root.appendingPathComponent(NativeLearningIndex.path))) as! [String: Any]
        payload["schema_version"] = 1
        try replaceFile(root, path: NativeLearningIndex.path, data: JSONSerialization.data(withJSONObject: payload))
        await store.retryLoad()
        XCTAssertNotNil(store.learningIndex)
        XCTAssertNil(store.learningError)
        XCTAssertEqual(store.orderedListedArticles.map(\.id), [roadmapID, secondLearningID])
        XCTAssertEqual(LibraryArticleFilter(tag: "roadmap").articles(in: store.orderedListedArticles, bookmarks: store.bookmarks,
            articleTags: try XCTUnwrap(store.learningIndex).article_tags).map(\.id), [roadmapID])
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), records)
    }

    @MainActor
    func testStoreLearningImportRecoveryAndCoreFailureKeepTheLastBundleAndRecords() async throws {
        let valid = try learningPackage("learning-import-valid", revision: "accepted")
        let invalid = try learningPackage("learning-import-invalid", revision: "bad-index", validIndex: false)
        let suite = "ailibrary-learning-import-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark(roadmapID)
        reading.record(articleID: roadmapID, heading: "intro", fraction: 0.5, blockID: "paragraph")
        let records = try XCTUnwrap(defaults.data(forKey: "library.reading.v1"))
        let storage = directory.appendingPathComponent("learning-import-storage")
        let store = LibraryStore(reading: reading, bundledRoot: directory.appendingPathComponent("missing-learning-bundle"), storageRoot: storage)
        await store.load()
        XCTAssertNil(store.snapshot)
        XCTAssertNotNil(store.loadError)
        await store.install(from: invalid)
        XCTAssertEqual(store.snapshot?.manifest.revision, "bad-index")
        XCTAssertNil(store.learningIndex)
        XCTAssertNotNil(store.learningError)
        XCTAssertNil(store.loadError)
        await store.install(from: valid)
        let accepted = try XCTUnwrap(store.snapshot)
        let tags = try XCTUnwrap(store.learningIndex).article_tags
        XCTAssertEqual(accepted.manifest.revision, "accepted")
        XCTAssertNil(store.learningError)
        let pointer = try Data(contentsOf: storage.appendingPathComponent("current.json"))
        let broken = try learningPackage("learning-import-broken")
        try Data("broken".utf8).write(to: broken.appendingPathComponent("articles/learning-0.json"))
        await store.install(from: broken)
        XCTAssertEqual(store.snapshot?.root, accepted.root)
        XCTAssertEqual(store.learningIndex?.article_tags, tags)
        XCTAssertNil(store.learningError)
        XCTAssertEqual(try Data(contentsOf: storage.appendingPathComponent("current.json")), pointer)
        XCTAssertNotNil(try accepted.document(for: accepted.manifest.articles[0]))
        XCTAssertEqual(store.bookmarks, [roadmapID])
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), records)
    }

    @MainActor
    func testStoreDiscardsOlderSnapshotMetadataAndErrorsAfterANewerRetry() async throws {
        let old = try ContentValidator.validate(root: learningPackage("learning-old-result", revision: "old", validIndex: false))
        let newest = try ContentValidator.validate(root: learningPackage("learning-new-result", revision: "new"))
        let suite = "ailibrary-learning-generation-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark(roadmapID)
        let records = try XCTUnwrap(defaults.data(forKey: "library.reading.v1"))
        let outcomes: [Result<ContentSnapshot, Error>] = [.success(old), .failure(ContentError.invalid("Older read failed"))]
        for (index, outcome) in outcomes.enumerated() {
            let delayed = DelayedLearningLoader(first: outcome, next: newest)
            let store = LibraryStore(reading: reading, bundledRoot: newest.root,
                storageRoot: directory.appendingPathComponent("learning-generation-\(index)"), snapshotLoader: delayed.load)
            let olderTask = Task { await store.load() }
            await fulfillment(of: [delayed.started], timeout: 5)
            await store.retryLoad()
            XCTAssertEqual(store.snapshot?.manifest.revision, "new")
            XCTAssertNotNil(store.learningIndex)
            XCTAssertNil(store.learningError)
            delayed.release.signal()
            await olderTask.value
            XCTAssertEqual(store.snapshot?.manifest.revision, "new")
            XCTAssertNotNil(store.learningIndex)
            XCTAssertNil(store.learningError)
            XCTAssertNil(store.loadError)
            XCTAssertFalse(store.isLoading)
            XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), records)
        }
    }

    @MainActor
    func testStoreFailedRetryPreservesTheLastLearningBundleAndRecords() async throws {
        let loaded = try ContentValidator.validate(root: learningPackage("learning-retry-last-good"))
        let delayed = DelayedLearningLoader(first: .success(loaded), next: .failure(ContentError.invalid("Retry failed")))
        delayed.release.signal()
        let suite = "ailibrary-learning-retained-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark(roadmapID)
        let records = try XCTUnwrap(defaults.data(forKey: "library.reading.v1"))
        let store = LibraryStore(reading: reading, bundledRoot: loaded.root,
            storageRoot: directory.appendingPathComponent("learning-retry-retained"), snapshotLoader: delayed.load)
        await store.load()
        let tags = try XCTUnwrap(store.learningIndex).article_tags
        await store.retryLoad()
        XCTAssertEqual(store.snapshot?.root, loaded.root)
        XCTAssertEqual(store.learningIndex?.article_tags, tags)
        XCTAssertNil(store.learningError)
        XCTAssertNotNil(store.loadError)
        XCTAssertFalse(store.isLoading)
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), records)
    }

    @MainActor
    func testStorePublishesSnapshotAndLearningMetadataAsOneBundle() async throws {
        let valid = try learningPackage("learning-publication-valid", revision: "good-index")
        let invalid = try learningPackage("learning-publication-invalid", revision: "bad-index", validIndex: false)
        let suite = "ailibrary-learning-publication-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let store = LibraryStore(reading: ReadingStore(defaults: defaults), bundledRoot: valid,
                                 storageRoot: directory.appendingPathComponent("learning-publication-storage"))
        var observedInvalidBundle = false
        let subscription = store.objectWillChange.sink {
            switch store.snapshot?.manifest.revision {
            case "good-index":
                XCTAssertNotNil(store.learningIndex)
                XCTAssertNil(store.learningError)
            case "bad-index":
                observedInvalidBundle = true
                XCTAssertNil(store.learningIndex)
                XCTAssertNotNil(store.learningError)
            default:
                XCTAssertNil(store.snapshot)
                XCTAssertNil(store.learningIndex)
                XCTAssertNil(store.learningError)
            }
        }
        await store.load()
        await store.install(from: invalid)
        XCTAssertTrue(observedInvalidBundle)
        withExtendedLifetime(subscription) {}
    }

    @MainActor
    func testStoreCancelledBeforeImportDoesNotCommitOrChangeItsLearningBundle() async throws {
        let original = try learningPackage("learning-cancel-before-original", revision: "original")
        let incoming = try learningPackage("learning-cancel-before-incoming", revision: "incoming", order: [secondLearningID, roadmapID])
        let suite = "ailibrary-learning-cancel-before-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark(roadmapID)
        let records = try XCTUnwrap(defaults.data(forKey: "library.reading.v1"))
        let storage = directory.appendingPathComponent("learning-cancel-before-storage")
        let store = LibraryStore(reading: reading, bundledRoot: original, storageRoot: storage)
        await store.load()
        let task = Task { @MainActor in
            withUnsafeCurrentTask { $0?.cancel() }
            await store.install(from: incoming)
        }
        await task.value
        XCTAssertFalse(Task.isCancelled, "Cancelling the importing child must not cancel its parent test")
        let persisted = try ContentRepository(bundledRoot: original, storageRoot: storage).load()
        let index = try XCTUnwrap(NativeLearningIndex.load(from: persisted))
        XCTAssertFalse(FileManager.default.fileExists(atPath: storage.appendingPathComponent("current.json").path))
        XCTAssertEqual(store.snapshot?.root, persisted.root)
        XCTAssertEqual(store.snapshot?.manifest.revision, "original")
        XCTAssertEqual(store.orderedListedArticles.map(\.id), index.chapters.flatMap(\.article_ids))
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), records)
        XCTAssertFalse(store.isLoading)
    }

    @MainActor
    func testStoreCancellationAfterImportStartsStillPublishesTheCommittedLearningBundle() async throws {
        let original = try learningPackage("learning-cancel-running-original", revision: "original")
        let incoming = try learningPackage("learning-cancel-running-incoming", revision: "incoming", order: [secondLearningID, roadmapID])
        let suite = "ailibrary-learning-cancel-running-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark(roadmapID)
        let records = try XCTUnwrap(defaults.data(forKey: "library.reading.v1"))
        let storage = directory.appendingPathComponent("learning-cancel-running-storage")
        let store = LibraryStore(reading: reading, bundledRoot: original, storageRoot: storage)
        await store.load()
        var cancelNextPublication = true
        var cancelledDuringImport = false
        var cancellationCount = 0
        let subscription = store.objectWillChange.sink {
            guard cancelNextPublication else { return }
            cancelNextPublication = false
            cancellationCount += 1
            // Synchronous publication runs inside the importing task after its
            // entry guard, before the detached repository commit. No timing poll
            // or production test hook is needed to cancel that exact task.
            withUnsafeCurrentTask { current in
                current?.cancel()
                cancelledDuringImport = current?.isCancelled == true
            }
        }
        let task = Task { @MainActor in await store.install(from: incoming) }
        await task.value
        subscription.cancel()
        XCTAssertFalse(Task.isCancelled, "The synchronous subscriber must only cancel the importing child")
        XCTAssertEqual(cancellationCount, 1)
        XCTAssertTrue(cancelledDuringImport)
        XCTAssertTrue(FileManager.default.fileExists(atPath: storage.appendingPathComponent("current.json").path))
        let persisted = try ContentRepository(bundledRoot: original, storageRoot: storage).load()
        let index = try XCTUnwrap(NativeLearningIndex.load(from: persisted))
        XCTAssertEqual(persisted.manifest.revision, "incoming")
        XCTAssertEqual(store.snapshot?.root, persisted.root)
        XCTAssertEqual(store.snapshot?.manifest.revision, persisted.manifest.revision)
        XCTAssertEqual(store.learningIndex?.article_tags, index.article_tags)
        XCTAssertEqual(store.orderedListedArticles.map(\.id), index.chapters.flatMap(\.article_ids))
        XCTAssertEqual(store.bookmarks, [roadmapID])
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), records)
        XCTAssertNil(store.learningError)
        XCTAssertFalse(store.isLoading)
    }

    func testBundledPreviewPreservesImportedSelectionAndSelectionUsesAllManifestFields() throws {
        let bundled = try fixture("activation-bundle", revision: "same")
        let changed = NativeDocument(schema_version: 1, article_id: "example", source_sha256: article().source_sha256,
            blocks: [NativeBlock(id: "heading", type: "heading", heading_id: "intro", level: 2,
                                 inlines: [NativeInline(type: "text", text: "導入")]),
                     NativeBlock(id: "changed", type: "paragraph", inlines: [NativeInline(type: "text", text: "別の本文")])])
        let imported = try fixture("activation-import", revision: "same", document: changed)
        let storage = directory.appendingPathComponent("activation-selection-storage")
        let repository = ContentRepository(bundledRoot: bundled, storageRoot: storage)
        let accepted = try repository.install(from: imported)
        let pointerURL = storage.appendingPathComponent("current.json")
        let pointer = try Data(contentsOf: pointerURL)
        let preview = try repository.previewBundledContent()
        XCTAssertEqual(preview.currentArticleCount, 1)
        XCTAssertEqual(preview.bundledArticleCount, 1)
        XCTAssertEqual(preview.currentRevision, preview.bundledRevision)
        XCTAssertFalse(preview.isAlreadyActive, "Equal opaque revisions must not hide changed document digests")
        XCTAssertEqual(try Data(contentsOf: pointerURL), pointer)
        XCTAssertEqual(try repository.load().root, accepted.root, "Ordinary load still prefers the import")
        let selected = try repository.activateBundledContent()
        XCTAssertFalse(selected.alreadyActive)
        XCTAssertNotEqual(selected.snapshot.root, accepted.root)
        XCTAssertEqual(try selected.snapshot.document(for: article()), document())
        XCTAssertEqual(try accepted.document(for: article()), changed, "Earlier readers retain their old package")
        let selectedPointer = try Data(contentsOf: pointerURL)
        let selectedRoot = selected.snapshot.root
        let again = try repository.activateBundledContent()
        XCTAssertTrue(again.alreadyActive)
        XCTAssertEqual(again.snapshot.root, selectedRoot)
        XCTAssertEqual(try Data(contentsOf: pointerURL), selectedPointer)
        XCTAssertEqual(try FileManager.default.contentsOfDirectory(atPath: storage.appendingPathComponent("versions").path).count, 2)
    }

    func testEquivalentBundledSelectionIgnoresManifestFormattingAndCreatesNoDuplicate() throws {
        let bundled = try fixture("activation-equivalent-bundle")
        let imported = directory.appendingPathComponent("activation-equivalent-import")
        try FileManager.default.copyItem(at: bundled, to: imported)
        let manifestURL = imported.appendingPathComponent("manifest.json")
        let object = try JSONSerialization.jsonObject(with: Data(contentsOf: manifestURL))
        try JSONSerialization.data(withJSONObject: object, options: [.prettyPrinted, .sortedKeys]).write(to: manifestURL)
        let storage = directory.appendingPathComponent("activation-equivalent-storage")
        let repository = ContentRepository(bundledRoot: bundled, storageRoot: storage)
        XCTAssertTrue(try repository.activateBundledContent().alreadyActive)
        XCTAssertFalse(FileManager.default.fileExists(atPath: storage.path), "Fresh bundled selection needs no import copy")
        let installed = try repository.install(from: imported)
        let pointerURL = storage.appendingPathComponent("current.json")
        let pointer = try Data(contentsOf: pointerURL)
        XCTAssertTrue(try repository.previewBundledContent().isAlreadyActive)
        let selected = try repository.activateBundledContent()
        XCTAssertTrue(selected.alreadyActive)
        XCTAssertEqual(selected.snapshot.root, installed.root)
        XCTAssertEqual(try Data(contentsOf: pointerURL), pointer)
        XCTAssertEqual(try FileManager.default.contentsOfDirectory(atPath: storage.appendingPathComponent("versions").path).count, 1)
    }

    func testBundledActivationFailuresPreservePointerAndEarlierPackage() throws {
        let bundled = try fixture("activation-failure-bundle", revision: "bundled")
        let imported = try fixture("activation-failure-import", revision: "imported")
        let storage = directory.appendingPathComponent("activation-failure-storage")
        let repository = ContentRepository(bundledRoot: bundled, storageRoot: storage)
        let installed = try repository.install(from: imported)
        let pointerURL = storage.appendingPathComponent("current.json")
        let pointer = try Data(contentsOf: pointerURL)
        let failing = ContentRepository(bundledRoot: bundled, storageRoot: storage,
            writePointer: { _, _ in throw CocoaError(.fileWriteNoPermission) })
        XCTAssertThrowsError(try failing.activateBundledContent())
        XCTAssertEqual(try Data(contentsOf: pointerURL), pointer)
        XCTAssertEqual(try repository.load().root, installed.root)
        XCTAssertEqual(try FileManager.default.contentsOfDirectory(atPath: storage.appendingPathComponent("versions").path).count, 1)
        for scenario in futureSchemaCases {
            let invalid = try futurePackage("activation-future-\(scenario.name)", manifestSchema: scenario.manifest,
                                            documentSchema: scenario.document)
            let invalidRepository = ContentRepository(bundledRoot: invalid, storageRoot: storage)
            XCTAssertThrowsError(try invalidRepository.previewBundledContent())
            XCTAssertThrowsError(try invalidRepository.activateBundledContent())
            XCTAssertEqual(try invalidRepository.load().root, installed.root)
            XCTAssertEqual(try Data(contentsOf: pointerURL), pointer)
        }
        let testing = try readerTestPackage("activation-fixture-bundle")
        XCTAssertThrowsError(try ContentRepository(bundledRoot: testing, storageRoot: storage).activateBundledContent())
        try Data("broken".utf8).write(to: bundled.appendingPathComponent("articles/example.json"))
        XCTAssertThrowsError(try repository.previewBundledContent())
        XCTAssertThrowsError(try repository.activateBundledContent())
        XCTAssertEqual(try Data(contentsOf: pointerURL), pointer)
        XCTAssertEqual(try repository.load().root, installed.root)
    }

    @MainActor
    func testStoreBundledSelectionKeepsRecordsAndSwitchesSnapshotAndIndexTogether() async throws {
        let original = try fixture("activation-store-original", revision: "old")
        let bundled = try learningPackage("activation-store-bundled", revision: "new")
        let storage = directory.appendingPathComponent("activation-store-storage")
        _ = try ContentRepository(bundledRoot: original, storageRoot: storage).install(from: original)
        let suite = "ailibrary-bundle-switch-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark("example")
        reading.toggleBookmark("missing-id")
        reading.record(articleID: "example", heading: "intro", fraction: 0.45, blockID: "paragraph")
        let records = try XCTUnwrap(defaults.data(forKey: "library.reading.v1"))
        let store = LibraryStore(reading: reading, bundledRoot: bundled, storageRoot: storage)
        await store.load()
        XCTAssertEqual(store.snapshot?.manifest.revision, "old")
        XCTAssertNil(store.learningIndex)
        let previewResult = await store.previewBundledContent()
        let preview = try XCTUnwrap(previewResult)
        XCTAssertEqual(preview.currentArticleCount, 1)
        XCTAssertEqual(preview.bundledArticleCount, 2)
        XCTAssertFalse(preview.isAlreadyActive)
        XCTAssertEqual(store.snapshot?.manifest.revision, "old", "Preview must never activate")
        let selected = await store.activateBundledContent()
        XCTAssertTrue(selected)
        XCTAssertEqual(store.snapshot?.manifest.revision, "new")
        XCTAssertNotNil(store.learningIndex)
        XCTAssertEqual(store.lastArticleID, "example", "An unavailable last article remains recorded")
        XCTAssertEqual(store.bookmarks, ["example", "missing-id"])
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), records)
        let reopened = LibraryStore(reading: ReadingStore(defaults: defaults), bundledRoot: bundled, storageRoot: storage)
        await reopened.load()
        XCTAssertEqual(reopened.snapshot?.root, store.snapshot?.root)
        XCTAssertNotNil(reopened.learningIndex)
        let oldBinary = LibraryStore(reading: ReadingStore(defaults: defaults), bundledRoot: original, storageRoot: storage)
        await oldBinary.load()
        XCTAssertNotNil(oldBinary.learningIndex, "A binary's bundle must not silently override its saved content")
        let restored = await oldBinary.activateBundledContent()
        XCTAssertTrue(restored)
        XCTAssertEqual(oldBinary.snapshot?.manifest.revision, "old")
        XCTAssertNil(oldBinary.learningIndex)
        XCTAssertNil(oldBinary.learningError)
        XCTAssertEqual(oldBinary.reading.position(for: article()).fraction, 0.45)
        XCTAssertEqual(oldBinary.bookmarks, ["example", "missing-id"])
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), records)
    }

    @MainActor
    func testStoreMissingContentBundledPreviewExplainsUnavailableBodyWithoutChangingRecords() async throws {
        let suite = "ailibrary-bundled-preview-missing-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark("example")
        reading.record(articleID: "example", heading: "intro", fraction: 0.35)
        let records = try XCTUnwrap(defaults.data(forKey: "library.reading.v1"))
        let storage = directory.appendingPathComponent("activation-preview-missing-storage")
        let store = LibraryStore(reading: reading, bundledRoot: directory.appendingPathComponent("missing-bundle"), storageRoot: storage)
        await store.load()
        XCTAssertNil(store.snapshot)
        let initialError = try XCTUnwrap(store.loadError)
        let preview = await store.previewBundledContent()
        XCTAssertNil(preview)
        XCTAssertNil(store.snapshot)
        XCTAssertNil(store.learningIndex)
        XCTAssertEqual(store.loadError, initialError)
        XCTAssertFalse(store.isLoading)
        let message = try XCTUnwrap(store.message)
        XCTAssertTrue(message.contains("コンテンツはまだ読み込まれていません。"))
        XCTAssertTrue(message.contains("別のフォルダを選ぶか、再試行してください。"))
        XCTAssertFalse(message.contains("現在のコンテンツを引き続き利用できます。"))
        XCTAssertEqual(store.bookmarks, ["example"])
        XCTAssertEqual(store.lastArticleID, "example")
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), records)
        XCTAssertFalse(FileManager.default.fileExists(atPath: storage.path))
    }

    @MainActor
    func testStoreBundledPreviewAndSelectionFailurePreservePublishedContentAndRecords() async throws {
        let bundled = try fixture("activation-store-broken-bundle")
        let imported = try learningPackage("activation-store-good-import", revision: "accepted")
        let storage = directory.appendingPathComponent("activation-store-broken-storage")
        _ = try ContentRepository(bundledRoot: bundled, storageRoot: storage).install(from: imported)
        try Data("broken".utf8).write(to: bundled.appendingPathComponent("articles/example.json"))
        let suite = "ailibrary-bundle-failure-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark(roadmapID)
        let records = try XCTUnwrap(defaults.data(forKey: "library.reading.v1"))
        let store = LibraryStore(reading: reading, bundledRoot: bundled, storageRoot: storage)
        await store.load()
        let accepted = try XCTUnwrap(store.snapshot)
        let pointer = try Data(contentsOf: storage.appendingPathComponent("current.json"))
        let preview = await store.previewBundledContent()
        XCTAssertNil(preview)
        XCTAssertNotNil(store.message)
        let selected = await store.activateBundledContent()
        XCTAssertFalse(selected)
        XCTAssertEqual(store.snapshot?.root, accepted.root)
        XCTAssertNotNil(store.learningIndex)
        XCTAssertNil(store.learningError)
        XCTAssertEqual(try Data(contentsOf: storage.appendingPathComponent("current.json")), pointer)
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), records)
        XCTAssertFalse(store.isLoading)
    }

    @MainActor
    func testStoreBundledSelectionRejectsAlreadyCancelledEntryAndFixtureLibrary() async throws {
        let bundled = try learningPackage("activation-cancel-bundle", revision: "new")
        let old = try fixture("activation-cancel-old", revision: "old")
        let storage = directory.appendingPathComponent("activation-cancel-storage")
        _ = try ContentRepository(bundledRoot: bundled, storageRoot: storage).install(from: old)
        let suite = "ailibrary-bundle-cancel-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let store = LibraryStore(reading: ReadingStore(defaults: defaults), bundledRoot: bundled, storageRoot: storage)
        await store.load()
        let pointer = try Data(contentsOf: storage.appendingPathComponent("current.json"))
        let task = Task { @MainActor in
            withUnsafeCurrentTask { $0?.cancel() }
            let preview = await store.previewBundledContent()
            let selected = await store.activateBundledContent()
            XCTAssertNil(preview)
            XCTAssertFalse(selected)
        }
        await task.value
        XCTAssertFalse(Task.isCancelled)
        XCTAssertEqual(store.snapshot?.manifest.revision, "old")
        XCTAssertEqual(try Data(contentsOf: storage.appendingPathComponent("current.json")), pointer)
        let fixtureStorage = directory.appendingPathComponent("activation-disabled-test-storage")
        let testing = LibraryStore(reading: ReadingStore(defaults: defaults), bundledRoot: try readerTestPackage("activation-disabled-test"),
                                   isTestLibrary: true, storageRoot: fixtureStorage)
        await testing.load()
        XCTAssertFalse(testing.allowsBundledContentActivation)
        let preview = await testing.previewBundledContent()
        let selected = await testing.activateBundledContent()
        XCTAssertNil(preview)
        XCTAssertFalse(selected)
        XCTAssertFalse(FileManager.default.fileExists(atPath: fixtureStorage.path))
        XCTAssertEqual(testing.snapshot?.manifest.revision, "reader-test")
    }

    @MainActor
    func testStoreCancelledAfterBundledSelectionStartsPublishesCommittedIndexAndSnapshot() async throws {
        let bundled = try learningPackage("activation-running-bundle", revision: "new")
        let old = try fixture("activation-running-old", revision: "old")
        let storage = directory.appendingPathComponent("activation-running-storage")
        _ = try ContentRepository(bundledRoot: bundled, storageRoot: storage).install(from: old)
        let suite = "ailibrary-bundle-running-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark("example")
        let records = try XCTUnwrap(defaults.data(forKey: "library.reading.v1"))
        let store = LibraryStore(reading: reading, bundledRoot: bundled, storageRoot: storage)
        await store.load()
        var cancelNext = true
        var cancelled = false
        let subscription = store.objectWillChange.sink {
            guard cancelNext else { return }
            cancelNext = false
            withUnsafeCurrentTask { current in
                current?.cancel()
                cancelled = current?.isCancelled == true
            }
        }
        let task = Task { @MainActor in await store.activateBundledContent() }
        let selected = await task.value
        subscription.cancel()
        XCTAssertTrue(selected)
        XCTAssertTrue(cancelled)
        XCTAssertFalse(Task.isCancelled)
        let persisted = try ContentRepository(bundledRoot: bundled, storageRoot: storage).load()
        let index = try XCTUnwrap(NativeLearningIndex.load(from: persisted))
        XCTAssertEqual(persisted.manifest.revision, "new")
        XCTAssertEqual(store.snapshot?.root, persisted.root)
        XCTAssertEqual(store.learningIndex?.article_tags, index.article_tags)
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), records)
        XCTAssertFalse(store.isLoading)
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
    func testLoadFailureCanRetryAfterRepairWithoutChangingReadingState() async throws {
        let bundled = try fixture("load-retry-bundle")
        let bodyURL = bundled.appendingPathComponent("articles/example.json")
        let originalBody = try Data(contentsOf: bodyURL)
        try Data("damaged body".utf8).write(to: bodyURL)
        let suite = "ailibrary-load-retry-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark("example")
        reading.record(articleID: "example", heading: "intro", fraction: 0.42, blockID: "paragraph")
        let records = try XCTUnwrap(defaults.data(forKey: "library.reading.v1"))
        let storage = directory.appendingPathComponent("load-retry-storage")
        let store = LibraryStore(reading: reading, bundledRoot: bundled, storageRoot: storage)

        await store.load()
        XCTAssertNil(store.snapshot)
        XCTAssertFalse(store.isLoading)
        XCTAssertFalse(try XCTUnwrap(store.loadError).isEmpty)
        XCTAssertNil(store.message, "Initial-load failure belongs to the persistent retry view, not the import alert")
        XCTAssertEqual(store.bookmarks, ["example"])
        XCTAssertEqual(store.lastArticleID, "example")
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), records)
        await store.load()
        XCTAssertNil(store.snapshot)
        XCTAssertNotNil(store.loadError)
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), records)

        try originalBody.write(to: bodyURL)
        await store.load()
        let restored = try XCTUnwrap(store.snapshot)
        XCTAssertEqual(restored.manifest.revision, "v1")
        XCTAssertEqual(try restored.document(for: article()), document())
        XCTAssertNil(store.loadError)
        XCTAssertFalse(store.isLoading)
        XCTAssertNil(store.message)
        XCTAssertEqual(store.bookmarks, ["example"])
        XCTAssertEqual(store.lastArticleID, "example")
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), records)
        XCTAssertFalse(FileManager.default.fileExists(atPath: storage.path), "Retry does not replace or delete stored versions")
    }

    @MainActor
    func testImportRecoversInitialLoadFailureAndKeepsCurrentContentOnFailure() async throws {
        let suite = "ailibrary-load-import-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark("example")
        reading.record(articleID: "example", heading: "intro", fraction: 0.25, blockID: "paragraph")
        let records = try XCTUnwrap(defaults.data(forKey: "library.reading.v1"))
        let storage = directory.appendingPathComponent("load-import-storage")
        let store = LibraryStore(reading: reading, bundledRoot: directory.appendingPathComponent("missing-content"), storageRoot: storage)
        await store.load()
        XCTAssertNil(store.snapshot)
        let initialError = try XCTUnwrap(store.loadError)

        let broken = try fixture("load-import-broken")
        try Data("damaged body".utf8).write(to: broken.appendingPathComponent("articles/example.json"))
        await store.install(from: broken)
        XCTAssertNil(store.snapshot)
        XCTAssertEqual(store.loadError, initialError)
        XCTAssertFalse(store.isLoading)
        let failureMessage = try XCTUnwrap(store.message)
        XCTAssertTrue(failureMessage.contains("コンテンツはまだ読み込まれていません。"))
        XCTAssertTrue(failureMessage.contains("再試行してください。"))
        XCTAssertFalse(failureMessage.contains("現在のコンテンツを引き続き利用できます。"))
        XCTAssertEqual(store.bookmarks, ["example"])
        XCTAssertEqual(store.lastArticleID, "example")
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), records)
        XCTAssertFalse(FileManager.default.fileExists(atPath: storage.path))

        let source = try fixture("load-import-source", revision: "imported")
        await store.install(from: source)
        let accepted = try XCTUnwrap(store.snapshot)
        XCTAssertEqual(accepted.manifest.revision, "imported")
        XCTAssertNil(store.loadError)
        XCTAssertNotNil(store.message)
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), records)
        let pointerURL = storage.appendingPathComponent("current.json")
        let pointer = try Data(contentsOf: pointerURL)
        try Data("damaged body".utf8).write(to: source.appendingPathComponent("articles/example.json"))
        await store.install(from: source)
        XCTAssertEqual(store.snapshot?.root, accepted.root)
        XCTAssertEqual(store.snapshot?.manifest.revision, "imported")
        XCTAssertEqual(try accepted.document(for: article()), document())
        XCTAssertNil(store.loadError)
        XCTAssertTrue(try XCTUnwrap(store.message).contains("現在のコンテンツを引き続き利用できます。"))
        XCTAssertEqual(try Data(contentsOf: pointerURL), pointer)
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), records)
        XCTAssertFalse(store.isLoading)
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

    @MainActor
    func testRepeatedImportsRetainEverySnapshotAndItsLateReadAsset() async throws {
        let bundled = try fixture("retention-bundle", revision: "bundled")
        let revisions = ["A", "B", "C"]
        let sources = try revisions.map { try retentionPackage("retention-source-" + $0, revision: $0) }
        let storage = directory.appendingPathComponent("retention-storage")
        let repository = ContentRepository(bundledRoot: bundled, storageRoot: storage)
        let defaults = try retentionDefaults()
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark("example")
        reading.toggleBookmark("removed-id")
        reading.record(articleID: "example", heading: "intro", fraction: 0.37, blockID: "paragraph")
        let records = try XCTUnwrap(defaults.data(forKey: "library.reading.v1"))
        let snapshots = try sources.map { try repository.install(from: $0) }
        let latest = try XCTUnwrap(snapshots.last)
        let pointerURL = storage.appendingPathComponent("current.json")
        let pointer = try Data(contentsOf: pointerURL)
        XCTAssertEqual(Set(try FileManager.default.contentsOfDirectory(atPath: storage.appendingPathComponent("versions").path)),
                       Set(snapshots.map { $0.root.lastPathComponent }))
        XCTAssertEqual(try repository.load().root, latest.root)
        // These are disk reads after all activations; no UIKit image cache is used.
        for (revision, snapshot) in zip(revisions, snapshots) {
            let path = "assets/late-\(revision).png"
            let kept = try snapshot.document(for: article())
            XCTAssertEqual(kept.blocks.first(where: { $0.id == "paragraph" })?.inlines?.first?.text, "本文 \(revision)")
            XCTAssertEqual(try Data(contentsOf: snapshot.root.appendingPathComponent(path)), pixel)
            XCTAssertEqual(try ContentValidator.sha256(at: snapshot.root.appendingPathComponent(path)), snapshot.manifest.files[path])
            for other in revisions where other != revision {
                XCTAssertFalse(FileManager.default.fileExists(atPath: snapshot.root.appendingPathComponent("assets/late-\(other).png").path))
            }
        }
        let reopened = LibraryStore(reading: ReadingStore(defaults: defaults), bundledRoot: bundled, storageRoot: storage)
        await reopened.load()
        XCTAssertEqual(reopened.snapshot?.root, latest.root)
        XCTAssertEqual(try Data(contentsOf: pointerURL), pointer)
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), records)
    }

    @MainActor
    func testLoadAndRetryIgnoreOrphanStagingAndUnreferencedValidVersionWithoutMutation() async throws {
        let bundled = try fixture("orphan-bundle", revision: "bundled")
        let source = try retentionPackage("orphan-current", revision: "current")
        let later = try retentionPackage("orphan-later", revision: "unreferenced-newer")
        let storage = directory.appendingPathComponent("orphan-storage")
        let repository = ContentRepository(bundledRoot: bundled, storageRoot: storage)
        let current = try repository.install(from: source)
        let versions = storage.appendingPathComponent("versions")
        let staging = versions.appendingPathComponent(".staging-" + UUID().uuidString)
        let unreferenced = versions.appendingPathComponent(UUID().uuidString)
        try FileManager.default.copyItem(at: later, to: staging)
        try FileManager.default.copyItem(at: later, to: unreferenced)
        XCTAssertEqual(try ContentValidator.validate(root: unreferenced).manifest.revision, "unreferenced-newer")
        let defaults = try retentionDefaults()
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark("example")
        reading.record(articleID: "example", heading: "intro", fraction: 0.62, blockID: "paragraph")
        let records = try XCTUnwrap(defaults.data(forKey: "library.reading.v1"))
        let before = try retentionInventory(storage)
        let names = Set(try FileManager.default.contentsOfDirectory(atPath: versions.path))
        let store = LibraryStore(reading: reading, bundledRoot: bundled, storageRoot: storage)
        await store.load()
        XCTAssertEqual(store.snapshot?.root, current.root)
        await store.retryLoad()
        XCTAssertEqual(store.snapshot?.root, current.root)
        XCTAssertEqual(try retentionInventory(storage), before)
        XCTAssertEqual(Set(try FileManager.default.contentsOfDirectory(atPath: versions.path)), names)
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), records)
        XCTAssertNil(store.loadError)
        XCTAssertFalse(store.isLoading)
    }

    @MainActor
    func testOutOfSpaceAtPointerCommitRemovesOnlyTheFailedAttempt() async throws {
        let bundled = try fixture("out-of-space-bundle", revision: "bundled")
        let first = try retentionPackage("out-of-space-first", revision: "first")
        let second = try retentionPackage("out-of-space-second", revision: "second")
        let incoming = try retentionPackage("out-of-space-incoming", revision: "incoming")
        let storage = directory.appendingPathComponent("out-of-space-storage")
        let repository = ContentRepository(bundledRoot: bundled, storageRoot: storage)
        let old = try repository.install(from: first)
        let current = try repository.install(from: second)
        let versions = storage.appendingPathComponent("versions")
        let orphan = versions.appendingPathComponent(".staging-" + UUID().uuidString)
        try FileManager.default.createDirectory(at: orphan, withIntermediateDirectories: false)
        try Data("partial previous attempt".utf8).write(to: orphan.appendingPathComponent("partial.txt"))
        let defaults = try retentionDefaults()
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark("example")
        reading.record(articleID: "example", heading: "intro", fraction: 0.81, blockID: "paragraph")
        let records = try XCTUnwrap(defaults.data(forKey: "library.reading.v1"))
        let store = LibraryStore(reading: reading, bundledRoot: bundled, storageRoot: storage)
        await store.load()
        let before = try retentionInventory(storage)
        let names = Set(try FileManager.default.contentsOfDirectory(atPath: versions.path))
        var attemptedDestination: URL?
        let failing = ContentRepository(bundledRoot: bundled, storageRoot: storage, writePointer: { data, url in
            XCTAssertEqual(url, storage.appendingPathComponent("current.json"))
            let pointer = try JSONDecoder().decode([String: String].self, from: data)
            let id = try XCTUnwrap(pointer["directory"])
            XCTAssertNotNil(UUID(uuidString: id))
            let destination = versions.appendingPathComponent(id)
            attemptedDestination = destination
            XCTAssertEqual(try ContentValidator.validate(root: destination).manifest.revision, "incoming",
                           "Failure must occur after the complete destination is installed, before pointer commit")
            throw CocoaError(.fileWriteOutOfSpace)
        })
        XCTAssertThrowsError(try failing.install(from: incoming)) { error in
            XCTAssertEqual((error as NSError).domain, NSCocoaErrorDomain)
            XCTAssertEqual((error as NSError).code, CocoaError.Code.fileWriteOutOfSpace.rawValue)
        }
        let failedRoot = try XCTUnwrap(attemptedDestination)
        XCTAssertFalse(FileManager.default.fileExists(atPath: failedRoot.path))
        XCTAssertFalse(FileManager.default.fileExists(atPath: versions.appendingPathComponent(".staging-" + failedRoot.lastPathComponent).path))
        XCTAssertEqual(try retentionInventory(storage), before, "Old packages, current pointer and earlier orphan bytes must survive")
        XCTAssertEqual(Set(try FileManager.default.contentsOfDirectory(atPath: versions.path)), names)
        XCTAssertEqual(try repository.load().root, current.root)
        XCTAssertEqual(try Data(contentsOf: old.root.appendingPathComponent("assets/late-first.png")), pixel)
        await store.retryLoad()
        XCTAssertEqual(store.snapshot?.root, current.root)
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), records)
        XCTAssertFalse(store.isLoading)
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

    private func recoveryDefaults() throws -> UserDefaults {
        let suite = "library-reading-recovery-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        addTeardownBlock { UserDefaults(suiteName: suite)?.removePersistentDomain(forName: suite) }
        return defaults
    }

    func testReadingRecoveryKeepsReadableElementsAndLiveChangesBeforeExplicitRecovery() throws {
        let defaults = try recoveryDefaults(), key = "library.reading.v1"
        let original = Data("""
        {"bookmarks":["example",7,"other",null],"positions":{
          "example":{"heading":"intro","fraction":0.42,"blockID":"paragraph"},
          "broken":[1],"other":{"fraction":0.8}},"lastArticleID":"other"}
        """.utf8)
        defaults.set(original, forKey: key)
        let reading = ReadingStore(defaults: defaults)
        XCTAssertEqual(reading.recoveryIssue, .partial)
        XCTAssertEqual(reading.bookmarks, ["example", "other"])
        XCTAssertEqual(reading.position(for: article()).fraction, 0.42)
        XCTAssertEqual(reading.position(for: article(id: "other")).fraction, 0.8)
        reading.toggleBookmark("example")
        reading.toggleBookmark("live")
        reading.markOpened("live")
        reading.record(articleID: "live", heading: "intro", fraction: 0.6, blockID: "actual")
        XCTAssertEqual(defaults.data(forKey: key), original, "Reads and live changes must leave the source untouched")
        XCTAssertNil(defaults.object(forKey: key + ".recovery.v1"))
        XCTAssertEqual(reading.bookmarks, ["other", "live"])
        XCTAssertTrue(reading.recoverReadableState())
        XCTAssertNil(reading.recoveryIssue)
        XCTAssertEqual(defaults.data(forKey: key + ".recovery.v1"), original)
        let restored = ReadingStore(defaults: defaults)
        XCTAssertNil(restored.recoveryIssue)
        XCTAssertEqual(restored.bookmarks, ["other", "live"])
        XCTAssertEqual(restored.lastArticleID, "live")
        XCTAssertEqual(restored.position(for: article(id: "live")).fraction, 0.6)
        XCTAssertEqual(restored.position(for: article(id: "live")).blockID, "actual")
        XCTAssertEqual(restored.position(for: article(id: "other")).fraction, 0.8)
        restored.toggleBookmark("after")
        XCTAssertTrue(ReadingStore(defaults: defaults).bookmarks.contains("after"), "Normal persistence resumes")
        XCTAssertEqual(defaults.data(forKey: key + ".recovery.v1"), original)
    }

    func testReadingRecoveryKeepsValidPositionFieldsAndIndependentCollections() throws {
        let defaults = try recoveryDefaults(), key = "library.reading.v1"
        let originals = [
            "{\"bookmarks\":{},\"positions\":{\"example\":{\"heading\":\"intro\",\"fraction\":0.4}},\"lastArticleID\":\"example\"}",
            "{\"bookmarks\":[\"example\"],\"positions\":{\"example\":{\"heading\":\"intro\",\"fraction\":\"bad\",\"blockID\":\"paragraph\"},\"other\":{\"fraction\":0.8}},\"lastArticleID\":9}",
            "{\"bookmarks\":[\"example\"],\"positions\":[],\"lastArticleID\":\"example\"}"
        ]
        for json in originals {
            let original = Data(json.utf8)
            defaults.set(original, forKey: key)
            let reading = ReadingStore(defaults: defaults)
            XCTAssertEqual(reading.recoveryIssue, .partial)
            if json.contains("0.4") {
                XCTAssertEqual(reading.position(for: article()).fraction, 0.4)
                XCTAssertEqual(reading.lastArticleID, "example")
            } else if json.contains("bad") {
                XCTAssertEqual(reading.bookmarks, ["example"])
                XCTAssertEqual(reading.position(for: article()).heading, "intro")
                XCTAssertEqual(reading.position(for: article()).blockID, "paragraph")
                XCTAssertEqual(reading.position(for: article()).fraction, 0)
                XCTAssertEqual(reading.position(for: article(id: "other")).fraction, 0.8)
            } else {
                XCTAssertEqual(reading.bookmarks, ["example"])
                XCTAssertEqual(reading.lastArticleID, "example")
            }
            reading.markOpened("live")
            XCTAssertEqual(defaults.data(forKey: key), original)
        }
    }

    func testUnreadableReadingStateRequiresExplicitRecoveryAndPreservesOriginal() throws {
        for json in ["{\"bookmarks\":[", "[]", "null"] {
            let defaults = try recoveryDefaults(), key = "library.reading.v1", original = Data(json.utf8)
            defaults.set(original, forKey: key)
            let reading = ReadingStore(defaults: defaults)
            XCTAssertEqual(reading.recoveryIssue, .unreadable)
            reading.toggleBookmark("live")
            reading.record(articleID: "example", heading: "intro", fraction: 0.5)
            XCTAssertEqual(defaults.data(forKey: key), original)
            XCTAssertTrue(reading.recoverReadableState())
            XCTAssertEqual(defaults.data(forKey: key + ".recovery.v1"), original)
            XCTAssertEqual(ReadingStore(defaults: defaults).bookmarks, ["live"])
            XCTAssertEqual(ReadingStore(defaults: defaults).position(for: article()).fraction, 0.5)
        }
    }

    func testReadingRecoveryNeverOverwritesAnExistingBackupOrDropsLiveEdits() throws {
        let defaults = try recoveryDefaults(), key = "library.reading.v1"
        let original = Data("broken current".utf8), backup = Data("earlier original".utf8)
        defaults.set(original, forKey: key)
        defaults.set(backup, forKey: key + ".recovery.v1")
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark("live")
        XCTAssertFalse(reading.recoverReadableState())
        XCTAssertEqual(reading.recoveryIssue, .backupExists)
        XCTAssertEqual(reading.bookmarks, ["live"])
        reading.markOpened("another")
        XCTAssertEqual(defaults.data(forKey: key), original)
        XCTAssertEqual(defaults.data(forKey: key + ".recovery.v1"), backup)
        XCTAssertFalse(reading.recoverReadableState())
    }

    func testReadingRecoveryFailsClosedWhenBackupReadbackOrMainWriteFails() throws {
        for failure in ["missing-backup", "different-backup", "main-write"] {
            let suite = "library-reading-recovery-failure-" + UUID().uuidString
            let defaults = try XCTUnwrap(ReadingRecoveryWriteDefaults(suiteName: suite))
            defer { defaults.removePersistentDomain(forName: suite) }
            let key = "library.reading.v1", original = Data("original damaged bytes".utf8)
            defaults.set(original, forKey: key)
            let reading = ReadingStore(defaults: defaults)
            reading.toggleBookmark("live")
            if failure == "missing-backup" { defaults.rejectedKey = key + ".recovery.v1" }
            if failure == "different-backup" { defaults.changedBackup = true }
            if failure == "main-write" { defaults.rejectedKey = key }
            XCTAssertFalse(reading.recoverReadableState())
            XCTAssertEqual(reading.recoveryIssue, failure == "main-write" ? .writeFailed : .backupFailed)
            XCTAssertEqual(defaults.data(forKey: key), original)
            XCTAssertEqual(reading.bookmarks, ["live"])
            if failure == "main-write" { XCTAssertEqual(defaults.data(forKey: key + ".recovery.v1"), original) }
        }
    }

    func testReadingRecoveryRefusesAnExternallyChangedSource() throws {
        let defaults = try recoveryDefaults(), key = "library.reading.v1"
        defaults.set(Data("first damaged".utf8), forKey: key)
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark("live")
        let changed = Data("new source".utf8)
        defaults.set(changed, forKey: key)
        XCTAssertFalse(reading.recoverReadableState())
        XCTAssertEqual(reading.recoveryIssue, .changed)
        XCTAssertEqual(reading.bookmarks, ["live"])
        XCTAssertEqual(defaults.data(forKey: key), changed)
        XCTAssertNil(defaults.object(forKey: key + ".recovery.v1"))
    }

    func testReadingRecoveryRechecksTheSourceAfterBackingItUp() throws {
        let suite = "library-reading-recovery-race-" + UUID().uuidString
        let defaults = try XCTUnwrap(ReadingRecoveryWriteDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let key = "library.reading.v1", original = Data("original damaged bytes".utf8)
        defaults.set(original, forKey: key)
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark("live")
        defaults.sourceChangedDuringBackup = key
        XCTAssertFalse(reading.recoverReadableState())
        XCTAssertEqual(reading.recoveryIssue, .changed)
        XCTAssertEqual(reading.bookmarks, ["live"])
        XCTAssertEqual(defaults.data(forKey: key), Data("changed during backup".utf8))
        XCTAssertEqual(defaults.data(forKey: key + ".recovery.v1"), original)
    }

    func testReadingRecoveryProtectsOversizedAndNonDataSourcesWithoutCopyingToBackup() throws {
        let defaults = try recoveryDefaults(), key = "library.reading.v1"
        let large = Data(repeating: 0x20, count: ReadingStore.maximumRecoveryBytes + 1)
        defaults.set(large, forKey: key)
        let oversized = ReadingStore(defaults: defaults)
        XCTAssertEqual(oversized.recoveryIssue, .tooLarge)
        oversized.toggleBookmark("live")
        XCTAssertFalse(oversized.recoverReadableState())
        XCTAssertEqual(defaults.data(forKey: key), large)
        defaults.set(["unexpected": "value"], forKey: key)
        let unsupported = ReadingStore(defaults: defaults)
        XCTAssertEqual(unsupported.recoveryIssue, .unsupported)
        unsupported.markOpened("live")
        XCTAssertFalse(unsupported.recoverReadableState())
        XCTAssertEqual(defaults.dictionary(forKey: key) as? [String: String], ["unexpected": "value"])
        XCTAssertNil(defaults.object(forKey: key + ".recovery.v1"))
    }

    func testReadingRecoveryUsesTheExactCustomNamespace() throws {
        let defaults = try recoveryDefaults(), normalKey = "library.reading.v1", testKey = "reader-test.reading.v1"
        let normal = ReadingStore(defaults: defaults, key: normalKey)
        normal.toggleBookmark("normal")
        normal.record(articleID: "normal", heading: nil, fraction: 0.7)
        let normalBytes = defaults.data(forKey: normalKey), damaged = Data("isolated damaged data".utf8)
        defaults.set(damaged, forKey: testKey)
        let isolated = ReadingStore(defaults: defaults, key: testKey)
        isolated.toggleBookmark("test")
        XCTAssertTrue(isolated.recoverReadableState())
        XCTAssertEqual(defaults.data(forKey: testKey + ".recovery.v1"), damaged)
        XCTAssertNil(defaults.object(forKey: normalKey + ".recovery.v1"))
        XCTAssertEqual(defaults.data(forKey: normalKey), normalBytes)
        XCTAssertEqual(ReadingStore(defaults: defaults, key: normalKey).bookmarks, ["normal"])
        XCTAssertEqual(ReadingStore(defaults: defaults, key: testKey).bookmarks, ["test"])
    }

    func testHealthyLegacyReadingStateAndExistingBackupKeepNormalPersistence() throws {
        let defaults = try recoveryDefaults(), key = "library.reading.v1"
        let legacy = Data("{\"bookmarks\":[\"example\"],\"positions\":{\"example\":{\"heading\":\"intro\",\"fraction\":0.42}},\"lastArticleID\":\"example\"}".utf8)
        defaults.set(legacy, forKey: key)
        let backup = Data("untouched earlier recovery".utf8)
        defaults.set(backup, forKey: key + ".recovery.v1")
        let reading = ReadingStore(defaults: defaults)
        XCTAssertNil(reading.recoveryIssue)
        XCTAssertFalse(reading.recoverReadableState())
        XCTAssertEqual(reading.position(for: article(), document: document()).blockID, "heading")
        reading.toggleBookmark("second")
        reading.record(articleID: "example", heading: "intro", fraction: 0.6, blockID: "paragraph")
        let restored = ReadingStore(defaults: defaults)
        XCTAssertNil(restored.recoveryIssue)
        XCTAssertEqual(restored.bookmarks, ["example", "second"])
        XCTAssertEqual(restored.position(for: article()).fraction, 0.6)
        XCTAssertEqual(restored.position(for: article()).blockID, "paragraph")
        XCTAssertEqual(defaults.data(forKey: key + ".recovery.v1"), backup)
    }

    func testOptionalAnchorFallbackDoesNotBlockLegacyReadingPersistence() throws {
        let defaults = try recoveryDefaults(), key = "library.reading.v1"
        let digest = readingDigest
        let anchors: [(json: String, retainsAnchor: Bool)] = [
            ("{\"version\":2,\"documentDigest\":\"\(digest)\",\"blockFingerprint\":\"\(digest)\"}", false),
            ("{\"version\":1,\"documentDigest\":\"invalid\",\"blockFingerprint\":\"invalid\"}", false),
            ("{\"version\":1,\"documentDigest\":\"\(digest)\",\"blockFingerprint\":\"\(digest)\",\"headingFingerprint\":7}", false),
            ("\"unsupported\"", false),
            ("{\"version\":1,\"documentDigest\":\"\(digest)\",\"blockFingerprint\":\"\(digest)\",\"intraBlockFraction\":\"bad\"}", true)
        ]
        for entry in anchors {
            let json = "{\"bookmarks\":[\"example\"],\"positions\":{\"example\":{\"heading\":\"intro\",\"fraction\":0.42,\"blockID\":\"paragraph\",\"anchor\":\(entry.json)},\"other\":{\"fraction\":0.8}},\"lastArticleID\":\"other\"}"
            defaults.set(Data(json.utf8), forKey: key)
            let reading = ReadingStore(defaults: defaults)
            XCTAssertNil(reading.recoveryIssue, "Optional anchor fallback must not block independently valid legacy records")
            XCTAssertEqual(reading.position(for: article()).anchor != nil, entry.retainsAnchor)
            XCTAssertEqual(reading.position(for: article()).fraction, 0.42)
            XCTAssertEqual(reading.position(for: article()).blockID, "paragraph")
            XCTAssertEqual(reading.bookmarks, ["example"])
            reading.markOpened("example")
            let restored = ReadingStore(defaults: defaults)
            XCTAssertNil(restored.recoveryIssue)
            XCTAssertEqual(restored.lastArticleID, "example")
            XCTAssertEqual(restored.position(for: article(id: "other")).fraction, 0.8)
            XCTAssertNil(defaults.object(forKey: key + ".recovery.v1"))
        }
    }

    @MainActor
    func testLibraryStorePublishesRecoveryIssueAndRetainsLiveState() throws {
        let defaults = try recoveryDefaults(), key = "library.reading.v1", original = Data("broken".utf8)
        defaults.set(original, forKey: key)
        let store = LibraryStore(reading: ReadingStore(defaults: defaults))
        XCTAssertEqual(store.readingRecoveryIssue, .unreadable)
        store.toggleBookmark("example")
        store.record(articleID: "example", heading: "intro", fraction: 0.5)
        XCTAssertEqual(defaults.data(forKey: key), original)
        store.recoverReadingState()
        XCTAssertNil(store.readingRecoveryIssue)
        XCTAssertEqual(store.bookmarks, ["example"])
        XCTAssertEqual(store.lastArticleID, "example")
        XCTAssertEqual(ReadingStore(defaults: defaults).bookmarks, ["example"])
        XCTAssertEqual(defaults.data(forKey: key + ".recovery.v1"), original)
    }

    private var backupDate: Date { Date(timeIntervalSince1970: 1_793_145_600) }
    private func backupData(_ raw: String) throws -> Data {
        try ReadingBackupCodec.encode(rawData: Data(raw.utf8), createdAt: backupDate, appVersion: "0.2.20")
    }

    func testReadingBackupPreservesExactRawAndAllRecordsOutsideTheCurrentPackage() throws {
        let defaults = try recoveryDefaults(), key = "library.reading.v1"
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark("removed/日本語")
        let anchor = try XCTUnwrap(NativeReadingAnchor(documentDigest: readingDigest, blockFingerprint: readingDigest,
                                                       headingFingerprint: readingDigest, intraBlockFraction: 0.25))
        reading.record(articleID: "removed/日本語", heading: "旧見出し", fraction: 0.75, blockID: "old-block", anchor: anchor)
        reading.record(articleID: "another-removed", heading: nil, fraction: 0.1)
        reading.markOpened("opened-without-position")
        let raw = try XCTUnwrap(defaults.data(forKey: key)), priorBackup = Data("prior damaged source".utf8)
        defaults.set(priorBackup, forKey: key + ".recovery.v1")
        defaults.set(55.0, forKey: "ios.audio.example.position")
        let data = try reading.exportBackup(createdAt: backupDate, appVersion: "0.2.20")
        let value = try ReadingBackupCodec.decode(data)
        XCTAssertEqual(value.rawData, raw)
        XCTAssertEqual(value.counts, ReadingBackupCodec.Counts(bookmarks: 1, positions: 2))
        XCTAssertEqual(value.createdAt, "2026-10-28T00:00:00Z")
        XCTAssertEqual(value.appVersion, "0.2.20")
        XCTAssertEqual(defaults.data(forKey: key), raw)
        XCTAssertEqual(defaults.data(forKey: key + ".recovery.v1"), priorBackup)
        XCTAssertEqual(defaults.double(forKey: "ios.audio.example.position"), 55)
        XCTAssertEqual(ReadingStore(defaults: defaults).lastArticleID, "opened-without-position")
    }

    func testReadingBackupDistinguishesMissingKeyFromExplicitEmptyState() throws {
        let defaults = try recoveryDefaults(), key = "library.reading.v1"
        XCTAssertThrowsError(try ReadingStore(defaults: defaults).exportBackup(createdAt: backupDate, appVersion: "0.2.20")) {
            XCTAssertEqual($0 as? ReadingBackupCodec.Failure, .noRecords)
        }
        XCTAssertNil(defaults.object(forKey: key))
        let raw = Data(#"{"bookmarks":[],"positions":{}}"#.utf8)
        defaults.set(raw, forKey: key)
        let data = try ReadingStore(defaults: defaults).exportBackup(createdAt: backupDate, appVersion: "0.2.20")
        XCTAssertEqual(try ReadingBackupCodec.decode(data).rawData, raw)
        XCTAssertEqual(try ReadingBackupCodec.decode(data).counts, ReadingBackupCodec.Counts(bookmarks: 0, positions: 0))
    }

    func testReadingBackupRejectsUnknownMalformedAndDuplicateRawWithoutTolerantFallback() throws {
        let malformed = [
            "{}", "[]", "null", #"{"bookmarks":[]}"#, #"{"positions":{}}"#,
            #"{"bookmarks":[],"positions":{},"future":1}"#,
            #"{"bookmarks":["x",7],"positions":{}}"#,
            #"{"bookmarks":["x","x"],"positions":{}}"#,
            #"{"bookmarks":[],"positions":{},"lastArticleID":5}"#,
            #"{"bookmarks":[],"positions":{"x":{}}}"#,
            #"{"bookmarks":[],"positions":{"x":{"fraction":1.1}}}"#,
            #"{"bookmarks":[],"positions":{"x":{"fraction":true}}}"#,
            #"{"bookmarks":[],"positions":{"x":{"fraction":0.5,"heading":3}}}"#,
            #"{"bookmarks":[],"positions":{"x":{"fraction":0.5,"future":1}}}"#,
            #"{"bookmarks":[],"bookmarks":[],"positions":{}}"#,
            #"{"bookmarks":[],"positions":{"x":{"fraction":0.5},"x":{"fraction":0.4}}}"#,
            #"{"bookmarks":[],"positions":{"x":{"fraction":0.5,"fr\u0061ction":0.4}}}"#
        ]
        for raw in malformed { XCTAssertThrowsError(try backupData(raw), raw) }
        XCTAssertThrowsError(try backupData(#"{"bookmarks":[],"positions":{}} trailing"#))
    }

    func testReadingBackupRejectsFutureAndDamagedAnchorsInsteadOfDroppingMetadata() throws {
        let anchors = [
            "{\"version\":2,\"documentDigest\":\"\(readingDigest)\",\"blockFingerprint\":\"\(readingDigest)\"}",
            "{\"version\":1,\"documentDigest\":\"bad\",\"blockFingerprint\":\"\(readingDigest)\"}",
            "{\"version\":1,\"documentDigest\":\"\(readingDigest)\",\"blockFingerprint\":\"\(readingDigest)\",\"intraBlockFraction\":\"bad\"}",
            "{\"version\":1,\"documentDigest\":\"\(readingDigest)\",\"blockFingerprint\":\"\(readingDigest)\",\"intraBlockFraction\":1.1}",
            "{\"version\":1,\"documentDigest\":\"\(readingDigest)\",\"blockFingerprint\":\"\(readingDigest)\",\"future\":1}"
        ]
        for anchor in anchors {
            let raw = "{\"bookmarks\":[],\"positions\":{\"x\":{\"fraction\":0.5,\"anchor\":\(anchor)}}}"
            XCTAssertThrowsError(try backupData(raw))
        }
    }

    func testReadingBackupStrictEnvelopeRejectsTamperingAndAmbiguousMetadata() throws {
        let good = try backupData(#"{"bookmarks":["x"],"positions":{"x":{"fraction":0.5}}}"#)
        let object = try XCTUnwrap(JSONSerialization.jsonObject(with: good) as? [String: Any])
        let changes: [(String, Any)] = [
            ("format", "other"), ("schemaVersion", 2), ("scope", "reader-test"),
            ("createdAt", "2026-10-28T01:00:00+01:00"), ("appVersion", ""),
            ("rawBase64", "not base64"), ("rawBase64", Data("{}".utf8).base64EncodedString()),
            ("sha256", String(repeating: "0", count: 64)), ("counts", ["bookmarks": 0, "positions": 1]),
            ("counts", ["bookmarks": 1, "positions": 1, "future": 0]), ("future", 1)
        ]
        for (key, value) in changes {
            var changed = object; changed[key] = value
            XCTAssertThrowsError(try ReadingBackupCodec.decode(JSONSerialization.data(withJSONObject: changed)), key)
        }
        var missing = object; missing.removeValue(forKey: "counts")
        XCTAssertThrowsError(try ReadingBackupCodec.decode(JSONSerialization.data(withJSONObject: missing)))
        let text = try XCTUnwrap(String(data: good, encoding: .utf8))
        XCTAssertThrowsError(try ReadingBackupCodec.decode(Data(("{\"schemaVersion\":1," + text.dropFirst()).utf8)))
    }

    func testReadingBackupRawAndEnvelopeBudgetsIncludeExactBoundaries() throws {
        let small = Data(#"{"bookmarks":[],"positions":{}}"#.utf8)
        var raw = small
        raw.append(Data(repeating: 0x20, count: ReadingBackupCodec.maximumRawBytes - raw.count))
        let encoded = try ReadingBackupCodec.encode(rawData: raw, createdAt: backupDate, appVersion: "0.2.20")
        XCTAssertEqual(try ReadingBackupCodec.decode(encoded).rawData, raw)
        raw.append(0x20)
        XCTAssertThrowsError(try ReadingBackupCodec.encode(rawData: raw, createdAt: backupDate, appVersion: "0.2.20")) {
            XCTAssertEqual($0 as? ReadingBackupCodec.Failure, .tooLarge)
        }
        var envelope = encoded
        envelope.append(Data(repeating: 0x20, count: ReadingBackupCodec.maximumEnvelopeBytes - envelope.count))
        XCTAssertEqual(try ReadingBackupCodec.decode(envelope).rawData.count, ReadingBackupCodec.maximumRawBytes)
        envelope.append(0x20)
        XCTAssertThrowsError(try ReadingBackupCodec.decode(envelope)) {
            XCTAssertEqual($0 as? ReadingBackupCodec.Failure, .tooLarge)
        }
    }

    @MainActor
    func testReadingBackupUsesOnlyBoundNamespaceAndFixtureStoreCannotExport() throws {
        let defaults = try recoveryDefaults(), normalKey = "library.reading.v1", otherKey = "custom.reading.v1"
        let normal = ReadingStore(defaults: defaults, key: normalKey)
        normal.toggleBookmark("normal")
        let isolated = ReadingStore(defaults: defaults, key: otherKey)
        isolated.toggleBookmark("isolated")
        let before = defaults.data(forKey: normalKey), otherBefore = defaults.data(forKey: otherKey)
        let data = try isolated.exportBackup(createdAt: backupDate, appVersion: "0.2.20")
        XCTAssertEqual(try ReadingBackupCodec.decode(data).rawData, otherBefore)
        let fixture = LibraryStore(reading: isolated, isTestLibrary: true)
        XCTAssertFalse(fixture.allowsReadingBackup)
        XCTAssertThrowsError(try fixture.exportReadingBackup(createdAt: backupDate, appVersion: "0.2.20")) {
            XCTAssertEqual($0 as? ReadingBackupCodec.Failure, .unsupportedScope)
        }
        let store = LibraryStore(reading: normal)
        XCTAssertTrue(store.allowsReadingBackup)
        XCTAssertEqual(try ReadingBackupCodec.decode(store.exportReadingBackup(createdAt: backupDate, appVersion: "0.2.20")).rawData, before)
        XCTAssertEqual(defaults.data(forKey: normalKey), before)
        XCTAssertEqual(defaults.data(forKey: otherKey), otherBefore)
        XCTAssertNil(defaults.object(forKey: normalKey + ".recovery.v1"))
        XCTAssertNil(defaults.object(forKey: otherKey + ".recovery.v1"))
    }

    func testReadingBackupRefusesRecoveryStateAndDoesNotTryDefaultsWrites() throws {
        let suite = "library-reading-backup-" + UUID().uuidString
        let defaults = try XCTUnwrap(ReadingBackupProbeDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let key = "library.reading.v1", raw = Data(#"{"bookmarks":["x"],"positions":{}}"#.utf8)
        defaults.set(raw, forKey: key)
        let reading = ReadingStore(defaults: defaults)
        defaults.writeCalls = 0
        _ = try reading.exportBackup(createdAt: backupDate, appVersion: "0.2.20")
        XCTAssertEqual(defaults.writeCalls, 0)
        for damaged in [Data("broken".utf8), Data(#"{"bookmarks":["x",7],"positions":{}}"#.utf8)] {
            defaults.set(damaged, forKey: key)
            let invalid = ReadingStore(defaults: defaults)
            defaults.writeCalls = 0
            XCTAssertThrowsError(try invalid.exportBackup(createdAt: backupDate, appVersion: "0.2.20")) {
                XCTAssertEqual($0 as? ReadingBackupCodec.Failure, .unavailable)
            }
            XCTAssertEqual(defaults.writeCalls, 0)
            XCTAssertEqual(defaults.data(forKey: key), damaged)
            XCTAssertNil(defaults.object(forKey: key + ".recovery.v1"))
        }
    }

    func testReadingBackupRefusesChangedPersistedBytesWithoutOverwritingTheNewSource() throws {
        let suite = "library-reading-backup-race-" + UUID().uuidString
        let defaults = try XCTUnwrap(ReadingBackupProbeDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let key = "library.reading.v1", raw = Data(#"{"bookmarks":["old"],"positions":{}}"#.utf8)
        let changed = Data(#"{"bookmarks":["new"],"positions":{}}"#.utf8)
        defaults.set(raw, forKey: key)
        let reading = ReadingStore(defaults: defaults)
        defaults.watchedKey = key; defaults.replacementAfterRead = changed; defaults.writeCalls = 0
        XCTAssertThrowsError(try reading.exportBackup(createdAt: backupDate, appVersion: "0.2.20")) {
            XCTAssertEqual($0 as? ReadingBackupCodec.Failure, .changed)
        }
        XCTAssertEqual(defaults.data(forKey: key), changed)
        XCTAssertEqual(defaults.writeCalls, 0)
        XCTAssertNil(defaults.object(forKey: key + ".recovery.v1"))
    }

    private func suspensionDefaults() throws -> ReadingSaveSuspensionProbeDefaults {
        let suite = "library-reading-export-suspension-" + UUID().uuidString
        let defaults = try XCTUnwrap(ReadingSaveSuspensionProbeDefaults(suiteName: suite))
        addTeardownBlock { UserDefaults(suiteName: suite)?.removePersistentDomain(forName: suite) }
        return defaults
    }
    private func suspensionRaw(_ id: String) throws -> Data {
        try JSONSerialization.data(withJSONObject: ["bookmarks": [id], "positions": [:], "lastArticleID": id], options: [.sortedKeys])
    }
    private func assertSuspendedEditsPreserveSource(_ reading: ReadingStore, defaults: ReadingSaveSuspensionProbeDefaults,
                                                   current: Any?, recovery: Data) throws {
        let key = "library.reading.v1"
        let bookmarks = reading.bookmarks, lastArticle = reading.lastArticleID
        defaults.setKeys.removeAll()
        reading.toggleBookmark("must-not-save"); reading.markOpened("must-not-save")
        reading.record(articleID: "must-not-save", heading: "new", fraction: 0.8)
        XCTAssertFalse(reading.recoverReadableState())
        XCTAssertThrowsError(try reading.exportBackup(createdAt: backupDate, appVersion: "0.2.20")) {
            XCTAssertEqual($0 as? ReadingBackupCodec.Failure, .savingSuspended)
        }
        XCTAssertTrue(reading.readingSaveSuspended)
        XCTAssertEqual(reading.bookmarks, bookmarks); XCTAssertEqual(reading.lastArticleID, lastArticle)
        XCTAssertEqual(defaults.setKeys, [])
        if let bytes = current as? Data { XCTAssertEqual(defaults.data(forKey: key), bytes) }
        else if let text = current as? String { XCTAssertEqual(defaults.string(forKey: key), text) }
        else { XCTAssertNil(defaults.object(forKey: key)) }
        XCTAssertEqual(defaults.data(forKey: key + ".recovery.v1"), recovery)
    }

    func testReadingExportObservedDataMissingAndNonDataSuspendEveryOrdinaryWrite() throws {
        let key = "library.reading.v1", before = try suspensionRaw("before"), newer = try suspensionRaw("external-newer")
        let variants: [Any?] = [newer, nil, "foreign non-Data"]
        for foreign in variants {
            let defaults = try suspensionDefaults(), recovery = Data("old recovery sentinel".utf8)
            defaults.inject(before, forKey: key); defaults.inject(recovery, forKey: key + ".recovery.v1")
            let reading = ReadingStore(defaults: defaults)
            defaults.watchedKey = key
            defaults.afterRead = { [weak defaults] in defaults?.inject(foreign, forKey: key) }
            XCTAssertThrowsError(try reading.exportBackup(createdAt: backupDate, appVersion: "0.2.20")) {
                XCTAssertEqual($0 as? ReadingBackupCodec.Failure, .changed)
            }
            XCTAssertTrue(reading.readingSaveSuspended)
            try assertSuspendedEditsPreserveSource(reading, defaults: defaults, current: foreign, recovery: recovery)
            let reopened = ReadingStore(defaults: defaults)
            XCTAssertFalse(reopened.readingSaveSuspended)
            if foreign is Data { XCTAssertEqual(reopened.bookmarks, ["external-newer"]) }
            else if foreign == nil { XCTAssertNil(reopened.recoveryIssue); XCTAssertEqual(reopened.bookmarks, []) }
            else { XCTAssertEqual(reopened.recoveryIssue, .unsupported) }
        }
        XCTAssertTrue(ReadingBackupCodec.Failure.changed.localizedDescription.contains("開き直して"))
        XCTAssertFalse(ReadingBackupCodec.Failure.savingSuspended.localizedDescription.contains("復旧が必要"))
    }

    func testReadingExportPreexistingMemoryPersistMismatchIsProtected() throws {
        let key = "library.reading.v1", before = try suspensionRaw("before"), newer = try suspensionRaw("external-newer")
        let variants: [Any?] = [newer, nil, "foreign non-Data", Data("broken external raw".utf8)]
        for foreign in variants {
            let defaults = try suspensionDefaults(), recovery = Data("old recovery".utf8)
            defaults.inject(before, forKey: key); defaults.inject(recovery, forKey: key + ".recovery.v1")
            let reading = ReadingStore(defaults: defaults)
            defaults.inject(foreign, forKey: key)
            XCTAssertThrowsError(try reading.exportBackup(createdAt: backupDate, appVersion: "0.2.20")) {
                XCTAssertEqual($0 as? ReadingBackupCodec.Failure, .changed)
            }
            try assertSuspendedEditsPreserveSource(reading, defaults: defaults, current: foreign, recovery: recovery)
        }
    }

    func testReadingExportMissingExplicitEmptyStateIsNotAFirstUseMissingKey() throws {
        let defaults = try suspensionDefaults(), key = "library.reading.v1", recovery = Data("old recovery".utf8)
        defaults.inject(Data(#"{"bookmarks":[],"positions":{}}"#.utf8), forKey: key)
        defaults.inject(recovery, forKey: key + ".recovery.v1")
        let reading = ReadingStore(defaults: defaults)
        defaults.inject(nil, forKey: key)
        XCTAssertThrowsError(try reading.exportBackup(createdAt: backupDate, appVersion: "0.2.20")) {
            XCTAssertEqual($0 as? ReadingBackupCodec.Failure, .changed)
        }
        try assertSuspendedEditsPreserveSource(reading, defaults: defaults, current: nil, recovery: recovery)
    }

    func testReadingExportByteOnlyDriftWithoutOwnMutationAlsoSuspends() throws {
        let defaults = try suspensionDefaults(), key = "library.reading.v1", before = try suspensionRaw("before")
        var drift = before; drift.append(0x20)
        let recovery = Data("old recovery".utf8)
        defaults.inject(before, forKey: key); defaults.inject(recovery, forKey: key + ".recovery.v1")
        let reading = ReadingStore(defaults: defaults)
        defaults.watchedKey = key; defaults.afterRead = { [weak defaults] in defaults?.inject(drift, forKey: key) }
        XCTAssertThrowsError(try reading.exportBackup(createdAt: backupDate, appVersion: "0.2.20")) {
            XCTAssertEqual($0 as? ReadingBackupCodec.Failure, .changed)
        }
        try assertSuspendedEditsPreserveSource(reading, defaults: defaults, current: drift, recovery: recovery)
    }

    func testReadingExportOwnHealthyEditDuringEitherSnapshotDoesNotSuspend() throws {
        let key = "library.reading.v1", before = try suspensionRaw("before")
        for read in [1, 2] {
            let defaults = try suspensionDefaults(); defaults.inject(before, forKey: key)
            let reading = ReadingStore(defaults: defaults)
            defaults.watchedKey = key; defaults.readsUntilCallback = read
            defaults.afterRead = { reading.toggleBookmark("own-edit") }
            XCTAssertThrowsError(try reading.exportBackup(createdAt: backupDate, appVersion: "0.2.20")) {
                XCTAssertEqual($0 as? ReadingBackupCodec.Failure, .changed)
            }
            XCTAssertFalse(reading.readingSaveSuspended)
            XCTAssertEqual(reading.bookmarks, ["before", "own-edit"])
            reading.record(articleID: "later", heading: nil, fraction: 0.4)
            XCTAssertEqual(ReadingStore(defaults: defaults).lastArticleID, "later")
            let data = try reading.exportBackup(createdAt: backupDate, appVersion: "0.2.20")
            XCTAssertEqual(try ReadingBackupCodec.decode(data).rawData, defaults.data(forKey: key))
        }
    }

    func testReadingExportUnpersistedOwnEditCannotPassTheHealthyRefresh() throws {
        let defaults = try suspensionDefaults(), key = "library.reading.v1", before = try suspensionRaw("before")
        let recovery = Data("old recovery".utf8)
        defaults.inject(before, forKey: key); defaults.inject(recovery, forKey: key + ".recovery.v1")
        let reading = ReadingStore(defaults: defaults)
        defaults.rejectedSetKeys.insert(key); defaults.watchedKey = key
        defaults.afterRead = { reading.toggleBookmark("unsaved-own-edit") }
        XCTAssertThrowsError(try reading.exportBackup(createdAt: backupDate, appVersion: "0.2.20")) {
            XCTAssertEqual($0 as? ReadingBackupCodec.Failure, .changed)
        }
        XCTAssertTrue(reading.bookmarks.contains("unsaved-own-edit"))
        try assertSuspendedEditsPreserveSource(reading, defaults: defaults, current: before, recovery: recovery)
    }

    func testReadingExportOrdinaryHealthyEditsAndExportsRemainAvailable() throws {
        let defaults = try suspensionDefaults(), reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark("normal"); reading.markOpened("normal")
        reading.record(articleID: "normal", heading: nil, fraction: 0.7)
        let raw = try XCTUnwrap(defaults.data(forKey: "library.reading.v1"))
        XCTAssertEqual(try ReadingBackupCodec.decode(reading.exportBackup(createdAt: backupDate, appVersion: "0.2.20")).rawData, raw)
        XCTAssertFalse(reading.readingSaveSuspended)
        reading.toggleBookmark("next")
        XCTAssertEqual(ReadingStore(defaults: defaults).bookmarks, ["normal", "next"])
    }

    @MainActor
    func testLibraryStorePublishesExportSuspensionOnThrowAndOnInitialization() throws {
        let defaults = try suspensionDefaults(), key = "library.reading.v1", before = try suspensionRaw("before")
        let newer = try suspensionRaw("external-newer")
        defaults.inject(before, forKey: key)
        let reading = ReadingStore(defaults: defaults), store = LibraryStore(reading: reading)
        XCTAssertFalse(store.readingSaveSuspended)
        defaults.watchedKey = key; defaults.afterRead = { [weak defaults] in defaults?.inject(newer, forKey: key) }
        XCTAssertThrowsError(try store.exportReadingBackup(createdAt: backupDate, appVersion: "0.2.20"))
        XCTAssertTrue(store.readingSaveSuspended)
        defaults.setKeys.removeAll(); store.toggleBookmark("no"); store.markOpened("no")
        store.record(articleID: "no", heading: nil, fraction: 0.5); store.recoverReadingState()
        XCTAssertTrue(store.readingSaveSuspended); XCTAssertEqual(defaults.setKeys, [])
        XCTAssertEqual(defaults.data(forKey: key), newer)
        XCTAssertTrue(LibraryStore(reading: reading).readingSaveSuspended)
    }

    @MainActor
    func testLibraryStoreOwnHealthyEditDoesNotPublishAnIncorrectSuspension() throws {
        let defaults = try suspensionDefaults(), key = "library.reading.v1", before = try suspensionRaw("before")
        defaults.inject(before, forKey: key)
        let store = LibraryStore(reading: ReadingStore(defaults: defaults))
        defaults.watchedKey = key; defaults.afterRead = { store.toggleBookmark("own-edit") }
        XCTAssertThrowsError(try store.exportReadingBackup(createdAt: backupDate, appVersion: "0.2.20"))
        XCTAssertFalse(store.readingSaveSuspended); XCTAssertEqual(store.bookmarks, ["before", "own-edit"])
        store.markOpened("next"); XCTAssertEqual(ReadingStore(defaults: defaults).lastArticleID, "next")
    }

    // BEGIN EXPORT V3 RAW IDENTITY REGRESSIONS
    func testReadingExportExternalUnsupportedMetadataPreservesIdentityAndSuspends() throws {
        let key = "library.reading.v1", digest = String(repeating: "a", count: 64)
        let known: [String: Any] = ["bookmarks": ["before"], "positions": ["before": ["fraction": 0.4]], "lastArticleID": "before"]
        let before = try JSONSerialization.data(withJSONObject: known, options: [.sortedKeys])
        var future = known; future["future"] = ["externalNote": "must-preserve"]
        var positionFuture = known
        positionFuture["positions"] = ["before": ["fraction": 0.4, "future": "must-preserve"]]
        var futureAnchor = known
        futureAnchor["positions"] = ["before": ["fraction": 0.4, "anchor": ["version": 2,
            "documentDigest": digest, "blockFingerprint": digest]]]
        let variants = try [future, positionFuture, futureAnchor].map {
            try JSONSerialization.data(withJSONObject: $0, options: [.sortedKeys])
        }
        for foreign in variants {
            let defaults = try suspensionDefaults(), recovery = Data("old recovery".utf8)
            defaults.inject(before, forKey: key); defaults.inject(recovery, forKey: key + ".recovery.v1")
            let reading = ReadingStore(defaults: defaults)
            defaults.inject(foreign, forKey: key)
            // The strict format remains unsupported even though tolerant State sees the same known fields.
            XCTAssertThrowsError(try ReadingBackupCodec.encode(rawData: foreign, createdAt: backupDate, appVersion: "0.2.20")) {
                XCTAssertEqual($0 as? ReadingBackupCodec.Failure, .invalid)
            }
            XCTAssertThrowsError(try reading.exportBackup(createdAt: backupDate, appVersion: "0.2.20")) {
                XCTAssertEqual($0 as? ReadingBackupCodec.Failure, .changed)
            }
            XCTAssertTrue(reading.readingSaveSuspended)
            try assertSuspendedEditsPreserveSource(reading, defaults: defaults, current: foreign, recovery: recovery)
        }
    }

    func testReadingExportKnownFutureAnchorAtLoadKeepsLegacyFallbackAvailable() throws {
        let defaults = try suspensionDefaults(), key = "library.reading.v1", digest = String(repeating: "a", count: 64)
        let raw = try JSONSerialization.data(withJSONObject: ["bookmarks": ["before"],
            "positions": ["before": ["fraction": 0.4, "anchor": ["version": 2,
                "documentDigest": digest, "blockFingerprint": digest]]]], options: [.sortedKeys])
        defaults.inject(raw, forKey: key)
        let reading = ReadingStore(defaults: defaults)
        XCTAssertNil(reading.recoveryIssue)
        XCTAssertThrowsError(try reading.exportBackup(createdAt: backupDate, appVersion: "0.2.20")) {
            XCTAssertEqual($0 as? ReadingBackupCodec.Failure, .invalid)
        }
        XCTAssertFalse(reading.readingSaveSuspended)
        XCTAssertEqual(defaults.data(forKey: key), raw)
        reading.toggleBookmark("own-edit")
        let normalized = try XCTUnwrap(defaults.data(forKey: key))
        XCTAssertNotEqual(normalized, raw)
        XCTAssertEqual(try ReadingBackupCodec.decode(reading.exportBackup(createdAt: backupDate, appVersion: "0.2.20")).rawData, normalized)
        XCTAssertFalse(reading.readingSaveSuspended)
        XCTAssertEqual(ReadingStore(defaults: defaults).bookmarks, ["before", "own-edit"])
    }

    func testReadingExportInvalidEnvelopeArgumentsDoNotSuspendHealthyRaw() throws {
        let key = "library.reading.v1", before = try suspensionRaw("before")
        let invalid: [(Date, String)] = [(backupDate, ""), (backupDate, String(repeating: "a", count: 129)),
                                        (Date(timeIntervalSince1970: .nan), "0.2.20")]
        for (date, version) in invalid {
            let defaults = try suspensionDefaults(); defaults.inject(before, forKey: key)
            let reading = ReadingStore(defaults: defaults)
            XCTAssertThrowsError(try reading.exportBackup(createdAt: date, appVersion: version)) {
                XCTAssertEqual($0 as? ReadingBackupCodec.Failure, .invalid)
            }
            XCTAssertFalse(reading.readingSaveSuspended); XCTAssertEqual(defaults.setKeys, [])
            XCTAssertEqual(defaults.data(forKey: key), before)
            reading.toggleBookmark("own-edit")
            let current = try XCTUnwrap(defaults.data(forKey: key))
            XCTAssertEqual(try ReadingBackupCodec.decode(reading.exportBackup(createdAt: backupDate, appVersion: "0.2.20")).rawData, current)
            XCTAssertFalse(reading.readingSaveSuspended)
        }
    }

    func testReadingExportOwnSaveAndRecoveryRegisterExactRawIdentity() throws {
        let defaults = try suspensionDefaults(), key = "library.reading.v1"
        let partial = Data(#"{"bookmarks":["before",7],"positions":{}}"#.utf8)
        defaults.inject(partial, forKey: key)
        let reading = ReadingStore(defaults: defaults)
        XCTAssertEqual(reading.recoveryIssue, .partial)
        reading.toggleBookmark("own-live")
        XCTAssertEqual(defaults.data(forKey: key), partial)
        XCTAssertTrue(reading.recoverReadableState())
        let recovered = try XCTUnwrap(defaults.data(forKey: key))
        XCTAssertEqual(defaults.data(forKey: key + ".recovery.v1"), partial)
        XCTAssertEqual(try ReadingBackupCodec.decode(reading.exportBackup(createdAt: backupDate, appVersion: "0.2.20")).rawData, recovered)
        XCTAssertFalse(reading.readingSaveSuspended)
        reading.markOpened("later"); reading.record(articleID: "later", heading: nil, fraction: 0.6)
        let saved = try XCTUnwrap(defaults.data(forKey: key))
        XCTAssertEqual(try ReadingBackupCodec.decode(reading.exportBackup(createdAt: backupDate, appVersion: "0.2.20")).rawData, saved)
        XCTAssertFalse(reading.readingSaveSuspended)
        XCTAssertEqual(defaults.data(forKey: key + ".recovery.v1"), partial)
    }

    func testReadingExportExternalByteDriftBeforeStartIsDetectedEvenWhenStateMatches() throws {
        let defaults = try suspensionDefaults(), key = "library.reading.v1", before = try suspensionRaw("before")
        let recovery = Data("old recovery".utf8)
        defaults.inject(before, forKey: key); defaults.inject(recovery, forKey: key + ".recovery.v1")
        let reading = ReadingStore(defaults: defaults)
        var foreign = before; foreign.append(0x20)
        defaults.inject(foreign, forKey: key)
        XCTAssertThrowsError(try reading.exportBackup(createdAt: backupDate, appVersion: "0.2.20")) {
            XCTAssertEqual($0 as? ReadingBackupCodec.Failure, .changed)
        }
        try assertSuspendedEditsPreserveSource(reading, defaults: defaults, current: foreign, recovery: recovery)
    }

    @MainActor
    func testLibraryStorePublishesSuspensionForExternalMetadataOnlyDrift() throws {
        let defaults = try suspensionDefaults(), key = "library.reading.v1", before = try suspensionRaw("before")
        defaults.inject(before, forKey: key)
        let store = LibraryStore(reading: ReadingStore(defaults: defaults))
        var foreign = try XCTUnwrap(JSONSerialization.jsonObject(with: before) as? [String: Any])
        foreign["future"] = "must-preserve"
        let changed = try JSONSerialization.data(withJSONObject: foreign, options: [.sortedKeys])
        defaults.inject(changed, forKey: key)
        XCTAssertThrowsError(try store.exportReadingBackup(createdAt: backupDate, appVersion: "0.2.20")) {
            XCTAssertEqual($0 as? ReadingBackupCodec.Failure, .changed)
        }
        XCTAssertTrue(store.readingSaveSuspended)
        defaults.setKeys.removeAll(); store.toggleBookmark("no"); store.markOpened("no")
        store.record(articleID: "no", heading: nil, fraction: 0.8)
        XCTAssertEqual(defaults.setKeys, []); XCTAssertEqual(defaults.data(forKey: key), changed)
    }
    // END EXPORT V3 RAW IDENTITY REGRESSIONS

    // BEGIN PRIVATE RESTORE ENGINE TESTS
    private var restoreDate: Date { Date(timeIntervalSince1970: 1_793_145_600) }
    private var restoreKey: String { "library.reading.v1" }
    private var restoreSlot: String { restoreKey + ".restore-backup.v1" }
    private func restoreDefaults() throws -> ReadingRestoreProbeDefaults {
        let suite = "library-reading-restore-test-" + UUID().uuidString
        let defaults = try XCTUnwrap(ReadingRestoreProbeDefaults(suiteName: suite))
        addTeardownBlock { UserDefaults(suiteName: suite)?.removePersistentDomain(forName: suite) }
        return defaults
    }
    private func restoreRaw(_ id: String, fraction: Double = 0.4) throws -> Data {
        try JSONSerialization.data(withJSONObject: ["bookmarks": [id], "positions": [id: ["fraction": fraction]],
                                                     "lastArticleID": id], options: [.sortedKeys])
    }
    private func restoreEnvelope(_ raw: Data) throws -> Data {
        try ReadingBackupCodec.encode(rawData: raw, createdAt: restoreDate, appVersion: "0.2.20")
    }
    private func assertRestoreError<T>(_ expected: ReadingStore.RestoreFailure,
                                       _ action: @autoclosure () throws -> T) {
        XCTAssertThrowsError(try action()) { XCTAssertEqual($0 as? ReadingStore.RestoreFailure, expected) }
    }

    func testRestorePreviewAndCancellationLeaveAllKeysAndLiveStateUntouched() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), target = try restoreRaw("target")
        let recovery = Data("prior recovery".utf8)
        d.inject(before, forKey: restoreKey); d.inject(recovery, forKey: restoreKey + ".recovery.v1")
        let reading = ReadingStore(defaults: d)
        let preview = try reading.previewRestore(from: restoreEnvelope(target))
        XCTAssertEqual(preview.counts, ReadingBackupCodec.Counts(bookmarks: 1, positions: 1))
        XCTAssertEqual(preview.currentCounts, ReadingBackupCodec.Counts(bookmarks: 1, positions: 1))
        XCTAssertTrue(preview.currentHasSavedData)
        XCTAssertEqual(preview.createdAt, "2026-10-28T00:00:00Z")
        XCTAssertEqual(preview.sourceAppVersion, "0.2.20")
        // Cancellation is deliberately the absence of an apply call.
        XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
        XCTAssertEqual(d.data(forKey: restoreKey), before)
        XCTAssertEqual(d.data(forKey: restoreKey + ".recovery.v1"), recovery)
        XCTAssertNil(d.object(forKey: restoreSlot))
        XCTAssertEqual(reading.bookmarks, ["before"])
    }

    func testRestoreRejectsInvalidInputBeforeAnyDefaultsWrite() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before")
        d.inject(before, forKey: restoreKey)
        let reading = ReadingStore(defaults: d)
        for invalid in [Data("{}".utf8), Data("broken".utf8), Data(repeating: 0x20, count: 2_097_153)] {
            XCTAssertThrowsError(try reading.previewRestore(from: invalid))
        }
        XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
        XCTAssertEqual(d.data(forKey: restoreKey), before)
        XCTAssertNil(d.object(forKey: restoreSlot))
    }

    func testRestoreMissingBeforeIsDistinctFromAnExplicitEmptySavedState() throws {
        let d = try restoreDefaults(), target = try restoreRaw("target")
        let reading = ReadingStore(defaults: d)
        let preview = try reading.previewRestore(from: restoreEnvelope(target))
        XCTAssertFalse(preview.currentHasSavedData); XCTAssertNil(preview.currentCounts)
        try reading.applyRestore(preview, backupCreatedAt: restoreDate)
        let retained = try XCTUnwrap(reading.retainedRestoreBackup())
        XCTAssertFalse(retained.beforeHasSavedData); XCTAssertNil(retained.beforeCounts)
        assertRestoreError(.noPreviousSavedData, try reading.exportRetainedRestoreBackup(retained, appVersion: "0.2.20"))
        XCTAssertEqual(d.data(forKey: restoreKey), target)
        let slot = try XCTUnwrap(d.data(forKey: restoreSlot))
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: slot) as? [String: Any])
        XCTAssertEqual(json["beforePresent"] as? Bool, false)
        XCTAssertEqual(json["beforeBase64"] as? String, "")
    }

    func testRestoreExplicitEmptyBeforeCanBeExportedWithoutInventingMissingData() throws {
        let d = try restoreDefaults(), empty = Data(#"{"bookmarks":[],"positions":{}}"#.utf8), target = try restoreRaw("target")
        d.inject(empty, forKey: restoreKey)
        let reading = ReadingStore(defaults: d), preview = try reading.previewRestore(from: restoreEnvelope(target))
        XCTAssertTrue(preview.currentHasSavedData)
        XCTAssertEqual(preview.currentCounts, ReadingBackupCodec.Counts(bookmarks: 0, positions: 0))
        try reading.applyRestore(preview, backupCreatedAt: restoreDate)
        let retained = try XCTUnwrap(reading.retainedRestoreBackup())
        XCTAssertTrue(retained.beforeHasSavedData)
        XCTAssertEqual(retained.beforeCounts, ReadingBackupCodec.Counts(bookmarks: 0, positions: 0))
        XCTAssertEqual(try ReadingBackupCodec.decode(reading.exportRetainedRestoreBackup(retained, appVersion: "0.2.20")).rawData, empty)
    }

    func testRestoreEmptyTargetReportsZeroCountsAndPersistsTheExactEmptyRaw() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), empty = Data(#"{"bookmarks":[],"positions":{}}"#.utf8)
        d.inject(before, forKey: restoreKey)
        let reading = ReadingStore(defaults: d), preview = try reading.previewRestore(from: restoreEnvelope(empty))
        XCTAssertTrue(preview.containsNoBookmarksOrPositions)
        XCTAssertEqual(preview.counts, ReadingBackupCodec.Counts(bookmarks: 0, positions: 0))
        try reading.applyRestore(preview, backupCreatedAt: restoreDate)
        XCTAssertEqual(d.data(forKey: restoreKey), empty)
        XCTAssertEqual(reading.bookmarks, []); XCTAssertNil(reading.lastArticleID)
        XCTAssertEqual(ReadingStore(defaults: d).bookmarks, [])
    }

    func testRestoreAlreadyCurrentRawDoesNotCreateOrReplaceARetainedSlot() throws {
        let d = try restoreDefaults(), raw = try restoreRaw("same")
        d.inject(raw, forKey: restoreKey)
        let reading = ReadingStore(defaults: d)
        assertRestoreError(.alreadyCurrent, try reading.previewRestore(from: restoreEnvelope(raw)))
        XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
        XCTAssertNil(d.object(forKey: restoreSlot))
    }

    func testRestorePreviewCannotBeAppliedByAnotherStoreEvenInTheSameNamespace() throws {
        let d = try restoreDefaults(), raw = try restoreRaw("before"), target = try restoreRaw("target")
        d.inject(raw, forKey: restoreKey)
        let first = ReadingStore(defaults: d), second = ReadingStore(defaults: d)
        let preview = try first.previewRestore(from: restoreEnvelope(target))
        assertRestoreError(.stale, try second.applyRestore(preview, backupCreatedAt: restoreDate))
        XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
        XCTAssertFalse(first.restoreSaveSuspended); XCTAssertFalse(second.restoreSaveSuspended)
        XCTAssertEqual(d.data(forKey: restoreKey), raw)
    }

    func testRestoreCustomKeyAndRetainedManagementRemainNamespaceBound() throws {
        let d = try restoreDefaults(), normal = try restoreRaw("normal"), before = try restoreRaw("custom"), target = try restoreRaw("target")
        let customKey = "custom.reading.v1", customSlot = customKey + ".restore-backup.v1"
        d.inject(normal, forKey: restoreKey); d.inject(before, forKey: customKey)
        let oldRecovery = Data("custom prior recovery".utf8)
        d.inject(oldRecovery, forKey: customKey + ".recovery.v1")
        let custom = ReadingStore(defaults: d, key: customKey), other = ReadingStore(defaults: d)
        let preview = try custom.previewRestore(from: restoreEnvelope(target))
        assertRestoreError(.stale, try other.applyRestore(preview, backupCreatedAt: restoreDate))
        try custom.applyRestore(preview, backupCreatedAt: restoreDate)
        let retained = try XCTUnwrap(custom.retainedRestoreBackup())
        assertRestoreError(.stale, try other.exportRetainedRestoreBackup(retained, appVersion: "0.2.20"))
        assertRestoreError(.stale, try other.releaseRetainedRestoreBackup(retained))
        XCTAssertEqual(d.data(forKey: restoreKey), normal)
        XCTAssertNil(d.object(forKey: restoreSlot))
        XCTAssertEqual(d.data(forKey: customKey), target)
        XCTAssertNotNil(d.data(forKey: customSlot))
        XCTAssertEqual(d.data(forKey: customKey + ".recovery.v1"), oldRecovery)
        XCTAssertEqual(d.setKeys, [customSlot, customKey]); XCTAssertEqual(d.removeKeys, [])
    }

    func testRestoreGenerationRejectsLiveEditsEvenWhenTheirDefaultsWriteWasRejected() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), target = try restoreRaw("target")
        d.inject(before, forKey: restoreKey)
        let reading = ReadingStore(defaults: d), preview = try reading.previewRestore(from: restoreEnvelope(target))
        d.rejectedSetKeys.insert(restoreKey)
        reading.toggleBookmark("unsaved-live-edit")
        XCTAssertEqual(d.data(forKey: restoreKey), before)
        XCTAssertTrue(reading.bookmarks.contains("unsaved-live-edit"))
        d.resetLedger()
        assertRestoreError(.stale, try reading.applyRestore(preview, backupCreatedAt: restoreDate))
        XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
        XCTAssertNil(d.object(forKey: restoreSlot))
    }

    func testRestoreRefusesAHealthyRawWhenCurrentLiveEditsHaveNotBeenSaved() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), target = try restoreRaw("target")
        d.inject(before, forKey: restoreKey)
        let reading = ReadingStore(defaults: d)
        d.rejectedSetKeys.insert(restoreKey); reading.toggleBookmark("live-only"); d.resetLedger()
        assertRestoreError(.currentHasUnsavedChanges, try reading.previewRestore(from: restoreEnvelope(target)))
        XCTAssertTrue(reading.bookmarks.contains("live-only"))
        XCTAssertEqual(d.data(forKey: restoreKey), before)
        XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
    }

    func testRestoreRawChangeAfterPreviewIsPreservedAndOldLiveStateCannotOverwriteIt() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), target = try restoreRaw("target"), newer = try restoreRaw("external-newer")
        d.inject(before, forKey: restoreKey)
        let reading = ReadingStore(defaults: d), preview = try reading.previewRestore(from: restoreEnvelope(target))
        d.inject(newer, forKey: restoreKey)
        assertRestoreError(.stale, try reading.applyRestore(preview, backupCreatedAt: restoreDate))
        XCTAssertEqual(d.data(forKey: restoreKey), newer)
        XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
        XCTAssertNil(d.object(forKey: restoreSlot)); XCTAssertTrue(reading.restoreSaveSuspended)
        reading.toggleBookmark("must-not-save"); reading.markOpened("must-not-save")
        reading.record(articleID: "must-not-save", heading: nil, fraction: 0.8)
        XCTAssertEqual(reading.bookmarks, ["before"])
        XCTAssertEqual(reading.lastArticleID, "before")
        XCTAssertEqual(d.setKeys, [])
    }

    func testRestoreSlotChangeAfterPreviewIsNotOverwrittenOrDeleted() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), target = try restoreRaw("target")
        d.inject(before, forKey: restoreKey)
        let reading = ReadingStore(defaults: d), preview = try reading.previewRestore(from: restoreEnvelope(target))
        let foreign = Data("foreign retained data".utf8); d.inject(foreign, forKey: restoreSlot)
        assertRestoreError(.stale, try reading.applyRestore(preview, backupCreatedAt: restoreDate))
        XCTAssertEqual(d.data(forKey: restoreSlot), foreign)
        XCTAssertEqual(d.data(forKey: restoreKey), before)
        XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
    }

    func testRestoreRefusesDamagedNonDataAndOversizedCurrentWithoutCreatingABackup() throws {
        let target = try restoreRaw("target")
        let originals: [Any] = [Data("broken".utf8), Data(#"{"bookmarks":["x",7],"positions":{}}"#.utf8),
                                "not Data", Data(repeating: 0x20, count: 1_048_577)]
        for original in originals {
            let d = try restoreDefaults(); d.inject(original, forKey: restoreKey)
            let recovery = Data("existing recovery".utf8); d.inject(recovery, forKey: restoreKey + ".recovery.v1")
            let reading = ReadingStore(defaults: d)
            assertRestoreError(.currentNeedsRecovery, try reading.previewRestore(from: restoreEnvelope(target)))
            XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
            if let bytes = original as? Data { XCTAssertEqual(d.data(forKey: restoreKey), bytes) }
            else { XCTAssertEqual(d.string(forKey: restoreKey), original as? String) }
            XCTAssertEqual(d.data(forKey: restoreKey + ".recovery.v1"), recovery)
            XCTAssertNil(d.object(forKey: restoreSlot))
        }
    }

    func testRestoreRejectedBackupWriteNeverAttemptsThePrimaryWrite() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), target = try restoreRaw("target")
        d.inject(before, forKey: restoreKey)
        let reading = ReadingStore(defaults: d), preview = try reading.previewRestore(from: restoreEnvelope(target))
        d.rejectedSetKeys.insert(restoreSlot)
        assertRestoreError(.backupWriteUnconfirmed, try reading.applyRestore(preview, backupCreatedAt: restoreDate))
        XCTAssertEqual(d.setKeys, [restoreSlot]); XCTAssertEqual(d.removeKeys, [])
        XCTAssertEqual(d.data(forKey: restoreKey), before)
        XCTAssertNil(d.object(forKey: restoreSlot)); XCTAssertFalse(reading.restoreSaveSuspended)
        XCTAssertEqual(reading.bookmarks, ["before"])
    }

    func testRestoreUnconfirmedBackupBytesAreRetainedWithoutTouchingThePrimary() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), target = try restoreRaw("target")
        d.inject(before, forKey: restoreKey)
        let reading = ReadingStore(defaults: d), preview = try reading.previewRestore(from: restoreEnvelope(target))
        let wrong = Data("unconfirmed retention".utf8); d.replacementSetValues[restoreSlot] = wrong
        assertRestoreError(.backupWriteUnconfirmed, try reading.applyRestore(preview, backupCreatedAt: restoreDate))
        XCTAssertEqual(d.setKeys, [restoreSlot]); XCTAssertEqual(d.removeKeys, [])
        XCTAssertEqual(d.data(forKey: restoreKey), before); XCTAssertEqual(d.data(forKey: restoreSlot), wrong)
        assertRestoreError(.retainedBackupUnsupported, try reading.previewRestore(from: restoreEnvelope(target)))
    }

    func testRestorePrimaryChangeDuringBackupStopsBeforePrimaryAndSuspendsOldLiveWrites() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), target = try restoreRaw("target"), newer = try restoreRaw("external-newer")
        d.inject(before, forKey: restoreKey)
        let reading = ReadingStore(defaults: d), preview = try reading.previewRestore(from: restoreEnvelope(target))
        d.afterSet = { [weak d] key in
            guard key == self.restoreSlot else { return }
            d?.afterSet = nil; d?.inject(newer, forKey: self.restoreKey)
        }
        assertRestoreError(.stale, try reading.applyRestore(preview, backupCreatedAt: restoreDate))
        XCTAssertEqual(d.setKeys, [restoreSlot]); XCTAssertEqual(d.removeKeys, [])
        XCTAssertEqual(d.data(forKey: restoreKey), newer); XCTAssertNotNil(d.data(forKey: restoreSlot))
        XCTAssertTrue(reading.restoreSaveSuspended); XCTAssertEqual(reading.bookmarks, ["before"])
        d.resetLedger(); reading.toggleBookmark("do-not-save"); reading.record(articleID: "later", heading: nil, fraction: 0.9)
        XCTAssertEqual(d.setKeys, [])
    }

    func testRestoreRejectedPrimaryWriteStopsEditingAndRetainsBeforeData() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), target = try restoreRaw("target")
        d.inject(before, forKey: restoreKey)
        let oldRecovery = Data("old recovery".utf8); d.inject(oldRecovery, forKey: restoreKey + ".recovery.v1")
        let reading = ReadingStore(defaults: d), preview = try reading.previewRestore(from: restoreEnvelope(target))
        d.rejectedSetKeys.insert(restoreKey)
        assertRestoreError(.primaryWriteUnconfirmed, try reading.applyRestore(preview, backupCreatedAt: restoreDate))
        XCTAssertEqual(d.setKeys, [restoreSlot, restoreKey]); XCTAssertEqual(d.removeKeys, [])
        XCTAssertTrue(reading.restoreSaveSuspended); XCTAssertEqual(reading.bookmarks, ["before"])
        XCTAssertEqual(d.data(forKey: restoreKey), before)
        XCTAssertEqual(d.data(forKey: restoreKey + ".recovery.v1"), oldRecovery)
        let retained = try XCTUnwrap(reading.retainedRestoreBackup())
        XCTAssertEqual(try ReadingBackupCodec.decode(reading.exportRetainedRestoreBackup(retained, appVersion: "0.2.20")).rawData, before)
        d.resetLedger(); reading.toggleBookmark("no"); reading.markOpened("no")
        reading.record(articleID: "no", heading: nil, fraction: 0.4)
        XCTAssertFalse(reading.recoverReadableState())
        XCTAssertThrowsError(try reading.exportBackup(createdAt: restoreDate, appVersion: "0.2.20"))
        assertRestoreError(.primaryWriteUnconfirmed, try reading.releaseRetainedRestoreBackup(retained))
        XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
    }

    func testRestoreSameBeforeAndTargetCanRetryWithoutReplacingTheRetainedSlot() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), target = try restoreRaw("target")
        d.inject(before, forKey: restoreKey)
        let reading = ReadingStore(defaults: d), initial = try reading.previewRestore(from: restoreEnvelope(target))
        d.rejectedSetKeys.insert(restoreKey)
        assertRestoreError(.primaryWriteUnconfirmed, try reading.applyRestore(initial, backupCreatedAt: restoreDate))
        let retainedRaw = try XCTUnwrap(d.data(forKey: restoreSlot))
        d.rejectedSetKeys.remove(restoreKey); d.resetLedger()
        let retry = try reading.previewRestore(from: restoreEnvelope(target))
        try reading.applyRestore(retry, backupCreatedAt: restoreDate.addingTimeInterval(60))
        XCTAssertEqual(d.setKeys, [restoreKey]); XCTAssertEqual(d.removeKeys, [])
        XCTAssertEqual(d.data(forKey: restoreSlot), retainedRaw)
        XCTAssertEqual(d.data(forKey: restoreKey), target)
        XCTAssertFalse(reading.restoreSaveSuspended); XCTAssertEqual(reading.bookmarks, ["target"])
    }

    func testRestoreDifferentPrimaryReadbackNeverRollsBackAnUnknownWriterOrPublishesTarget() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), target = try restoreRaw("target"), other = try restoreRaw("other-writer")
        d.inject(before, forKey: restoreKey)
        let reading = ReadingStore(defaults: d), preview = try reading.previewRestore(from: restoreEnvelope(target))
        d.replacementSetValues[restoreKey] = other
        assertRestoreError(.primaryWriteUnconfirmed, try reading.applyRestore(preview, backupCreatedAt: restoreDate))
        XCTAssertEqual(d.setKeys, [restoreSlot, restoreKey]); XCTAssertEqual(d.removeKeys, [])
        XCTAssertEqual(d.data(forKey: restoreKey), other)
        XCTAssertEqual(reading.bookmarks, ["before"]); XCTAssertTrue(reading.restoreSaveSuspended)
        let retained = try XCTUnwrap(reading.retainedRestoreBackup())
        XCTAssertEqual(try ReadingBackupCodec.decode(reading.exportRetainedRestoreBackup(retained, appVersion: "0.2.20")).rawData, before)
        XCTAssertFalse(ReadingStore.RestoreFailure.primaryWriteUnconfirmed.localizedDescription.contains("変更していません"))
    }

    func testRestoreSuccessPreservesAllRawAnchorsOrphanRecordsAndUnrelatedKeys() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), digest = String(repeating: "a", count: 64)
        let id = "removed/日本語"
        let target = try JSONSerialization.data(withJSONObject: ["bookmarks": [id, "another-removed"],
            "positions": [id: ["fraction": 0.75, "heading": "旧見出し", "blockID": "old-block",
                "anchor": ["version": 1, "documentDigest": digest, "blockFingerprint": digest,
                           "headingFingerprint": digest, "intraBlockFraction": 0.25]],
                "another-removed": ["fraction": 0.1]], "lastArticleID": id], options: [.sortedKeys])
        let recovery = Data("old corrupt raw".utf8), pointer = Data("unchanged pointer".utf8)
        d.inject(before, forKey: restoreKey); d.inject(recovery, forKey: restoreKey + ".recovery.v1")
        d.inject(pointer, forKey: "content.pointer"); d.inject(55.0, forKey: "ios.audio.example.position")
        let reading = ReadingStore(defaults: d), preview = try reading.previewRestore(from: restoreEnvelope(target))
        XCTAssertEqual(preview.counts, ReadingBackupCodec.Counts(bookmarks: 2, positions: 2))
        try reading.applyRestore(preview, backupCreatedAt: restoreDate)
        XCTAssertEqual(d.data(forKey: restoreKey), target)
        XCTAssertEqual(reading.bookmarks, [id, "another-removed"]); XCTAssertEqual(reading.lastArticleID, id)
        XCTAssertEqual(try ReadingBackupCodec.decode(reading.exportBackup(createdAt: restoreDate, appVersion: "0.2.20")).rawData, target)
        let recreated = ReadingStore(defaults: d)
        XCTAssertEqual(recreated.bookmarks, reading.bookmarks); XCTAssertEqual(recreated.lastArticleID, id)
        XCTAssertEqual(try ReadingBackupCodec.decode(recreated.exportBackup(createdAt: restoreDate, appVersion: "0.2.20")).rawData, target)
        XCTAssertEqual(d.data(forKey: restoreKey + ".recovery.v1"), recovery)
        XCTAssertEqual(d.data(forKey: "content.pointer"), pointer); XCTAssertEqual(d.double(forKey: "ios.audio.example.position"), 55)
        XCTAssertEqual(d.setKeys, [restoreSlot, restoreKey]); XCTAssertEqual(d.removeKeys, [])
    }

    func testRestoreSuccessfulSlotBlocksAnotherRestoreUntilExplicitManagement() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), target = try restoreRaw("target"), next = try restoreRaw("next")
        d.inject(before, forKey: restoreKey)
        let reading = ReadingStore(defaults: d), preview = try reading.previewRestore(from: restoreEnvelope(target))
        try reading.applyRestore(preview, backupCreatedAt: restoreDate)
        let slot = try XCTUnwrap(d.data(forKey: restoreSlot)); d.resetLedger()
        assertRestoreError(.retainedBackupExists, try reading.previewRestore(from: restoreEnvelope(next)))
        XCTAssertEqual(d.data(forKey: restoreSlot), slot); XCTAssertEqual(d.data(forKey: restoreKey), target)
        XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
    }

    func testRestoreUnknownCorruptAndOversizedSlotsAreNeverOverwrittenOrRemoved() throws {
        let before = try restoreRaw("before"), target = try restoreRaw("target")
        for invalid in [Data("{}".utf8), Data("not JSON".utf8), Data(repeating: 0x20, count: 2_097_153)] {
            let d = try restoreDefaults(); d.inject(before, forKey: restoreKey); d.inject(invalid, forKey: restoreSlot)
            let reading = ReadingStore(defaults: d)
            assertRestoreError(.retainedBackupUnsupported, try reading.previewRestore(from: restoreEnvelope(target)))
            XCTAssertThrowsError(try reading.retainedRestoreBackup())
            XCTAssertEqual(d.data(forKey: restoreSlot), invalid); XCTAssertEqual(d.data(forKey: restoreKey), before)
            XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
        }
    }

    func testRestoreRetainedExportAndExplicitReleaseTouchOnlyTheBoundRetainedSlot() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), target = try restoreRaw("target"), next = try restoreRaw("next")
        let recovery = Data("prior recovery".utf8); d.inject(before, forKey: restoreKey); d.inject(recovery, forKey: restoreKey + ".recovery.v1")
        let reading = ReadingStore(defaults: d), preview = try reading.previewRestore(from: restoreEnvelope(target))
        try reading.applyRestore(preview, backupCreatedAt: restoreDate)
        let retained = try XCTUnwrap(reading.retainedRestoreBackup()), slot = try XCTUnwrap(d.data(forKey: restoreSlot))
        XCTAssertEqual(retained.createdAt, "2026-10-28T00:00:00Z")
        XCTAssertEqual(retained.beforeCounts, ReadingBackupCodec.Counts(bookmarks: 1, positions: 1))
        d.resetLedger()
        XCTAssertEqual(try ReadingBackupCodec.decode(reading.exportRetainedRestoreBackup(retained, appVersion: "0.2.20")).rawData, before)
        XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
        XCTAssertEqual(d.data(forKey: restoreSlot), slot) // Viewing/exporting is not release.
        try reading.releaseRetainedRestoreBackup(retained)
        XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [restoreSlot])
        XCTAssertNil(d.object(forKey: restoreSlot)); XCTAssertEqual(d.data(forKey: restoreKey), target)
        XCTAssertEqual(d.data(forKey: restoreKey + ".recovery.v1"), recovery)
        XCTAssertEqual(reading.bookmarks, ["target"])
        _ = try reading.previewRestore(from: restoreEnvelope(next))
    }

    func testRestoreRetainedReleaseRejectsCurrentEditsAndKeepsTheSavedBackup() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), target = try restoreRaw("target")
        d.inject(before, forKey: restoreKey)
        let reading = ReadingStore(defaults: d), preview = try reading.previewRestore(from: restoreEnvelope(target))
        try reading.applyRestore(preview, backupCreatedAt: restoreDate)
        let retained = try XCTUnwrap(reading.retainedRestoreBackup()), slot = try XCTUnwrap(d.data(forKey: restoreSlot))
        reading.toggleBookmark("new-edit"); let current = d.data(forKey: restoreKey); d.resetLedger()
        assertRestoreError(.stale, try reading.releaseRetainedRestoreBackup(retained))
        XCTAssertEqual(d.data(forKey: restoreSlot), slot); XCTAssertEqual(d.data(forKey: restoreKey), current)
        XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
        // The immutable before snapshot can still be exported while its slot is unchanged.
        XCTAssertEqual(try ReadingBackupCodec.decode(reading.exportRetainedRestoreBackup(retained, appVersion: "0.2.20")).rawData, before)
    }

    func testRestoreRetainedReleaseRejectsChangedSlotWithoutDeletingTheForeignBytes() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), target = try restoreRaw("target")
        d.inject(before, forKey: restoreKey)
        let reading = ReadingStore(defaults: d), preview = try reading.previewRestore(from: restoreEnvelope(target))
        try reading.applyRestore(preview, backupCreatedAt: restoreDate)
        let retained = try XCTUnwrap(reading.retainedRestoreBackup())
        let foreign = Data("new owner of this slot".utf8); d.inject(foreign, forKey: restoreSlot); d.resetLedger()
        assertRestoreError(.stale, try reading.releaseRetainedRestoreBackup(retained))
        XCTAssertThrowsError(try reading.exportRetainedRestoreBackup(retained, appVersion: "0.2.20"))
        XCTAssertEqual(d.data(forKey: restoreSlot), foreign); XCTAssertEqual(d.data(forKey: restoreKey), target)
        XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
    }

    func testRestoreRejectedRetentionReleaseReportsFailureAndRequiresANewConfirmation() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), target = try restoreRaw("target")
        d.inject(before, forKey: restoreKey)
        let reading = ReadingStore(defaults: d), preview = try reading.previewRestore(from: restoreEnvelope(target))
        try reading.applyRestore(preview, backupCreatedAt: restoreDate)
        let retained = try XCTUnwrap(reading.retainedRestoreBackup()), slot = try XCTUnwrap(d.data(forKey: restoreSlot))
        d.rejectedRemoveKeys.insert(restoreSlot); d.resetLedger()
        assertRestoreError(.retentionReleaseUnconfirmed, try reading.releaseRetainedRestoreBackup(retained))
        XCTAssertEqual(d.data(forKey: restoreSlot), slot); XCTAssertEqual(d.data(forKey: restoreKey), target)
        XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [restoreSlot])
        assertRestoreError(.stale, try reading.releaseRetainedRestoreBackup(retained))
        d.rejectedRemoveKeys.remove(restoreSlot)
        let refreshed = try XCTUnwrap(reading.retainedRestoreBackup())
        try reading.releaseRetainedRestoreBackup(refreshed)
        XCTAssertNil(d.object(forKey: restoreSlot))
    }

    func testRestoreApplyBlocksReentrantEditsAndNestedRestoreCalls() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), target = try restoreRaw("target")
        d.inject(before, forKey: restoreKey)
        let reading = ReadingStore(defaults: d), backup = try restoreEnvelope(target)
        let preview = try reading.previewRestore(from: backup)
        var inspected = false
        d.afterSet = { [weak d] key in
            guard key == self.restoreSlot else { return }
            d?.afterSet = nil; inspected = true
            reading.toggleBookmark("reentrant"); reading.markOpened("reentrant")
            reading.record(articleID: "reentrant", heading: nil, fraction: 0.8)
            do { _ = try reading.previewRestore(from: backup); XCTFail("Nested preview must fail") }
            catch { XCTAssertEqual(error as? ReadingStore.RestoreFailure, .busy) }
            do { try reading.applyRestore(preview, backupCreatedAt: self.restoreDate); XCTFail("Nested apply must fail") }
            catch { XCTAssertEqual(error as? ReadingStore.RestoreFailure, .busy) }
            do { _ = try reading.retainedRestoreBackup(); XCTFail("Nested retention read must fail") }
            catch { XCTAssertEqual(error as? ReadingStore.RestoreFailure, .busy) }
            do { _ = try reading.exportBackup(createdAt: self.restoreDate, appVersion: "0.2.20"); XCTFail("Nested export must fail") }
            catch { XCTAssertEqual(error as? ReadingBackupCodec.Failure, .unavailable) }
            XCTAssertEqual(reading.bookmarks, ["before"])
        }
        try reading.applyRestore(preview, backupCreatedAt: restoreDate)
        XCTAssertTrue(inspected); XCTAssertEqual(d.setKeys, [restoreSlot, restoreKey]); XCTAssertEqual(d.removeKeys, [])
        XCTAssertEqual(reading.bookmarks, ["target"]); XCTAssertEqual(d.data(forKey: restoreKey), target)
    }

    func testRestoreMaximumHealthyRawBeforeFitsItsBoundedRetainedEnvelope() throws {
        let d = try restoreDefaults(), target = try restoreRaw("target")
        var before = Data(#"{"bookmarks":[],"positions":{}}"#.utf8)
        before.append(Data(repeating: 0x20, count: 1_048_576 - before.count))
        d.inject(before, forKey: restoreKey)
        let reading = ReadingStore(defaults: d), preview = try reading.previewRestore(from: restoreEnvelope(target))
        try reading.applyRestore(preview, backupCreatedAt: restoreDate)
        let retained = try XCTUnwrap(reading.retainedRestoreBackup()), slot = try XCTUnwrap(d.data(forKey: restoreSlot))
        XCTAssertTrue(slot.count <= 2_097_152)
        XCTAssertEqual(try ReadingBackupCodec.decode(reading.exportRetainedRestoreBackup(retained, appVersion: "0.2.20")).rawData, before)
        XCTAssertEqual(d.data(forKey: restoreKey), target)
    }
    func testRestoreNilOrNonDataPrimaryReadbackKeepsTheBeforeSlotAndSuspendsSaving() throws {
        let before = try restoreRaw("before"), target = try restoreRaw("target")
        for becomesMissing in [true, false] {
            let d = try restoreDefaults(); d.inject(before, forKey: restoreKey)
            let recovery = Data("prior recovery".utf8); d.inject(recovery, forKey: restoreKey + ".recovery.v1")
            let reading = ReadingStore(defaults: d), preview = try reading.previewRestore(from: restoreEnvelope(target))
            d.afterSet = { [weak d] key in
                guard key == self.restoreKey else { return }
                d?.afterSet = nil
                d?.inject(becomesMissing ? nil : "foreign non-Data value", forKey: self.restoreKey)
            }
            assertRestoreError(.primaryWriteUnconfirmed, try reading.applyRestore(preview, backupCreatedAt: restoreDate))
            XCTAssertTrue(reading.restoreSaveSuspended); XCTAssertEqual(reading.bookmarks, ["before"])
            if becomesMissing { XCTAssertNil(d.object(forKey: restoreKey)) }
            else { XCTAssertEqual(d.string(forKey: restoreKey), "foreign non-Data value") }
            let retained = try XCTUnwrap(reading.retainedRestoreBackup())
            XCTAssertEqual(try ReadingBackupCodec.decode(reading.exportRetainedRestoreBackup(retained, appVersion: "0.2.20")).rawData, before)
            XCTAssertEqual(d.data(forKey: restoreKey + ".recovery.v1"), recovery)
            XCTAssertEqual(d.setKeys, [restoreSlot, restoreKey]); XCTAssertEqual(d.removeKeys, [])
            d.resetLedger(); reading.toggleBookmark("do-not-save"); reading.markOpened("do-not-save")
            XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
        }
    }

    func testRestoreRejectsMalformedRetainedMetadataWithoutOverwritingIt() throws {
        let before = try restoreRaw("before"), target = try restoreRaw("target"), next = try restoreRaw("next")
        let seed = try restoreDefaults(); seed.inject(before, forKey: restoreKey)
        let initial = ReadingStore(defaults: seed)
        try initial.applyRestore(initial.previewRestore(from: restoreEnvelope(target)), backupCreatedAt: restoreDate)
        let valid = try XCTUnwrap(seed.data(forKey: restoreSlot))
        let object = try XCTUnwrap(JSONSerialization.jsonObject(with: valid) as? [String: Any])
        let edits: [(String, Any)] = [
            ("format", "future"), ("schemaVersion", 2), ("beforePresent", false),
            ("beforeBase64", Data("{}".utf8).base64EncodedString()),
            ("beforeSHA256", String(repeating: "0", count: 64)), ("targetSHA256", "bad"),
            ("createdAt", "2026-10-28T01:00:00+01:00"), ("future", true)
        ]
        var variants: [Data] = try edits.map { key, value in
            var changed = object; changed[key] = value
            return try JSONSerialization.data(withJSONObject: changed, options: [.sortedKeys])
        }
        let text = try XCTUnwrap(String(data: valid, encoding: .utf8))
        variants.append(Data(("{\"schemaVersion\":1," + text.dropFirst()).utf8))
        for malformed in variants {
            let d = try restoreDefaults(); d.inject(target, forKey: restoreKey); d.inject(malformed, forKey: restoreSlot)
            let reading = ReadingStore(defaults: d)
            assertRestoreError(.retainedBackupUnsupported, try reading.previewRestore(from: restoreEnvelope(next)))
            XCTAssertThrowsError(try reading.retainedRestoreBackup())
            XCTAssertEqual(d.data(forKey: restoreSlot), malformed); XCTAssertEqual(d.data(forKey: restoreKey), target)
            XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
        }
    }
    // END PRIVATE RESTORE ENGINE TESTS

    // BEGIN RESTORE V2 MISMATCH REGRESSIONS
    func testRestoreReleaseForeignPrimarySuspendsAllLaterEditsAndPreservesBothBackups() throws {
        let before = try restoreRaw("before"), target = try restoreRaw("target"), foreign = try restoreRaw("external-newer")
        for scenario in 0..<3 {
            let d = try restoreDefaults(), recovery = Data("old recovery".utf8)
            d.inject(before, forKey: restoreKey); d.inject(recovery, forKey: restoreKey + ".recovery.v1")
            let reading = ReadingStore(defaults: d)
            try reading.applyRestore(reading.previewRestore(from: restoreEnvelope(target)), backupCreatedAt: restoreDate)
            let retained = try XCTUnwrap(reading.retainedRestoreBackup()), slot = try XCTUnwrap(d.data(forKey: restoreSlot))
            if scenario == 0 { d.inject(foreign, forKey: restoreKey) }
            else if scenario == 1 { d.inject(nil, forKey: restoreKey) }
            else { d.inject("foreign non-Data", forKey: restoreKey) }
            d.resetLedger()
            assertRestoreError(.stale, try reading.releaseRetainedRestoreBackup(retained))
            XCTAssertTrue(reading.restoreSaveSuspended)
            reading.toggleBookmark("must-not-save"); reading.markOpened("must-not-save")
            reading.record(articleID: "must-not-save", heading: nil, fraction: 0.8)
            XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
            XCTAssertEqual(reading.bookmarks, ["target"]); XCTAssertEqual(reading.lastArticleID, "target")
            if scenario == 0 { XCTAssertEqual(d.data(forKey: restoreKey), foreign) }
            else if scenario == 1 { XCTAssertNil(d.object(forKey: restoreKey)) }
            else { XCTAssertEqual(d.string(forKey: restoreKey), "foreign non-Data") }
            XCTAssertEqual(d.data(forKey: restoreSlot), slot)
            XCTAssertEqual(d.data(forKey: restoreKey + ".recovery.v1"), recovery)
            assertRestoreError(.observedPrimaryChange, try reading.releaseRetainedRestoreBackup(retained))
        }
    }

    func testRestorePreviewForeignPrimaryDetectionAlsoSuspendsStaleLiveWrites() throws {
        let before = try restoreRaw("before"), target = try restoreRaw("target"), foreign = try restoreRaw("external-newer")
        for scenario in 0..<3 {
            let d = try restoreDefaults(), recovery = Data("old recovery".utf8)
            d.inject(before, forKey: restoreKey); d.inject(recovery, forKey: restoreKey + ".recovery.v1")
            let reading = ReadingStore(defaults: d)
            if scenario == 0 { d.inject(foreign, forKey: restoreKey) }
            else if scenario == 1 { d.inject(nil, forKey: restoreKey) }
            else { d.inject("foreign non-Data", forKey: restoreKey) }
            d.resetLedger()
            XCTAssertThrowsError(try reading.previewRestore(from: restoreEnvelope(target)))
            XCTAssertTrue(reading.restoreSaveSuspended)
            reading.toggleBookmark("must-not-save"); reading.markOpened("must-not-save")
            reading.record(articleID: "must-not-save", heading: nil, fraction: 0.8)
            XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
            if scenario == 0 { XCTAssertEqual(d.data(forKey: restoreKey), foreign) }
            else if scenario == 1 { XCTAssertNil(d.object(forKey: restoreKey)) }
            else { XCTAssertEqual(d.string(forKey: restoreKey), "foreign non-Data") }
            XCTAssertNil(d.object(forKey: restoreSlot))
            XCTAssertEqual(d.data(forKey: restoreKey + ".recovery.v1"), recovery)
            XCTAssertFalse(ReadingStore.RestoreFailure.observedPrimaryChange.localizedDescription.contains("退避は確認"))
        }
    }

    func testRestoreRetainedReadForeignPrimarySuspendsEditingButCanExportTheBeforeSnapshot() throws {
        let before = try restoreRaw("before"), target = try restoreRaw("target"), foreign = try restoreRaw("external-newer")
        for scenario in 0..<3 {
            let d = try restoreDefaults(), recovery = Data("old recovery".utf8)
            d.inject(before, forKey: restoreKey); d.inject(recovery, forKey: restoreKey + ".recovery.v1")
            let reading = ReadingStore(defaults: d)
            try reading.applyRestore(reading.previewRestore(from: restoreEnvelope(target)), backupCreatedAt: restoreDate)
            let slot = try XCTUnwrap(d.data(forKey: restoreSlot))
            if scenario == 0 { d.inject(foreign, forKey: restoreKey) }
            else if scenario == 1 { d.inject(nil, forKey: restoreKey) }
            else { d.inject("foreign non-Data", forKey: restoreKey) }
            d.resetLedger()
            let retained = try XCTUnwrap(reading.retainedRestoreBackup())
            XCTAssertTrue(reading.restoreSaveSuspended)
            XCTAssertEqual(try ReadingBackupCodec.decode(reading.exportRetainedRestoreBackup(retained, appVersion: "0.2.20")).rawData, before)
            reading.toggleBookmark("must-not-save"); reading.markOpened("must-not-save")
            reading.record(articleID: "must-not-save", heading: nil, fraction: 0.8)
            XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
            if scenario == 0 { XCTAssertEqual(d.data(forKey: restoreKey), foreign) }
            else if scenario == 1 { XCTAssertNil(d.object(forKey: restoreKey)) }
            else { XCTAssertEqual(d.string(forKey: restoreKey), "foreign non-Data") }
            XCTAssertEqual(d.data(forKey: restoreSlot), slot)
            XCTAssertEqual(d.data(forKey: restoreKey + ".recovery.v1"), recovery)
        }
    }

    func testRestorePreviewDetectsForeignByteSnapshotChangeEvenWhenTheStateIsEquivalent() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), target = try restoreRaw("target")
        var foreign = before; foreign.append(0x20)
        let recovery = Data("old recovery".utf8)
        d.inject(before, forKey: restoreKey); d.inject(recovery, forKey: restoreKey + ".recovery.v1")
        let reading = ReadingStore(defaults: d)
        var reads = 0
        d.beforeDataRead = { [weak d] key in
            guard key == self.restoreKey else { return }
            reads += 1
            if reads == 2 { d?.beforeDataRead = nil; d?.inject(foreign, forKey: self.restoreKey) }
        }
        assertRestoreError(.stale, try reading.previewRestore(from: restoreEnvelope(target)))
        XCTAssertTrue(reading.restoreSaveSuspended)
        reading.toggleBookmark("must-not-save"); reading.markOpened("must-not-save")
        reading.record(articleID: "must-not-save", heading: nil, fraction: 0.8)
        XCTAssertEqual(d.data(forKey: restoreKey), foreign)
        XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
        XCTAssertNil(d.object(forKey: restoreSlot))
        XCTAssertEqual(d.data(forKey: restoreKey + ".recovery.v1"), recovery)
    }

    func testRestoreOwnHealthyEditMakesReleaseStaleWithoutSuspendingNormalUse() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), target = try restoreRaw("target")
        let recovery = Data("old recovery".utf8)
        d.inject(before, forKey: restoreKey); d.inject(recovery, forKey: restoreKey + ".recovery.v1")
        let reading = ReadingStore(defaults: d)
        try reading.applyRestore(reading.previewRestore(from: restoreEnvelope(target)), backupCreatedAt: restoreDate)
        let retained = try XCTUnwrap(reading.retainedRestoreBackup()), slot = try XCTUnwrap(d.data(forKey: restoreSlot))
        reading.toggleBookmark("own-edit"); let ownRaw = d.data(forKey: restoreKey); d.resetLedger()
        assertRestoreError(.stale, try reading.releaseRetainedRestoreBackup(retained))
        XCTAssertFalse(reading.restoreSaveSuspended)
        XCTAssertEqual(d.data(forKey: restoreKey), ownRaw)
        XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
        reading.markOpened("still-usable")
        XCTAssertEqual(d.setKeys, [restoreKey]); XCTAssertEqual(ReadingStore(defaults: d).lastArticleID, "still-usable")
        XCTAssertEqual(d.data(forKey: restoreSlot), slot)
        XCTAssertEqual(d.data(forKey: restoreKey + ".recovery.v1"), recovery)
    }

    func testRestoreOwnHealthyEditMakesApplyStaleWithoutSuspendingNormalUse() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), target = try restoreRaw("target")
        let recovery = Data("old recovery".utf8)
        d.inject(before, forKey: restoreKey); d.inject(recovery, forKey: restoreKey + ".recovery.v1")
        let reading = ReadingStore(defaults: d), preview = try reading.previewRestore(from: restoreEnvelope(target))
        reading.toggleBookmark("own-edit"); let ownRaw = d.data(forKey: restoreKey); d.resetLedger()
        assertRestoreError(.stale, try reading.applyRestore(preview, backupCreatedAt: restoreDate))
        XCTAssertFalse(reading.restoreSaveSuspended)
        XCTAssertEqual(d.data(forKey: restoreKey), ownRaw)
        XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
        reading.markOpened("still-usable")
        XCTAssertEqual(d.setKeys, [restoreKey]); XCTAssertEqual(ReadingStore(defaults: d).lastArticleID, "still-usable")
        XCTAssertNil(d.object(forKey: restoreSlot))
        XCTAssertEqual(d.data(forKey: restoreKey + ".recovery.v1"), recovery)
    }

    func testRestoreOwnPersistedEditDuringPreviewIsStaleWithoutFalseSuspension() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), target = try restoreRaw("target")
        let recovery = Data("old recovery".utf8)
        d.inject(before, forKey: restoreKey); d.inject(recovery, forKey: restoreKey + ".recovery.v1")
        let reading = ReadingStore(defaults: d)
        var reads = 0
        d.afterDataRead = { [weak d] key in
            guard key == self.restoreKey else { return }
            reads += 1
            if reads == 2 { d?.afterDataRead = nil; reading.toggleBookmark("own-during-preview") }
        }
        assertRestoreError(.stale, try reading.previewRestore(from: restoreEnvelope(target)))
        XCTAssertFalse(reading.restoreSaveSuspended)
        XCTAssertTrue(reading.bookmarks.contains("own-during-preview"))
        XCTAssertEqual(d.setKeys, [restoreKey]); XCTAssertEqual(d.removeKeys, [])
        d.resetLedger(); reading.markOpened("still-usable")
        XCTAssertEqual(d.setKeys, [restoreKey]); XCTAssertEqual(ReadingStore(defaults: d).lastArticleID, "still-usable")
        XCTAssertNil(d.object(forKey: restoreSlot))
        XCTAssertEqual(d.data(forKey: restoreKey + ".recovery.v1"), recovery)
    }
    func testRestoreNormalExportForeignPrimaryChangeAlsoStopsSubsequentStaleEdits() throws {
        let before = try restoreRaw("before"), foreign = try restoreRaw("external-newer")
        for scenario in 0..<3 {
            let d = try restoreDefaults(), recovery = Data("old recovery".utf8)
            d.inject(before, forKey: restoreKey); d.inject(recovery, forKey: restoreKey + ".recovery.v1")
            let reading = ReadingStore(defaults: d)
            var reads = 0
            d.beforeDataRead = { [weak d] key in
                guard key == self.restoreKey else { return }
                reads += 1
                if reads == 2 {
                    d?.beforeDataRead = nil
                    if scenario == 0 { d?.inject(foreign, forKey: self.restoreKey) }
                    else if scenario == 1 { d?.inject(nil, forKey: self.restoreKey) }
                    else { d?.inject("foreign non-Data", forKey: self.restoreKey) }
                }
            }
            XCTAssertThrowsError(try reading.exportBackup(createdAt: restoreDate, appVersion: "0.2.20")) {
                XCTAssertEqual($0 as? ReadingBackupCodec.Failure, .changed)
            }
            XCTAssertTrue(reading.restoreSaveSuspended)
            reading.toggleBookmark("must-not-save"); reading.markOpened("must-not-save")
            reading.record(articleID: "must-not-save", heading: nil, fraction: 0.8)
            XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
            if scenario == 0 { XCTAssertEqual(d.data(forKey: restoreKey), foreign) }
            else if scenario == 1 { XCTAssertNil(d.object(forKey: restoreKey)) }
            else { XCTAssertEqual(d.string(forKey: restoreKey), "foreign non-Data") }
            XCTAssertNil(d.object(forKey: restoreSlot))
            XCTAssertEqual(d.data(forKey: restoreKey + ".recovery.v1"), recovery)
        }
    }

    func testRestoreOwnHealthyEditDuringNormalExportDoesNotSuspendFutureEditing() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), recovery = Data("old recovery".utf8)
        d.inject(before, forKey: restoreKey); d.inject(recovery, forKey: restoreKey + ".recovery.v1")
        let reading = ReadingStore(defaults: d)
        d.afterDataRead = { [weak d] key in
            guard key == self.restoreKey else { return }
            d?.afterDataRead = nil; reading.toggleBookmark("own-during-export")
        }
        XCTAssertThrowsError(try reading.exportBackup(createdAt: restoreDate, appVersion: "0.2.20")) {
            XCTAssertEqual($0 as? ReadingBackupCodec.Failure, .changed)
        }
        XCTAssertFalse(reading.restoreSaveSuspended)
        XCTAssertTrue(reading.bookmarks.contains("own-during-export"))
        XCTAssertEqual(d.setKeys, [restoreKey]); XCTAssertEqual(d.removeKeys, [])
        d.resetLedger(); reading.markOpened("still-usable")
        XCTAssertEqual(d.setKeys, [restoreKey]); XCTAssertEqual(ReadingStore(defaults: d).lastArticleID, "still-usable")
        XCTAssertNil(d.object(forKey: restoreSlot))
        XCTAssertEqual(d.data(forKey: restoreKey + ".recovery.v1"), recovery)
    }
    // END RESTORE V2 MISMATCH REGRESSIONS

    // BEGIN RESTORE V3 IDENTITY INTEGRATION
    func testRestoreApplyRegistersGeneralIdentityAndNextOperationsRemainHealthy() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), target = try restoreRaw("target")
        let recovery = Data("old recovery".utf8)
        d.inject(before, forKey: restoreKey); d.inject(recovery, forKey: restoreKey + ".recovery.v1")
        let reading = ReadingStore(defaults: d)
        try reading.applyRestore(reading.previewRestore(from: restoreEnvelope(target)), backupCreatedAt: restoreDate)
        XCTAssertFalse(reading.readingSaveSuspended); XCTAssertEqual(reading.restoreSaveSuspended, reading.readingSaveSuspended)
        // This must succeed before any normal write could refresh the identity incidentally.
        XCTAssertEqual(try ReadingBackupCodec.decode(reading.exportBackup(createdAt: restoreDate, appVersion: "0.2.20")).rawData, target)
        reading.markOpened("later"); reading.record(articleID: "later", heading: nil, fraction: 0.7)
        let current = try XCTUnwrap(d.data(forKey: restoreKey))
        XCTAssertEqual(try ReadingBackupCodec.decode(reading.exportBackup(createdAt: restoreDate, appVersion: "0.2.20")).rawData, current)
        XCTAssertFalse(reading.readingSaveSuspended); XCTAssertFalse(reading.restoreSaveSuspended)
        let retained = try XCTUnwrap(reading.retainedRestoreBackup())
        XCTAssertEqual(try ReadingBackupCodec.decode(reading.exportRetainedRestoreBackup(retained, appVersion: "0.2.20")).rawData, before)
        try reading.releaseRetainedRestoreBackup(retained)
        XCTAssertNil(d.object(forKey: restoreSlot))
        XCTAssertEqual(d.data(forKey: restoreKey + ".recovery.v1"), recovery)
        XCTAssertFalse(reading.readingSaveSuspended)
    }

    func testRestoreForeignMetadataIdentityStopsPreviewRetainedReadAndRelease() throws {
        let before = try restoreRaw("before"), target = try restoreRaw("target")
        for scenario in 0..<3 {
            let d = try restoreDefaults(), recovery = Data("old recovery".utf8)
            d.inject(before, forKey: restoreKey); d.inject(recovery, forKey: restoreKey + ".recovery.v1")
            let reading = ReadingStore(defaults: d)
            var retained: ReadingStore.RetainedRestoreBackup?
            if scenario != 0 {
                try reading.applyRestore(reading.previewRestore(from: restoreEnvelope(target)), backupCreatedAt: restoreDate)
                retained = try reading.retainedRestoreBackup()
            }
            let known = scenario == 0 ? before : target
            var object = try XCTUnwrap(JSONSerialization.jsonObject(with: known) as? [String: Any])
            object["future"] = ["externalNote": "must-preserve"]
            let foreign = try JSONSerialization.data(withJSONObject: object, options: [.sortedKeys])
            let slot = d.data(forKey: restoreSlot)
            d.inject(foreign, forKey: restoreKey); d.resetLedger()
            if scenario == 0 { XCTAssertThrowsError(try reading.previewRestore(from: restoreEnvelope(target))) }
            else if scenario == 1 {
                let refreshed = try XCTUnwrap(reading.retainedRestoreBackup())
                XCTAssertEqual(try ReadingBackupCodec.decode(reading.exportRetainedRestoreBackup(refreshed, appVersion: "0.2.20")).rawData, before)
            } else { assertRestoreError(.stale, try reading.releaseRetainedRestoreBackup(try XCTUnwrap(retained))) }
            XCTAssertTrue(reading.readingSaveSuspended); XCTAssertEqual(reading.restoreSaveSuspended, reading.readingSaveSuspended)
            reading.toggleBookmark("no"); reading.markOpened("no"); reading.record(articleID: "no", heading: nil, fraction: 0.8)
            XCTAssertFalse(reading.recoverReadableState())
            XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
            XCTAssertEqual(d.data(forKey: restoreKey), foreign); XCTAssertEqual(d.data(forKey: restoreSlot), slot)
            XCTAssertEqual(d.data(forKey: restoreKey + ".recovery.v1"), recovery)
        }
    }

    func testRestoreRetryRegistersTargetAndLaterExportDriftUsesObservedStopReason() throws {
        let d = try restoreDefaults(), before = try restoreRaw("before"), target = try restoreRaw("target")
        d.inject(before, forKey: restoreKey)
        let reading = ReadingStore(defaults: d), initial = try reading.previewRestore(from: restoreEnvelope(target))
        d.rejectedSetKeys.insert(restoreKey)
        assertRestoreError(.primaryWriteUnconfirmed, try reading.applyRestore(initial, backupCreatedAt: restoreDate))
        XCTAssertTrue(reading.readingSaveSuspended)
        d.rejectedSetKeys.remove(restoreKey)
        try reading.applyRestore(reading.previewRestore(from: restoreEnvelope(target)), backupCreatedAt: restoreDate)
        XCTAssertEqual(try ReadingBackupCodec.decode(reading.exportBackup(createdAt: restoreDate, appVersion: "0.2.20")).rawData, target)
        XCTAssertFalse(reading.readingSaveSuspended)
        let retained = try XCTUnwrap(reading.retainedRestoreBackup()), slot = d.data(forKey: restoreSlot)
        var foreign = target; foreign.append(0x20)
        d.inject(foreign, forKey: restoreKey); d.resetLedger()
        XCTAssertThrowsError(try reading.exportBackup(createdAt: restoreDate, appVersion: "0.2.20")) {
            XCTAssertEqual($0 as? ReadingBackupCodec.Failure, .changed)
        }
        assertRestoreError(.observedPrimaryChange, try reading.releaseRetainedRestoreBackup(retained))
        XCTAssertTrue(reading.readingSaveSuspended); XCTAssertTrue(reading.restoreSaveSuspended)
        XCTAssertEqual(d.data(forKey: restoreKey), foreign); XCTAssertEqual(d.data(forKey: restoreSlot), slot)
        XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
    }
    // END RESTORE V3 IDENTITY INTEGRATION

    private var actorRestoreDate: Date { Date(timeIntervalSince1970: 1_793_145_600) }

    private func actorRestoreTarget() throws -> (raw: Data, backup: Data) {
        let raw = Data(#"{"bookmarks":["removed/target"],"positions":{"removed/target":{"heading":"saved","fraction":0.75}},"lastArticleID":"removed/target"}"#.utf8)
        return (raw, try ReadingBackupCodec.encode(rawData: raw, createdAt: actorRestoreDate, appVersion: "0.2.20"))
    }

    private func actorRestoreDefaults() throws -> (name: String, defaults: ReadingRestoreActorProbeDefaults) {
        let name = "reading-restore-actor-" + UUID().uuidString
        let defaults = try XCTUnwrap(ReadingRestoreActorProbeDefaults(suiteName: name))
        return (name, defaults)
    }

    @MainActor
    func testReadingRestoreActorPreviewAndCancelPreservePublishedAndPersistedStateWithoutWrites() throws {
        let (name, defaults) = try actorRestoreDefaults()
        defer { defaults.removePersistentDomain(forName: name) }
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark("before")
        reading.markOpened("before")
        let store = LibraryStore(reading: reading)
        let prior = try XCTUnwrap(defaults.data(forKey: "library.reading.v1"))
        let target = try actorRestoreTarget()
        XCTAssertEqual(ReadingBackupDocumentReader.maximumBytes, ReadingBackupCodec.maximumEnvelopeBytes)
        defaults.writeCalls = 0
        let preview = try store.previewReadingRestore(from: target.backup)
        XCTAssertEqual(preview.counts.bookmarks, 1)
        XCTAssertEqual(preview.currentCounts?.bookmarks, 1)
        // Cancel is dropping the preview; neither an engine apply nor a defaults write.
        XCTAssertEqual(defaults.writeCalls, 0)
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), prior)
        XCTAssertEqual(store.bookmarks, ["before"])
        XCTAssertEqual(store.lastArticleID, "before")
        XCTAssertFalse(store.readingSaveSuspended)
        XCTAssertNil(defaults.object(forKey: "library.reading.v1.restore-backup.v1"))
    }

    @MainActor
    func testReadingRestoreActorPublishesOnlyConfirmedTargetAndKeepsItAfterReload() throws {
        let (name, defaults) = try actorRestoreDefaults()
        defer { defaults.removePersistentDomain(forName: name) }
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark("before")
        let store = LibraryStore(reading: reading)
        let target = try actorRestoreTarget()
        let preview = try store.previewReadingRestore(from: target.backup)
        try store.applyReadingRestore(preview, backupCreatedAt: actorRestoreDate)
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), target.raw)
        XCTAssertEqual(store.bookmarks, ["removed/target"])
        XCTAssertEqual(store.lastArticleID, "removed/target")
        XCTAssertFalse(store.readingSaveSuspended)
        XCTAssertNil(store.readingRecoveryIssue)
        let reloaded = LibraryStore(reading: ReadingStore(defaults: defaults))
        XCTAssertEqual(reloaded.bookmarks, store.bookmarks)
        XCTAssertEqual(reloaded.lastArticleID, store.lastArticleID)
        XCTAssertNotNil(try store.retainedReadingRestoreBackup())
    }

    @MainActor
    func testReadingRestoreActorFixtureGateRejectsEveryRestoreManagementEntryBeforeWrites() throws {
        let (name, defaults) = try actorRestoreDefaults()
        defer { defaults.removePersistentDomain(forName: name) }
        let normal = LibraryStore(reading: ReadingStore(defaults: defaults))
        let target = try actorRestoreTarget()
        let preview = try normal.previewReadingRestore(from: target.backup)
        try normal.applyReadingRestore(preview, backupCreatedAt: actorRestoreDate)
        let retained = try XCTUnwrap(normal.retainedReadingRestoreBackup())
        let fixtureReading = ReadingStore(defaults: defaults, key: "fixture.reading.v1")
        fixtureReading.toggleBookmark("fixture")
        let fixture = LibraryStore(reading: fixtureReading, isTestLibrary: true)
        let normalRaw = defaults.data(forKey: "library.reading.v1")
        let fixtureRaw = defaults.data(forKey: "fixture.reading.v1")
        let slot = defaults.data(forKey: "library.reading.v1.restore-backup.v1")
        defaults.writeCalls = 0
        XCTAssertFalse(fixture.allowsReadingRestore)
        @MainActor func requireFixtureRefusal(_ operation: () throws -> Void) {
            XCTAssertThrowsError(try operation()) { XCTAssertEqual($0 as? ReadingBackupCodec.Failure, .unsupportedScope) }
        }
        requireFixtureRefusal { _ = try fixture.previewReadingRestore(from: target.backup) }
        requireFixtureRefusal { try fixture.applyReadingRestore(preview, backupCreatedAt: actorRestoreDate) }
        requireFixtureRefusal { _ = try fixture.retainedReadingRestoreBackup() }
        requireFixtureRefusal { _ = try fixture.exportRetainedReadingRestoreBackup(retained, appVersion: "0.2.20") }
        requireFixtureRefusal { try fixture.releaseReadingRestoreBackup(retained) }
        XCTAssertEqual(defaults.writeCalls, 0)
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), normalRaw)
        XCTAssertEqual(defaults.data(forKey: "fixture.reading.v1"), fixtureRaw)
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1.restore-backup.v1"), slot)
        XCTAssertNil(defaults.object(forKey: "fixture.reading.v1.restore-backup.v1"))
    }

    @MainActor
    func testReadingRestoreActorFailedPrimaryWritePublishesStopAndBlocksNormalEditing() throws {
        let (name, defaults) = try actorRestoreDefaults()
        defer { defaults.removePersistentDomain(forName: name) }
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark("before")
        reading.markOpened("before")
        let store = LibraryStore(reading: reading)
        let target = try actorRestoreTarget()
        let preview = try store.previewReadingRestore(from: target.backup)
        defaults.denyPrimaryWrite = true
        XCTAssertThrowsError(try store.applyReadingRestore(preview, backupCreatedAt: actorRestoreDate)) {
            XCTAssertEqual($0 as? ReadingStore.RestoreFailure, .primaryWriteUnconfirmed)
        }
        XCTAssertTrue(store.readingSaveSuspended)
        XCTAssertEqual(store.bookmarks, ["before"])
        XCTAssertEqual(store.lastArticleID, "before")
        let prior = defaults.data(forKey: "library.reading.v1")
        let slot = defaults.data(forKey: "library.reading.v1.restore-backup.v1")
        defaults.denyPrimaryWrite = false
        defaults.writeCalls = 0
        store.toggleBookmark("must-not-save")
        store.markOpened("must-not-open")
        store.record(articleID: "must-not-record", heading: nil, fraction: 0.5)
        store.recoverReadingState()
        XCTAssertEqual(defaults.writeCalls, 0)
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), prior)
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1.restore-backup.v1"), slot)
        XCTAssertEqual(store.bookmarks, ["before"])
        XCTAssertEqual(store.lastArticleID, "before")
    }

    @MainActor
    func testReadingRestoreActorReleaseFailurePropagatesObservedExternalPrimaryStop() throws {
        let (name, defaults) = try actorRestoreDefaults()
        defer { defaults.removePersistentDomain(forName: name) }
        let store = LibraryStore(reading: ReadingStore(defaults: defaults))
        let target = try actorRestoreTarget()
        let preview = try store.previewReadingRestore(from: target.backup)
        try store.applyReadingRestore(preview, backupCreatedAt: actorRestoreDate)
        let retained = try XCTUnwrap(store.retainedReadingRestoreBackup())
        let external = Data(#"{"bookmarks":["external-newer"],"positions":{}}"#.utf8)
        defaults.set(external, forKey: "library.reading.v1")
        defaults.writeCalls = 0
        XCTAssertThrowsError(try store.releaseReadingRestoreBackup(retained))
        // This regression requires the engine correction and general reading-save stop backport.
        XCTAssertTrue(store.readingSaveSuspended)
        store.toggleBookmark("must-not-overwrite")
        XCTAssertEqual(defaults.writeCalls, 0)
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), external)
        XCTAssertNotNil(defaults.object(forKey: "library.reading.v1.restore-backup.v1"))
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

    // IOS-11 prototype regressions; SDK compilation/execution remain pending.
    func testIntraBlockAnchorOldJSONAndMalformedOptionalProgressRemainCompatible() throws {
        let prefix = "{\"version\":1,\"documentDigest\":\"\(readingDigest)\",\"blockFingerprint\":\"\(readingDigest)\""
        let legacy = try JSONDecoder().decode(NativeReadingAnchor.self, from: Data((prefix + "}").utf8))
        XCTAssertEqual(legacy.version, 1)
        XCTAssertNil(legacy.intraBlockFraction)
        for suffix in [",\"intraBlockFraction\":null}", ",\"intraBlockFraction\":\"bad\"}",
                       ",\"intraBlockFraction\":{}}", ",\"intraBlockFraction\":true}",
                       ",\"intraBlockFraction\":-0.1}", ",\"intraBlockFraction\":1.1}"] {
            let decoded = try JSONDecoder().decode(NativeReadingAnchor.self, from: Data((prefix + suffix).utf8))
            XCTAssertEqual(decoded, legacy, "Malformed progress must not discard the semantic anchor")
        }
        for value in [Double.nan, .infinity, -.infinity, -0.01, 1.01] {
            XCTAssertNil(NativeReadingAnchor(documentDigest: readingDigest, blockFingerprint: readingDigest,
                                            intraBlockFraction: value)?.intraBlockFraction)
        }
        let nonfiniteDecoder = JSONDecoder()
        nonfiniteDecoder.nonConformingFloatDecodingStrategy = .convertFromString(
            positiveInfinity: "Infinity", negativeInfinity: "-Infinity", nan: "NaN")
        for value in ["Infinity", "-Infinity", "NaN"] {
            let decoded = try nonfiniteDecoder.decode(NativeReadingAnchor.self,
                from: Data((prefix + ",\"intraBlockFraction\":\"\(value)\"}").utf8))
            XCTAssertEqual(decoded, legacy)
        }
        for value in [0.0, 0.2, 0.7, 1.0] {
            let anchor = try XCTUnwrap(NativeReadingAnchor(documentDigest: readingDigest,
                blockFingerprint: readingDigest, intraBlockFraction: value))
            XCTAssertEqual(try JSONDecoder().decode(NativeReadingAnchor.self, from: JSONEncoder().encode(anchor)), anchor)
            XCTAssertEqual(anchor.withoutIntraBlockFraction, legacy)
            XCTAssertEqual(anchor.version, 1, "An optional local field does not reinterpret the old anchor version")
        }
    }

    func testIntraBlockSemanticResolutionRetainsOnlyTheIdentifiedSameBlock() throws {
        let old = readingDocument([readingHeading("old-heading", "第一節"), readingParagraph("target", "読書中"),
                                   readingHeading("second", "第二節"), readingParagraph("other", "読書中")])
        let anchor = try XCTUnwrap(old.readingAnchor(blockID: "target", documentDigest: readingDigest,
                                                    intraBlockFraction: 0.7))
        let saved = ReadingPosition(heading: "old-heading", fraction: 0.3, blockID: "target", anchor: anchor)
        XCTAssertEqual(old.readingResolution(for: saved, documentDigest: readingDigest),
                       NativeReadingResolution(blockID: "target", restoresSameBlock: true))
        let unique = readingDocument([readingParagraph("front", "挿入"), readingHeading("new", "改名"),
                                      readingParagraph("new-target", "読書中")])
        XCTAssertEqual(unique.readingResolution(for: saved, documentDigest: revisedReadingDigest),
                       NativeReadingResolution(blockID: "new-target", restoresSameBlock: true))
        let section = readingDocument([readingHeading("new-second", "第二節"), readingParagraph("wrong", "読書中"),
                                       readingHeading("new-first", "第一節"), readingParagraph("right", "読書中")])
        XCTAssertEqual(section.readingResolution(for: saved, documentDigest: revisedReadingDigest),
                       NativeReadingResolution(blockID: "right", restoresSameBlock: true))
        for changed in [readingDocument([readingHeading("new-first", "第一節")]),
                        readingDocument([readingHeading("new-first", "第一節"), readingParagraph("target", "書き換えた本文")]),
                        readingDocument(section.blocks + [readingParagraph("duplicate", "読書中")])] {
            XCTAssertEqual(changed.readingResolution(for: saved, documentDigest: revisedReadingDigest),
                           NativeReadingResolution(blockID: "new-first", restoresSameBlock: false))
        }
        let ambiguous = readingDocument([readingHeading("a", "第一節"), readingParagraph("target", "読書中"),
                                         readingHeading("b", "第一節"), readingParagraph("last", "読書中")])
        XCTAssertEqual(ambiguous.readingResolution(for: saved, documentDigest: revisedReadingDigest),
                       NativeReadingResolution(blockID: "a", restoresSameBlock: false))
        XCTAssertNil(readingDocument([]).readingResolution(for: saved, documentDigest: revisedReadingDigest))
    }

    func testIntraBlockLookupDiscardsFallbackProgressWithoutRewritingRecords() throws {
        let suite = "library-intrablock-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let original = readingDocument([readingHeading("old", "第一節"), readingParagraph("target", "読書中")])
        let anchor = try XCTUnwrap(original.readingAnchor(blockID: "target", documentDigest: readingDigest,
                                                         intraBlockFraction: 0.7))
        let writer = ReadingStore(defaults: defaults)
        writer.toggleBookmark("example")
        writer.record(articleID: "other", heading: nil, fraction: 0.8)
        writer.record(articleID: "example", heading: "intro", fraction: 0.42, blockID: "target", anchor: anchor)
        let bytes = try XCTUnwrap(defaults.data(forKey: "library.reading.v1"))
        let reading = ReadingStore(defaults: defaults)
        let unchanged = reading.position(for: article(), document: original, documentDigest: readingDigest)
        XCTAssertEqual(unchanged.anchor?.intraBlockFraction, 0.7)
        let inserted = readingDocument([readingParagraph("front", "挿入"), readingHeading("new", "第一節"),
                                        readingParagraph("new-target", "読書中")])
        XCTAssertEqual(reading.position(for: article(), document: inserted,
                                       documentDigest: revisedReadingDigest).anchor?.intraBlockFraction, 0.7)
        let edited = readingDocument([readingHeading("new", "第一節"), readingParagraph("target", "異なる本文")])
        let fallback = reading.position(for: article(), document: edited, documentDigest: revisedReadingDigest)
        XCTAssertEqual(fallback.blockID, "new")
        XCTAssertNil(fallback.anchor?.intraBlockFraction)
        XCTAssertEqual(fallback.anchor?.blockFingerprint, anchor.blockFingerprint)
        XCTAssertEqual(fallback.fraction, 0.42, "Legacy block-order fraction must keep its meaning")
        let repeated = readingDocument([readingHeading("first", "第一節"), readingParagraph("copy-a", "読書中"),
                                        readingHeading("second", "第一節"), readingParagraph("copy-b", "読書中")])
        let fractional = reading.position(for: article(), document: repeated, documentDigest: revisedReadingDigest)
        XCTAssertEqual(fractional.blockID, "copy-a")
        XCTAssertNil(fractional.anchor?.intraBlockFraction, "An order fallback must not transplant progress into a duplicate block")
        let disambiguated = readingDocument([readingHeading("other", "第二節"), readingParagraph("copy-b", "読書中"),
                                             readingHeading("right", "第一節"), readingParagraph("copy-a", "読書中")])
        XCTAssertEqual(reading.position(for: article(), document: disambiguated,
                                       documentDigest: revisedReadingDigest).anchor?.intraBlockFraction, 0.7)
        XCTAssertNil(reading.position(for: article(), document: readingDocument([])).anchor?.intraBlockFraction)
        XCTAssertEqual(reading.position(for: article()).anchor?.intraBlockFraction, 0.7)
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), bytes, "Resolution is read-only, including dropping stale progress")
        XCTAssertEqual(reading.bookmarks, ["example"])
        let object = try XCTUnwrap(try JSONSerialization.jsonObject(with: bytes) as? [String: Any])
        XCTAssertNotNil((object["positions"] as? [String: Any])?["other"])
    }

    func testIntraBlockBufferCoalescesSameBlockAndRejectsSupersededDelay() throws {
        var buffer = NativeReadingProgressBuffer()
        let first = NativeReadingSample(heading: "intro", blockID: "tall", fraction: 0.42, intraBlockFraction: 0.2)
        let later = NativeReadingSample(heading: "intro", blockID: "tall", fraction: 0.42, intraBlockFraction: 0.7)
        let oldToken = try XCTUnwrap(buffer.stage(first))
        let newToken = try XCTUnwrap(buffer.stage(later))
        XCTAssertNil(buffer.lastSaved, "Staging even many pixel updates must not write")
        XCTAssertNil(buffer.takeForSaving(expectedToken: oldToken, restoring: false), "An earlier task must not flush a newer sample early")
        XCTAssertEqual(buffer.pending, later)
        XCTAssertEqual(buffer.takeForSaving(expectedToken: newToken, restoring: false), later)
        XCTAssertNil(buffer.takeForSaving(expectedToken: newToken, restoring: false))
        XCTAssertNil(buffer.stage(later), "Repeated equal geometry must not write again")
        XCTAssertEqual(buffer.lastSaved?.fraction, first.fraction)
        XCTAssertEqual(buffer.lastSaved?.blockID, first.blockID)
        XCTAssertNotEqual(buffer.lastSaved?.intraBlockFraction, first.intraBlockFraction)
    }

    func testIntraBlockBufferRestorationCancellationAndExitFlushOnlyMeasuredSamples() throws {
        var buffer = NativeReadingProgressBuffer()
        let measured = NativeReadingSample(heading: nil, blockID: "actual", fraction: 0.4, intraBlockFraction: 0.55)
        let token = try XCTUnwrap(buffer.stage(measured))
        XCTAssertNil(buffer.takeForSaving(expectedToken: token, restoring: true))
        XCTAssertEqual(buffer.pending, measured)
        buffer.cancelDelay()
        XCTAssertNil(buffer.takeForSaving(expectedToken: token, restoring: false))
        XCTAssertEqual(buffer.takeForSaving(restoring: false), measured, "Departure flushes the last measured point once")
        XCTAssertNil(buffer.takeForSaving(restoring: false))
        for bad in [Double.nan, .infinity, -.infinity, -0.2, 1.2] {
            XCTAssertNil(buffer.stage(NativeReadingSample(heading: nil, blockID: "unmeasured", fraction: 0.4, intraBlockFraction: bad)))
        }
        XCTAssertNil(buffer.pending)
        XCTAssertEqual(buffer.lastSaved, measured, "A request/invalid geometry cannot become a new saved bookmark location")
    }

    func testAutomaticIntraBlockFailureAndLaterFramesPreservePersistedGoal() throws {
        let suite = "library-intra-completion-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let doc = document()
        let store = ReadingStore(defaults: defaults)
        let anchor = try XCTUnwrap(doc.readingAnchor(blockID: "paragraph", documentDigest: readingDigest, intraBlockFraction: 0.7))
        store.toggleBookmark("example")
        store.record(articleID: "example", heading: "intro", fraction: 0.5, blockID: "paragraph", anchor: anchor)
        let bytes = try XCTUnwrap(defaults.data(forKey: "library.reading.v1"))
        let intermediate = NativeReadingSample(heading: "intro", blockID: "paragraph", fraction: 0.5, intraBlockFraction: 0)
        func persist(_ sample: NativeReadingSample?) {
            guard let sample else { return }
            store.record(articleID: "example", heading: sample.heading, fraction: sample.fraction, blockID: sample.blockID,
                anchor: doc.readingAnchor(blockID: sample.blockID, documentDigest: readingDigest, intraBlockFraction: sample.intraBlockFraction))
        }
        for purpose in [NativeReadingPlacementRequest.Purpose.automaticResume, .automaticReflow] {
            for outcome in [NativeReaderPlacementPolicy.Outcome.exhausted, .unavailable, .cancelled, .superseded, .interrupted, .aligned] {
                var session = NativeReadingProgressSession()
                let request = NativeReadingPlacementRequest(purpose: purpose, userPanEpoch: 9)
                session.beginPlacement(request)
                XCTAssertNil(session.stageMeasured(intermediate, userPanEpoch: 9), "Even valid geometry cannot record while placement is in flight")
                let completion = session.completePlacement(placementAligned: outcome == .aligned, request: request, currentUserPanEpoch: 9,
                    isUserInteracting: false, measured: outcome == .aligned ? nil : intermediate)
                XCTAssertEqual(completion.effect, .preserveAutomaticPosition)
                XCTAssertFalse(completion.effect.consumesOneShot)
                XCTAssertNil(completion.delayToken)
                persist(session.takeForSaving(restoring: false))
                XCTAssertNil(session.stageMeasured(intermediate, userPanEpoch: 9), "A late preference callback must not save the proxy's intermediate top")
                persist(session.takeForSaving(restoring: false))
                XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), bytes)
                XCTAssertEqual(ReadingStore(defaults: defaults).position(for: article()).anchor?.intraBlockFraction, 0.7)
                XCTAssertEqual(store.bookmarks, ["example"])
            }
        }
    }

    func testIntraBlockCompletionSavesClampedActualOrRealUserPanInsteadOfRequestedRatio() throws {
        let suite = "library-intra-actual-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let doc = document(), store = ReadingStore(defaults: defaults)
        var writes = 0
        func persist(_ sample: NativeReadingSample?) {
            guard let sample else { return }
            writes += 1
            store.record(articleID: "example", heading: sample.heading, fraction: sample.fraction, blockID: sample.blockID,
                anchor: doc.readingAnchor(blockID: sample.blockID, documentDigest: readingDigest, intraBlockFraction: sample.intraBlockFraction))
        }
        var session = NativeReadingProgressSession()
        let requestedRatio = 0.7
        let actual = NativeReadingSample(heading: "intro", blockID: "paragraph", fraction: 0.5, intraBlockFraction: 0.6425)
        let request = NativeReadingPlacementRequest(purpose: .automaticResume, userPanEpoch: 4)
        session.beginPlacement(request)
        let completion = session.completePlacement(placementAligned: true, request: request, currentUserPanEpoch: 4,
                                                   isUserInteracting: false, measured: actual)
        XCTAssertEqual(completion.effect, .measuredAlignment)
        XCTAssertTrue(completion.effect.consumesOneShot)
        let token = try XCTUnwrap(completion.delayToken)
        persist(session.takeForSaving(expectedToken: token, restoring: true))
        XCTAssertEqual(writes, 0)
        persist(session.takeForSaving(expectedToken: token, restoring: false))
        persist(session.takeForSaving(expectedToken: token, restoring: false))
        XCTAssertEqual(writes, 1)
        XCTAssertEqual(store.position(for: article()).anchor?.intraBlockFraction, actual.intraBlockFraction)
        XCTAssertNotEqual(store.position(for: article()).anchor?.intraBlockFraction, requestedRatio)
        let panRequest = NativeReadingPlacementRequest(purpose: .automaticReflow, userPanEpoch: 4)
        session.beginPlacement(panRequest)
        let userPoint = NativeReadingSample(heading: "intro", blockID: "paragraph", fraction: 0.5, intraBlockFraction: 0.2)
        let panned = session.completePlacement(placementAligned: false, request: panRequest, currentUserPanEpoch: 5,
                                               isUserInteracting: false, measured: userPoint)
        XCTAssertEqual(panned.effect, .measuredUserPan)
        XCTAssertTrue(panned.effect.consumesOneShot)
        let panToken = try XCTUnwrap(panned.delayToken)
        persist(session.takeForSaving(expectedToken: panToken, restoring: false))
        XCTAssertEqual(writes, 2)
        XCTAssertEqual(store.position(for: article()).anchor?.intraBlockFraction, 0.2)
        let active = NativeReadingPlacementRequest(purpose: .explicitNavigation, userPanEpoch: 5)
        session.beginPlacement(active)
        XCTAssertEqual(session.completePlacement(placementAligned: false, request: active, currentUserPanEpoch: 5,
            isUserInteracting: true, measured: userPoint).effect, .measuredUserPan)
    }

    func testIntraBlockSessionKeepsPendingMeasurementAcrossSceneCancellationAndIgnoresOldGeneration() throws {
        var session = NativeReadingProgressSession()
        let prior = NativeReadingSample(heading: nil, blockID: "prior", fraction: 0.5, intraBlockFraction: 0.7)
        let top = NativeReadingSample(heading: nil, blockID: "requested", fraction: 0.8, intraBlockFraction: 0)
        let oldDelay = try XCTUnwrap(session.stageMeasured(prior, userPanEpoch: 3))
        let old = NativeReadingPlacementRequest(purpose: .explicitNavigation, userPanEpoch: 3)
        let current = NativeReadingPlacementRequest(purpose: .automaticReflow, userPanEpoch: 3)
        session.beginPlacement(old)
        XCTAssertNil(session.userPanBeforeReplacement(userPanEpoch: 3))
        XCTAssertEqual(session.userPanBeforeReplacement(userPanEpoch: 4), 3,
                       "A reflow starting before the old completion must retain proof of the real pan")
        session.beginPlacement(current)
        let stale = session.completePlacement(placementAligned: true, request: old, currentUserPanEpoch: 3,
                                               isUserInteracting: false, measured: top)
        XCTAssertEqual(stale.effect, .ignoreSuperseded)
        XCTAssertNil(session.takeForSaving(expectedToken: oldDelay, restoring: false))
        XCTAssertNil(session.takeForSaving(restoring: false), "The current generation is still in flight")
        session.cancelUnreachedPlacement(userPanEpoch: 3)
        XCTAssertEqual(session.completePlacement(placementAligned: true, request: current, currentUserPanEpoch: 3,
            isUserInteracting: false, measured: top).effect, .ignoreSuperseded)
        XCTAssertEqual(session.takeForSaving(restoring: false), prior, "Departure may flush only the earlier real measurement")
        XCTAssertNil(session.takeForSaving(restoring: false))
        XCTAssertNil(session.stageMeasured(top, userPanEpoch: 3))
        XCTAssertNotNil(session.stageMeasured(top, userPanEpoch: 4), "Only a later real pan releases failed-placement tracking")
        let explicit = NativeReadingPlacementRequest(purpose: .explicitNavigation, userPanEpoch: 4)
        session.beginPlacement(explicit)
        XCTAssertNil(session.blockedAtUserPanEpoch)
        XCTAssertNil(session.userPanBeforeReplacement(userPanEpoch: 4), "An earlier pan must not cancel this newer explicit navigation")
    }

    func testLatestAcceptedAlignmentControlsRequestedFocusAfterAPanRace() throws {
        let userPoint = NativeReadingSample(heading: "intro", blockID: "actual-user-block", fraction: 0.4, intraBlockFraction: 0.2)
        let requestedPoint = NativeReadingSample(heading: "goal", blockID: "old-requested-block", fraction: 0.8, intraBlockFraction: 0.7)
        // The policy has already returned aligned. The latest pan evidence at
        // completion must control both the saved point and the focus decision.
        let latestPanStates: [(UInt64, Bool)] = [(21, false), (20, true)]
        for (currentPan, interacting) in latestPanStates {
            var session = NativeReadingProgressSession()
            let request = NativeReadingPlacementRequest(purpose: .explicitNavigation, userPanEpoch: 20)
            session.beginPlacement(request)
            let completion = session.completePlacement(placementAligned: true, request: request,
                currentUserPanEpoch: currentPan, isUserInteracting: interacting, measured: userPoint)
            XCTAssertEqual(completion.effect, .measuredUserPan)
            XCTAssertTrue(completion.effect.consumesOneShot)
            XCTAssertFalse(completion.effect.restoresRequestedFocus, "An old aligned result must not revive the cancelled goal's VoiceOver focus")
            let token = try XCTUnwrap(completion.delayToken)
            XCTAssertEqual(session.takeForSaving(expectedToken: token, restoring: false), userPoint)
        }
        var session = NativeReadingProgressSession()
        let request = NativeReadingPlacementRequest(purpose: .explicitNavigation, userPanEpoch: 20)
        session.beginPlacement(request)
        let aligned = session.completePlacement(placementAligned: true, request: request,
            currentUserPanEpoch: 20, isUserInteracting: false, measured: requestedPoint)
        XCTAssertEqual(aligned.effect, .measuredAlignment)
        XCTAssertTrue(aligned.effect.restoresRequestedFocus, "A current measured alignment still permits the requested focus")
        let token = try XCTUnwrap(aligned.delayToken)
        XCTAssertEqual(session.takeForSaving(expectedToken: token, restoring: false), requestedPoint)

        for purpose in [NativeReadingPlacementRequest.Purpose.automaticResume, .explicitNavigation] {
            for placementAligned in [false, true] {
                var failed = NativeReadingProgressSession()
                let pending = NativeReadingPlacementRequest(purpose: purpose, userPanEpoch: 20)
                failed.beginPlacement(pending)
                let completion = failed.completePlacement(placementAligned: placementAligned, request: pending,
                    currentUserPanEpoch: 20, isUserInteracting: false, measured: placementAligned ? nil : requestedPoint)
                XCTAssertFalse(completion.effect.restoresRequestedFocus, "Failed or unmeasured placement cannot restore requested focus")
                XCTAssertNil(completion.delayToken)
            }
        }
        let old = NativeReadingPlacementRequest(purpose: .explicitNavigation, userPanEpoch: 20)
        let current = NativeReadingPlacementRequest(purpose: .explicitNavigation, userPanEpoch: 20)
        session.beginPlacement(old)
        session.beginPlacement(current)
        let stale = session.completePlacement(placementAligned: true, request: old,
            currentUserPanEpoch: 20, isUserInteracting: false, measured: requestedPoint)
        XCTAssertEqual(stale.effect, .ignoreSuperseded)
        XCTAssertFalse(stale.effect.restoresRequestedFocus)
        XCTAssertNil(stale.delayToken)
    }

    func testMalformedOptionalIntraBlockFieldPreservesFullReadingStateAndOtherArticles() throws {
        let suite = "library-intra-malformed-state-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let doc = document()
        let anchor = try XCTUnwrap(doc.readingAnchor(blockID: "paragraph", documentDigest: readingDigest))
        let anchorJSON = try XCTUnwrap(try JSONSerialization.jsonObject(with: JSONEncoder().encode(anchor)) as? [String: Any])
        let invalidValues: [Any] = ["bad", [1], true, -0.1, 1.1, NSNull()]
        for invalid in invalidValues {
            var changed = anchorJSON; changed["intraBlockFraction"] = invalid
            let object: [String: Any] = ["bookmarks": ["example"], "lastArticleID": "other", "positions": [
                "example": ["heading": "intro", "fraction": 0.42, "blockID": "paragraph", "anchor": changed],
                "other": ["fraction": 0.8]]]
            let bytes = try JSONSerialization.data(withJSONObject: object)
            defaults.set(bytes, forKey: "library.reading.v1")
            let reading = ReadingStore(defaults: defaults)
            XCTAssertEqual(reading.position(for: article()).anchor, anchor)
            XCTAssertEqual(reading.position(for: article(), document: doc, documentDigest: readingDigest).blockID, "paragraph")
            XCTAssertEqual(reading.position(for: article()).fraction, 0.42)
            XCTAssertEqual(reading.bookmarks, ["example"])
            XCTAssertEqual(reading.lastArticleID, "other")
            XCTAssertEqual(reading.position(for: article(id: "other")).fraction, 0.8)
            XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), bytes)
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

extension LibraryCoreTests {
    func testSnapshotGenerationLeaseIsSharedByValueCopiesUntilLastRelease() throws {
        let bundled = try fixture("lease-copy-bundle")
        let source = try retentionPackage("lease-copy-source", revision: "copy")
        let storage = directory.appendingPathComponent("lease-copy-storage")
        let repository = ContentRepository(bundledRoot: bundled, storageRoot: storage)
        var original: ContentSnapshot? = try repository.install(from: source)
        let root = original!.root
        let generation = try XCTUnwrap(UUID(uuidString: root.lastPathComponent))
        let before = try retentionInventory(storage)
        var copy = original
        XCTAssertEqual(repository.advisorySnapshotAcquisitions, [generation: 1])
        original = nil
        XCTAssertEqual(try copy!.document(for: article()).article_id, "example")
        withExtendedLifetime(copy) {
            XCTAssertEqual(repository.advisorySnapshotAcquisitions, [generation: 1])
        }
        copy = nil
        XCTAssertTrue(repository.advisorySnapshotAcquisitions.isEmpty)
        XCTAssertEqual(try retentionInventory(storage), before, "Lease release never removes a stored version")
        XCTAssertEqual(try Data(contentsOf: root.appendingPathComponent("assets/late-copy.png")), pixel)
    }

    func testIndependentSnapshotLoadsAcquireIndependentlyAndKeepCurrentAtZero() throws {
        let bundled = try fixture("lease-load-bundle")
        let source = try fixture("lease-load-source", revision: "current")
        let storage = directory.appendingPathComponent("lease-load-storage")
        let repository = ContentRepository(bundledRoot: bundled, storageRoot: storage)
        var installed: ContentSnapshot? = try repository.install(from: source)
        let root = installed!.root
        let generation = try XCTUnwrap(UUID(uuidString: root.lastPathComponent))
        var first: ContentSnapshot? = try repository.load()
        var second: ContentSnapshot? = try repository.load()
        XCTAssertEqual(first?.root, root)
        XCTAssertEqual(second?.root, root)
        let before = try retentionInventory(storage)
        withExtendedLifetime((installed, first, second)) {
            XCTAssertEqual(repository.advisorySnapshotAcquisitions, [generation: 3])
        }
        installed = nil
        withExtendedLifetime((first, second)) {
            XCTAssertEqual(repository.advisorySnapshotAcquisitions, [generation: 2])
        }
        first = nil
        withExtendedLifetime(second) {
            XCTAssertEqual(repository.advisorySnapshotAcquisitions, [generation: 1])
        }
        second = nil
        XCTAssertTrue(repository.advisorySnapshotAcquisitions.isEmpty)
        XCTAssertEqual(try retentionInventory(storage), before, "Zero live acquisitions is not deletion permission")
        XCTAssertEqual(try Data(contentsOf: root.appendingPathComponent("assets/pixel.png")), pixel)
    }

    func testIdenticalRevisionsKeepDifferentUUIDSnapshotGenerationsDistinct() throws {
        let bundled = try fixture("lease-revision-bundle")
        let source = try fixture("lease-revision-source", revision: "same")
        let storage = directory.appendingPathComponent("lease-revision-storage")
        let repository = ContentRepository(bundledRoot: bundled, storageRoot: storage)
        var first: ContentSnapshot? = try repository.install(from: source)
        var second: ContentSnapshot? = try repository.install(from: source)
        let firstID = try XCTUnwrap(UUID(uuidString: first!.root.lastPathComponent))
        let secondID = try XCTUnwrap(UUID(uuidString: second!.root.lastPathComponent))
        XCTAssertNotEqual(firstID, secondID)
        XCTAssertEqual(first?.manifest.revision, second?.manifest.revision)
        withExtendedLifetime((first, second)) {
            XCTAssertEqual(repository.advisorySnapshotAcquisitions, [firstID: 1, secondID: 1])
        }
        first = nil
        withExtendedLifetime(second) {
            XCTAssertEqual(repository.advisorySnapshotAcquisitions, [secondID: 1])
        }
        second = nil
        XCTAssertTrue(repository.advisorySnapshotAcquisitions.isEmpty)
        XCTAssertEqual(Set(try FileManager.default.contentsOfDirectory(atPath: storage.appendingPathComponent("versions").path)),
                       Set([firstID.uuidString, secondID.uuidString]))
    }

    func testSnapshotAcquisitionsShareStorageScopeAndSeparateTestStorage() throws {
        let bundled = try fixture("lease-scope-bundle")
        let source = try fixture("lease-scope-source")
        let storage = directory.appendingPathComponent("lease-scope")
        let sameStorage = URL(fileURLWithPath: storage.path + "/", isDirectory: true)
        let testingStorage = directory.appendingPathComponent("lease-scope-testing")
        let firstRepository = ContentRepository(bundledRoot: bundled, storageRoot: storage)
        let secondRepository = ContentRepository(bundledRoot: bundled, storageRoot: sameStorage)
        var first: ContentSnapshot? = try firstRepository.install(from: source)
        let root = first!.root
        let generation = try XCTUnwrap(UUID(uuidString: root.lastPathComponent))
        var second: ContentSnapshot? = try secondRepository.load()
        XCTAssertEqual(second?.root.standardizedFileURL, root.standardizedFileURL)

        let testingVersions = testingStorage.appendingPathComponent("versions")
        try FileManager.default.createDirectory(at: testingVersions, withIntermediateDirectories: true)
        try FileManager.default.copyItem(at: root, to: testingVersions.appendingPathComponent(generation.uuidString))
        try JSONSerialization.data(withJSONObject: ["directory": generation.uuidString])
            .write(to: testingStorage.appendingPathComponent("current.json"))
        let testingRepository = ContentRepository(bundledRoot: try readerTestPackage("lease-scope-test-bundle"),
            storageRoot: testingStorage, allowsTestFixtures: true)
        var testing: ContentSnapshot? = try testingRepository.load()
        XCTAssertEqual(testing?.root.lastPathComponent, generation.uuidString)
        let normalBefore = try retentionInventory(storage)
        let testingBefore = try retentionInventory(testingStorage)
        withExtendedLifetime((first, second, testing)) {
            XCTAssertEqual(firstRepository.advisorySnapshotAcquisitions, [generation: 2])
            XCTAssertEqual(secondRepository.advisorySnapshotAcquisitions, [generation: 2])
            XCTAssertEqual(testingRepository.advisorySnapshotAcquisitions, [generation: 1])
        }
        first = nil
        second = nil
        withExtendedLifetime(testing) {
            XCTAssertTrue(firstRepository.advisorySnapshotAcquisitions.isEmpty)
            XCTAssertEqual(testingRepository.advisorySnapshotAcquisitions, [generation: 1])
        }
        testing = nil
        XCTAssertTrue(testingRepository.advisorySnapshotAcquisitions.isEmpty)
        XCTAssertEqual(try retentionInventory(storage), normalBefore)
        XCTAssertEqual(try retentionInventory(testingStorage), testingBefore)
    }

    func testDetachedSnapshotReadRetainsGenerationAcrossReplacementAndParentCancellation() async throws {
        let bundled = try fixture("lease-detached-bundle")
        let oldSource = try retentionPackage("lease-detached-old", revision: "old")
        let newSource = try retentionPackage("lease-detached-new", revision: "new")
        let storage = directory.appendingPathComponent("lease-detached-storage")
        let repository = ContentRepository(bundledRoot: bundled, storageRoot: storage)
        var old: ContentSnapshot? = try repository.install(from: oldSource)
        let oldID = try XCTUnwrap(UUID(uuidString: old!.root.lastPathComponent))
        let entered = expectation(description: "Detached read holds its captured snapshot")
        let witness = SnapshotLeaseReadWitness(entered)
        let request = SnapshotLeaseReadRequest(old!)
        old = nil
        let (permit, release) = AsyncStream<Void>.makeStream()
        let (readers, publishReader) = AsyncStream<Task<(NativeDocument, Data), Error>>.makeStream()
        let (parentWait, finishParentWait) = AsyncStream<Void>.makeStream()
        defer { release.finish(); publishReader.finish(); finishParentWait.finish() }
        let parent = Task {
            let reader = try request.start(permit: permit, witness: witness)
            publishReader.yield(reader)
            publishReader.finish()
            for await _ in parentWait { break }
            try Task.checkCancellation()
            return try await reader.value
        }
        var iterator = readers.makeAsyncIterator()
        let offeredReader = await iterator.next()
        let reader = try XCTUnwrap(offeredReader)
        do {
            await fulfillment(of: [entered], timeout: 10)
            XCTAssertEqual(repository.advisorySnapshotAcquisitions, [oldID: 1])
            let replacement = try repository.install(from: newSource)
            let newID = try XCTUnwrap(UUID(uuidString: replacement.root.lastPathComponent))
            parent.cancel()
            do {
                _ = try await parent.value
                XCTFail("The spawning parent must finish cancellation before the detached reader is released")
            } catch is CancellationError { }
            XCTAssertTrue(parent.isCancelled)
            XCTAssertFalse(reader.isCancelled)
            withExtendedLifetime(replacement) {
                XCTAssertEqual(repository.advisorySnapshotAcquisitions, [oldID: 1, newID: 1])
            }
            release.yield(())
            release.finish()
            let result = try await reader.value
            XCTAssertEqual(result.0.blocks.first(where: { $0.id == "paragraph" })?.inlines?.first?.text, "本文 old")
            XCTAssertEqual(result.1, pixel)
            XCTAssertEqual(try replacement.document(for: article()).blocks.first(where: { $0.id == "paragraph" })?.inlines?.first?.text,
                           "本文 new")
            // Final release is covered by the explicit-copy tests; async task
            // context reclamation need not happen at the same instant as value delivery.
        } catch {
            parent.cancel()
            finishParentWait.finish()
            release.finish()
            _ = try? await reader.value
            _ = try? await parent.value
            throw error
        }
    }

    @MainActor
    func testFailedImportsDoNotLeakSnapshotAcquisitionsOrChangeStoredAndReadingBytes() throws {
        let bundled = try fixture("lease-failed-bundle")
        let oldSource = try retentionPackage("lease-failed-old", revision: "old")
        let currentSource = try retentionPackage("lease-failed-current", revision: "current")
        let incoming = try retentionPackage("lease-failed-incoming", revision: "incoming")
        let invalid = try retentionPackage("lease-failed-invalid", revision: "invalid")
        try Data("changed".utf8).write(to: invalid.appendingPathComponent("articles/example.json"))
        let storage = directory.appendingPathComponent("lease-failed-storage")
        let repository = ContentRepository(bundledRoot: bundled, storageRoot: storage)
        let old = try repository.install(from: oldSource)
        let current = try repository.install(from: currentSource)
        let oldID = try XCTUnwrap(UUID(uuidString: old.root.lastPathComponent))
        let currentID = try XCTUnwrap(UUID(uuidString: current.root.lastPathComponent))
        let orphan = storage.appendingPathComponent("versions/.staging-" + UUID().uuidString)
        try FileManager.default.createDirectory(at: orphan, withIntermediateDirectories: true)
        try Data("previous incomplete import".utf8).write(to: orphan.appendingPathComponent("partial.txt"))
        let defaults = try retentionDefaults()
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark("example")
        reading.record(articleID: "example", heading: "intro", fraction: 0.67, blockID: "paragraph")
        let savedReading = try XCTUnwrap(defaults.data(forKey: "library.reading.v1"))
        let before = try retentionInventory(storage)
        let expected = [oldID: 1, currentID: 1]
        XCTAssertThrowsError(try repository.install(from: invalid))
        var failedID: UUID?
        let failing = ContentRepository(bundledRoot: bundled, storageRoot: storage, writePointer: { data, _ in
            let pointer = try JSONDecoder().decode([String: String].self, from: data)
            failedID = UUID(uuidString: try XCTUnwrap(pointer["directory"]))
            XCTAssertEqual(ContentSnapshotLease.advisoryAcquisitions(in: storage), expected,
                           "An uncommitted destination must not escape as a snapshot acquisition")
            throw CocoaError(.fileWriteOutOfSpace)
        })
        XCTAssertThrowsError(try failing.install(from: incoming))
        let rejected = try XCTUnwrap(failedID)
        withExtendedLifetime((old, current)) {
            XCTAssertEqual(repository.advisorySnapshotAcquisitions, expected)
            XCTAssertNil(repository.advisorySnapshotAcquisitions[rejected])
        }
        XCTAssertEqual(try retentionInventory(storage), before)
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), savedReading)
        XCTAssertEqual(try Data(contentsOf: old.root.appendingPathComponent("assets/late-old.png")), pixel)
        XCTAssertEqual(try Data(contentsOf: current.root.appendingPathComponent("assets/late-current.png")), pixel)
    }

    func testBundledUnmanagedAndRejectedFixtureSnapshotsDoNotAcquireOwnedGenerations() throws {
        let bundled = try fixture("lease-unmanaged-bundle")
        let storage = directory.appendingPathComponent("lease-unmanaged-storage")
        let repository = ContentRepository(bundledRoot: bundled, storageRoot: storage)
        let fallback = try repository.load()
        let unmanaged = try ContentValidator.validate(root: bundled)
        let explicit = ContentSnapshot(root: unmanaged.root, manifest: unmanaged.manifest)
        withExtendedLifetime((fallback, unmanaged, explicit)) {
            XCTAssertTrue(repository.advisorySnapshotAcquisitions.isEmpty)
        }
        XCTAssertEqual(fallback.root, bundled)
        XCTAssertThrowsError(try repository.install(from: readerTestPackage("lease-unmanaged-rejected")))
        XCTAssertTrue(repository.advisorySnapshotAcquisitions.isEmpty)
        let unknown = try XCTUnwrap(URL(string: "https://example.invalid/storage"))
        XCTAssertNil(ContentSnapshotLease.acquire(storageRoot: unknown, generation: UUID()))
        XCTAssertTrue(ContentSnapshotLease.advisoryAcquisitions(in: unknown).isEmpty)
    }

    func testSnapshotLeaseOutlivesRepositoryAndLedgerDropsReleasedGenerationKeys() throws {
        let bundled = try fixture("lease-owner-bundle")
        let source = try fixture("lease-owner-source")
        let storage = directory.appendingPathComponent("lease-owner-storage")
        var repository: ContentRepository? = ContentRepository(bundledRoot: bundled, storageRoot: storage)
        var first: ContentSnapshot? = try repository!.install(from: source)
        let generation = try XCTUnwrap(UUID(uuidString: first!.root.lastPathComponent))
        let before = try retentionInventory(storage)
        repository = nil
        let reopened = ContentRepository(bundledRoot: bundled, storageRoot: storage)
        withExtendedLifetime(first) {
            XCTAssertEqual(reopened.advisorySnapshotAcquisitions, [generation: 1])
        }
        var second: ContentSnapshot? = try reopened.load()
        XCTAssertEqual(second?.manifest.revision, "v1")
        withExtendedLifetime((first, second)) {
            XCTAssertEqual(reopened.advisorySnapshotAcquisitions, [generation: 2])
        }
        first = nil
        withExtendedLifetime(second) {
            XCTAssertEqual(reopened.advisorySnapshotAcquisitions, [generation: 1])
        }
        second = nil
        XCTAssertTrue(reopened.advisorySnapshotAcquisitions.isEmpty, "No inactive generation URL keys remain in this scope")
        XCTAssertEqual(try retentionInventory(storage), before)
    }
    func testLastSnapshotAcquisitionCanReleaseOnBackgroundQueue() async throws {
        let bundled = try fixture("lease-thread-bundle")
        let source = try fixture("lease-thread-source")
        let storage = directory.appendingPathComponent("lease-thread-storage")
        let repository = ContentRepository(bundledRoot: bundled, storageRoot: storage)
        var snapshot: ContentSnapshot? = try repository.install(from: source)
        let generation = try XCTUnwrap(UUID(uuidString: snapshot!.root.lastPathComponent))
        let holder = SnapshotLeaseReadRequest(snapshot!)
        snapshot = nil
        XCTAssertEqual(repository.advisorySnapshotAcquisitions, [generation: 1])
        let before = try retentionInventory(storage)
        let released = expectation(description: "Last snapshot released outside the test executor")
        let witness = SnapshotLeaseReadWitness(released)
        DispatchQueue.global(qos: .userInitiated).async {
            holder.discard()
            witness.markEntered()
        }
        await fulfillment(of: [released], timeout: 10)
        XCTAssertTrue(repository.advisorySnapshotAcquisitions.isEmpty)
        XCTAssertEqual(try retentionInventory(storage), before)
    }

}

/// XCTest expectations permit cross-thread fulfillment. No mutable test state
/// or XCTestCase instance is sent to the detached reader.
private final class SnapshotLeaseReadWitness: @unchecked Sendable {
    private let entered: XCTestExpectation
    init(_ entered: XCTestExpectation) { self.entered = entered }
    func markEntered() { entered.fulfill() }
}

/// The spawning parent transfers its only snapshot into the detached reader.
/// The request keeps no snapshot after transfer, including after parent exit.
private final class SnapshotLeaseReadRequest: @unchecked Sendable {
    private let lock = NSLock()
    private var snapshot: ContentSnapshot?
    init(_ snapshot: ContentSnapshot) { self.snapshot = snapshot }

    private func take() throws -> ContentSnapshot {
        lock.lock()
        defer { lock.unlock() }
        guard let value = snapshot else { throw ContentError.invalid("テストのSnapshotは移送済みです。") }
        snapshot = nil
        return value
    }

    func discard() {
        let value = try? take()
        withExtendedLifetime(value) { }
    }

    func start(permit: AsyncStream<Void>, witness: SnapshotLeaseReadWitness) throws -> Task<(NativeDocument, Data), Error> {
        let snapshot = try take()
        return Task.detached { [snapshot] in
            witness.markEntered()
            for await _ in permit { break }
            return try withExtendedLifetime(snapshot) {
                (try snapshot.document(for: snapshot.manifest.articles[0]),
                 try Data(contentsOf: snapshot.root.appendingPathComponent("assets/late-old.png")))
            }
        }
    }
}

extension LibraryCoreTests {
    private func unavailableReadingPackage(_ name: String, id: String = "example", title: String = "Current",
                                           revision: String = "availability-v1") throws -> URL {
        let original = document()
        let changed = NativeDocument(schema_version: original.schema_version, article_id: id,
            source_sha256: original.source_sha256, blocks: original.blocks)
        let root = try fixture(name, revision: revision, document: changed)
        let url = root.appendingPathComponent("manifest.json")
        var manifest = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: url)) as? [String: Any])
        var articles = try XCTUnwrap(manifest["articles"] as? [[String: Any]])
        articles[0]["id"] = id
        articles[0]["title"] = title
        manifest["articles"] = articles
        try JSONSerialization.data(withJSONObject: manifest, options: [.sortedKeys]).write(to: url)
        _ = try ContentValidator.validate(root: root)
        return root
    }

    func testUnavailableReadingCountUnionsArticleIDsWithoutWritingRawOrBackups() throws {
        let d = try restoreDefaults()
        let raw = try JSONSerialization.data(withJSONObject: [
            "bookmarks": ["known", "gone", "gone"],
            "positions": ["known": ["fraction": 0.2], "gone": ["fraction": 0.4], "position-only": ["fraction": 0.8]],
            "lastArticleID": "last-only"], options: [.sortedKeys])
        let recovery = Data("existing recovery backup".utf8), retained = Data("existing retained slot".utf8)
        d.inject(raw, forKey: restoreKey)
        d.inject(recovery, forKey: restoreKey + ".recovery.v1")
        d.inject(retained, forKey: restoreSlot)
        let reading = ReadingStore(defaults: d)
        XCTAssertNil(reading.recoveryIssue)
        d.resetLedger()
        XCTAssertEqual(reading.unavailableArticleRecordCount(knownArticleIDs: ["known"]), 3)
        XCTAssertEqual(reading.unavailableArticleRecordCount(knownArticleIDs: ["known", "gone"]), 2)
        XCTAssertEqual(reading.unavailableArticleRecordCount(knownArticleIDs: ["known", "gone", "position-only", "last-only"]), 0)
        XCTAssertEqual(d.data(forKey: restoreKey), raw)
        XCTAssertEqual(d.data(forKey: restoreKey + ".recovery.v1"), recovery)
        XCTAssertEqual(d.data(forKey: restoreSlot), retained)
        XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
        let empty = try restoreDefaults()
        XCTAssertEqual(ReadingStore(defaults: empty).unavailableArticleRecordCount(knownArticleIDs: []), 0)
        XCTAssertNil(empty.object(forKey: restoreKey))
        XCTAssertEqual(empty.setKeys, []); XCTAssertEqual(empty.removeKeys, [])
    }

    func testUnavailableReadingCountSuppressesDamagedAndSuspendedStateWithoutMutation() throws {
        let partial = Data("{\"bookmarks\":[\"readable\",17],\"positions\":{}}".utf8)
        let values: [Any] = [partial, Data("{broken".utf8), Data(repeating: 0x20, count: ReadingStore.maximumRecoveryBytes + 1), "unsupported"]
        for value in values {
            let d = try restoreDefaults(), backup = Data("unchanged backup".utf8)
            d.inject(value, forKey: restoreKey); d.inject(backup, forKey: restoreKey + ".recovery.v1")
            let reading = ReadingStore(defaults: d)
            XCTAssertNotNil(reading.recoveryIssue)
            d.resetLedger()
            XCTAssertNil(reading.unavailableArticleRecordCount(knownArticleIDs: []))
            if let data = value as? Data { XCTAssertEqual(d.data(forKey: restoreKey), data) }
            else { XCTAssertEqual(d.string(forKey: restoreKey), value as? String) }
            XCTAssertEqual(d.data(forKey: restoreKey + ".recovery.v1"), backup)
            XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
        }
        let d = try restoreDefaults(), before = try restoreRaw("old"), foreign = try restoreRaw("foreign")
        d.inject(before, forKey: restoreKey)
        let reading = ReadingStore(defaults: d)
        d.inject(foreign, forKey: restoreKey)
        XCTAssertThrowsError(try reading.exportBackup(createdAt: restoreDate, appVersion: "0.2.20"))
        XCTAssertTrue(reading.readingSaveSuspended)
        d.resetLedger()
        XCTAssertNil(reading.unavailableArticleRecordCount(knownArticleIDs: []))
        XCTAssertEqual(d.data(forKey: restoreKey), foreign)
        XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
    }

    @MainActor
    func testUnavailableReadingStoreUsesWholeSnapshotRatherThanVisibleFilters() async throws {
        let bundled = try unavailableReadingPackage("availability-filter-bundle")
        let d = try restoreDefaults(), raw = try JSONSerialization.data(withJSONObject: [
            "bookmarks": ["example", "absent"], "positions": ["example": ["fraction": 0.3]],
            "lastArticleID": "absent"], options: [.sortedKeys])
        d.inject(raw, forKey: restoreKey)
        let reading = ReadingStore(defaults: d)
        let storage = directory.appendingPathComponent("availability-filter-storage")
        let store = LibraryStore(reading: reading, bundledRoot: bundled, storageRoot: storage)
        XCTAssertNil(store.unavailableReadingArticleCount(isRestorePresented: false))
        await store.load()
        XCTAssertNotNil(store.snapshot)
        let filtered = LibraryArticleFilter(query: "term-that-no-current-article-has", bookmarksOnly: true)
        XCTAssertTrue(filtered.articles(in: store.listedArticles, bookmarks: store.bookmarks).isEmpty)
        d.resetLedger()
        XCTAssertEqual(store.unavailableReadingArticleCount(isRestorePresented: false), 1)
        XCTAssertEqual(store.unavailableReadingArticleCount(isRestorePresented: false), 1)
        XCTAssertEqual(d.data(forKey: restoreKey), raw)
        XCTAssertFalse(FileManager.default.fileExists(atPath: storage.appendingPathComponent("current.json").path))
        XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
    }

    @MainActor
    func testUnavailableReadingCountFollowsPackageIDsAndReturnsWithoutRenamingRecords() async throws {
        let original = try unavailableReadingPackage("availability-old", id: "old/article", title: "Old title")
        let titleOnly = try unavailableReadingPackage("availability-title", id: "old/article", title: "New title", revision: "availability-v2")
        let renamed = try unavailableReadingPackage("availability-renamed", id: "new/article", revision: "availability-v3")
        let d = try restoreDefaults(), raw = try restoreRaw("old/article", fraction: 0.64)
        let backup = Data("keep recovery".utf8)
        d.inject(raw, forKey: restoreKey); d.inject(backup, forKey: restoreKey + ".recovery.v1")
        let reading = ReadingStore(defaults: d)
        let storage = directory.appendingPathComponent("availability-switch-storage")
        let store = LibraryStore(reading: reading, bundledRoot: original, storageRoot: storage)
        await store.load()
        XCTAssertEqual(store.unavailableReadingArticleCount(isRestorePresented: false), 0)
        for (source, expected) in [(titleOnly, 0), (renamed, 1), (original, 0)] {
            await store.install(from: source)
            XCTAssertNil(store.loadError)
            let pointer = try Data(contentsOf: storage.appendingPathComponent("current.json"))
            d.resetLedger()
            XCTAssertEqual(store.unavailableReadingArticleCount(isRestorePresented: false), expected)
            XCTAssertEqual(try Data(contentsOf: storage.appendingPathComponent("current.json")), pointer)
            XCTAssertEqual(d.data(forKey: restoreKey), raw)
            XCTAssertEqual(d.data(forKey: restoreKey + ".recovery.v1"), backup)
            XCTAssertEqual(reading.bookmarks, ["old/article"])
            XCTAssertEqual(reading.lastArticleID, "old/article")
            XCTAssertEqual(reading.position(for: article(id: "old/article")).fraction, 0.64)
            XCTAssertEqual(reading.position(for: article(id: "new/article")).fraction, 0)
            XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
        }
    }

    @MainActor
    func testUnavailableReadingStoreSuppressesLoadingFixtureAndRestorePresentation() async throws {
        let bundled = try unavailableReadingPackage("availability-loading")
        let snapshot = try ContentValidator.validate(root: bundled)
        let d = try restoreDefaults(), raw = try restoreRaw("absent")
        d.inject(raw, forKey: restoreKey)
        let delayed = DelayedLearningLoader(first: .success(snapshot), next: snapshot)
        let store = LibraryStore(reading: ReadingStore(defaults: d), bundledRoot: bundled,
            storageRoot: directory.appendingPathComponent("availability-loading-storage"), snapshotLoader: delayed.load)
        let loading = Task { await store.load() }
        defer { delayed.release.signal() }
        await fulfillment(of: [delayed.started], timeout: 5)
        XCTAssertTrue(store.isLoading)
        XCTAssertNil(store.unavailableReadingArticleCount(isRestorePresented: false))
        delayed.release.signal()
        await loading.value
        XCTAssertFalse(store.isLoading)
        XCTAssertEqual(store.unavailableReadingArticleCount(isRestorePresented: false), 1)
        XCTAssertNil(store.unavailableReadingArticleCount(isRestorePresented: true))
        let testRoot = try readerTestPackage("availability-fixture")
        let testSnapshot = try ContentValidator.validate(root: testRoot)
        let fixtureStore = LibraryStore(reading: ReadingStore(defaults: d), bundledRoot: testRoot,
            isTestLibrary: true, storageRoot: directory.appendingPathComponent("availability-fixture-storage"),
            snapshotLoader: { testSnapshot })
        await fixtureStore.load()
        XCTAssertNotNil(fixtureStore.snapshot)
        XCTAssertNil(fixtureStore.unavailableReadingArticleCount(isRestorePresented: false))
        let normalWithFixture = LibraryStore(reading: ReadingStore(defaults: d), bundledRoot: testRoot,
            storageRoot: directory.appendingPathComponent("availability-mixed-storage"), snapshotLoader: { testSnapshot })
        await normalWithFixture.load()
        XCTAssertNotNil(normalWithFixture.snapshot)
        XCTAssertNil(normalWithFixture.unavailableReadingArticleCount(isRestorePresented: false))
        XCTAssertEqual(d.data(forKey: restoreKey), raw)
        XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
    }

    @MainActor
    func testUnavailableReadingRestorePreviewCancelAndConfirmedCommitKeepTheirOwnState() async throws {
        let bundled = try unavailableReadingPackage("availability-restore")
        let d = try restoreDefaults(), before = try restoreRaw("absent"), target = try restoreRaw("example", fraction: 0.72)
        let recovery = Data("keep separate recovery backup".utf8)
        d.inject(before, forKey: restoreKey); d.inject(recovery, forKey: restoreKey + ".recovery.v1")
        let reading = ReadingStore(defaults: d)
        let store = LibraryStore(reading: reading, bundledRoot: bundled,
            storageRoot: directory.appendingPathComponent("availability-restore-storage"))
        await store.load()
        XCTAssertEqual(store.unavailableReadingArticleCount(isRestorePresented: false), 1)
        d.resetLedger()
        do {
            let preview = try store.previewReadingRestore(from: restoreEnvelope(target))
            XCTAssertEqual(preview.counts.bookmarks, 1)
            XCTAssertNil(store.unavailableReadingArticleCount(isRestorePresented: true))
            XCTAssertEqual(d.data(forKey: restoreKey), before)
            XCTAssertNil(d.object(forKey: restoreSlot))
        }
        // Cancel is dropping the preview and dismissing its existing presentation.
        XCTAssertEqual(store.unavailableReadingArticleCount(isRestorePresented: false), 1)
        XCTAssertEqual(d.setKeys, []); XCTAssertEqual(d.removeKeys, [])
        let preview = try store.previewReadingRestore(from: restoreEnvelope(target))
        var busyQueries = 0, observing = false
        d.afterSet = { _ in
            guard !observing else { return }
            observing = true
            defer { observing = false }
            let writes = d.setKeys, removals = d.removeKeys
            let primary = d.data(forKey: self.restoreKey), slot = d.data(forKey: self.restoreSlot)
            XCTAssertNil(reading.unavailableArticleRecordCount(knownArticleIDs: ["example"]))
            XCTAssertNil(store.unavailableReadingArticleCount(isRestorePresented: false))
            XCTAssertEqual(d.data(forKey: self.restoreKey), primary)
            XCTAssertEqual(d.data(forKey: self.restoreSlot), slot)
            XCTAssertEqual(d.setKeys, writes); XCTAssertEqual(d.removeKeys, removals)
            busyQueries += 1
        }
        defer { d.afterSet = nil }
        try store.applyReadingRestore(preview, backupCreatedAt: restoreDate)
        XCTAssertGreaterThanOrEqual(busyQueries, 2)
        XCTAssertEqual(store.unavailableReadingArticleCount(isRestorePresented: false), 0)
        XCTAssertNil(store.unavailableReadingArticleCount(isRestorePresented: true))
        XCTAssertEqual(d.data(forKey: restoreKey), target)
        XCTAssertEqual(d.data(forKey: restoreKey + ".recovery.v1"), recovery)
        let retained = try XCTUnwrap(store.retainedReadingRestoreBackup())
        let backup = try store.exportRetainedReadingRestoreBackup(retained, appVersion: "0.2.20")
        XCTAssertEqual(try ReadingBackupCodec.decode(backup).rawData, before)
        let reloaded = LibraryStore(reading: ReadingStore(defaults: d), bundledRoot: bundled,
            storageRoot: directory.appendingPathComponent("availability-restore-reloaded"))
        await reloaded.load()
        XCTAssertEqual(reloaded.unavailableReadingArticleCount(isRestorePresented: false), 0)
    }
}
