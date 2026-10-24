import XCTest

final class NativeReaderUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchEnvironment["AILIBRARY_UI_TEST_SUITE"] = "ailibrary-uitest-" + UUID().uuidString
        app.launchArguments = ["-AppleLanguages", "(ja)", "-AppleLocale", "ja_JP"]
        app.launch()
    }

    private func open(_ title: String) {
        let row = app.staticTexts[title].firstMatch
        XCTAssertTrue(row.waitForExistence(timeout: 20))
        if !row.isHittable { app.swipeUp() }
        row.tap()
        XCTAssertTrue(app.scrollViews["native-reader"].waitForExistence(timeout: 15))
        let paragraph = app.staticTexts.matching(NSPredicate(format: "identifier BEGINSWITH %@", "native-text-")).firstMatch
        XCTAssertTrue(paragraph.waitForExistence(timeout: 10), "Native body text must appear, beyond the navigation title")
        XCTAssertFalse(paragraph.label.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
    }

    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    func testThreeArticlesHaveNativeBodyText() throws {
        for title in ["Agent ループ", "ツール使用(Tool Use / Function Calling)", "Transformer アーキテクチャ詳解"] {
            open(title)
            capture(title)
            app.navigationBars.buttons.element(boundBy: 0).tap()
        }
    }

    func testContentsBookmarkAndResumeAfterRelaunch() throws {
        open("Transformer アーキテクチャ詳解")
        app.buttons["しおりを追加"].tap()
        app.buttons["目次"].tap()
        let target = app.buttons["自己注意の数式"]
        for _ in 0..<6 where !target.isHittable { app.swipeUp() }
        XCTAssertTrue(target.waitForExistence(timeout: 5))
        target.tap()
        let heading = app.staticTexts["native-heading-自己注意の数式"]
        let visible = NSPredicate(format: "hittable == true")
        expectation(for: visible, evaluatedWith: heading)
        waitForExpectations(timeout: 10)
        capture("Transformer-native-math")
        // Leaving the reader flushes its pending reading-position save.
        app.navigationBars.buttons.element(boundBy: 0).tap()
        app.terminate()
        app.launch()
        let resume = app.staticTexts["続きを読む"]
        XCTAssertTrue(resume.waitForExistence(timeout: 20))
        resume.tap()
        XCTAssertTrue(app.buttons["しおりを削除"].waitForExistence(timeout: 10))
        expectation(for: visible, evaluatedWith: app.staticTexts["native-heading-自己注意の数式"])
        waitForExpectations(timeout: 10)
        capture("Native-resume")
    }
}
