import Foundation
import XCTest
@testable import AILibrary

final class NativeReaderPlacementPolicyTests: XCTestCase {
    func testDelayedLeafRequiresMaterializationAndLaterVerifiedAlignment() {
        let id = UUID()
        var policy = NativeReaderPlacementPolicy(generation: id, interactionEpoch: 3, startedAt: 10)
        XCTAssertEqual(policy.next(.rootNotReady, now: 10, generation: id, interactionEpoch: 3), .waitForLayout)
        XCTAssertEqual(policy.next(.targetMissing, now: 10.1, generation: id, interactionEpoch: 3), .materialize)
        XCTAssertEqual(policy.next(.targetMissing, now: 10.2, generation: id, interactionEpoch: 3), .materialize)
        XCTAssertEqual(policy.next(.needsAlignment, now: 10.3, generation: id, interactionEpoch: 3), .align)
        XCTAssertNil(policy.outcome)
        XCTAssertEqual(policy.next(.aligned, now: 10.4, generation: id, interactionEpoch: 3), .waitForLayout)
        XCTAssertNil(policy.outcome)
        XCTAssertEqual(policy.next(.aligned, now: 10.5, generation: id, interactionEpoch: 3), .finished(.aligned))
    }

    func testPanThatEndsBetweenPollsPermanentlyInvalidatesTheOldRequest() {
        let id = UUID()
        var policy = NativeReaderPlacementPolicy(generation: id, interactionEpoch: 9, startedAt: 10)
        XCTAssertEqual(policy.next(.targetMissing, now: 10, generation: id, interactionEpoch: 9), .materialize)
        // The recognizer's .began incremented the epoch; no current isDragging
        // flag is needed after the short gesture has already ended.
        XCTAssertEqual(policy.next(.aligned, now: 10.1, generation: id, interactionEpoch: 10), .finished(.interrupted))
        XCTAssertEqual(policy.next(.targetMissing, now: 10.2, generation: id, interactionEpoch: 10), .finished(.interrupted))
        XCTAssertEqual(policy.materializations, 1)
        XCTAssertEqual(policy.corrections, 0)
    }

    func testNewGenerationSupersedesOnlyTheOldRequest() {
        let oldID = UUID(), newID = UUID()
        var old = NativeReaderPlacementPolicy(generation: oldID, interactionEpoch: 0, startedAt: 10)
        XCTAssertEqual(old.next(.needsAlignment, now: 10, generation: newID, interactionEpoch: 0), .finished(.superseded))
        var fresh = NativeReaderPlacementPolicy(generation: newID, interactionEpoch: 0, startedAt: 10)
        XCTAssertEqual(fresh.next(.aligned, now: 10, generation: newID, interactionEpoch: 0), .waitForLayout)
        XCTAssertEqual(fresh.next(.aligned, now: 10.1, generation: newID, interactionEpoch: 0), .finished(.aligned))
        XCTAssertEqual(old.corrections, 0)
    }

    func testDeadlineAndLayoutBudgetNeverReportUnalignedCompletionOrRevive() {
        let id = UUID()
        var deadline = NativeReaderPlacementPolicy(generation: id, interactionEpoch: 0, startedAt: 10)
        XCTAssertEqual(deadline.terminalOutcome(now: 11, generation: id, interactionEpoch: 0, cancelled: false), .exhausted)
        XCTAssertEqual(deadline.next(.targetMissing, now: 11, generation: id, interactionEpoch: 0), .finished(.exhausted))
        XCTAssertEqual(deadline.next(.aligned, now: 11.1, generation: id, interactionEpoch: 0), .finished(.exhausted))
        XCTAssertEqual(deadline.materializations, 0)
        var passes = NativeReaderPlacementPolicy(generation: id, interactionEpoch: 0, startedAt: 10, maximumLayoutPasses: 2)
        XCTAssertEqual(passes.next(.rootNotReady, now: 10, generation: id, interactionEpoch: 0), .waitForLayout)
        XCTAssertEqual(passes.next(.rootNotReady, now: 10.1, generation: id, interactionEpoch: 0), .waitForLayout)
        XCTAssertEqual(passes.next(.aligned, now: 10.2, generation: id, interactionEpoch: 0), .finished(.exhausted))
        XCTAssertEqual(passes.layoutPasses, 2)
    }

    func testObservedDriftResetsVerificationAndCorrectionBudgetIsFinite() {
        let id = UUID()
        var policy = NativeReaderPlacementPolicy(generation: id, interactionEpoch: 0, startedAt: 10, maximumCorrections: 1)
        XCTAssertEqual(policy.next(.aligned, now: 10, generation: id, interactionEpoch: 0), .waitForLayout)
        XCTAssertEqual(policy.next(.needsAlignment, now: 10.1, generation: id, interactionEpoch: 0), .align)
        XCTAssertEqual(policy.next(.aligned, now: 10.2, generation: id, interactionEpoch: 0), .waitForLayout)
        XCTAssertEqual(policy.next(.needsAlignment, now: 10.3, generation: id, interactionEpoch: 0), .finished(.exhausted))
        XCTAssertNotEqual(policy.outcome, .aligned)
    }

    func testMissingTargetCannotCreateUnboundedProxyCalls() {
        let id = UUID()
        var policy = NativeReaderPlacementPolicy(generation: id, interactionEpoch: 0, startedAt: 10,
                                                  maximumLayoutPasses: 5, maximumMaterializations: 2)
        let actions = (0..<6).map { index in
            policy.next(.targetMissing, now: 10 + Double(index) / 100, generation: id, interactionEpoch: 0)
        }
        XCTAssertEqual(actions, [.materialize, .materialize, .waitForLayout, .waitForLayout,
                                 .waitForLayout, .finished(.exhausted)])
        XCTAssertEqual(policy.materializations, 2)
    }

    func testCancellationAndUnavailableObservationsNeverYieldAlignmentActions() {
        let id = UUID()
        for observation in [NativeReaderPlacementPolicy.Observation.rootNotReady, .needsAlignment, .aligned] {
            var policy = NativeReaderPlacementPolicy(generation: id, interactionEpoch: 0, startedAt: 10)
            XCTAssertEqual(policy.next(observation, now: 10, generation: id, interactionEpoch: 0, cancelled: true), .finished(.cancelled))
            XCTAssertEqual(policy.next(.needsAlignment, now: 10.1, generation: id, interactionEpoch: 0), .finished(.cancelled))
            XCTAssertEqual(policy.corrections, 0)
        }
        var invalid = NativeReaderPlacementPolicy(generation: id, interactionEpoch: 0, startedAt: 10)
        XCTAssertEqual(invalid.next(.unavailable, now: 10, generation: id, interactionEpoch: 0), .finished(.unavailable))
        XCTAssertEqual(invalid.next(.aligned, now: 10.1, generation: id, interactionEpoch: 0), .finished(.unavailable))
        for time in [Double.nan, .infinity, -.infinity] {
            var nonfinite = NativeReaderPlacementPolicy(generation: id, interactionEpoch: 0, startedAt: time)
            XCTAssertEqual(nonfinite.next(.aligned, now: 10, generation: id, interactionEpoch: 0), .finished(.unavailable))
        }
    }

    func testRenderedLayoutReceiptRejectsBodySizeRaceBeforeRestoreTaskRuns() throws {
        let original = NativeReaderLayoutIdentity(source: "doc", width: 393, height: 754, bodySize: 17)
        let largerText = NativeReaderLayoutIdentity(source: "doc", width: 393, height: 754, bodySize: 53)
        var live = NativeReaderRenderedLayoutReceipt()
        live.report(original)
        let placement = try XCTUnwrap(live.capture())
        let capturedLayout = original, trackingLayout = original
        XCTAssertEqual(capturedLayout, trackingLayout, "The old-to-old comparison alone still passes")
        live.report(largerText) // updateUIView reports before the restore task runs.
        XCTAssertFalse(live.matches(placement, expected: capturedLayout))
        XCTAssertFalse(live.matches(placement, expected: largerText))
        let replacement = try XCTUnwrap(live.capture())
        XCTAssertTrue(live.matches(replacement, expected: largerText))
        live.report(original)
        XCTAssertFalse(live.matches(placement, expected: original), "A -> B -> A cannot revive the old placement")
    }

    func testRenderedLayoutReceiptAcceptsRepeatedSameLayoutAndRejectsOtherDimensions() throws {
        let original = NativeReaderLayoutIdentity(source: "doc", width: 393, height: 754, bodySize: 17)
        var live = NativeReaderRenderedLayoutReceipt()
        XCTAssertNil(live.capture())
        XCTAssertFalse(live.matches(nil, expected: original))
        live.report(original)
        let placement = try XCTUnwrap(live.capture())
        for _ in 0..<8 { live.report(original) }
        XCTAssertTrue(live.matches(placement, expected: original), "Repeated marker registration is not a new layout")
        for changed in [NativeReaderLayoutIdentity(source: "other", width: 393, height: 754, bodySize: 17),
                        NativeReaderLayoutIdentity(source: "doc", width: 754, height: 393, bodySize: 17),
                        NativeReaderLayoutIdentity(source: "doc", width: 393, height: 700, bodySize: 17)] {
            XCTAssertFalse(live.matches(placement, expected: changed))
            live.report(changed)
            XCTAssertFalse(live.matches(placement, expected: original))
            live.report(original)
        }
    }

    func testRenderedLayoutReceiptRejectsInvalidOrUnreportedRenderedIdentity() throws {
        let original = NativeReaderLayoutIdentity(source: "doc", width: 393, height: 754, bodySize: 17)
        for invalid in [NativeReaderLayoutIdentity(source: "", width: 393, height: 754, bodySize: 17),
                        NativeReaderLayoutIdentity(source: "doc", width: 0, height: 754, bodySize: 17),
                        NativeReaderLayoutIdentity(source: "doc", width: 393, height: -.infinity, bodySize: 17),
                        NativeReaderLayoutIdentity(source: "doc", width: 393, height: 754, bodySize: .nan)] {
            var live = NativeReaderRenderedLayoutReceipt(); live.report(original)
            let placement = try XCTUnwrap(live.capture())
            live.report(invalid)
            XCTAssertNil(live.capture())
            XCTAssertFalse(live.matches(placement, expected: original))
            XCTAssertFalse(live.matches(placement, expected: invalid))
        }
    }

    func testReachedTargetIntervalRequiresWholeFiniteTargetWithinUsableViewport() {
        XCTAssertTrue(NativeReaderPlacementPolicy.fullyVisibleTargetInterval(start: 100, end: 130, visibleTop: 100, visibleBottom: 200))
        XCTAssertTrue(NativeReaderPlacementPolicy.fullyVisibleTargetInterval(start: 170, end: 200, visibleTop: 100, visibleBottom: 200))
        for interval in [(99.9, 130.0, 100.0, 200.0), (170, 200.1, 100, 200), (100, 100, 100, 200),
                         (130, 100, 100, 200), (100, 130, 200, 200), (100, 130, 200, 100),
                         (Double.nan, 130, 100, 200), (100, Double.infinity, 100, 200),
                         (100, 130, -Double.infinity, 200), (100, 130, 100, Double.nan),
                         (-Double.greatestFiniteMagnitude, Double.greatestFiniteMagnitude, -Double.greatestFiniteMagnitude, Double.greatestFiniteMagnitude)] {
            XCTAssertFalse(NativeReaderPlacementPolicy.fullyVisibleTargetInterval(start: interval.0, end: interval.1,
                visibleTop: interval.2, visibleBottom: interval.3))
        }
    }

    func testReachedMeasurementDoesNotTurnExhaustionIntoAlignmentOrExtendBudget() {
        let generation = UUID()
        var policy = NativeReaderPlacementPolicy(generation: generation, interactionEpoch: 7, startedAt: 10)
        XCTAssertEqual(policy.deadline, 11)
        XCTAssertEqual(policy.next(.needsAlignment, now: 11, generation: generation, interactionEpoch: 7), .finished(.exhausted))
        XCTAssertTrue(NativeReaderPlacementPolicy.fullyVisibleTargetInterval(start: 100, end: 130, visibleTop: 100, visibleBottom: 200))
        XCTAssertEqual(policy.next(.aligned, now: 11.1, generation: generation, interactionEpoch: 7), .finished(.exhausted))
        XCTAssertEqual(policy.outcome, .exhausted)
        XCTAssertEqual(policy.corrections, 0)
    }

    func testDeferredCorrectionStartsFreshBudgetWithoutRecapturingRequestIdentity() {
        let id = UUID(), replacement = UUID()
        let originalEpoch: UInt64 = 9
        // Preparation can outlast one second. It checks identity, not an already
        // expiring correction deadline, before the deferred task may start.
        XCTAssertNil(NativeReaderPlacementPolicy.requestIdentityOutcome(generation: id, interactionEpoch: originalEpoch,
            currentGeneration: id, currentInteractionEpoch: originalEpoch, cancelled: false))
        XCTAssertEqual(NativeReaderPlacementPolicy.requestIdentityOutcome(generation: id, interactionEpoch: originalEpoch,
            currentGeneration: replacement, currentInteractionEpoch: originalEpoch + 1, cancelled: true,
            isUserInteracting: true), .cancelled)
        XCTAssertEqual(NativeReaderPlacementPolicy.requestIdentityOutcome(generation: id, interactionEpoch: originalEpoch,
            currentGeneration: replacement, currentInteractionEpoch: originalEpoch + 1, cancelled: false,
            isUserInteracting: true), .superseded)
        XCTAssertEqual(NativeReaderPlacementPolicy.requestIdentityOutcome(generation: id, interactionEpoch: originalEpoch,
            currentGeneration: id, currentInteractionEpoch: originalEpoch + 1, cancelled: false), .interrupted)
        XCTAssertEqual(NativeReaderPlacementPolicy.requestIdentityOutcome(generation: id, interactionEpoch: originalEpoch,
            currentGeneration: id, currentInteractionEpoch: originalEpoch, cancelled: false,
            isUserInteracting: true), .interrupted)

        // The original epoch is reused even though preparation started at10 and
        // the correction task did not start until12. No epoch is recaptured.
        var fresh = NativeReaderPlacementPolicy(generation: id, interactionEpoch: originalEpoch, startedAt: 12)
        XCTAssertEqual(fresh.interactionEpoch, originalEpoch)
        XCTAssertEqual(fresh.deadline, 13)
        XCTAssertEqual(fresh.next(.needsAlignment, now: 12.1, generation: id,
            interactionEpoch: originalEpoch), .align)
        XCTAssertEqual(fresh.next(.aligned, now: 12.2, generation: id,
            interactionEpoch: originalEpoch), .waitForLayout)
        XCTAssertEqual(fresh.next(.aligned, now: 12.3, generation: id,
            interactionEpoch: originalEpoch), .finished(.aligned))

        var pannedBeforeStart = NativeReaderPlacementPolicy(generation: id, interactionEpoch: originalEpoch, startedAt: 12)
        XCTAssertEqual(pannedBeforeStart.next(.needsAlignment, now: 12, generation: id,
            interactionEpoch: originalEpoch + 1), .finished(.interrupted))
        XCTAssertEqual(pannedBeforeStart.corrections, 0)
        var expired = NativeReaderPlacementPolicy(generation: id, interactionEpoch: originalEpoch, startedAt: 12)
        XCTAssertEqual(expired.next(.targetMissing, now: 13, generation: id,
            interactionEpoch: originalEpoch), .finished(.exhausted))
        XCTAssertEqual(expired.next(.aligned, now: 13.1, generation: id,
            interactionEpoch: originalEpoch), .finished(.exhausted))
        XCTAssertEqual(expired.deadline, 13)
        XCTAssertEqual(expired.materializations, 0)
    }
}
