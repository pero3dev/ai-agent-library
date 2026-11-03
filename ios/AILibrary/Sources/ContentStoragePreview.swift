import Foundation
import Darwin

/// Metadata observed during one bounded read, never removal or validation authority.
struct ContentStoragePreview: Equatable, Sendable {
    enum RootState: String, Sendable { case absent, present, unavailable }
    enum PointerState: String, Sendable { case absent, observed, invalid, unreadable, changed }
    enum Issue: String, Hashable, Sendable {
        case unavailable, unknownEntry, entryLimit, depthLimit, generationLimit
        case arithmeticLimit, pointerUnavailable, changed, referenceNotObserved, referenceLimit
    }
    struct Generation: Equatable, Sendable {
        let directory: String
        let id: UUID
        let logicalBytes: Int64
        let isCurrent: Bool
        let isPrevious: Bool
        let advisoryUseCount: Int
    }
    let rootState: RootState
    let pointerState: PointerState
    let currentReference: UUID?
    let previousReference: UUID?
    let observedLogicalBytes: Int64
    let regularFileCount: Int
    let observedEntryCount: Int
    let generations: [Generation]
    let stagingCount: Int
    let unknownEntryCount: Int
    let unobservedUseCount: Int
    let issues: Set<Issue>

    var isComplete: Bool { issues.isEmpty }
    var currentCount: Int { generations.filter(\.isCurrent).count }
    var previousCount: Int { generations.filter(\.isPrevious).count }
    var usedGenerationCount: Int { generations.filter { $0.advisoryUseCount > 0 }.count }
    var otherGenerationCount: Int {
        generations.filter { !$0.isCurrent && !$0.isPrevious && $0.advisoryUseCount == 0 }.count
    }
}

/// No article/asset bytes are opened. Only current.json has a bounded content read.
/// Directory handles anchor every descendant lookup; symlinks inside this tree
/// and the final storage-root component are never followed. A system alias in
/// the configured parent (for example /var) is resolved before handle admission.
enum ContentStoragePreviewScanner {
    struct Limits: Sendable {
        var entries = 8_192
        var depth = 12
        var generations = 256
        var pointerBytes = 4_096
    }

    static func adding(_ value: Int64, to total: Int64) -> Int64? {
        guard value >= 0, total >= 0 else { return nil }
        let (sum, overflow) = total.addingReportingOverflow(value)
        return overflow ? nil : sum
    }

    static func scan(root: URL, advisoryUses: [UUID: Int], limits: Limits = Limits(),
                     checkCancellation: @escaping () throws -> Void = { try Task.checkCancellation() },
                     beforeFinalObservation: (() throws -> Void)? = nil) throws -> ContentStoragePreview {
        let reader = Reader(limits: limits, checkCancellation: checkCancellation)
        return try reader.scan(root: root, advisoryUses: advisoryUses,
                               beforeFinalObservation: beforeFinalObservation)
    }

    private struct Identity: Equatable {
        let device: Int32
        let inode: UInt64
        let size: Int64
        let modifiedSeconds: Int
        let modifiedNanos: Int
        let changedSeconds: Int
        let changedNanos: Int
        init(_ value: stat) {
            device = value.st_dev; inode = value.st_ino; size = value.st_size
            modifiedSeconds = value.st_mtimespec.tv_sec; modifiedNanos = value.st_mtimespec.tv_nsec
            changedSeconds = value.st_ctimespec.tv_sec; changedNanos = value.st_ctimespec.tv_nsec
        }
    }
    private struct Pointer: Equatable {
        let state: ContentStoragePreview.PointerState
        let bytes: Data?
        let identity: Identity?
        let current: String?
        let previous: String?
    }
    private struct ObservedGeneration {
        let directory: String
        let id: UUID
        var bytes: Int64 = 0
    }
    private final class Reader {
        let limits: Limits
        let checkCancellation: () throws -> Void
        var issues = Set<ContentStoragePreview.Issue>()
        var total: Int64 = 0
        var files = 0
        var entries = 0
        var staging = 0
        var unknown = 0
        var generations: [ObservedGeneration] = []
        var stopped = false

        init(limits: Limits, checkCancellation: @escaping () throws -> Void) {
            self.limits = limits; self.checkCancellation = checkCancellation
        }

        func scan(root: URL, advisoryUses: [UUID: Int], beforeFinalObservation: (() throws -> Void)?) throws -> ContentStoragePreview {
            try checkCancellation()
            let path = root.path
            guard root.isFileURL, root.host == nil || root.host == "" || root.host == "localhost",
                  root.user == nil, root.password == nil, root.port == nil, root.query == nil, root.fragment == nil,
                  path.hasPrefix("/"), path.utf8.count <= 4_096, path != "/",
                  !path.split(separator: "/").contains(where: { $0 == "." || $0 == ".." }),
                  limits.entries > 0, limits.entries <= 8_192, limits.depth >= 0, limits.depth <= 12,
                  limits.generations > 0, limits.generations <= 256,
                  limits.pointerBytes > 0, limits.pointerBytes <= 4_096 else {
                issues.insert(.unavailable)
                return result(.unavailable, Pointer(state: .unreadable, bytes: nil, identity: nil, current: nil, previous: nil), advisoryUses)
            }
            // Resolve the parent only. Opening root itself always uses O_NOFOLLOW.
            try checkCancellation()
            // Foundation may shorten /private/tmp back to the /tmp symlink even
            // after resolvingSymlinksInPath. Admit the actual POSIX parent path;
            // never run realpath on the final root component itself.
            let parent = root.deletingLastPathComponent().withUnsafeFileSystemRepresentation { path -> String? in
                guard let path, let resolved = Darwin.realpath(path, nil) else { return nil }
                defer { free(resolved) }
                return String(validatingUTF8: resolved)
            }
            guard let parent, parent.utf8.count <= 4_096 else {
                issues.insert(.unavailable)
                return result(.unavailable, emptyPointer(.unreadable), advisoryUses)
            }
            let parts = parent.split(separator: "/").map(String.init)
            guard parts.count <= 64 else {
                issues.insert(.unavailable)
                return result(.unavailable, emptyPointer(.unreadable), advisoryUses)
            }
            try checkCancellation()
            var parentFD = Darwin.open("/", O_RDONLY | O_DIRECTORY | O_CLOEXEC | O_NOFOLLOW)
            guard parentFD >= 0 else { issues.insert(.unavailable); return result(.unavailable, emptyPointer(.unreadable), advisoryUses) }
            defer { Darwin.close(parentFD) }
            for part in parts {
                try checkCancellation()
                let next = openat(parentFD, part, O_RDONLY | O_DIRECTORY | O_CLOEXEC | O_NOFOLLOW)
                guard next >= 0 else { issues.insert(.unavailable); return result(.unavailable, emptyPointer(.unreadable), advisoryUses) }
                Darwin.close(parentFD); parentFD = next
            }
            let name = root.lastPathComponent
            try checkCancellation()
            var initial = stat()
            guard fstatat(parentFD, name, &initial, AT_SYMLINK_NOFOLLOW) == 0 else {
                if errno == ENOENT { return result(.absent, emptyPointer(.absent), advisoryUses) }
                issues.insert(.unavailable); return result(.unavailable, emptyPointer(.unreadable), advisoryUses)
            }
            guard initial.st_mode & S_IFMT == S_IFDIR else {
                issues.insert(.unavailable); return result(.unavailable, emptyPointer(.unreadable), advisoryUses)
            }
            try checkCancellation()
            let fd = openat(parentFD, name, O_RDONLY | O_DIRECTORY | O_CLOEXEC | O_NOFOLLOW)
            guard fd >= 0 else { issues.insert(.unavailable); return result(.unavailable, emptyPointer(.unreadable), advisoryUses) }
            defer { Darwin.close(fd) }
            try checkCancellation()
            var opened = stat()
            guard fstat(fd, &opened) == 0, Identity(opened) == Identity(initial) else {
                issues.insert(.changed); return result(.unavailable, emptyPointer(.changed), advisoryUses)
            }
            let before = try pointer(in: fd)
            try walk(fd, depth: 0, scope: .root, generation: nil)
            try checkCancellation()
            try beforeFinalObservation?() // Internal race seam; production callers leave this nil.
            let after = try pointer(in: fd)
            try checkCancellation()
            var final = stat()
            if fstatat(parentFD, name, &final, AT_SYMLINK_NOFOLLOW) != 0 || Identity(final) != Identity(initial) {
                issues.insert(.changed)
            }
            let selected: Pointer
            if before != after || issues.contains(.changed) {
                issues.insert(.changed); selected = emptyPointer(.changed)
            } else { selected = before }
            if selected.state != .observed { issues.insert(.pointerUnavailable) }
            if selected.state == .changed { issues.insert(.changed) }
            return result(.present, selected, advisoryUses)
        }

        enum Scope: Equatable { case root, versions, contents }

        func walk(_ fd: Int32, depth: Int, scope: Scope, generation: Int?) throws {
            try checkCancellation()
            var initial = stat()
            guard fstat(fd, &initial) == 0 else { issues.insert(.unavailable); return }
            try checkCancellation()
            let duplicate = dup(fd)
            guard duplicate >= 0 else { issues.insert(.unavailable); return }
            do { try checkCancellation() } catch { Darwin.close(duplicate); throw error }
            guard let directory = fdopendir(duplicate) else { Darwin.close(duplicate); issues.insert(.unavailable); return }
            defer { closedir(directory) }
            while !stopped {
                try checkCancellation()
                errno = 0
                guard let entry = readdir(directory) else {
                    if errno != 0 { issues.insert(.unavailable) }
                    break
                }
                let name = withUnsafePointer(to: entry.pointee.d_name) { value in
                    value.withMemoryRebound(to: CChar.self, capacity: Int(NAME_MAX) + 1) { String(validatingUTF8: $0) }
                }
                if name == "." || name == ".." { continue }
                guard entries < limits.entries else { issues.insert(.entryLimit); stopped = true; break }
                entries += 1
                guard let name else { unknown += 1; issues.insert(.unknownEntry); continue }
                try checkCancellation()
                var information = stat()
                guard fstatat(fd, name, &information, AT_SYMLINK_NOFOLLOW) == 0 else { issues.insert(.unavailable); continue }
                let kind = information.st_mode & S_IFMT
                if kind == S_IFREG {
                    if scope != .contents && !(scope == .root && name == "current.json") { unknown += 1; issues.insert(.unknownEntry) }
                    guard let sum = adding(information.st_size, to: total) else { issues.insert(.arithmeticLimit); stopped = true; break }
                    total = sum; files += 1
                    if let generation {
                        guard let sum = adding(information.st_size, to: generations[generation].bytes) else { issues.insert(.arithmeticLimit); stopped = true; break }
                        generations[generation].bytes = sum
                    }
                } else if kind == S_IFDIR {
                    var childScope: Scope = .contents
                    var childGeneration = generation
                    if scope == .root && name == "versions" { childScope = .versions }
                    else if scope == .versions, let id = UUID(uuidString: name) {
                        guard generations.count < limits.generations else { issues.insert(.generationLimit); stopped = true; break }
                        if generations.contains(where: { $0.id == id }) { issues.insert(.unknownEntry) }
                        childGeneration = generations.count
                        generations.append(ObservedGeneration(directory: name, id: id))
                    } else if scope == .versions, name.hasPrefix(".staging-"), UUID(uuidString: String(name.dropFirst(9))) != nil {
                        staging += 1
                    } else if scope != .contents { unknown += 1; issues.insert(.unknownEntry) }
                    guard depth < limits.depth else { issues.insert(.depthLimit); continue }
                    try checkCancellation()
                    let child = openat(fd, name, O_RDONLY | O_DIRECTORY | O_CLOEXEC | O_NOFOLLOW)
                    guard child >= 0 else { issues.insert(.unavailable); continue }
                    defer { Darwin.close(child) }
                    try checkCancellation()
                    var actual = stat()
                    guard fstat(child, &actual) == 0, Identity(actual) == Identity(information) else { issues.insert(.changed); continue }
                    try walk(child, depth: depth + 1, scope: childScope, generation: childGeneration)
                } else { unknown += 1; issues.insert(.unknownEntry) }
            }
            try checkCancellation()
            var final = stat()
            if fstat(fd, &final) != 0 || Identity(final) != Identity(initial) { issues.insert(.changed) }
        }

        func emptyPointer(_ state: ContentStoragePreview.PointerState) -> Pointer {
            Pointer(state: state, bytes: nil, identity: nil, current: nil, previous: nil)
        }

        func pointer(in root: Int32) throws -> Pointer {
            try checkCancellation()
            var information = stat()
            guard fstatat(root, "current.json", &information, AT_SYMLINK_NOFOLLOW) == 0 else {
                return emptyPointer(errno == ENOENT ? .absent : .unreadable)
            }
            guard information.st_mode & S_IFMT == S_IFREG, information.st_size >= 0,
                  information.st_size <= Int64(limits.pointerBytes) else { return emptyPointer(.invalid) }
            try checkCancellation()
            let fd = openat(root, "current.json", O_RDONLY | O_CLOEXEC | O_NOFOLLOW | O_NONBLOCK)
            guard fd >= 0 else { return emptyPointer(.unreadable) }
            defer { Darwin.close(fd) }
            try checkCancellation()
            var actual = stat()
            guard fstat(fd, &actual) == 0, Identity(actual) == Identity(information) else { return emptyPointer(.changed) }
            var bytes = Data()
            var buffer = [UInt8](repeating: 0, count: limits.pointerBytes + 1)
            while bytes.count <= limits.pointerBytes {
                try checkCancellation()
                let count = buffer.withUnsafeMutableBytes {
                    Darwin.read(fd, $0.baseAddress, limits.pointerBytes + 1 - bytes.count)
                }
                guard count >= 0 else { return emptyPointer(.unreadable) }
                if count == 0 { break }
                bytes.append(contentsOf: buffer.prefix(count))
            }
            try checkCancellation()
            var final = stat()
            guard fstat(fd, &final) == 0, Identity(actual) == Identity(final), bytes.count <= limits.pointerBytes else { return emptyPointer(.changed) }
            guard let value = try? JSONSerialization.jsonObject(with: bytes) as? [String: Any],
                  Set(value.keys).isSubset(of: ["directory", "previousDirectory"]),
                  let current = value["directory"] as? String, let currentID = UUID(uuidString: current) else {
                return Pointer(state: .invalid, bytes: bytes, identity: Identity(actual), current: nil, previous: nil)
            }
            var previous: String?
            if let supplied = value["previousDirectory"] {
                guard let text = supplied as? String, let id = UUID(uuidString: text), id != currentID else {
                    return Pointer(state: .invalid, bytes: bytes, identity: Identity(actual), current: nil, previous: nil)
                }
                previous = text
            }
            return Pointer(state: .observed, bytes: bytes, identity: Identity(actual), current: current, previous: previous)
        }

        func result(_ root: ContentStoragePreview.RootState, _ pointer: Pointer, _ advisoryUses: [UUID: Int]) -> ContentStoragePreview {
            let observed = Set(generations.map(\.id))
            var unknownUses = 0
            for (index, use) in advisoryUses.enumerated() {
                guard index < limits.generations else { issues.insert(.referenceLimit); break }
                if use.value > 0 && !observed.contains(use.key) { unknownUses += 1 }
            }
            if unknownUses > 0 { issues.insert(.referenceNotObserved) }
            let values = generations.map { generation in
                ContentStoragePreview.Generation(directory: generation.directory, id: generation.id, logicalBytes: generation.bytes,
                    isCurrent: pointer.state == .observed && pointer.current == generation.directory,
                    isPrevious: pointer.state == .observed && pointer.previous == generation.directory,
                    advisoryUseCount: max(0, advisoryUses[generation.id] ?? 0))
            }.sorted { $0.directory < $1.directory }
            if pointer.state == .observed && (!values.contains(where: \.isCurrent) ||
                (pointer.previous != nil && !values.contains(where: \.isPrevious))) { issues.insert(.referenceNotObserved) }
            return ContentStoragePreview(rootState: root, pointerState: pointer.state,
                currentReference: pointer.current.flatMap(UUID.init(uuidString:)),
                previousReference: pointer.previous.flatMap(UUID.init(uuidString:)), observedLogicalBytes: total,
                regularFileCount: files, observedEntryCount: entries, generations: values, stagingCount: staging,
                unknownEntryCount: unknown, unobservedUseCount: unknownUses, issues: issues)
        }
    }
}
