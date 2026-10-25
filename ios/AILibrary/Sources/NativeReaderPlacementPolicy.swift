import Foundation

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

    func terminalOutcome(now: TimeInterval, generation current: UUID,
                         interactionEpoch currentEpoch: UInt64, cancelled: Bool) -> Outcome? {
        if let outcome { return outcome }
        if cancelled { return .cancelled }
        if current != generation { return .superseded }
        if currentEpoch != interactionEpoch { return .interrupted }
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
