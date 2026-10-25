import XCTest

/// Full-catalog candidate coverage for chapters 03 and 08, alongside the baseline's 01 and 11.
/// CI passes the independently counted published total to the runner, never to app routing.
final class PublishedReaderUITests: NativeReaderUITestCase {
    private var expectedPublishedCount = 0

    override func setUpWithError() throws {
        guard let raw = ProcessInfo.processInfo.environment["AILIBRARY_EXPECTED_PUBLISHED_COUNT"],
              let count = Int(raw), count > 3 else {
            throw NSError(domain: "PublishedReaderUITests", code: 1, userInfo: [NSLocalizedDescriptionKey:
                "The full-catalog test runner requires AILIBRARY_EXPECTED_PUBLISHED_COUNT greater than three."])
        }
        expectedPublishedCount = count
        try super.setUpWithError()
        let countLabel = app.staticTexts["library-article-count"]
        XCTAssertTrue(countLabel.waitForExistence(timeout: 45))
        XCTAssertEqual(countLabel.label, "全\(expectedPublishedCount)記事",
                       "The actual app catalog must match the separately audited published bundle")
    }

    func testChapter03LargeDiagramCanExpandAndShowSource() throws {
        // This phrase reaches the real large diagram without traversing the preceding long table.
        open("モデル選定ガイド", articleID: "03-implementation/model-selection", query: "データを外部 API に出せるか")
        let reader = app.scrollViews["native-reader"]
        let expand = app.buttons["図を拡大"].firstMatch
        for _ in 0..<5 where !isHittableOnScreen(expand, inside: reader) { reader.swipeUp(velocity: .slow) }
        requireHittable(expand)
        expand.tap()
        let detail = app.scrollViews["native-image-detail"]
        XCTAssertTrue(detail.waitForExistence(timeout: 10))
        requireHittable(detail.images.firstMatch)
        app.buttons["拡大"].tap()
        XCTAssertTrue(app.staticTexts["倍率 150 パーセント"].waitForExistence(timeout: 5))
        app.buttons["縮小"].tap()
        XCTAssertTrue(app.staticTexts["倍率 100 パーセント"].waitForExistence(timeout: 5))
        detail.swipeUp(velocity: .slow)
        capture("Published-03-large-diagram")
        app.navigationBars["図・数式を拡大"].buttons["閉じる"].tap()
        let closed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: detail)
        XCTAssertEqual(XCTWaiter.wait(for: [closed], timeout: 10), .completed)

        let sourceToggle = app.buttons["図のテキスト表現"].firstMatch
        for _ in 0..<5 where !isHittableOnScreen(sourceToggle, inside: reader) { reader.swipeUp(velocity: .slow) }
        requireHittable(sourceToggle)
        sourceToggle.tap()
        let source = app.staticTexts.matching(NSPredicate(format: "identifier BEGINSWITH %@", "native-figure-source-text-")).firstMatch
        XCTAssertTrue(source.waitForExistence(timeout: 10))
        XCTAssertTrue(source.label.contains("flowchart TD"))
        XCTAssertTrue(source.label.contains("データを外部 API に出せるか"))
        capture("Published-03-diagram-source")
    }

    func testChapter03LongArticleContentsBookmarkAndResume() throws {
        open("OpenAI(GPT 系)特化プロンプティングガイド", articleID: "03-implementation/openai-prompting")
        goToContents("世代交代で見直すこと", headingID: "世代交代で見直すこと")
        app.buttons["しおりを追加"].tap()
        XCTAssertTrue(app.buttons["しおりを削除"].waitForExistence(timeout: 5))
        capture("Published-03-long-article-deep-contents")
        returnToLibrary()
        app.terminate()
        app.launch()
        let resume = element("library-resume")
        XCTAssertTrue(resume.waitForExistence(timeout: 45))
        resume.tap()
        requireNativeBody()
        XCTAssertTrue(app.buttons["しおりを削除"].waitForExistence(timeout: 10))
        requireHittable(app.staticTexts["native-heading-世代交代で見直すこと"],
                        inside: app.scrollViews["native-reader"], fullyVisible: true)
        capture("Published-03-long-article-resume")
    }

    func testChapter08LargestTableReachesFinalRowAndColumn() throws {
        open("主要コーディングエージェント比較", articleID: "08-coding-agents/coding-agents-comparison")
        goToContents("提供形態マトリクス", headingID: "提供形態マトリクス")
        let reader = app.scrollViews["native-reader"]
        let table = app.scrollViews.matching(NSPredicate(format: "identifier BEGINSWITH %@", "native-table-")).firstMatch
        XCTAssertTrue(table.waitForExistence(timeout: 10))
        XCTAssertTrue(table.label.contains("データ14行、9列"))
        let blockID = String(table.identifier.dropFirst("native-table-".count))
        let lastLeft = element("native-table-cell-\(blockID)-14-1")
        for _ in 0..<12 {
            if isHittableOnScreen(lastLeft, inside: reader, fullyVisible: true) { break }
            reader.swipeUp(velocity: .slow)
        }
        requireHittable(lastLeft)
        XCTAssertTrue(lastLeft.label.contains("opencode"))

        // Drag within the visible final row, so the nested horizontal table owns the gesture.
        let visibleRow = lastLeft.frame.intersection(reader.frame).intersection(app.frame)
        XCTAssertFalse(visibleRow.isNull)
        let origin = app.coordinate(withNormalizedOffset: .zero)
        let start = origin.withOffset(CGVector(dx: reader.frame.maxX - 24, dy: visibleRow.midY))
        let end = origin.withOffset(CGVector(dx: reader.frame.minX + 24, dy: visibleRow.midY))
        let lastRight = element("native-table-cell-\(blockID)-14-9")
        for _ in 0..<12 {
            if isHittableOnScreen(lastRight, inside: reader, fullyVisible: true) { break }
            start.press(forDuration: 0.05, thenDragTo: end)
        }
        XCTAssertTrue(hasVisibleFrame(lastRight, inside: reader, fullyVisible: true))
        requireHittable(lastRight)
        XCTAssertEqual(lastRight.label, "○")
        capture("Published-08-table-final-row-column")
    }

    private func openLearningGuide() {
        let guide = app.buttons["library-learning-guide"]
        for _ in 0..<8 where !isHittableOnScreen(guide) { app.swipeDown(velocity: .slow) }
        requireHittable(guide)
        guide.tap()
        XCTAssertTrue(app.navigationBars["学習ガイド"].waitForExistence(timeout: 10))
    }

    func testLearningTagSearchCombinesWithArticleSearchAndClearsZeroResults() throws {
        let tags = app.buttons["library-tag-filter"]
        requireHittable(tags)
        tags.tap()
        let tagSearch = app.searchFields["タグを検索"]
        XCTAssertTrue(tagSearch.waitForExistence(timeout: 10))
        tagSearch.tap()
        tagSearch.typeText("agent-loop\n")
        let tag = app.buttons["learning-tag-agent-loop"]
        requireHittable(tag)
        tag.tap()
        let summary = app.staticTexts["library-filter-summary"]
        XCTAssertTrue(summary.waitForExistence(timeout: 10))
        XCTAssertTrue(summary.label.contains("タグ: agent-loop"))
        XCTAssertTrue(element("library-article-01-concepts/agent-loop").waitForExistence(timeout: 10))

        let search = app.searchFields["記事の本文を検索"]
        for _ in 0..<8 where !isHittableOnScreen(search) { app.swipeDown(velocity: .slow) }
        requireHittable(search)
        search.tap()
        search.typeText("ネイティブ検証未一致872351\n")
        XCTAssertTrue(app.staticTexts["記事が見つかりません"].waitForExistence(timeout: 10))
        let clear = app.buttons["library-clear-empty-filters"]
        requireHittable(clear)
        clear.tap()
        XCTAssertFalse(summary.exists)
        let count = app.staticTexts["library-article-count"]
        XCTAssertTrue(count.waitForExistence(timeout: 10))
        XCTAssertEqual(count.label, "全\(expectedPublishedCount)記事")
        capture("Learning-tag-zero-results-cleared")
    }

    func testLearningRouteShowsItsInstructionChapterOrderAndArticle() throws {
        openLearningGuide()
        app.buttons["learning-route-A"].tap()
        XCTAssertTrue(app.navigationBars["学習ルート A"].waitForExistence(timeout: 10))
        let instruction = app.staticTexts["learning-route-A-instruction-1"]
        XCTAssertTrue(instruction.label.contains("を上から順に"))
        let chapter = app.buttons["learning-route-A-step-1-link-0"]
        requireHittable(chapter)
        chapter.tap()
        let summary = app.staticTexts["library-filter-summary"]
        XCTAssertTrue(summary.waitForExistence(timeout: 10))
        XCTAssertTrue(summary.label.contains("01 基礎概念"))
        let firstArticle = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", "library-article-")).firstMatch
        XCTAssertEqual(firstArticle.identifier, "library-article-01-concepts/what-is-an-ai-agent")

        openLearningGuide()
        app.buttons["learning-route-A"].tap()
        let article = app.buttons["learning-route-A-step-2-link-0"]
        requireHittable(article)
        article.tap()
        requireNativeBody()
        XCTAssertTrue(app.navigationBars.firstMatch.identifier.contains("Workflow"))
        XCTAssertFalse(app.navigationBars["学習ルート A"].exists)
        capture("Learning-route-article")
    }

    func testGlossarySearchRelatedArticleAndReturnPreserveReaderState() throws {
        open("Transformer アーキテクチャ詳解", articleID: "11-llm-internals/transformer-architecture")
        goToContents("自己注意の数式", headingID: "自己注意の数式")
        app.buttons["しおりを追加"].tap()
        app.buttons["reader-glossary"].tap()
        let search = app.searchFields["用語・英語名・定義を検索"]
        XCTAssertTrue(search.waitForExistence(timeout: 10))
        search.tap()
        search.typeText("Agent Loop\n")
        let term = element("learning-term-agent-ループagent-loop")
        requireHittable(term)
        term.tap()
        let definition = app.staticTexts["learning-term-definition"]
        XCTAssertTrue(definition.waitForExistence(timeout: 10))
        XCTAssertTrue(definition.label.contains("観測"))
        XCTAssertTrue(definition.label.contains("行動"))
        let related = app.buttons["learning-related-0"]
        requireHittable(related)
        related.tap()
        XCTAssertTrue(app.navigationBars["Agent ループ"].waitForExistence(timeout: 10))
        requireNativeBody()
        XCTAssertEqual(app.navigationBars.firstMatch.identifier, "Agent ループ")
        app.navigationBars.buttons.element(boundBy: 0).tap()
        XCTAssertTrue(app.buttons["しおりを削除"].waitForExistence(timeout: 10))
        requireHittable(app.staticTexts["native-heading-自己注意の数式"],
                        inside: app.scrollViews["native-reader"], fullyVisible: true)
        capture("Learning-glossary-reader-return")
    }

    private func openBundledContentConfirmation() {
        app.buttons["その他の操作"].tap()
        let choose = app.buttons["library-bundled-content"]
        requireHittable(choose)
        choose.tap()
        XCTAssertTrue(app.navigationBars["同梱コンテンツ"].waitForExistence(timeout: 45))
        XCTAssertEqual(app.staticTexts["bundled-content-current-count"].label, "記事数: \(expectedPublishedCount)記事")
        XCTAssertEqual(app.staticTexts["bundled-content-bundled-count"].label, "記事数: \(expectedPublishedCount)記事")
    }

    func testBundledContentSelectionCancelConfirmAndRestartKeepReadingAndGuide() throws {
        // This full-bundle app starts with equivalent bundled content. The Core
        // migration regressions separately exercise actual old-three to full switches.
        open("Transformer アーキテクチャ詳解", articleID: "11-llm-internals/transformer-architecture")
        goToContents("自己注意の数式", headingID: "自己注意の数式")
        app.buttons["しおりを追加"].tap()
        returnToLibrary()

        let tags = app.buttons["library-tag-filter"]
        for _ in 0..<8 where !isHittableOnScreen(tags) { app.swipeDown(velocity: .slow) }
        requireHittable(tags)
        tags.tap()
        let tagSearch = app.searchFields["タグを検索"]
        XCTAssertTrue(tagSearch.waitForExistence(timeout: 10))
        tagSearch.tap()
        tagSearch.typeText("transformer\n")
        let tag = app.buttons["learning-tag-transformer"]
        requireHittable(tag)
        tag.tap()
        let summary = app.staticTexts["library-filter-summary"]
        XCTAssertTrue(summary.waitForExistence(timeout: 10))
        XCTAssertTrue(summary.label.contains("タグ: transformer"))
        XCTAssertTrue(summary.label.contains("検索: Transformer"))
        let originalSummary = summary.label

        openBundledContentConfirmation()
        app.buttons["bundled-content-cancel"].tap()
        let closed = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            !self.app.navigationBars["同梱コンテンツ"].exists
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [closed], timeout: 10), .completed)
        XCTAssertEqual(summary.label, originalSummary, "Cancel must retain both the article query and selected tag")

        openBundledContentConfirmation()
        let confirm = app.buttons["bundled-content-confirm"]
        for _ in 0..<5 where !isHittableOnScreen(confirm) { app.swipeUp(velocity: .slow) }
        requireHittable(confirm)
        confirm.tap()
        let notice = app.alerts["コンテンツ"]
        XCTAssertTrue(notice.waitForExistence(timeout: 45))
        XCTAssertTrue(notice.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "保存したしおりと読書位置")).firstMatch.exists)
        notice.buttons["閉じる"].tap()
        XCTAssertFalse(summary.exists, "Only confirmed successful selection resets transient filters")
        XCTAssertEqual(tags.value as? String, "すべてのタグ")
        XCTAssertEqual(app.staticTexts["library-article-count"].label, "全\(expectedPublishedCount)記事")

        app.terminate()
        app.launch()
        XCTAssertTrue(app.staticTexts["library-article-count"].waitForExistence(timeout: 45))
        XCTAssertEqual(app.staticTexts["library-article-count"].label, "全\(expectedPublishedCount)記事")
        XCTAssertTrue(app.buttons["library-learning-guide"].exists)
        let resume = element("library-resume")
        XCTAssertTrue(resume.waitForExistence(timeout: 10))
        resume.tap()
        XCTAssertTrue(app.buttons["しおりを削除"].waitForExistence(timeout: 10))
        requireHittable(app.staticTexts["native-heading-自己注意の数式"],
                        inside: app.scrollViews["native-reader"], fullyVisible: true)
        capture("Bundled-content-selection-resume")
    }

    func testRelatedChapterLinkClosesInPlaceAndOpensAnArticleWithoutLosingTheReader() throws {
        open("ユースケース発見と要件定義", articleID: "09-business/usecase-discovery")
        app.buttons["しおりを追加"].tap()
        goToContents("関連トピック", headingID: "関連トピック")
        let reader = app.scrollViews["native-reader"]
        let paragraph = app.staticTexts["native-text-paragraph-5020d29916dbd75df6ba41fa"]
        for _ in 0..<8 where !isHittableOnScreen(paragraph, inside: reader, fullyVisible: true) {
            reader.swipeUp(velocity: .slow)
        }
        requireHittable(paragraph, inside: reader, fullyVisible: true)
        XCTAssertTrue(paragraph.label.contains("ドメイン別エージェント設計(13 章)"))
        XCTAssertTrue(paragraph.label.contains("「向き不向き」の判断を、リサーチ・データ分析・RPA などドメインごとに具体化した設計ガイド"))

        func tapChapterLink() {
            let link = reader.links["ドメイン別エージェント設計(13 章)"].firstMatch
            if isHittableOnScreen(link, inside: reader, fullyVisible: true) { link.tap() }
            else {
                // SwiftUI can expose the whole linked-and-qualified paragraph as
                // one Text. Its first inline is the link: tap its first line,
                // rather than the qualifier at the center of the paragraph.
                requireHittable(paragraph, inside: reader, fullyVisible: true)
                paragraph.coordinate(withNormalizedOffset: CGVector(dx: 0.05, dy: 0))
                    .withOffset(CGVector(dx: 0, dy: min(10, paragraph.frame.height / 2))).tap()
            }
            XCTAssertTrue(app.navigationBars["13 ドメイン別エージェント設計"].waitForExistence(timeout: 10))
            let description = app.staticTexts["learning-chapter-description"]
            XCTAssertTrue(description.waitForExistence(timeout: 10))
            XCTAssertTrue(description.label.contains("そのドメイン固有の設計判断"))
        }

        tapChapterLink()
        app.navigationBars["13 ドメイン別エージェント設計"].buttons["閉じる"].tap()
        let closed = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            !self.app.navigationBars["13 ドメイン別エージェント設計"].exists
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [closed], timeout: 10), .completed)
        requireHittable(paragraph, inside: reader, fullyVisible: true)
        tapChapterLink()
        let firstArticle = app.buttons["learning-chapter-article-13-domain-agents/deep-research-agents"]
        for _ in 0..<8 where !isHittableOnScreen(firstArticle) { app.swipeUp(velocity: .slow) }
        requireHittable(firstArticle)
        firstArticle.tap()
        XCTAssertTrue(app.navigationBars["ディープリサーチ型エージェントの設計"].waitForExistence(timeout: 10))
        requireNativeBody()
        app.navigationBars.buttons.element(boundBy: 0).tap()
        XCTAssertTrue(app.navigationBars["ユースケース発見と要件定義"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["しおりを削除"].exists)
        let firstRelated = app.staticTexts.matching(NSPredicate(format: "identifier BEGINSWITH %@ AND label CONTAINS %@",
            "native-text-", "選んだ候補を「どう作るか」の技術判断")).firstMatch
        requireHittable(firstRelated, inside: reader)
        capture("Related-chapter-reader-return")
    }
}
