import CryptoKit
import Foundation
import XCTest
@testable import AILibrary

final class LearningIndexTests: XCTestCase {
    private var directory: URL!
    private let articleID = "00-overview/learning-roadmap"
    private let sourceDigest = String(repeating: "a", count: 64)

    override func setUpWithError() throws {
        directory = URL(fileURLWithPath: NSTemporaryDirectory(), isDirectory: true)
            .appendingPathComponent("learning-index-tests-" + UUID().uuidString, isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    }

    override func tearDownWithError() throws { try FileManager.default.removeItem(at: directory) }

    private func manifest(files: [String: String] = [:], articles: [LibraryArticle]? = nil) -> ContentManifest {
        let article = LibraryArticle(id: articleID, title: "学習ロードマップ", summary: "順に学ぶ", category: "概要", level: "初級",
            last_updated: "2026-10-25", source_path: "docs/\(articleID).md", source_sha256: sourceDigest,
            document_path: "articles/roadmap.json", search_text: "本文", headings: [ArticleHeading(id: "intro", title: "導入", level: 2)], audio_id: nil)
        return ContentManifest(schema_version: 2, revision: "learning-test", articles: articles ?? [article], audio: [], files: files)
    }

    private func payload(target: [String: Any]? = nil) -> [String: Any] {
        let article: [String: Any] = target ?? ["type": "article", "article_id": articleID, "heading_id": "intro"]
        return ["schema_version": 1,
            "source_sha256": ["docs/\(articleID).md": sourceDigest, "docs/00-overview/README.md": sourceDigest, "GLOSSARY.md": sourceDigest],
            "article_tags": [articleID: ["ai-agent", "learning"]],
            "chapters": [["id": "00-overview", "title": "概要", "description": "最初に学ぶ", "article_ids": [articleID]]],
            "routes": Array("ABCDEFGH").map { ["id": String($0), "label": "初学者", "persona": "学び始める人",
                "steps": [["inlines": [["type": "text", "text": "まず "], ["type": "link", "text": "本文", "target": article]]]]] },
            "glossary": [["id": "エージェント", "name": "エージェント", "english": NSNull(), "summary": "目的に沿って動作する。",
                "links": [["label": "本文", "target": article], ["label": "章", "target": ["type": "chapter", "chapter_id": "00-overview"]],
                    ["label": "出典", "target": ["type": "external", "url": "https://example.com/guide#intro"]]]]]]
    }

    private func data(_ value: [String: Any]) throws -> Data { try JSONSerialization.data(withJSONObject: value, options: [.sortedKeys]) }
    private func decode(_ value: [String: Any]) throws -> NativeLearningIndex { try NativeLearningIndex.decode(data: data(value), manifest: manifest()) }
    private func hash(_ bytes: Data) -> String { SHA256.hash(data: bytes).map { String(format: "%02x", $0) }.joined() }

    private func fixture(includeSidecar: Bool = true) throws -> ContentSnapshot {
        let document = NativeDocument(schema_version: 1, article_id: articleID, source_sha256: sourceDigest, blocks: [
            NativeBlock(id: "heading", type: "heading", heading_id: "intro", level: 2, inlines: [NativeInline(type: "text", text: "導入")]),
            NativeBlock(id: "paragraph", type: "paragraph", inlines: [NativeInline(type: "text", text: "本文")])])
        let documentData = try JSONEncoder().encode(document)
        try FileManager.default.createDirectory(at: directory.appendingPathComponent("articles"), withIntermediateDirectories: true)
        try documentData.write(to: directory.appendingPathComponent("articles/roadmap.json"))
        var files = ["articles/roadmap.json": hash(documentData)]
        if includeSidecar {
            let bytes = try data(payload())
            try FileManager.default.createDirectory(at: directory.appendingPathComponent("assets/learning"), withIntermediateDirectories: true)
            try bytes.write(to: directory.appendingPathComponent(NativeLearningIndex.path))
            files[NativeLearningIndex.path] = hash(bytes)
        }
        try JSONEncoder().encode(manifest(files: files)).write(to: directory.appendingPathComponent("manifest.json"))
        return try ContentValidator.validate(root: directory)
    }

    func testSmallIndexPreservesOrderAndTypedNavigation() throws {
        let value = try decode(payload())
        XCTAssertEqual(value.chapters.first?.article_ids, [articleID])
        XCTAssertEqual(value.article_tags[articleID], ["ai-agent", "learning"])
        XCTAssertEqual(value.routes.map(\.id), Array("ABCDEFGH").map(String.init))
        XCTAssertEqual(value.glossary.first?.links.first?.target, .article(articleID: articleID, headingID: "intro"))
        XCTAssertEqual(value.glossary.first?.links[1].target, .chapter(chapterID: "00-overview"))
        XCTAssertEqual(value.glossary.first?.links[2].target, .external(url: "https://example.com/guide#intro"))
        XCTAssertNil(value.glossary.first?.english)
    }

    func testValidatedSnapshotLoadDoesNotWriteOrChangeTheSnapshot() throws {
        let snapshot = try fixture()
        let originalFiles = snapshot.manifest.files
        let manifestData = try Data(contentsOf: directory.appendingPathComponent("manifest.json"))
        let before = originalFiles
        XCTAssertNotNil(try NativeLearningIndex.load(from: snapshot))
        XCTAssertEqual(snapshot.root, directory)
        XCTAssertEqual(snapshot.manifest.files, before)
        XCTAssertEqual(try Data(contentsOf: directory.appendingPathComponent("manifest.json")), manifestData)
        for (path, digest) in originalFiles { XCTAssertEqual(try ContentValidator.sha256(at: directory.appendingPathComponent(path)), digest) }
        XCTAssertEqual(try ContentValidator.validate(root: directory).manifest.files, before)
    }

    func testMissingOptionalSidecarKeepsOldSnapshotReadable() throws {
        let snapshot = try fixture(includeSidecar: false)
        XCTAssertNil(try NativeLearningIndex.load(from: snapshot))
        XCTAssertEqual(try snapshot.document(for: snapshot.manifest.articles[0]).blocks.count, 2)
    }

    func testExplicitLegacyPackagesHaveNoSidecar() throws {
        guard let roots = ProcessInfo.processInfo.environment["AILIBRARY_LEARNING_LEGACY_ROOTS"] else {
            throw XCTSkip("旧3記事・fixture4記事の実packageはCLI検証でパスを指定する。")
        }
        let paths = roots.split(separator: ":").map(String.init)
        XCTAssertEqual(paths.count, 2)
        for path in paths {
            let snapshot = try ContentValidator.validate(root: URL(fileURLWithPath: path, isDirectory: true))
            XCTAssertNil(try NativeLearningIndex.load(from: snapshot))
        }
    }

    func testBundledOptionalIndexMatchesItsManifestWhenPresent() throws {
        let roots = ["Content", "TestContent"].compactMap { Bundle.main.url(forResource: $0, withExtension: nil) }
        guard !roots.isEmpty else { throw XCTSkip("App-hosted実行では同梱packageを検証する。CLIには同梱resourceがない。") }
        for root in roots {
            let snapshot = try ContentValidator.validate(root: root)
            if snapshot.manifest.files[NativeLearningIndex.path] == nil {
                XCTAssertNil(try NativeLearningIndex.load(from: snapshot))
            } else {
                let index = try XCTUnwrap(NativeLearningIndex.load(from: snapshot))
                XCTAssertEqual(Set(index.article_tags.keys), Set(snapshot.manifest.articles.map(\.id)))
                XCTAssertEqual(Set(index.chapters.flatMap(\.article_ids)), Set(snapshot.manifest.articles.map(\.id)))
            }
        }
    }

    func testExplicitGeneratedIndexMatchesItsManifestAndDoesNotChange() throws {
        guard let path = ProcessInfo.processInfo.environment["AILIBRARY_LEARNING_CONTENT_ROOT"] else {
            throw XCTSkip("私有生成packageはCLI検証でパスを指定する。")
        }
        let root = URL(fileURLWithPath: path, isDirectory: true)
        let snapshot = try ContentValidator.validate(root: root)
        let before = try Data(contentsOf: root.appendingPathComponent("manifest.json"))
        let index = try XCTUnwrap(NativeLearningIndex.load(from: snapshot))
        XCTAssertEqual(Set(index.article_tags.keys), Set(snapshot.manifest.articles.map(\.id)))
        XCTAssertEqual(Set(index.chapters.flatMap(\.article_ids)), Set(snapshot.manifest.articles.map(\.id)))
        XCTAssertEqual(index.chapters.count, Set(snapshot.manifest.articles.map { String($0.id.split(separator: "/")[0]) }).count)
        XCTAssertEqual(index.routes.count, 8)
        XCTAssertFalse(index.glossary.isEmpty)
        XCTAssertEqual(try Data(contentsOf: root.appendingPathComponent("manifest.json")), before)
        for (path, digest) in snapshot.manifest.files { XCTAssertEqual(try ContentValidator.sha256(at: root.appendingPathComponent(path)), digest) }
        XCTAssertEqual(try ContentValidator.validate(root: root).manifest.files, snapshot.manifest.files)
    }

    func testHashListedMalformedIndexLeavesArticleSnapshotReadable() throws {
        let original = try fixture()
        var value = payload(); value["schema_version"] = 2
        let bytes = try data(value)
        try bytes.write(to: directory.appendingPathComponent(NativeLearningIndex.path))
        var files = original.manifest.files; files[NativeLearningIndex.path] = hash(bytes)
        try JSONEncoder().encode(manifest(files: files)).write(to: directory.appendingPathComponent("manifest.json"))
        let snapshot = try ContentValidator.validate(root: directory)
        XCTAssertThrowsError(try NativeLearningIndex.load(from: snapshot))
        XCTAssertEqual(try snapshot.document(for: snapshot.manifest.articles[0]).blocks.count, 2)
    }

    func testUnknownSchemaWrongTypesAndExtraFieldsAreRejected() throws {
        for invalid: Any in [2, true, "1", NSNull()] {
            var value = payload(); value["schema_version"] = invalid
            XCTAssertThrowsError(try decode(value))
        }
        for key in ["source_sha256", "article_tags", "chapters", "routes", "glossary"] {
            var value = payload(); value[key] = "wrong type"
            XCTAssertThrowsError(try decode(value))
        }
        var value = payload(); value["future"] = "not schema 1"
        XCTAssertThrowsError(try decode(value))
        value = payload(); value["glossary"] = [["id": "term", "name": "term", "summary": "summary", "links": []]]
        XCTAssertThrowsError(try decode(value), "english must be a string or explicit null")
    }

    func testInvalidUTF8ExcessiveNestingAndOversizedDataAreRejected() throws {
        XCTAssertThrowsError(try NativeLearningIndex.decode(data: Data([0xff, 0xfe]), manifest: manifest()))
        XCTAssertThrowsError(try NativeLearningIndex.decode(data: Data(), manifest: manifest()))
        XCTAssertThrowsError(try NativeLearningIndex.decode(data: Data(repeating: 32, count: NativeLearningIndex.maximumBytes + 1), manifest: manifest()))
        let nested = String(repeating: "[", count: 1000) + "0" + String(repeating: "]", count: 1000)
        XCTAssertThrowsError(try NativeLearningIndex.decode(data: Data(nested.utf8), manifest: manifest()))
        var value = payload()
        value["glossary"] = [["id": "term", "name": "term", "english": NSNull(), "summary": String(repeating: "あ", count: 5462), "links": []]]
        XCTAssertThrowsError(try decode(value), "UTF-8 byte count must bound multi-byte text")
    }

    func testDuplicateJSONKeysIncludingEscapedAliasesAreRejected() throws {
        let original = String(decoding: try data(payload()), as: UTF8.self)
        for duplicate in ["\"schema_version\":1,\"schema_version\":1", "\"schema_version\":1,\"\\u0073chema_version\":1"] {
            let bytes = Data(original.replacingOccurrences(of: "\"schema_version\":1", with: duplicate).utf8)
            XCTAssertThrowsError(try NativeLearningIndex.decode(data: bytes, manifest: manifest()))
        }
        var value = payload()
        var terms = value["glossary"] as! [[String: Any]]
        terms[0]["summary"] = "Text containing { braces }, [brackets], \\\"escaped quotes\\\", and a \\ path."
        value["glossary"] = terms
        XCTAssertNoThrow(try decode(value), "The nesting scan must ignore punctuation inside strings")
    }

    func testMaximumStepInlineTagLinkAndTermCountsAreAccepted() throws {
        var value = payload()
        value["article_tags"] = [articleID: (0..<64).map { "tag-\($0)" }]
        var routes = value["routes"] as! [[String: Any]]
        routes[0]["steps"] = Array(repeating: ["inlines": Array(repeating: ["type": "text", "text": "x"], count: 64)], count: 128)
        value["routes"] = routes
        var term = (value["glossary"] as! [[String: Any]])[0]
        term["summary"] = String(repeating: "a", count: NativeLearningIndex.maximumTextBytes)
        let link = (term["links"] as! [[String: Any]])[0]
        term["links"] = Array(repeating: link, count: 256)
        var terms: [[String: Any]] = [term]
        term["links"] = []
        term["summary"] = "定義"
        terms += (1..<2000).map { number in var entry = term; entry["id"] = "term-\(number)"; return entry }
        value["glossary"] = terms
        XCTAssertNoThrow(try decode(value))
    }

    func testArticleAndChapterCoverageDuplicatesAndOrderAreRejected() throws {
        let invalidChapters: [[[String: Any]]] = [[],
            [["id": "00-overview", "title": "章", "description": "説明", "article_ids": []]],
            [["id": "00-overview", "title": "章", "description": "説明", "article_ids": [articleID, articleID]]],
            [["id": "00-overview", "title": "章", "description": "説明", "article_ids": ["00-overview/missing"]]],
            [["id": "01-other", "title": "章", "description": "説明", "article_ids": [articleID]]]]
        for chapters in invalidChapters {
            var value = payload(); value["chapters"] = chapters
            XCTAssertThrowsError(try decode(value))
        }
        let article = manifest().articles[0]
        XCTAssertThrowsError(try NativeLearningIndex.decode(data: data(payload()), manifest: manifest(articles: [article, article])))
        var value = payload(); value["article_tags"] = [String: [String]]()
        XCTAssertThrowsError(try decode(value))
        value = payload(); value["article_tags"] = [articleID: [], "00-overview/missing": []]
        XCTAssertThrowsError(try decode(value))
    }

    func testTagGrammarDuplicatesAndBoundsAreRejected() throws {
        let invalid = [["AI"], ["with space"], ["-tag"], ["tag-"], ["tag--tag"], ["日本語"], ["a", "a"],
            [String(repeating: "a", count: 129)], (0...64).map { "tag-\($0)" }]
        for tags in invalid {
            var value = payload(); value["article_tags"] = [articleID: tags]
            XCTAssertThrowsError(try decode(value), tags.joined(separator: ","))
        }
        var value = payload(); value["article_tags"] = [articleID: []]
        XCTAssertNoThrow(try decode(value))
    }

    func testSourcesRejectUnsafePathsMissingCoverageAndMismatchedDigests() throws {
        for path in ["../GLOSSARY.md", "/GLOSSARY.md", "docs/00-overview/../README.md", "docs%2fextra.md"] {
            var value = payload(); var sources = value["source_sha256"] as! [String: String]
            sources[path] = sourceDigest; value["source_sha256"] = sources
            XCTAssertThrowsError(try decode(value))
        }
        for path in ["docs/\(articleID).md", "docs/00-overview/README.md", "GLOSSARY.md"] {
            var value = payload(); var sources = value["source_sha256"] as! [String: String]
            sources.removeValue(forKey: path); value["source_sha256"] = sources
            XCTAssertThrowsError(try decode(value))
        }
        for digest in [String(repeating: "b", count: 64), String(repeating: "A", count: 64), "not a digest"] {
            var value = payload(); var sources = value["source_sha256"] as! [String: String]
            sources["docs/\(articleID).md"] = digest; value["source_sha256"] = sources
            XCTAssertThrowsError(try decode(value))
        }
    }

    func testUnknownUnionWrongTypesAndDanglingDestinationsAreRejected() throws {
        let targets: [[String: Any]] = [["type": "future"], ["type": true],
            ["type": "article", "article_id": "00-overview/missing"],
            ["type": "article", "article_id": articleID, "heading_id": "missing"],
            ["type": "article", "article_id": articleID, "heading_id": String(repeating: "a", count: 257)],
            ["type": "article", "article_id": articleID, "heading_id": NSNull()],
            ["type": "article", "article_id": articleID, "chapter_id": "00-overview"],
            ["type": "chapter", "chapter_id": "01-missing"], ["type": "chapter", "chapter_id": 0]]
        for target in targets { XCTAssertThrowsError(try decode(payload(target: target))) }
        var value = payload(); var routes = value["routes"] as! [[String: Any]]
        routes[0]["steps"] = [["inlines": [["type": "image", "text": "unsupported"]]]]; value["routes"] = routes
        XCTAssertThrowsError(try decode(value))
    }

    func testExternalLinksRequireHTTPSHostAndNoCredentials() throws {
        for url in ["http://example.com", "file:///etc/passwd", "javascript:alert(1)", "https:///", "https://user@example.com", "https://:pass@example.com"] {
            XCTAssertThrowsError(try decode(payload(target: ["type": "external", "url": url])), url)
        }
        XCTAssertNoThrow(try decode(payload(target: ["type": "external", "url": "https://example.com/a?q=b#c"])))
    }

    func testRouteOrderStepAndInlineBoundsAreRejected() throws {
        let base = payload()["routes"] as! [[String: Any]]
        for routes in [Array(base.reversed()), Array(base.dropLast()), base + [base[0]]] {
            var value = payload(); value["routes"] = routes
            XCTAssertThrowsError(try decode(value))
        }
        for steps in [[], Array(repeating: ["inlines": [["type": "text", "text": "x"]]], count: 129),
                      [["inlines": []]], [["inlines": Array(repeating: ["type": "text", "text": "x"], count: 65)]]] as [[[String: Any]]] {
            var value = payload(); var routes = base; routes[0]["steps"] = steps; value["routes"] = routes
            XCTAssertThrowsError(try decode(value))
        }
    }

    func testEmptyAndWhitespaceOnlyRouteStepsAreRejected() throws {
        for texts in [[""], [" "], [" \n\t "], ["\r\n"], ["", " \n", "\t"]] {
            var value = payload(); var routes = value["routes"] as! [[String: Any]]
            routes[0]["steps"] = [["inlines": texts.map { ["type": "text", "text": $0] }]]
            value["routes"] = routes
            XCTAssertThrowsError(try decode(value))
        }
    }

    func testMeaningfulRouteStepsPreserveInterveningWhitespace() throws {
        let spacing = " \n\t "
        var value = payload(); var routes = value["routes"] as! [[String: Any]]
        routes[0]["steps"] = [["inlines": [["type": "text", "text": "まず"], ["type": "text", "text": spacing],
            ["type": "text", "text": "学ぶ"]]]]
        value["routes"] = routes
        XCTAssertEqual(try decode(value).routes[0].steps[0].inlines, [.text("まず"), .text(spacing), .text("学ぶ")])

        routes[0]["steps"] = [["inlines": [["type": "link", "text": "本文", "target": ["type": "article", "article_id": articleID]],
            ["type": "text", "text": spacing], ["type": "link", "text": "章", "target": ["type": "chapter", "chapter_id": "00-overview"]]]]]
        value["routes"] = routes
        XCTAssertEqual(try decode(value).routes[0].steps[0].inlines, [.link(text: "本文", target: .article(articleID: articleID, headingID: nil)),
            .text(spacing), .link(text: "章", target: .chapter(chapterID: "00-overview"))])
    }

    func testRoadmapArticleIsRequiredEvenWhenAllRemainingReferencesAreValid() throws {
        let other = LibraryArticle(id: "00-overview/other", title: "別の記事", summary: "説明", category: "概要", level: "初級",
            last_updated: "2026-10-25", source_path: "docs/00-overview/other.md", source_sha256: sourceDigest,
            document_path: "articles/other.json", search_text: "本文", headings: [ArticleHeading(id: "intro", title: "導入", level: 2)], audio_id: nil)
        // References already point to a valid retained article, so removing the
        // roadmap cannot be rejected merely as a dangling link or missing coverage.
        var value = payload(target: ["type": "article", "article_id": other.id, "heading_id": "intro"])
        var sources = value["source_sha256"] as! [String: String]
        sources[other.source_path] = other.source_sha256
        value["source_sha256"] = sources
        var tags = value["article_tags"] as! [String: [String]]
        tags[other.id] = []; value["article_tags"] = tags
        var chapters = value["chapters"] as! [[String: Any]]
        chapters[0]["article_ids"] = [articleID, other.id]; value["chapters"] = chapters
        XCTAssertNoThrow(try NativeLearningIndex.decode(data: data(value), manifest: manifest(articles: [manifest().articles[0], other])))

        sources.removeValue(forKey: "docs/\(articleID).md"); value["source_sha256"] = sources
        tags.removeValue(forKey: articleID); value["article_tags"] = tags
        chapters[0]["article_ids"] = [other.id]; value["chapters"] = chapters
        XCTAssertThrowsError(try NativeLearningIndex.decode(data: data(value), manifest: manifest(articles: [other])))
    }

    func testGlossaryIdentityAndCountBoundsAreRejected() throws {
        let term = (payload()["glossary"] as! [[String: Any]])[0]
        let manyTerms = (0...2000).map { number -> [String: Any] in
            var entry = term; entry["id"] = "term-\(number)"; return entry
        }
        for terms in [[], [term, term], manyTerms] {
            var value = payload(); value["glossary"] = terms
            XCTAssertThrowsError(try decode(value))
        }
        var oversized = term
        oversized["links"] = Array(repeating: ["label": "本文", "target": ["type": "article", "article_id": articleID]], count: 257)
        var value = payload(); value["glossary"] = [oversized]
        XCTAssertThrowsError(try decode(value))
    }

    func testLoadRejectsUnlistedMissingTamperedAndOversizedSidecars() throws {
        let snapshot = try fixture()
        var files = snapshot.manifest.files; files.removeValue(forKey: NativeLearningIndex.path)
        XCTAssertThrowsError(try NativeLearningIndex.load(from: ContentSnapshot(root: directory, manifest: manifest(files: files))))
        let url = directory.appendingPathComponent(NativeLearningIndex.path)
        try Data("{}".utf8).write(to: url)
        XCTAssertThrowsError(try NativeLearningIndex.load(from: snapshot))
        try Data(repeating: 32, count: NativeLearningIndex.maximumBytes + 1).write(to: url)
        XCTAssertThrowsError(try NativeLearningIndex.load(from: snapshot))
        try FileManager.default.removeItem(at: url)
        XCTAssertThrowsError(try NativeLearningIndex.load(from: snapshot))
    }

    func testLoadRejectsSymlinkAtRootDirectoryOrIndex() throws {
        let snapshot = try fixture()
        let rootAlias = directory.appendingPathComponent("root-alias")
        try FileManager.default.createSymbolicLink(at: rootAlias, withDestinationURL: directory)
        XCTAssertThrowsError(try NativeLearningIndex.load(from: ContentSnapshot(root: rootAlias, manifest: snapshot.manifest)))
        let index = directory.appendingPathComponent(NativeLearningIndex.path)
        let saved = directory.appendingPathComponent("saved-index.json")
        try FileManager.default.moveItem(at: index, to: saved)
        try FileManager.default.createSymbolicLink(at: index, withDestinationURL: saved)
        XCTAssertThrowsError(try NativeLearningIndex.load(from: snapshot))
        try FileManager.default.removeItem(at: index)
        let learning = directory.appendingPathComponent("assets/learning")
        try FileManager.default.removeItem(at: learning)
        try FileManager.default.createSymbolicLink(at: learning, withDestinationURL: directory)
        XCTAssertThrowsError(try NativeLearningIndex.load(from: snapshot))
    }
}
