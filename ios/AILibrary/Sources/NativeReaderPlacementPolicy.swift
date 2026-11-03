import Foundation

struct NativeReaderLayoutIdentity: Hashable {
    let source: String
    let width: CGFloat
    let height: CGFloat
    let bodySize: CGFloat
}

/// Marker registrations report the live rendered identity, independently of
/// SwiftUI task/onChange scheduling. A changed identity invalidates old evidence,
/// including A -> B -> A; it never changes placement deadlines or pan epochs.
struct NativeReaderRenderedLayoutReceipt {
    struct Snapshot: Equatable {
        fileprivate let epoch: UInt64
        fileprivate let layout: NativeReaderLayoutIdentity
    }
    private var layout: NativeReaderLayoutIdentity?
    private var epoch: UInt64 = 0

    mutating func report(_ next: NativeReaderLayoutIdentity) {
        guard layout != next else { return }
        epoch &+= 1
        layout = next
    }

    func capture() -> Snapshot? {
        guard let layout, !layout.source.isEmpty,
              [layout.width, layout.height, layout.bodySize].allSatisfy({ $0.isFinite && $0 > 0 }) else { return nil }
        return Snapshot(epoch: epoch, layout: layout)
    }

    func matches(_ snapshot: Snapshot?, expected: NativeReaderLayoutIdentity) -> Bool {
        guard let snapshot, let live = capture(), snapshot == live else { return false }
        return live.layout == expected
    }
}

/// One live placement request. Attempts are layout-driven, never a saved intent
/// that a later marker registration may restart after interruption or expiry.
struct NativeReaderPlacementPolicy {
    enum Observation: Equatable {
        case rootNotReady, targetMissing, needsAlignment, aligned
        case userInterruption, unavailable
    }
    enum Outcome: Equatable {
        case aligned, interrupted, exhausted, cancelled, superseded, unavailable
    }
    enum Action: Equatable {
        case waitForLayout, materialize, align
        case finished(Outcome)
    }

    let generation: UUID
    let interactionEpoch: UInt64
    let deadline: TimeInterval
    let maximumLayoutPasses: Int
    let maximumMaterializations: Int
    let maximumCorrections: Int
    private(set) var layoutPasses = 0
    private(set) var materializations = 0
    private(set) var corrections = 0
    private(set) var consecutiveAlignedPasses = 0
    private(set) var outcome: Outcome?

    init(generation: UUID, interactionEpoch: UInt64, startedAt: TimeInterval,
         maximumDuration: TimeInterval = 1, maximumLayoutPasses: Int = 60,
         maximumMaterializations: Int = 6, maximumCorrections: Int = 6) {
        self.generation = generation
        self.interactionEpoch = interactionEpoch
        self.deadline = startedAt + maximumDuration
        self.maximumLayoutPasses = maximumLayoutPasses
        self.maximumMaterializations = maximumMaterializations
        self.maximumCorrections = maximumCorrections
        if !startedAt.isFinite || !maximumDuration.isFinite || maximumDuration <= 0
            || !deadline.isFinite || maximumLayoutPasses < 1
            || maximumMaterializations < 1 || maximumCorrections < 1 {
            outcome = .unavailable
        }
    }

    /// Read-only reach evidence, not alignment success or an offset command.
    /// Use content coordinates from the same current root and complete markers.
    static func fullyVisibleTargetInterval(start: Double, end: Double,
        visibleTop: Double, visibleBottom: Double) -> Bool {
        guard [start, end, visibleTop, visibleBottom].allSatisfy(\.isFinite),
              end > start, visibleBottom > visibleTop,
              (end - start).isFinite, (visibleBottom - visibleTop).isFinite else { return false }
        return start >= visibleTop && end <= visibleBottom
    }

    /// Preparation has no correction deadline. Its original request identity
    /// must survive cancellation, replacement and even a pan that already ended.
    /// The timed policy keeps active-pan handling in the existing View check.
    static func requestIdentityOutcome(generation expectedGeneration: UUID, interactionEpoch expectedEpoch: UInt64,
        currentGeneration: UUID, currentInteractionEpoch: UInt64, cancelled: Bool,
        isUserInteracting: Bool = false) -> Outcome? {
        if cancelled { return .cancelled }
        if currentGeneration != expectedGeneration { return .superseded }
        if currentInteractionEpoch != expectedEpoch || isUserInteracting { return .interrupted }
        return nil
    }

    func terminalOutcome(now: TimeInterval, generation current: UUID,
                         interactionEpoch currentEpoch: UInt64, cancelled: Bool) -> Outcome? {
        if let outcome { return outcome }
        if let identity = Self.requestIdentityOutcome(generation: generation, interactionEpoch: interactionEpoch,
            currentGeneration: current, currentInteractionEpoch: currentEpoch, cancelled: cancelled) { return identity }
        if !now.isFinite { return .unavailable }
        if now >= deadline || layoutPasses >= maximumLayoutPasses { return .exhausted }
        return nil
    }

    mutating func next(_ observation: Observation, now: TimeInterval, generation current: UUID,
                       interactionEpoch currentEpoch: UInt64, cancelled: Bool = false) -> Action {
        if let end = terminalOutcome(now: now, generation: current,
                                     interactionEpoch: currentEpoch, cancelled: cancelled) {
            outcome = end
            return .finished(end)
        }
        layoutPasses += 1
        if observation != .aligned { consecutiveAlignedPasses = 0 }
        switch observation {
        case .rootNotReady: return .waitForLayout
        case .targetMissing:
            guard materializations < maximumMaterializations else { return .waitForLayout }
            materializations += 1
            return .materialize
        case .needsAlignment:
            guard corrections < maximumCorrections else {
                outcome = .exhausted
                return .finished(.exhausted)
            }
            corrections += 1
            return .align
        case .aligned:
            // A setContentOffset call is not success. The same clamped geometry
            // must be observed on two distinct layout passes after any correction.
            consecutiveAlignedPasses += 1
            if consecutiveAlignedPasses >= 2 {
                outcome = .aligned
                return .finished(.aligned)
            }
            return .waitForLayout
        case .userInterruption:
            outcome = .interrupted
            return .finished(.interrupted)
        case .unavailable:
            outcome = .unavailable
            return .finished(.unavailable)
        }
    }
}
