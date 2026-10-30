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

private enum ReaderViewportResolution {
    case resolved(CGRect), unknown(String)
}

private enum ReaderViewportGeometry {
    static func finiteNonempty(_ frame: CGRect) -> Bool {
        !frame.isNull && !frame.isInfinite && !frame.isEmpty &&
        [frame.origin.x, frame.origin.y, frame.size.width, frame.size.height].allSatisfy(\.isFinite)
    }

    static func viewport(app: CGRect, container: CGRect?,
                         bars: [ReaderNavigationBarFrame]) -> ReaderViewportResolution {
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
        return .resolved(viewport)
    }

    static func firstFullyVisibleFrameIndex(in frames: [CGRect], viewport: CGRect) -> Int? {
        guard finiteNonempty(viewport) else { return nil }
        return frames.indices.filter {
            visibility(target: frames[$0], viewport: viewport, fullyVisible: true).visibleForPolling
        }.sorted { frames[$0].minY < frames[$1].minY }.first
    }

    static func visibility(target: CGRect?, app: CGRect, container: CGRect?,
                           bars: [ReaderNavigationBarFrame], fullyVisible: Bool) -> ReaderFrameVisibility {
        switch viewport(app: app, container: container, bars: bars) {
        case .unknown(let reason): return .unknown(reason)
        case .resolved(let viewport):
            return visibility(target: target, viewport: viewport, fullyVisible: fullyVisible)
        }
    }

    static func visibility(target: CGRect?, viewport: CGRect,
                           fullyVisible: Bool) -> ReaderFrameVisibility {
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

/// Diagnostic boundaries only: stores no XCUIElement or newly read AX property.
/// One lock protects callback state; the last eight starts stay bounded even if a poll outlives the waiter.
private final class ReaderWaitBoundaryTrace {
    enum Boundary: String {
        case waitReturned = "wait-returned"
        case geometryStarted = "failure-geometry-started"
        case geometryReturned = "failure-geometry-returned"
    }

    private struct Poll {
        let sequence: UInt64
        let started: UInt64
        var returned: UInt64?
        var satisfied: Bool?
        var geometryStarted: UInt64? = nil
        var geometryReturned: UInt64? = nil
        var geometry: ReaderFrameVisibility? = nil
        var geometryReasonTruncated = false
        var hittableStarted: UInt64? = nil
        var hittableReturned: UInt64? = nil
        var targetIsHittable: Bool? = nil
    }

    private let lock = NSLock()
    private let now: () -> UInt64
    private let origin: UInt64
    private let traceID = UUID().uuidString
    private let callsiteLine: UInt
    private let fullyVisible: Bool
    private let timeout: TimeInterval
    private var expectationStarted: UInt64?
    private var expectationReturned: UInt64?
    private var waitStarted: UInt64?
    private var waitReturned: UInt64?
    private var waiterCompleted: Bool?
    private var inflightAtWaitReturn: UInt64?
    private var geometryStarted: UInt64?
    private var geometryReturned: UInt64?
    private var totalStarted: UInt64 = 0
    private var totalReturned: UInt64 = 0
    private var polls: [Poll] = []

    init(callsiteLine: UInt, fullyVisible: Bool, timeout: TimeInterval,
         now: @escaping () -> UInt64 = { DispatchTime.now().uptimeNanoseconds }) {
        self.callsiteLine = callsiteLine
        self.fullyVisible = fullyVisible
        self.timeout = timeout
        self.now = now
        origin = now()
    }

    private func locked<T>(_ body: () -> T) -> T {
        lock.lock()
        defer { lock.unlock() }
        return body()
    }

    func markExpectationStarted() { locked { expectationStarted = now() } }
    func markExpectationReturned() { locked { expectationReturned = now() } }
    func markWaitStarted() { locked { waitStarted = now() } }

    func beginPoll() -> UInt64 {
        locked {
            totalStarted += 1
            if polls.count == 8 { polls.removeFirst() }
            polls.append(Poll(sequence: totalStarted, started: now(), returned: nil, satisfied: nil))
            return totalStarted
        }
    }

    func endPoll(_ sequence: UInt64, satisfied: Bool) {
        locked {
            totalReturned += 1
            if let index = polls.firstIndex(where: { $0.sequence == sequence }) {
                polls[index].returned = now()
                polls[index].satisfied = satisfied
            }
        }
    }

    private func updatePoll(_ sequence: UInt64, _ body: (inout Poll) -> Void) {
        locked {
            guard let index = polls.firstIndex(where: { $0.sequence == sequence }) else { return }
            body(&polls[index])
        }
    }

    func markPollGeometryStarted(_ sequence: UInt64) {
        updatePoll(sequence) { $0.geometryStarted = now() }
    }

    func markPollGeometryReturned(_ sequence: UInt64, visibility: ReaderFrameVisibility) {
        updatePoll(sequence) { poll in
            poll.geometryReturned = now()
            if case .unknown(let reason) = visibility {
                // This existing reason contains only geometry state/counts.
                // Bound even synthetic/future reasons before retaining last8.
                var bounded = ""
                var bytes = 0
                for scalar in reason.unicodeScalars {
                    let next = String(scalar)
                    guard bytes + next.utf8.count <= 160 else { break }
                    bounded += next
                    bytes += next.utf8.count
                }
                poll.geometry = .unknown(bounded)
                poll.geometryReasonTruncated = bounded != reason
            } else { poll.geometry = visibility }
        }
    }

    func markPollHittableStarted(_ sequence: UInt64) {
        updatePoll(sequence) { $0.hittableStarted = now() }
    }

    func markPollHittableReturned(_ sequence: UInt64, value: Bool) {
        updatePoll(sequence) {
            $0.hittableReturned = now()
            $0.targetIsHittable = value
        }
    }

    /// Snapshot and boundary mutation share the lock; serialization/console I/O never holds it.
    /// This uses test-process monotonic time and existing Bool results, not AX getters.
    func json(at boundary: Boundary, completed: Bool? = nil) -> String {
        let payload: [String: Any] = locked {
            let timestamp = now()
            let inflight = totalStarted - totalReturned
            switch boundary {
            case .waitReturned:
                waitReturned = timestamp
                waiterCompleted = completed
                inflightAtWaitReturn = inflight
            case .geometryStarted: geometryStarted = timestamp
            case .geometryReturned: geometryReturned = timestamp
            }
            func milliseconds(_ value: UInt64?) -> Any {
                guard let value else { return NSNull() }
                return Double(value >= origin ? value - origin : 0) / 1_000_000
            }
            return [
                "schemaVersion": 1, "sampling": "predicate-boundaries-no-extra-AX",
                "scope": "NativeReaderUITests-iOS26plus", "traceID": traceID,
                "event": boundary.rawValue, "callsiteLine": callsiteLine,
                "fullyVisible": fullyVisible, "timeoutSeconds": timeout.isFinite ? timeout as Any : NSNull(),
                "snapshotMilliseconds": milliseconds(timestamp),
                "expectation": ["startedMilliseconds": milliseconds(expectationStarted),
                    "returnedMilliseconds": milliseconds(expectationReturned)],
                "wait": ["startedMilliseconds": milliseconds(waitStarted),
                    "returnedMilliseconds": milliseconds(waitReturned),
                    "completed": waiterCompleted.map { $0 as Any } ?? NSNull(),
                    "inflightAtReturn": inflightAtWaitReturn.map { $0 as Any } ?? NSNull()],
                "polls": ["totalStarted": totalStarted, "totalReturned": totalReturned,
                    "inflightAtSnapshot": inflight, "retainedLimit": 8,
                    "omittedStarts": totalStarted - UInt64(polls.count),
                    "last": polls.map { poll -> [String: Any] in
                        let geometryState: String
                        let geometryReason: Any
                        switch poll.geometry {
                        case .visible?: geometryState = "visible"; geometryReason = NSNull()
                        case .hidden?: geometryState = "hidden"; geometryReason = NSNull()
                        case .unknown(let reason)?: geometryState = "unknown"; geometryReason = reason
                        case nil: geometryState = "not-returned"; geometryReason = NSNull()
                        }
                        let condition: [String: Any] = [
                            "geometry": ["state": geometryState, "reason": geometryReason,
                                "reasonTruncated": poll.geometryReasonTruncated,
                                "startedMilliseconds": milliseconds(poll.geometryStarted),
                                "returnedMilliseconds": milliseconds(poll.geometryReturned)],
                            "hittable": ["readStarted": poll.hittableStarted != nil,
                                "value": poll.targetIsHittable.map { $0 as Any } ?? NSNull(),
                                "startedMilliseconds": milliseconds(poll.hittableStarted),
                                "returnedMilliseconds": milliseconds(poll.hittableReturned)]]
                        return ["sequence": poll.sequence, "startedMilliseconds": milliseconds(poll.started),
                            "returnedMilliseconds": milliseconds(poll.returned),
                            "returnedBoolean": poll.satisfied.map { $0 as Any } ?? NSNull(),
                            "condition": condition]
                    }],
                "failureGeometry": ["startedMilliseconds": milliseconds(geometryStarted),
                    "returnedMilliseconds": milliseconds(geometryReturned)]
            ]
        }
        guard let data = try? JSONSerialization.data(withJSONObject: payload, options: [.sortedKeys]) else {
            return #"{"schemaVersion":1,"sampling":"predicate-boundaries-no-extra-AX","encodingError":"serialization-failed"}"#
        }
        guard data.count <= 8192 else {
            return #"{"schemaVersion":1,"sampling":"predicate-boundaries-no-extra-AX","encodingError":"payload-exceeded-8192-bytes"}"#
        }
        return String(decoding: data, as: UTF8.self)
    }
}

/// Recovery-only open diagnostics: fixed public fixture IDs and existing Bool results.
/// The per-open context owns no UI element; callback state stays in ReaderWaitBoundaryTrace.
final class ReaderRecoveryOpenTrace {
    enum Phase: String {
        case openStarted = "open-started"
        case libraryCountReturned = "library-count-returned"
        case queryInputStarted = "query-input-started"
        case queryInputReturned = "query-input-returned"
        case rowPrecheckStarted = "row-precheck-started"
        case rowPrecheckReturned = "row-precheck-returned"
        case rowFinalWaitStarted = "row-final-wait-started"
        case rowFinalWaitReturned = "row-final-wait-returned"
        case openReturned = "open-returned"
    }

    private let lock = NSLock()
    private let articleID: String
    private let origin = DispatchTime.now().uptimeNanoseconds
    private var phases: Set<Phase> = []
    private var waitEvents: Set<String> = []
    private var precheckCount = 0
    private var lastPrecheck: Bool?

    init?(articleID: String) {
        guard ["01-concepts/agent-loop", "01-concepts/tool-use",
               "11-llm-internals/transformer-architecture"].contains(articleID) else { return nil }
        self.articleID = articleID
    }

    func recordPrecheck(_ result: Bool) {
        lock.lock()
        defer { lock.unlock() }
        if precheckCount < 12 {
            precheckCount += 1
            lastPrecheck = result
        }
    }

    func emit(_ phase: Phase, observed: Bool? = nil) {
        lock.lock()
        guard phases.insert(phase).inserted else { lock.unlock(); return }
        var payload = context(event: phase.rawValue)
        payload["observedBoolean"] = observed.map { $0 as Any } ?? NSNull()
        lock.unlock()
        output(payload)
    }

    /// Reuse the existing bounded waiter snapshot without exporting its UUID or old scope.
    /// The nested milliseconds are relative to that wait; top-level time is relative to open.
    func emitWait(_ json: String) {
        let snapshot: [String: Any]?
        if let data = json.data(using: .utf8), data.count <= 8192 {
            snapshot = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
        } else { snapshot = nil }
        let keys = ["schemaVersion", "sampling", "event", "callsiteLine", "fullyVisible",
                    "timeoutSeconds", "snapshotMilliseconds", "expectation", "wait", "polls", "failureGeometry"]
        let event: String
        var boundary: [String: Any] = [:]
        if let snapshot, let name = snapshot["event"] as? String,
           ["wait-returned", "failure-geometry-started", "failure-geometry-returned"].contains(name) {
            event = name
            for key in keys { boundary[key] = snapshot[key] }
        } else {
            event = "snapshot-unavailable"
            boundary["encodingError"] = "existing-wait-snapshot-unavailable"
        }
        lock.lock()
        guard waitEvents.count < 3, waitEvents.insert(event).inserted else { lock.unlock(); return }
        var payload = context(event: "row-final-" + event)
        payload["waitBoundary"] = boundary
        lock.unlock()
        output(payload)
    }

    /// Called under the lock. At most nine phase and three boundary lines per open.
    private func context(event: String) -> [String: Any] {
        let timestamp = DispatchTime.now().uptimeNanoseconds
        return [
            "schemaVersion": 1, "sampling": "open-boundaries-no-extra-AX",
            "scope": "ReadingRecoveryUITests-open-row", "articleID": articleID,
            "openStartedUptimeNanoseconds": origin, "event": event,
            "elapsedMilliseconds": Double(timestamp >= origin ? timestamp - origin : 0) / 1_000_000,
            "rowPrecheck": ["observations": precheckCount, "limit": 12,
                "lastBoolean": lastPrecheck.map { $0 as Any } ?? NSNull()]
        ]
    }

    private func output(_ payload: [String: Any]) {
        let json: String
        if let data = try? JSONSerialization.data(withJSONObject: payload, options: [.sortedKeys]), data.count <= 8192 {
            json = String(decoding: data, as: UTF8.self)
        } else {
            json = #"{"schemaVersion":1,"sampling":"open-boundaries-no-extra-AX","encodingError":"serialization-or-8192-byte-output-limit"}"#
        }
        print("AILibraryRecoveryOpen " + json)
    }
}

/// Shared public-UI actions for both the three-article baseline and the full catalog.
/// Waits and gesture limits synchronize tests; they are not performance targets.
class NativeReaderUITestCase: XCTestCase {
    private(set) var app: XCUIApplication!
    var seedsPartialReadingRecovery: Bool { false }
    var recordsRuntime26WaitBoundaries: Bool { false }
    var recordsReadingRecoveryOpenBoundaries: Bool { false }

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchEnvironment["AILIBRARY_UI_TEST_SUITE"] = "ailibrary-uitest-" + UUID().uuidString
        app.launchArguments = ["-AppleLanguages", "(ja)", "-AppleLocale", "ja_JP"]
        if seedsPartialReadingRecovery {
            app.launchEnvironment["AILIBRARY_UI_TEST_READING_RECOVERY"] = "partial-v1"
        }
        app.launch()
    }

    func element(_ identifier: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }

    private func navigationBarFrames(appFrame: CGRect) -> [ReaderNavigationBarFrame] {
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
    }

    private func frameVisibility(_ element: XCUIElement, inside container: XCUIElement?,
                                 fullyVisible: Bool) -> ReaderFrameVisibility {
        let appFrame = app.frame
        if let container, !container.exists { return .unknown("Container is not present") }
        let bars = container == nil ? [] : navigationBarFrames(appFrame: appFrame)
        return ReaderViewportGeometry.visibility(target: element.exists ? element.frame : nil,
            app: appFrame, container: container?.frame, bars: bars, fullyVisible: fullyVisible)
    }

    /// One predicate invocation uses one viewport and value-copied paragraph frames.
    /// AX reads remain sequential; this is a bounded snapshot, not an atomic UI transaction.
    func firstFullyVisibleNativeParagraphMatches(_ target: XCUIElement, inside reader: XCUIElement) -> Bool {
        let appFrame = app.frame
        guard reader.exists else { return false }
        let bars = navigationBarFrames(appFrame: appFrame)
        guard case .resolved(let viewport) = ReaderViewportGeometry.viewport(
            app: appFrame, container: reader.frame, bars: bars) else { return false }
        guard target.exists else { return false }
        let targetFrame = target.frame
        guard ReaderViewportGeometry.visibility(target: targetFrame, viewport: viewport,
                                                fullyVisible: true).visibleForPolling else { return false }
        // Keep the geometry guard before the existing target isHittable getter.
        guard target.isHittable else { return false }
        let snapshots = reader.staticTexts.matching(NSPredicate(format: "identifier BEGINSWITH %@", "native-text-"))
            .allElementsBoundByIndex.compactMap { element -> (element: XCUIElement, frame: CGRect)? in
                guard element.exists else { return nil }
                return (element, element.frame)
            }
        let firstIndex = ReaderViewportGeometry.firstFullyVisibleFrameIndex(
            in: snapshots.map { $0.frame }, viewport: viewport)
        let first = firstIndex.map { snapshots[$0].element }
        return first?.identifier == target.identifier
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
                                  fullyVisible: Bool = false) -> Bool {
        frameVisibility(element, inside: container, fullyVisible: fullyVisible).visibleForPolling
    }

    func isHittableOnScreen(_ element: XCUIElement, inside container: XCUIElement? = nil,
                            fullyVisible: Bool = false) -> Bool {
        observedHittableOnScreen(element, inside: container, fullyVisible: fullyVisible,
                                trace: nil, poll: nil)
    }

    /// Same value-getter order and short circuit as the original positive poll.
    /// Observe only the enum/Bool already returned; never query AX for tracing.
    private func observedHittableOnScreen(_ element: XCUIElement, inside container: XCUIElement?,
                                        fullyVisible: Bool, trace: ReaderWaitBoundaryTrace?,
                                        poll: UInt64?) -> Bool {
        if let trace, let poll { trace.markPollGeometryStarted(poll) }
        let visibility = frameVisibility(element, inside: container, fullyVisible: fullyVisible)
        if let trace, let poll { trace.markPollGeometryReturned(poll, visibility: visibility) }
        // XCTest can raise an activation-point error when asked about an offscreen cell.
        guard visibility.visibleForPolling else { return false }
        if let trace, let poll { trace.markPollHittableStarted(poll) }
        let hittable = element.isHittable
        if let trace, let poll { trace.markPollHittableReturned(poll, value: hittable) }
        return hittable
    }

    /// Failure-only public-UI snapshot. Reads are sequential and may differ from the last poll.
    /// Reuse the existing bar witnesses; bound JSON output, never the viewport calculation.
    private func captureReaderGeometry(_ target: XCUIElement, inside container: XCUIElement?,
                                       fullyVisible: Bool) {
        func frameJSON(_ frame: CGRect?) -> [String: Any] {
            guard let frame else { return ["state": "absent", "coordinates": NSNull()] }
            func number(_ value: CGFloat) -> Any { value.isFinite ? Double(value) as Any : NSNull() }
            let state: String
            if frame.isNull { state = "null" }
            else if frame.isInfinite { state = "infinite" }
            else if ![frame.origin.x, frame.origin.y, frame.size.width, frame.size.height].allSatisfy(\.isFinite) {
                state = "nonfinite"
            } else if frame.isEmpty { state = "empty" }
            else { state = "finite-nonempty" }
            return ["state": state, "coordinates": ["x": number(frame.origin.x), "y": number(frame.origin.y),
                "width": number(frame.size.width), "height": number(frame.size.height)]]
        }

        let appFrame = app.frame
        let containerExists = container.map { $0.exists }
        let containerFrame = containerExists == true ? container?.frame : nil
        let bars = container != nil && containerExists == true ? navigationBarFrames(appFrame: appFrame) : []
        let targetExists = target.exists
        let targetFrame = targetExists ? target.frame : nil
        let viewport: ReaderViewportResolution
        if container != nil && containerExists == false {
            viewport = .unknown("Container is not present")
        } else {
            viewport = ReaderViewportGeometry.viewport(app: appFrame, container: containerFrame, bars: bars)
        }
        let visibility: ReaderFrameVisibility
        let viewportJSON: [String: Any]
        switch viewport {
        case .resolved(let frame):
            viewportJSON = ["state": "resolved", "reason": NSNull(), "frame": frameJSON(frame)]
            visibility = ReaderViewportGeometry.visibility(target: targetFrame, viewport: frame,
                                                           fullyVisible: fullyVisible)
        case .unknown(let reason):
            viewportJSON = ["state": "unknown", "reason": reason, "frame": NSNull()]
            visibility = .unknown(reason)
        }
        let visibilityJSON: [String: Any]
        switch visibility {
        case .visible: visibilityJSON = ["state": "visible", "reason": NSNull()]
        case .hidden: visibilityJSON = ["state": "hidden", "reason": NSNull()]
        case .unknown(let reason): visibilityJSON = ["state": "unknown", "reason": reason]
        }
        // Keep the original guard before this getter to avoid offscreen activation-point errors.
        let targetIsHittable: Bool? = visibility.visibleForPolling ? target.isHittable : nil
        let listedBars = bars.prefix(8).enumerated().map { index, bar -> [String: Any] in
            ["index": index, "frame": frameJSON(bar.frame),
             "hasEnabledHittableControl": bar.hasEnabledHittableControl,
             "eligibleAsForeground": ReaderViewportGeometry.finiteNonempty(bar.frame) &&
                appFrame.contains(bar.frame) && bar.hasEnabledHittableControl]
        }
        let snapshot: [String: Any] = [
            "app": ["frame": frameJSON(appFrame)],
            "container": ["requested": container != nil,
                "exists": containerExists.map { $0 as Any } ?? NSNull(), "frame": frameJSON(containerFrame)],
            "target": ["exists": targetExists, "frame": frameJSON(targetFrame)],
            "navigationBars": ["sampling": container == nil ? "not-required" :
                (containerExists == true ? "sampled" : "container-absent"),
                "total": bars.count, "omitted": max(0, bars.count - listedBars.count), "items": listedBars],
            "viewport": viewportJSON,
            "predicate": ["fullyVisible": fullyVisible, "geometry": visibilityJSON,
                "targetIsHittable": targetIsHittable.map { $0 as Any } ?? NSNull(),
                "targetIsHittableRead": visibility.visibleForPolling ? "once-after-visible-geometry" : "skipped-by-geometry-guard",
                "satisfied": visibility.visibleForPolling && targetIsHittable == true]
        ]
        let payload: [String: Any] = ["schemaVersion": 1, "sampling": "after-timeout-sequential",
                                     "snapshot": snapshot, "encodingError": NSNull()]
        let json: String
        if let data = try? JSONSerialization.data(withJSONObject: payload, options: [.sortedKeys]) {
            if data.count <= 8192 { json = String(decoding: data, as: UTF8.self) }
            else {
                json = #"{"schemaVersion":1,"sampling":"after-timeout-sequential","snapshot":null,"encodingError":"payload-exceeded-8192-bytes"}"#
            }
        } else {
            json = #"{"schemaVersion":1,"sampling":"after-timeout-sequential","snapshot":null,"encodingError":"serialization-failed"}"#
        }
        print("AILibraryReaderGeometry " + json)
        let attachment = XCTAttachment(string: json)
        attachment.name = "Public-UI-target-not-visible-geometry"
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    func requireHittable(_ element: XCUIElement, inside container: XCUIElement? = nil,
                         fullyVisible: Bool = false, timeout: TimeInterval = 15,
                         recoveryOpenTrace: ReaderRecoveryOpenTrace? = nil,
                         file: StaticString = #filePath, line: UInt = #line) {
        let trace: ReaderWaitBoundaryTrace?
        if recoveryOpenTrace != nil {
            trace = ReaderWaitBoundaryTrace(callsiteLine: line, fullyVisible: fullyVisible, timeout: timeout)
        } else if #available(iOS 26.0, *), recordsRuntime26WaitBoundaries {
            trace = ReaderWaitBoundaryTrace(callsiteLine: line, fullyVisible: fullyVisible, timeout: timeout)
        } else { trace = nil }
        let emitTrace: (String) -> Void = { json in
            if let recoveryOpenTrace { recoveryOpenTrace.emitWait(json) }
            else { print("AILibraryReaderWait " + json) }
        }
        let predicate = NSPredicate { _, _ in
            let poll = trace?.beginPoll()
            let satisfied = self.observedHittableOnScreen(element, inside: container,
                fullyVisible: fullyVisible, trace: trace, poll: poll)
            if let poll { trace?.endPoll(poll, satisfied: satisfied) }
            return satisfied
        }
        trace?.markExpectationStarted()
        let visible = XCTNSPredicateExpectation(predicate: predicate, object: nil)
        trace?.markExpectationReturned()
        trace?.markWaitStarted()
        let result = XCTWaiter.wait(for: [visible], timeout: timeout)
        if let trace { emitTrace(trace.json(at: .waitReturned, completed: result == .completed)) }
        if result != .completed {
            if let trace { emitTrace(trace.json(at: .geometryStarted)) }
            captureReaderGeometry(element, inside: container, fullyVisible: fullyVisible)
            if let trace { emitTrace(trace.json(at: .geometryReturned)) }
            capture("Public-UI-target-not-visible")
            let hierarchy = XCTAttachment(string: app.debugDescription)
            hierarchy.name = "Public-UI-target-not-visible-hierarchy"
            hierarchy.lifetime = .keepAlways
            add(hierarchy)
        }
        XCTAssertEqual(result, .completed,
                       "The requested public UI element must be visible and usable", file: file, line: line)
    }

    /// Failure-only sequential AX reads; output is bounded, not an atomic UI snapshot.
    private func captureLibraryCountTimeout() {
        let prefix = "AILibraryLaunchUI "
        let outputLimit = 32768 - prefix.utf8.count - 1
        let hierarchyLimit = 24576
        let appState = app.state
        let publicElements: [String: Bool] = [
            "articleCountAfterTimeout": app.staticTexts["library-article-count"].exists,
            "searchField": app.searchFields.firstMatch.exists,
            "loadErrorHeading": app.staticTexts["コンテンツを読み込めません"].exists,
            "retryButton": app.buttons["再試行"].exists,
            "bundledInventoryMismatchReason": app.staticTexts.matching(
                NSPredicate(format: "label CONTAINS %@", "ファイル一覧と実際の内容が一致しません。")).firstMatch.exists,
            "loadingLabel": app.descendants(matching: .any).matching(
                NSPredicate(format: "label == %@", "コンテンツを確認中")).firstMatch.exists,
            "bundledSwitchingLabel": app.descendants(matching: .any).matching(
                NSPredicate(format: "label == %@", "同梱コンテンツへ切り替え中")).firstMatch.exists,
            "progressIndicator": app.progressIndicators.firstMatch.exists,
            "nativeReader": app.scrollViews["native-reader"].exists
        ]
        let rawHierarchy = app.debugDescription
        var hierarchy = String(decoding: rawHierarchy.utf8.prefix(hierarchyLimit), as: UTF8.self)
        for pattern in [
            #"(?i)\b(?:https?|file)://[^\s\"'<>]+"#,
            #"(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b"#,
            #"/(?:Users|private|var|tmp|home|Volumes)/[^\s\"'<>]*"#,
            #"(?i)\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b"#,
            #"(?im)\b(?:label|value|placeholderValue):[^\r\n]*"#
        ] {
            hierarchy = hierarchy.replacingOccurrences(of: pattern, with: "<redacted>", options: .regularExpression)
        }
        var payload: [String: Any] = [
            "schemaVersion": 1, "sampling": "after-library-count-timeout-sequential",
            "appState": String(describing: appState), "publicElements": publicElements,
            "launchSuite": app.launchEnvironment["AILIBRARY_UI_TEST_SUITE"] ?? "",
            "hierarchy": hierarchy, "hierarchyTruncated": rawHierarchy.utf8.count > hierarchyLimit
        ]
        let json: String
        if let data = try? JSONSerialization.data(withJSONObject: payload, options: [.sortedKeys]), data.count <= outputLimit {
            json = String(decoding: data, as: UTF8.self)
        } else {
            payload["hierarchy"] = NSNull()
            payload["hierarchyOmittedReason"] = "serialization-or-32768-byte-output-limit"
            if let data = try? JSONSerialization.data(withJSONObject: payload, options: [.sortedKeys]), data.count <= outputLimit {
                json = String(decoding: data, as: UTF8.self)
            } else {
                json = #"{"schemaVersion":1,"sampling":"after-library-count-timeout-sequential","diagnosticOmittedReason":"serialization-or-output-limit"}"#
            }
        }
        print(prefix + json)
        let attachment = XCTAttachment(string: json)
        attachment.name = "Public-UI-library-count-timeout"
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    func open(_ title: String, articleID: String, query: String? = nil) {
        let openTrace = recordsReadingRecoveryOpenBoundaries ? ReaderRecoveryOpenTrace(articleID: articleID) : nil
        openTrace?.emit(.openStarted)
        let libraryCountAppeared = app.staticTexts["library-article-count"].waitForExistence(timeout: 45)
        openTrace?.emit(.libraryCountReturned, observed: libraryCountAppeared)
        if !libraryCountAppeared { captureLibraryCountTimeout() }
        XCTAssertTrue(libraryCountAppeared)
        openTrace?.emit(.queryInputStarted)
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
        openTrace?.emit(.queryInputReturned)

        openTrace?.emit(.rowPrecheckStarted)
        let row = element("library-article-" + articleID)
        for _ in 0..<12 {
            let rowHittable = isHittableOnScreen(row)
            openTrace?.recordPrecheck(rowHittable)
            if rowHittable { break }
            app.swipeUp(velocity: .slow)
        }
        openTrace?.emit(.rowPrecheckReturned)
        openTrace?.emit(.rowFinalWaitStarted)
        requireHittable(row, recoveryOpenTrace: openTrace)
        openTrace?.emit(.rowFinalWaitReturned)
        row.tap()
        requireNativeBody()
        openTrace?.emit(.openReturned)
    }

    func requireNativeBody() {
        XCTAssertTrue(app.scrollViews["native-reader"].waitForExistence(timeout: 20))
        let paragraph = app.staticTexts.matching(NSPredicate(format: "identifier BEGINSWITH %@", "native-text-")).firstMatch
        XCTAssertTrue(paragraph.waitForExistence(timeout: 10), "Native body text must appear, beyond the navigation title")
        XCTAssertFalse(paragraph.label.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
    }

    func goToContents(_ title: String, headingID: String) {
        let precheckStarted = DispatchTime.now().uptimeNanoseconds
        app.buttons["目次"].tap()
        XCTAssertTrue(app.navigationBars["目次"].waitForExistence(timeout: 5))
        let target = app.buttons[title].firstMatch
        var positiveObserved = false
        var checkCount = 0
        var gestures = 0
        for _ in 0..<18 {
            let ready = isHittableOnScreen(target)
            checkCount += 1
            if ready {
                positiveObserved = true
                break
            }
            app.swipeUp(velocity: .slow)
            gestures += 1
        }
        let finalWaitRequired = !positiveObserved
        let precheckReturned = DispatchTime.now().uptimeNanoseconds
        let elapsed = precheckReturned >= precheckStarted ? precheckReturned - precheckStarted : 0
        // One bounded precheck record only; no additional AX reads or final-wait result claim.
        let prefix = "AILibraryContentsReadiness "
        let headingLimit = 96
        let boundedHeading = String(decoding: Array(headingID.utf8.prefix(headingLimit)), as: UTF8.self)
        let payload: [String: Any] = ["schemaVersion": 1, "phase": "precheck-finished",
            "checkCount": checkCount, "gestures": gestures, "positiveObserved": positiveObserved,
            "finalWaitRequired": finalWaitRequired, "elapsedNanoseconds": elapsed,
            "headingID": boundedHeading, "headingIDTruncated": headingID.utf8.count > headingLimit]
        let json: String
        if let data = try? JSONSerialization.data(withJSONObject: payload, options: [.sortedKeys]),
           data.count <= 1024 - prefix.utf8.count - 1 {
            json = String(decoding: data, as: UTF8.self)
        } else {
            json = #"{"schemaVersion":1,"phase":"precheck-finished","checkCount":\#(checkCount),"gestures":\#(gestures),"positiveObserved":\#(positiveObserved),"finalWaitRequired":\#(finalWaitRequired),"elapsedNanoseconds":\#(elapsed),"headingID":"","headingIDTruncated":true,"encodingError":"json-unavailable-or-cap"}"#
        }
        print(prefix + json)
        // The first positive uses the identical readiness predicate. Its second
        // observation is intentionally omitted; an unobserved positive still waits.
        if finalWaitRequired { requireHittable(target) }
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
    override var recordsRuntime26WaitBoundaries: Bool { true }
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
    func testHealthyLegacyHeadingPositionAndBookmarkPersistAfterNativeResumeAndRelaunch() throws {
        // This case alone replaces the base setup's unused empty domain with a
        // fresh DEBUG legacy record. The seed contains no native block or anchor.
        app.terminate()
        XCTAssertEqual(app.state, .notRunning)
        let suite = "ailibrary-uitest-" + UUID().uuidString
        app.launchEnvironment["AILIBRARY_UI_TEST_SUITE"] = suite
        app.launchEnvironment["AILIBRARY_UI_TEST_READING_LEGACY"] = "heading-v1"
        XCTAssertNil(app.launchEnvironment["AILIBRARY_UI_TEST_READING_RECOVERY"])
        app.launch()

        let initialResume = element("library-resume")
        XCTAssertTrue(initialResume.waitForExistence(timeout: 45))
        requireHittable(initialResume)
        initialResume.tap()
        requireNativeBody()
        XCTAssertTrue(app.buttons["しおりを削除"].waitForExistence(timeout: 10))
        let reader = app.scrollViews["native-reader"]
        let originalHeading = app.staticTexts["native-heading-自己注意の数式"]
        let laterHeading = app.staticTexts["native-heading-ffn-と残差ストリーム"]
        // Do not issue a search, TOC request or gesture to repair this legacy arrival.
        requireHittable(originalHeading, inside: reader, fullyVisible: true)
        XCTAssertFalse(hasVisibleFrame(laterHeading, inside: reader, fullyVisible: true),
                       "The two saved positions must not share the witnessed viewport")
        capture("Healthy-legacy-native-resume-A")

        // An ordinary new read must supersede the old heading, then persist.
        goToContents("FFN と残差ストリーム", headingID: "ffn-と残差ストリーム")
        XCTAssertFalse(hasVisibleFrame(originalHeading, inside: reader, fullyVisible: true))
        returnToLibrary()
        app.terminate()
        XCTAssertEqual(app.state, .notRunning)
        app.launchEnvironment.removeValue(forKey: "AILIBRARY_UI_TEST_READING_LEGACY")
        XCTAssertEqual(app.launchEnvironment["AILIBRARY_UI_TEST_SUITE"], suite)
        app.launch()
        XCTAssertNil(app.launchEnvironment["AILIBRARY_UI_TEST_READING_LEGACY"])

        let savedResume = element("library-resume")
        XCTAssertTrue(savedResume.waitForExistence(timeout: 45))
        requireHittable(savedResume)
        savedResume.tap()
        requireNativeBody()
        XCTAssertTrue(app.buttons["しおりを削除"].waitForExistence(timeout: 10))
        // The first post-relaunch arrival must be B, without replaying seed A or
        // adding a corrective navigation/scroll operation after Continue.
        let resumedReader = app.scrollViews["native-reader"]
        requireHittable(app.staticTexts["native-heading-ffn-と残差ストリーム"],
                        inside: resumedReader, fullyVisible: true)
        XCTAssertFalse(hasVisibleFrame(app.staticTexts["native-heading-自己注意の数式"],
                                       inside: resumedReader, fullyVisible: true))
        capture("Healthy-legacy-native-resume-B")
    }

}

/// Pure CGRect regressions; these tests do not launch the application.
final class ReaderViewportGeometryTests: XCTestCase {
    private let appFrame = CGRect(x: 0, y: 0, width: 393, height: 852)
    private let readerFrame = CGRect(x: 0, y: 69, width: 393, height: 783)
    private var front: ReaderNavigationBarFrame {
        ReaderNavigationBarFrame(frame: CGRect(x: 0, y: 69, width: 393, height: 56),
                                 hasEnabledHittableControl: true)
    }

    func testUnknownOrAmbiguousForegroundDoesNotBecomeVisible() {
        let target = CGRect(x: 18, y: 139, width: 150, height: 26)
        XCTAssertEqual(ReaderViewportGeometry.visibility(target: target, app: appFrame,
            container: readerFrame, bars: [], fullyVisible: true),
            .unknown("Expected one foreground navigation bar, found 0"))
        XCTAssertEqual(ReaderViewportGeometry.visibility(target: target, app: appFrame,
            container: readerFrame, bars: [front, front], fullyVisible: true),
            .unknown("Expected one foreground navigation bar, found 2"))
        XCTAssertFalse(ReaderViewportGeometry.visibility(target: nil, app: .null,
            container: readerFrame, bars: [front], fullyVisible: true).visibleForPolling)
    }

    func testForegroundOcclusionAndPartialFrameRemainExcluded() {
        let background = ReaderNavigationBarFrame(
            frame: CGRect(x: 16, y: 108.3, width: 361, height: 47.8), hasEnabledHittableControl: false)
        guard case .resolved(let viewport) = ReaderViewportGeometry.viewport(
            app: appFrame, container: readerFrame, bars: [background, front]) else {
            return XCTFail("A single witnessed foreground bar must resolve")
        }
        XCTAssertEqual(viewport.minY, 125)
        XCTAssertFalse(ReaderViewportGeometry.visibility(
            target: CGRect(x: 18, y: 100, width: 150, height: 20),
            viewport: viewport, fullyVisible: true).visibleForPolling)
        XCTAssertFalse(ReaderViewportGeometry.visibility(
            target: CGRect(x: 18, y: 118, width: 150, height: 20),
            viewport: viewport, fullyVisible: true).visibleForPolling)
        XCTAssertTrue(ReaderViewportGeometry.visibility(
            target: CGRect(x: 18, y: 125, width: 150, height: 20),
            viewport: viewport, fullyVisible: true).visibleForPolling)
    }

    func testCopiedFramesSelectLowestFullyVisibleParagraph() {
        let viewport = CGRect(x: 0, y: 125, width: 393, height: 727)
        let frames = [CGRect(x: 18, y: 160, width: 150, height: 20),
                      CGRect(x: 18, y: 125, width: 150, height: 20),
                      CGRect(x: 18, y: 118, width: 150, height: 20)]
        XCTAssertEqual(ReaderViewportGeometry.firstFullyVisibleFrameIndex(in: frames, viewport: viewport), 1)
    }

    func testEqualTopFramesPreserveCollectionOrder() {
        let viewport = CGRect(x: 0, y: 125, width: 393, height: 727)
        let frames = [CGRect(x: 18, y: 125, width: 150, height: 20),
                      CGRect(x: 200, y: 125, width: 150, height: 30)]
        XCTAssertEqual(ReaderViewportGeometry.firstFullyVisibleFrameIndex(in: frames, viewport: viewport), 0)
    }

    func testNonfiniteEmptyAndOccludedFramesCannotWin() {
        let viewport = CGRect(x: 0, y: 125, width: 393, height: 727)
        let frames = [CGRect(x: 18, y: CGFloat.nan, width: 150, height: 20), .zero,
                      CGRect(x: 18, y: 100, width: 150, height: 20),
                      CGRect(x: 18, y: 139, width: 150, height: 20)]
        XCTAssertEqual(ReaderViewportGeometry.firstFullyVisibleFrameIndex(in: frames, viewport: viewport), 3)
        XCTAssertNil(ReaderViewportGeometry.firstFullyVisibleFrameIndex(in: Array(frames.prefix(3)), viewport: viewport))
    }

    func testInvalidViewportAndEmptyCollectionFailClosed() {
        let target = CGRect(x: 18, y: 139, width: 150, height: 20)
        for viewport in [CGRect.null, .zero, CGRect(x: 0, y: CGFloat.nan, width: 393, height: 727)] {
            XCTAssertNil(ReaderViewportGeometry.firstFullyVisibleFrameIndex(in: [target], viewport: viewport))
        }
        XCTAssertNil(ReaderViewportGeometry.firstFullyVisibleFrameIndex(in: [], viewport: appFrame))
    }
}
