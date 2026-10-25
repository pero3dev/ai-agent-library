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
        requireHittable(app.staticTexts["native-heading-世代交代で見直すこと"])
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
}
