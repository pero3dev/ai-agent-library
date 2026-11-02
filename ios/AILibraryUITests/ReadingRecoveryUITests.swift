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
        // Use the supported filtered-list Button route, without reopening an article.
        try prepareFilteredLibraryForReadingExport()

        // Only cancellation is exercised. Never tap Save, choose a provider or
        // supply a file URL. Reopening also checks that cancellation clears presentation.
        var completedBrowseRootCancellation = false
        for attempt in 1...2 {
            completedBrowseRootCancellation = try cancelReadingBackupExport(
                attempt: attempt, permitsInitialBrowseRoot: attempt == 2 && completedBrowseRootCancellation)
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
        let finished = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            let cancelCount = cancels.count
            self.readingExportLastContext = "phase=finish-public-library-search; cancelCount=\(cancelCount)"
            return cancelCount == 0
        }, object: nil)
        guard XCTWaiter.wait(for: [finished], timeout: 15) == .completed else {
            throw readingExportFailure("The public search Cancel did not disappear after its single tap", attempt: 0)
        }
    }

    private var readingExportLastContext = "phase=not-started"

    private var readingExportHierarchyCaptured = false

    private struct ReadingExportPicker {
        let bar: XCUIElement
        let contextKey: String
        let action: XCUIElement
        let requiresBrowseBack: Bool
        let isBrowseRoot: Bool
        let filenames: [XCUIElement]
    }

    private func readingExportContextKey(_ bar: XCUIElement) -> String {
        bar.identifier + "\u{001F}" + bar.label
    }

    private func readingExportFilenameCandidates(in scope: XCUIElement) -> XCUIElementQuery {
        let names = ["AI-Agent-Library-Reading-Backup", "AI-Agent-Library-Reading-Backup.json"]
        return scope.descendants(matching: .any).matching(NSPredicate(format: "label IN %@ OR value IN %@", names, names))
    }

    private func readingExportFrameIsFinite(_ frame: CGRect) -> Bool {
        !frame.isNull && !frame.isInfinite && frame.minX.isFinite && frame.minY.isFinite &&
            frame.width.isFinite && frame.height.isFinite && frame.width > 0 && frame.height > 0
    }

    /// The observed bottom filename is a read-only witness, not necessarily an editable control.
    private func readingExportVisibleFilenames(in window: XCUIElement, below barFrame: CGRect,
                                              appFrame: CGRect, phase: String) -> [XCUIElement]? {
        readingExportLastContext = "phase=\(phase)-filename-query; directBarCount=1; windowCount=1"
        let query = readingExportFilenameCandidates(in: window)
        let matchCount = query.count
        readingExportLastContext = "phase=\(phase)-filename-count; directBarCount=1; windowCount=1; exactMatches=\(matchCount)"
        guard matchCount > 0, matchCount <= 16 else { return nil }
        let matches = query.allElementsBoundByIndex
        guard matches.count == matchCount, matches.count <= 16 else { return nil }
        let names = Set(["AI-Agent-Library-Reading-Backup", "AI-Agent-Library-Reading-Backup.json"])
        let windowFrame = window.frame
        guard readingExportFrameIsFinite(windowFrame), appFrame.contains(windowFrame) else { return nil }
        var witnesses: [XCUIElement] = []
        var distinctBounds = Set<String>()
        for candidate in matches {
            let type = candidate.elementType
            guard type == .textField || type == .textView || type == .staticText || type == .other,
                  candidate.exists else { continue }
            let label = candidate.label, value = candidate.value as? String
            guard names.contains(label) || value.map({ names.contains($0) }) == true else { continue }
            let frame = candidate.frame
            // Exact-name ancestors covering the whole sheet do not prove a visible bottom filename.
            guard readingExportFrameIsFinite(frame), appFrame.contains(frame), windowFrame.contains(frame),
                  frame.minY >= barFrame.maxY else { continue }
            // Coalesce nested views at identical physical bounds; no filename element is selected for execution.
            let boundsKey = [frame.minX, frame.minY, frame.width, frame.height]
                .map { String(Double($0)) }.joined(separator: ",")
            distinctBounds.insert(boundsKey)
            witnesses.append(candidate)
        }
        readingExportLastContext = "phase=\(phase)-filename-witness; exactMatches=\(matchCount); visibleElements=\(witnesses.count); distinctBounds=\(distinctBounds.count)"
        guard !witnesses.isEmpty, distinctBounds.count <= 8 else { return nil }
        return witnesses
    }

    /// An eligible destination-picker context must be new and provide its own public action.
    /// The observed system picker is selected directly, never by enumerating unrelated bars.
    private func newReadingExportPickers(after previousContexts: Set<String>, allowsBrowseRoot: Bool) -> [ReadingExportPicker] {
        let identifier = "FullDocumentManagerViewControllerNavigationBar"
        readingExportLastContext = "phase=destination-direct-query"
        let matchingBars = app.navigationBars.matching(identifier: identifier)
        let directBarCount = matchingBars.count
        readingExportLastContext = "phase=destination-direct-count; directBarCount=\(directBarCount)"
        guard directBarCount == 1 else { return [] }
        let bar = matchingBars.element(boundBy: 0)
        readingExportLastContext = "phase=destination-direct-exists; directBarCount=\(directBarCount)"
        guard bar.exists else { return [] }
        readingExportLastContext = "phase=destination-direct-identity; directBarCount=\(directBarCount)"
        let actualIdentifier = bar.identifier, label = bar.label
        let key = actualIdentifier + "\u{001F}" + label
        guard actualIdentifier == identifier, !previousContexts.contains(key) else { return [] }
        // The observed identifier is the selector; an unobserved/empty label is only a read-only key.
        let exactBar = NSPredicate(format: "identifier == %@", identifier)
        let cancelPredicate = NSPredicate(format: "label == %@ OR label == %@", "キャンセル", "Cancel")
        let browsePredicate = NSPredicate(format: "label == %@ OR label == %@", "ブラウズ", "Browse")
        let movePredicate = NSPredicate(format: "label == %@ OR label == %@", "移動", "Move")
        let moves = bar.buttons.matching(movePredicate)
        let cancels = bar.buttons.matching(cancelPredicate), backs = bar.buttons.matching(browsePredicate)
        readingExportLastContext = "phase=destination-action-query; directBarCount=\(directBarCount)"
        let moveCount = moves.count, cancelCount = cancels.count, backCount = backs.count
        readingExportLastContext = "phase=destination-action-count; directBarCount=\(directBarCount); moveCount=\(moveCount); cancelCount=\(cancelCount); browseBackCount=\(backCount); allowsBrowseRoot=\(allowsBrowseRoot)"
        let isMoveContext = moveCount == 1 && ((cancelCount == 1 && backCount == 0) || (cancelCount == 0 && backCount == 1))
        // Move0 is accepted only with explicit proof from an actual verified Browse-back in this test.
        let isBrowseRoot = allowsBrowseRoot && moveCount == 0 && cancelCount == 1 && backCount == 0
        guard isMoveContext || isBrowseRoot else { return [] }
        let phase = isBrowseRoot ? "browse-root" : "destination"
        let requiresBrowseBack = cancelCount == 0
        let action = requiresBrowseBack ? backs.element(boundBy: 0) : cancels.element(boundBy: 0)
        readingExportLastContext = "phase=\(phase)-action-geometry; directBarCount=\(directBarCount); cancelCount=\(cancelCount); browseBackCount=\(backCount)"
        let appFrame = app.frame, barFrame = bar.frame, actionFrame = action.frame
        guard bar.exists, action.exists, action.isEnabled, action.isHittable,
              [appFrame, barFrame, actionFrame].allSatisfy({ readingExportFrameIsFinite($0) }),
              appFrame.contains(barFrame), barFrame.contains(actionFrame) else { return [] }
        if isMoveContext {
            let move = moves.element(boundBy: 0), moveFrame = move.frame
            // Move remains a read-only context witness, never required enabled or tapped.
            guard move.exists, readingExportFrameIsFinite(moveFrame), barFrame.contains(moveFrame) else { return [] }
        }
        readingExportLastContext = "phase=\(phase)-window-query; directBarCount=\(directBarCount)"
        let windows = app.windows.containing(exactBar)
        let windowCount = windows.count
        readingExportLastContext = "phase=\(phase)-window-count; directBarCount=\(directBarCount); windowCount=\(windowCount)"
        guard windowCount == 1 else { return [] }
        let window = windows.element(boundBy: 0)
        readingExportLastContext = "phase=\(phase)-window-witness; directBarCount=\(directBarCount); windowCount=\(windowCount)"
        guard window.exists, window.navigationBars.matching(identifier: identifier).count == 1,
              window.frame.contains(barFrame),
              let filenames = readingExportVisibleFilenames(in: window, below: barFrame, appFrame: appFrame, phase: phase) else { return [] }
        return [ReadingExportPicker(bar: bar, contextKey: key, action: action,
                                    requiresBrowseBack: requiresBrowseBack, isBrowseRoot: isBrowseRoot, filenames: filenames)]
    }

    private func waitForReadingExportPicker(after previousContexts: Set<String>, deadline: TimeInterval,
                                            cancellationOnly: Bool, allowsBrowseRoot: Bool, attempt: Int) throws -> ReadingExportPicker {
        var identified: ReadingExportPicker?
        let ready = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            guard ProcessInfo.processInfo.systemUptime < deadline else { return false }
            let contexts = self.newReadingExportPickers(after: previousContexts, allowsBrowseRoot: allowsBrowseRoot)
            guard contexts.count == 1, !cancellationOnly || !contexts[0].requiresBrowseBack,
                  ProcessInfo.processInfo.systemUptime < deadline else { return false }
            identified = contexts[0]
            return true
        }, object: nil)
        let remaining = deadline - ProcessInfo.processInfo.systemUptime
        guard remaining > 0, XCTWaiter.wait(for: [ready], timeout: remaining) == .completed,
              ProcessInfo.processInfo.systemUptime < deadline, let picker = identified else {
            throw readingExportFailure("Expected one new destination or proven Browse-root context, exact filename and its own permitted action within the shared deadline", attempt: attempt)
        }
        return picker
    }

    private func currentReadingExportPicker(_ expected: ReadingExportPicker, after previousContexts: Set<String>,
                                           deadline: TimeInterval, attempt: Int) throws -> ReadingExportPicker {
        guard ProcessInfo.processInfo.systemUptime < deadline else {
            throw readingExportFailure("The shared destination-picker deadline expired before the public action [guard=deadline-before]", attempt: attempt)
        }
        // Recheck every context/Move/filename/action witness immediately before the sole scoped tap.
        let contexts = newReadingExportPickers(after: previousContexts, allowsBrowseRoot: expected.isBrowseRoot)
        // Preserve the original short circuit order; report only its first failed condition.
        guard contexts.count == 1 else {
            throw readingExportFailure("The identified destination-picker context changed or expired before its public action [guard=count]", attempt: attempt)
        }
        guard contexts[0].contextKey == expected.contextKey else {
            throw readingExportFailure("The identified destination-picker context changed or expired before its public action [guard=key]", attempt: attempt)
        }
        guard contexts[0].requiresBrowseBack == expected.requiresBrowseBack else {
            throw readingExportFailure("The identified destination-picker context changed or expired before its public action [guard=browse-shape-requires-back]", attempt: attempt)
        }
        guard contexts[0].isBrowseRoot == expected.isBrowseRoot else {
            throw readingExportFailure("The identified destination-picker context changed or expired before its public action [guard=browse-shape-root]", attempt: attempt)
        }
        guard ProcessInfo.processInfo.systemUptime < deadline else {
            throw readingExportFailure("The identified destination-picker context changed or expired before its public action [guard=deadline-after]", attempt: attempt)
        }
        return contexts[0]
    }


    /// Match the public search and its filtered list; no article or TOC is opened.
    private func readingExportFilteredLibrary() -> XCUIElement? {
        let prompt = "記事の本文を検索"
        let searches = app.searchFields.matching(NSPredicate(
            format: "identifier == %@ OR label == %@", prompt, prompt))
        let libraries = app.collectionViews.containing(.staticText, identifier: "library-filter-summary")
        let searchCount = searches.count, libraryCount = libraries.count
        readingExportLastContext = "phase=filtered-library; searchCount=\(searchCount); libraryCount=\(libraryCount)"
        guard searchCount == 1, libraryCount == 1 else { return nil }
        let search = searches.element(boundBy: 0), library = libraries.element(boundBy: 0)
        let summaries = library.staticTexts.matching(identifier: "library-filter-summary")
        guard search.exists, search.value as? String == "Transformer", library.exists, summaries.count == 1 else { return nil }
        let summary = summaries.element(boundBy: 0)
        guard summary.exists, summary.label == "検索: Transformer" else { return nil }
        return library
    }

    private func prepareFilteredLibraryForReadingExport() throws {
        let prompt = "記事の本文を検索"
        let searches = app.searchFields.matching(NSPredicate(
            format: "identifier == %@ OR label == %@", prompt, prompt))
        for _ in 0..<8 {
            if searches.count == 1, isHittableOnScreen(searches.element(boundBy: 0)) { break }
            app.swipeDown(velocity: .slow)
        }
        let ready = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            searches.count == 1 && searches.element(boundBy: 0).isEnabled &&
                self.isHittableOnScreen(searches.element(boundBy: 0))
        }, object: nil)
        guard XCTWaiter.wait(for: [ready], timeout: 15) == .completed, searches.count == 1 else {
            throw readingExportFailure("Expected one usable public article search before the filtered export route", attempt: 0)
        }
        let search = searches.element(boundBy: 0)
        guard search.exists, search.isEnabled, isHittableOnScreen(search),
              let current = search.value as? String,
              current.isEmpty || current == search.placeholderValue else {
            throw readingExportFailure("The public search was not empty and usable before its one query", attempt: 0)
        }
        search.tap()
        search.typeText("Transformer\n")
        let filtered = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            self.readingExportFilteredLibrary() != nil
        }, object: nil)
        guard XCTWaiter.wait(for: [filtered], timeout: 15) == .completed,
              readingExportFilteredLibrary() != nil else {
            throw readingExportFailure("Expected the exact Transformer query and one matching public filtered library", attempt: 0)
        }
    }

    private func cancelReadingBackupExport(attempt: Int, permitsInitialBrowseRoot: Bool) throws -> Bool {
        guard !permitsInitialBrowseRoot || attempt == 2 else {
            throw readingExportFailure("Only the second opening may use the completed first Browse-root cancellation proof", attempt: attempt)
        }
        guard let library = readingExportFilteredLibrary() else {
            throw readingExportFailure("The exact public filtered library was not present before export", attempt: attempt)
        }
        let mores = library.buttons.matching(NSPredicate(format: "label == %@", "その他の操作"))
        let moreReady = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            mores.count == 1 && mores.element(boundBy: 0).isEnabled &&
                self.isHittableOnScreen(mores.element(boundBy: 0), inside: library)
        }, object: nil)
        guard XCTWaiter.wait(for: [moreReady], timeout: 15) == .completed, mores.count == 1 else {
            throw readingExportFailure("Expected one usable More button inside the exact filtered library", attempt: attempt)
        }
        let more = mores.element(boundBy: 0)
        guard more.exists, more.isEnabled, isHittableOnScreen(more, inside: library) else {
            throw readingExportFailure("The unique filtered-list More button was no longer usable", attempt: attempt)
        }
        more.tap()
        let title = "その他の操作"
        let bars = app.navigationBars.matching(NSPredicate(format: "identifier == %@ OR label == %@", title, title))
        let exports = app.buttons.matching(identifier: "library-export-reading")
        let exportReady = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            bars.count == 1 && bars.element(boundBy: 0).exists && exports.count == 1 &&
                exports.element(boundBy: 0).isEnabled && self.isHittableOnScreen(exports.element(boundBy: 0))
        }, object: nil)
        guard XCTWaiter.wait(for: [exportReady], timeout: 10) == .completed,
              bars.count == 1, exports.count == 1 else {
            throw readingExportFailure("Expected the exact More sheet and its unique usable export action", attempt: attempt)
        }
        let moreBar = bars.element(boundBy: 0), export = exports.element(boundBy: 0)
        guard moreBar.exists, export.exists, export.isEnabled, isHittableOnScreen(export) else {
            throw readingExportFailure("The More sheet export action was no longer uniquely usable", attempt: attempt)
        }
        // Pre-export identity, export, one Browse-back and cancellation share this one deadline.
        let pickerDeadline = ProcessInfo.processInfo.systemUptime + 30
        // The observed fixed-ID picker must be absent before opening, not merely new among unrelated bars.
        readingExportLastContext = "phase=pre-export-direct-query"
        let previousPickerBars = app.navigationBars.matching(
            identifier: "FullDocumentManagerViewControllerNavigationBar")
        let previousPickerCount = previousPickerBars.count
        readingExportLastContext = "phase=pre-export-direct-count; directBarCount=\(previousPickerCount)"
        guard previousPickerCount == 0 else {
            throw readingExportFailure("The observed destination-picker identifier was already present before opening", attempt: attempt)
        }
        // The direct identifier is strictly absent, so there is no previous eligible context key.
        let previousContexts = Set<String>()
        readingExportLastContext = "phase=pre-export-filename-query; directBarCount=\(previousPickerCount)"
        let previousFilenameCount = readingExportFilenameCandidates(in: app).count
        readingExportLastContext = "phase=pre-export-filename-count; directBarCount=\(previousPickerCount); exactFilenameCount=\(previousFilenameCount)"
        guard previousFilenameCount == 0 else {
            throw readingExportFailure("An export filename context was already present before opening", attempt: attempt)
        }
        guard ProcessInfo.processInfo.systemUptime < pickerDeadline else {
            throw readingExportFailure("The shared picker deadline expired during pre-export checks", attempt: attempt)
        }
        export.tap()
        var didBrowseBack = false
        var picker = try waitForReadingExportPicker(after: previousContexts, deadline: pickerDeadline,
                                                    cancellationOnly: false, allowsBrowseRoot: permitsInitialBrowseRoot, attempt: attempt)
        if picker.requiresBrowseBack {
            picker = try currentReadingExportPicker(picker, after: previousContexts, deadline: pickerDeadline, attempt: attempt)
            picker.action.tap() // Only the identified Browse-back; no provider, folder or file is selected.
            didBrowseBack = true
            picker = try waitForReadingExportPicker(after: previousContexts, deadline: pickerDeadline,
                                                    cancellationOnly: true, allowsBrowseRoot: true, attempt: attempt)
        }
        guard !picker.requiresBrowseBack else {
            throw readingExportFailure("A verified Cancel did not appear after the single Browse-back", attempt: attempt)
        }
        picker = try currentReadingExportPicker(picker, after: previousContexts, deadline: pickerDeadline, attempt: attempt)
        picker.action.tap() // Only verified Cancel; Move and filename witnesses are never executed.
        let closed = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            !picker.bar.exists && !picker.action.exists && picker.filenames.allSatisfy({ !$0.exists }) &&
                self.readingExportFilenameCandidates(in: self.app).count == 0 && !moreBar.exists &&
                self.isHittableOnScreen(self.app.staticTexts["library-article-count"]) &&
                self.readingExportFilteredLibrary() != nil
        }, object: nil)
        guard XCTWaiter.wait(for: [closed], timeout: 15) == .completed else {
            throw readingExportFailure("The identified save context did not close back to the usable library", attempt: attempt)
        }
        // True is returned only after all pre-back/root witnesses, actual Cancel and full closure succeeded.
        // The caller keeps this proof test-local and supplies it only to attempt2.
        return attempt == 1 && didBrowseBack && picker.isBrowseRoot
    }

    private func readingExportFailure(_ reason: String, attempt: Int) -> NSError {
        // A throwing failure ends this case. Keep the screenshot and bounded fixed context.
        // Capture one failure-only hierarchy separately, never from a readiness predicate.
        capture("Reading-export-cancel-\(attempt)-failed")
        let context = String(decoding: ("attempt=\(attempt)\n" + reason + "\n" + readingExportLastContext)
            .utf8.prefix(1024), as: UTF8.self)
        let attachment = XCTAttachment(string: context)
        attachment.name = "Reading-export-cancel-context"
        attachment.lifetime = .keepAlways
        add(attachment)
        if !readingExportHierarchyCaptured {
            readingExportHierarchyCaptured = true
            let hierarchy = app.debugDescription
            let byteCount = hierarchy.utf8.count
            let full = !hierarchy.isEmpty && byteCount <= 131072
            let detail = full ? hierarchy : "OMITTED: export hierarchy bytes=\(byteCount), allowed=1...131072; no truncated hierarchy retained."
            let hierarchyAttachment = XCTAttachment(string: detail)
            hierarchyAttachment.name = full ? "Reading-export-cancel-hierarchy" : "Reading-export-cancel-hierarchy-omitted"
            hierarchyAttachment.lifetime = .keepAlways
            add(hierarchyAttachment)
        }
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
        let titleWaitStarted = DispatchTime.now().uptimeNanoseconds
        let titleAppeared = dialog.staticTexts[recoveryTitle].waitForExistence(timeout: 5)
        let titleWaitReturned = DispatchTime.now().uptimeNanoseconds
        if !titleAppeared {
            captureReadingRecoveryConfirmationTimeout(waitStarted: titleWaitStarted,
                                                       waitReturned: titleWaitReturned)
        }
        XCTAssertTrue(titleAppeared)
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

    private var readingRecoveryConfirmationFailureCaptured = false

    /// Failure-only evidence: these sequential observations cannot prove the state during the wait.
    /// The fixed output sizes do not bound XCTest's screenshot or AX snapshot work/time/memory.
    private func captureReadingRecoveryConfirmationTimeout(waitStarted: UInt64, waitReturned: UInt64) {
        guard !readingRecoveryConfirmationFailureCaptured else { return }
        readingRecoveryConfirmationFailureCaptured = true
        let elapsed = Double(waitReturned >= waitStarted ? waitReturned - waitStarted : 0) / 1_000_000
        // Emit the returned false value before any new screenshot or AX requests can stall.
        print("AILibraryRecoveryConfirmation title-wait-returned; observed=false; timeoutSeconds=5; elapsedMilliseconds=\(elapsed)")
        capture("Reading-recovery-confirmation-title-not-visible")

        // Exactly six diagnostic AX scalar getters plus one app-state getter, after failure only.
        let appState = app.state
        let sheetCount = app.sheets.count
        let alertCount = app.alerts.count
        let matchingSheetCount = recoverySheets.count
        let globalTitleExists = app.staticTexts[recoveryTitle].exists
        let globalConfirmExists = app.buttons.matching(NSPredicate(format: "label == %@", confirmLabel)).firstMatch.exists
        let recoveryNoticeExists = recoveryButtons.firstMatch.exists
        let payload: [String: Any] = [
            "schemaVersion": 1, "sampling": "after-title-wait-timeout-sequential",
            "observedTitleWithinWait": false, "timeoutSeconds": 5,
            "waitElapsedMilliseconds": elapsed, "appStateRawValue": appState.rawValue,
            "allSheetCount": sheetCount, "allAlertCount": alertCount,
            "matchingRecoverySheetCount": matchingSheetCount,
            "globalRecoveryTitleExists": globalTitleExists,
            "globalRecoveryConfirmExists": globalConfirmExists,
            "recoveryNoticeExists": recoveryNoticeExists
        ]
        let context: String
        if let data = try? JSONSerialization.data(withJSONObject: payload, options: [.sortedKeys]),
           data.count <= 2048 {
            context = String(decoding: data, as: UTF8.self)
        } else {
            context = #"{"schemaVersion":1,"sampling":"after-title-wait-timeout-sequential","observedTitleWithinWait":false,"encodingError":"context-unavailable-or-exceeded-2048-bytes"}"#
        }
        let contextAttachment = XCTAttachment(string: context)
        contextAttachment.name = "Reading-recovery-confirmation-context"
        contextAttachment.lifetime = .keepAlways
        add(contextAttachment)
        print("AILibraryRecoveryConfirmation " + context)

        // Reuse the export failure's full-or-omitted hierarchy policy; no truncated snapshot is claimed.
        let hierarchy = app.debugDescription
        let byteCount = hierarchy.utf8.count
        let full = !hierarchy.isEmpty && byteCount <= 131072
        let detail = full ? hierarchy : "OMITTED: recovery confirmation hierarchy bytes=\(byteCount), allowed=1...131072; no truncated hierarchy retained."
        let hierarchyAttachment = XCTAttachment(string: detail)
        hierarchyAttachment.name = full ? "Reading-recovery-confirmation-hierarchy" : "Reading-recovery-confirmation-hierarchy-omitted"
        hierarchyAttachment.lifetime = .keepAlways
        add(hierarchyAttachment)
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
