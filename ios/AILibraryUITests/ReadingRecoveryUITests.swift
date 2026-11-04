import XCTest

final class ReadingRecoveryUITests: NativeReaderUITestCase {
    override var seedsPartialReadingRecovery: Bool { true }
    override var recordsReadingRecoveryOpenBoundaries: Bool { true }
    override var recordsModalPresentationBoundaries: Bool { false }

    private var modalBoundaryBeforeMore = "not_sampled"

    // One value read immediately before each existing More tap, outside every readiness predicate.
    private func rememberModalBoundaryBeforeMore(_ more: XCUIElement) {
        guard recordsModalPresentationBoundaries else {
            modalBoundaryBeforeMore = "disabled"
            return
        }
        modalBoundaryBeforeMore = boundedModalBoundaryValue(more.value as? String)
    }

    private func boundedModalBoundaryValue(_ value: String?) -> String {
        guard let value, value.utf8.count <= 256, value.hasPrefix("v=1;i="),
              value.utf8.allSatisfy({ (48...57).contains($0) || (65...90).contains($0) ||
                  (97...122).contains($0) || $0 == 59 || $0 == 61 }) else { return "unavailable_or_invalid" }
        return value
    }

    // Failure-only, sequential to the earlier sample and existing hierarchy; not an atomic snapshot.
    private func modalBoundaryAtFailure() -> String {
        guard recordsModalPresentationBoundaries else { return "disabled" }
        let controls = app.buttons.matching(identifier: "library-modal-boundary-trace")
        guard controls.count == 1 else { return "unavailable_or_ambiguous" }
        return boundedModalBoundaryValue(controls.element(boundBy: 0).value as? String)
    }

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
        rememberModalBoundaryBeforeMore(more)
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
        for _ in 0..<8 {
            let ready = isHittableOnScreen(clear)
            if ready { break }
            app.swipeDown(velocity: .slow)
        }
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
        for _ in 0..<8 {
            let ready = isHittableOnScreen(clear)
            if ready { break }
            app.swipeDown(velocity: .slow)
        }
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
        for attempt in 1...2 {
            let observation = try cancelReadingBackupExport(attempt: attempt)
            requireNoRecoveryNotice()
            XCTAssertFalse(app.alerts["読書記録"].exists, "Cancellation must not report an export error")
            print("READING_EXPORT_CANCEL_WITNESS attempt=\(attempt) entryShape=\(observation.entryShape) didBrowseBack=\(observation.didBrowseBack) postShape=\(observation.postShape) postIsBrowseRoot=\(observation.postIsBrowseRoot) confirmedCancel=true closure=true")
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

    // BEGIN PURE_READING_EXPORT_SNAPSHOT
    private enum ReadingExportNodeKind { case application, window, navigationBar, button, textField, textView, staticText, other, excluded }
    private struct ReadingExportSnapshotNode {
        let parent: Int?
        let kind: ReadingExportNodeKind
        let identifier: String
        let label: String
        let value: String?
        let frame: CGRect
        let enabled: Bool
    }
    private struct ReadingExportSnapshotProof {
        let contextKey: String
        let requiresBrowseBack: Bool
        let isBrowseRoot: Bool
        let moveCount: Int
        let cancelCount: Int
        let backCount: Int
        let actionLabel: String
        let appFrame: CGRect
        let windowFrame: CGRect
        let barFrame: CGRect
        let actionFrame: CGRect
        let exactMatches: Int
        let visibleElements: Int
        let distinctBounds: Int
    }
    private static func readingExportFrameIsFinite(_ frame: CGRect) -> Bool {
        !frame.isNull && !frame.isInfinite && frame.minX.isFinite && frame.minY.isFinite &&
            frame.width.isFinite && frame.height.isFinite && frame.width > 0 && frame.height > 0
    }
    /// One immutable capture supplies counts, identity, type and geometry together.
    /// Live action usability is checked separately; snapshot presence is not live hittability.
    private static func readingExportSnapshotProof(_ nodes: [ReadingExportSnapshotNode],
                                                  after previousContexts: Set<String>, allowsBrowseRoot: Bool)
        -> (proof: ReadingExportSnapshotProof?, context: String) {
        let identifier = "FullDocumentManagerViewControllerNavigationBar"
        var phase = "snapshot-tree", bars = -1, moves = -1, cancels = -1, backs = -1, windows = -1, exact = -1
        func result(_ proof: ReadingExportSnapshotProof? = nil) -> (ReadingExportSnapshotProof?, String) {
            (proof, "phase=\(phase); directBarCount=\(bars); moveCount=\(moves); cancelCount=\(cancels); browseBackCount=\(backs); windowCount=\(windows); exactMatches=\(exact); allowsBrowseRoot=\(allowsBrowseRoot)")
        }
        guard !nodes.isEmpty, nodes.count <= 8192, nodes[0].parent == nil, nodes[0].kind == .application else { return result() }
        for index in nodes.indices.dropFirst() {
            guard let parent = nodes[index].parent, parent >= 0, parent < index else { return result() }
            var depth = 0, current: Int? = index
            while let value = current { depth += 1; if depth > 65 { return result() }; current = nodes[value].parent }
        }
        func descends(_ index: Int, from ancestor: Int) -> Bool {
            var current = nodes[index].parent
            while let value = current { if value == ancestor { return true }; current = nodes[value].parent }
            return false
        }
        phase = "snapshot-direct-bar"
        let barIndices = nodes.indices.filter { nodes[$0].kind == .navigationBar && nodes[$0].identifier == identifier }
        bars = barIndices.count
        guard bars == 1 else { return result() }
        let barIndex = barIndices[0], bar = nodes[barIndex]
        let key = bar.identifier + "\u{001F}" + bar.label
        guard !previousContexts.contains(key) else { return result() }
        phase = "snapshot-action-count"
        let buttons = nodes.indices.filter { nodes[$0].kind == .button && descends($0, from: barIndex) }
        let moveIndices = buttons.filter { ["移動", "Move"].contains(nodes[$0].label) }
        let cancelIndices = buttons.filter { ["キャンセル", "Cancel"].contains(nodes[$0].label) }
        let backIndices = buttons.filter { ["ブラウズ", "Browse"].contains(nodes[$0].label) }
        moves = moveIndices.count; cancels = cancelIndices.count; backs = backIndices.count
        let isMove = moves == 1 && ((cancels == 1 && backs == 0) || (cancels == 0 && backs == 1))
        let isRoot = allowsBrowseRoot && moves == 0 && cancels == 1 && backs == 0
        guard isMove || isRoot else { return result() }
        let requiresBack = cancels == 0, action = nodes[requiresBack ? backIndices[0] : cancelIndices[0]]
        phase = "snapshot-action-geometry"
        let appFrame = nodes[0].frame
        guard action.enabled, [appFrame, bar.frame, action.frame].allSatisfy({ readingExportFrameIsFinite($0) }),
              appFrame.contains(bar.frame), bar.frame.contains(action.frame) else { return result() }
        if isMove {
            let move = nodes[moveIndices[0]]
            // Move is a read-only context witness; its enabled/hittable state is not required.
            guard readingExportFrameIsFinite(move.frame), bar.frame.contains(move.frame) else { return result() }
        }
        phase = "snapshot-window-count"
        let windowIndices = nodes.indices.filter { nodes[$0].kind == .window && descends(barIndex, from: $0) }
        windows = windowIndices.count
        guard windows == 1 else { return result() }
        let windowIndex = windowIndices[0], window = nodes[windowIndex]
        guard nodes.indices.filter({ nodes[$0].kind == .navigationBar && nodes[$0].identifier == identifier && descends($0, from: windowIndex) }).count == 1,
              readingExportFrameIsFinite(window.frame), appFrame.contains(window.frame), window.frame.contains(bar.frame) else { return result() }
        phase = "snapshot-filename-count"
        let names = Set(["AI-Agent-Library-Reading-Backup", "AI-Agent-Library-Reading-Backup.json"])
        // Count every exact-name candidate before excluding types or invisible ancestors.
        let matches = nodes.indices.filter { descends($0, from: windowIndex) &&
            (names.contains(nodes[$0].label) || nodes[$0].value.map({ names.contains($0) }) == true) }
        exact = matches.count
        guard exact > 0, exact <= 16 else { return result() }
        var witnesses = 0, distinct = Set<String>()
        for index in matches {
            let candidate = nodes[index]
            guard [.textField, .textView, .staticText, .other].contains(candidate.kind),
                  readingExportFrameIsFinite(candidate.frame), appFrame.contains(candidate.frame),
                  window.frame.contains(candidate.frame), candidate.frame.minY >= bar.frame.maxY else { continue }
            witnesses += 1
            distinct.insert([candidate.frame.minX, candidate.frame.minY, candidate.frame.width, candidate.frame.height]
                .map { String(Double($0)) }.joined(separator: ","))
        }
        phase = isRoot ? "browse-root-filename-witness" : "destination-filename-witness"
        guard witnesses > 0, distinct.count <= 8 else { return result() }
        let proof = ReadingExportSnapshotProof(contextKey: key, requiresBrowseBack: requiresBack, isBrowseRoot: isRoot,
            moveCount: moves, cancelCount: cancels, backCount: backs, actionLabel: action.label,
            appFrame: appFrame, windowFrame: window.frame, barFrame: bar.frame, actionFrame: action.frame,
            exactMatches: exact, visibleElements: witnesses, distinctBounds: distinct.count)
        return (proof, "phase=\(phase); exactMatches=\(exact); visibleElements=\(witnesses); distinctBounds=\(distinct.count); allowsBrowseRoot=\(allowsBrowseRoot)")
    }
    // END PURE_READING_EXPORT_SNAPSHOT

    private func readingExportSnapshotNodes(deadline: TimeInterval) -> [ReadingExportSnapshotNode]? {
        guard ProcessInfo.processInfo.systemUptime < deadline else { return nil }
        readingExportLastContext = "phase=snapshot-capture; remaining=\(deadline - ProcessInfo.processInfo.systemUptime)"
        let root: XCUIElementSnapshot
        do { root = try app.snapshot() }
        catch { readingExportLastContext = "phase=snapshot-error"; return nil }
        guard ProcessInfo.processInfo.systemUptime < deadline else {
            readingExportLastContext = "phase=snapshot-returned-after-deadline"; return nil
        }
        var pending: [(XCUIElementSnapshot, Int?, Int)] = [(root, nil, 0)]
        var nodes: [ReadingExportSnapshotNode] = []
        while let (node, parent, depth) = pending.popLast() {
            guard ProcessInfo.processInfo.systemUptime < deadline, depth <= 64, nodes.count < 8192 else {
                readingExportLastContext = "phase=snapshot-walk-limit-or-deadline; nodes=\(nodes.count); depth=\(depth)"; return nil
            }
            let kind: ReadingExportNodeKind
            switch node.elementType {
            case .application: kind = .application
            case .window: kind = .window
            case .navigationBar: kind = .navigationBar
            case .button: kind = .button
            case .textField: kind = .textField
            case .textView: kind = .textView
            case .staticText: kind = .staticText
            case .other: kind = .other
            default: kind = .excluded
            }
            let index = nodes.count
            nodes.append(ReadingExportSnapshotNode(parent: parent, kind: kind, identifier: node.identifier,
                label: node.label, value: node.value as? String, frame: node.frame, enabled: node.isEnabled))
            let children = node.children
            guard nodes.count + pending.count + children.count <= 8192 else {
                readingExportLastContext = "phase=snapshot-node-limit; nodes=\(nodes.count)"; return nil
            }
            for child in children.reversed() { pending.append((child, index, depth + 1)) }
        }
        return nodes
    }

    /// Capture standard attributes once, then verify the scoped live action before returning it.
    private func newReadingExportPickers(after previousContexts: Set<String>, allowsBrowseRoot: Bool,
                                        deadline: TimeInterval) -> [ReadingExportPicker] {
        guard let nodes = readingExportSnapshotNodes(deadline: deadline) else { return [] }
        let assessment = Self.readingExportSnapshotProof(nodes, after: previousContexts, allowsBrowseRoot: allowsBrowseRoot)
        readingExportLastContext = assessment.context
        guard let proof = assessment.proof else { return [] }
        readingExportLastContext = assessment.context + "; livePhase=before-live; remaining=\(deadline - ProcessInfo.processInfo.systemUptime)"
        guard ProcessInfo.processInfo.systemUptime < deadline else { return [] }
        let identifier = "FullDocumentManagerViewControllerNavigationBar"
        let bars = app.navigationBars.matching(identifier: identifier)
        let barCount = bars.count
        readingExportLastContext = assessment.context + "; livePhase=bar-count; liveBarCount=\(barCount); remaining=\(deadline - ProcessInfo.processInfo.systemUptime)"
        guard barCount == 1, ProcessInfo.processInfo.systemUptime < deadline else { return [] }
        let bar = bars.element(boundBy: 0)
        let barMatches = bar.exists && readingExportContextKey(bar) == proof.contextKey
        readingExportLastContext = assessment.context + "; livePhase=bar-identity; liveBarMatches=\(barMatches); remaining=\(deadline - ProcessInfo.processInfo.systemUptime)"
        guard barMatches, ProcessInfo.processInfo.systemUptime < deadline else { return [] }
        let actions = bar.buttons.matching(NSPredicate(format: "label == %@ OR label == %@",
            proof.requiresBrowseBack ? "ブラウズ" : "キャンセル", proof.requiresBrowseBack ? "Browse" : "Cancel"))
        let actionCount = actions.count
        readingExportLastContext = assessment.context + "; livePhase=action-count; liveActionCount=\(actionCount); remaining=\(deadline - ProcessInfo.processInfo.systemUptime)"
        guard actionCount == 1, ProcessInfo.processInfo.systemUptime < deadline else { return [] }
        let action = actions.element(boundBy: 0)
        let windows = app.windows.containing(NSPredicate(format: "identifier == %@", identifier))
        let windowCount = windows.count
        readingExportLastContext = assessment.context + "; livePhase=window-count; liveWindowCount=\(windowCount); remaining=\(deadline - ProcessInfo.processInfo.systemUptime)"
        guard windowCount == 1, ProcessInfo.processInfo.systemUptime < deadline else { return [] }
        let window = windows.element(boundBy: 0)
        let usable = window.exists && action.exists && action.isEnabled && action.isHittable && action.label == proof.actionLabel
        readingExportLastContext = assessment.context + "; livePhase=action-usability; liveActionUsable=\(usable); remaining=\(deadline - ProcessInfo.processInfo.systemUptime)"
        guard usable, ProcessInfo.processInfo.systemUptime < deadline else { return [] }
        // T0's fresh coherent capture supplies shape and geometry. T1 does not repeat its full tree scan.
        // Keep the old closure witnesses, bound to the same live window and exact-name candidate set.
        let filenameQuery = readingExportFilenameCandidates(in: window)
        let filenameCount = filenameQuery.count
        readingExportLastContext = assessment.context + "; livePhase=filename-count; liveFilenameCount=\(filenameCount); remaining=\(deadline - ProcessInfo.processInfo.systemUptime)"
        guard filenameCount == proof.exactMatches, proof.exactMatches <= 16,
              ProcessInfo.processInfo.systemUptime < deadline else { return [] }
        let filenames = filenameQuery.allElementsBoundByIndex
        readingExportLastContext = assessment.context + "; livePhase=filename-array; liveFilenameElements=\(filenames.count); remaining=\(deadline - ProcessInfo.processInfo.systemUptime)"
        guard filenames.count == proof.exactMatches, ProcessInfo.processInfo.systemUptime < deadline else { return [] }
        return [ReadingExportPicker(bar: bar, contextKey: proof.contextKey, action: action,
            requiresBrowseBack: proof.requiresBrowseBack, isBrowseRoot: proof.isBrowseRoot, filenames: filenames)]
    }

    private func waitForReadingExportPicker(after previousContexts: Set<String>, deadline: TimeInterval,
                                            cancellationOnly: Bool, allowsBrowseRoot: Bool, attempt: Int) throws -> ReadingExportPicker {
        var identified: ReadingExportPicker?
        let ready = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            guard ProcessInfo.processInfo.systemUptime < deadline else { return false }
            let contexts = self.newReadingExportPickers(after: previousContexts, allowsBrowseRoot: allowsBrowseRoot, deadline: deadline)
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
        let contexts = newReadingExportPickers(after: previousContexts, allowsBrowseRoot: expected.isBrowseRoot, deadline: deadline)
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

    private struct ReadingExportCancellationObservation {
        let entryShape: String
        let didBrowseBack: Bool
        let postShape: String
        let postIsBrowseRoot: Bool
    }

    private func readingExportShape(_ picker: ReadingExportPicker) -> String {
        picker.isBrowseRoot ? "browse-root" : (picker.requiresBrowseBack ? "destination-browse-back" : "destination-cancel")
    }

    private func cancelReadingBackupExport(attempt: Int) throws -> ReadingExportCancellationObservation {
        guard (1...2).contains(attempt) else {
            throw readingExportFailure("Only the two planned export openings are permitted", attempt: attempt)
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
        rememberModalBoundaryBeforeMore(more)
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
                                                    cancellationOnly: false, allowsBrowseRoot: true, attempt: attempt)
        // Root-adopted policy: each opening may prove an initial Browse-root itself; no prior Back is invented.
        let entryShape = readingExportShape(picker)
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
        // Report the path actually observed. A root entry with no Back remains didBrowseBack=false.
        return ReadingExportCancellationObservation(entryShape: entryShape,
            didBrowseBack: didBrowseBack, postShape: readingExportShape(picker), postIsBrowseRoot: picker.isBrowseRoot)
    }

    private func readingExportFailure(_ reason: String, attempt: Int) -> NSError {
        // A throwing failure ends this case. Keep the screenshot and bounded fixed context.
        // Capture one failure-only hierarchy separately, never from a readiness predicate.
        capture("Reading-export-cancel-\(attempt)-failed")
        let modalContext = "modalBeforeMore=" + modalBoundaryBeforeMore +
            "\nmodalAtFailure=" + modalBoundaryAtFailure() + "\n"
        let context = String(decoding: ("attempt=\(attempt)\n" + modalContext + reason + "\n" + readingExportLastContext)
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
        for _ in 0..<8 {
            let ready = isHittableOnScreen(recovery)
            if ready { break }
            app.swipeDown(velocity: .slow)
        }
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
