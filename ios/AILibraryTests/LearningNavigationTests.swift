import Foundation
import XCTest
@testable import AILibrary

final class LearningNavigationTests: XCTestCase {
    private let canonical = "https://pero3dev.github.io/ai-agent-library/glossary"

    func testCanonicalGlossaryRequiresAnIndexAndResolvesOnlyKnownFragments() throws {
        let ids: Set<String> = ["agent-ループagent-loop", "回転位置埋め込みrope"]
        for suffix in ["", "#"] {
            XCTAssertEqual(NativeLearningNavigation.glossaryDestination(for: try XCTUnwrap(URL(string: canonical + suffix)),
                                                                       termIDs: ids), .list)
        }
        for id in ids {
            var parts = try XCTUnwrap(URLComponents(string: canonical))
            parts.fragment = id
            XCTAssertEqual(NativeLearningNavigation.glossaryDestination(for: try XCTUnwrap(parts.url), termIDs: ids), .term(id))
            XCTAssertNil(NativeLearningNavigation.glossaryDestination(for: try XCTUnwrap(parts.url), termIDs: nil))
        }
        XCTAssertNil(NativeLearningNavigation.glossaryDestination(for: try XCTUnwrap(URL(string: canonical + "#unknown")), termIDs: ids))
    }

    func testOtherOriginsPathsQueriesAndCredentialsKeepTheBrowserFallback() throws {
        for value in [canonical + "?", canonical + "?q=agent", canonical + "/", canonical.replacingOccurrences(of: "/glossary", with: "/GLOSSARY.md"),
                      "https://pero3dev.github.io:443/ai-agent-library/glossary", "https://other.example/ai-agent-library/glossary",
                      "https://pero3dev.github.io.example/ai-agent-library/glossary", "http://pero3dev.github.io/ai-agent-library/glossary",
                      "https://user@pero3dev.github.io/ai-agent-library/glossary", "https://pero3dev.github.io/other/glossary",
                      "https://pero3dev.github.io/ai-agent-library/%67lossary"] {
            XCTAssertNil(NativeLearningNavigation.glossaryDestination(for: try XCTUnwrap(URL(string: value)), termIDs: ["agent"]), value)
        }
    }

    func testTypedTargetsPreserveTheArticleHeadingAndPermitOnlyExplicitHTTPS() throws {
        XCTAssertEqual(NativeLearningNavigation.destination(for: .article(articleID: "00-overview/learning-roadmap", headingID: "fのセキュリティへ進む前に")),
                       .article(ReaderRoute(articleID: "00-overview/learning-roadmap", heading: "fのセキュリティへ進む前に")))
        XCTAssertEqual(NativeLearningNavigation.destination(for: .chapter(chapterID: "01-concepts")), .chapter("01-concepts"))
        let url = try XCTUnwrap(URL(string: "https://example.com/reference#detail"))
        XCTAssertEqual(NativeLearningNavigation.destination(for: .external(url: url.absoluteString)), .external(url))
        for value in ["http://example.com", "javascript:alert(1)", "file:///tmp/index", "https://user:secret@example.com", "https:///missing-host"] {
            XCTAssertNil(NativeLearningNavigation.destination(for: .external(url: value)), value)
        }
    }

    func testGlossarySearchCoversEveryTermNameEnglishAndDefinitionWithAND() throws {
        let data = Data("""
        [{"id":"loop","name":"Agent ループ","english":"Agent Loop","summary":"観測から行動へ進む制御構造","links":[]},
         {"id":"memory","name":"メモリ","english":"Memory","summary":"Agent の状態を保持する","links":[]}]
        """.utf8)
        let terms = try JSONDecoder().decode([NativeLearningTerm].self, from: data)
        XCTAssertEqual(NativeLearningNavigation.terms(terms, matching: "　").map(\.id), ["loop", "memory"])
        XCTAssertEqual(NativeLearningNavigation.terms(terms, matching: "ＡＧＥＮＴ loop").map(\.id), ["loop"])
        XCTAssertEqual(NativeLearningNavigation.terms(terms, matching: "めもり 状態").map(\.id), ["memory"])
        XCTAssertTrue(NativeLearningNavigation.terms(terms, matching: "loop 状態").isEmpty)
        let chapter = try JSONDecoder().decode(NativeLearningChapter.self, from: Data("""
        {"id":"01-concepts","title":"01-concepts — 基礎概念","description":"基礎を学ぶ","article_ids":["01-concepts/agent-loop"]}
        """.utf8))
        XCTAssertEqual(NativeLearningNavigation.chapterTitle(chapter), "01 基礎概念")
    }
}
