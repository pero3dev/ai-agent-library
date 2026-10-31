import XCTest

final class ReadingRecoveryUITests: NativeReaderUITestCase {
    override var seedsPartialReadingRecovery: Bool { true }
    override var recordsReadingRecoveryOpenBoundaries: Bool { true }

    private let partialMessage = "保存した読書記録の一部を読み取れません。読み取れるしおりと読書位置を表示しています。"
    private let recoveryNoticeMessage = "復旧するまで、今回のしおりや読書位置の変更はアプリ終了後に残りません。"
    private let recoveryTitle = "読み取れる記録で復旧しますか？"
    private let recoveryMessage = "元の保存データを端末内に退避してから、読み取れた記録と今回の変更を保存します。読み取れない記録は利用できません。"
    private let confirmLabel = "復旧して記録の保存を再開"

    private var recoveryButtons: XCUIElementQuery {
        app.buttons.matching(NSPredicate(format: "label == %@", "読み取れる記録で復旧"))
    }

    private var recoverySheets: XCUIElementQuery {
        app.sheets.matching(NSPredicate(format: "label == %@", recoveryTitle))
    }

    func testCancelKeepsRecoveryNoticeAfterRelaunch() throws {
        requireRecoveryNotice()
        requireBookmarkedArticle("Agent ループ", id: "01-concepts/agent-loop")
        returnToLibrary()

        let dialog = presentRecoveryConfirmation()
        let cancel = dialog.buttons["キャンセル"]
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

        let dialog = presentRecoveryConfirmation()
        let confirm = dialog.buttons[confirmLabel]
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

    func testRestoreFilePickerCancelKeepsHealthyBookmarksAfterRelaunch() throws {
        let dialog = presentRecoveryConfirmation()
        dialog.buttons[confirmLabel].tap()
        waitForRecoveryDialogToClose()
        requireNoRecoveryNotice()
        requireBookmarkedArticle("Agent ループ", id: "01-concepts/agent-loop")
        returnToLibrary()

        let more = app.buttons.matching(NSPredicate(format: "label == %@", "その他の操作")).firstMatch
        requireHittable(more)
        more.tap()
        let restore = app.buttons["library-restore-reading"]
        XCTAssertTrue(restore.waitForExistence(timeout: 10))
        requireHittable(restore)
        restore.tap()

        let choose = app.buttons["reading-restore-choose-file"]
        XCTAssertTrue(choose.waitForExistence(timeout: 10))
        requireHittable(choose)
        requireNoRetainedBeforeRestore()
        XCTAssertFalse(app.buttons["reading-restore-review"].exists)
        let previousNavigationIDs = Set(app.navigationBars.allElementsBoundByIndex
            .map(\.identifier).filter { !$0.isEmpty })
        choose.tap()

        let pickerBars = app.navigationBars.matching(
            identifier: "FullDocumentManagerViewControllerNavigationBar")
        XCTAssertTrue(pickerBars.firstMatch.waitForExistence(timeout: 30))
        let picker = try requireNewReadingRestorePicker(after: previousNavigationIDs)
        let pickerCancel = picker.cancel
        pickerCancel.tap()
        let pickerClosed = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            self.isHittableOnScreen(choose) && !picker.bar.exists && !pickerCancel.exists
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [pickerClosed], timeout: 15), .completed)
        requireNoRetainedBeforeRestore()
        XCTAssertFalse(app.buttons["reading-restore-review"].exists)
        let close = app.buttons["reading-restore-close"]
        requireHittable(close)
        close.tap()
        waitForLibrary()
        requireHittable(app.staticTexts["library-article-count"])

        relaunchSameSuite()
        requireNoRecoveryNotice()
        requireBookmarkedArticle("Agent ループ", id: "01-concepts/agent-loop")
    }

    func testConfirmedRecoveryPreservesCurrentPositionAndBookmarkAfterRelaunch() throws {
        requireRecoveryNotice()
        open("Transformer アーキテクチャ詳解", articleID: "11-llm-internals/transformer-architecture")
        let addBookmark = app.buttons["しおりを追加"]
        XCTAssertTrue(addBookmark.waitForExistence(timeout: 10))
        requireHittable(addBookmark)
        addBookmark.tap()
        XCTAssertTrue(app.buttons["しおりを削除"].waitForExistence(timeout: 10))
        goToContents("自己注意の数式", headingID: "自己注意の数式")
        returnToLibrary()

        let clear = app.buttons["library-clear-filters"]
        for _ in 0..<8 where !isHittableOnScreen(clear) { app.swipeDown(velocity: .slow) }
        requireHittable(clear)
        clear.tap()
        // Resume has no heading/search route. Prove the live saved position
        // before recovery; a visible TOC destination alone is not a writer ack.
        let liveResume = element("library-resume")
        requireHittable(liveResume)
        liveResume.tap()
        requireNativeBody()
        XCTAssertTrue(app.buttons["しおりを削除"].waitForExistence(timeout: 10))
        requireHittable(app.staticTexts["native-heading-自己注意の数式"],
                        inside: app.scrollViews["native-reader"], fullyVisible: true)
        returnToLibrary()

        let dialog = presentRecoveryConfirmation()
        let confirm = dialog.buttons[confirmLabel]
        requireHittable(confirm)
        confirm.tap()
        waitForRecoveryDialogToClose()
        requireNoRecoveryNotice()

        relaunchSameSuite()
        requireNoRecoveryNotice()
        // Open no other article and issue no TOC request after confirmation.
        let savedResume = element("library-resume")
        requireHittable(savedResume)
        savedResume.tap()
        requireNativeBody()
        XCTAssertTrue(app.buttons["しおりを削除"].waitForExistence(timeout: 10))
        requireHittable(app.staticTexts["native-heading-自己注意の数式"],
                        inside: app.scrollViews["native-reader"], fullyVisible: true)
    }

    func testExportFilePickerCancelKeepsHealthyPositionAndBookmarkAfterRelaunch() throws {
        requireRecoveryNotice()
        open("Transformer アーキテクチャ詳解", articleID: "11-llm-internals/transformer-architecture")
        let addBookmark = app.buttons["しおりを追加"]
        XCTAssertTrue(addBookmark.waitForExistence(timeout: 10))
        requireHittable(addBookmark)
        addBookmark.tap()
        XCTAssertTrue(app.buttons["しおりを削除"].waitForExistence(timeout: 10))
        goToContents("自己注意の数式", headingID: "自己注意の数式")
        returnToLibrary()

        let clear = app.buttons["library-clear-filters"]
        for _ in 0..<8 where !isHittableOnScreen(clear) { app.swipeDown(velocity: .slow) }
        requireHittable(clear)
        clear.tap()
        try finishLibrarySearchBeforeExportResume()
        let liveResume = element("library-resume")
        requireHittable(liveResume)
        liveResume.tap()
        requireNativeBody()
        XCTAssertTrue(app.buttons["しおりを削除"].waitForExistence(timeout: 10))
        requireHittable(app.staticTexts["native-heading-自己注意の数式"],
                        inside: app.scrollViews["native-reader"], fullyVisible: true)
        returnToLibrary()

        let dialog = presentRecoveryConfirmation()
        let confirm = dialog.buttons[confirmLabel]
        requireHittable(confirm)
        confirm.tap()
        waitForRecoveryDialogToClose()
        requireNoRecoveryNotice()

        // Only cancellation is exercised. Never tap Save, choose a provider or
        // supply a file URL. Reopening also checks that cancellation clears presentation.
        for attempt in 1...2 {
            try cancelReadingBackupExport(attempt: attempt)
            requireNoRecoveryNotice()
            XCTAssertFalse(app.alerts["読書記録"].exists, "Cancellation must not report an export error")
        }

        relaunchSameSuite()
        requireNoRecoveryNotice()
        // No article or TOC navigation intervenes after the recovered position.
        let savedResume = element("library-resume")
        requireHittable(savedResume)
        savedResume.tap()
        requireNativeBody()
        XCTAssertTrue(app.buttons["しおりを削除"].waitForExistence(timeout: 10))
        requireHittable(app.staticTexts["native-heading-自己注意の数式"],
                        inside: app.scrollViews["native-reader"], fullyVisible: true)
    }

    /// Clearing the query leaves the observed public search session active.
    /// End that session once, before resuming; never substitute another More selector.
    private func finishLibrarySearchBeforeExportResume() throws {
        readingExportLastContext = "phase=finish-public-library-search"
        let bars = app.navigationBars.matching(identifier: "AI Agent Library")
        let bar = bars.element(boundBy: 0)
        let searches = bar.searchFields.matching(NSPredicate(format: "label == %@", "記事の本文を検索"))
        let cancels = bar.buttons.matching(NSPredicate(format: "label == %@", "キャンセル"))
        let active = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            bars.count == 1 && searches.count == 1 && cancels.count == 1 &&
                self.isHittableOnScreen(searches.element(boundBy: 0), fullyVisible: true) &&
                self.isHittableOnScreen(cancels.element(boundBy: 0), fullyVisible: true)
        }, object: nil)
        guard XCTWaiter.wait(for: [active], timeout: 15) == .completed,
              bars.count == 1, searches.count == 1, cancels.count == 1 else {
            throw readingExportFailure("Expected one foreground library search field and its unique public Cancel", attempt: 0)
        }
        let search = searches.element(boundBy: 0), cancel = cancels.element(boundBy: 0)
        let appFrame = app.frame, barFrame = bar.frame
        let searchFrame = search.frame, cancelFrame = cancel.frame
        guard [appFrame, barFrame, searchFrame, cancelFrame].allSatisfy({
            !$0.isNull && !$0.isInfinite && $0.minX.isFinite && $0.minY.isFinite &&
                $0.width.isFinite && $0.height.isFinite && $0.width > 0 && $0.height > 0
        }), appFrame.contains(barFrame), barFrame.contains(searchFrame), barFrame.contains(cancelFrame),
             search.exists, cancel.exists, cancel.isEnabled, cancel.isHittable else {
            throw readingExportFailure("The public search cancellation no longer belongs to the visible library bar", attempt: 0)
        }
        cancel.tap()
        let more = app.buttons.matching(NSPredicate(format: "label == %@", "その他の操作"))
        let finished = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            cancels.count == 0 && more.count == 1 &&
                self.isHittableOnScreen(more.element(boundBy: 0), fullyVisible: true)
        }, object: nil)
        guard XCTWaiter.wait(for: [finished], timeout: 15) == .completed else {
            throw readingExportFailure("The public search did not close to one usable unfiltered More control", attempt: 0)
        }
    }

    private var readingExportLastContext = "phase=not-started"

    private struct ReadingExportPicker {
        let bar: XCUIElement
        let cancel: XCUIElement
        let filename: XCUIElement
    }

    private func readingExportContextKey(_ bar: XCUIElement) -> String {
        bar.identifier + "\u{001F}" + bar.label
    }

    private func readingExportFilenameFields() -> XCUIElementQuery {
        app.textFields.matching(NSPredicate(format: "value == %@ OR value == %@",
            "AI-Agent-Library-Reading-Backup", "AI-Agent-Library-Reading-Backup.json"))
    }

    /// An unobserved system layout is a failure, never a reason to use any all-app Cancel.
    private func newReadingExportPickers(after previousContexts: Set<String>) -> [ReadingExportPicker] {
        let fields = readingExportFilenameFields().allElementsBoundByIndex.filter {
            $0.exists && $0.isEnabled && $0.isHittable
        }
        readingExportLastContext = "phase=filename; usableFilenameCount=\(fields.count)"
        guard fields.count == 1 else { return [] }
        let filename = fields[0]
        let cancelPredicate = NSPredicate(format: "label == %@ OR label == %@", "キャンセル", "Cancel")
        let savePredicate = NSPredicate(format: "label == %@ OR label == %@", "保存", "Save")
        return app.navigationBars.allElementsBoundByIndex.compactMap { candidate in
            guard candidate.exists, !previousContexts.contains(readingExportContextKey(candidate)) else { return nil }
            let identifier = candidate.identifier, label = candidate.label
            guard !identifier.isEmpty || !label.isEmpty else { return nil }
            // Rebind by the new exact context, not by an index that can retarget a background bar.
            let matchingBars = app.navigationBars.matching(NSPredicate(
                format: "identifier == %@ AND label == %@", identifier, label))
            guard matchingBars.count == 1 else { return nil }
            let bar = matchingBars.element(boundBy: 0)
            let cancels = bar.buttons.matching(cancelPredicate).allElementsBoundByIndex.filter {
                $0.exists && $0.isEnabled && $0.isHittable
            }
            // Save is a context witness only; a disabled Save is not executed either.
            let saves = bar.buttons.matching(savePredicate).allElementsBoundByIndex.filter { $0.exists }
            readingExportLastContext = "phase=new-bar; usableFilenameCount=1; usableCancelCount=\(cancels.count); saveCount=\(saves.count)"
            guard cancels.count == 1, saves.count == 1 else { return nil }
            let cancel = cancels[0], save = saves[0]
            let appFrame = app.frame, barFrame = bar.frame, cancelFrame = cancel.frame
            let saveFrame = save.frame, filenameFrame = filename.frame
            let frames = [appFrame, barFrame, cancelFrame, saveFrame, filenameFrame]
            guard frames.allSatisfy({
                !$0.isNull && !$0.isInfinite && $0.minX.isFinite && $0.minY.isFinite &&
                    $0.width.isFinite && $0.height.isFinite && $0.width > 0 && $0.height > 0
            }), appFrame.contains(barFrame), barFrame.contains(cancelFrame), barFrame.contains(saveFrame),
                 appFrame.contains(filenameFrame) else { return nil }
            return ReadingExportPicker(bar: bar, cancel: cancel, filename: filename)
        }
    }

    private func cancelReadingBackupExport(attempt: Int) throws {
        readingExportLastContext = "phase=opening"
        let more = app.buttons.matching(NSPredicate(format: "label == %@", "その他の操作")).firstMatch
        requireHittable(more)
        more.tap()
        let export = app.buttons["library-export-reading"]
        XCTAssertTrue(export.waitForExistence(timeout: 10))
        requireHittable(export)
        let previousContexts = Set(app.navigationBars.allElementsBoundByIndex.filter { $0.exists }
            .map { readingExportContextKey($0) })
        guard readingExportFilenameFields().count == 0 else {
            throw readingExportFailure("An export filename context was already present before opening", attempt: attempt)
        }
        export.tap()
        let ready = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            self.newReadingExportPickers(after: previousContexts).count == 1
        }, object: nil)
        guard XCTWaiter.wait(for: [ready], timeout: 30) == .completed else {
            throw readingExportFailure("Expected one new save context, its Save/Cancel pair and exact editable backup filename", attempt: attempt)
        }
        let identified = newReadingExportPickers(after: previousContexts)
        guard identified.count == 1 else {
            throw readingExportFailure("The new save context became missing or ambiguous before cancellation", attempt: attempt)
        }
        let picker = identified[0]
        picker.cancel.tap()
        let closed = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            !picker.bar.exists && !picker.cancel.exists && !picker.filename.exists &&
                self.isHittableOnScreen(self.app.staticTexts["library-article-count"])
        }, object: nil)
        guard XCTWaiter.wait(for: [closed], timeout: 15) == .completed else {
            throw readingExportFailure("The identified save context did not close back to the usable library", attempt: attempt)
        }
    }

    private func readingExportFailure(_ reason: String, attempt: Int) -> NSError {
        // A throwing failure ends this case. Retain one screenshot plus only
        // fixed context and counts already sampled by the assertions; do not query a hierarchy.
        capture("Reading-export-cancel-\(attempt)-failed")
        let context = String(decoding: ("attempt=\(attempt)\n" + reason + "\n" + readingExportLastContext)
            .utf8.prefix(1024), as: UTF8.self)
        let attachment = XCTAttachment(string: context)
        attachment.name = "Reading-export-cancel-context"
        attachment.lifetime = .keepAlways
        add(attachment)
        XCTFail(reason)
        return NSError(domain: "ReadingRecoveryUITests", code: 2,
                       userInfo: [NSLocalizedDescriptionKey: reason])
    }


    /// The observed system picker must be new; background search cancellation is excluded.
    private func requireNewReadingRestorePicker(after previousIDs: Set<String>) throws
        -> (bar: XCUIElement, cancel: XCUIElement) {
        // Observed in this JSON-picker failure on iOS 18.5, not inferred from any new bar.
        let identifier = "FullDocumentManagerViewControllerNavigationBar"
        let query = app.navigationBars.matching(identifier: identifier)
        let cancelPredicate = NSPredicate(format: "label == %@ OR label == %@", "キャンセル", "Cancel")
        func usableCancels() -> [XCUIElement] {
            guard !previousIDs.contains(identifier), query.count == 1 else { return [] }
            let bar = query.element(boundBy: 0)
            guard bar.exists else { return [] }
            return bar.buttons.matching(cancelPredicate).allElementsBoundByIndex.filter {
                $0.exists && $0.isEnabled && $0.isHittable
            }
        }
        func failure(_ reason: String) -> NSError {
            capture("Reading-restore-picker-not-identified")
            let attachment = XCTAttachment(string: reason + "\n" + app.debugDescription)
            attachment.name = "Reading-restore-picker-context"
            attachment.lifetime = .keepAlways
            add(attachment)
            XCTFail(reason)
            return NSError(domain: "ReadingRecoveryUITests", code: 1,
                           userInfo: [NSLocalizedDescriptionKey: reason])
        }
        let ready = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            usableCancels().count == 1
        }, object: nil)
        guard XCTWaiter.wait(for: [ready], timeout: 15) == .completed else {
            throw failure("Expected one new document-picker bar and one enabled hittable cancellation inside it")
        }
        // Rebind the same observed identifier after readiness; never use all-app firstMatch.
        guard !previousIDs.contains(identifier), query.count == 1 else {
            throw failure("The newly presented document-picker context became missing or ambiguous")
        }
        let bar = query.element(boundBy: 0)
        guard bar.exists else {
            throw failure("The unique document-picker bar disappeared before cancellation")
        }
        let usable = bar.buttons.matching(cancelPredicate).allElementsBoundByIndex.filter {
            $0.exists && $0.isEnabled && $0.isHittable
        }
        guard usable.count == 1 else {
            throw failure("Cancellation became missing or ambiguous inside the document-picker bar")
        }
        let cancel = usable[0]
        // Sequential AX observations, not an atomic snapshot; read each frame once.
        let barFrame = bar.frame, appFrame = app.frame, cancelFrame = cancel.frame
        let framesAreValid = [barFrame, appFrame, cancelFrame].allSatisfy {
            $0.minX.isFinite && $0.minY.isFinite && $0.width.isFinite && $0.height.isFinite &&
                $0.width > 0 && $0.height > 0
        }
        guard bar.exists, bar.identifier == identifier, !previousIDs.contains(bar.identifier),
              cancel.exists, cancel.isEnabled, cancel.isHittable, framesAreValid,
              appFrame.contains(barFrame), barFrame.contains(cancelFrame) else {
            throw failure("Cancellation no longer belongs to the new on-screen document-picker bar")
        }
        return (bar, cancel)
    }

    private func requireNoRetainedBeforeRestore() {
        let messages = app.staticTexts.matching(NSPredicate(
            format: "label == %@", "保全した復元前データはありません。"))
        XCTAssertTrue(messages.firstMatch.waitForExistence(timeout: 10))
        XCTAssertEqual(messages.count, 1, "Expected one public no-retained message")
        XCTAssertFalse(app.staticTexts["reading-restore-retention-error"].exists)
    }

    private func waitForLibrary() {
        XCTAssertTrue(app.staticTexts["library-article-count"].waitForExistence(timeout: 45))
    }

    private func requireRecoveryNotice() {
        waitForLibrary()
        let recovery = recoveryButtons.firstMatch
        for _ in 0..<8 where !isHittableOnScreen(recovery) { app.swipeDown(velocity: .slow) }
        requireHittable(recovery)
        XCTAssertEqual(recoveryButtons.count, 1, "Expected one public recovery Button")
        XCTAssertTrue(app.staticTexts[partialMessage].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts[recoveryNoticeMessage].exists)
    }

    private func presentRecoveryConfirmation() -> XCUIElement {
        requireRecoveryNotice()
        recoveryButtons.firstMatch.tap()
        let dialog = recoverySheets.firstMatch
        XCTAssertTrue(dialog.staticTexts[recoveryTitle].waitForExistence(timeout: 5))
        XCTAssertEqual(recoverySheets.count, 1, "Expected one public recovery Sheet")
        XCTAssertTrue(dialog.staticTexts[recoveryMessage].exists)
        let confirm = dialog.buttons.matching(NSPredicate(format: "label == %@", confirmLabel))
        requireHittable(confirm.firstMatch)
        XCTAssertEqual(confirm.count, 1, "Expected one confirm Button inside the recovery Sheet")
        let cancel = dialog.buttons.matching(NSPredicate(format: "label == %@", "キャンセル"))
        requireHittable(cancel.firstMatch)
        XCTAssertEqual(cancel.count, 1, "Expected one cancel Button inside the recovery Sheet")
        return dialog
    }

    private func waitForRecoveryDialogToClose() {
        let closed = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            self.recoverySheets.count == 0 && !self.app.buttons[self.confirmLabel].exists
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [closed], timeout: 10), .completed)
    }

    private func requireNoRecoveryNotice() {
        waitForLibrary()
        let absent = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            self.recoveryButtons.count == 0 &&
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
