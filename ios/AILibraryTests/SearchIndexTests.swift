import Foundation
import XCTest
@testable import AILibrary

final class SearchIndexTests: XCTestCase {
    private func article(id: String = "one", title: String = "Agent の設計", summary: String = "状態を保つ",
                         category: String = "concepts", level: String = "basic",
                         text: String = "エージェント Tools API café ガイド") -> LibraryArticle {
        LibraryArticle(id: id, title: title, summary: summary, category: category, level: level,
                       last_updated: "2026-10-25", source_path: "docs/\(id).md", source_sha256: String(repeating: "a", count: 64),
                       document_path: "articles/\(id).json", search_text: text, headings: [], audio_id: nil)
    }

    func testIndexedResultsEqualExistingSearchForWidthKanaAccentsAndANDTerms() {
        let articles = [article(id: "second"), article(id: "first", text: "別の本文 softmax"),
                        article(id: "third", title: "CAFÉ 入門", summary: "がいど", text: "ＡＰＩ エージェント")]
        let index = LibrarySearchIndex(articles: articles)
        for query in ["", " \t\n　", "ＡＧＥＮＴ", "api", "ＴＯＯＬＳ ＡＰＩ", "api API ＡＰＩ",
                      "ｴｰｼﾞｪﾝﾄ", "えーじぇんと", "ガイド", "がいど", "CAFÉ", "cafe\u{301}",
                      "状態 concepts", "softmax", "Tools 不在", "__no_match_128__"] {
            let expected = articles.filter { LibrarySearch.matches($0, query: query) }.map(\.id)
            XCTAssertEqual(LibraryArticleFilter(query: query).articles(in: articles, bookmarks: [], searchIndex: index).map(\.id),
                           expected, query)
        }
    }

    func testSameIDFromAnotherRevisionUsesTheCurrentSearchableFields() {
        let old = article(title: "古い題名", summary: "古い要約", category: "old", text: "以前の本文")
        let current = article(title: "改訂した題名", summary: "新版の要約", category: "new", text: "現在の本文")
        let index = LibrarySearchIndex(articles: [old])
        for query in ["改訂した題名", "新版の要約", "new", "現在の本文"] {
            XCTAssertEqual(LibraryArticleFilter(query: query).articles(in: [current], bookmarks: [], searchIndex: index).map(\.id), ["one"])
        }
        for query in ["古い題名", "古い要約", "old", "以前の本文"] {
            XCTAssertTrue(LibraryArticleFilter(query: query).articles(in: [current], bookmarks: [], searchIndex: index).isEmpty)
        }
    }

    func testPartialAndDuplicateIDIndexesKeepEveryCurrentArticleResult() {
        let old = article(id: "shared", text: "old-token")
        let updated = article(id: "shared", text: "new-token")
        let missing = article(id: "missing", text: "new-token")
        let articles = [missing, old, updated]
        for indexed in [[LibraryArticle](), [old], [old, updated], [updated, old]] {
            let index = LibrarySearchIndex(articles: indexed)
            for query in ["old-token", "new-token", "Agent", "unknown"] {
                let expected = articles.filter { LibrarySearch.matches($0, query: query) }
                XCTAssertEqual(LibraryArticleFilter(query: query).articles(in: articles, bookmarks: [], searchIndex: index), expected)
            }
        }
    }

    func testIndexPreservesCallerOrderAndCombinesChapterLevelTagsAndBookmarks() {
        let articles = [article(id: "z"), article(id: "a"), article(id: "other-tag"),
                        article(id: "other-level", level: "advanced"), article(id: "other-chapter", category: "foundations"),
                        article(id: "not-bookmarked"), article(id: "other-text", text: "tools のみ")]
        let index = LibrarySearchIndex(articles: Array(articles.reversed()))
        let bookmarks: Set<String> = ["z", "a", "other-tag", "other-level", "other-chapter", "other-text"]
        let tags = Dictionary(uniqueKeysWithValues: articles.map { ($0.id, [$0.id == "other-tag" ? "other" : "runtime"]) })
        let filter = LibraryArticleFilter(query: "ＴＯＯＬＳ api", category: "concepts", level: "basic", bookmarksOnly: true, tag: "runtime")
        XCTAssertEqual(filter.articles(in: articles, bookmarks: bookmarks, articleTags: tags, searchIndex: index).map(\.id), ["z", "a"])
        XCTAssertEqual(filter.articles(in: [articles[1], articles[0]], bookmarks: bookmarks, articleTags: tags, searchIndex: index).map(\.id), ["a", "z"])
        XCTAssertEqual(filter.articles(in: articles, bookmarks: bookmarks, articleTags: tags, searchIndex: index),
                       filter.articles(in: articles, bookmarks: bookmarks, articleTags: tags))
    }

    func testEmptyQueriesKeepTheExactScopeEvenWithAnUnrelatedIndex() {
        let articles = [article(id: "z"), article(id: "a", text: "別の本文")]
        let index = LibrarySearchIndex(articles: [article(id: "unrelated")])
        for query in ["", " \t\n　"] {
            XCTAssertEqual(LibraryArticleFilter(query: query).articles(in: articles, bookmarks: [], searchIndex: index), articles)
        }
        XCTAssertTrue(LibraryArticleFilter(query: "API").articles(in: [], bookmarks: [], searchIndex: index).isEmpty)
    }

    func testIndexRemainsAValueWhenSourceArrayIsReplaced() {
        var articles = [article(text: "original")]
        let index = LibrarySearchIndex(articles: articles)
        articles[0] = article(text: "replacement")
        XCTAssertTrue(index.matches(article(text: "original"), terms: LibrarySearch.normalizedTerms("original")))
        XCTAssertFalse(index.matches(articles[0], terms: LibrarySearch.normalizedTerms("original")))
        XCTAssertTrue(index.matches(articles[0], terms: LibrarySearch.normalizedTerms("replacement")))
    }

    func testIndexCanBeBuiltOffActorAndUsedForAnOrderedScope() async {
        let articles = [article(id: "second"), article(id: "first", text: "別の本文")]
        let index = await Task.detached { LibrarySearchIndex(articles: articles) }.value
        XCTAssertEqual(LibraryArticleFilter(query: "tools API").articles(in: articles, bookmarks: [], searchIndex: index).map(\.id), ["second"])
    }

    @MainActor
    func testStoreSearchRemainsCorrectAcrossImportFailureAndBundledSelection() async throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent("search-store-" + UUID().uuidString)
        let suite = "search-store-" + UUID().uuidString
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer {
            defaults.removePersistentDomain(forName: suite)
            try? FileManager.default.removeItem(at: directory)
        }
        func package(_ name: String, token: String) throws -> URL {
            let root = directory.appendingPathComponent(name)
            try FileManager.default.createDirectory(at: root.appendingPathComponent("articles"), withIntermediateDirectories: true)
            let item = article(text: token)
            let document = NativeDocument(schema_version: 1, article_id: item.id, source_sha256: item.source_sha256,
                blocks: [NativeBlock(id: "p", type: "paragraph", inlines: [NativeInline(type: "text", text: token)])])
            let path = root.appendingPathComponent("articles/one.json")
            try JSONEncoder().encode(document).write(to: path)
            let manifest = ContentManifest(schema_version: 2, revision: "same-opaque-revision",
                articles: [item], audio: [], files: ["articles/one.json": try ContentValidator.sha256(at: path)])
            try JSONEncoder().encode(manifest).write(to: root.appendingPathComponent("manifest.json"))
            return root
        }
        let bundled = try package("bundled", token: "old-token")
        let update = try package("updated", token: "new-token")
        let reading = ReadingStore(defaults: defaults)
        reading.toggleBookmark("one")
        reading.record(articleID: "one", heading: nil, fraction: 0.4)
        let bytes = defaults.data(forKey: "library.reading.v1")
        let store = LibraryStore(reading: reading, bundledRoot: bundled, storageRoot: directory.appendingPathComponent("storage"))
        XCTAssertNil(store.searchIndex)
        await store.load()
        func results(_ query: String) -> [String] {
            LibraryArticleFilter(query: query).articles(in: store.listedArticles, bookmarks: [], searchIndex: store.searchIndex).map(\.id)
        }
        XCTAssertNotNil(store.searchIndex)
        XCTAssertEqual(results("old-token"), ["one"])
        await store.install(from: directory.appendingPathComponent("missing"))
        XCTAssertEqual(results("old-token"), ["one"])
        await store.install(from: update)
        XCTAssertNotNil(store.searchIndex)
        XCTAssertEqual(results("new-token"), ["one"])
        XCTAssertTrue(results("old-token").isEmpty)
        XCTAssertNil(store.learningIndex)
        XCTAssertNil(store.learningError)
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), bytes)
        let accepted = await store.activateBundledContent()
        XCTAssertTrue(accepted)
        XCTAssertEqual(results("old-token"), ["one"])
        XCTAssertTrue(results("new-token").isEmpty)
        await store.retryLoad()
        XCTAssertEqual(results("old-token"), ["one"])
        XCTAssertEqual(defaults.data(forKey: "library.reading.v1"), bytes)
    }
}
