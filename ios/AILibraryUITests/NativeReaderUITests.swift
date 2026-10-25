import XCTest

/// Known hidden geometry is different from a viewport that cannot be resolved.
/// Polling waits through unknown transitions; final checks must report unknown.
private enum ReaderFrameVisibility: Equatable {
    case visible, hidden, unknown(String)

    var visibleForPolling: Bool { self == .visible }

    func checkedVisible(onUnknown: (String) -> Void) -> Bool {
        if case .unknown(let reason) = self { onUnknown(reason) }
        return self == .visible
    }
}

private struct ReaderNavigationBarFrame {
    let frame: CGRect
    let hasEnabledHittableControl: Bool
}

private enum ReaderViewportGeometry {
    static func finiteNonempty(_ frame: CGRect) -> Bool {
        !frame.isNull && !frame.isInfinite && !frame.isEmpty &&
        [frame.origin.x, frame.origin.y, frame.size.width, frame.size.height].allSatisfy(\.isFinite)
    }

    static func visibility(target: CGRect?, app: CGRect, container: CGRect?,
                           bars: [ReaderNavigationBarFrame], fullyVisible: Bool) -> ReaderFrameVisibility {
        guard finiteNonempty(app) else { return .unknown("Invalid application frame") }
        var viewport = app
        if let container {
            guard finiteNonempty(container) else { return .unknown("Invalid container frame") }
            viewport = app.intersection(container)
            guard finiteNonempty(viewport) else { return .unknown("Container has no screen viewport") }
            let foreground = bars.filter {
                finiteNonempty($0.frame) && app.contains($0.frame) && $0.hasEnabledHittableControl
            }
            guard foreground.count == 1 else {
                return .unknown("Expected one foreground navigation bar, found \(foreground.count)")
            }
            let barFrame = foreground[0].frame.intersection(viewport)
            if !barFrame.isNull, !barFrame.isEmpty {
                let top = max(viewport.minY, barFrame.maxY)
                viewport = CGRect(x: viewport.minX, y: top, width: viewport.width,
                                  height: max(0, viewport.maxY - top))
            }
            guard finiteNonempty(viewport) else { return .unknown("Navigation bar covers the viewport") }
        }
        // Resolve the viewport first: an absent target must not hide ambiguity
        // when this function is used by a direct negative assertion.
        guard let target else { return .hidden }
        guard !target.isNull, !target.isInfinite,
              [target.origin.x, target.origin.y, target.size.width, target.size.height].allSatisfy(\.isFinite)
        else { return .unknown("Invalid target frame") }
        guard !target.isEmpty else { return .hidden }
        let visible = target.intersection(viewport)
        guard !visible.isNull, !visible.isEmpty else { return .hidden }
        return (!fullyVisible || viewport.contains(target)) ? .visible : .hidden
    }
}

/// Shared public-UI actions for both the three-article baseline and the full catalog.
/// Waits and gesture limits synchronize tests; they are not performance targets.
class NativeReaderUITestCase: XCTestCase {
    private(set) var app: XCUIApplication!

    // Private diagnostic proposal: bounded local observations only; no AX getters.
    private let visibilityTraceLock = NSLock()
    private var visibilityTraceSequence = 0
    private var visibilityTraceContext = "precheck"
    private var visibilityTraceSamples: [[String: String]] = []

    private func beginVisibilitySample(fullyVisible: Bool, hasContainer: Bool) -> Int {
        visibilityTraceLock.lock()
        defer { visibilityTraceLock.unlock() }
        visibilityTraceSequence += 1
        visibilityTraceSamples.append(["sample": String(visibilityTraceSequence),
            "started_uptime": String(ProcessInfo.processInfo.systemUptime),
            "context": visibilityTraceContext, "fully_visible": String(fullyVisible),
            "has_container": String(hasContainer)])
        if visibilityTraceSamples.count > 64 { visibilityTraceSamples.removeFirst(visibilityTraceSamples.count - 64) }
        return visibilityTraceSequence
    }

    private func recordVisibilitySample(_ id: Int, stage: String, value: String) {
        visibilityTraceLock.lock()
        defer { visibilityTraceLock.unlock() }
        guard let index = visibilityTraceSamples.firstIndex(where: { $0["sample"] == String(id) }) else { return }
        visibilityTraceSamples[index][stage] = value
        visibilityTraceSamples[index][stage + ".uptime"] = String(ProcessInfo.processInfo.systemUptime)
        visibilityTraceSamples[index]["last_stage"] = stage
    }

    private func setVisibilityTraceContext(_ value: String) -> String {
        visibilityTraceLock.lock()
        defer { visibilityTraceLock.unlock() }
        let previous = visibilityTraceContext
        visibilityTraceContext = value
        return previous
    }

    private func attachVisibilityTrace(file: StaticString, line: UInt, timeout: TimeInterval) {
        visibilityTraceLock.lock()
        let samples = visibilityTraceSamples
        visibilityTraceLock.unlock()
        let value: [String: Any] = ["schema_version": 1,
            "baseline_source_sha256": "1296e450ac8575244527cd58bcc8b21f4819956a7dada225f5522e954c6b46d8",
            "callsite": String(describing: file) + ":" + String(line),
            "timeout_seconds": timeout, "samples": samples,
            "scope": "Already-read values only; no element label/identifier or additional AX queries. A .begin without .value means no getter return was observed."]
        let bytes = (try? JSONSerialization.data(withJSONObject: value, options: [.prettyPrinted, .sortedKeys]))
            ?? Data("{\"diagnostic_error\":\"serialization failed\"}".utf8)
        let attachment = XCTAttachment(string: String(decoding: bytes, as: UTF8.self))
        attachment.name = "Public-UI-visibility-read-observations"
        attachment.lifetime = .keepAlways
        add(attachment)
    }

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

    private func frameVisibility(_ element: XCUIElement, inside container: XCUIElement?,
                                 fullyVisible: Bool, trace: ((String, String) -> Void)? = nil) -> ReaderFrameVisibility {
        trace?("app.frame.begin", "entered")
        let appFrame = app.frame
        trace?("app.frame.value", String(describing: appFrame))
        if let container {
            trace?("container.exists.begin", "entered")
            let observedContainerExists = container.exists
            trace?("container.exists.value", String(observedContainerExists))
            if !observedContainerExists {
                trace?("geometry", "unknown: Container is not present")
                return .unknown("Container is not present")
            }
        }
        let bars: [ReaderNavigationBarFrame] = container == nil ? [] :
            app.navigationBars.allElementsBoundByIndex.filter { $0.exists }.map { bar in
                let barFrame = bar.frame
                let usableControl: Bool
                if ReaderViewportGeometry.finiteNonempty(barFrame), appFrame.contains(barFrame) {
                    // Background bars can remain in the AX tree. A descendant
                    // control, rather than the bar's own isHittable, witnesses
                    // which navigation context currently accepts interaction.
                    usableControl = bar.buttons.allElementsBoundByIndex.contains { control in
                        guard control.exists, control.isEnabled else { return false }
                        let controlFrame = control.frame
                        guard ReaderViewportGeometry.finiteNonempty(controlFrame),
                              appFrame.contains(controlFrame), barFrame.intersects(controlFrame) else { return false }
                        return control.isHittable
                    }
                } else { usableControl = false }
                return ReaderNavigationBarFrame(frame: barFrame, hasEnabledHittableControl: usableControl)
            }
        trace?("target.exists.begin", "entered")
        let observedExists = element.exists
        trace?("target.exists.value", String(observedExists))
        let observedFrame: CGRect?
        if observedExists {
            trace?("target.frame.begin", "entered")
            observedFrame = element.frame
            trace?("target.frame.value", String(describing: observedFrame))
        } else {
            observedFrame = nil
            trace?("target.frame.skipped", "absent target")
        }
        trace?("container.frame.begin", container == nil ? "not-read: no container" : "entered")
        let observedContainerFrame = container?.frame
        trace?("container.frame.value", String(describing: observedContainerFrame))
        let result = ReaderViewportGeometry.visibility(target: observedFrame,
            app: appFrame, container: observedContainerFrame, bars: bars, fullyVisible: fullyVisible)
        trace?("geometry", String(describing: result))
        return result
    }

    /// A direct check, including a negative assertion, must fail on unknown.
    func hasVisibleFrame(_ element: XCUIElement, inside container: XCUIElement? = nil,
                         fullyVisible: Bool = false, file: StaticString = #filePath, line: UInt = #line) -> Bool {
        frameVisibility(element, inside: container, fullyVisible: fullyVisible).checkedVisible { reason in
            XCTFail("Cannot determine the public UI viewport: " + reason, file: file, line: line)
        }
    }

    /// Nonasserting positive poll: unknown transitions remain unsatisfied.
    func hasVisibleFrameForPolling(_ element: XCUIElement, inside container: XCUIElement? = nil,
                                  fullyVisible: Bool = false, trace: ((String, String) -> Void)? = nil) -> Bool {
        frameVisibility(element, inside: container, fullyVisible: fullyVisible, trace: trace).visibleForPolling
    }

    func isHittableOnScreen(_ element: XCUIElement, inside container: XCUIElement? = nil,
                            fullyVisible: Bool = false) -> Bool {
        // XCTest can raise an activation-point error when asked about an offscreen cell.
        let id = beginVisibilitySample(fullyVisible: fullyVisible, hasContainer: container != nil)
        let record: (String, String) -> Void = { stage, value in
            self.recordVisibilitySample(id, stage: stage, value: value)
        }
        guard hasVisibleFrameForPolling(element, inside: container, fullyVisible: fullyVisible, trace: record) else {
            record("isHittable.skipped", "existing geometry guard")
            return false
        }
        record("isHittable.begin", "entered")
        let observedHittable = element.isHittable
        record("isHittable.value", String(observedHittable))
        return observedHittable
    }

    func requireHittable(_ element: XCUIElement, inside container: XCUIElement? = nil,
                         fullyVisible: Bool = false, timeout: TimeInterval = 15,
                         file: StaticString = #filePath, line: UInt = #line) {
        let previousContext = setVisibilityTraceContext("requireHittable@" + String(describing: file) + ":" + String(line))
        defer { _ = setVisibilityTraceContext(previousContext) }
        let predicate = NSPredicate { _, _ in
            self.isHittableOnScreen(element, inside: container, fullyVisible: fullyVisible)
        }
        let visible = XCTNSPredicateExpectation(predicate: predicate, object: nil)
        let result = XCTWaiter.wait(for: [visible], timeout: timeout)
        if result != .completed {
            attachVisibilityTrace(file: file, line: line, timeout: timeout)
            capture("Public-UI-target-not-visible")
            let hierarchy = XCTAttachment(string: app.debugDescription)
            hierarchy.name = "Public-UI-target-not-visible-hierarchy"
            hierarchy.lifetime = .keepAlways
            add(hierarchy)
        }
        XCTAssertEqual(result, .completed,
                       "The requested public UI element must be visible and usable", file: file, line: line)
    }

    func open(_ title: String, articleID: String, query: String? = nil) {
        XCTAssertTrue(app.staticTexts["library-article-count"].waitForExistence(timeout: 45))
        let search = app.searchFields.firstMatch
        for _ in 0..<8 where !isHittableOnScreen(search) { app.swipeDown(velocity: .slow) }
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
            if isHittableOnScreen(row) { break }
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
            if isHittableOnScreen(target) { break }
            app.swipeUp(velocity: .slow)
        }
        requireHittable(target)
        target.tap()
        requireHittable(app.staticTexts["native-heading-" + headingID],
                        inside: app.scrollViews["native-reader"], fullyVisible: true)
    }

    func returnToLibrary() {
        app.navigationBars.buttons.element(boundBy: 0).tap()
        let readerClosed = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            !self.app.scrollViews["native-reader"].exists
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [readerClosed], timeout: 10), .completed)
        XCTAssertTrue(app.searchFields.firstMatch.waitForExistence(timeout: 10))
        let count = app.staticTexts["library-article-count"]
        // A long filtered list may restore below its unmaterialized section header.
        for _ in 0..<8 where !isHittableOnScreen(count) { app.swipeDown(velocity: .slow) }
        requireHittable(count)
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
        requireHittable(app.staticTexts["native-heading-自己注意の数式"],
                        inside: app.scrollViews["native-reader"], fullyVisible: true)
        capture("Native-resume")
    }
}
