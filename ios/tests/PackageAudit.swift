import Foundation

/// Runs the app's real content validator without launching a Simulator or changing storage.
@main enum PackageAudit {
    static func main() {
        do { try audit() }
        catch {
            FileHandle.standardError.write(Data(("Package audit failed: " + error.localizedDescription + "\n").utf8))
            exit(1)
        }
    }

    private static func audit() throws {
        guard (2...3).contains(CommandLine.arguments.count) else {
            throw ContentError.invalid("Usage: package-audit <Content directory> [expected article count]")
        }
        let root = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
        let started = Date()
        let snapshot = try ContentValidator.validate(root: root)
        if CommandLine.arguments.count == 3 {
            guard let count = Int(CommandLine.arguments[2]), count > 0,
                  snapshot.manifest.articles.count == count else {
                throw ContentError.invalid("Expected article count does not match the validated package")
            }
        }
        // Exercise the same document-loading entry point used by the native reader.
        var blocks = 0
        for article in snapshot.manifest.articles {
            blocks += try snapshot.document(for: article).blocks.count
        }
        var bytes: Int64 = 0
        for file in ["manifest.json"] + Array(snapshot.manifest.files.keys) {
            let values = try snapshot.readAccessRoot.appendingPathComponent(file).resourceValues(forKeys: [.fileSizeKey])
            bytes += Int64(values.fileSize ?? 0)
        }
        let result: [String: Any] = [
            "schema_version": 1, "status": "passed", "validator": "app-ContentValidator",
            "revision": snapshot.manifest.revision, "articles": snapshot.manifest.articles.count,
            "audio": snapshot.manifest.audio.count,
            "PNG_files": snapshot.manifest.files.keys.filter { $0.hasSuffix(".png") }.count,
            "verified_files_excluding_manifest": snapshot.manifest.files.count,
            "files_including_manifest": snapshot.manifest.files.count + 1,
            "bytes_including_manifest": bytes, "top_level_blocks": blocks,
            "validation_and_document_load_seconds": Date().timeIntervalSince(started)
        ]
        let data = try JSONSerialization.data(withJSONObject: result, options: [.prettyPrinted, .sortedKeys])
        print(String(decoding: data, as: UTF8.self))
    }
}
