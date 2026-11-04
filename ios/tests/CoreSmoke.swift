// Foundation/CryptoKit assertion scenarios for machines with Command Line Tools only.
// These supplement XCTest; they do not compile or launch the iOS application.
import CryptoKit
import Foundation

private struct SmokeFailure: LocalizedError {
    let message: String
    var errorDescription: String? { message }
}

@main
enum CoreSmoke {
    static func main() throws {
        let scratch = FileManager.default.temporaryDirectory.appendingPathComponent("ai-library-smoke-" + UUID().uuidString)
        try FileManager.default.createDirectory(at: scratch, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: scratch) }
        try search()
        try nativeSearch()
        try pathsAndHashes(scratch)
        try audioTimes(scratch)
        try linksAndInventory(scratch)
        try readAccessDirectory(scratch)
        try nativeDocuments(scratch)
        try failedUpdates(scratch)
        try mutationCoordination(scratch)
        try storageBookkeepingScopes(scratch)
        try storedReaderAdmission(scratch)
        try admissionBookkeeping(scratch)
        try legacyPackageFallback(scratch)
        try futurePackageSchemas(scratch)
        try testFixtureIsolation(scratch)
        try readingRecords()
        try revisedReadingRecords()
        if let argument = CommandLine.arguments.dropFirst().first {
            let snapshot = try ContentValidator.validate(root: URL(fileURLWithPath: argument, isDirectory: true))
            let fixtures = snapshot.manifest.articles.filter(\.isTestFixture)
            try expect(snapshot.manifest.articles.count == (fixtures.isEmpty ? 3 : 4), "Generated content has an unexpected article count")
            if !fixtures.isEmpty {
                try expect(fixtures.count == 1 && fixtures[0].is_test_fixture == true,
                           "Test content must contain exactly one marked fixture")
                try expect(fixtures[0].id == "test-fixtures/native-reader" && fixtures[0].source_path == "ios/fixtures/native-reader.md",
                           "Test content fixture identity changed")
            }
            try expect(snapshot.manifest.audio.count == 1, "The prototype must contain one audio episode")
            if let article = snapshot.article(id: "01-concepts/agent-loop") {
                let document = try snapshot.document(for: article)
                let hit = document.searchHit(query: "MAX_STEPS")
                try expect(hit != nil && document.block(id: hit!.blockID)?.type == "code",
                           "Generated code must resolve to its native block")
            }
            if let article = fixtures.first {
                let document = try snapshot.document(for: article)
                let hit = document.searchHit(query: "DUPLICATE-SECOND")
                try expect(hit != nil && document.block(id: hit!.blockID)?.type == "paragraph"
                    && hit?.headingID == "同じ見出し-1", "Generated duplicate-heading marker target changed")
            }
            print("PASS generated content: \(snapshot.manifest.articles.count) articles, \(snapshot.manifest.audio.count) audio, \(snapshot.manifest.files.count) verified files")
        }
        print("Core smoke passed. iOS SDK, XCTest and device checks are separate.")
    }

    private static func expect(_ condition: @autoclosure () throws -> Bool, _ message: String) throws {
        guard try condition() else { throw SmokeFailure(message: message) }
    }

    private static func expectThrows(_ description: String, _ operation: () throws -> Void) throws {
        do { try operation() } catch { return }
        throw SmokeFailure(message: "Expected rejection: " + description)
    }

    private static func article(isTestFixture: Bool? = nil) -> LibraryArticle {
        LibraryArticle(id: "example", title: "ＡＩ エージェント", summary: "日本語の学習", category: "基礎", level: "beginner",
                       last_updated: "2026-10-22", source_path: "docs/example.md", source_sha256: String(repeating: "a", count: 64),
                       document_path: "articles/example.json", search_text: "Tools API えーじぇんと",
                       headings: [ArticleHeading(id: "intro", title: "導入", level: 2)], audio_id: nil, is_test_fixture: isTestFixture)
    }

    private static var pixel: Data { Data(base64Encoded: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJe8AAAAASUVORK5CYII=")! }
    private static var image: NativeAsset { NativeAsset(light: "assets/pixel.png", dark: "assets/pixel.png", width: 1, height: 1, scale: 1, baseline: 0) }

    private static func document() -> NativeDocument {
        let text = NativeInline(type: "text", text: "本文")
        let paragraph = NativeBlock(id: "paragraph", type: "paragraph", inlines: [text,
            NativeInline(type: "strong", children: [NativeInline(type: "emphasis", children: [text])]),
            NativeInline(type: "code", text: "code"),
            NativeInline(type: "link", children: [text], target: NativeLink(kind: "article", article_id: "example", heading_id: "intro")),
            NativeInline(type: "link", children: [text], target: NativeLink(kind: "external", url: "https://example.com/")),
            NativeInline(type: "math", asset: image, source: "x", accessibility_text: "エックス"),
            NativeInline(type: "soft_break"), NativeInline(type: "hard_break")])
        return NativeDocument(schema_version: 1, article_id: "example", source_sha256: String(repeating: "a", count: 64), blocks: [
            NativeBlock(id: "heading", type: "heading", heading_id: "intro", level: 2, inlines: [text]), paragraph,
            NativeBlock(id: "list", type: "list", ordered: true, start: 2, items: [NativeListItem(id: "item", blocks: [NativeBlock(id: "nested", type: "paragraph", inlines: [text])])]),
            NativeBlock(id: "quote", type: "quote", blocks: [NativeBlock(id: "quoted", type: "paragraph", inlines: [text])]),
            NativeBlock(id: "code", type: "code", language: "swift", text: "let x = 1"),
            NativeBlock(id: "table", type: "table", table: NativeTable(header: [[text]], rows: [[[text]]], alignments: ["left"])),
            NativeBlock(id: "diagram", type: "diagram", asset: image, source: "graph TD; A-->B", accessibility_text: "AからBへ"),
            NativeBlock(id: "math", type: "math", asset: image, source: "x", accessibility_text: "エックス"),
            NativeBlock(id: "break", type: "thematic_break")])
    }

    private static func fixture(_ scratch: URL, _ name: String, revision: String = "v1", document: NativeDocument? = nil,
                                isTestFixture: Bool? = nil) throws -> URL {
        let root = scratch.appendingPathComponent(name, isDirectory: true)
        try FileManager.default.createDirectory(at: root.appendingPathComponent("articles"), withIntermediateDirectories: true)
        try FileManager.default.createDirectory(at: root.appendingPathComponent("assets"), withIntermediateDirectories: true)
        let data = try JSONEncoder().encode(document ?? self.document())
        try data.write(to: root.appendingPathComponent("articles/example.json"))
        try pixel.write(to: root.appendingPathComponent("assets/pixel.png"))
        let files = ["articles/example.json": SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined(),
                     "assets/pixel.png": SHA256.hash(data: pixel).map { String(format: "%02x", $0) }.joined()]
        let manifest = ContentManifest(schema_version: 2, revision: revision, articles: [article(isTestFixture: isTestFixture)], audio: [], files: files)
        try JSONEncoder().encode(manifest).write(to: root.appendingPathComponent("manifest.json"))
        return root
    }

    private static func search() throws {
        try expect(LibrarySearch.matches(article(), query: "ai API"), "Case/width search failed")
        try expect(LibrarySearch.matches(article(), query: "ｴｰｼﾞｪﾝﾄ"), "Kana search failed")
        try expect(LibrarySearch.matches(article(), query: "エージェント tools"), "Multiple-term search failed")
        try expect(!LibrarySearch.matches(article(), query: "tools unknown"), "Every search term must match")
        print("PASS normalized Japanese/English search")
    }

    private static func nativeSearch() throws {
        try expect(LibrarySearch.normalizedTerms(" ＡＰＩ\tAPI CAFÉ cafe\u{301} ") == ["api", "cafe"],
                   "Normalized search terms must be distinct and keep their first order")
        try expect(LibrarySearch.normalizedTerms(" \t\n　").isEmpty, "Empty normalized query produced a term")
        try expect(ReaderRoute(articleID: "example").searchQuery == nil, "Normal routes must not carry a search request")
        try expect(ReaderRoute(articleID: "example") != ReaderRoute(articleID: "example", searchQuery: "tools"),
                   "A search launch must be separate from a normal reading route")
        let text: (String) -> NativeInline = { NativeInline(type: "text", text: $0) }
        let value = NativeDocument(schema_version: 1, article_id: "example", source_sha256: article().source_sha256, blocks: [
            NativeBlock(id: "heading", type: "heading", heading_id: "intro", level: 2, inlines: [text("第一章")]),
            NativeBlock(id: "partial", type: "paragraph", inlines: [text("alpha alpha alpha")]),
            NativeBlock(id: "styled", type: "paragraph", inlines: [text("ＡＩ soft"),
                NativeInline(type: "strong", children: [text("max")]),
                NativeInline(type: "emphasis", children: [text(" えーじぇんと ")]), NativeInline(type: "code", text: "cafe\u{301}"),
                NativeInline(type: "link", children: [text(" LinkLabel")],
                    target: NativeLink(kind: "external", url: "https://example.com/only-url-secret"))]),
            NativeBlock(id: "breaks", type: "paragraph", inlines: [text("before"), NativeInline(type: "soft_break"),
                text("after"), NativeInline(type: "hard_break"), text("next")]),
            NativeBlock(id: "list-container", type: "list", ordered: true, start: 8, items: [
                NativeListItem(id: "parent-item", blocks: [
                    NativeBlock(id: "parent-text", type: "paragraph", inlines: [text("Parentword")]),
                    NativeBlock(id: "nested-quote", type: "quote", blocks: [
                        NativeBlock(id: "nested-hit", type: "paragraph", inlines: [text("Needle Agent")])])])]),
            NativeBlock(id: "details", type: "heading", heading_id: "details", level: 2, inlines: [text("詳細節")]),
            NativeBlock(id: "quote-container", type: "quote", blocks: [
                NativeBlock(id: "quote-hit", type: "paragraph", inlines: [text("Quote distinct")])]),
            NativeBlock(id: "code-hit", type: "code", language: "python", text: "  MAX_STEPS = 20\n\tprint('done')"),
            NativeBlock(id: "table-hit", type: "table", table: NativeTable(header: [[text("Left")], [text("Right")]],
                rows: [[[text("CellValue")], [NativeInline(type: "math", asset: image, source: "x^{2}", accessibility_text: "分数の見本")]]],
                alignments: ["left", "right"])),
            NativeBlock(id: "diagram-hit", type: "diagram", asset: image, source: "graph TD; A-->FLOW_TARGET", accessibility_text: "図の流れ"),
            NativeBlock(id: "math-hit", type: "math", asset: image, source: "\\frac{QK^{\\top}}{\\sqrt{d_k}}", accessibility_text: "クエリの二乗"),
            NativeBlock(id: "all-terms", type: "paragraph", inlines: [text("alpha beta")])])
        try expect(value.searchHit(query: "alpha alpha beta")?.blockID == "all-terms", "A full-term leaf must beat repeated partial matches")
        for query in ["softmax", "ＡＩ ｴｰｼﾞｪﾝﾄ", "cafe", "LinkLabel"] {
            try expect(value.searchHit(query: query)?.blockID == "styled", "Styled text was not searched: " + query)
        }
        try expect(value.searchHit(query: "Parentword Needle Agent") == NativeSearchHit(blockID: "nested-hit", containerBlockID: "list-container", headingID: "intro"),
                   "Nested hit must retain its leaf, parent container and heading")
        try expect(value.searchHit(query: "Quote distinct") == NativeSearchHit(blockID: "quote-hit", containerBlockID: "quote-container", headingID: "details"),
                   "Quoted hit lost its native position")
        for (query, block) in [("MAX_STEPS", "code-hit"), ("Left 分数", "table-hit"), ("x^{2}", "table-hit"),
                               ("FLOW_TARGET", "diagram-hit"), ("図の流れ", "diagram-hit"), ("d_k", "math-hit"),
                               ("クエリ", "math-hit"), ("before after next", "breaks"), ("詳細節", "details")] {
            try expect(value.searchHit(query: query)?.blockID == block, "Structured text target failed: " + query)
        }
        for query in ["", " \t\n　", "beforeafter", "LeftRight", "only-url-secret", "基礎", "absent"] {
            try expect(value.searchHit(query: query) == nil, "Unexpected body hit: " + query)
        }
        try expect(LibrarySearch.matches(article(), query: "基礎"), "Metadata-only article matching changed")
        let spread = NativeDocument(schema_version: 1, article_id: "example", source_sha256: article().source_sha256,
            blocks: [NativeBlock(id: "first", type: "paragraph", inlines: [text("alpha alpha alpha")]),
                     NativeBlock(id: "second", type: "paragraph", inlines: [text("beta")])])
        try expect(spread.searchHit(query: "alpha beta")?.blockID == "first", "Distributed-term ties must retain document order")
        let empty = NativeDocument(schema_version: 1, article_id: "example", source_sha256: article().source_sha256, blocks: [])
        try expect(empty.searchHit(query: "anything") == nil, "An empty document produced a target")
        print("PASS native search ranking, styles, structured text, nested targets and route defaults")
    }

    private static func pathsAndHashes(_ scratch: URL) throws {
        for path in ["../file", "/file", "a//b", "a/./b", "a\\b", "a/%2e", "a:b"] {
            try expect(!ContentValidator.isSafeRelativePath(path), "Unsafe path accepted: " + path)
        }
        try expect(ContentValidator.isSafeRelativePath("assets/図.svg"), "Japanese asset path rejected")
        let root = try fixture(scratch, "hash")
        _ = try ContentValidator.validate(root: root)
        try Data("tampered".utf8).write(to: root.appendingPathComponent("articles/example.json"))
        try expectThrows("SHA-256 mismatch") { _ = try ContentValidator.validate(root: root) }
        print("PASS path validation and SHA-256 mismatch rejection")
    }

    private static func audioTimes(_ scratch: URL) throws {
        try expect(AudioTime.maximumDurationSeconds == 86_400, "Audio duration contract changed")
        for value in [Double.nan, Double.infinity, -Double.infinity, -Double.greatestFiniteMagnitude, -1, 0] {
            try expect(AudioTime.displaySeconds(value) == 0, "Invalid display time must become zero")
        }
        try expect(AudioTime.displaySeconds(61.9) == 61, "Display seconds must discard only the fractional part")
        try expect(AudioTime.displaySeconds(86_399.9) == 86_399, "Last fractional second before the limit changed")
        for value in [86_400.0, 86_400.0.nextUp, 1e300, Double.greatestFiniteMagnitude] {
            try expect(AudioTime.displaySeconds(value) == 86_400, "Display time exceeded the safe 24-hour limit")
        }
        let root = try fixture(scratch, "audio-time")
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
            try expect(try ContentValidator.validate(root: root).manifest.audio[0].duration_seconds == duration,
                       "Valid audio duration was rejected")
        }
        try write(duration: 86_400, starts: [0, 86_400.0.nextDown])
        let storage = scratch.appendingPathComponent("audio-time-storage")
        let repository = ContentRepository(bundledRoot: root, storageRoot: storage)
        _ = try repository.install(from: root)
        for duration in [0.0, -1, 86_400.0.nextUp, 1e300, Double.greatestFiniteMagnitude] {
            try write(duration: duration)
            try expectThrows("out-of-range audio duration") { _ = try ContentValidator.validate(root: root) }
            try expectThrows("invalid audio update") { _ = try repository.install(from: root) }
            try expect(try repository.load().manifest.audio[0].duration_seconds == 86_400,
                       "Rejected audio metadata replaced the installed version")
        }
        for start in [-0.1, 86_400.0, 1e300] {
            try write(duration: 86_400, starts: [start])
            try expectThrows("out-of-range chapter start") { _ = try ContentValidator.validate(root: root) }
        }
        print("PASS audio display bounds, duration/chapter limits and rejected-update preservation")
    }

    private static func linksAndInventory(_ scratch: URL) throws {
        let root = try fixture(scratch, "links")
        let link = root.appendingPathComponent("outside")
        try FileManager.default.createSymbolicLink(at: link, withDestinationURL: scratch)
        try expectThrows("symbolic link") { _ = try ContentValidator.validate(root: root) }
        try FileManager.default.removeItem(at: link)
        try Data("extra".utf8).write(to: root.appendingPathComponent("extra.js"))
        try expectThrows("unlisted file") { _ = try ContentValidator.validate(root: root) }
        print("PASS symbolic-link and unlisted-file rejection")
    }

    private static func replaceFile(_ root: URL, path: String, data: Data) throws {
        let manifest = try JSONDecoder().decode(ContentManifest.self, from: Data(contentsOf: root.appendingPathComponent("manifest.json")))
        try data.write(to: root.appendingPathComponent(path))
        var files = manifest.files
        files[path] = SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
        try JSONEncoder().encode(ContentManifest(schema_version: manifest.schema_version, revision: manifest.revision,
            articles: manifest.articles, audio: manifest.audio, files: files)).write(to: root.appendingPathComponent("manifest.json"))
    }

    private static func nativeDocuments(_ scratch: URL) throws {
        let valid = try fixture(scratch, "native-valid")
        let snapshot = try ContentValidator.validate(root: valid)
        let loaded = try snapshot.document(for: article())
        try expect(loaded == document(), "Native document did not round-trip")
        try expect(loaded.block(id: "nested") != nil && loaded.topLevelBlockID(containing: "nested") == "list", "Nested block lookup failed")
        try expect(loaded.topLevelBlockID(forHeading: "intro") == "heading", "Heading lookup failed")
        let heading = document().blocks[0]
        func reject(_ label: String, _ block: NativeBlock) throws {
            let value = NativeDocument(schema_version: 1, article_id: "example", source_sha256: article().source_sha256, blocks: [heading, block])
            let root = try fixture(scratch, "native-bad-" + UUID().uuidString, document: value)
            try expectThrows(label) { _ = try ContentValidator.validate(root: root) }
        }
        try reject("unknown block", NativeBlock(id: "bad", type: "html"))
        try reject("missing paragraph field", NativeBlock(id: "bad", type: "paragraph"))
        try reject("duplicate block ID", NativeBlock(id: "heading", type: "paragraph", inlines: [NativeInline(type: "text", text: "x")]))
        try reject("unknown inline", NativeBlock(id: "bad", type: "paragraph", inlines: [NativeInline(type: "raw_html")]))
        for target in [NativeLink(kind: "article", article_id: "missing"), NativeLink(kind: "article", article_id: "example", heading_id: "missing"),
                       NativeLink(kind: "external", url: "http://example.com"), NativeLink(kind: "external", url: "https://user:password@example.com")] {
            try reject("unsafe link", NativeBlock(id: "bad", type: "paragraph", inlines: [NativeInline(type: "link", children: [NativeInline(type: "text", text: "x")], target: target)]))
        }
        try reject("missing asset membership", NativeBlock(id: "bad", type: "math", asset: NativeAsset(light: "missing.png", dark: "missing.png", width: 1, height: 1, scale: 1), source: "x", accessibility_text: "x"))
        try reject("pixel/point mismatch", NativeBlock(id: "bad", type: "math", asset: NativeAsset(light: image.light, dark: image.dark, width: 100, height: 1, scale: 1), source: "x", accessibility_text: "x"))
        var deep = NativeBlock(id: "leaf", type: "paragraph", inlines: [NativeInline(type: "text", text: "x")])
        for index in 0...NativeDocumentValidator.maximumDepth { deep = NativeBlock(id: "quote-\(index)", type: "quote", blocks: [deep]) }
        try reject("depth limit", deep)
        try reject("element limit", NativeBlock(id: "bad", type: "paragraph", inlines: Array(repeating: NativeInline(type: "text", text: "x"), count: NativeDocumentValidator.maximumElements + 1)))
        let mismatch = NativeDocument(schema_version: 1, article_id: "example", source_sha256: String(repeating: "b", count: 64), blocks: document().blocks)
        let mismatchRoot = try fixture(scratch, "source-mismatch", document: mismatch)
        try expectThrows("source SHA mismatch") { _ = try ContentValidator.validate(root: mismatchRoot) }
        let missing = try fixture(scratch, "missing-field")
        var object = try JSONSerialization.jsonObject(with: JSONEncoder().encode(document())) as! [String: Any]
        object.removeValue(forKey: "blocks")
        try replaceFile(missing, path: "articles/example.json", data: JSONSerialization.data(withJSONObject: object))
        try expectThrows("missing document field") { _ = try ContentValidator.validate(root: missing) }
        let oversized = try fixture(scratch, "oversized-png")
        var bytes = [UInt8](pixel); bytes.replaceSubrange(16..<20, with: [0, 0, 32, 1]) // 8193px: one over the shared renderer limit.
        try replaceFile(oversized, path: "assets/pixel.png", data: Data(bytes))
        try expectThrows("PNG dimension limit") { _ = try ContentValidator.validate(root: oversized) }
        print("PASS native types, references, PNG limits, required fields and depth/element limits")
    }

    private static func legacyPackageFallback(_ scratch: URL) throws {
        let bundled = try fixture(scratch, "native-bundle")
        let storage = scratch.appendingPathComponent("legacy-storage")
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
        try expect(try repository.load().manifest.schema_version == 2, "Legacy package did not fall back to the bundle")
        try expectThrows("old HTML update") { _ = try repository.install(from: legacy) }
        try expect(FileManager.default.fileExists(atPath: legacy.path), "Fallback deleted the legacy package")
        print("PASS old HTML package fallback without deleting stored versions")
    }

    private static func futurePackageSchemas(_ scratch: URL) throws {
        let cases = [(name: "manifest", manifest: 3, document: 1), (name: "document", manifest: 2, document: 2)]
        for scenario in cases {
            let prefix = "future-\(scenario.name)"
            let bundled = try fixture(scratch, prefix + "-bundle", revision: "bundled")
            let update = try fixture(scratch, prefix + "-accepted", revision: "accepted")
            let originalDocument = document()
            let futureDocument = NativeDocument(schema_version: scenario.document, article_id: originalDocument.article_id,
                source_sha256: originalDocument.source_sha256, blocks: originalDocument.blocks)
            let future = try fixture(scratch, prefix + "-source", revision: "future", document: futureDocument)
            let manifestURL = future.appendingPathComponent("manifest.json")
            let originalManifest = try JSONDecoder().decode(ContentManifest.self, from: Data(contentsOf: manifestURL))
            try JSONEncoder().encode(ContentManifest(schema_version: scenario.manifest, revision: originalManifest.revision,
                articles: originalManifest.articles, audio: originalManifest.audio, files: originalManifest.files)).write(to: manifestURL)
            try expect(try ContentValidator.sha256(at: future.appendingPathComponent("articles/example.json")) == originalManifest.files["articles/example.json"],
                       "Future schema fixture has an unrelated hash mismatch")
            let suite = "ai-library-future-schema-" + UUID().uuidString
            guard let defaults = UserDefaults(suiteName: suite) else { throw SmokeFailure(message: "Could not create isolated defaults") }
            defer { defaults.removePersistentDomain(forName: suite) }
            let reading = ReadingStore(defaults: defaults)
            reading.toggleBookmark("example")
            reading.record(articleID: "example", heading: "intro", fraction: 0.42, blockID: "paragraph")
            let savedRecords = defaults.data(forKey: "library.reading.v1")
            try expect(savedRecords != nil, "Reading records were not saved")

            let installStorage = scratch.appendingPathComponent(prefix + "-install-storage")
            let repository = ContentRepository(bundledRoot: bundled, storageRoot: installStorage)
            let accepted = try repository.install(from: update)
            let pointerURL = installStorage.appendingPathComponent("current.json")
            let pointerBefore = try Data(contentsOf: pointerURL)
            let acceptedDocument = try Data(contentsOf: accepted.root.appendingPathComponent("articles/example.json"))
            try expectThrows("future \(scenario.name) schema") { _ = try ContentValidator.validate(root: future) }
            try expectThrows("future \(scenario.name) install") { _ = try repository.install(from: future) }
            try expect(try repository.load().manifest.revision == "accepted", "Rejected future schema replaced the normal version")
            try expect(try Data(contentsOf: pointerURL) == pointerBefore, "Rejected future schema changed the current pointer")
            try expect(try Data(contentsOf: accepted.root.appendingPathComponent("articles/example.json")) == acceptedDocument,
                       "Rejected future schema changed accepted content")
            try expect(try FileManager.default.contentsOfDirectory(atPath: installStorage.appendingPathComponent("versions").path).count == 1,
                       "Rejected future schema left a partial version")
            try expect(FileManager.default.fileExists(atPath: future.path), "Rejected install removed the source package")

            let fallbackStorage = scratch.appendingPathComponent(prefix + "-fallback-storage")
            let versions = fallbackStorage.appendingPathComponent("versions")
            try FileManager.default.createDirectory(at: versions, withIntermediateDirectories: true)
            let id = UUID().uuidString
            let stored = versions.appendingPathComponent(id)
            try FileManager.default.copyItem(at: future, to: stored)
            let storedManifest = try Data(contentsOf: stored.appendingPathComponent("manifest.json"))
            let pointer = try JSONSerialization.data(withJSONObject: ["directory": id])
            let storedPointerURL = fallbackStorage.appendingPathComponent("current.json")
            try pointer.write(to: storedPointerURL)
            let restarted = ContentRepository(bundledRoot: bundled, storageRoot: fallbackStorage)
            let fallback = try restarted.load()
            try expect(fallback.manifest.revision == "bundled" && fallback.root.standardizedFileURL == bundled.standardizedFileURL,
                       "Stored future schema did not fall back to the bundle")
            try expect(try fallback.document(for: article()) == document(), "Fallback returned incompatible content")
            try expectThrows("stored future \(scenario.name) install") { _ = try restarted.install(from: stored) }
            try expect(try Data(contentsOf: stored.appendingPathComponent("manifest.json")) == storedManifest,
                       "Fallback changed or removed the future package")
            try expect(try Data(contentsOf: storedPointerURL) == pointer, "Fallback rewrote the user's stored pointer")
            try expect(defaults.data(forKey: "library.reading.v1") == savedRecords, "Schema rejection changed reading data")
            let restored = ReadingStore(defaults: defaults)
            try expect(restored.bookmarks == ["example"] && restored.position(for: article()).fraction == 0.42 &&
                       restored.position(for: article()).blockID == "paragraph", "Schema fallback lost bookmarks or reading position")
        }
        print("PASS future manifest/document rejection, normal version preservation and stored-package fallback with reading records")
    }

    private static func failedUpdates(_ scratch: URL) throws {
        let bundled = try fixture(scratch, "bundle")
        let update = try fixture(scratch, "update", revision: "v2")
        let third = try fixture(scratch, "third", revision: "v3")
        let storage = scratch.appendingPathComponent("storage", isDirectory: true)
        let repository = ContentRepository(bundledRoot: bundled, storageRoot: storage)
        try expect(try repository.install(from: update).manifest.revision == "v2", "Update did not activate")
        let failing = ContentRepository(bundledRoot: bundled, storageRoot: storage,
                                        writePointer: { _, _ in throw CocoaError(.fileWriteNoPermission) })
        try expectThrows("pointer activation failure") { _ = try failing.install(from: third) }
        try expect(try repository.load().manifest.revision == "v2", "Activation failure changed current version")
        try Data("changed".utf8).write(to: third.appendingPathComponent("articles/example.json"))
        try expectThrows("update verification failure") { _ = try repository.install(from: third) }
        try expect(try repository.load().manifest.revision == "v2", "Verification failure changed current version")
        let remaining = try FileManager.default.contentsOfDirectory(atPath: storage.appendingPathComponent("versions").path)
        try expect(remaining.count == 1, "Failed staging was not cleaned up")
        print("PASS failed-update rollback and staging cleanup")
    }

    private static func testFixtureIsolation(_ scratch: URL) throws {
        let regular = try fixture(scratch, "fixture-normal")
        let update = try fixture(scratch, "fixture-normal-update", revision: "normal-v2")
        let testing = try fixture(scratch, "fixture-test", revision: "test-v1", isTestFixture: true)
        let normalStorage = scratch.appendingPathComponent("fixture-normal-storage", isDirectory: true)
        let testStorage = scratch.appendingPathComponent("fixture-test-storage", isDirectory: true)
        let normal = ContentRepository(bundledRoot: regular, storageRoot: normalStorage)
        let isolated = ContentRepository(bundledRoot: testing, storageRoot: testStorage, allowsTestFixtures: true)
        try expect(try ContentValidator.validate(root: testing).manifest.containsTestFixtures,
                   "Generic validation did not retain fixture metadata")
        try expect(try ContentValidator.validate(root: regular).manifest.articles[0].is_test_fixture == nil,
                   "Existing article metadata no longer decodes")
        _ = try normal.install(from: update)
        let pointerURL = normalStorage.appendingPathComponent("current.json")
        let pointer = try Data(contentsOf: pointerURL)
        try expectThrows("fixture import into normal content") { _ = try normal.install(from: testing) }
        try expect(try Data(contentsOf: pointerURL) == pointer, "Fixture import changed the normal pointer")
        try expect(try normal.load().manifest.revision == "normal-v2", "Fixture import replaced normal content")
        try expect(try FileManager.default.contentsOfDirectory(atPath: normalStorage.appendingPathComponent("versions").path).count == 1,
                   "Rejected fixture import left a version")
        let installed = try isolated.install(from: testing)
        try expect(installed.manifest.containsTestFixtures, "Explicit test repository rejected test content")
        try expect(try Data(contentsOf: pointerURL) == pointer, "Test storage changed the normal pointer")
        let fallback = ContentRepository(bundledRoot: regular, storageRoot: testStorage)
        try expect(try fallback.load().manifest.revision == "v1", "Normal load accepted a test current version")
        try expect(FileManager.default.fileExists(atPath: installed.root.path), "Fallback deleted the stored test version")
        try expectThrows("fixture bundle in a normal repository") {
            _ = try ContentRepository(bundledRoot: testing, storageRoot: scratch.appendingPathComponent("fixture-unused")).load()
        }
        let normalSuite = "library-fixture-normal-" + UUID().uuidString
        let testSuite = "library-fixture-test-" + UUID().uuidString
        let normalDefaults = UserDefaults(suiteName: normalSuite)!
        let testDefaults = UserDefaults(suiteName: testSuite)!
        defer {
            normalDefaults.removePersistentDomain(forName: normalSuite)
            testDefaults.removePersistentDomain(forName: testSuite)
        }
        let reading = ReadingStore(defaults: normalDefaults)
        reading.toggleBookmark("example")
        reading.record(articleID: "example", heading: "intro", fraction: 0.2)
        normalDefaults.set(55.0, forKey: "ios.audio.example.position")
        let records = normalDefaults.data(forKey: "library.reading.v1")
        let testReading = ReadingStore(defaults: testDefaults)
        testReading.record(articleID: "example", heading: "intro", fraction: 0.8)
        testReading.toggleBookmark("test-fixtures/native-reader")
        try expect(normalDefaults.data(forKey: "library.reading.v1") == records,
                   "Test reading changed normal records")
        try expect(normalDefaults.double(forKey: "ios.audio.example.position") == 55,
                   "Test reading changed normal audio settings")
        try expect(ReadingStore(defaults: testDefaults).position(for: article()).fraction == 0.8,
                   "Test reading records did not remain isolated")
        print("PASS fixture metadata, explicit content policy, separate storage and reading records")
    }

    private static func readAccessDirectory(_ scratch: URL) throws {
        let root = try fixture(scratch, "read-access/Content")
        let manifestData = try Data(contentsOf: root.appendingPathComponent("manifest.json"))
        let validated = try ContentValidator.validate(root: root)
        let manifest = validated.manifest
        let files = manifest.files
        let parent = root.deletingLastPathComponent()
        try FileManager.default.createDirectory(at: parent.appendingPathComponent("unused"), withIntermediateDirectories: true)
        try Data("outside the content package".utf8).write(to: parent.appendingPathComponent("outside.txt"))
        let alias = scratch.appendingPathComponent("read-access-alias")
        try FileManager.default.createSymbolicLink(at: alias, withDestinationURL: parent)
        let expectedDirectory = try FileManager.default.attributesOfItem(atPath: root.path)
        let expectedFileSystem = expectedDirectory[.systemNumber] as? NSNumber
        let expectedFileNumber = expectedDirectory[.systemFileNumber] as? NSNumber
        try expect(expectedFileSystem != nil && expectedFileNumber != nil, "Directory identity was unavailable")
        for path in [alias.path + "/Content", alias.path + "/unused/../Content"] {
            let input = URL(fileURLWithPath: path, isDirectory: false)
            let snapshot = ContentSnapshot(root: input, manifest: validated.manifest)
            let access = snapshot.readAccessRoot
            let actualDirectory = try FileManager.default.attributesOfItem(atPath: access.path)
            try expect(access.hasDirectoryPath, "Content access must identify a directory")
            let components = access.pathComponents
            try expect(!components.contains(".") && !components.contains(".."), "Read access retained nonstandard path components")
            // Foundation can retain system spellings such as /tmp; the package alias must be removed.
            try expect(!components.contains(alias.lastPathComponent), "Read access retained the package's symbolic-link alias")
            try expect(actualDirectory[.systemNumber] as? NSNumber == expectedFileSystem &&
                       actualDirectory[.systemFileNumber] as? NSNumber == expectedFileNumber,
                       "Read access must refer to the same Content directory")
            for relative in ["articles/example.json", "assets/pixel.png"] {
                let file = access.appendingPathComponent(relative)
                try expect(file.pathComponents.starts(with: access.pathComponents), "A bundled file escaped read access")
                let actualData = try Data(contentsOf: file)
                let expectedData = try Data(contentsOf: root.appendingPathComponent(relative))
                try expect(actualData == expectedData, "Read access changed a bundled file")
            }
            try expect(!FileManager.default.fileExists(atPath: access.appendingPathComponent("outside.txt").path), "Read access was widened to the parent directory")
            try expect(snapshot.root == input && !snapshot.root.hasDirectoryPath, "Read access changed the snapshot root")
            try expect(snapshot.manifest.revision == manifest.revision && snapshot.manifest.files == files, "Read access changed the manifest")
            try expect(try Data(contentsOf: root.appendingPathComponent("manifest.json")) == manifestData, "Read access rewrote the manifest")
        }
        print("PASS canonical Content-only read access through ancestor symlink and nonstandard path")
    }

    private static func readingRecords() throws {
        let suite = "ai-library-smoke-" + UUID().uuidString
        guard let defaults = UserDefaults(suiteName: suite) else { throw SmokeFailure(message: "Could not create isolated defaults") }
        defer { defaults.removePersistentDomain(forName: suite) }
        let first = ReadingStore(defaults: defaults)
        first.toggleBookmark("example")
        first.record(articleID: "example", heading: "intro", fraction: 0.42)
        let restored = ReadingStore(defaults: defaults)
        try expect(restored.bookmarks == ["example"], "Bookmark did not persist")
        try expect(restored.lastArticleID == "example", "Last article did not persist")
        try expect(restored.position(for: article()) == ReadingPosition(heading: "intro", fraction: 0.42), "Reading position did not persist")
        restored.markOpened("another-article")
        try expect(ReadingStore(defaults: defaults).lastArticleID == "another-article", "Opening without scrolling did not persist")
        try expect(restored.position(for: article()).fraction == 0.42, "Opening an article changed a saved position")
        restored.record(articleID: "example", heading: "removed", fraction: 2)
        try expect(restored.position(for: article()) == ReadingPosition(heading: nil, fraction: 1), "Removed-heading fallback or clamping failed")
        restored.record(articleID: "example", heading: nil, fraction: .nan)
        try expect(restored.position(for: article()).fraction == 1, "Non-finite position was accepted")
        let legacy = Data("{\"bookmarks\":[\"example\"],\"positions\":{\"example\":{\"heading\":\"intro\",\"fraction\":0.42}},\"lastArticleID\":\"example\"}".utf8)
        defaults.set(legacy, forKey: "library.reading.v1")
        let migrated = ReadingStore(defaults: defaults)
        try expect(migrated.bookmarks == ["example"], "Legacy bookmarks were lost")
        try expect(migrated.position(for: article(), document: document()).blockID == "heading", "Legacy heading did not migrate to a native block")
        migrated.record(articleID: "example", heading: "intro", fraction: 0.42, blockID: "paragraph")
        try expect(ReadingStore(defaults: defaults).position(for: article(), document: document()).blockID == "paragraph", "Native block position did not persist")
        migrated.record(articleID: "example", heading: "intro", fraction: 0.42, blockID: "removed")
        try expect(migrated.position(for: article(), document: document()).blockID == "heading", "Removed block did not fall back to heading")
        defaults.set(Data("{\"bookmarks\":[\"example\"],\"positions\":{\"example\":{\"heading\":5,\"fraction\":\"invalid\",\"blockID\":\"removed\"}}}".utf8), forKey: "library.reading.v1")
        let damaged = ReadingStore(defaults: defaults)
        try expect(damaged.bookmarks == ["example"], "Malformed reading position erased bookmarks")
        try expect(damaged.position(for: article(), document: document()).blockID.flatMap { document().block(id: $0) } != nil, "Malformed position did not restore to a known block")
        print("PASS bookmark and reading-position restoration")
    }

    private static func revisedReadingRecords() throws {
        let digest = String(repeating: "a", count: 64), revisedDigest = String(repeating: "b", count: 64)
        let heading: (String, String) -> NativeBlock = { id, text in
            NativeBlock(id: id, type: "heading", heading_id: id, level: 2, inlines: [NativeInline(type: "text", text: text)])
        }
        let paragraph: (String, String) -> NativeBlock = { id, text in
            NativeBlock(id: id, type: "paragraph", inlines: [NativeInline(type: "text", text: text)])
        }
        let doc: ([NativeBlock]) -> NativeDocument = {
            NativeDocument(schema_version: 1, article_id: "example", source_sha256: digest, blocks: $0)
        }
        let original = doc([heading("old-heading", "節"), paragraph("target", "本文")])
        guard let anchor = original.readingAnchor(blockID: "target", documentDigest: digest) else {
            throw SmokeFailure(message: "Could not create native reading anchor")
        }
        let position = ReadingPosition(heading: "old-heading", fraction: 1, blockID: "target", anchor: anchor)
        try expect(original.readingBlockID(for: position, documentDigest: digest) == "target", "Same-digest direct restore failed")
        let renamed = doc([heading("new-heading", "改名"), paragraph("front", "追加"), paragraph("new-target", "本文"), paragraph("end", "末尾")])
        try expect(renamed.readingBlockID(for: position, documentDigest: revisedDigest) == "new-target", "Inserted paragraph / renamed heading lost target")
        try expect(renamed.readingBlockID(for: position) == "new-target", "Missing digest trusted a stale ID")
        let deleted = doc([paragraph("front", "前方"), heading("new-heading", "節"), paragraph("target", "別の本文")])
        try expect(deleted.readingBlockID(for: position, documentDigest: revisedDigest) == "new-heading", "Changed target failed heading fallback")
        let repeated = doc([heading("other-heading", "別節"), paragraph("target", "本文"), heading("new-heading", "節"), paragraph("correct", "本文")])
        try expect(repeated.readingBlockID(for: position, documentDigest: revisedDigest) == "correct", "Repeated paragraph ignored unique section")
        let repeatedInSection = doc(repeated.blocks + [paragraph("another-copy", "本文")])
        try expect(repeatedInSection.readingBlockID(for: position, documentDigest: revisedDigest) == "new-heading", "Ambiguous section target did not fall back to heading")
        let ambiguous = doc([heading("one", "節"), paragraph("target", "本文"), heading("two", "節"), paragraph("last", "本文")])
        try expect(ambiguous.readingBlockID(for: position, documentDigest: revisedDigest) == "last", "Ambiguous section trusted a reassigned ID")
        let legacy = ReadingPosition(heading: nil, fraction: 1, blockID: "target")
        try expect(ambiguous.readingBlockID(for: legacy) == "target", "Legacy direct restore changed")
        try expect(doc([]).readingBlockID(for: position) == nil, "Empty document resolved to an invalid block")
        var firstMath = NativeBlock(id: "old-math", type: "math", asset: image, source: "x^2", accessibility_text: "二乗")
        var nextMath = firstMath
        nextMath.asset = NativeAsset(light: "assets/changed.png", dark: "assets/dark.png", width: 800, height: 400, scale: 2)
        let firstFP = doc([firstMath]).readingAnchor(blockID: "old-math", documentDigest: digest)?.blockFingerprint
        try expect(firstFP == doc([nextMath]).readingAnchor(blockID: "old-math", documentDigest: digest)?.blockFingerprint, "Generated asset changed semantic fingerprint")
        firstMath.source = "x^3"
        try expect(firstFP != doc([firstMath]).readingAnchor(blockID: "old-math", documentDigest: digest)?.blockFingerprint, "Changed TeX did not change fingerprint")
        let code1 = NativeBlock(id: "code", type: "code", language: "python", text: "  x\n")
        let code2 = NativeBlock(id: "code", type: "code", language: "python", text: " x\n")
        try expect(doc([code1]).readingAnchor(blockID: "code", documentDigest: digest)?.blockFingerprint
            != doc([code2]).readingAnchor(blockID: "code", documentDigest: digest)?.blockFingerprint, "Code indentation was normalized away")
        for type in ["quote", "list", "table"] {
            func wrapped(_ value: String) -> NativeBlock {
                let child = paragraph("child", value)
                if type == "quote" { return NativeBlock(id: "container", type: type, blocks: [child]) }
                if type == "list" { return NativeBlock(id: "container", type: type, ordered: true, start: 8,
                    items: [NativeListItem(id: "item", blocks: [child])]) }
                return NativeBlock(id: "container", type: type, table: NativeTable(header: [[NativeInline(type: "text", text: "列")]],
                    rows: [[[NativeInline(type: "text", text: value)]]], alignments: ["left"]))
            }
            try expect(doc([wrapped("旧値")]).readingAnchor(blockID: "container", documentDigest: digest)?.blockFingerprint
                != doc([wrapped("新値")]).readingAnchor(blockID: "container", documentDigest: digest)?.blockFingerprint, "Nested \(type) meaning was lost")
        }
        let suite = "ai-library-anchor-smoke-" + UUID().uuidString
        guard let defaults = UserDefaults(suiteName: suite) else { throw SmokeFailure(message: "Could not create isolated defaults") }
        defer { defaults.removePersistentDomain(forName: suite) }
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark("example")
        reading.record(articleID: "other", heading: nil, fraction: 0.8)
        reading.record(articleID: "example", heading: "intro", fraction: 1, blockID: "target", anchor: anchor)
        let before = defaults.data(forKey: "library.reading.v1")
        let restored = ReadingStore(defaults: defaults)
        try expect(restored.position(for: article()).anchor == anchor, "Anchor did not survive reload")
        try expect(restored.position(for: article(), document: renamed, documentDigest: revisedDigest).blockID == "new-target", "Saved anchor did not resolve after revision")
        try expect(defaults.data(forKey: "library.reading.v1") == before, "Resolving rewrote saved data")
        let unknownVersion = "{\"version\":2,\"documentDigest\":\"\(digest)\",\"blockFingerprint\":\"\(digest)\"}"
        let invalidHeading = "{\"version\":1,\"documentDigest\":\"\(digest)\",\"blockFingerprint\":\"\(digest)\",\"headingFingerprint\":7}"
        for invalid in [unknownVersion, invalidHeading,
                        "{\"version\":1,\"documentDigest\":\"invalid\",\"blockFingerprint\":\"invalid\"}", "\"invalid\""] {
            let json = "{\"bookmarks\":[\"example\"],\"positions\":{\"example\":{\"heading\":\"intro\",\"fraction\":0.5,\"blockID\":\"paragraph\",\"anchor\":\(invalid)},\"other\":{\"fraction\":0.8}},\"lastArticleID\":\"other\"}"
            let bytes = Data(json.utf8)
            defaults.set(bytes, forKey: "library.reading.v1")
            let damaged = ReadingStore(defaults: defaults)
            try expect(damaged.position(for: article()).anchor == nil, "Invalid or unknown anchor accepted")
            try expect(damaged.position(for: article(), document: document(), documentDigest: digest).blockID == "paragraph", "Invalid anchor lost legacy position")
            try expect(damaged.bookmarks == ["example"] && damaged.lastArticleID == "other", "Invalid anchor cleared other records")
            try expect(defaults.data(forKey: "library.reading.v1") == bytes, "Invalid-anchor read mutated defaults")
            damaged.markOpened("example")
            let updated = try JSONSerialization.jsonObject(with: defaults.data(forKey: "library.reading.v1")!) as! [String: Any]
            try expect((updated["positions"] as? [String: Any])?["other"] != nil, "Rewriting invalid anchor erased another position")
        }
        print("PASS revision-aware reading anchors, semantic disambiguation, fallback and backward-compatible storage")
    }
}

/// Test-only gate: ordering comes from explicit signals, not a scheduling delay.
/// The deadline bounds a broken scenario and is not a performance assertion.
private final class SmokeMutationPointerGate: @unchecked Sendable {
    let entered = DispatchSemaphore(value: 0)
    let resume = DispatchSemaphore(value: 0)
    private let lock = NSLock()
    private var pointer: Data?

    func rejectPointer(_ data: Data) throws {
        lock.lock(); pointer = data; lock.unlock()
        entered.signal()
        guard resume.wait(timeout: .now() + 10) == .success else {
            throw SmokeFailure(message: "Mutation pointer gate was not released")
        }
        throw CocoaError(.fileWriteOutOfSpace)
    }

    func pendingPointer() -> Data? {
        lock.lock()
        defer { lock.unlock() }
        return pointer
    }
}

/// One background repository operation; only the locked result crosses back.
private final class SmokeMutationRequest: @unchecked Sendable {
    let finished = DispatchSemaphore(value: 0)
    private let repository: ContentRepository
    private let source: URL
    private let lock = NSLock()
    private var result: Result<ContentSnapshot, Error>?

    init(repository: ContentRepository, source: URL) { self.repository = repository; self.source = source }

    func run() {
        let value = Result { try repository.install(from: source) }
        lock.lock(); result = value; lock.unlock()
        finished.signal()
    }

    func outcome() throws -> Result<ContentSnapshot, Error> {
        lock.lock()
        defer { lock.unlock() }
        guard let result else { throw SmokeFailure(message: "Mutation request has no terminal result") }
        return result
    }
}

private final class SmokeMutationFileManager: FileManager, @unchecked Sendable {
    enum Point: Equatable { case beforeCopy, afterCopy, afterMove, beforeRemove, afterRemove }
    let observe: (Point, URL) -> Void
    init(observe: @escaping (Point, URL) -> Void) { self.observe = observe; super.init() }

    override func copyItem(at srcURL: URL, to dstURL: URL) throws {
        observe(.beforeCopy, dstURL)
        try super.copyItem(at: srcURL, to: dstURL)
        observe(.afterCopy, dstURL)
    }

    override func moveItem(at srcURL: URL, to dstURL: URL) throws {
        try super.moveItem(at: srcURL, to: dstURL)
        observe(.afterMove, dstURL)
    }

    override func removeItem(at url: URL) throws {
        observe(.beforeRemove, url)
        defer { observe(.afterRemove, url) }
        try super.removeItem(at: url)
    }
}

/// Cleanup deliberately ignores remove errors in production. Keep probe failures
/// independently so a swallowed callback error cannot become a successful smoke.
private final class SmokeMutationEvidence: @unchecked Sendable {
    private let lock = NSLock()
    private var points: [SmokeMutationFileManager.Point] = []
    private var firstFailure: String?

    func record(_ point: SmokeMutationFileManager.Point, error: Error?) {
        lock.lock()
        defer { lock.unlock() }
        points.append(point)
        if firstFailure == nil, let error { firstFailure = error.localizedDescription }
    }

    func value() -> (points: [SmokeMutationFileManager.Point], firstFailure: String?) {
        lock.lock()
        defer { lock.unlock() }
        return (points, firstFailure)
    }
}

private extension CoreSmoke {
    static func mutationInventory(_ root: URL) throws -> [String: Data] {
        let prefix = root.standardizedFileURL.path + "/"
        guard let entries = FileManager.default.enumerator(at: root, includingPropertiesForKeys: [.isRegularFileKey]) else {
            throw SmokeFailure(message: "Could not enumerate synthetic mutation storage")
        }
        var values: [String: Data] = [:]
        for case let url as URL in entries {
            if try url.resourceValues(forKeys: [.isRegularFileKey]).isRegularFile == true {
                let path = url.standardizedFileURL.path
                try expect(path.hasPrefix(prefix), "Mutation inventory escaped its synthetic root")
                values[String(path.dropFirst(prefix.count))] = try Data(contentsOf: url)
            }
        }
        return values
    }

    static func expectMutationBusy(_ label: String, _ operation: () throws -> Void) throws {
        var rejection: Error?
        try expectThrows(label) {
            do { try operation() } catch { rejection = error; throw error }
        }
        try expect(rejection?.localizedDescription.contains("取り込み処理が進行中") == true,
                   "A competing repository failed for a reason other than the shared busy permit")
    }

    static func mutationCoordination(_ scratch: URL) throws {
        let bundled = try fixture(scratch, "mutation-bundle", revision: "bundle")
        let first = try fixture(scratch, "mutation-first", revision: "first")
        let incoming = try fixture(scratch, "mutation-incoming", revision: "incoming")
        let storage = scratch.appendingPathComponent("mutation-storage")
        let reader = ContentRepository(bundledRoot: bundled, storageRoot: storage)
        let old = try reader.install(from: first)
        let alias = scratch.appendingPathComponent("mutation-storage-alias")
        try FileManager.default.createSymbolicLink(at: alias, withDestinationURL: storage)
        let orphan = storage.appendingPathComponent("versions/.staging-" + UUID().uuidString)
        try FileManager.default.createDirectory(at: orphan, withIntermediateDirectories: false)
        try Data("retained earlier orphan".utf8).write(to: orphan.appendingPathComponent("partial.bin"))
        try Data("unrelated retained bytes".utf8).write(to: storage.appendingPathComponent("retained-marker.bin"))
        let before = try mutationInventory(storage)
        let oldAsset = try Data(contentsOf: old.root.appendingPathComponent("assets/pixel.png"))
        let peer = ContentRepository(bundledRoot: bundled, storageRoot: alias)
        let gate = SmokeMutationPointerGate()
        let evidence = SmokeMutationEvidence()
        let manager = SmokeMutationFileManager { point, url in
            var failure: Error?
            do {
                let name = url.lastPathComponent
                let value = name.hasPrefix(".staging-") ? String(name.dropFirst(".staging-".count)) : name
                guard let id = UUID(uuidString: value) else { throw SmokeFailure(message: "Invalid synthetic attempt name") }
                try expect(try ContentMutationCoordinator.activeStagingAttemptIDs(at: storage) == [id],
                           "The attempt registration did not cover copy, rename or cleanup")
                if point == .beforeRemove || point == .afterRemove {
                    try expectMutationBusy("peer during owner cleanup") { _ = try peer.install(from: incoming) }
                }
            } catch { failure = error }
            evidence.record(point, error: failure)
        }
        let request = SmokeMutationRequest(repository: ContentRepository(bundledRoot: bundled, storageRoot: storage,
            fileManager: manager, writePointer: { data, _ in try gate.rejectPointer(data) }), source: incoming)
        DispatchQueue.global(qos: .userInitiated).async { request.run() }
        var observationError: Error?
        if gate.entered.wait(timeout: .now() + 10) == .success {
            do {
                guard let data = gate.pendingPointer() else { throw SmokeFailure(message: "Missing pending pointer") }
                let pointer = try JSONDecoder().decode([String: String].self, from: data)
                guard let value = pointer["directory"], let id = UUID(uuidString: value) else {
                    throw SmokeFailure(message: "Missing synthetic attempt identity")
                }
                try expect(try ContentMutationCoordinator.activeStagingAttemptIDs(at: alias) == [id],
                           "Existing symlink aliases did not observe the same registered attempt")
                let held = try mutationInventory(storage)
                try expectMutationBusy("overlapping alias import") { _ = try peer.install(from: incoming) }
                try expectMutationBusy("overlapping bundled activation") { _ = try peer.activateBundledContent() }
                try expect(try mutationInventory(storage) == held, "A rejected peer changed stored bytes")
                try expect(try reader.load().root == old.root, "Read-only load lost the healthy selection while import was pending")
                let independent = scratch.appendingPathComponent("mutation-independent-storage")
                let selected = try ContentRepository(bundledRoot: bundled, storageRoot: independent).install(from: incoming)
                try expect(selected.manifest.revision == "incoming", "Independent roots incorrectly shared the busy state")
            } catch { observationError = error }
        } else { observationError = SmokeFailure(message: "Mutation import never reached the controlled pointer gate") }
        gate.resume.signal()
        guard request.finished.wait(timeout: .now() + 10) == .success else {
            throw SmokeFailure(message: "Mutation import did not complete after gate release")
        }
        if let observationError { throw observationError }
        let outcome = try request.outcome()
        try expectThrows("controlled mutation ENOSPC") { _ = try outcome.get() }
        if case .failure(let error) = outcome {
            try expect((error as NSError).domain == NSCocoaErrorDomain
                && (error as NSError).code == CocoaError.Code.fileWriteOutOfSpace.rawValue,
                       "The owner failed outside the intended pointer ENOSPC boundary")
        }
        let observed = evidence.value()
        try expect(observed.firstFailure == nil, observed.firstFailure ?? "Unexpected mutation observation failure")
        try expect(observed.points == [.beforeCopy, .afterCopy, .afterMove, .beforeRemove, .afterRemove, .beforeRemove, .afterRemove],
                   "The expected copy/rename/two-cleanup boundaries did not all execute")
        try expect(try ContentMutationCoordinator.activeStagingAttemptIDs(at: storage).isEmpty,
                   "A failed import left the root busy or its attempt registered")
        try expect(try mutationInventory(storage) == before, "Failed import changed current/old/orphan/unrelated bytes")
        try expect(try reader.load().root == old.root, "Pointer failure lost the old healthy selection")
        let retried = try reader.install(from: incoming)
        try expect(retried.manifest.revision == "incoming", "Import was not retryable after owner cleanup")
        try expect(try reader.load().manifest.revision == "incoming", "Retry did not publish its healthy selection")
        let after = try mutationInventory(storage)
        for (path, bytes) in before where path != "current.json" {
            try expect(after[path] == bytes, "Retry changed a retained old, orphan or unrelated file")
        }
        try expect(try Data(contentsOf: old.root.appendingPathComponent("assets/pixel.png")) == oldAsset,
                   "Old snapshots lost their delayed asset read after retry")
        try expect(try ContentMutationCoordinator.activeStagingAttemptIDs(at: storage).isEmpty,
                   "Successful retry did not release its attempt registration")
        print("PASS shared-root import coordination, active staging lifetime, ENOSPC rollback and retry")
    }
}

private extension CoreSmoke {
    static func storageBookkeepingScopes(_ scratch: URL) throws {
        let parent = scratch.appendingPathComponent("scope-smoke-parent")
        let storage = parent.appendingPathComponent("LibraryContent")
        let other = scratch.appendingPathComponent("scope-smoke-other")
        for root in [storage, other] { try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true) }
        let alias = scratch.appendingPathComponent("scope-smoke-alias")
        let parentAlias = scratch.appendingPathComponent("scope-smoke-parent-alias")
        try FileManager.default.createSymbolicLink(at: alias, withDestinationURL: storage)
        try FileManager.default.createSymbolicLink(at: parentAlias, withDestinationURL: parent)
        let throughParent = parentAlias.appendingPathComponent("LibraryContent"), generation = UUID()
        var direct = ContentSnapshotLease.acquire(storageRoot: storage, generation: generation)
        var aliased = ContentSnapshotLease.acquire(storageRoot: alias, generation: generation)
        var parentPath = ContentSnapshotLease.acquire(storageRoot: throughParent, generation: generation)
        var independentLease = ContentSnapshotLease.acquire(storageRoot: other, generation: generation)
        try expect(direct != nil && aliased != nil && parentPath != nil && independentLease != nil,
                   "An ordinary existing or aliased root failed admission")
        let attempt = UUID(), otherAttempt = UUID()
        try withExtendedLifetime((direct, aliased, parentPath, independentLease)) {
            for root in [storage, alias, throughParent] {
                try expect(ContentSnapshotLease.advisoryAcquisitions(in: root) == [generation: 3],
                           "Existing alias paths did not share acquisitions")
            }
            try expect(ContentSnapshotLease.advisoryAcquisitions(in: other) == [generation: 1],
                       "Distinct roots incorrectly shared acquisitions")
            try ContentMutationCoordinator.withMutation(at: storage) { mutation in
                try mutation.registerStagingAttempt(attempt)
                try expect(try ContentMutationCoordinator.activeStagingAttemptIDs(at: alias) == [attempt],
                           "Mutation and lease scopes did not align")
                try expectMutationBusy("scope alias reentrant rejection") {
                    try ContentMutationCoordinator.withMutation(at: alias) { _ in }
                }
                try ContentMutationCoordinator.withMutation(at: other) { independent in
                    try independent.registerStagingAttempt(otherAttempt)
                    try expect(try ContentMutationCoordinator.activeStagingAttemptIDs(at: other) == [otherAttempt],
                               "Distinct mutation roots did not remain isolated")
                }
                var during = ContentSnapshotLease.acquire(storageRoot: alias, generation: generation)
                try expect(during != nil, "Scope alignment unexpectedly blocked an advisory reader")
                try withExtendedLifetime(during) {
                    try expect(ContentSnapshotLease.advisoryAcquisitions(in: storage) == [generation: 4],
                               "A read during mutation used the wrong bookkeeping scope")
                }
                during = nil
            }
        }
        aliased = nil; parentPath = nil
        let manifest = try ContentValidator.validate(root: fixture(scratch, "scope-smoke-manifest")).manifest
        var original: ContentSnapshot? = direct.map {
            ContentSnapshot(root: storage.appendingPathComponent("versions").appendingPathComponent(generation.uuidString),
                            manifest: manifest).retainingGenerationLease($0)
        }
        direct = nil
        var copy = original
        original = nil
        try withExtendedLifetime(copy) {
            try expect(ContentSnapshotLease.advisoryAcquisitions(in: alias) == [generation: 1],
                       "Snapshot copies did not retain the shared acquisition")
        }
        copy = nil
        independentLease = nil
        try expect(ContentSnapshotLease.advisoryAcquisitions(in: storage).isEmpty
            && ContentSnapshotLease.advisoryAcquisitions(in: other).isEmpty,
                   "Released snapshot copies or distinct-root tokens leaked ledger entries")
        let missing = scratch.appendingPathComponent("scope-smoke-not-created")
        let trailing = URL(fileURLWithPath: missing.path + "/", isDirectory: true)
        var missingLease = ContentSnapshotLease.acquire(storageRoot: missing, generation: generation)
        try expect(missingLease != nil, "A missing ordinary root lost its bookkeeping scope")
        try withExtendedLifetime(missingLease) {
            try expect(ContentSnapshotLease.advisoryAcquisitions(in: trailing) == [generation: 1],
                       "Trailing slash changed a missing root's lease scope")
            try ContentMutationCoordinator.withMutation(at: trailing) { mutation in
                try mutation.registerStagingAttempt(attempt)
                try expect(try ContentMutationCoordinator.activeStagingAttemptIDs(at: missing) == [attempt],
                           "Missing root differed between mutation and lease")
            }
        }
        missingLease = nil
        try expect(ContentSnapshotLease.advisoryAcquisitions(in: missing).isEmpty
            && !FileManager.default.fileExists(atPath: missing.path), "Scope bookkeeping created files or retained a token")
        let rootAlias = scratch.appendingPathComponent("scope-smoke-root-alias")
        try FileManager.default.createSymbolicLink(at: rootAlias, withDestinationURL: URL(fileURLWithPath: "/", isDirectory: true))
        let unsupported = ["https://example.invalid/storage", "file:///",
            "file://remote/tmp/scope-storage", "file:///tmp/scope-storage?query=1",
            "file:///tmp/scope-storage#fragment", "file:relative-scope-storage",
            "file://scope-user:scope-pass@localhost/tmp/scope-storage",
            "file://localhost:123/tmp/scope-storage", "file:///tmp/scoped/./storage",
            "file:///tmp/scoped/../storage", "file:///tmp/scoped//storage", "file:///tmp/scoped/%2E%2E/storage"]
        let invalid = try unsupported.map { raw -> URL in
            guard let root = URL(string: raw) else {
                throw SmokeFailure(message: "The unsupported-URL fixture is not representable: " + raw)
            }
            return root
        } + [rootAlias]
        for root in invalid {
            try expect(ContentSnapshotLease.acquire(storageRoot: root, generation: generation) == nil
                && ContentSnapshotLease.advisoryAcquisitions(in: root).isEmpty, "Invalid root reached the lease ledger")
            var entered = false
            try expectThrows("unsupported mutation root") {
                try ContentMutationCoordinator.withMutation(at: root) { _ in entered = true }
            }
            try expectThrows("unsupported staging query root") { _ = try ContentMutationCoordinator.activeStagingAttemptIDs(at: root) }
            try expect(!entered, "An unsupported root entered mutation")
        }
        try expect(try ContentMutationCoordinator.activeStagingAttemptIDs(at: storage).isEmpty,
                   "Root scope scenario left a mutation registration")
        print("PASS shared canonical scopes, alias lease lifetime and distinct-root coordination")
    }


    static func storedReaderAdmission(_ scratch: URL) throws {
        let source = try fixture(scratch, "admission-source")
        let storage = scratch.appendingPathComponent("admission-storage")
        let writer = ContentRepository(bundledRoot: source, storageRoot: storage)
        var installed: ContentSnapshot? = try writer.install(from: source)
        let root = installed!.root
        guard let generation = UUID(uuidString: root.lastPathComponent) else {
            throw SmokeFailure(message: "Stored admission fixture did not receive a UUID generation")
        }
        installed = nil
        try expect(writer.advisorySnapshotAcquisitions.isEmpty, "Install fixture retained an unexpected lease")
        var handoffs = 0
        let reader = ContentRepository(bundledRoot: source, storageRoot: storage,
            beforeStoredLeasePublication: {
                handoffs += 1
                try expect(ContentSnapshotLease.advisoryAcquisitions(in: storage).isEmpty,
                           "A handoff callback observed an already published lease")
                try expectThrows("cleanup before stored lease publication") {
                    try ContentMutationCoordinator.withCleanupGate(at: storage) { _ in }
                }
            })
        var snapshot: ContentSnapshot? = try reader.load()
        try expect(snapshot?.root == root && handoffs == 1, "Actual load did not use the stored handoff")
        try withExtendedLifetime(snapshot) {
            try expect(reader.advisorySnapshotAcquisitions == [generation: 1], "Load did not publish its lease")
            // Gate acquisition never means a live lease can be removed.
            try ContentMutationCoordinator.withCleanupGate(at: storage) { _ in
                try expect(reader.advisorySnapshotAcquisitions == [generation: 1], "A gate changed live lease accounting")
                try expectThrows("load during bookkeeping cleanup gate") { _ = try reader.load() }
                try expectThrows("writer during bookkeeping cleanup gate") { _ = try writer.install(from: source) }
            }
        }
        snapshot = nil
        let failing = ContentRepository(bundledRoot: source, storageRoot: storage,
            beforeStoredLeasePublication: { throw SmokeFailure(message: "Synthetic handoff failure") })
        try expectThrows("stored handoff failure") { _ = try failing.load() }
        try expect(failing.advisorySnapshotAcquisitions.isEmpty, "Failed handoff retained a lease")
        try ContentMutationCoordinator.withCleanupGate(at: storage) { _ in }
        let empty = scratch.appendingPathComponent("admission-empty-storage")
        try expectThrows("bundle validation failure") {
            _ = try ContentRepository(bundledRoot: scratch.appendingPathComponent("admission-missing-bundle"), storageRoot: empty).load()
        }
        try ContentMutationCoordinator.withCleanupGate(at: empty) { _ in }
        try expect(try ContentRepository(bundledRoot: source, storageRoot: empty).load().root == source,
                   "Normal bundle fallback was not restored after admission release")
        try expect(!FileManager.default.fileExists(atPath: empty.path), "Bookkeeping created an empty storage root")
        print("PASS stored reader admission, lease handoff and validation-failure release")
    }

    static func admissionBookkeeping(_ scratch: URL) throws {
        let storage = scratch.appendingPathComponent("admission-bookkeeping")
        let other = scratch.appendingPathComponent("admission-bookkeeping-other")
        let generation = UUID(), attempt = UUID()
        try ContentMutationCoordinator.withReaderAdmission(at: storage) { reader in
            try ContentMutationCoordinator.withMutation(at: storage) { writer in
                try writer.registerStagingAttempt(attempt)
                try ContentMutationCoordinator.withReaderAdmission(at: storage) { second in
                    let a = try reader.acquireLease(generation: generation)
                    let b = try second.acquireLease(generation: generation)
                    try withExtendedLifetime((a, b)) {
                        try expect(ContentSnapshotLease.advisoryAcquisitions(in: storage) == [generation: 2],
                                   "Writer/reader coexistence lost a lease")
                        try expectThrows("cleanup while readers and writer coexist") {
                            try ContentMutationCoordinator.withCleanupGate(at: storage) { _ in }
                        }
                        try ContentMutationCoordinator.withCleanupGate(at: other) { _ in }
                    }
                }
                try expect(try ContentMutationCoordinator.activeStagingAttemptIDs(at: storage) == [attempt],
                           "Reader finish released the live writer")
            }
            try expectThrows("cleanup while outer reader survives writer") {
                try ContentMutationCoordinator.withCleanupGate(at: storage) { _ in }
            }
        }
        var stale: ContentMutationCoordinator.ReaderAdmission?
        try ContentMutationCoordinator.withReaderAdmission(at: storage) { stale = $0 }
        var copy = stale
        try expectThrows("escaped reader lease publication") { _ = try stale!.acquireLease(generation: generation) }
        try ContentMutationCoordinator.withReaderAdmission(at: storage) { _ in
            stale = nil; copy = nil
            try expectThrows("stale reader copies must not release a newer admission") {
                try ContentMutationCoordinator.withCleanupGate(at: storage) { _ in }
            }
        }
        try expect(copy == nil, "Escaped reader copy was not released")
        var oldGate: ContentMutationCoordinator.CleanupGate?
        try ContentMutationCoordinator.withCleanupGate(at: storage) { oldGate = $0 }
        try expectThrows("throwing cleanup body") {
            try ContentMutationCoordinator.withCleanupGate(at: storage) { _ in
                oldGate = nil
                try expectThrows("stale cleanup must not release the live gate") {
                    try ContentMutationCoordinator.withReaderAdmission(at: storage) { _ in }
                }
                try expectThrows("cleanup blocks a new mutation") {
                    try ContentMutationCoordinator.withMutation(at: storage) { _ in }
                }
                try ContentMutationCoordinator.withMutation(at: other) { _ in }
                throw SmokeFailure(message: "Synthetic gate failure")
            }
        }
        try ContentMutationCoordinator.withCleanupGate(at: storage) { _ in }
        try expect(ContentSnapshotLease.advisoryAcquisitions(in: storage).isEmpty,
                   "Admission scenario retained a lease")
        let first = scratch.appendingPathComponent("admission-capture-first")
        let second = scratch.appendingPathComponent("admission-capture-second")
        let alias = scratch.appendingPathComponent("admission-capture-alias")
        try FileManager.default.createDirectory(at: first, withIntermediateDirectories: false)
        try FileManager.default.createDirectory(at: second, withIntermediateDirectories: false)
        try FileManager.default.createSymbolicLink(at: alias, withDestinationURL: first)
        try ContentMutationCoordinator.withReaderAdmission(at: alias) { reader in
            try FileManager.default.removeItem(at: alias)
            try FileManager.default.createSymbolicLink(at: alias, withDestinationURL: second)
            let lease = try reader.acquireLease(generation: generation)
            try withExtendedLifetime(lease) {
                try expect(ContentSnapshotLease.advisoryAcquisitions(in: first) == [generation: 1],
                           "Reader handoff re-resolved its captured scope")
                try expect(ContentSnapshotLease.advisoryAcquisitions(in: second).isEmpty,
                           "Reader handoff published to the replacement alias target")
            }
        }
        try expect(ContentSnapshotLease.advisoryAcquisitions(in: first).isEmpty, "Captured-scope lease was not released")
        print("PASS admission/writer coexistence, cleanup-gate exclusion and captured scopes")
    }
}
