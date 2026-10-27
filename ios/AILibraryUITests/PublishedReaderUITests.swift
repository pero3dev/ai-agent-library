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

    /// Modal descendants can retain background list identifiers. Require one
    /// actually hittable public control instead of assuming firstMatch is front.
    private func singleHittableControl(_ query: XCUIElementQuery, name: String) throws -> XCUIElement {
        let available = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            query.allElementsBoundByIndex.filter { self.isHittableOnScreen($0) }.count == 1
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [available], timeout: 15), .completed,
                       "Exactly one foreground \(name) must be usable")
        let visible = query.allElementsBoundByIndex.filter { isHittableOnScreen($0) }
        guard visible.count == 1 else {
            throw NSError(domain: "PublishedReaderUITests", code: 2,
                          userInfo: [NSLocalizedDescriptionKey: "Missing or ambiguous foreground " + name])
        }
        return visible[0]
    }

    private func foregroundArticleSearch() throws -> XCUIElement {
        let prompt = "記事の本文を検索"
        let query = app.searchFields.matching(
            NSPredicate(format: "identifier == %@ OR label == %@", prompt, prompt))
        // searchable has no always-visible placement. Use the baseline's bounded
        // reveal only when no foreground search field is currently hittable.
        for _ in 0..<8 {
            if query.allElementsBoundByIndex.contains(where: { isHittableOnScreen($0) }) { break }
            app.swipeDown(velocity: .slow)
        }
        return try singleHittableControl(query, name: "article search")
    }

    private func setForegroundArticleQuery(_ query: String) throws {
        let search = try foregroundArticleSearch()
        search.tap()
        if let current = search.value as? String, !current.isEmpty, current != search.placeholderValue {
            let clear = search.buttons.firstMatch
            requireHittable(clear)
            clear.tap()
        }
        search.typeText(query + "\n")
        XCTAssertEqual(search.value as? String, query)
    }

    private func setLearningTagAndArticleQuery(tag: String, query: String) throws {
        let tags = app.buttons["library-tag-filter"]
        for _ in 0..<8 where !isHittableOnScreen(tags) { app.swipeDown(velocity: .slow) }
        requireHittable(tags)
        tags.tap()
        let tagSearch = app.searchFields["タグを検索"]
        XCTAssertTrue(tagSearch.waitForExistence(timeout: 10))
        requireHittable(tagSearch)
        tagSearch.tap()
        tagSearch.typeText(tag + "\n")
        let choice = app.buttons["learning-tag-" + tag]
        requireHittable(choice)
        choice.tap()
        try setForegroundArticleQuery(query)
        let summary = app.staticTexts["library-filter-summary"]
        XCTAssertTrue(summary.waitForExistence(timeout: 10))
        XCTAssertTrue(summary.label.contains("タグ: " + tag))
        XCTAssertTrue(summary.label.contains("検索: " + query))
        XCTAssertEqual(tags.value as? String, tag)
    }

    private func openFilteredMoreActionsSheet() throws {
        let more = try singleHittableControl(app.buttons.matching(
            NSPredicate(format: "label == %@", "その他の操作")), name: "More Actions button")
        more.tap()
        XCTAssertTrue(app.navigationBars["その他の操作"].waitForExistence(timeout: 10))
        requireHittable(app.buttons["このアプリについて"])
    }

    private func closePublicSheet(_ title: String) {
        let bar = app.navigationBars[title]
        let close = bar.buttons["閉じる"]
        requireHittable(close)
        close.tap()
        let closed = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in !bar.exists }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [closed], timeout: 10), .completed)
    }

    func testFilteredMoreActionsAboutRoundTripPreservesQueryAndLearningTag() throws {
        try setLearningTagAndArticleQuery(tag: "agent-loop", query: "Agent ループ")
        let summary = app.staticTexts["library-filter-summary"]
        let originalSummary = summary.label
        let article = element("library-article-01-concepts/agent-loop")
        XCTAssertTrue(article.waitForExistence(timeout: 10))
        try openFilteredMoreActionsSheet()
        let about = app.buttons["このアプリについて"]
        requireHittable(about)
        about.tap()
        XCTAssertTrue(app.navigationBars["このアプリについて"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.navigationBars["その他の操作"].exists)
        closePublicSheet("このアプリについて")

        XCTAssertTrue(summary.waitForExistence(timeout: 10))
        XCTAssertEqual(summary.label, originalSummary)
        XCTAssertEqual(try foregroundArticleSearch().value as? String, "Agent ループ")
        XCTAssertEqual(app.buttons["library-tag-filter"].value as? String, "agent-loop")
        XCTAssertTrue(article.exists)
        capture("Filtered-more-actions-about-return")
    }

    func testFilteredFixtureActionsAndReadingChangesRemainIsolatedFromNormalLibrary() throws {
        open("Transformer アーキテクチャ詳解", articleID: "11-llm-internals/transformer-architecture")
        goToContents("自己注意の数式", headingID: "自己注意の数式")
        app.buttons["しおりを追加"].tap()
        XCTAssertTrue(app.buttons["しおりを削除"].waitForExistence(timeout: 5))
        returnToLibrary()
        try setLearningTagAndArticleQuery(tag: "transformer", query: "Transformer")
        let summary = app.staticTexts["library-filter-summary"]
        let originalSummary = summary.label

        try openFilteredMoreActionsSheet()
        let testLibrary = app.buttons["本文表示テスト"]
        requireHittable(testLibrary)
        testLibrary.tap()
        let fixtureBar = app.navigationBars["本文表示テスト"]
        XCTAssertTrue(fixtureBar.waitForExistence(timeout: 45))
        let fixtureArticle = element("library-article-test-fixtures/native-reader")
        XCTAssertTrue(fixtureArticle.waitForExistence(timeout: 45))
        // Check the unfiltered foreground list before typing: the snapshot also
        // contains normal articles solely as internal-link destinations.
        let fixtureCount = try singleHittableControl(app.staticTexts.matching(
            identifier: "library-article-count"), name: "fixture article count")
        XCTAssertEqual(fixtureCount.label, "全1記事")
        let foregroundRows = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", "library-article-"))
            .allElementsBoundByIndex.filter { isHittableOnScreen($0) }
        XCTAssertEqual(foregroundRows.count, 1)
        XCTAssertTrue(foregroundRows.allSatisfy { $0.identifier == "library-article-test-fixtures/native-reader" },
                      "Normal article rows must not appear in the foreground fixture list")
        try setForegroundArticleQuery("CASE-LINK-01")
        try openFilteredMoreActionsSheet()
        XCTAssertFalse(app.buttons["ファイルからコンテンツを更新"].exists)
        XCTAssertFalse(app.buttons["library-bundled-content"].exists)
        XCTAssertFalse(app.buttons["本文表示テスト"].exists)
        closePublicSheet("その他の操作")
        XCTAssertEqual(try foregroundArticleSearch().value as? String, "CASE-LINK-01")
        requireHittable(fixtureArticle)
        fixtureArticle.tap()
        requireNativeBody()

        // The fixture reading suite persists independently. Mutate its current
        // public bookmark state without assuming a previous run left it empty.
        let add = app.buttons["しおりを追加"], remove = app.buttons["しおりを削除"]
        if add.exists {
            requireHittable(add)
            add.tap()
            XCTAssertTrue(remove.waitForExistence(timeout: 5))
        } else {
            requireHittable(remove)
            remove.tap()
            XCTAssertTrue(add.waitForExistence(timeout: 5))
        }
        goToContents("CASE-LINK-01", headingID: "case-link-01")
        let reader = app.scrollViews["native-reader"]
        // This source-bound paragraph is one link covering all of its text.
        // Its XCUI type need not be guessed as Link rather than StaticText.
        let agentLink = element("native-text-paragraph-54e8aecd2e87e69446c1b222")
        for _ in 0..<8 where !isHittableOnScreen(agentLink, inside: reader, fullyVisible: true) {
            reader.swipeUp(velocity: .slow)
        }
        requireHittable(agentLink, inside: reader, fullyVisible: true)
        XCTAssertTrue(agentLink.label.contains("Agentループの停止条件へ"))
        agentLink.tap()
        XCTAssertTrue(app.navigationBars["Agent ループ"].waitForExistence(timeout: 10))
        requireNativeBody()
        requireHittable(app.staticTexts["native-heading-詳細-停止条件は正常完了以外に必ず用意する"],
                        inside: reader, fullyVisible: true)
        XCTAssertFalse(app.buttons["音声で聴く"].exists)

        app.navigationBars["Agent ループ"].buttons.element(boundBy: 0).tap()
        XCTAssertTrue(app.navigationBars["ネイティブ本文テスト専用記事"].waitForExistence(timeout: 10))
        app.navigationBars["ネイティブ本文テスト専用記事"].buttons.element(boundBy: 0).tap()
        let readerClosed = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            !self.app.scrollViews["native-reader"].exists
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [readerClosed], timeout: 10), .completed)
        XCTAssertTrue(fixtureBar.waitForExistence(timeout: 10))
        XCTAssertEqual(try foregroundArticleSearch().value as? String, "CASE-LINK-01")
        let cancelFixtureSearch = try singleHittableControl(
            fixtureBar.buttons.matching(NSPredicate(format: "label == %@", "キャンセル")),
            name: "fixture search cancellation")
        cancelFixtureSearch.tap()
        closePublicSheet("本文表示テスト")

        XCTAssertTrue(app.navigationBars["AI Agent Library"].waitForExistence(timeout: 10))
        XCTAssertTrue(summary.waitForExistence(timeout: 10))
        XCTAssertEqual(summary.label, originalSummary)
        XCTAssertEqual(try foregroundArticleSearch().value as? String, "Transformer")
        XCTAssertEqual(app.buttons["library-tag-filter"].value as? String, "transformer")
        let clear = app.buttons["library-clear-filters"]
        requireHittable(clear)
        clear.tap()
        let filtersCleared = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in !summary.exists }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [filtersCleared], timeout: 10), .completed)
        // Reload the normal ReadingStore from persistence before opening a
        // reader; its cached in-process value must not hide fixture pollution.
        app.terminate()
        app.launch()
        let normalCount = app.staticTexts["library-article-count"]
        XCTAssertTrue(normalCount.waitForExistence(timeout: 45))
        XCTAssertEqual(normalCount.label, "全\(expectedPublishedCount)記事")
        let resume = element("library-resume")
        XCTAssertTrue(resume.waitForExistence(timeout: 10))
        for _ in 0..<8 where !isHittableOnScreen(resume) { app.swipeDown(velocity: .slow) }
        requireHittable(resume)
        resume.tap()
        requireNativeBody()
        XCTAssertTrue(app.navigationBars["Transformer アーキテクチャ詳解"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["しおりを削除"].waitForExistence(timeout: 10))
        requireHittable(app.staticTexts["native-heading-自己注意の数式"],
                        inside: app.scrollViews["native-reader"], fullyVisible: true)
        capture("Filtered-fixture-normal-reading-isolation")
    }
    /// Observe the one-shot search landing without creating it with a reader gesture.
    /// Requiring the first fully visible native paragraph also distinguishes a
    /// nested leaf from merely revealing the beginning of its enclosing list.
    private func requireSearchParagraphAtReadingStart(_ blockID: String, containing terms: [String],
                                                     file: StaticString = #filePath, line: UInt = #line) -> XCUIElement {
        let reader = app.scrollViews["native-reader"]
        let target = app.staticTexts["native-text-" + blockID]
        requireHittable(target, inside: reader, fullyVisible: true, file: file, line: line)
        let arrived = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            self.firstFullyVisibleNativeParagraphMatches(target, inside: reader)
        }, object: nil)
        let result = XCTWaiter.wait(for: [arrived], timeout: 15)
        if result != .completed { capture("Search-hit-paragraph-not-at-reading-start") }
        XCTAssertEqual(result, .completed, "The search leaf must be the first fully visible native paragraph",
                       file: file, line: line)
        for term in terms { XCTAssertTrue(target.label.contains(term), file: file, line: line) }
        XCTAssertFalse(app.staticTexts["native-search-no-body-hit"].exists, file: file, line: line)
        return target
    }

    func testBodySearchArrivesAtNestedParagraphContainingAllTermsWithoutReaderGestures() throws {
        // All three terms occur together only in this nested paragraph in both
        // representative-three and full-published generated Agent-loop documents.
        open("Agent ループ", articleID: "01-concepts/agent-loop", query: "回復 チャンス 一時的")
        _ = requireSearchParagraphAtReadingStart("paragraph-84a3d15f08b1ab446d5aafca",
                                                containing: ["回復", "チャンス", "一時的"])
        capture("Body-search-nested-AND-hit-arrival")
    }

    func testResumeUsesLaterReadingPositionInsteadOfReplayingThePreviousBodyQuery() throws {
        let query = "20 ステップ分"
        let hitID = "paragraph-a6c65c1cbabb5998e86242b7"
        let headingID = "実装例-最小の-agent-ループ"
        open("Agent ループ", articleID: "01-concepts/agent-loop", query: query)
        let originalHit = requireSearchParagraphAtReadingStart(hitID, containing: ["20", "ステップ分"])
        let reader = app.scrollViews["native-reader"]

        // A deliberate, ordinary TOC move saves B after search landed at A.
        // A and B are nine top-level blocks apart, across several sections and a table.
        goToContents("実装例: 最小の Agent ループ", headingID: headingID)
        XCTAssertFalse(hasVisibleFrame(originalHit, inside: reader), "A must no longer be on screen at B")
        capture("Body-search-later-reading-position-before-relaunch")
        returnToLibrary()
        XCTAssertEqual(try foregroundArticleSearch().value as? String, query,
                       "The in-process library still has the deliberate body query")

        app.terminate()
        app.launch()
        let count = app.staticTexts["library-article-count"]
        XCTAssertTrue(count.waitForExistence(timeout: 45))
        XCTAssertEqual(count.label, "全\(expectedPublishedCount)記事")
        let search = try foregroundArticleSearch()
        let resetValue = try XCTUnwrap(search.value as? String)
        XCTAssertTrue(resetValue.isEmpty || resetValue == search.placeholderValue,
                      "The library query must reset on process relaunch")
        XCTAssertFalse(app.staticTexts["library-filter-summary"].exists)
        let resume = element("library-resume")
        for _ in 0..<8 where !isHittableOnScreen(resume) { app.swipeDown(velocity: .slow) }
        requireHittable(resume)
        resume.tap()
        requireNativeBody()
        XCTAssertTrue(app.navigationBars["Agent ループ"].waitForExistence(timeout: 10))
        // No reader scroll or TOC action is allowed after resume: B, not the
        // old query hit A, must already be visible through the public UI.
        requireHittable(app.staticTexts["native-heading-" + headingID], inside: reader, fullyVisible: true)
        XCTAssertFalse(hasVisibleFrame(app.staticTexts["native-text-" + hitID], inside: reader),
                       "Resume must not replay the old query and return to A")
        capture("Body-query-not-replayed-by-reading-resume")
    }

    /// Only the new navigation context created by the public folder-import action
    /// may supply cancellation. Existing library/search/More bars are excluded.
    private func requireNewFolderPicker(after previousIDs: Set<String>) throws
        -> (bar: XCUIElement, cancel: XCUIElement) {
        var readinessWaitResult = "not_started"
        // Observed on iOS 18.5 in the failed run. Do not infer a system picker
        // from arbitrary new bars or fall back to background search cancellation.
        let identifier = "FullDocumentManagerViewControllerNavigationBar"
        let query = app.navigationBars.matching(identifier: identifier)
        let cancelPredicate = NSPredicate(format: "label == %@", "キャンセル")
        var rejection = "The observed document-picker context has not been inspected"
        // Save existing query results only; later revalidation does not replace
        // the separately retained last readiness-predicate observation.
        var candidateObservation: [String: Any] = [:]
        var lastPredicateObservation: [String: Any] = ["phase": "not_evaluated"]
        var predicateEvaluationCount = 0
        func candidates() -> [XCUIElement] {
            candidateObservation = ["branch": "checking_previous_identifiers",
                                    "bar_count": NSNull(), "bar_exists": NSNull(),
                                    "scoped_cancel_count": NSNull(), "usable_cancel_count": NSNull()]
            guard !previousIDs.contains(identifier) else {
                candidateObservation["branch"] = "known_id_already_present"
                rejection = "The document-picker ID was already present before import"
                return []
            }
            let count = query.count
            candidateObservation["bar_count"] = count
            guard count == 1 else {
                candidateObservation["branch"] = "bar_count_not_one"
                rejection = "Expected one document-picker bar; found \(count)"
                return []
            }
            // Bind only after uniqueness is established for this exact query.
            let bar = query.element(boundBy: 0)
            guard bar.exists else {
                candidateObservation["bar_exists"] = false
                candidateObservation["branch"] = "unique_bar_disappeared"
                rejection = "The uniquely queried document-picker bar disappeared"
                return []
            }
            candidateObservation["bar_exists"] = true
            // Hittability requires an on-screen hit point. Delay frame reads
            // until this cross-process picker has completed its readiness wait.
            let scopedCancels = bar.buttons.matching(cancelPredicate).allElementsBoundByIndex
            let usable = scopedCancels.filter {
                $0.exists && $0.isEnabled && $0.isHittable
            }
            candidateObservation["scoped_cancel_count"] = scopedCancels.count
            candidateObservation["usable_cancel_count"] = usable.count
            guard usable.count == 1 else {
                candidateObservation["branch"] = "usable_scoped_cancel_count_not_one"
                rejection = "Expected one visible enabled scoped cancellation; found \(usable.count)"
                return []
            }
            candidateObservation["branch"] = "ready"
            rejection = "Observed document-picker context and scoped cancellation are ready"
            return [bar]
        }
        func emitPredicateDiagnostic(_ reason: String) {
            let prefix = "AILibraryFolderPicker "
            let maximumRecordBytes = 8192 // Includes prefix and trailing LF.
            let maximumJSONBytes = maximumRecordBytes - prefix.utf8.count - 1
            let maximumRows = 10
            let maximumStringCharacters = 160
            func publicText(_ value: String) -> String {
                // Navigation identifiers may unexpectedly contain user data.
                let sensitive = #"[A-Za-z][A-Za-z0-9+.-]*:\S+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}"#
                if value.contains("/") || value.contains("\\") ||
                    value.range(of: sensitive, options: [.regularExpression, .caseInsensitive]) != nil {
                    return "<redacted>"
                }
                let flat = value.replacingOccurrences(of: "\n", with: " ")
                    .replacingOccurrences(of: "\r", with: " ")
                    .replacingOccurrences(of: "\t", with: " ")
                return flat.count <= maximumStringCharacters ? flat
                    : String(flat.prefix(maximumStringCharacters)) + "<truncated>"
            }
            func frameJSON(_ frame: CGRect) -> [String: Any] {
                func number(_ value: CGFloat) -> Any {
                    value.isFinite ? Double(value) as Any : NSNull()
                }
                return ["x": number(frame.minX), "y": number(frame.minY),
                        "width": number(frame.width), "height": number(frame.height)]
            }
            // One failure-only sequential AX snapshot, later than the predicate.
            // These reads are not an atomic recreation of its earlier state.
            let bars = app.navigationBars
            let navigationBarCount = bars.count
            var barRows: [[String: Any]] = []
            for index in 0..<min(navigationBarCount, maximumRows) {
                let bar = bars.element(boundBy: index)
                let exists = bar.exists
                var row: [String: Any] = ["index": index, "exists": exists]
                if exists {
                    row["identifier"] = publicText(bar.identifier)
                    row["frame"] = frameJSON(bar.frame)
                } else {
                    row["identifier"] = "<absent>"
                    row["frame"] = NSNull()
                }
                barRows.append(row)
            }
            let knownBarCount = query.count
            var knownBar: [String: Any] = ["count": knownBarCount,
                                           "exists": NSNull(), "scoped_cancel_count": NSNull()]
            var cancelRows: [[String: Any]] = []
            if knownBarCount == 1 {
                let bar = query.element(boundBy: 0)
                let exists = bar.exists
                knownBar["exists"] = exists
                if exists {
                    let cancels = bar.buttons.matching(cancelPredicate)
                    let count = cancels.count
                    knownBar["scoped_cancel_count"] = count
                    for index in 0..<min(count, maximumRows) {
                        let cancel = cancels.element(boundBy: index)
                        let exists = cancel.exists
                        cancelRows.append(["index": index, "known_public_label": "キャンセル",
                                           "exists": exists, "enabled": exists && cancel.isEnabled,
                                           "hittable": exists && cancel.isHittable])
                    }
                }
            }
            let counts: [String: Any] = ["navigation_bars": navigationBarCount,
                "known_picker_bars": knownBarCount,
                "known_scoped_cancels": knownBar["scoped_cancel_count"] ?? NSNull(),
                "previous_identifiers": previousIDs.count,
                "alerts": app.alerts.count, "keyboards": app.keyboards.count]
            let bounds: [String: Any] = ["record_UTF8_bytes_including_prefix_LF": maximumRecordBytes,
                "navigation_bar_rows": maximumRows, "scoped_cancel_rows": maximumRows,
                "identifier_characters": maximumStringCharacters,
                "nonfinite_frame_numbers": "null", "URI_path_email": "redacted",
                "label_values": "known public cancellation label only"]
            var predicate = lastPredicateObservation
            if let lastRejection = predicate["rejection"] as? String {
                predicate["rejection"] = publicText(lastRejection)
            }
            let snapshot: [String: Any] = ["phase": "diagnose_after_failure_sequential_AX",
                "same_instant_as_predicate": false, "counts": counts,
                "app_state": publicText(String(describing: app.state)),
                "app_frame": frameJSON(app.frame),
                "known_id_previously_present": previousIDs.contains(identifier),
                "known_picker": knownBar, "scoped_cancel_observations": cancelRows,
                "navigation_bars": barRows,
                "More_bar_exists": app.navigationBars["その他の操作"].exists]
            let record: [String: Any] = ["schema_version": 1, "reason": publicText(reason),
                "readiness_wait_result": readinessWaitResult,
                "last_candidate_rejection_at_diagnose": publicText(rejection),
                "last_predicate_observation": predicate, "failure_snapshot": snapshot,
                "bounds": bounds, "truncated_to_counts": false]
            let fallback: [String: Any] = ["schema_version": 1,
                "phase": "diagnose_counts_and_rejection_fallback",
                "readiness_wait_result": readinessWaitResult,
                "reason": publicText(reason), "last_candidate_rejection_at_diagnose": publicText(rejection),
                "last_predicate_observation": predicate, "failure_snapshot_counts": counts,
                "same_instant_as_predicate": false, "bounds": bounds, "truncated_to_counts": true]
            func encoded(_ value: [String: Any]) -> Data? {
                guard JSONSerialization.isValidJSONObject(value) else { return nil }
                return try? JSONSerialization.data(withJSONObject: value, options: [.sortedKeys])
            }
            let body: Data
            if let data = encoded(record), data.count <= maximumJSONBytes {
                body = data
            } else if let data = encoded(fallback), data.count <= maximumJSONBytes {
                body = data
            } else {
                body = Data(#"{"schema_version":1,"phase":"diagnose_encoding_fallback","truncated_to_counts":true}"#.utf8)
            }
            let json = String(decoding: body, as: UTF8.self)
            print(prefix + json)
            let attachment = XCTAttachment(string: json)
            attachment.name = "Public-UI-folder-picker-diagnostic"
            attachment.lifetime = .keepAlways
            add(attachment)
        }
        func diagnose(_ reason: String) {
            capture("Content-folder-picker-not-identified")
            emitPredicateDiagnostic(reason)
            let hierarchy = XCTAttachment(string: reason + "\n" + rejection + "\n" + app.debugDescription)
            hierarchy.name = "Content-folder-picker-identification"
            hierarchy.lifetime = .keepAlways
            add(hierarchy)
        }
        let available = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            let ready = candidates().count == 1
            predicateEvaluationCount += 1
            lastPredicateObservation = candidateObservation
            lastPredicateObservation["phase"] = "last_readiness_predicate_evaluation"
            lastPredicateObservation["evaluation"] = predicateEvaluationCount
            lastPredicateObservation["ready"] = ready
            lastPredicateObservation["rejection"] = rejection
            return ready
        }, object: nil)
        let result = XCTWaiter.wait(for: [available], timeout: 15)
        readinessWaitResult = String(describing: result)
        guard result == .completed else {
            diagnose("Folder-picker readiness did not observe a new unique bar and one usable scoped cancellation")
            XCTFail("The public folder import must present a uniquely identifiable foreground picker")
            throw NSError(domain: "PublishedReaderUITests", code: 4)
        }
        let bars = candidates()
        guard bars.count == 1 else {
            diagnose("Folder-picker context became missing or ambiguous")
            throw NSError(domain: "PublishedReaderUITests", code: 5)
        }
        // Rebind by the observed system ID, never by the index of all app bars.
        guard query.count == 1 else {
            diagnose("Folder-picker navigation identifier is no longer unique")
            throw NSError(domain: "PublishedReaderUITests", code: 8)
        }
        let bar = query.element(boundBy: 0)
        let usable = bar.buttons.matching(cancelPredicate).allElementsBoundByIndex.filter {
            $0.exists && $0.isEnabled && $0.isHittable
        }
        guard usable.count == 1 else {
            diagnose("Cancellation became missing or ambiguous within the new picker bar")
            throw NSError(domain: "PublishedReaderUITests", code: 6)
        }
        let cancel = usable[0]
        // Inspect each frame once, after readiness, without entering another
        // geometry-based waiter through the generic single-control helper.
        let barFrame = bar.frame, appFrame = app.frame, cancelFrame = cancel.frame
        let framesAreValid = [barFrame, appFrame, cancelFrame].allSatisfy {
            $0.minX.isFinite && $0.minY.isFinite && $0.width.isFinite && $0.height.isFinite &&
            $0.width > 0 && $0.height > 0
        }
        guard bar.exists, bar.identifier == identifier, !previousIDs.contains(bar.identifier),
              cancel.exists, cancel.isEnabled, cancel.isHittable, framesAreValid,
              appFrame.contains(barFrame), barFrame.contains(cancelFrame) else {
            diagnose("Cancellation no longer belongs to the new foreground picker bar")
            throw NSError(domain: "PublishedReaderUITests", code: 6)
        }
        return (bar, cancel)
    }

    /// This case alone uses the existing unique foreground-navigation viewport.
    /// A visible article-search field also clips the top; other occlusion still
    /// depends on XCTest isHittable. These sequential AX reads are not atomic.
    private func normalResumeCandidates() -> (ready: [XCUIElement], searches: [XCUIElement]) {
        let resume = app.buttons.matching(identifier: "library-resume").allElementsBoundByIndex.filter {
            $0.exists && $0.isEnabled && isHittableOnScreen($0, inside: app, fullyVisible: true)
        }
        let prompt = "記事の本文を検索"
        let searches = app.searchFields.matching(
            NSPredicate(format: "identifier == %@ OR label == %@", prompt, prompt))
            .allElementsBoundByIndex.filter { $0.exists && $0.isEnabled && isHittableOnScreen($0) }
        guard searches.count <= 1 else { return ([], searches) }
        guard let search = searches.first else { return (resume, searches) }
        let searchFrame = search.frame
        guard searchFrame.minX.isFinite, searchFrame.minY.isFinite,
              searchFrame.width.isFinite, searchFrame.height.isFinite,
              searchFrame.width > 0, searchFrame.height > 0 else { return ([], searches) }
        return (resume.filter { $0.frame.minY >= searchFrame.maxY }, searches)
    }

    /// Failure-only public AX evidence, not an application route introspection.
    /// Bound the attachment bodies; AX property retrieval itself is best effort.
    private func captureNormalResumeFailure(_ reason: String) {
        func frameJSON(_ frame: CGRect?) -> [String: Any] {
            guard let frame else { return ["state": "absent"] }
            func number(_ value: CGFloat) -> Any { value.isFinite ? Double(value) as Any : NSNull() }
            return ["x": number(frame.minX), "y": number(frame.minY),
                    "width": number(frame.width), "height": number(frame.height)]
        }
        func rows(_ elements: [XCUIElement]) -> [[String: Any]] {
            elements.prefix(8).map { control in
                let exists = control.exists
                return ["identifier": exists ? String(control.identifier.prefix(128)) : "",
                        "label": exists ? String(control.label.prefix(128)) : "",
                        "exists": exists, "enabled": exists && control.isEnabled,
                        "frame": frameJSON(exists ? control.frame : nil)]
            }
        }
        func hasLabel(_ label: String) -> Bool {
            app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", label)).count > 0
        }
        let observation = normalResumeCandidates()
        let resume = app.buttons.matching(identifier: "library-resume").allElementsBoundByIndex
        let search = app.searchFields.allElementsBoundByIndex
        let bars = app.navigationBars.allElementsBoundByIndex
        let route: [String: Any] = [
            "expectedTitle": "Transformer アーキテクチャ詳解",
            "expectedArticleBarExists": app.navigationBars["Transformer アーキテクチャ詳解"].exists,
            "libraryBarExists": app.navigationBars["AI Agent Library"].exists,
            "libraryCountExists": app.staticTexts["library-article-count"].exists,
            "nativeReaderCount": app.scrollViews.matching(identifier: "native-reader").count,
            "nativeParagraphExists": app.staticTexts.matching(
                NSPredicate(format: "identifier BEGINSWITH %@", "native-text-")).firstMatch.exists,
            "articleLoadingLabelExists": hasLabel("記事を読み込んでいます"),
            "contentLoadingLabelExists": hasLabel("コンテンツを確認中"),
            "unavailableRouteLabelExists": hasLabel("記事を利用できません"),
            "readerLoadFailureLabelExists": hasLabel("記事を表示できません"),
            "retryButtonExists": app.buttons["再試行"].exists
        ]
        let payload: [String: Any] = [
            "schemaVersion": 1, "sampling": "after-failure-sequential-not-atomic", "reason": reason,
            "routeEvidence": route, "applicationFrame": frameJSON(app.frame),
            "resumeMatchCount": resume.count, "readyResumeCount": observation.ready.count,
            "usableArticleSearchCount": observation.searches.count,
            "resumeControls": rows(resume), "allSearchFields": rows(search),
            "usableArticleSearchFields": rows(observation.searches), "navigationBars": rows(bars),
            "geometryPolicy": "Existing unique foreground-navigation viewport; below a unique usable article search frame; remaining occlusion uses XCTest isHittable",
            "listedElementLimitPerGroup": 8
        ]
        let fallback: [String: Any] = ["schemaVersion": 1, "sampling": "after-failure-sequential-not-atomic",
            "reason": reason, "routeEvidence": route, "geometryOmitted": "encoding-error-or-over-8192-bytes"]
        let data = (try? JSONSerialization.data(withJSONObject: payload, options: [.sortedKeys]))
        let small = data.flatMap { $0.count <= 8192 ? $0 : nil }
            ?? (try? JSONSerialization.data(withJSONObject: fallback, options: [.sortedKeys]))
        let json = small.map { String(decoding: $0, as: UTF8.self) }
            ?? #"{"schemaVersion":1,"encodingError":"serialization-failed"}"#
        print("AILibraryNormalResume " + json)
        let state = XCTAttachment(string: json)
        state.name = "Normal-resume-route-and-geometry"
        state.lifetime = .keepAlways
        add(state)
        // At most 8002 UTF8 bytes after replacement of an incomplete final scalar.
        let hierarchy = XCTAttachment(string: String(decoding: app.debugDescription.utf8.prefix(8000), as: UTF8.self))
        hierarchy.name = "Normal-resume-hierarchy-prefix"
        hierarchy.lifetime = .keepAlways
        add(hierarchy)
    }

    private func requireFullyVisibleNormalResume(expectedLabel: String) throws -> XCUIElement {
        // Preserve the existing maximum eight downward reveals; never retry a tap.
        for _ in 0..<8 {
            if !normalResumeCandidates().ready.isEmpty { break }
            app.swipeDown(velocity: .slow)
        }
        let available = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            self.normalResumeCandidates().ready.count == 1
        }, object: nil)
        let result = XCTWaiter.wait(for: [available], timeout: 15)
        let ready = normalResumeCandidates().ready
        guard result == .completed, ready.count == 1 else {
            captureNormalResumeFailure("No unique enabled fully visible normal resume control before the one tap")
            XCTFail("The normal resume control must satisfy the existing foreground viewport and search-frame guards")
            throw NSError(domain: "PublishedReaderUITests", code: 90)
        }
        let control = ready[0]
        guard control.label == expectedLabel else {
            captureNormalResumeFailure("The unique normal resume label differs from the saved baseline")
            XCTFail("The normal resume label must preserve the original saved article")
            throw NSError(domain: "PublishedReaderUITests", code: 91)
        }
        return control
    }

    private func requireResumedNativeBody() throws {
        // Match requireNativeBody's 20s reader, 10s paragraph and nonempty checks.
        // Do not add a second reader wait or any corrective navigation after tap.
        guard app.scrollViews["native-reader"].waitForExistence(timeout: 20) else {
            captureNormalResumeFailure("native-reader did not appear within the existing 20-second wait after the one resume tap")
            XCTFail("The resumed native-reader must appear")
            throw NSError(domain: "PublishedReaderUITests", code: 92)
        }
        let paragraph = app.staticTexts.matching(NSPredicate(format: "identifier BEGINSWITH %@", "native-text-")).firstMatch
        guard paragraph.waitForExistence(timeout: 10) else {
            captureNormalResumeFailure("Native body text did not appear within the existing 10-second paragraph wait")
            XCTFail("Native body text must appear, beyond the navigation title")
            throw NSError(domain: "PublishedReaderUITests", code: 93)
        }
        let empty = paragraph.label.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        if empty { captureNormalResumeFailure("The resumed native paragraph is empty") }
        XCTAssertFalse(empty)
    }

    func testCancelContentFolderPickerPreservesFiltersAndReadingAndAllowsMoreActions() throws {
        open("Transformer アーキテクチャ詳解", articleID: "11-llm-internals/transformer-architecture")
        goToContents("自己注意の数式", headingID: "自己注意の数式")
        app.buttons["しおりを追加"].tap()
        XCTAssertTrue(app.buttons["しおりを削除"].waitForExistence(timeout: 5))
        returnToLibrary()
        // Establish the saved reading baseline before applying transient filters.
        app.terminate()
        app.launch()
        let count = app.staticTexts["library-article-count"]
        XCTAssertTrue(count.waitForExistence(timeout: 45))
        XCTAssertEqual(count.label, "全\(expectedPublishedCount)記事")
        let originalCount = count.label
        let resume = element("library-resume")
        XCTAssertTrue(resume.waitForExistence(timeout: 10))
        for _ in 0..<8 where !isHittableOnScreen(resume) { app.swipeDown(velocity: .slow) }
        requireHittable(resume)
        let originalResume = resume.label
        XCTAssertFalse(originalResume.isEmpty)

        try setLearningTagAndArticleQuery(tag: "transformer", query: "Transformer")
        let summary = app.staticTexts["library-filter-summary"]
        let originalSummary = summary.label
        let article = element("library-article-11-llm-internals/transformer-architecture")
        XCTAssertTrue(article.waitForExistence(timeout: 10))
        try openFilteredMoreActionsSheet()
        let importer = app.buttons["ファイルからコンテンツを更新"]
        requireHittable(importer)
        let priorBars = app.navigationBars.allElementsBoundByIndex.filter { $0.exists }
        let priorIdentifiers = priorBars.map(\.identifier)
        guard !priorIdentifiers.isEmpty, priorIdentifiers.allSatisfy({ !$0.isEmpty }),
              Set(priorIdentifiers).count == priorIdentifiers.count else {
            capture("Content-folder-picker-baseline-ambiguous")
            throw NSError(domain: "PublishedReaderUITests", code: 7,
                          userInfo: [NSLocalizedDescriptionKey: "Cannot identify the existing navigation contexts before import: \(priorIdentifiers)"])
        }
        importer.tap()
        let picker = try requireNewFolderPicker(after: Set(priorIdentifiers))
        XCTAssertFalse(app.navigationBars["その他の操作"].exists)
        capture("Content-folder-picker-visible-before-cancel")
        picker.cancel.tap()
        let closed = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            !picker.bar.exists
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [closed], timeout: 10), .completed)

        XCTAssertTrue(summary.waitForExistence(timeout: 10))
        XCTAssertEqual(summary.label, originalSummary)
        XCTAssertEqual(try foregroundArticleSearch().value as? String, "Transformer")
        XCTAssertEqual(app.buttons["library-tag-filter"].value as? String, "transformer")
        XCTAssertTrue(article.exists)
        XCTAssertEqual(count.label, originalCount)
        XCTAssertFalse(app.alerts["コンテンツ"].exists, "Cancelling must not leave a blocking import error")
        // A subsequent public operation must still be usable after cancellation.
        try openFilteredMoreActionsSheet()
        let about = app.buttons["このアプリについて"]
        requireHittable(about)
        about.tap()
        XCTAssertTrue(app.navigationBars["このアプリについて"].waitForExistence(timeout: 10))
        closePublicSheet("このアプリについて")
        XCTAssertEqual(summary.label, originalSummary)
        XCTAssertEqual(try foregroundArticleSearch().value as? String, "Transformer")
        XCTAssertEqual(app.buttons["library-tag-filter"].value as? String, "transformer")
        XCTAssertEqual(count.label, originalCount)

        let clear = app.buttons["library-clear-filters"]
        requireHittable(clear)
        clear.tap()
        let filtersCleared = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in !summary.exists }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [filtersCleared], timeout: 10), .completed)
        // Reload persistence before a reader can replace the saved position.
        app.terminate()
        app.launch()
        XCTAssertTrue(count.waitForExistence(timeout: 45))
        XCTAssertEqual(count.label, originalCount)
        XCTAssertTrue(resume.waitForExistence(timeout: 10))
        let foregroundResume = try requireFullyVisibleNormalResume(expectedLabel: originalResume)
        foregroundResume.tap()
        try requireResumedNativeBody()
        XCTAssertTrue(app.navigationBars["Transformer アーキテクチャ詳解"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["しおりを削除"].waitForExistence(timeout: 10))
        requireHittable(app.staticTexts["native-heading-自己注意の数式"],
                        inside: app.scrollViews["native-reader"], fullyVisible: true)
        capture("Content-folder-picker-cancel-preserves-normal-reading")
    }


    // IOS-11 prototype regressions; SDK compilation/execution remain pending.
    func testFixtureTallSingleBlockResumesNearItsMeasuredInternalRowAfterRelaunch() throws {
        func openFixtureLibrary() throws {
            try setLearningTagAndArticleQuery(tag: "transformer", query: "Transformer")
            try openFilteredMoreActionsSheet()
            let action = app.buttons["本文表示テスト"]
            requireHittable(action)
            action.tap()
            XCTAssertTrue(app.navigationBars["本文表示テスト"].waitForExistence(timeout: 45))
            let count = try singleHittableControl(app.staticTexts.matching(identifier: "library-article-count"),
                                                  name: "fixture article count")
            XCTAssertEqual(count.label, "全1記事")
        }
        try openFixtureLibrary()
        let article = element("library-article-test-fixtures/native-reader")
        requireHittable(article)
        article.tap()
        requireNativeBody()
        goToContents("CASE-INTRABLOCK-01", headingID: "case-intrablock-01")
        let reader = app.scrollViews["native-reader"]
        let tables = reader.scrollViews.matching(NSPredicate(format:
            "identifier BEGINSWITH %@ AND label CONTAINS %@", "native-table-", "データ40行、2列"))
        XCTAssertTrue(tables.firstMatch.waitForExistence(timeout: 10))
        XCTAssertEqual(tables.count, 1, "The fixture must expose exactly one forty-row block")
        let table = tables.element(boundBy: 0)
        let blockID = String(table.identifier.dropFirst("native-table-".count))
        XCTAssertFalse(blockID.isEmpty)
        let middle = element("native-table-cell-\(blockID)-25-1")
        for _ in 0..<18 where !isHittableOnScreen(middle, inside: reader, fullyVisible: true) {
            reader.swipeUp(velocity: .slow)
        }
        requireHittable(middle, inside: reader, fullyVisible: true)
        XCTAssertEqual(middle.label, "INTRABLOCK-R25")
        let originalY = middle.frame.minY
        let rowHeight = middle.frame.height
        XCTAssertTrue(originalY.isFinite && rowHeight.isFinite && rowHeight > 0)
        capture("Intra-block-middle-before-departure")
        let back = app.navigationBars["ネイティブ本文テスト専用記事"].buttons.element(boundBy: 0)
        requireHittable(back)
        back.tap()
        let leftReader = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            !self.app.scrollViews["native-reader"].exists
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [leftReader], timeout: 10), .completed)
        XCTAssertTrue(app.navigationBars["本文表示テスト"].exists)
        app.terminate()
        app.launch()
        XCTAssertTrue(app.staticTexts["library-article-count"].waitForExistence(timeout: 45))
        try openFixtureLibrary()
        let resume = try singleHittableControl(app.buttons.matching(identifier: "library-resume"), name: "fixture resume")
        resume.tap()
        XCTAssertTrue(reader.waitForExistence(timeout: 20))
        XCTAssertTrue(app.navigationBars["ネイティブ本文テスト専用記事"].waitForExistence(timeout: 10))
        // No corrective scrolling or TOC operation after restart may hide a
        // top-only restore. The same row must already be near the old viewport.
        requireHittable(middle, inside: reader, fullyVisible: true)
        XCTAssertEqual(middle.label, "INTRABLOCK-R25")
        XCTAssertLessThanOrEqual(abs(middle.frame.minY - originalY), rowHeight,
                                "Same-layout restoration must stay within the previously measured row height")
        XCTAssertFalse(hasVisibleFrame(element("native-table-cell-\(blockID)-1-1"), inside: reader))
        capture("Intra-block-middle-after-relaunch")
        app.navigationBars["ネイティブ本文テスト専用記事"].buttons.element(boundBy: 0).tap()
        XCTAssertTrue(app.navigationBars["本文表示テスト"].waitForExistence(timeout: 10))
        closePublicSheet("本文表示テスト")
    }

    func testFixtureFirstCodeCopyUsesThePublicButton() throws {
        try setLearningTagAndArticleQuery(tag: "transformer", query: "Transformer")
        try openFilteredMoreActionsSheet()
        let fixtureAction = app.buttons["本文表示テスト"]
        requireHittable(fixtureAction)
        fixtureAction.tap()
        XCTAssertTrue(app.navigationBars["本文表示テスト"].waitForExistence(timeout: 45))
        let count = try singleHittableControl(app.staticTexts.matching(identifier: "library-article-count"),
                                              name: "fixture article count")
        XCTAssertEqual(count.label, "全1記事")
        let article = element("library-article-test-fixtures/native-reader")
        requireHittable(article)
        article.tap()
        let reader = app.scrollViews["native-reader"]
        XCTAssertTrue(reader.waitForExistence(timeout: 20))
        XCTAssertTrue(app.navigationBars["ネイティブ本文テスト専用記事"].waitForExistence(timeout: 10))
        goToContents("CASE-CODE-01", headingID: "case-code-01")
        let texts = reader.staticTexts.matching(NSPredicate(format:
            "identifier BEGINSWITH %@ AND label CONTAINS %@", "native-code-text-", "BEGIN-COPY-01"))
        XCTAssertTrue(texts.firstMatch.waitForExistence(timeout: 10))
        XCTAssertEqual(texts.count, 1, "Exactly one code block must contain the independent copy marker")
        let codeText = texts.element(boundBy: 0)
        let blockID = String(codeText.identifier.dropFirst("native-code-text-".count))
        XCTAssertFalse(blockID.isEmpty)
        let copy = app.buttons["native-code-copy-" + blockID]
        for _ in 0..<8 where !isHittableOnScreen(copy, inside: reader, fullyVisible: true) {
            reader.swipeUp(velocity: .slow)
        }
        requireHittable(copy, inside: reader, fullyVisible: true)
        XCTAssertEqual(copy.label, "コードをコピー")
        XCTAssertEqual(copy.value as? String, "未コピー")
        copy.tap()
        let copied = NSPredicate(format: "value == %@", "コピー済み")
        let copiedState = XCTNSPredicateExpectation(predicate: copied, object: copy)
        XCTAssertEqual(XCTWaiter.wait(for: [copiedState], timeout: 10), .completed,
                       "The public button must execute its copy action")
        capture("First-fixture-code-copy-public-button")
        // The fixture reading domain is shared across cases. Leave it at a
        // paragraph through public UI, so later tests need no state injection.
        goToContents("CASE-INLINE-01", headingID: "case-inline-01")
        let back = app.navigationBars["ネイティブ本文テスト専用記事"].buttons.element(boundBy: 0)
        requireHittable(back)
        back.tap()
        XCTAssertTrue(app.navigationBars["本文表示テスト"].waitForExistence(timeout: 10))
        closePublicSheet("本文表示テスト")
    }
}
