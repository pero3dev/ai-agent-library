import XCTest

final class ReadingRecoveryUITests: NativeReaderUITestCase {
    override var seedsPartialReadingRecovery: Bool { true }

    private let partialMessage = "保存した読書記録の一部を読み取れません。読み取れるしおりと読書位置を表示しています。"
    private let recoveryNoticeMessage = "復旧するまで、今回のしおりや読書位置の変更はアプリ終了後に残りません。"
    private let recoveryTitle = "読み取れる記録で復旧しますか？"
    private let recoveryMessage = "元の保存データを端末内に退避してから、読み取れた記録と今回の変更を保存します。読み取れない記録は利用できません。"
    private let confirmLabel = "復旧して記録の保存を再開"

    func testCancelKeepsRecoveryNoticeAfterRelaunch() throws {
        requireRecoveryNotice()
        requireBookmarkedArticle("Agent ループ", id: "01-concepts/agent-loop")
        returnToLibrary()

        presentRecoveryConfirmation()
        let cancel = app.buttons["キャンセル"]
        requireHittable(cancel)
        cancel.tap()
        waitForRecoveryDialogToClose()
        requireRecoveryNotice()

        relaunchSameSuite()
        requireRecoveryNotice()
        requireBookmarkedArticle("Agent ループ", id: "01-concepts/agent-loop")
    }

    func testConfirmedRecoveryPreservesReadableAndCurrentBookmarksAfterRelaunch() throws {
        requireRecoveryNotice()
        requireBookmarkedArticle("Agent ループ", id: "01-concepts/agent-loop")
        returnToLibrary()

        open("ツール使用(Tool Use / Function Calling)", articleID: "01-concepts/tool-use")
        let addBookmark = app.buttons["しおりを追加"]
        XCTAssertTrue(addBookmark.waitForExistence(timeout: 10))
        requireHittable(addBookmark)
        addBookmark.tap()
        XCTAssertTrue(app.buttons["しおりを削除"].waitForExistence(timeout: 10))
        returnToLibrary()

        presentRecoveryConfirmation()
        let confirm = app.buttons[confirmLabel]
        requireHittable(confirm)
        confirm.tap()
        waitForRecoveryDialogToClose()
        requireNoRecoveryNotice()

        relaunchSameSuite()
        requireNoRecoveryNotice()
        requireBookmarkedArticle("Agent ループ", id: "01-concepts/agent-loop")
        returnToLibrary()
        requireBookmarkedArticle("ツール使用(Tool Use / Function Calling)", id: "01-concepts/tool-use")
    }

    private func waitForLibrary() {
        XCTAssertTrue(app.staticTexts["library-article-count"].waitForExistence(timeout: 45))
    }

    private func requireRecoveryNotice() {
        waitForLibrary()
        let recovery = element("library-reading-recovery")
        for _ in 0..<8 where !isHittableOnScreen(recovery) { app.swipeDown(velocity: .slow) }
        requireHittable(recovery)
        XCTAssertTrue(app.staticTexts[partialMessage].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts[recoveryNoticeMessage].exists)
    }

    private func presentRecoveryConfirmation() {
        requireRecoveryNotice()
        element("library-reading-recovery").tap()
        XCTAssertTrue(app.staticTexts[recoveryTitle].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts[recoveryMessage].exists)
        requireHittable(app.buttons[confirmLabel])
        requireHittable(app.buttons["キャンセル"])
    }

    private func waitForRecoveryDialogToClose() {
        let closed = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            !self.app.buttons[self.confirmLabel].exists
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [closed], timeout: 10), .completed)
    }

    private func requireNoRecoveryNotice() {
        waitForLibrary()
        let absent = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            !self.element("library-reading-recovery").exists &&
                !self.app.staticTexts[self.partialMessage].exists &&
                !self.app.staticTexts[self.recoveryNoticeMessage].exists
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [absent], timeout: 10), .completed)
    }

    private func requireBookmarkedArticle(_ title: String, id: String) {
        open(title, articleID: id)
        XCTAssertTrue(app.buttons["しおりを削除"].waitForExistence(timeout: 10))
    }

    private func relaunchSameSuite() {
        let suite = app.launchEnvironment["AILIBRARY_UI_TEST_SUITE"]
        XCTAssertNotNil(suite)
        app.terminate()
        XCTAssertEqual(app.state, .notRunning)
        app.launch()
        XCTAssertEqual(app.launchEnvironment["AILIBRARY_UI_TEST_SUITE"], suite)
        waitForLibrary()
    }
}
