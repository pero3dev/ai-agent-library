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
}
