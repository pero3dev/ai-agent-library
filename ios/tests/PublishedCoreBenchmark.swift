import CryptoKit
import Dispatch
import Foundation
#if os(macOS)
import Darwin
#endif

/// Host CLI only. Compile alongside the four immutable production core sources.
/// The uncached oracle is reachable only in a separate correctness process.
@main enum PublishedCoreBenchmark {
    private static let validation = "published-core.validation.v1"
    private static let construction = "published-core.index-construction.v1"
    private static let filtering = "published-core.indexed-filter.v1"

    static func main() {
        do { try run() }
        catch {
            FileHandle.standardError.write(Data(("Core benchmark rejected: " + error.localizedDescription + "\n").utf8))
            exit(1)
        }
    }

    private static func digest(_ data: Data) -> String {
        SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
    }

    // Length-prefixed UTF-8 records preserve order without separator ambiguity.
    private static func idsDigest(_ ids: [String]) -> String {
        var data = Data()
        for id in ids { data.append(Data(("\(id.utf8.count):" + id + "\n").utf8)) }
        return digest(data)
    }

    private static func queryResults(_ results: [[LibraryArticle]]) -> [[String: Any]] {
        results.enumerated().map { index, articles in
            ["query_index": index, "result_count": articles.count, "ordered_ids_sha256": idsDigest(articles.map(\.id))]
        }
    }

    private static func batch(_ queries: [String], _ manifest: ContentManifest,
                              _ index: LibrarySearchIndex) -> [[LibraryArticle]] {
        queries.map { LibraryArticleFilter(query: $0).articles(in: manifest.articles, bookmarks: [], searchIndex: index) }
    }

    private static func elapsed(_ start: UInt64, _ stop: UInt64) throws -> Double {
        guard stop > start else { throw ContentError.invalid("Monotonic clock did not advance") }
        let seconds = Double(stop - start) / 1_000_000_000
        guard seconds.isFinite, seconds > 0 else { throw ContentError.invalid("Invalid elapsed wall seconds") }
        return seconds
    }

    private static var architecture: String {
        #if arch(arm64)
        return "arm64"
        #elseif arch(x86_64)
        return "x86_64"
        #else
        return "unsupported"
        #endif
    }

    private static func peakRSS() throws -> Int64 {
        #if os(macOS)
        var usage = rusage()
        guard getrusage(RUSAGE_SELF, &usage) == 0, usage.ru_maxrss > 0 else {
            throw ContentError.invalid("Darwin getrusage(RUSAGE_SELF).ru_maxrss unavailable")
        }
        // Darwin getrusage(2): ru_maxrss is the maximum resident set size in bytes.
        // This is a process high-water mark through this probe, not a timed-region delta.
        return Int64(usage.ru_maxrss)
        #else
        throw ContentError.invalid("RSS byte contract is verified for macOS Darwin only")
        #endif
    }

    private static func run() throws {
        guard CommandLine.arguments.count == 6 else {
            throw ContentError.invalid("Usage: benchmark <correctness|scenario> <Content> <queries.json> <identity.json> <invocation-id>")
        }
        let mode = CommandLine.arguments[1]
        guard ["correctness", validation, construction, filtering].contains(mode) else {
            throw ContentError.invalid("Unknown benchmark scenario")
        }
        let root = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
        let queryData = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[3]))
        let queries = try JSONDecoder().decode([String].self, from: queryData)
        let identityData = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[4]))
        guard let identity = try JSONSerialization.jsonObject(with: identityData) as? [String: Any],
              let expectedCount = identity["expected_article_count"] as? Int, expectedCount > 0,
              let expectedManifest = identity["manifest_sha256"] as? String,
              let expectedRevision = identity["corpus_revision"] as? String,
              identity["query_sha256"] as? String == digest(queryData),
              identity["query_count"] as? Int == queries.count, !queries.isEmpty else {
            throw ContentError.invalid("Missing or inconsistent benchmark identity")
        }
        let invocationID = CommandLine.arguments[5]
        guard UUID(uuidString: invocationID) != nil else { throw ContentError.invalid("Invalid invocation ID") }
        // File SHA checks and JSON identity setup are outside all timed regions.
        let manifestData = try Data(contentsOf: root.appendingPathComponent("manifest.json"))
        guard digest(manifestData) == expectedManifest else { throw ContentError.invalid("Manifest SHA mismatch") }
        var output: [String: Any] = [
            "schema_version": 1, "mode": mode, "invocation_id": invocationID,
            "process_id": ProcessInfo.processInfo.processIdentifier,
            "executable_architecture": architecture, "host_os_version": ProcessInfo.processInfo.operatingSystemVersionString,
            "identity_sha256": digest(identityData), "manifest_sha256": digest(manifestData),
            "query_sha256": digest(queryData), "query_count": queries.count
        ]

        func bind(_ manifest: ContentManifest) throws {
            guard manifest.articles.count == expectedCount, manifest.revision == expectedRevision,
                  manifest.schema_version == 2 else { throw ContentError.invalid("Actual consumed corpus identity mismatch") }
            output["actual_article_count"] = manifest.articles.count
            output["corpus_revision"] = manifest.revision
            output["article_order_sha256"] = idsDigest(manifest.articles.map(\.id))
        }

        if mode == validation {
            let start = DispatchTime.now().uptimeNanoseconds
            let snapshot = try ContentValidator.validate(root: root)
            let stop = DispatchTime.now().uptimeNanoseconds
            try withExtendedLifetime(snapshot) {
                try bind(snapshot.manifest)
                output["wall_seconds"] = try elapsed(start, stop)
                output["process_peak_resident_bytes"] = try peakRSS()
            }
        } else {
            // Manifest decoding is excluded from both construction and filter timing.
            let manifest = try JSONDecoder().decode(ContentManifest.self, from: manifestData)
            try bind(manifest)
            if mode == construction {
                let start = DispatchTime.now().uptimeNanoseconds
                let index = LibrarySearchIndex(articles: manifest.articles)
                let stop = DispatchTime.now().uptimeNanoseconds
                // Consume the constructed value after stop. Whole-process RSS includes this
                // post-timing query/digest work; it must never be called isolated index size.
                let results = batch(queries, manifest, index)
                try withExtendedLifetime((manifest, index, results)) {
                    output["query_results"] = queryResults(results)
                    output["wall_seconds"] = try elapsed(start, stop)
                    output["process_peak_resident_bytes"] = try peakRSS()
                }
            } else if mode == filtering {
                let index = LibrarySearchIndex(articles: manifest.articles)
                let start = DispatchTime.now().uptimeNanoseconds
                let results = batch(queries, manifest, index)
                let stop = DispatchTime.now().uptimeNanoseconds
                // All arrays are materialized during timing; ID hashing is after stop.
                try withExtendedLifetime((manifest, index, results)) {
                    output["query_results"] = queryResults(results)
                    output["wall_seconds"] = try elapsed(start, stop)
                    output["process_peak_resident_bytes"] = try peakRSS()
                }
            } else {
                // Correctness validates the package and oracle in its own fresh process.
                // It cannot add uncached normalization work to a measured process.
                let snapshot = try ContentValidator.validate(root: root)
                try bind(snapshot.manifest)
                let index = LibrarySearchIndex(articles: snapshot.manifest.articles)
                let indexed = batch(queries, snapshot.manifest, index)
                for (offset, query) in queries.enumerated() {
                    let uncached = LibraryArticleFilter(query: query).articles(in: snapshot.manifest.articles, bookmarks: [])
                    guard indexed[offset].map(\.id) == uncached.map(\.id) else {
                        throw ContentError.invalid("Ordered indexed/uncached results differ at query \(offset)")
                    }
                }
                output["query_results"] = queryResults(indexed)
                output["correctness"] = "ordered-indexed-equals-production-uncached"
            }
        }
        // Encoding/output occurs after the process high-water probe. Peak RSS describes
        // the whole process through that probe, including setup and post-timing digest.
        let data = try JSONSerialization.data(withJSONObject: output, options: [.sortedKeys])
        FileHandle.standardOutput.write(data)
        FileHandle.standardOutput.write(Data([10]))
    }
}
