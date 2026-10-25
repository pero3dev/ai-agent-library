import XCTest

/// Shared public-UI actions for both the three-article baseline and the full catalog.
/// Waits and gesture limits synchronize tests; they are not performance targets.
class NativeReaderUITestCase: XCTestCase {
    private(set) var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchEnvironment["AILIBRARY_UI_TEST_SUITE"] = "ailibrary-uitest-" + UUID().uuidString
        app.launchArguments = ["-AppleLanguages", "(ja)", "-AppleLocale", "ja_JP"]
        app.launch()
    }

    func element(_ identifier: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }

    func requireHittable(_ element: XCUIElement, timeout: TimeInterval = 15,
                         file: StaticString = #filePath, line: UInt = #line) {
        let visible = XCTNSPredicateExpectation(predicate: NSPredicate(format: "hittable == true"), object: element)
        XCTAssertEqual(XCTWaiter.wait(for: [visible], timeout: timeout), .completed,
                       "The requested public UI element must be visible and usable", file: file, line: line)
    }

    func open(_ title: String, articleID: String, query: String? = nil) {
        XCTAssertTrue(app.staticTexts["library-article-count"].waitForExistence(timeout: 45))
        let search = app.searchFields.firstMatch
        for _ in 0..<8 where !search.isHittable { app.swipeDown(velocity: .slow) }
        requireHittable(search)
        search.tap()
        if let value = search.value as? String, !value.isEmpty, value != search.placeholderValue {
            let clear = search.buttons.firstMatch
            XCTAssertTrue(clear.waitForExistence(timeout: 5), "The previous article query must be cleared")
            clear.tap()
        }
        search.typeText((query ?? title) + "\n")

        let row = element("library-article-" + articleID)
        for _ in 0..<12 {
            if row.exists && row.isHittable { break }
            app.swipeUp(velocity: .slow)
        }
        requireHittable(row)
        row.tap()
        requireNativeBody()
    }

    func requireNativeBody() {
        XCTAssertTrue(app.scrollViews["native-reader"].waitForExistence(timeout: 20))
        let paragraph = app.staticTexts.matching(NSPredicate(format: "identifier BEGINSWITH %@", "native-text-")).firstMatch
        XCTAssertTrue(paragraph.waitForExistence(timeout: 10), "Native body text must appear, beyond the navigation title")
        XCTAssertFalse(paragraph.label.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
    }

    func goToContents(_ title: String, headingID: String) {
        app.buttons["目次"].tap()
        XCTAssertTrue(app.navigationBars["目次"].waitForExistence(timeout: 5))
        let target = app.buttons[title].firstMatch
        for _ in 0..<18 {
            if target.exists && target.isHittable { break }
            app.swipeUp(velocity: .slow)
        }
        requireHittable(target)
        target.tap()
        requireHittable(app.staticTexts["native-heading-" + headingID])
    }

    func returnToLibrary() {
        app.navigationBars.buttons.element(boundBy: 0).tap()
        XCTAssertTrue(app.staticTexts["library-article-count"].waitForExistence(timeout: 10))
    }

    func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}

final class NativeReaderUITests: NativeReaderUITestCase {
    func testThreeArticlesHaveNativeBodyText() throws {
        // Chapters 01 and 11 remain covered in both the baseline and full-catalog jobs.
        for (id, title) in [("01-concepts/agent-loop", "Agent ループ"),
                            ("01-concepts/tool-use", "ツール使用(Tool Use / Function Calling)"),
                            ("11-llm-internals/transformer-architecture", "Transformer アーキテクチャ詳解")] {
            open(title, articleID: id)
            capture(title)
            returnToLibrary()
        }
    }

    func testContentsBookmarkAndResumeAfterRelaunch() throws {
        open("Transformer アーキテクチャ詳解", articleID: "11-llm-internals/transformer-architecture")
        app.buttons["しおりを追加"].tap()
        goToContents("自己注意の数式", headingID: "自己注意の数式")
        capture("Transformer-native-math")
        // Leaving flushes the pending position. Relaunch clears only the transient search query.
        returnToLibrary()
        app.terminate()
        app.launch()
        let resume = element("library-resume")
        XCTAssertTrue(resume.waitForExistence(timeout: 45))
        resume.tap()
        XCTAssertTrue(app.buttons["しおりを削除"].waitForExistence(timeout: 10))
        requireHittable(app.staticTexts["native-heading-自己注意の数式"])
        capture("Native-resume")
    }
}
