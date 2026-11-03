import XCTest

/// Runs only against the dedicated job's physically incomplete bundled package.
/// App routing and the ordinary Native/Published smoke cases remain unchanged.
final class FailureReaderUITests: NativeReaderUITestCase {
    override func tearDownWithError() throws {
        // Finish the deliberately broken App before the separate upgrade stage
        // replaces its bundle. The next stage must launch the restored install.
        if let application = app {
            application.terminate()
            XCTAssertEqual(application.state, .notRunning,
                           "The missing-package App must stop before the restored upgrade")
        }
        try super.tearDownWithError()
    }

    func testMissingBundledArticleShowsErrorAndRetryRemainsUsable() throws {
        let title = app.staticTexts["コンテンツを読み込めません"]
        let reason = app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@",
            "ファイル一覧と実際の内容が一致しません。")).firstMatch
        let retry = app.buttons["再試行"]
        XCTAssertTrue(title.waitForExistence(timeout: 20))
        XCTAssertTrue(reason.waitForExistence(timeout: 5), "The real package validation failure must explain the initial error")
        requireHittable(title)
        requireHittable(retry)
        XCTAssertTrue(retry.isEnabled)
        XCTAssertFalse(app.staticTexts["library-article-count"].exists)
        XCTAssertFalse(app.scrollViews["native-reader"].exists)
        XCTAssertFalse(app.staticTexts["記事が見つかりません"].exists)
        capture("Missing-package-initial-error")

        retry.tap()
        let availableAgain = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            title.exists && reason.exists && retry.exists && retry.isEnabled && self.isHittableOnScreen(retry)
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [availableAgain], timeout: 15), .completed)
        XCTAssertEqual(app.state, .runningForeground)
        requireHittable(title)
        requireHittable(retry)
        XCTAssertFalse(app.staticTexts["library-article-count"].exists)
        XCTAssertFalse(app.scrollViews["native-reader"].exists)
        XCTAssertFalse(app.alerts["コンテンツ"].exists)
        capture("Missing-package-error-after-retry")
        // This observes a retry tap followed by an intact failure UI. A later
        // healthy install is a separate stage, not same-process repaired retry.
    }
}
