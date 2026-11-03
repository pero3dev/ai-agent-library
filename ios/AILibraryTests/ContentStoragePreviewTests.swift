import Foundation
import XCTest
#if !STORAGE_PREVIEW_HOST
@testable import AILibrary
#endif

final class ContentStoragePreviewTests: XCTestCase {
    private func scope() throws -> URL {
        let root = FileManager.default.temporaryDirectory.resolvingSymlinksInPath()
            .appendingPathComponent("ailibrary-storage-preview-" + UUID().uuidString, isDirectory: true)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: false)
        addTeardownBlock { try? FileManager.default.removeItem(at: root) }
        return root
    }
    private func write(_ bytes: Data, _ file: URL) throws {
        try FileManager.default.createDirectory(at: file.deletingLastPathComponent(), withIntermediateDirectories: true)
        try bytes.write(to: file)
    }
    private func pointer(_ root: URL, current: String, previous: String? = nil) throws -> Data {
        var value = ["directory": current]
        if let previous { value["previousDirectory"] = previous }
        let bytes = try JSONSerialization.data(withJSONObject: value, options: [.sortedKeys])
        try write(bytes, root.appendingPathComponent("current.json")); return bytes
    }
    private func package(_ root: URL, name: String, size: Int) throws {
        try write(Data(repeating: 65, count: size), root.appendingPathComponent("versions/" + name + "/payload.bin"))
    }
    private func inventory(_ root: URL) throws -> [String: Data] {
        guard FileManager.default.fileExists(atPath: root.path) else { return [:] }
        let enumerator = FileManager.default.enumerator(at: root, includingPropertiesForKeys: [.isRegularFileKey, .isSymbolicLinkKey])!
        var values: [String: Data] = [:]
        for case let file as URL in enumerator {
            let properties = try file.resourceValues(forKeys: [.isRegularFileKey, .isSymbolicLinkKey])
            if properties.isSymbolicLink == true { enumerator.skipDescendants(); continue }
            if properties.isRegularFile == true { values[String(file.path.dropFirst(root.path.count))] = try Data(contentsOf: file) }
        }
        return values
    }

    func testAbsentRootDoesNotCreateDirectoriesOrChangeSiblingBytes() throws {
        let parent = try scope(), root = parent.appendingPathComponent("missing")
        try write(Data("keep".utf8), parent.appendingPathComponent("sibling.txt"))
        let before = try inventory(parent)
        let value = try ContentStoragePreviewScanner.scan(root: root, advisoryUses: [:])
        XCTAssertEqual(value.rootState, .absent); XCTAssertTrue(value.isComplete)
        XCTAssertEqual(value.observedLogicalBytes, 0); XCTAssertFalse(FileManager.default.fileExists(atPath: root.path))
        XCTAssertEqual(try inventory(parent), before)
    }

    func testLogicalBytesAreCountedOnceAcrossCurrentPreviousAndLiveReferences() throws {
        let root = try scope(), a = UUID(), b = UUID(), c = UUID(), d = UUID()
        for (id, bytes) in [(a, 11), (b, 13), (c, 17), (d, 19)] { try package(root, name: id.uuidString, size: bytes) }
        try package(root, name: ".staging-" + UUID().uuidString, size: 23)
        let pointerBytes = try pointer(root, current: a.uuidString, previous: b.uuidString)
        let leases = [a, b, c].compactMap { ContentSnapshotLease.acquire(storageRoot: root, generation: $0) }
        let before = try inventory(root), acquisitions = ContentSnapshotLease.advisoryAcquisitions(in: root)
        let repository = ContentRepository(bundledRoot: root.appendingPathComponent("unused-bundle"), storageRoot: root)
        let value = try withExtendedLifetime(leases) { try repository.previewStorageUsage() }
        XCTAssertTrue(value.isComplete); XCTAssertEqual(value.pointerState, .observed)
        XCTAssertEqual(value.observedLogicalBytes, 83 + Int64(pointerBytes.count))
        XCTAssertEqual(value.generations.count, 4); XCTAssertEqual(value.currentCount, 1); XCTAssertEqual(value.previousCount, 1)
        XCTAssertEqual(value.usedGenerationCount, 3); XCTAssertEqual(value.otherGenerationCount, 1); XCTAssertEqual(value.stagingCount, 1)
        XCTAssertEqual(value.regularFileCount, 6)
        XCTAssertEqual(try inventory(root), before)
        XCTAssertEqual(ContentSnapshotLease.advisoryAcquisitions(in: root), acquisitions)
        withExtendedLifetime(leases) {}
    }

    func testMalformedMissingAndOversizedPointersRemainUnconfirmedWithoutRepair() throws {
        let root = try scope(), id = UUID().uuidString
        try package(root, name: id, size: 7)
        let missing = try ContentStoragePreviewScanner.scan(root: root, advisoryUses: [:])
        XCTAssertEqual(missing.pointerState, .absent); XCTAssertFalse(missing.isComplete)
        for bytes in [Data("invalid".utf8), Data(repeating: 32, count: 4_097),
                      try JSONSerialization.data(withJSONObject: ["directory": id, "previousDirectory": 42])] {
            try write(bytes, root.appendingPathComponent("current.json"))
            let before = try inventory(root), value = try ContentStoragePreviewScanner.scan(root: root, advisoryUses: [:])
            XCTAssertEqual(value.pointerState, .invalid); XCTAssertNil(value.currentReference); XCTAssertFalse(value.isComplete)
            XCTAssertEqual(try inventory(root), before)
        }
    }

    func testLinksAtRootAndInsideVersionsNeverContributeExternalPayloadBytes() throws {
        let parent = try scope(), root = parent.appendingPathComponent("storage"), external = parent.appendingPathComponent("external")
        let id = UUID().uuidString
        try package(root, name: id, size: 3); let bytes = try pointer(root, current: id)
        try write(Data(repeating: 90, count: 10_000), external.appendingPathComponent("outside.bin"))
        let outsideBefore = try inventory(external)
        try FileManager.default.createSymbolicLink(at: root.appendingPathComponent("versions/" + UUID().uuidString), withDestinationURL: external)
        let value = try ContentStoragePreviewScanner.scan(root: root, advisoryUses: [:])
        XCTAssertEqual(value.observedLogicalBytes, Int64(bytes.count + 3)); XCTAssertEqual(value.unknownEntryCount, 1)
        XCTAssertFalse(value.isComplete); XCTAssertEqual(try inventory(external), outsideBefore)
        let alias = parent.appendingPathComponent("alias")
        try FileManager.default.createSymbolicLink(at: alias, withDestinationURL: root)
        let rejected = try ContentStoragePreviewScanner.scan(root: alias, advisoryUses: [:])
        XCTAssertEqual(rejected.rootState, .unavailable); XCTAssertEqual(rejected.observedLogicalBytes, 0)
    }

    func testEntryDepthAndGenerationLimitsReturnExplicitPartialObservations() throws {
        let root = try scope(), id = UUID().uuidString
        for _ in 0..<3 { try package(root, name: UUID().uuidString, size: 5) }
        try package(root, name: id, size: 6); _ = try pointer(root, current: id)
        let before = try inventory(root)
        var limits = ContentStoragePreviewScanner.Limits(); limits.entries = 1
        let entries = try ContentStoragePreviewScanner.scan(root: root, advisoryUses: [:], limits: limits)
        XCTAssertTrue(entries.issues.contains(.entryLimit)); XCTAssertLessThanOrEqual(entries.observedEntryCount, 1)
        limits = .init(); limits.depth = 1
        XCTAssertTrue(try ContentStoragePreviewScanner.scan(root: root, advisoryUses: [:], limits: limits).issues.contains(.depthLimit))
        limits = .init(); limits.generations = 1
        let generations = try ContentStoragePreviewScanner.scan(root: root, advisoryUses: [:], limits: limits)
        XCTAssertTrue(generations.issues.contains(.generationLimit)); XCTAssertEqual(generations.generations.count, 1)
        XCTAssertEqual(try inventory(root), before)
    }

    func testCheckedLogicalSizeArithmeticRejectsOverflowAndNegativeMetadata() {
        XCTAssertEqual(ContentStoragePreviewScanner.adding(1, to: Int64.max - 1), Int64.max)
        XCTAssertNil(ContentStoragePreviewScanner.adding(1, to: Int64.max))
        XCTAssertNil(ContentStoragePreviewScanner.adding(-1, to: 0))
        XCTAssertNil(ContentStoragePreviewScanner.adding(1, to: -1))
    }

    func testPointerChangeClearsSelectionAndReportsIncomplete() throws {
        let root = try scope(), a = UUID().uuidString, b = UUID().uuidString
        try package(root, name: a, size: 9); try package(root, name: b, size: 8)
        _ = try pointer(root, current: a)
        let value = try ContentStoragePreviewScanner.scan(root: root, advisoryUses: [:], beforeFinalObservation: {
            _ = try self.pointer(root, current: b)
        })
        XCTAssertEqual(value.pointerState, .changed); XCTAssertTrue(value.issues.contains(.changed)); XCTAssertFalse(value.isComplete)
        XCTAssertEqual(value.currentCount, 0); XCTAssertNil(value.currentReference)
        XCTAssertEqual(try JSONSerialization.jsonObject(with: Data(contentsOf: root.appendingPathComponent("current.json"))) as? [String: String], ["directory": b])
    }

    func testCancellationBeforeAndDuringMetadataReadsDoesNotMutateStorage() throws {
        let root = try scope(), id = UUID().uuidString
        try package(root, name: id, size: 8); _ = try pointer(root, current: id)
        let before = try inventory(root)
        XCTAssertThrowsError(try ContentStoragePreviewScanner.scan(root: root, advisoryUses: [:], checkCancellation: { throw CancellationError() })) {
            XCTAssertTrue($0 is CancellationError)
        }
        var checks = 0
        XCTAssertThrowsError(try ContentStoragePreviewScanner.scan(root: root, advisoryUses: [:], checkCancellation: {
            checks += 1; if checks == 18 { throw CancellationError() }
        })) { XCTAssertTrue($0 is CancellationError) }
        XCTAssertEqual(checks, 18); XCTAssertEqual(try inventory(root), before)
    }

    func testUnobservedPointerAndLiveReferenceDoNotImplyAnUnselectedSafeVersion() throws {
        let root = try scope(), selected = UUID(), active = UUID()
        _ = try pointer(root, current: selected.uuidString)
        let value = try ContentStoragePreviewScanner.scan(root: root, advisoryUses: [active: 1])
        XCTAssertEqual(value.currentReference, selected); XCTAssertEqual(value.currentCount, 0)
        XCTAssertEqual(value.unobservedUseCount, 1); XCTAssertTrue(value.issues.contains(.referenceNotObserved)); XCTAssertFalse(value.isComplete)
    }

    func testUnknownEntriesAreMeasuredButNeverSilentlyClassifiedAsStoredVersions() throws {
        let root = try scope(), id = UUID().uuidString
        try package(root, name: id, size: 2); let bytes = try pointer(root, current: id)
        try write(Data(repeating: 7, count: 5), root.appendingPathComponent("unknown/nested.bin"))
        let before = try inventory(root), value = try ContentStoragePreviewScanner.scan(root: root, advisoryUses: [:])
        XCTAssertEqual(value.observedLogicalBytes, Int64(bytes.count + 7)); XCTAssertEqual(value.generations.count, 1)
        XCTAssertEqual(value.unknownEntryCount, 1); XCTAssertFalse(value.isComplete); XCTAssertEqual(try inventory(root), before)
    }
}
