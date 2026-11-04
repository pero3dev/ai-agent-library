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
    private let beforeStoredLeasePublication: (() throws -> Void)?

    init(bundledRoot: URL, storageRoot: URL, fileManager: FileManager = .default,
         allowsTestFixtures: Bool = false,
         beforeStoredLeasePublication: (() throws -> Void)? = nil,
         writePointer: @escaping (Data, URL) throws -> Void = { try $0.write(to: $1, options: .atomic) }) {
        self.bundledRoot = bundledRoot
        self.storageRoot = storageRoot
        self.fileManager = fileManager
        self.writePointer = writePointer
        self.allowsTestFixtures = allowsTestFixtures
        self.beforeStoredLeasePublication = beforeStoredLeasePublication
    }

    func load() throws -> ContentSnapshot {
        // An unsupported storage URL cannot participate in stored selection.
        // Preserve the trusted bundle fallback without reading that URL at all.
        guard let scope = ContentStorageBookkeepingScope.capture(for: storageRoot) else {
            return try validate(root: bundledRoot)
        }
        return try ContentMutationCoordinator.withReaderAdmission(in: scope) { admission in
            try load(acquiringLease: { try admission.acquireLease(generation: $0) })
        }
    }

    /// Admission starts before pointer/asset validation and ends only after the
    /// selected stored snapshot has its lease. The default handoff dependency is
    /// nil; an internal initializer dependency permits deterministic failure tests.
    private func load(acquiringLease: (UUID) throws -> ContentSnapshotLease) throws -> ContentSnapshot {
        if let selected = revalidatedStoredSelection() {
            try beforeStoredLeasePublication?()
            return try retainingGenerationLease(selected.snapshot, directory: selected.directory,
                                                acquiringLease: acquiringLease)
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

    /// Bounded metadata observation only. No validation, pointer change or cleanup.
    func previewStorageUsage() throws -> ContentStoragePreview {
        try ContentStoragePreviewScanner.scan(root: storageRoot,
                                              advisoryUses: advisorySnapshotAcquisitions)
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
        try ContentMutationCoordinator.withMutation(at: storageRoot) { mutation in
            let bundled = try validate(root: bundledRoot)
            if let current = try? load(acquiringLease: { try mutation.acquireLease(generation: $0) }),
               try hasSameManifest(current, bundled) {
                return (current, true)
            }
            return (try install(from: bundledRoot, remembersPreviousStoredVersion: false, mutation: mutation), false)
        }
    }

    private func hasSameManifest(_ lhs: ContentSnapshot, _ rhs: ContentSnapshot) throws -> Bool {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
        return try encoder.encode(lhs.manifest) == encoder.encode(rhs.manifest)
    }

    func install(from source: URL) throws -> ContentSnapshot {
        try ContentMutationCoordinator.withMutation(at: storageRoot) { mutation in
            try install(from: source, remembersPreviousStoredVersion: true, mutation: mutation)
        }
    }

    private func install(from source: URL, remembersPreviousStoredVersion: Bool,
                         mutation: ContentMutationCoordinator.Mutation) throws -> ContentSnapshot {
        // Validate the provider's folder before copying; validate again to detect changes during copy.
        _ = try validate(root: source)
        let versions = storageRoot.appendingPathComponent("versions", isDirectory: true)
        try fileManager.createDirectory(at: versions, withIntermediateDirectories: true)
        let attemptID = UUID()
        let id = attemptID.uuidString
        let staging = versions.appendingPathComponent(".staging-" + id, isDirectory: true)
        let destination = versions.appendingPathComponent(id, isDirectory: true)
        try mutation.registerStagingAttempt(attemptID)
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
        return try retainingGenerationLease(snapshot, directory: id,
                                            acquiringLease: { try mutation.acquireLease(generation: $0) })
    }

    /// Live acquisitions only; persistent current, staging, path identity and
    /// delayed image reads need separate protection before any future cleanup.
    var advisorySnapshotAcquisitions: [UUID: Int] {
        ContentSnapshotLease.advisoryAcquisitions(in: storageRoot)
    }

    private func retainingGenerationLease(_ snapshot: ContentSnapshot, directory: String,
                                          acquiringLease: (UUID) throws -> ContentSnapshotLease) throws -> ContentSnapshot {
        guard let generation = UUID(uuidString: directory) else {
            throw ContentError.invalid("保存記事版の参照を確認できません。")
        }
        return snapshot.retainingGenerationLease(try acquiringLease(generation))
    }

    private func validate(root: URL) throws -> ContentSnapshot {
        let snapshot = try ContentValidator.validate(root: root)
        guard allowsTestFixtures || !snapshot.manifest.containsTestFixtures else {
            throw ContentError.invalid("本文表示テストの記事は通常のライブラリへ取り込めません。")
        }
        return snapshot
    }
}

/// Process-local cooperation only. Captured canonical paths are not stable
/// filesystem identities or locks against replacement/another process. Source
/// imports and uncooperative readers need separate protection. CleanupGate only
/// excludes cooperating admissions; it never authorizes filesystem removal.
enum ContentMutationCoordinator {
    final class Mutation {
        private let scope: ContentStorageBookkeepingScope.Captured
        private let owner: UUID
        private let registry: Registry

        fileprivate init(scope: ContentStorageBookkeepingScope.Captured, owner: UUID, registry: Registry) {
            self.scope = scope; self.owner = owner; self.registry = registry
        }

        /// Reserved before copying through pointer publication/deferred cleanup.
        func registerStagingAttempt(_ id: UUID) throws {
            try registry.register(id, in: scope.path, owner: owner)
        }

        func acquireLease(generation: UUID) throws -> ContentSnapshotLease {
            try registry.acquireLease(in: scope, owner: owner, reader: false, generation: generation)
        }

        fileprivate func finish() { registry.releaseMutation(scope: scope.path, owner: owner) }
        deinit { finish() }
    }

    final class ReaderAdmission {
        private let scope: ContentStorageBookkeepingScope.Captured
        private let owner: UUID
        private let registry: Registry

        fileprivate init(scope: ContentStorageBookkeepingScope.Captured, owner: UUID, registry: Registry) {
            self.scope = scope; self.owner = owner; self.registry = registry
        }

        /// Publish in the admitted scope before the admission is released. No
        /// URL resolution or filesystem I/O occurs inside either ledger lock.
        func acquireLease(generation: UUID) throws -> ContentSnapshotLease {
            try registry.acquireLease(in: scope, owner: owner, reader: true, generation: generation)
        }

        fileprivate func finish() { registry.releaseReader(scope: scope.path, owner: owner) }
        deinit { finish() }
    }

    final class CleanupGate {
        private let scope: String
        private let owner: UUID
        private let registry: Registry

        fileprivate init(scope: String, owner: UUID, registry: Registry) {
            self.scope = scope; self.owner = owner; self.registry = registry
        }

        fileprivate func finish() { registry.releaseCleanup(scope: scope, owner: owner) }
        deinit { finish() }
    }

    fileprivate final class Registry: @unchecked Sendable {
        private struct Entry {
            var mutationOwner: UUID? = nil
            var stagingAttempt: UUID? = nil
            var readers = Set<UUID>()
            var cleanupOwner: UUID? = nil
            var isEmpty: Bool { mutationOwner == nil && readers.isEmpty && cleanupOwner == nil }
        }

        private let lock = NSLock()
        private var entries: [String: Entry] = [:]

        func acquireMutation(scope: ContentStorageBookkeepingScope.Captured) throws -> Mutation {
            lock.lock()
            defer { lock.unlock() }
            var entry = entries[scope.path] ?? Entry()
            guard entry.mutationOwner == nil else {
                throw ContentError.invalid("コンテンツの取り込み処理が進行中です。完了後にもう一度お試しください。")
            }
            guard entry.cleanupOwner == nil else { throw busy() }
            let owner = UUID()
            entry.mutationOwner = owner
            entries[scope.path] = entry
            return Mutation(scope: scope, owner: owner, registry: self)
        }

        func acquireReader(scope: ContentStorageBookkeepingScope.Captured) throws -> ReaderAdmission {
            lock.lock()
            defer { lock.unlock() }
            var entry = entries[scope.path] ?? Entry()
            guard entry.cleanupOwner == nil else { throw busy() }
            let owner = UUID()
            entry.readers.insert(owner)
            entries[scope.path] = entry
            return ReaderAdmission(scope: scope, owner: owner, registry: self)
        }

        func acquireCleanup(scope: String) throws -> CleanupGate {
            lock.lock()
            defer { lock.unlock() }
            var entry = entries[scope] ?? Entry()
            guard entry.mutationOwner == nil, entry.readers.isEmpty, entry.cleanupOwner == nil else { throw busy() }
            let owner = UUID()
            entry.cleanupOwner = owner
            entries[scope] = entry
            return CleanupGate(scope: scope, owner: owner, registry: self)
        }

        func acquireLease(in scope: ContentStorageBookkeepingScope.Captured, owner: UUID,
                          reader: Bool, generation: UUID) throws -> ContentSnapshotLease {
            lock.lock()
            defer { lock.unlock() }
            guard let entry = entries[scope.path], entry.cleanupOwner == nil,
                  (reader ? entry.readers.contains(owner) : entry.mutationOwner == owner) else {
                throw ContentError.invalid("保存記事版の参照保持を公開できません。")
            }
            // Fixed lock order: coordinator -> lease ledger. Ledger release never
            // enters the coordinator, and no filesystem I/O occurs under a lock.
            return ContentSnapshotLease.acquire(capturedScope: scope, generation: generation)
        }

        func register(_ id: UUID, in scope: String, owner: UUID) throws {
            lock.lock()
            defer { lock.unlock() }
            guard var entry = entries[scope], entry.mutationOwner == owner, entry.stagingAttempt == nil else {
                throw ContentError.invalid("取り込み作業領域の登録状態を確認できません。")
            }
            entry.stagingAttempt = id
            entries[scope] = entry
        }

        func releaseMutation(scope: String, owner: UUID) {
            lock.lock()
            defer { lock.unlock() }
            guard var entry = entries[scope], entry.mutationOwner == owner else { return }
            entry.mutationOwner = nil; entry.stagingAttempt = nil
            store(entry, in: scope)
        }

        func releaseReader(scope: String, owner: UUID) {
            lock.lock()
            defer { lock.unlock() }
            guard var entry = entries[scope] else { return }
            entry.readers.remove(owner)
            store(entry, in: scope)
        }

        func releaseCleanup(scope: String, owner: UUID) {
            lock.lock()
            defer { lock.unlock() }
            guard var entry = entries[scope], entry.cleanupOwner == owner else { return }
            entry.cleanupOwner = nil
            store(entry, in: scope)
        }

        private func store(_ entry: Entry, in scope: String) {
            if entry.isEmpty { entries.removeValue(forKey: scope) }
            else { entries[scope] = entry }
        }

        private func busy() -> ContentError {
            ContentError.invalid("コンテンツの保存処理が進行中です。完了後にもう一度お試しください。")
        }

        func stagingAttempts(in scope: String) -> Set<UUID> {
            lock.lock()
            defer { lock.unlock() }
            return Set(entries[scope]?.stagingAttempt.map { [$0] } ?? [])
        }
    }

    private static let registry = Registry()

    /// Nonblocking. The registry lock is never held across the caller's I/O.
    static func withMutation<Value>(at root: URL, _ body: (Mutation) throws -> Value) throws -> Value {
        let mutation = try registry.acquireMutation(scope: canonicalScope(root))
        defer { mutation.finish() }
        return try body(mutation)
    }

    static func withReaderAdmission<Value>(at root: URL, _ body: (ReaderAdmission) throws -> Value) throws -> Value {
        try withReaderAdmission(in: canonicalScope(root), body)
    }

    static func withReaderAdmission<Value>(in scope: ContentStorageBookkeepingScope.Captured,
                                           _ body: (ReaderAdmission) throws -> Value) throws -> Value {
        let admission = try registry.acquireReader(scope: scope)
        defer { admission.finish() }
        return try body(admission)
    }

    /// Bookkeeping gate only. Live leases, pointer/staging/identity checks and
    /// source readers remain separate obligations before any future removal.
    static func withCleanupGate<Value>(at root: URL, _ body: (CleanupGate) throws -> Value) throws -> Value {
        let gate = try registry.acquireCleanup(scope: canonicalScope(root).path)
        defer { gate.finish() }
        return try body(gate)
    }

    /// An instantaneous set, not a future maintenance authorization.
    static func activeStagingAttemptIDs(at root: URL) throws -> Set<UUID> {
        registry.stagingAttempts(in: try canonicalScope(root).path)
    }

    private static func canonicalScope(_ root: URL) throws -> ContentStorageBookkeepingScope.Captured {
        guard let scope = ContentStorageBookkeepingScope.capture(for: root) else {
            throw ContentError.invalid("保存先のフォルダ参照が無効です。")
        }
        return scope
    }
}
