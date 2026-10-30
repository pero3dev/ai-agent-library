import XCTest
@testable import AILibrary

/// Synthetic metadata tests the report, not package validation or reading export.
final class LibraryDiagnosticsTests: XCTestCase {
    private func article(id: String = "a", title: String = "b", headings: [ArticleHeading] = []) -> LibraryArticle {
        LibraryArticle(id: id, title: title, summary: "c", category: "d", level: "e", last_updated: "f",
                       source_path: "g", source_sha256: "h", search_text: "i", headings: headings, audio_id: nil)
    }

    private func manifest(revision: String = "r", schema: Int = 2, article supplied: LibraryArticle? = nil,
                          count: Int = 1, files: [String: String] = ["a": "b"],
                          audio: [AudioEpisode] = []) -> ContentManifest {
        ContentManifest(schema_version: schema, revision: revision,
                        articles: Array(repeating: supplied ?? article(), count: count), audio: audio, files: files)
    }

    private func report(_ manifest: ContentManifest?) -> LibraryDiagnostics.Report {
        LibraryDiagnostics.report(appVersion: "0.2.24", buildNumber: "26", manifest: manifest)
    }

    func testExactAllowlistAndCanonicalManifestDigest() {
        let result = report(manifest())
        // Independently calculated from the 230-byte, sorted-key ASCII JSON fixture.
        XCTAssertEqual(result.manifestSemanticSHA256, "6eece3b9ba7826652b3bf9360a4681eb49fa8cc811a58c2d59467d31edaee229")
        XCTAssertEqual(result.text, """
        diagnostic_format: 1
        app_version: 0.2.24
        app_build: 26
        manifest_state: present
        manifest_schema: 2
        article_count: 1
        listed_file_count: 1
        manifest_semantic_sha256: 6eece3b9ba7826652b3bf9360a4681eb49fa8cc811a58c2d59467d31edaee229
        """ + "\n")
        XCTAssertEqual(LibraryDiagnostics.versionLabel(appVersion: "0.2.24", buildNumber: "26"),
                       "アプリ 0.2.24（ビルド 26）")
        XCTAssertLessThanOrEqual(result.text.utf8.count, LibraryDiagnostics.maximumReportBytes)
    }

    func testCanonicalDigestIgnoresDictionaryInsertionOrderAndChangesWithMetadata() {
        var first = [String: String](); first["z"] = "2"; first["a"] = "1"
        var second = [String: String](); second["a"] = "1"; second["z"] = "2"
        let left = report(manifest(files: first)), right = report(manifest(files: second))
        XCTAssertEqual(left, right)
        XCTAssertNotEqual(left.manifestSemanticSHA256, report(manifest(revision: "changed", files: first)).manifestSemanticSHA256)
        XCTAssertNotEqual(left.manifestSemanticSHA256,
                          report(manifest(article: article(title: "different"), files: first)).manifestSemanticSHA256)
        XCTAssertNotEqual(left.manifestSemanticSHA256, "unknown")
    }

    func testUnknownAndUnsafeBundleValuesHaveBoundedFixedOutput() {
        for unsafe in [String?.none, "", "1", "1..2", "1.2.", ".1.2", "1.2.3.4", "1234.1", "1.2\nprivate",
                       "/private/diagnostics-fixture", "private@example.com", "１.２.３", String(repeating: "1", count: 100_000)] {
            let result = LibraryDiagnostics.report(appVersion: unsafe, buildNumber: unsafe, manifest: nil)
            XCTAssertEqual(result.appVersion, "unknown")
            // A build is allowed to be a short integer, even when not a valid marketing version.
            XCTAssertEqual(result.buildNumber, unsafe == "1" ? "1" : "unknown")
            XCTAssertLessThanOrEqual(result.text.utf8.count, LibraryDiagnostics.maximumReportBytes)
        }
        let maximum = LibraryDiagnostics.report(appVersion: "999.999.999", buildNumber: "99999999", manifest: nil)
        XCTAssertEqual(maximum.appVersion, "999.999.999")
        XCTAssertEqual(maximum.buildNumber, "99999999")
        XCTAssertEqual(LibraryDiagnostics.versionLabel(appVersion: nil, buildNumber: "bad"), "アプリ 不明（ビルド 不明）")
    }

    func testImportedMetadataIsNotCopiedEvenWhenRevisionLooksLikeAHash() {
        let secrets = ["PRIVATE-ARTICLE-ID", "PRIVATE-TITLE", "file:///private/diagnostics-fixture/secret", "private@example.com",
                       "SEARCH-QUERY-SECRET", "2026-10-30T12:34:56Z", "PRIVATE-FILE-NAME", String(repeating: "f", count: 64)]
        for revision in [secrets.joined(separator: "\n"), secrets.last!] {
            let item = LibraryArticle(id: secrets[0], title: secrets[1], summary: secrets[3], category: "concepts",
                level: "basic", last_updated: secrets[5], source_path: secrets[2], source_sha256: "source-secret",
                document_path: secrets[6], search_text: secrets[4],
                headings: [ArticleHeading(id: "PRIVATE-HEADING", title: "PRIVATE-HEADING-TITLE", level: 2)], audio_id: nil)
            let result = report(manifest(revision: revision, article: item, files: [secrets[6]: "PRIVATE-FILE-DIGEST"]))
            XCTAssertEqual(result.manifestState, "present")
            XCTAssertEqual(result.manifestSemanticSHA256.count, 64)
            for secret in secrets + ["PRIVATE-HEADING", "PRIVATE-HEADING-TITLE", "PRIVATE-FILE-DIGEST"] {
                XCTAssertFalse(result.text.contains(secret), "Only the semantic digest may describe imported metadata")
            }
            let keys = result.text.split(separator: "\n").map { String($0.prefix { $0 != ":" }) }
            XCTAssertEqual(keys, ["diagnostic_format", "app_version", "app_build", "manifest_state", "manifest_schema",
                                  "article_count", "listed_file_count", "manifest_semantic_sha256"])
            XCTAssertLessThanOrEqual(result.text.utf8.count, LibraryDiagnostics.maximumReportBytes)
        }
    }

    func testMissingUnsupportedAndNonfiniteMetadataUseUnknown() {
        let episode = AudioEpisode(id: "private-audio", title: "private-title", article_id: "a", url: "private-url",
            duration_seconds: .nan, sha256: "private-sha", credit: "private-credit", license_url: "private-license",
            source_digest: "private-source", source_is_current: true, chapters: [])
        let invalidChapter = AudioEpisode(id: "private-audio", title: "private-title", article_id: "a", url: "private-url",
            duration_seconds: 1, sha256: "private-sha", credit: "private-credit", license_url: "private-license",
            source_digest: "private-source", source_is_current: true,
            chapters: [AudioChapter(id: "private-chapter", title: "private-title", start_seconds: .infinity)])
        let invalid = [ContentManifest?.none, manifest(schema: 1), manifest(revision: ""), manifest(count: 0),
                       manifest(files: [:]), manifest(audio: [episode]), manifest(audio: [invalidChapter])]
        for value in invalid {
            let result = report(value)
            XCTAssertEqual(result.manifestState, "unavailable")
            XCTAssertEqual(result.manifestSchema, "unknown")
            XCTAssertEqual(result.articleCount, "unknown")
            XCTAssertEqual(result.listedFileCount, "unknown")
            XCTAssertEqual(result.manifestSemanticSHA256, "unknown")
            XCTAssertLessThanOrEqual(result.text.utf8.count, LibraryDiagnostics.maximumReportBytes)
        }
    }

    func testOutOfRangeAndOversizeMetadataProducesOnlyBoundedUnknownFields() {
        let manyFiles = Dictionary(uniqueKeysWithValues: (0..<4097).map { ("file-\($0)", "digest") })
        let manyHeadings = Array(repeating: ArticleHeading(id: "a", title: "b", level: 2), count: 4097)
        let invalid = [manifest(count: 2001), manifest(files: manyFiles), manifest(article: article(headings: manyHeadings)),
                       manifest(revision: String(repeating: "x", count: 8 * 1024 * 1024))]
        for value in invalid {
            let result = report(value)
            XCTAssertEqual(result.manifestState, "unavailable")
            XCTAssertEqual(result.manifestSemanticSHA256, "unknown")
            XCTAssertLessThanOrEqual(result.text.utf8.count, LibraryDiagnostics.maximumReportBytes)
        }
    }
}
