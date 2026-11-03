import Foundation
import CryptoKit

/// Metadata-only output for an explicit copy action. This is neither a reading
/// backup nor evidence of the package's publisher or the authenticity of its data.
enum LibraryDiagnostics {
    static let maximumReportBytes = 512
    private static let maximumManifestBytes = 8 * 1024 * 1024
    private static let unknown = "unknown"

    struct Report: Equatable, Sendable {
        let appVersion: String
        let buildNumber: String
        let manifestState: String
        let manifestSchema: String
        let articleCount: String
        let listedFileCount: String
        let manifestSemanticSHA256: String

        fileprivate init(appVersion: String, buildNumber: String, manifestState: String,
                         manifestSchema: String, articleCount: String, listedFileCount: String,
                         manifestSemanticSHA256: String) {
            self.appVersion = appVersion; self.buildNumber = buildNumber
            self.manifestState = manifestState; self.manifestSchema = manifestSchema
            self.articleCount = articleCount; self.listedFileCount = listedFileCount
            self.manifestSemanticSHA256 = manifestSemanticSHA256
        }

        var text: String {
            ["diagnostic_format: 1", "app_version: \(appVersion)", "app_build: \(buildNumber)",
             "manifest_state: \(manifestState)", "manifest_schema: \(manifestSchema)",
             "article_count: \(articleCount)", "listed_file_count: \(listedFileCount)",
             "manifest_semantic_sha256: \(manifestSemanticSHA256)"].joined(separator: "\n") + "\n"
        }
    }

    static func versionLabel(appVersion: String?, buildNumber: String?) -> String {
        let version = safeVersion(appVersion), build = safeBuild(buildNumber)
        let versionText = version == unknown ? "不明" : version
        let buildText = build == unknown ? "不明" : build
        return "アプリ \(versionText)（ビルド \(buildText)）"
    }

    /// The caller supplies an already validated manifest. The checks below bound
    /// diagnostics work; they do not replace the content consumer's validation.
    static func report(appVersion: String?, buildNumber: String?, manifest: ContentManifest?) -> Report {
        let version = safeVersion(appVersion), build = safeBuild(buildNumber)
        guard let manifest, canEncodeWithinBudget(manifest) else {
            return Report(appVersion: version, buildNumber: build, manifestState: "unavailable",
                          manifestSchema: unknown, articleCount: unknown, listedFileCount: unknown,
                          manifestSemanticSHA256: unknown)
        }
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
        guard let bytes = try? encoder.encode(manifest), bytes.count <= maximumManifestBytes else {
            return Report(appVersion: version, buildNumber: build, manifestState: "unavailable",
                          manifestSchema: unknown, articleCount: unknown, listedFileCount: unknown,
                          manifestSemanticSHA256: unknown)
        }
        let alphabet = Array("0123456789abcdef".utf8)
        let digest = SHA256.hash(data: bytes).flatMap { [alphabet[Int($0 >> 4)], alphabet[Int($0 & 15)]] }
        return Report(appVersion: version, buildNumber: build, manifestState: "present",
                      manifestSchema: "2", articleCount: String(manifest.articles.count),
                      listedFileCount: String(manifest.files.count),
                      manifestSemanticSHA256: String(decoding: digest, as: UTF8.self))
    }

    private static func safeVersion(_ value: String?) -> String {
        guard let value else { return unknown }
        let bytes = Array(value.utf8.prefix(12))
        guard !bytes.isEmpty, bytes.count <= 11,
              bytes.allSatisfy({ (48...57).contains($0) || $0 == 46 }) else { return unknown }
        let parts = value.split(separator: ".", omittingEmptySubsequences: false)
        guard (2...3).contains(parts.count), parts.allSatisfy({ (1...3).contains($0.count) }) else { return unknown }
        return value
    }

    private static func safeBuild(_ value: String?) -> String {
        guard let value else { return unknown }
        let bytes = Array(value.utf8.prefix(9))
        guard !bytes.isEmpty, bytes.count <= 8, bytes.allSatisfy({ (48...57).contains($0) }) else { return unknown }
        return value
    }

    /// Count conservative JSON string/structure costs before allocating encoded
    /// data. Model additions must also update this fixed-depth metadata budget.
    private struct EncodingBudget {
        var remaining = LibraryDiagnostics.maximumManifestBytes
        mutating func take(_ bytes: Int) -> Bool {
            guard bytes >= 0, bytes <= remaining else { return false }
            remaining -= bytes
            return true
        }
        mutating func string(_ text: String?) -> Bool {
            guard let text else { return true }
            guard take(2) else { return false }
            for scalar in text.unicodeScalars {
                let value = scalar.value
                let cost: Int
                if value < 32 || value == 127 || value == 60 || value == 62 || value == 38 { cost = 6 }
                else if value == 34 || value == 47 || value == 92 { cost = 2 }
                else if value < 128 { cost = 1 }
                else { cost = value <= 0xffff ? 6 : 12 }
                guard take(cost) else { return false }
            }
            return true
        }
    }

    private static func canEncodeWithinBudget(_ manifest: ContentManifest) -> Bool {
        guard manifest.schema_version == 2, !manifest.revision.isEmpty,
              (1...2000).contains(manifest.articles.count), (1...4096).contains(manifest.files.count),
              manifest.audio.count <= 2000 else { return false }
        var budget = EncodingBudget()
        guard budget.take(128), budget.string(manifest.revision) else { return false }
        for article in manifest.articles {
            guard article.headings.count <= 4096, budget.take(512) else { return false }
            for text in [article.id, article.title, article.summary, article.category, article.level,
                         article.last_updated, article.source_path, article.source_sha256, article.search_text] {
                guard budget.string(text) else { return false }
            }
            for text in [article.document_path, article.html_path, article.audio_id] {
                guard budget.string(text) else { return false }
            }
            for heading in article.headings {
                guard budget.take(128), budget.string(heading.id), budget.string(heading.title) else { return false }
            }
        }
        for episode in manifest.audio {
            guard episode.duration_seconds.isFinite, episode.chapters.count <= 4096,
                  budget.take(512) else { return false }
            for text in [episode.id, episode.title, episode.article_id, episode.url, episode.sha256,
                         episode.credit, episode.license_url, episode.source_digest] {
                guard budget.string(text) else { return false }
            }
            for chapter in episode.chapters {
                guard chapter.start_seconds.isFinite, budget.take(128),
                      budget.string(chapter.id), budget.string(chapter.title) else { return false }
            }
        }
        for (file, digest) in manifest.files {
            guard budget.take(4), budget.string(file), budget.string(digest) else { return false }
        }
        return true
    }
}
