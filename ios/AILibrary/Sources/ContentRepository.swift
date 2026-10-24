import Foundation

/// A complete version is validated in staging before one atomic pointer write activates it.
final class ContentRepository {
    private struct Pointer: Codable { let directory: String }
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
        let pointerURL = storageRoot.appendingPathComponent("current.json")
        if let data = try? Data(contentsOf: pointerURL), let pointer = try? JSONDecoder().decode(Pointer.self, from: data),
           UUID(uuidString: pointer.directory) != nil,
           let current = try? validate(root: storageRoot.appendingPathComponent("versions").appendingPathComponent(pointer.directory)) {
            return current
        }
        return try validate(root: bundledRoot)
    }

    func install(from source: URL) throws -> ContentSnapshot {
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
        let pointer = try JSONEncoder().encode(Pointer(directory: id))
        try writePointer(pointer, storageRoot.appendingPathComponent("current.json"))
        activated = true
        // Keep earlier versions for this prototype; an open reader may still reference one.
        return snapshot
    }

    private func validate(root: URL) throws -> ContentSnapshot {
        let snapshot = try ContentValidator.validate(root: root)
        guard allowsTestFixtures || !snapshot.manifest.containsTestFixtures else {
            throw ContentError.invalid("本文表示テストの記事は通常のライブラリへ取り込めません。")
        }
        return snapshot
    }
}
