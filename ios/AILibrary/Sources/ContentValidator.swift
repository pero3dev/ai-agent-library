import CryptoKit
import Foundation
#if DEBUG
import Darwin
#endif

enum ContentError: LocalizedError {
    case invalid(String)

    var errorDescription: String? {
        switch self {
        case .invalid(let detail): return "コンテンツを読み込めません。\(detail)"
        }
    }
}

enum ContentValidator {
    static let maximumBytes: Int64 = 256 * 1024 * 1024
    static let maximumFiles = 4096

    static func isSafeRelativePath(_ path: String) -> Bool {
        guard !path.isEmpty, !path.hasPrefix("/"), !path.contains("\\"),
              !path.contains(":"), !path.contains("%"),
              !path.unicodeScalars.contains(where: { CharacterSet.controlCharacters.contains($0) }) else { return false }
        return path.split(separator: "/", omittingEmptySubsequences: false)
            .allSatisfy { !$0.isEmpty && $0 != "." && $0 != ".." }
    }

    static func isDigest(_ value: String) -> Bool {
        value.count == 64 && value.allSatisfy { ("0"..."9").contains(String($0)) || ("a"..."f").contains(String($0)) }
    }

    static func sha256(at url: URL) throws -> String {
        let handle = try FileHandle(forReadingFrom: url)
        defer { try? handle.close() }
        var hash = SHA256()
        while let chunk = try handle.read(upToCount: 1024 * 1024), !chunk.isEmpty { hash.update(data: chunk) }
        return hash.finalize().map { String(format: "%02x", $0) }.joined()
    }

    static func validate(root: URL, fileManager: FileManager = .default) throws -> ContentSnapshot {
        let rootValues = try root.resourceValues(forKeys: [.isDirectoryKey, .isSymbolicLinkKey])
        guard root.isFileURL, rootValues.isDirectory == true, rootValues.isSymbolicLink != true else {
            throw ContentError.invalid("通常のフォルダを選択してください。")
        }
        // Enumerate before opening manifest.json, including hidden entries, and never follow links.
        var found = Set<String>()
        var entryCount = 0
        var total: Int64 = 0
        var enumerationError: Error?
        guard let enumerator = fileManager.enumerator(at: root, includingPropertiesForKeys: [.isRegularFileKey, .isDirectoryKey, .isSymbolicLinkKey, .fileSizeKey],
                                                      options: [], errorHandler: { _, error in enumerationError = error; return false }) else {
            throw ContentError.invalid("フォルダを検査できません。")
        }
        let base = root.standardizedFileURL.path + "/"
        for case let url as URL in enumerator {
            entryCount += 1
            guard entryCount <= maximumFiles * 2 else { throw ContentError.invalid("フォルダ内の項目数が多すぎます。") }
            let values = try url.resourceValues(forKeys: [.isRegularFileKey, .isDirectoryKey, .isSymbolicLinkKey, .fileSizeKey])
            guard values.isSymbolicLink != true else { throw ContentError.invalid("シンボリックリンクは使用できません。") }
            let absolute = url.standardizedFileURL.path
            guard absolute.hasPrefix(base) else { throw ContentError.invalid("フォルダの外を参照しています。") }
            let path = String(absolute.dropFirst(base.count))
            guard isSafeRelativePath(path) else { throw ContentError.invalid("無効なファイル名があります。") }
            if values.isDirectory == true { continue }
            guard values.isRegularFile == true else { throw ContentError.invalid("通常のファイル以外が含まれています。") }
            total += Int64(values.fileSize ?? 0)
            found.insert(path)
            guard found.count <= maximumFiles, total <= maximumBytes else { throw ContentError.invalid("試作版の容量上限を超えています。") }
        }
        if let error = enumerationError { throw error }
        guard found.contains("manifest.json") else { throw ContentError.invalid("manifest.json がありません。") }
        let manifestURL = root.appendingPathComponent("manifest.json")
        guard (try manifestURL.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0) <= 8 * 1024 * 1024 else {
            throw ContentError.invalid("manifest.json が大きすぎます。")
        }
        let manifestData = try Data(contentsOf: manifestURL)
        let manifest = try JSONDecoder().decode(ContentManifest.self, from: manifestData)
        let documentPaths = manifest.articles.compactMap(\.document_path)
        guard manifest.schema_version == 2, !manifest.revision.isEmpty,
              !manifest.articles.isEmpty, manifest.articles.count <= 2000,
              Set(manifest.articles.map(\.id)).count == manifest.articles.count,
              documentPaths.count == manifest.articles.count, Set(documentPaths).count == manifest.articles.count,
              Set(manifest.audio.map(\.id)).count == manifest.audio.count else {
            throw ContentError.invalid("形式・版・記事IDを確認してください。")
        }
        guard !manifest.files.keys.contains("manifest.json"), Set(manifest.files.keys).union(["manifest.json"]) == found else {
#if DEBUG
            recordFileSetFailure(root: root, manifestData: manifestData,
                                 manifestFiles: Set(manifest.files.keys), found: found)
#endif
            throw ContentError.invalid("ファイル一覧と実際の内容が一致しません。")
        }
        for (path, digest) in manifest.files {
            guard isSafeRelativePath(path), ["json", "png", "txt"].contains((path as NSString).pathExtension.lowercased()),
                  isDigest(digest), try sha256(at: root.appendingPathComponent(path)) == digest else {
                throw ContentError.invalid("ファイルのパスまたはSHA-256が一致しません。")
            }
            if (path as NSString).pathExtension.lowercased() == "png" { _ = try NativeDocumentValidator.validatePNG(path: path, digest: digest, root: root) }
        }
        for article in manifest.articles {
            guard !article.id.isEmpty, article.id.utf8.count <= 512, !article.title.isEmpty, isSafeRelativePath(article.source_path),
                  isDigest(article.source_sha256), let documentPath = article.document_path,
                  documentPath.hasPrefix("articles/"), documentPath.hasSuffix(".json"), isSafeRelativePath(documentPath),
                  manifest.files[documentPath] != nil, article.html_path == nil,
                  Set(article.headings.map(\.id)).count == article.headings.count,
                  article.headings.allSatisfy({ !$0.id.isEmpty && (1...6).contains($0.level) }),
                  article.audio_id == nil || manifest.audio.contains(where: { $0.id == article.audio_id && $0.article_id == article.id }) else {
                throw ContentError.invalid("記事の参照先が無効です。")
            }
            _ = try NativeDocumentValidator.load(article: article, manifest: manifest, root: root)
        }
        for episode in manifest.audio {
            guard let url = URL(string: episode.url), url.scheme == "https", url.host != nil,
                  url.user == nil, url.password == nil,
                  manifest.articles.contains(where: { $0.id == episode.article_id }),
                  isDigest(episode.sha256), isDigest(episode.source_digest),
                  episode.duration_seconds.isFinite, episode.duration_seconds > 0,
                  episode.duration_seconds <= AudioTime.maximumDurationSeconds,
                  Set(episode.chapters.map(\.id)).count == episode.chapters.count,
                  episode.chapters.map(\.start_seconds) == episode.chapters.map(\.start_seconds).sorted(),
                  episode.chapters.allSatisfy({ $0.start_seconds.isFinite && $0.start_seconds >= 0 && $0.start_seconds < episode.duration_seconds }) else {
                throw ContentError.invalid("音声の参照先が無効です。")
            }
        }
        return ContentSnapshot(root: root, manifest: manifest)
    }

#if DEBUG
    /// First file-set failure only, in the current UI-test App's own Documents.
    private static func recordFileSetFailure(root: URL, manifestData: Data,
                                             manifestFiles: Set<String>, found: Set<String>) {
        let suitePrefix = "ailibrary-uitest-"
        guard let suite = ProcessInfo.processInfo.environment["AILIBRARY_UI_TEST_SUITE"],
              suite.hasPrefix(suitePrefix), suite.utf8.count > suitePrefix.utf8.count, suite.utf8.count <= 100,
              suite.utf8.allSatisfy({ (48...57).contains($0) || (65...90).contains($0) ||
                  (97...122).contains($0) || $0 == 45 }) else { return }
        let home = URL(fileURLWithPath: NSHomeDirectory(), isDirectory: true)
            .standardizedFileURL.resolvingSymlinksInPath()
        let documents = home.appendingPathComponent("Documents", isDirectory: true)
        guard let declaredDocuments = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first,
              declaredDocuments.standardizedFileURL.resolvingSymlinksInPath().path == documents.path,
              documents.resolvingSymlinksInPath().path == documents.path else { return }
        let homeFD = Darwin.open(home.path, O_RDONLY | O_DIRECTORY | O_NOFOLLOW | O_CLOEXEC)
        guard homeFD >= 0 else { return }
        defer { Darwin.close(homeFD) }
        var homeStat = stat()
        guard Darwin.fstat(homeFD, &homeStat) == 0, homeStat.st_mode & S_IFMT == S_IFDIR,
              homeStat.st_uid == getuid() else { return }
        let documentsFD = Darwin.openat(homeFD, "Documents", O_RDONLY | O_DIRECTORY | O_NOFOLLOW | O_CLOEXEC)
        guard documentsFD >= 0 else { return }
        defer { Darwin.close(documentsFD) }
        var documentsStat = stat(), declaredStat = stat()
        guard Darwin.fstat(documentsFD, &documentsStat) == 0,
              documentsStat.st_mode & S_IFMT == S_IFDIR, documentsStat.st_uid == getuid(),
              Darwin.fstatat(homeFD, "Documents", &declaredStat, AT_SYMLINK_NOFOLLOW) == 0,
              declaredStat.st_mode & S_IFMT == S_IFDIR,
              declaredStat.st_dev == documentsStat.st_dev, declaredStat.st_ino == documentsStat.st_ino else { return }
        func clipped(_ value: String, limit: Int = 256) -> [String: Any] {
            ["value": String(decoding: value.utf8.prefix(limit), as: UTF8.self),
             "utf8Bytes": value.utf8.count, "truncated": value.utf8.count > limit]
        }
        func paths(_ values: Set<String>) -> [String: Any] {
            ["total": values.count, "omitted": max(0, values.count - 8),
             "items": values.sorted().prefix(8).map { clipped($0) }]
        }
        let expected = manifestFiles.union(["manifest.json"])
        let locations = ["bundleURL": Bundle.main.bundleURL.absoluteString,
            "bundleContentURL": Bundle.main.bundleURL.appendingPathComponent("Content", isDirectory: true).absoluteString,
            "bundleResourceContentURL": Bundle.main.resourceURL?.appendingPathComponent("Content", isDirectory: true).absoluteString ?? "",
            "validatedRootURL": root.absoluteString, "homeDirectory": NSHomeDirectory(),
            "documentsURL": documents.absoluteString]
        var payload: [String: Any] = ["schemaVersion": 1, "testSuite": suite,
            "pid": ProcessInfo.processInfo.processIdentifier, "capturedAtUnixSeconds": Date().timeIntervalSince1970,
            "manifestSHA256": SHA256.hash(data: manifestData).map { String(format: "%02x", $0) }.joined(),
            "manifestSelfEntry": manifestFiles.contains("manifest.json"),
            "counts": ["expected": expected.count, "found": found.count, "manifestFiles": manifestFiles.count],
            "locations": locations.mapValues { clipped($0) },
            "missingPaths": paths(expected.subtracting(found)), "unexpectedPaths": paths(found.subtracting(expected)),
            "pathListsOmittedForByteCap": false]
        guard var bytes = try? JSONSerialization.data(withJSONObject: payload, options: [.sortedKeys]) else { return }
        if bytes.count > 8192 {
            payload["locations"] = locations.mapValues { clipped($0, limit: 96) }
            payload["missingPaths"] = ["total": expected.subtracting(found).count,
                "omitted": expected.subtracting(found).count, "items": []] as [String: Any]
            payload["unexpectedPaths"] = ["total": found.subtracting(expected).count,
                "omitted": found.subtracting(expected).count, "items": []] as [String: Any]
            payload["pathListsOmittedForByteCap"] = true
            guard let bounded = try? JSONSerialization.data(withJSONObject: payload, options: [.sortedKeys]),
                  bounded.count <= 8192 else { return }
            bytes = bounded
        }
        // A preexisting file, link or other entry is never opened or overwritten.
        let name = "ailibrary-ui-content-" + suite + ".json"
        let fd = Darwin.openat(documentsFD, name, O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW | O_CLOEXEC, mode_t(0o600))
        guard fd >= 0 else { return }
        defer { Darwin.close(fd) }
        var fileStat = stat()
        guard Darwin.fstat(fd, &fileStat) == 0, fileStat.st_mode & S_IFMT == S_IFREG,
              fileStat.st_uid == getuid(), fileStat.st_nlink == 1 else { return }
        bytes.withUnsafeBytes { buffer in
            guard let address = buffer.baseAddress else { return }
            var offset = 0
            while offset < buffer.count {
                let written = Darwin.write(fd, address.advanced(by: offset), buffer.count - offset)
                guard written > 0 else { return }
                offset += written
            }
        }
    }
#endif
}
