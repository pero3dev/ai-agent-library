import Foundation

/// A read-only comparison, derived from fully validated packages on a background task.
struct BundledContentPreview: Equatable, Sendable {
    let currentArticleCount: Int
    let bundledArticleCount: Int
    let currentRevision: String
    let bundledRevision: String
    let isAlreadyActive: Bool
}

/// A complete version is validated in staging before one atomic pointer write activates it.
final class ContentRepository {
    private struct Pointer: Codable {
        let directory: String
        let previousDirectory: String?

        private enum CodingKeys: String, CodingKey { case directory, previousDirectory }

        init(directory: String, previousDirectory: String? = nil) {
            self.directory = directory
            self.previousDirectory = previousDirectory
        }

        init(from decoder: Decoder) throws {
            let values = try decoder.container(keyedBy: CodingKeys.self)
            directory = try values.decode(String.self, forKey: .directory)
            // Invalid optional recovery metadata must not poison a healthy current package.
            previousDirectory = try? values.decode(String.self, forKey: .previousDirectory)
        }
    }
    let bundledRoot: URL
    let storageRoot: URL
    private let fileManager: FileManager
    private let writePointer: (Data, URL) throws -> Void
    private let allowsTestFixtures: Bool

    init(bundledRoot: URL, storageRoot: URL, fileManager: FileManager = .default,
         allowsTestFixtures: Bool = false,
         writePointer: @escaping (Data, URL) throws -> Void = { try $0.write(to: $1, options: .atomic) }) {
        self.bundledRoot = bundledRoot
        self.storageRoot = storageRoot
        self.fileManager = fileManager
        self.writePointer = writePointer
        self.allowsTestFixtures = allowsTestFixtures
    }

    func load() throws -> ContentSnapshot {
        if let selected = revalidatedStoredSelection() {
            return retainingGenerationLease(selected.snapshot, directory: selected.directory)
        }
        return try validate(root: bundledRoot)
    }

    /// A single pointer names at most two eligible stored generations. There is
    /// no directory scan, recursive history, repair write or imported-origin claim.
    /// An unreadable/invalid current pointer still falls back only to the bundle.
    private func revalidatedStoredSelection() -> (directory: String, snapshot: ContentSnapshot)? {
        let pointerURL = storageRoot.appendingPathComponent("current.json")
        guard let data = try? Data(contentsOf: pointerURL),
              let pointer = try? JSONDecoder().decode(Pointer.self, from: data),
              let currentID = UUID(uuidString: pointer.directory) else { return nil }
        let versions = storageRoot.appendingPathComponent("versions")
        if let current = try? validate(root: versions.appendingPathComponent(pointer.directory)) {
            return (pointer.directory, current)
        }
        guard let previous = pointer.previousDirectory, let previousID = UUID(uuidString: previous),
              previousID != currentID,
              let retained = try? validate(root: versions.appendingPathComponent(previous)) else { return nil }
        // Validation itself acquires no lease. Only the snapshot actually returned
        // by load/install is published with its own generation acquisition.
        return (previous, retained)
    }

    func previewBundledContent() throws -> BundledContentPreview {
        let bundled = try validate(root: bundledRoot)
        let current = try load()
        return BundledContentPreview(currentArticleCount: current.manifest.articles.count,
            bundledArticleCount: bundled.manifest.articles.count,
            currentRevision: current.manifest.revision, bundledRevision: bundled.manifest.revision,
            isAlreadyActive: try hasSameManifest(current, bundled))
    }

    /// Selection is explicit. A valid imported version still wins during ordinary load.
    /// Equal revisions alone are not identities: metadata and every listed asset digest
    /// must agree after both complete packages have passed validation.
    func activateBundledContent() throws -> (snapshot: ContentSnapshot, alreadyActive: Bool) {
        let bundled = try validate(root: bundledRoot)
        if let current = try? load(), try hasSameManifest(current, bundled) {
            return (current, true)
        }
        return (try install(from: bundledRoot, remembersPreviousStoredVersion: false), false)
    }

    private func hasSameManifest(_ lhs: ContentSnapshot, _ rhs: ContentSnapshot) throws -> Bool {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
        return try encoder.encode(lhs.manifest) == encoder.encode(rhs.manifest)
    }

    func install(from source: URL) throws -> ContentSnapshot {
        return try install(from: source, remembersPreviousStoredVersion: true)
    }

    private func install(from source: URL, remembersPreviousStoredVersion: Bool) throws -> ContentSnapshot {
        // Validate the provider's folder before copying; validate again to detect changes during copy.
        _ = try validate(root: source)
        let versions = storageRoot.appendingPathComponent("versions", isDirectory: true)
        try fileManager.createDirectory(at: versions, withIntermediateDirectories: true)
        let id = UUID().uuidString
        let staging = versions.appendingPathComponent(".staging-" + id, isDirectory: true)
        let destination = versions.appendingPathComponent(id, isDirectory: true)
        var activated = false
        defer {
            try? fileManager.removeItem(at: staging)
            if !activated { try? fileManager.removeItem(at: destination) }
        }
        try fileManager.copyItem(at: source, to: staging)
        _ = try validate(root: staging)
        try fileManager.moveItem(at: staging, to: destination)
        let snapshot = try validate(root: destination)
        // The same authorized writer commits selection and one revalidated
        // predecessor together. An explicit non-noop bundle selection clears it.
        let previous = remembersPreviousStoredVersion ? revalidatedStoredSelection()?.directory : nil
        let pointer = try JSONEncoder().encode(Pointer(directory: id, previousDirectory: previous))
        try writePointer(pointer, storageRoot.appendingPathComponent("current.json"))
        activated = true
        // Keep earlier versions for this prototype; an open reader may still reference one.
        return retainingGenerationLease(snapshot, directory: id)
    }

    /// Live acquisitions only; persistent current, staging, path identity and
    /// delayed image reads need separate protection before any future cleanup.
    var advisorySnapshotAcquisitions: [UUID: Int] {
        ContentSnapshotLease.advisoryAcquisitions(in: storageRoot)
    }

    private func retainingGenerationLease(_ snapshot: ContentSnapshot, directory: String) -> ContentSnapshot {
        guard let generation = UUID(uuidString: directory),
              let lease = ContentSnapshotLease.acquire(storageRoot: storageRoot, generation: generation) else { return snapshot }
        return snapshot.retainingGenerationLease(lease)
    }

    private func validate(root: URL) throws -> ContentSnapshot {
        let snapshot = try ContentValidator.validate(root: root)
        guard allowsTestFixtures || !snapshot.manifest.containsTestFixtures else {
            throw ContentError.invalid("本文表示テストの記事は通常のライブラリへ取り込めません。")
        }
        return snapshot
    }
}
