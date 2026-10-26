import SwiftUI
import UIKit

#if DEBUG
/// Temporary numeric/fixed-case diagnostics only. No reading content or IDs.
@MainActor
private enum NativeReaderTrace {
    enum Event: String {
        case restoreBegin = "restore_begin", moveBegin = "move_begin"
        case observation = "placement_observation", action = "policy_action"
        case complete = "complete_placement", receive, progress, save = "take_for_saving"
    }
    enum Reason: String {
        case generationMismatch = "generation_mismatch", trackingGate = "tracking_gate"
        case sessionGate = "session_gate", measurementGate = "measurement_unavailable_or_unchanged"
        case staged, stageRefused = "stage_refused", takeResult = "take_result", didSave = "did_save"
        case missingTopLevel = "missing_top_level", missingIntra = "missing_intra_fraction", measured
    }
    private struct Request {
        let serial: Int
        let startedAt: TimeInterval
        let purpose: NativeReadingPlacementRequest.Purpose
    }
    private static let enabled: Bool = {
        guard let suite = ProcessInfo.processInfo.environment["AILIBRARY_UI_TEST_SUITE"] else { return false }
        return suite.hasPrefix("ailibrary-uitest-") && suite.count < 100
    }()
    private static let processID = Int(ProcessInfo.processInfo.processIdentifier)
    private static var requests: [UUID: Request] = [:]
    private static var requestSerial = 0
    private static var lines = 0
    private static let numberKeys: Set<String> = ["interactionEpoch", "requestInteractionEpoch", "userPanEpoch",
        "requestUserPanEpoch", "blockedUserPanEpoch", "layoutPasses", "materializations", "corrections",
        "consecutiveAlignedPasses", "remainingMs"]
    private static let flagKeys: Set<String> = ["generationMatches", "interactionEpochMatches", "hasStoredHeading",
        "hasStoredBlock", "hasStoredAnchor", "hasStoredIntraFraction", "hasPreviousProgress", "hasCurrentBlock",
        "hasMeasured", "hasObservedBlock", "isUserInteracting", "trackingReady", "restoring", "layoutMatches",
        "hasBlockedEpoch", "panEpochMatches", "hasReadingBlock", "sampleChanged", "hasDelayToken", "hasSample",
        "willCallOnPosition", "didCallOnPosition", "hasRequestedIntraFraction", "hasStartMarker", "hasEndMarker",
        "hasRootWindow", "startWindowMatches", "endWindowMatches", "startDescendant", "endDescendant",
        "hasRootMarker", "hasRootScroll", "hasScrollWindow", "scrollWindowMatches", "hasStartWindow",
        "hasEndWindow", "isScrollEnabled", "isTextView"]

    static func begin(_ event: Event, generation: UUID, purpose: NativeReadingPlacementRequest.Purpose,
                      numbers: [String: Double], flags: [String: Bool]) {
        guard enabled, requests.count < 256 else { return }
        requestSerial += 1
        requests[generation] = Request(serial: requestSerial, startedAt: CACurrentMediaTime(), purpose: purpose)
        emit(event, generation: generation, numbers: numbers, flags: flags)
    }

    static func emit(_ event: Event, generation: UUID, numbers: [String: Double] = [:],
                     flags: [String: Bool] = [:], reason: Reason? = nil,
                     observation: NativeReaderPlacementPolicy.Observation? = nil,
                     action: NativeReaderPlacementPolicy.Action? = nil,
                     outcome: NativeReaderPlacementPolicy.Outcome? = nil,
                     effect: NativeReadingProgressSession.CompletionEffect? = nil) {
        guard enabled, lines < 256, Set(numbers.keys).isSubset(of: numberKeys),
              Set(flags.keys).isSubset(of: flagKeys), numbers.values.allSatisfy(\.isFinite) else { return }
        let request = requests[generation]
        let elapsed = request.map { max(0, (CACurrentMediaTime() - $0.startedAt) * 1000) } ?? 0
        guard elapsed.isFinite else { return }
        var value: [String: Any] = ["event": event.rawValue, "processID": processID,
            "requestSerial": request?.serial ?? 0, "sequence": lines + 1, "elapsedMs": elapsed]
        for (key, number) in numbers { value[key] = number }
        for (key, flag) in flags { value[key] = flag }
        if let request { value["purpose"] = purposeName(request.purpose) }
        if let reason { value["reason"] = reason.rawValue }
        if let observation { value["observation"] = observationName(observation) }
        if let action {
            switch action {
            case .waitForLayout: value["action"] = "wait_for_layout"
            case .materialize: value["action"] = "materialize"
            case .align: value["action"] = "align"
            case .finished(let end): value["action"] = "finished"; value["outcome"] = outcomeName(end)
            }
        }
        if let outcome { value["outcome"] = outcomeName(outcome) }
        if let effect { value["effect"] = effectName(effect) }
        write("AILibraryReaderTrace", value)
    }

    static func geometry(_ original: [String: Any], generation: UUID?) {
        guard enabled, lines < 256 else { return }
        var value = original
        value["processID"] = processID
        value["requestSerial"] = generation.flatMap { requests[$0]?.serial } ?? 0
        value["sequence"] = lines + 1
        write("AILibraryReaderGeometry", value)
    }

    private static func write(_ prefix: String, _ value: [String: Any]) {
        guard enabled, lines < 256,
              let bytes = try? JSONSerialization.data(withJSONObject: value, options: [.sortedKeys]),
              prefix.utf8.count + 1 + bytes.count + 1 <= 2048,
              let text = String(data: bytes, encoding: .utf8) else { return }
        lines += 1
        print(prefix + " " + text)
    }
    private static func purposeName(_ value: NativeReadingPlacementRequest.Purpose) -> String {
        switch value {
        case .automaticResume: return "automatic_resume"
        case .automaticReflow: return "automatic_reflow"
        case .explicitNavigation: return "explicit_navigation"
        }
    }
    private static func observationName(_ value: NativeReaderPlacementPolicy.Observation) -> String {
        switch value {
        case .rootNotReady: return "root_not_ready"
        case .targetMissing: return "target_missing"
        case .needsAlignment: return "needs_alignment"
        case .aligned: return "aligned"
        case .userInterruption: return "user_interruption"
        case .unavailable: return "unavailable"
        }
    }
    private static func outcomeName(_ value: NativeReaderPlacementPolicy.Outcome) -> String {
        switch value {
        case .aligned: return "aligned"
        case .interrupted: return "interrupted"
        case .exhausted: return "exhausted"
        case .cancelled: return "cancelled"
        case .superseded: return "superseded"
        case .unavailable: return "unavailable"
        }
    }
    private static func effectName(_ value: NativeReadingProgressSession.CompletionEffect) -> String {
        switch value {
        case .measuredAlignment: return "measured_alignment"
        case .measuredUserPan: return "measured_user_pan"
        case .preserveAutomaticPosition: return "preserve_automatic_position"
        case .preserveUnreachedNavigation: return "preserve_unreached_navigation"
        case .ignoreSuperseded: return "ignore_superseded"
        }
    }
}

#endif
private struct NativeBlockFrames: PreferenceKey {
    static var defaultValue: [String: CGRect] = [:]
    static func reduce(value: inout [String: CGRect], nextValue: () -> [String: CGRect]) {
        value.merge(nextValue(), uniquingKeysWith: { _, latest in latest })
    }
}

private enum NativeReaderScrollTarget: Hashable {
    case container(String)
    case block(String)
}

private struct NativeReaderLayoutIdentity: Hashable {
    let source: String
    let width: CGFloat
    let height: CGFloat
    let bodySize: CGFloat
}

enum NativeReaderScrollBounds {
    /// These exclusions overlap in the same scroll-bounds coordinates. Never
    /// add the safe area again when UIKit already included it in adjusted insets.
    static func visibleTopInset(adjustedTopInset: CGFloat, safeAreaTopInset: CGFloat) -> CGFloat? {
        guard [adjustedTopInset, safeAreaTopInset].allSatisfy(\.isFinite),
              adjustedTopInset >= 0, safeAreaTopInset >= 0 else { return nil }
        return max(adjustedTopInset, safeAreaTopInset)
    }

    static func offset(targetMinY: CGFloat, topInset: CGFloat, bottomInset: CGFloat,
                       contentHeight: CGFloat, viewportHeight: CGFloat,
                       visibleTopInset: CGFloat? = nil,
                       targetMaxY: CGFloat? = nil, intraBlockFraction: Double? = nil) -> CGFloat? {
        let alignmentTop = visibleTopInset ?? topInset
        guard [targetMinY, topInset, bottomInset, contentHeight, viewportHeight, alignmentTop].allSatisfy(\.isFinite),
              topInset >= 0, bottomInset >= 0, contentHeight >= 0, viewportHeight > 0,
              alignmentTop >= 0 else { return nil }
        var targetY = targetMinY
        if let intraBlockFraction {
            guard let fraction = NativeReadingAnchor.validFraction(intraBlockFraction),
                  let targetMaxY, targetMaxY.isFinite,
                  targetMaxY > targetMinY, (targetMaxY - targetMinY).isFinite else { return nil }
            targetY += CGFloat(fraction) * (targetMaxY - targetMinY)
            guard targetY.isFinite else { return nil }
        }
        let minimum = -topInset
        let maximum = max(minimum, contentHeight - viewportHeight + bottomInset)
        let desired = targetY - alignmentTop
        guard maximum.isFinite, desired.isFinite else { return nil }
        return min(maximum, max(minimum, desired))
    }

    static func intraBlockFraction(blockMinY: CGFloat, blockMaxY: CGFloat, readingLineY: CGFloat) -> Double? {
        guard [blockMinY, blockMaxY, readingLineY].allSatisfy(\.isFinite),
              blockMaxY > blockMinY, (blockMaxY - blockMinY).isFinite else { return nil }
        let value = Double((readingLineY - blockMinY) / (blockMaxY - blockMinY))
        guard value.isFinite else { return nil }
        return min(1, max(0, value))
    }

    static func readingBlockID(frames: [String: CGFloat], viewportHeight: CGFloat, topInset: CGFloat) -> String? {
        guard viewportHeight.isFinite, viewportHeight > 0, topInset.isFinite, topInset >= 0 else { return nil }
        let visible = frames.filter { $0.value.isFinite && $0.value < viewportHeight }
        let above = visible.filter { $0.value <= topInset + 24 }.max { $0.value < $1.value }
        return (above ?? visible.min { $0.value < $1.value })?.key
    }
}

enum NativeReaderScrollPlacement: Equatable {
    // Legacy single-call result: aligned means an offset was issued. The request
    // coordinator below additionally requires two later geometry observations.
    case aligned, waitingForLayout, unavailable, interrupted
}

/// Root registration lives outside all horizontal figures/tables and text views.
/// Targets remain weak. Observing the known root recognizer adds no delegate,
/// gesture recognizer, touch cancellation, or simultaneous-gesture policy.
final class NativeReaderScrollAnchors: NSObject {
    private final class WeakMarker {
        weak var view: UIView?
        init(_ view: UIView) { self.view = view }
    }
    private enum Layout {
        case ready(UIScrollView, CGFloat)
        case rootNotReady, targetMissing, unavailable, interrupted
    }
    private weak var rootMarker: UIView?
    private var targets: [String: WeakMarker] = [:]
    private var ends: [String: WeakMarker] = [:]
    private weak var observedPan: UIPanGestureRecognizer?
    private var observedScrollID: ObjectIdentifier?
    private weak var pendingLayoutFrame: NativeReaderLayoutFrame?
    private(set) var interactionEpoch: UInt64 = 0
    private(set) var userPanEpoch: UInt64 = 0
    #if DEBUG
    private var geometrySampleCount = 0
    var debugTraceGeneration: UUID?
    #endif

    deinit { observedPan?.removeTarget(self, action: #selector(rootPanChanged(_:))) }

    @MainActor func registerRoot(_ view: UIView) {
        rootMarker = view
        updatePanObservation()
    }
    func registerTarget(_ view: UIView, id: String, isEnd: Bool = false) {
        if isEnd {
            if ends[id]?.view !== view { ends[id] = WeakMarker(view) }
        } else if targets[id]?.view !== view { targets[id] = WeakMarker(view) }
    }

    @MainActor private func rootScrollView() -> UIScrollView? {
        var ancestor = rootMarker?.superview
        while ancestor != nil, !(ancestor is UIScrollView) { ancestor = ancestor?.superview }
        return ancestor as? UIScrollView
    }

    @MainActor private func updatePanObservation() {
        guard let scroll = rootScrollView(), !(scroll is UITextView), scroll.isScrollEnabled else { return }
        let identity = ObjectIdentifier(scroll)
        guard observedScrollID != identity || observedPan !== scroll.panGestureRecognizer else { return }
        if observedScrollID != nil {
            interactionEpoch &+= 1
            pendingLayoutFrame?.cancel()
        }
        observedPan?.removeTarget(self, action: #selector(rootPanChanged(_:)))
        observedScrollID = identity
        observedPan = scroll.panGestureRecognizer
        observedPan?.addTarget(self, action: #selector(rootPanChanged(_:)))
    }

    @MainActor @objc private func rootPanChanged(_ recognizer: UIPanGestureRecognizer) {
        // A completed short pan must still invalidate an earlier request even
        // when no polling pass happened while isDragging was true.
        if recognizer.state == .began {
            userPanEpoch &+= 1
            interactionEpoch &+= 1
            pendingLayoutFrame?.cancel()
        }
    }

    #if DEBUG
    @MainActor func debugMarkerFlags(for id: String) -> [String: Bool] {
        let window = rootMarker?.window
        let scroll = rootScrollView()
        let start = targets[id]?.view, end = ends[id]?.view
        return ["hasRootMarker": rootMarker != nil, "hasRootScroll": scroll != nil,
            "hasScrollWindow": scroll?.window != nil, "scrollWindowMatches": window != nil && scroll?.window === window,
            "isScrollEnabled": scroll?.isScrollEnabled ?? false, "isTextView": scroll is UITextView,
            "hasRootWindow": window != nil, "hasStartMarker": start != nil, "hasEndMarker": end != nil,
            "hasStartWindow": start?.window != nil, "hasEndWindow": end?.window != nil,
            "startWindowMatches": window != nil && start?.window === window,
            "endWindowMatches": window != nil && end?.window === window,
            "startDescendant": scroll.map { start?.isDescendant(of: $0) ?? false } ?? false,
            "endDescendant": scroll.map { end?.isDescendant(of: $0) ?? false } ?? false]
    }

    #endif
    @MainActor func beginPlacement() -> UInt64 {
        pendingLayoutFrame?.cancel()
        updatePanObservation()
        #if DEBUG
        geometrySampleCount = 0
        #endif
        return interactionEpoch
    }

    @MainActor var isUserInteracting: Bool {
        guard let scroll = rootScrollView() else { return false }
        return scroll.isTracking || scroll.isDragging || scroll.isDecelerating
    }

    @MainActor func stopObservingPan() {
        interactionEpoch &+= 1
        pendingLayoutFrame?.cancel()
        observedPan?.removeTarget(self, action: #selector(rootPanChanged(_:)))
        observedPan = nil
        observedScrollID = nil
    }

    @MainActor func waitForLayout(until deadline: TimeInterval) async -> Bool {
        let frame = NativeReaderLayoutFrame()
        pendingLayoutFrame?.cancel()
        pendingLayoutFrame = frame
        let displayed = await frame.wait(until: deadline)
        if pendingLayoutFrame === frame { pendingLayoutFrame = nil }
        return displayed
    }

    @MainActor func readingBlockID(in blockIDs: [String]) -> String? {
        guard let window = rootMarker?.window, let scroll = rootScrollView(),
              scroll.window === window, !(scroll is UITextView), scroll.isScrollEnabled,
              scroll.contentOffset.y.isFinite,
              let visibleTop = NativeReaderScrollBounds.visibleTopInset(
                adjustedTopInset: scroll.adjustedContentInset.top,
                safeAreaTopInset: scroll.safeAreaInsets.top) else { return nil }
        let frames = blockIDs.reduce(into: [String: CGFloat]()) { result, id in
            guard let target = targets[id]?.view, target.window === window,
                  target.isDescendant(of: scroll) else { return }
            result[id] = target.convert(target.bounds, to: scroll).minY - scroll.contentOffset.y
        }
        return NativeReaderScrollBounds.readingBlockID(frames: frames, viewportHeight: scroll.bounds.height,
                                                       topInset: visibleTop)
    }

    @MainActor func intraBlockFraction(for id: String) -> Double? {
        guard let window = rootMarker?.window, let scroll = rootScrollView(),
              scroll.window === window, !(scroll is UITextView), scroll.isScrollEnabled,
              scroll.bounds.width.isFinite, scroll.bounds.width > 0,
              scroll.bounds.height.isFinite, scroll.bounds.height > 0,
              scroll.contentSize.height.isFinite, scroll.contentSize.height > 0,
              scroll.contentOffset.y.isFinite,
              let visibleTop = NativeReaderScrollBounds.visibleTopInset(
                adjustedTopInset: scroll.adjustedContentInset.top,
                safeAreaTopInset: scroll.safeAreaInsets.top),
              let start = targets[id]?.view, let end = ends[id]?.view,
              start.window === window, end.window === window,
              start.isDescendant(of: scroll), end.isDescendant(of: scroll) else { return nil }
        return NativeReaderScrollBounds.intraBlockFraction(
            blockMinY: start.convert(start.bounds, to: scroll).minY,
            blockMaxY: end.convert(end.bounds, to: scroll).minY,
            readingLineY: scroll.contentOffset.y + visibleTop)
    }

    @MainActor private func layout(of id: String, intraBlockFraction: Double? = nil) -> Layout {
        updatePanObservation()
        guard let root = rootMarker, let scroll = rootScrollView(), root.window != nil else { return .rootNotReady }
        scroll.layoutIfNeeded()
        guard !(scroll is UITextView), scroll.isScrollEnabled,
              scroll.window === root.window else { return .unavailable }
        guard !scroll.isTracking, !scroll.isDragging, !scroll.isDecelerating else { return .interrupted }
        guard scroll.bounds.width.isFinite, scroll.bounds.width > 0,
              scroll.bounds.height.isFinite, scroll.bounds.height > 0,
              scroll.contentSize.height.isFinite, scroll.contentSize.height > 0,
              scroll.contentOffset.y.isFinite else { return .rootNotReady }
        guard let target = targets[id]?.view, target.window != nil else { return .targetMissing }
        guard target.window === root.window, target.isDescendant(of: scroll) else { return .unavailable }
        let targetY = target.convert(target.bounds, to: scroll).minY
        var endY: CGFloat?
        if intraBlockFraction != nil {
            guard let end = ends[id]?.view, end.window != nil else { return .targetMissing }
            guard end.window === root.window, end.isDescendant(of: scroll) else { return .unavailable }
            endY = end.convert(end.bounds, to: scroll).minY
        }
        let insets = scroll.adjustedContentInset
        let safeArea = scroll.safeAreaInsets
        guard let visibleTop = NativeReaderScrollBounds.visibleTopInset(
                adjustedTopInset: insets.top, safeAreaTopInset: safeArea.top),
              let offset = NativeReaderScrollBounds.offset(targetMinY: targetY,
            topInset: insets.top, bottomInset: insets.bottom,
            contentHeight: scroll.contentSize.height, viewportHeight: scroll.bounds.height,
            visibleTopInset: visibleTop, targetMaxY: endY, intraBlockFraction: intraBlockFraction) else { return .unavailable }
        #if DEBUG
        recordGeometry(scroll: scroll, target: target, targetY: targetY, adjusted: insets,
                       safeArea: safeArea, visibleTop: visibleTop, goalOffset: offset)
        #endif
        return .ready(scroll, offset)
    }

    #if DEBUG
    /// Numeric geometry only, bounded per request and limited to the existing
    /// isolated UI-test suite. No article, query, heading or reading-record data.
    @MainActor private func recordGeometry(scroll: UIScrollView, target: UIView, targetY: CGFloat,
        adjusted: UIEdgeInsets, safeArea: UIEdgeInsets, visibleTop: CGFloat, goalOffset: CGFloat) {
        guard let suite = ProcessInfo.processInfo.environment["AILIBRARY_UI_TEST_SUITE"],
              suite.hasPrefix("ailibrary-uitest-"), suite.count < 100,
              geometrySampleCount < 32, let window = scroll.window,
              let legacyGoal = NativeReaderScrollBounds.offset(targetMinY: targetY,
                topInset: adjusted.top, bottomInset: adjusted.bottom,
                contentHeight: scroll.contentSize.height, viewportHeight: scroll.bounds.height) else { return }
        let frame = scroll.convert(scroll.bounds, to: window)
        let markerInWindowY = target.convert(target.bounds, to: window).minY
        let values = [frame.minX, frame.minY, frame.width, frame.height, markerInWindowY,
                      scroll.contentInset.top, scroll.contentInset.bottom, safeArea.bottom]
        guard values.allSatisfy(\.isFinite) else { return }
        geometrySampleCount += 1
        let sample: [String: Any] = ["sample": geometrySampleCount,
            "scrollFrameInWindow": [frame.minX, frame.minY, frame.width, frame.height].map { Double($0) },
            "scrollBoundsY": Double(scroll.bounds.minY), "viewportHeight": Double(scroll.bounds.height),
            "contentHeight": Double(scroll.contentSize.height),
            "contentInsetTop": Double(scroll.contentInset.top), "contentInsetBottom": Double(scroll.contentInset.bottom),
            "adjustedTop": Double(adjusted.top), "adjustedBottom": Double(adjusted.bottom),
            "safeAreaTop": Double(safeArea.top), "safeAreaBottom": Double(safeArea.bottom),
            "visibleTop": Double(visibleTop), "markerContentY": Double(targetY),
            "markerWindowY": Double(markerInWindowY), "legacyGoalOffset": Double(legacyGoal),
            "goalOffset": Double(goalOffset), "actualOffset": Double(scroll.contentOffset.y)]
        NativeReaderTrace.geometry(sample, generation: debugTraceGeneration)
    }
    #endif

    @MainActor func placementObservation(of id: String, intraBlockFraction: Double? = nil) -> NativeReaderPlacementPolicy.Observation {
        switch layout(of: id, intraBlockFraction: intraBlockFraction) {
        case .ready(let scroll, let offset):
            return abs(scroll.contentOffset.y - offset) <= 0.5 ? .aligned : .needsAlignment
        case .rootNotReady: return .rootNotReady
        case .targetMissing: return .targetMissing
        case .unavailable: return .unavailable
        case .interrupted: return .userInterruption
        }
    }

    @MainActor func placeTarget(_ id: String, intraBlockFraction: Double? = nil) -> NativeReaderScrollPlacement {
        switch layout(of: id, intraBlockFraction: intraBlockFraction) {
        case .ready(let scroll, let offset):
            scroll.setContentOffset(CGPoint(x: scroll.contentOffset.x, y: offset), animated: false)
            return .aligned
        case .rootNotReady, .targetMissing: return .waitingForLayout
        case .unavailable: return .unavailable
        case .interrupted: return .interrupted
        }
    }
}

/// One display-frame wait with a shared request deadline. Both cancellation and
/// the deadline invalidate the link/timer and resume exactly one continuation,
/// including when an inactive scene produces no display frames.
@MainActor
private final class NativeReaderLayoutFrame: NSObject {
    private var continuation: CheckedContinuation<Bool, Never>?
    private var displayLink: CADisplayLink?
    private var deadlineTimer: Timer?
    private var cancelled = false

    func wait(until deadline: TimeInterval) async -> Bool {
        guard !cancelled, !Task.isCancelled, deadline.isFinite, deadline > CACurrentMediaTime() else { return false }
        return await withTaskCancellationHandler {
            await withCheckedContinuation { continuation in
                guard !cancelled, !Task.isCancelled, deadline > CACurrentMediaTime() else {
                    continuation.resume(returning: false)
                    return
                }
                self.continuation = continuation
                let link = CADisplayLink(target: self, selector: #selector(didDisplay))
                displayLink = link
                link.add(to: .main, forMode: .common)
                let timer = Timer(timeInterval: max(0, deadline - CACurrentMediaTime()), repeats: false) { [weak self] _ in
                    MainActor.assumeIsolated { self?.finish(false) }
                }
                deadlineTimer = timer
                RunLoop.main.add(timer, forMode: .common)
            }
        } onCancel: {
            Task { @MainActor [weak self] in self?.finish(false) }
        }
    }

    func cancel() {
        cancelled = true
        finish(false)
    }

    @objc private func didDisplay() { finish(true) }

    private func finish(_ displayed: Bool) {
        guard let continuation else { return }
        self.continuation = nil
        displayLink?.invalidate()
        displayLink = nil
        deadlineTimer?.invalidate()
        deadlineTimer = nil
        continuation.resume(returning: displayed)
    }
}

private struct NativeReaderScrollMarker: UIViewRepresentable {
    let anchors: NativeReaderScrollAnchors
    var blockID: String? = nil
    var isEnd = false

    @MainActor func makeUIView(context: Context) -> UIView {
        let view = UIView(frame: .zero)
        view.isUserInteractionEnabled = false
        view.isAccessibilityElement = false
        register(view)
        return view
    }

    @MainActor func updateUIView(_ view: UIView, context: Context) { register(view) }
    @MainActor private func register(_ view: UIView) {
        if let blockID { anchors.registerTarget(view, id: blockID, isEnd: isEnd) }
        else { anchors.registerRoot(view) }
    }
}

struct NativeReaderNavigationDestination: Equatable {
    let heading: String?
    /// The top-level container used by the existing reading-position format.
    let blockID: String?
    /// The actual leaf anchor, which may be nested inside the saved container.
    let scrollBlockID: String?
    let focusBlockID: String?
    var intraBlockFraction: Double? = nil
}

/// Search, fragment and TOC destinations are one-shot requests. A reader retained
/// below another article resumes its current block instead of replaying a search.
struct NativeReaderNavigationState {
    private struct PendingGoal {
        let destination: NativeReaderNavigationDestination
        let headingRequestID: UUID
        let userPanEpoch: UInt64
    }
    private var initialRequestConsumed = false
    private var consumedHeadingRequestID: UUID?
    private var pendingGoal: PendingGoal?

    func destination(document: NativeDocument, position: ReadingPosition, initialHeading: String?,
                     requestedHeading: String?, headingRequestID: UUID, currentBlockID: String?,
                     initialSearchHit: NativeSearchHit? = nil,
                     searchStartsAtBeginning: Bool = false,
                     currentIntraBlockFraction: Double? = nil) -> NativeReaderNavigationDestination {
        let requested = consumedHeadingRequestID == headingRequestID ? nil : requestedHeading
        if let pendingGoal, pendingGoal.headingRequestID == headingRequestID,
           let leaf = pendingGoal.destination.scrollBlockID,
           document.block(id: leaf) != nil,
           document.topLevelBlockID(containing: leaf) == pendingGoal.destination.blockID {
            return pendingGoal.destination
        }
        let heading = requested ?? (initialRequestConsumed ? nil : initialHeading)
        if let heading, let leaf = document.block(forHeading: heading),
           let container = document.topLevelBlockID(containing: leaf.id) {
            return NativeReaderNavigationDestination(heading: heading, blockID: container,
                scrollBlockID: leaf.id, focusBlockID: leaf.id)
        }
        if !initialRequestConsumed {
            if let hit = initialSearchHit,
               document.block(id: hit.blockID) != nil,
               document.topLevelBlockID(containing: hit.blockID) == hit.containerBlockID {
                return NativeReaderNavigationDestination(heading: nil, blockID: hit.containerBlockID,
                    scrollBlockID: hit.blockID, focusBlockID: hit.blockID)
            }
            if searchStartsAtBeginning {
                let first = document.blocks.first?.id
                return NativeReaderNavigationDestination(heading: nil, blockID: first,
                    scrollBlockID: first, focusBlockID: first)
            }
        }
        let current = currentBlockID.flatMap { document.topLevelBlockID(containing: $0) }
        let saved = position.blockID.flatMap { document.topLevelBlockID(containing: $0) }
        let blockID = current
            ?? saved
            ?? position.heading.flatMap { document.topLevelBlockID(forHeading: $0) }
            ?? document.blocks.first?.id
        return NativeReaderNavigationDestination(heading: nil, blockID: blockID,
            scrollBlockID: blockID, focusBlockID: nil,
            intraBlockFraction: current != nil ? NativeReadingAnchor.validFraction(currentIntraBlockFraction) :
                (saved != nil ? position.anchor?.intraBlockFraction : nil))
    }

    mutating func consume(headingRequestID: UUID) {
        initialRequestConsumed = true
        consumedHeadingRequestID = headingRequestID
        pendingGoal = nil
    }

    mutating func retainUnreachedGoal(_ destination: NativeReaderNavigationDestination,
                                     headingRequestID: UUID, userPanEpoch: UInt64 = 0) {
        guard destination.focusBlockID != nil else { pendingGoal = nil; return }
        pendingGoal = PendingGoal(destination: destination, headingRequestID: headingRequestID, userPanEpoch: userPanEpoch)
    }

    /// A pan may arrive after a failed layout request, when no completion task
    /// remains to consume it. Return the old epoch as explicit user-move proof.
    func isNewHeadingRequest(_ heading: String?, headingRequestID: UUID) -> Bool {
        heading != nil && consumedHeadingRequestID != headingRequestID && pendingGoal?.headingRequestID != headingRequestID
    }

    mutating func consumeIfUserPanned(userPanEpoch: UInt64, headingRequestID: UUID? = nil) -> UInt64? {
        guard let pendingGoal, headingRequestID == nil || pendingGoal.headingRequestID == headingRequestID,
              pendingGoal.userPanEpoch != userPanEpoch else { return nil }
        let previous = pendingGoal.userPanEpoch
        consume(headingRequestID: pendingGoal.headingRequestID)
        return previous
    }
}

struct NativeReaderView: View {
    let snapshot: ContentSnapshot
    let article: LibraryArticle
    let document: NativeDocument
    let position: ReadingPosition
    let initialHeading: String?
    let requestedHeading: String?
    let headingRequestID: UUID
    let onPosition: (String?, String?, Double, Double?) -> Void
    let navigate: (ReaderRoute) -> Void
    var initialSearchHit: NativeSearchHit? = nil
    var searchStartsAtBeginning = false
    var openLearningLink: ((URL) -> Bool)? = nil
    @ScaledMetric(relativeTo: .body) private var bodySize: CGFloat = 17
    @Environment(\.scenePhase) private var scenePhase
    @State private var restoring = true
    @State private var trackingReady = false
    @State private var currentBlockID: String?
    @State private var progressSession = NativeReadingProgressSession()
    @State private var currentProgress: NativeReadingSample?
    @State private var trackingLayout: NativeReaderLayoutIdentity?
    @State private var saveTask: Task<Void, Never>?
    @State private var navigationTask: Task<Void, Never>?
    @State private var restoreGeneration = UUID()
    @State private var navigationState = NativeReaderNavigationState()
    @State private var scrollAnchors = NativeReaderScrollAnchors()
    @AccessibilityFocusState(for: .voiceOver) private var focusedBlockID: String?

    var body: some View {
        GeometryReader { viewport in
            let layout = NativeReaderLayoutIdentity(source: document.source_sha256,
                width: viewport.size.width, height: viewport.size.height, bodySize: bodySize)
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 18) {
                        ForEach(document.blocks) { block in
                            NativeBlockView(block: block, snapshot: snapshot,
                                            fontScale: min(4, max(0.8, bodySize / 17)),
                                            availableWidth: max(1, viewport.size.width - 36),
                                            focusedBlock: $focusedBlockID, scrollAnchors: scrollAnchors)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .id(NativeReaderScrollTarget.container(block.id))
                                .background {
                                    GeometryReader { bounds in
                                        Color.clear.preference(key: NativeBlockFrames.self,
                                                               value: [block.id: bounds.frame(in: .named("native-article-scroll"))])
                                    }
                                }
                        }
                    }
                    .background(alignment: .top) {
                        NativeReaderScrollMarker(anchors: scrollAnchors).frame(height: 0)
                    }
                    .padding(.horizontal, 18)
                    .padding(.top, 20)
                    .padding(.bottom, 72)
                }
                .coordinateSpace(name: "native-article-scroll")
                .accessibilityIdentifier("native-reader")
                .task(id: layout) { await restore(using: proxy, layout: layout) }
                .onChange(of: headingRequestID) { _, _ in
                    if let requestedHeading { jump(to: requestedHeading, using: proxy) }
                }
                .onPreferenceChange(NativeBlockFrames.self) { frames in
                    receive(frames, layout: layout)
                }
                .environment(\.openURL, OpenURLAction { open($0, using: proxy) })
                .onChange(of: scenePhase) { _, phase in
                    if phase != .active {
                        restoreGeneration = UUID()
                        navigationTask?.cancel()
                        scrollAnchors.stopObservingPan()
                        if restoring {
                            progressSession.cancelUnreachedPlacement(userPanEpoch: scrollAnchors.userPanEpoch)
                        }
                        navigationState.consume(headingRequestID: headingRequestID)
                        restoring = false
                        trackingReady = true
                        flushProgress()
                    }
                }
                .onDisappear {
                    restoreGeneration = UUID()
                    navigationTask?.cancel()
                    scrollAnchors.stopObservingPan()
                    if restoring {
                        progressSession.cancelUnreachedPlacement(userPanEpoch: scrollAnchors.userPanEpoch)
                    }
                    navigationState.consume(headingRequestID: headingRequestID)
                    restoring = false
                    trackingReady = true
                    flushProgress()
                }
            }
        }
    }

    @MainActor private func restore(using proxy: ScrollViewProxy, layout: NativeReaderLayoutIdentity) async {
        let generation = UUID()
        restoreGeneration = generation
        restoring = true
        trackingReady = false
        trackingLayout = layout
        navigationTask?.cancel()
        saveTask?.cancel()
        saveTask = nil
        let previousBlockID = currentBlockID
        let previousProgress = currentProgress
        let currentPanEpoch = scrollAnchors.userPanEpoch
        let newHeading = navigationState.isNewHeadingRequest(requestedHeading, headingRequestID: headingRequestID)
        let pendingPan = newHeading ? nil : navigationState.consumeIfUserPanned(userPanEpoch: currentPanEpoch,
                                                                              headingRequestID: headingRequestID)
        let failedPan = newHeading ? nil : progressSession.blockedAtUserPanEpoch.flatMap { $0 == currentPanEpoch ? nil : $0 }
        let activePan = newHeading ? nil : progressSession.userPanBeforeReplacement(userPanEpoch: currentPanEpoch)
        let userCancelledEpoch = pendingPan ?? failedPan ?? activePan
        let destination = navigationState.destination(document: document, position: position,
            initialHeading: initialHeading, requestedHeading: requestedHeading,
            headingRequestID: headingRequestID, currentBlockID: currentBlockID,
            initialSearchHit: initialSearchHit, searchStartsAtBeginning: searchStartsAtBeginning,
            currentIntraBlockFraction: currentProgress?.blockID == currentBlockID ? currentProgress?.intraBlockFraction : nil)
        // A geometry-task restart is not a user decision to abandon a route.
        if userCancelledEpoch == nil {
            navigationState.retainUnreachedGoal(destination, headingRequestID: headingRequestID, userPanEpoch: currentPanEpoch)
        }
        let policy = NativeReaderPlacementPolicy(generation: generation,
            interactionEpoch: scrollAnchors.beginPlacement(), startedAt: CACurrentMediaTime())
        let request = NativeReadingPlacementRequest(purpose: destination.focusBlockID != nil ? .explicitNavigation :
            (previousProgress == nil ? .automaticResume : .automaticReflow), userPanEpoch: userCancelledEpoch ?? currentPanEpoch,
            generation: generation)
        #if DEBUG
        scrollAnchors.debugTraceGeneration = generation
        NativeReaderTrace.begin(.restoreBegin, generation: generation, purpose: request.purpose,
            numbers: ["interactionEpoch": Double(scrollAnchors.interactionEpoch),
                      "requestInteractionEpoch": Double(policy.interactionEpoch),
                      "userPanEpoch": Double(scrollAnchors.userPanEpoch), "requestUserPanEpoch": Double(request.userPanEpoch)],
            flags: ["hasStoredHeading": position.heading != nil, "hasStoredBlock": position.blockID != nil,
                    "hasStoredAnchor": position.anchor != nil, "hasStoredIntraFraction": position.anchor?.intraBlockFraction != nil,
                    "hasPreviousProgress": previousProgress != nil, "hasCurrentBlock": previousBlockID != nil,
                    "hasRequestedIntraFraction": destination.intraBlockFraction != nil])
        #endif
        progressSession.beginPlacement(request)
        var outcome = NativeReaderPlacementPolicy.Outcome.cancelled
        defer {
            completePlacement(outcome, target: destination.blockID, focus: destination.focusBlockID,
                generation: generation, request: request, previousBlockID: previousBlockID,
                previousProgress: previousProgress, flush: false)
        }
        if userCancelledEpoch != nil { outcome = .interrupted; return }
        // Preserve the existing initial-restore layout waits, without extending
        // them. Every proxy or UIKit action also checks the pan epoch/deadline.
        try? await Task.sleep(for: .milliseconds(100))
        if let end = placementExit(policy) { outcome = end; return }
        if let target = destination.blockID {
            materializeContainer(target, using: proxy)
        }
        try? await Task.sleep(for: .milliseconds(250))
        if let end = placementExit(policy) { outcome = end; return }
        try? await Task.sleep(for: .milliseconds(200))
        if let end = placementExit(policy) { outcome = end; return }
        if let leaf = destination.scrollBlockID, let container = destination.blockID {
            outcome = await finishPlacement(of: leaf, container: container, using: proxy, policy: policy,
                                            intraBlockFraction: destination.intraBlockFraction)
        } else {
            outcome = .unavailable
        }
    }

    private func jump(to heading: String, using proxy: ScrollViewProxy) {
        guard let leaf = document.block(forHeading: heading),
              let blockID = document.topLevelBlockID(containing: leaf.id) else { return }
        move(to: blockID, targetBlockID: leaf.id, using: proxy)
    }

    private func move(to blockID: String, targetBlockID: String? = nil, using proxy: ScrollViewProxy) {
        guard document.blocks.contains(where: { $0.id == blockID }) else { return }
        let leaf = targetBlockID ?? blockID
        let generation = UUID()
        let previousBlockID = currentBlockID
        let previousProgress = currentProgress
        restoreGeneration = generation
        navigationTask?.cancel()
        saveTask?.cancel()
        saveTask = nil
        // A requested destination is not a measured reading position. Keep any
        // earlier measured pending record until a live placement is observed.
        navigationState.retainUnreachedGoal(NativeReaderNavigationDestination(
            heading: document.block(id: leaf)?.heading_id, blockID: blockID,
            scrollBlockID: leaf, focusBlockID: leaf), headingRequestID: headingRequestID,
            userPanEpoch: scrollAnchors.userPanEpoch)
        restoring = true
        trackingReady = false
        focusedBlockID = nil
        let policy = NativeReaderPlacementPolicy(generation: generation,
            interactionEpoch: scrollAnchors.beginPlacement(), startedAt: CACurrentMediaTime())
        let request = NativeReadingPlacementRequest(purpose: .explicitNavigation,
                                                   userPanEpoch: scrollAnchors.userPanEpoch, generation: generation)
        #if DEBUG
        scrollAnchors.debugTraceGeneration = generation
        NativeReaderTrace.begin(.moveBegin, generation: generation, purpose: request.purpose,
            numbers: ["interactionEpoch": Double(scrollAnchors.interactionEpoch),
                      "requestInteractionEpoch": Double(policy.interactionEpoch),
                      "userPanEpoch": Double(scrollAnchors.userPanEpoch), "requestUserPanEpoch": Double(request.userPanEpoch)],
            flags: ["hasStoredHeading": position.heading != nil, "hasStoredBlock": position.blockID != nil,
                    "hasStoredAnchor": position.anchor != nil, "hasStoredIntraFraction": position.anchor?.intraBlockFraction != nil,
                    "hasPreviousProgress": previousProgress != nil, "hasCurrentBlock": previousBlockID != nil])
        #endif
        progressSession.beginPlacement(request)
        if let outcome = placementExit(policy) {
            completePlacement(outcome, target: blockID, focus: leaf, generation: generation,
                request: request, previousBlockID: previousBlockID, previousProgress: previousProgress, flush: false)
            return
        }
        materializeContainer(blockID, using: proxy)
        navigationTask = Task { @MainActor in
            let outcome = await finishPlacement(of: leaf, container: blockID, using: proxy, policy: policy)
            completePlacement(outcome, target: blockID, focus: leaf, generation: generation,
                request: request, previousBlockID: previousBlockID, previousProgress: previousProgress, flush: true)
        }
    }

    @MainActor private func placementExit(_ policy: NativeReaderPlacementPolicy) -> NativeReaderPlacementPolicy.Outcome? {
        if let end = policy.terminalOutcome(now: CACurrentMediaTime(), generation: restoreGeneration,
            interactionEpoch: scrollAnchors.interactionEpoch, cancelled: Task.isCancelled) { return end }
        // A reflow task can begin after a pan has already started, so its epoch
        // alone cannot detect that existing interaction before the first proxy.
        return scrollAnchors.isUserInteracting ? .interrupted : nil
    }

    /// Proxy scrolling only materializes a container. Keep both animation systems
    /// off so the bounded UIKit coordinator owns the final leaf offset.
    @MainActor private func materializeContainer(_ container: String, using proxy: ScrollViewProxy) {
        var transaction = Transaction(animation: nil)
        transaction.disablesAnimations = true
        withTransaction(transaction) {
            UIView.performWithoutAnimation {
                proxy.scrollTo(NativeReaderScrollTarget.container(container), anchor: .top)
            }
        }
    }

    @MainActor private func finishPlacement(of blockID: String, container: String,
        using proxy: ScrollViewProxy, policy initialPolicy: NativeReaderPlacementPolicy,
        intraBlockFraction: Double? = nil) async -> NativeReaderPlacementPolicy.Outcome {
        var policy = initialPolicy
        while true {
            if let end = placementExit(policy) { return end }
            let observation = scrollAnchors.placementObservation(of: blockID, intraBlockFraction: intraBlockFraction)
            let action = policy.next(observation, now: CACurrentMediaTime(), generation: restoreGeneration,
                interactionEpoch: scrollAnchors.interactionEpoch, cancelled: Task.isCancelled)
            #if DEBUG
            var traceFlags = scrollAnchors.debugMarkerFlags(for: blockID)
            traceFlags["generationMatches"] = restoreGeneration == policy.generation
            traceFlags["interactionEpochMatches"] = scrollAnchors.interactionEpoch == policy.interactionEpoch
            traceFlags["hasRequestedIntraFraction"] = intraBlockFraction != nil
            NativeReaderTrace.emit(.action, generation: policy.generation,
                numbers: ["interactionEpoch": Double(scrollAnchors.interactionEpoch),
                    "requestInteractionEpoch": Double(policy.interactionEpoch), "userPanEpoch": Double(scrollAnchors.userPanEpoch),
                    "layoutPasses": Double(policy.layoutPasses), "materializations": Double(policy.materializations),
                    "corrections": Double(policy.corrections), "consecutiveAlignedPasses": Double(policy.consecutiveAlignedPasses),
                    "remainingMs": max(0, (policy.deadline - CACurrentMediaTime()) * 1000)],
                flags: traceFlags, observation: observation, action: action)
            #endif
            switch action {
            case .finished(let outcome): return outcome
            case .materialize:
                if let end = placementExit(policy) { return end }
                // Re-materialize only the still-current container; the actual
                // nested leaf remains the final UIKit alignment target.
                materializeContainer(container, using: proxy)
            case .align:
                if let end = placementExit(policy) { return end }
                switch scrollAnchors.placeTarget(blockID, intraBlockFraction: intraBlockFraction) {
                case .aligned, .waitingForLayout: break
                case .interrupted: return .interrupted
                case .unavailable: return .unavailable
                }
            case .waitForLayout: break
            }
            // Even an issued offset must survive later layout. No marker callback
            // owns a task or can revive a finished historical request.
            let displayed = await scrollAnchors.waitForLayout(until: policy.deadline)
            if let end = placementExit(policy) { return end }
            if !displayed { return .exhausted }
        }
    }

    @MainActor private func completePlacement(_ outcome: NativeReaderPlacementPolicy.Outcome,
        target: String?, focus: String?, generation: UUID, request: NativeReadingPlacementRequest,
        previousBlockID: String?,
        previousProgress: NativeReadingSample?, flush: Bool) {
        #if DEBUG
        if restoreGeneration != generation {
            NativeReaderTrace.emit(.complete, generation: generation,
                flags: ["generationMatches": false], reason: .generationMismatch, outcome: outcome)
        }
        #endif
        guard restoreGeneration == generation else { return }
        let userPanEpoch = scrollAnchors.userPanEpoch
        let isUserInteracting = scrollAnchors.isUserInteracting
        let userMoved = userPanEpoch != request.userPanEpoch || isUserInteracting
        let observedBlock = outcome == .aligned && !userMoved ? target : scrollAnchors.readingBlockID(in: document.blocks.map(\.id))
        let measured = observedBlock.flatMap { progress(for: $0) }
        let completion = progressSession.completePlacement(placementAligned: outcome == .aligned, request: request,
            currentUserPanEpoch: userPanEpoch, isUserInteracting: isUserInteracting,
            measured: measured)
        #if DEBUG
        NativeReaderTrace.emit(.complete, generation: generation,
            numbers: ["userPanEpoch": Double(userPanEpoch), "requestUserPanEpoch": Double(request.userPanEpoch)],
            flags: ["generationMatches": true, "hasMeasured": measured != nil, "hasObservedBlock": observedBlock != nil,
                "isUserInteracting": isUserInteracting, "panEpochMatches": userPanEpoch == request.userPanEpoch,
                "hasDelayToken": completion.delayToken != nil], outcome: outcome, effect: completion.effect)
        #endif
        guard completion.effect != .ignoreSuperseded else { return }
        if completion.effect.consumesOneShot { navigationState.consume(headingRequestID: headingRequestID) }
        // Failed automatic placement keeps both its saved point and cache. A
        // later unprompted geometry callback is gated by the same session.
        currentBlockID = completion.effect.acceptsMeasurement ? measured?.blockID ?? previousBlockID : previousBlockID
        currentProgress = completion.effect.acceptsMeasurement ? measured ?? previousProgress : previousProgress
        if completion.effect.restoresRequestedFocus, let focus, UIAccessibility.isVoiceOverRunning { focusedBlockID = focus }
        restoring = false
        trackingReady = true
        if let token = completion.delayToken { scheduleProgressSave(token) }
        if flush { flushProgress() }
    }

    private func receive(_ frames: [String: CGRect], layout: NativeReaderLayoutIdentity) {
        // Reflow callbacks can precede the replacement task. Do not reinterpret
        // the old offset in the new height before restoring its measured ratio.
        #if DEBUG
        if !trackingReady || restoring || trackingLayout != layout {
            NativeReaderTrace.emit(.receive, generation: restoreGeneration,
                flags: ["trackingReady": trackingReady, "restoring": restoring,
                    "layoutMatches": trackingLayout == layout], reason: .trackingGate)
        }
        #endif
        guard trackingReady, !restoring, trackingLayout == layout else { return }
        _ = navigationState.consumeIfUserPanned(userPanEpoch: scrollAnchors.userPanEpoch, headingRequestID: headingRequestID)
        #if DEBUG
        let tracePermitted = progressSession.permitsTracking(userPanEpoch: scrollAnchors.userPanEpoch)
        if !tracePermitted {
            var numbers = ["userPanEpoch": Double(scrollAnchors.userPanEpoch)]
            if let blocked = progressSession.blockedAtUserPanEpoch { numbers["blockedUserPanEpoch"] = Double(blocked) }
            NativeReaderTrace.emit(.receive, generation: restoreGeneration, numbers: numbers,
                flags: ["hasBlockedEpoch": progressSession.blockedAtUserPanEpoch != nil], reason: .sessionGate)
        }
        guard tracePermitted else { return }
        #else
        guard progressSession.permitsTracking(userPanEpoch: scrollAnchors.userPanEpoch) else { return }
        #endif
        #if DEBUG
        let traceNext = scrollAnchors.readingBlockID(in: Array(frames.keys))
        let traceMeasured = traceNext.flatMap { progress(for: $0) }
        if traceNext == nil || traceMeasured == nil || traceMeasured == currentProgress {
            NativeReaderTrace.emit(.receive, generation: restoreGeneration,
                flags: ["hasReadingBlock": traceNext != nil, "hasMeasured": traceMeasured != nil,
                    "sampleChanged": traceMeasured != currentProgress], reason: .measurementGate)
        }
        guard let next = traceNext, let measured = traceMeasured, measured != currentProgress else { return }
        #else
        guard let next = scrollAnchors.readingBlockID(in: Array(frames.keys)),
              let measured = progress(for: next), measured != currentProgress else { return }
        #endif
        currentBlockID = next
        currentProgress = measured
        enqueueProgress(measured)
    }

    private func enqueueProgress(_ progress: NativeReadingSample) {
        #if DEBUG
        let traceToken = progressSession.stageMeasured(progress, userPanEpoch: scrollAnchors.userPanEpoch)
        NativeReaderTrace.emit(.receive, generation: restoreGeneration,
            numbers: ["userPanEpoch": Double(scrollAnchors.userPanEpoch)],
            flags: ["hasDelayToken": traceToken != nil], reason: traceToken == nil ? .stageRefused : .staged)
        guard let token = traceToken else { return }
        #else
        guard let token = progressSession.stageMeasured(progress, userPanEpoch: scrollAnchors.userPanEpoch) else { return }
        #endif
        scheduleProgressSave(token)
    }

    private func scheduleProgressSave(_ token: UInt64) {
        saveTask?.cancel()
        saveTask = nil
        saveTask = Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(350))
            guard !Task.isCancelled else { return }
            flushProgress(expectedToken: token)
        }
    }

    private func progress(for blockID: String) -> NativeReadingSample? {
        #if DEBUG
        guard let index = document.blocks.firstIndex(where: { $0.id == blockID }) else {
            NativeReaderTrace.emit(.progress, generation: restoreGeneration, reason: .missingTopLevel)
            return nil
        }
        guard let intra = scrollAnchors.intraBlockFraction(for: blockID) else {
            NativeReaderTrace.emit(.progress, generation: restoreGeneration,
                flags: scrollAnchors.debugMarkerFlags(for: blockID), reason: .missingIntra)
            return nil
        }
        NativeReaderTrace.emit(.progress, generation: restoreGeneration,
            flags: ["hasMeasured": true], reason: .measured)
        #else
        guard let index = document.blocks.firstIndex(where: { $0.id == blockID }),
              let intra = scrollAnchors.intraBlockFraction(for: blockID) else { return nil }
        #endif
        return NativeReadingSample(heading: document.headingID(forBlock: blockID), blockID: blockID,
                                  fraction: Double(index) / Double(max(1, document.blocks.count - 1)),
                                  intraBlockFraction: intra)
    }

    private func flushProgress(expectedToken: UInt64? = nil) {
        saveTask?.cancel()
        saveTask = nil
        #if DEBUG
        if !trackingReady {
            NativeReaderTrace.emit(.save, generation: restoreGeneration,
                flags: ["trackingReady": false, "restoring": restoring, "hasSample": false,
                    "willCallOnPosition": false], reason: .trackingGate)
            return
        }
        let traceProgress = progressSession.takeForSaving(expectedToken: expectedToken, restoring: restoring)
        NativeReaderTrace.emit(.save, generation: restoreGeneration,
            flags: ["trackingReady": trackingReady, "restoring": restoring, "hasSample": traceProgress != nil,
                "willCallOnPosition": traceProgress != nil], reason: .takeResult)
        guard let progress = traceProgress else { return }
        #else
        guard trackingReady, let progress = progressSession.takeForSaving(expectedToken: expectedToken,
                                                                        restoring: restoring) else { return }
        #endif
        onPosition(progress.heading, progress.blockID, progress.fraction, progress.intraBlockFraction)
        #if DEBUG
        NativeReaderTrace.emit(.save, generation: restoreGeneration,
            flags: ["hasSample": true, "didCallOnPosition": true], reason: .didSave)
        #endif
    }

    private func open(_ url: URL, using proxy: ScrollViewProxy) -> OpenURLAction.Result {
        if url.scheme == "ailibrary-article", url.host == "open",
           let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
           let articleID = components.queryItems?.first(where: { $0.name == "id" })?.value,
           let target = snapshot.article(id: articleID) {
            let heading = components.queryItems?.first(where: { $0.name == "heading" })?.value
            guard heading == nil || target.headings.contains(where: { $0.id == heading }) else { return .discarded }
            if target.id == article.id {
                if let heading { jump(to: heading, using: proxy) }
                else if let first = document.blocks.first { move(to: first.id, using: proxy) }
            } else {
                flushProgress()
                navigate(ReaderRoute(articleID: target.id, heading: heading))
            }
            return .handled
        }
        guard url.scheme?.lowercased() == "https", url.host != nil,
              url.user == nil, url.password == nil else { return .discarded }
        if openLearningLink?(url) == true {
            flushProgress()
            return .handled
        }
        return .systemAction(url)
    }
}

/// Recursive document nodes are type-erased only at the block boundary. Inline
/// content stays in a native Text so wrapping and selection work across runs.
private struct NativeBlockView: View {
    let block: NativeBlock
    let snapshot: ContentSnapshot
    let fontScale: CGFloat
    let availableWidth: CGFloat
    let focusedBlock: AccessibilityFocusState<String?>.Binding
    let scrollAnchors: NativeReaderScrollAnchors

    var body: some View {
        rendered
            .background(alignment: .top) {
                NativeReaderScrollMarker(anchors: scrollAnchors, blockID: block.id).frame(height: 0)
            }
            .background(alignment: .bottom) {
                NativeReaderScrollMarker(anchors: scrollAnchors, blockID: block.id, isEnd: true).frame(height: 0)
            }
            .id(NativeReaderScrollTarget.block(block.id))
    }

    private var rendered: AnyView {
        switch block.type {
        case "heading":
            return AnyView(NativeInlineText(inlines: block.inlines ?? [], snapshot: snapshot,
                                            font: headingFont, uiTextStyle: headingTextStyle, bold: true, fontScale: fontScale,
                                            maximumWidth: availableWidth)
                .accessibilityAddTraits(.isHeader)
                .accessibilityHeading(headingAccessibilityLevel)
                .accessibilityFocused(focusedBlock, equals: block.id)
                .accessibilityIdentifier("native-heading-\(block.heading_id ?? block.id)")
                .padding(.top, (block.level ?? 2) <= 2 ? 14 : 6))
        case "paragraph":
            return AnyView(NativeInlineText(inlines: block.inlines ?? [], snapshot: snapshot,
                                            fontScale: fontScale, maximumWidth: availableWidth)
                .lineSpacing(5)
                .accessibilityFocused(focusedBlock, equals: block.id)
                .accessibilityIdentifier("native-text-\(block.id)"))
        case "list":
            return AnyView(VStack(alignment: .leading, spacing: 10) {
                ForEach(Array((block.items ?? []).enumerated()), id: \.element.id) { index, item in
                    let marker = block.ordered == true ? "\((block.start ?? 1) + index)." : "•"
                    let markerWidth = max(18, CGFloat(marker.count) * 10 * fontScale)
                    HStack(alignment: .firstTextBaseline, spacing: 10) {
                        Text(marker).monospacedDigit().lineLimit(1)
                            .accessibilityLabel(block.ordered == true ? "項目 \((block.start ?? 1) + index)" : "箇条書きの項目")
                            .frame(width: markerWidth, alignment: .trailing)
                        VStack(alignment: .leading, spacing: 10) {
                            ForEach(item.blocks) { child in
                                NativeBlockView(block: child, snapshot: snapshot, fontScale: fontScale,
                                                availableWidth: max(1, availableWidth - markerWidth - 10),
                                                focusedBlock: focusedBlock, scrollAnchors: scrollAnchors)
                            }
                        }
                    }
                    .accessibilityElement(children: .contain)
                }
            }
            .accessibilityElement(children: .contain)
            .accessibilityLabel(block.ordered == true ? "番号付きリスト、\((block.items ?? []).count)項目" : "箇条書き、\((block.items ?? []).count)項目"))
        case "quote":
            return AnyView(HStack(alignment: .top, spacing: 12) {
                RoundedRectangle(cornerRadius: 2).fill(Color.secondary.opacity(0.35)).frame(width: 3)
                VStack(alignment: .leading, spacing: 12) {
                    ForEach(block.blocks ?? []) { child in
                        NativeBlockView(block: child, snapshot: snapshot, fontScale: fontScale,
                                        availableWidth: max(1, availableWidth - 15),
                                        focusedBlock: focusedBlock, scrollAnchors: scrollAnchors)
                    }
                }.foregroundStyle(.secondary)
            }.fixedSize(horizontal: false, vertical: true)
                .accessibilityElement(children: .contain)
                .accessibilityLabel("引用"))
        case "code":
            return AnyView(NativeCodeView(text: block.text ?? "", language: block.language ?? "",
                                          blockID: block.id, focusedBlock: focusedBlock))
        case "table":
            if let table = block.table {
                return AnyView(NativeTableView(table: table, snapshot: snapshot, fontScale: fontScale,
                                              blockID: block.id, focusedBlock: focusedBlock))
            }
            return AnyView(EmptyView())
        case "diagram", "math":
            if let asset = block.asset {
                return AnyView(NativeFigureView(asset: asset, snapshot: snapshot, source: block.source ?? "",
                                                description: block.accessibility_text ?? (block.type == "math" ? "数式" : "図"),
                                                isMath: block.type == "math", fontScale: fontScale,
                                                availableWidth: availableWidth,
                                                blockID: block.id, focusedBlock: focusedBlock))
            }
            return AnyView(EmptyView())
        case "thematic_break": return AnyView(Divider().padding(.vertical, 4))
        default: return AnyView(Text("この本文要素を表示できません。再度記事を開いてください。"))
        }
    }

    private var headingFont: Font {
        switch block.level ?? 2 {
        case 1: return .title
        case 2: return .title2
        case 3: return .title3
        default: return .headline
        }
    }

    private var headingAccessibilityLevel: AccessibilityHeadingLevel {
        switch block.level ?? 2 {
        case 1: return .h1
        case 2: return .h2
        case 3: return .h3
        case 4: return .h4
        case 5: return .h5
        case 6: return .h6
        default: return .unspecified
        }
    }

    private var headingTextStyle: UIFont.TextStyle {
        switch block.level ?? 2 {
        case 1: return .title1
        case 2: return .title2
        case 3: return .title3
        default: return .headline
        }
    }
}

private struct NativeCodeView: View {
    let text: String
    let language: String
    let blockID: String
    let focusedBlock: AccessibilityFocusState<String?>.Binding
    @State private var copied = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text(language.isEmpty ? "コード" : language).font(.caption).foregroundStyle(.secondary)
                Spacer()
                Button {
                    UIPasteboard.general.string = text
                    copied = true
                    UIAccessibility.post(notification: .announcement, argument: "コードをコピーしました")
                } label: {
                    Label(copied ? "コピー済み" : "コピー", systemImage: copied ? "checkmark" : "doc.on.doc")
                        .font(.caption)
                }
                .frame(minHeight: 44)
                .accessibilityLabel("コードをコピー")
            }.padding(.horizontal, 12)
            Divider()
            ScrollView(.horizontal) {
                Text(text).font(.system(.body, design: .monospaced))
                    .textSelection(.enabled).fixedSize(horizontal: true, vertical: false)
                    .accessibilityFocused(focusedBlock, equals: blockID)
                    .padding(12)
            }
        }
        .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.secondary.opacity(0.2)))
    }
}

private struct NativeTableView: View {
    let table: NativeTable
    let snapshot: ContentSnapshot
    let fontScale: CGFloat
    let blockID: String
    let focusedBlock: AccessibilityFocusState<String?>.Binding

    private var columnWidths: [CGFloat] {
        table.header.indices.map { column in
            let content = [table.header[column]] + table.rows.compactMap { row in
                row.indices.contains(column) ? row[column] : nil
            }
            let count = content.map { NativeInlineContent.plainText($0).count }.max() ?? 0
            return min(320 * fontScale, max(120 * fontScale, CGFloat(min(count, 28)) * 9 * fontScale))
        }
    }

    var body: some View {
        let widths = columnWidths
        ScrollView(.horizontal) {
            Grid(alignment: .topLeading, horizontalSpacing: 0, verticalSpacing: 0) {
                GridRow(alignment: .top) {
                    ForEach(table.header.indices, id: \.self) { column in
                        cell(table.header[column], column: column, row: nil, width: widths[column])
                    }
                }
                ForEach(table.rows.indices, id: \.self) { row in
                    GridRow(alignment: .top) {
                        ForEach(table.header.indices, id: \.self) { column in
                            cell(table.rows[row][column], column: column, row: row + 1, width: widths[column])
                        }
                    }
                }
            }
            .padding(.vertical, 1)
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("見出し行とデータ\(table.rows.count)行、\(table.header.count)列の表")
        .accessibilityHint("横にスクロールするとすべての列を読めます")
        .accessibilityIdentifier("native-table-\(blockID)")
    }

    @ViewBuilder private func cell(_ inlines: [NativeInline], column: Int, row: Int?, width: CGFloat) -> some View {
        let content = NativeInlineText(inlines: inlines, snapshot: snapshot, bold: row == nil,
                         fontScale: fontScale, maximumWidth: width - 24)
            .multilineTextAlignment(textAlignment(column))
            .frame(maxWidth: .infinity, alignment: alignment(column))
            .padding(12)
            .frame(width: width, alignment: alignment(column))
            .frame(minHeight: 44, alignment: .topLeading)
            .background(row == nil ? Color.secondary.opacity(0.14) : Color.secondary.opacity(0.03))
            .overlay(Rectangle().stroke(Color.secondary.opacity(0.25), lineWidth: 0.5))
            .accessibilityCustomContent("表の位置", Text(cellPosition(column: column, row: row)), importance: .high)
            .accessibilityIdentifier("native-table-cell-\(blockID)-\(row ?? 0)-\(column + 1)")
        if row == nil, column == 0 {
            content.accessibilityFocused(focusedBlock, equals: blockID)
        } else {
            content
        }
    }

    private func cellPosition(column: Int, row: Int?) -> String {
        guard let row else { return "\(column + 1)列目の見出し" }
        return "データ\(row)行目、\(column + 1)列目。列名: \(NativeInlineContent.plainText(table.header[column]))"
    }

    private func alignment(_ column: Int) -> Alignment {
        guard table.alignments.indices.contains(column) else { return .leading }
        switch table.alignments[column] {
        case "center": return .center
        case "right": return .trailing
        default: return .leading
        }
    }

    private func textAlignment(_ column: Int) -> TextAlignment {
        guard table.alignments.indices.contains(column) else { return .leading }
        switch table.alignments[column] {
        case "center": return .center
        case "right": return .trailing
        default: return .leading
        }
    }
}

private struct NativeFigureView: View {
    let asset: NativeAsset
    let snapshot: ContentSnapshot
    let source: String
    let description: String
    let isMath: Bool
    let fontScale: CGFloat
    let availableWidth: CGFloat
    let blockID: String
    let focusedBlock: AccessibilityFocusState<String?>.Binding
    @Environment(\.colorScheme) private var colorScheme
    @State private var enlarged = false

    private var image: UIImage? {
        NativeAssetImageCache.shared.image(for: asset, snapshot: snapshot, dark: colorScheme == .dark)
    }

    private var displayWidth: CGFloat {
        let scaled = max(1, CGFloat(asset.width) * fontScale)
        let height = max(1, CGFloat(asset.height) * fontScale)
        return scaled * min(1, min(3_000 / scaled, 640 / height))
    }

    private var displayHeight: CGFloat {
        displayWidth * CGFloat(asset.height / asset.width)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let image {
                ScrollView(.horizontal) {
                    Image(uiImage: image).resizable().interpolation(.high)
                        .frame(width: displayWidth, height: displayHeight)
                        .accessibilityLabel(description)
                        .accessibilityFocused(focusedBlock, equals: blockID)
                        .frame(minWidth: availableWidth, alignment: isMath ? .center : .leading)
                        .padding(.vertical, 2)
                }
                .frame(height: displayHeight + 4)
                HStack {
                    Text(isMath ? "数式" : "図").font(.caption).foregroundStyle(.secondary)
                    Spacer()
                    Button { enlarged = true } label: {
                        Label("拡大", systemImage: "arrow.up.left.and.arrow.down.right")
                    }
                    .font(.caption).frame(minHeight: 44)
                    .accessibilityLabel(isMath ? "数式を拡大" : "図を拡大")
                }
            } else {
                Label("画像を表示できません。テキスト表現をご確認ください。", systemImage: "photo")
                    .font(.callout).foregroundStyle(.secondary)
                    .accessibilityFocused(focusedBlock, equals: blockID)
            }
            DisclosureGroup(isMath ? "数式のテキスト表現" : "図のテキスト表現") {
                Text(source.isEmpty ? description : source)
                    .font(.system(.callout, design: .monospaced))
                    .textSelection(.enabled)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 8)
                    .accessibilityIdentifier("native-figure-source-text-\(blockID)")
            }
            .font(.callout)
        }
        .sheet(isPresented: $enlarged) {
            if let image {
                NativeImageDetail(image: image, description: description,
                                  initialWidth: max(320, min(1_600, CGFloat(asset.width))))
            }
        }
    }
}

private struct NativeImageDetail: View {
    let image: UIImage
    let description: String
    let initialWidth: CGFloat
    @Environment(\.dismiss) private var dismiss
    @State private var zoom: CGFloat = 1
    @State private var lastZoom: CGFloat = 1

    var body: some View {
        NavigationStack {
            ScrollView([.horizontal, .vertical]) {
                Image(uiImage: image).resizable().interpolation(.high)
                    .frame(width: initialWidth * zoom,
                           height: initialWidth * zoom * image.size.height / image.size.width)
                    .padding(20)
                    .accessibilityLabel(description)
            }
            .accessibilityIdentifier("native-image-detail")
            .simultaneousGesture(MagnificationGesture()
                .onChanged { zoom = min(4, max(1, lastZoom * $0)) }
                .onEnded { _ in lastZoom = zoom })
            .navigationTitle("図・数式を拡大")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("閉じる") { dismiss() } }
                ToolbarItemGroup(placement: .bottomBar) {
                    Button {
                        zoom = max(1, zoom / 1.5)
                        lastZoom = zoom
                    } label: { Image(systemName: "minus.magnifyingglass") }
                    .accessibilityLabel("縮小")
                    .disabled(zoom <= 1)
                    Spacer()
                    Text("\(Int(zoom * 100))%").monospacedDigit().accessibilityLabel("倍率 \(Int(zoom * 100)) パーセント")
                    Spacer()
                    Button {
                        zoom = min(4, zoom * 1.5)
                        lastZoom = zoom
                    } label: { Image(systemName: "plus.magnifyingglass") }
                    .accessibilityLabel("拡大")
                    .disabled(zoom >= 4)
                }
            }
        }
    }
}
