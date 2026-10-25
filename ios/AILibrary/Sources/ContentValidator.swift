import CryptoKit
import Foundation

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
        let manifest = try JSONDecoder().decode(ContentManifest.self, from: Data(contentsOf: manifestURL))
        let documentPaths = manifest.articles.compactMap(\.document_path)
        guard manifest.schema_version == 2, !manifest.revision.isEmpty,
              !manifest.articles.isEmpty, manifest.articles.count <= 2000,
              Set(manifest.articles.map(\.id)).count == manifest.articles.count,
              documentPaths.count == manifest.articles.count, Set(documentPaths).count == manifest.articles.count,
              Set(manifest.audio.map(\.id)).count == manifest.audio.count else {
            throw ContentError.invalid("形式・版・記事IDを確認してください。")
        }
        guard !manifest.files.keys.contains("manifest.json"), Set(manifest.files.keys).union(["manifest.json"]) == found else {
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
}
