import Foundation
import SwiftUI
import Darwin
#if DEBUG
import CryptoKit
#endif

/// The provider URL is coordinated and scoped only for this bounded read. The
/// returned bytes still require the restore engine's strict backup validation.
enum ReadingBackupDocumentReader {
    static let maximumBytes = 2_097_152

    enum Failure: LocalizedError {
        case notRegularFile, cannotRead, tooLarge
        var errorDescription: String? {
            switch self {
            case .notRegularFile: return "通常のバックアップファイルを選んでください。"
            case .cannotRead: return "バックアップファイルを読み取れませんでした。保存先を確認して、もう一度選んでください。"
            case .tooLarge: return "バックアップファイルが容量上限を超えています。"
            }
        }
    }

    static func read(from url: URL) throws -> Data {
        try Task.checkCancellation()
        guard url.isFileURL else { throw Failure.notRegularFile }
        let scoped = url.startAccessingSecurityScopedResource()
        defer { if scoped { url.stopAccessingSecurityScopedResource() } }
        // Reject known special files before coordination. An unmaterialized
        // provider URL may not exist yet; coordination gets the chance to load it.
        let knownSpecialFile = url.withUnsafeFileSystemRepresentation { path -> Bool in
            guard let path else { return true }
            var information = stat()
            return lstat(path, &information) == 0 && information.st_mode & S_IFMT != S_IFREG
        }
        guard !knownSpecialFile else { throw Failure.notRegularFile }
        var coordinationError: NSError?
        var result: Result<Data, Error>?
        NSFileCoordinator().coordinate(readingItemAt: url, options: .withoutChanges,
                                       error: &coordinationError) { coordinatedURL in
            result = Result { try readRegularFile(from: coordinatedURL) }
        }
        try Task.checkCancellation()
        if let coordinationError { throw coordinationError }
        guard let result else { throw Failure.cannotRead }
        return try result.get()
    }

    private static func readRegularFile(from url: URL) throws -> Data {
        try Task.checkCancellation()
        // A nonblocking open cannot wait on a substituted FIFO. fstat checks the
        // opened descriptor; final symlinks and directories are not accepted.
        let descriptor = url.withUnsafeFileSystemRepresentation { path -> Int32 in
            guard let path else { return -1 }
            return Darwin.open(path, O_RDONLY | O_CLOEXEC | O_NONBLOCK | O_NOFOLLOW)
        }
        guard descriptor >= 0 else { throw Failure.cannotRead }
        let handle = FileHandle(fileDescriptor: descriptor, closeOnDealloc: true)
        defer { try? handle.close() }
        var information = stat()
        guard fstat(descriptor, &information) == 0,
              information.st_mode & S_IFMT == S_IFREG else { throw Failure.notRegularFile }
        var bytes = Data()
        while true {
            try Task.checkCancellation()
            let remaining = maximumBytes + 1 - bytes.count
            guard remaining > 0 else { throw Failure.tooLarge }
            guard let chunk = try handle.read(upToCount: min(65_536, remaining)), !chunk.isEmpty else { return bytes }
            bytes.append(chunk)
            guard bytes.count <= maximumBytes else { throw Failure.tooLarge }
        }
    }
}

@MainActor
final class LibraryStore: ObservableObject {
    @Published private var loadedContent: LibraryLoadedContent?
    @Published private(set) var isLoading = false
    @Published private(set) var loadError: String?
    @Published private(set) var bookmarks: Set<String>
    @Published private(set) var lastArticleID: String?
    @Published private(set) var readingRecoveryIssue: ReadingStore.RecoveryIssue?
    @Published private(set) var readingSaveSuspended: Bool
    @Published var message: String?
    let reading: ReadingStore
    let isTestLibrary: Bool
    private let repository: ContentRepository
    private let snapshotLoader: (() throws -> ContentSnapshot)?
    private var loadGeneration: UUID?
    private var importing = false
    #if DEBUG
    // Neither property is Published; diagnostics cannot invalidate a SwiftUI body.
    private var readerPlacementRecordTrace = ReaderPlacementRecordTraceBuffer()
    var readerPlacementRecordTraceEnabled: Bool { !isTestLibrary && ReaderPlacementRecordTrace.requested }
    var readerPlacementRecordTraceJSON: String {
        readerPlacementRecordTraceEnabled ? readerPlacementRecordTrace.json : ReaderPlacementRecordTrace.unavailable
    }
    func appendReaderPlacementRecordTrace(_ event: ReaderPlacementRecordTraceEvent) {
        guard readerPlacementRecordTraceEnabled else { return }
        readerPlacementRecordTrace.append(event)
    }
    func traceReaderRecordReturn(article: LibraryArticle, document: NativeDocument?,
        documentDigest: String?, readerID: String, blockID: String?, fraction: Double, intra: Double?) {
        guard readerPlacementRecordTraceEnabled else { return }
        // Live memory resolution only, after the existing synchronous record call. Never read defaults raw.
        let resolved = document.map { reading.position(for: article, document: $0, documentDigest: documentDigest) }
        let sample = ReaderPlacementRecordTrace.point(block: blockID, fraction: fraction, intra: intra)
        let resolvedSample = resolved.flatMap {
            ReaderPlacementRecordTrace.point(block: $0.blockID, fraction: $0.fraction, intra: $0.anchor?.intraBlockFraction)
        }
        let matches: Bool?
        if let resolved, let blockID, ReaderPlacementRecordTrace.unit(fraction) != nil,
           intra == nil || ReaderPlacementRecordTrace.unit(intra) != nil {
            matches = resolved.blockID == blockID && resolved.fraction == fraction &&
                resolved.anchor?.intraBlockFraction == intra
        } else { matches = nil }
        appendReaderPlacementRecordTrace(ReaderPlacementRecordTraceEvent(kind: .recordReturned,
            articleFP: ReaderPlacementRecordTrace.fingerprint(article.id),
            readerFP: ReaderPlacementRecordTrace.fingerprint(readerID),
            sampleFP: sample, resolvedFP: resolvedSample,
            fraction: ReaderPlacementRecordTrace.unit(fraction), intra: ReaderPlacementRecordTrace.unit(intra),
            resolvedFraction: resolved.flatMap { ReaderPlacementRecordTrace.unit($0.fraction) },
            resolvedIntra: resolved.flatMap { ReaderPlacementRecordTrace.unit($0.anchor?.intraBlockFraction) },
            matches: matches,
            recoveryIssue: reading.recoveryIssue != nil, saveSuspended: reading.readingSaveSuspended))
    }
    #endif

    var snapshot: ContentSnapshot? { loadedContent?.snapshot }
    var searchIndex: LibrarySearchIndex? { loadedContent?.searchIndex }
    var learningIndex: NativeLearningIndex? { loadedContent?.learningIndex }
    var learningError: String? { loadedContent?.learningError }

    var allowsReadingBackup: Bool { !isTestLibrary }
    var allowsReadingRestore: Bool { !isTestLibrary }
    // Compatibility name only; the general reading-save state has one publisher.
    var restoreSaveSuspended: Bool { readingSaveSuspended }
    var allowsAudioPlayback: Bool { !isTestLibrary }
    var allowsContentImport: Bool { !isTestLibrary }
    var allowsBundledContentActivation: Bool { !isTestLibrary }

    /// The existing restore presentation owns preview/cancel lifetime. Its caller
    /// supplies that state instead of creating a second restore transaction flag.
    func unavailableReadingArticleCount(isRestorePresented: Bool) -> Int? {
        guard !isTestLibrary, !isLoading, !isRestorePresented, !readingSaveSuspended,
              readingRecoveryIssue == nil, let snapshot,
              !snapshot.manifest.containsTestFixtures else { return nil }
        return reading.unavailableArticleRecordCount(
            knownArticleIDs: Set(snapshot.manifest.articles.map(\.id)))
    }
    var listedArticles: [LibraryArticle] {
        (snapshot?.manifest.articles ?? []).filter { $0.isTestFixture == isTestLibrary }
    }
    var orderedListedArticles: [LibraryArticle] {
        guard let learningIndex else { return listedArticles }
        return LibraryArticleOrder.ordered(listedArticles, articleIDs: learningIndex.chapters.flatMap(\.article_ids))
    }

    init(reading: ReadingStore? = nil, bundledRoot: URL? = nil,
         storageName: String = "LibraryContent", isTestLibrary: Bool = false, storageRoot: URL? = nil,
         snapshotLoader: (() throws -> ContentSnapshot)? = nil) {
        let root = bundledRoot ?? Bundle.main.url(forResource: "Content", withExtension: nil)
            ?? Bundle.main.bundleURL.appendingPathComponent("Content", isDirectory: true)
        let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? FileManager.default.temporaryDirectory
        let resolvedStorageName = isTestLibrary && storageName == "LibraryContent" ? "LibraryReaderTestContent" : storageName
        repository = ContentRepository(bundledRoot: root, storageRoot: storageRoot ?? support.appendingPathComponent(resolvedStorageName, isDirectory: true),
                                       allowsTestFixtures: isTestLibrary)
        self.snapshotLoader = snapshotLoader
        self.isTestLibrary = isTestLibrary
        let readingStore: ReadingStore
        if let reading {
            readingStore = reading
        } else if isTestLibrary {
            // Test mode must never silently fall back to the normal defaults domain.
            guard let defaults = UserDefaults(suiteName: "ailibrary-native-reader-test") else {
                preconditionFailure("Unable to create isolated reader-test preferences")
            }
            readingStore = ReadingStore(defaults: defaults)
        } else {
            readingStore = ReadingStore()
        }
        self.reading = readingStore
        bookmarks = readingStore.bookmarks
        lastArticleID = readingStore.lastArticleID
        readingRecoveryIssue = readingStore.recoveryIssue
        readingSaveSuspended = readingStore.readingSaveSuspended
    }

    #if DEBUG
    static func makeReaderTestStore() -> LibraryStore? {
        guard let root = Bundle.main.url(forResource: "TestContent", withExtension: nil),
              FileManager.default.fileExists(atPath: root.appendingPathComponent("manifest.json").path),
              let defaults = UserDefaults(suiteName: "ailibrary-native-reader-test") else { return nil }
        return LibraryStore(reading: ReadingStore(defaults: defaults), bundledRoot: root,
                            storageName: "LibraryReaderTestContent", isTestLibrary: true)
    }
    #endif

    func load() async {
        guard snapshot == nil, !isLoading else { return }
        await loadContent()
    }

    /// Retry the complete read-only load, including optional learning metadata.
    /// A newer retry supersedes an older read; imports remain serialized.
    func retryLoad() async {
        guard !importing else { return }
        await loadContent()
    }

    private func loadContent() async {
        let generation = UUID()
        loadGeneration = generation
        isLoading = true
        loadError = nil
        defer {
            if loadGeneration == generation { isLoading = false; loadGeneration = nil }
        }
        let repository = self.repository
        let loader = snapshotLoader
        do {
            let loaded = try await Task.detached(priority: .userInitiated) {
                let snapshot = try loader?() ?? repository.load()
                return LibraryLoadedContent(snapshot: snapshot)
            }.value
            guard loadGeneration == generation, !Task.isCancelled else { return }
            guard !isTestLibrary || loaded.snapshot.manifest.containsTestFixtures else {
                throw ContentError.invalid("本文表示テストの記事を読み込めませんでした。")
            }
            apply(loaded)
            loadError = nil
        }
        catch {
            guard loadGeneration == generation, !Task.isCancelled else { return }
            loadError = error.localizedDescription
        }
    }

    /// Read-only preview. It validates the installed and bundled packages without
    /// writing a pointer or changing the currently published snapshot/index pair.
    func previewBundledContent() async -> BundledContentPreview? {
        guard allowsBundledContentActivation, !isLoading, !Task.isCancelled else { return nil }
        let generation = UUID()
        loadGeneration = generation
        importing = true
        isLoading = true
        defer {
            if loadGeneration == generation { isLoading = false; importing = false; loadGeneration = nil }
        }
        let repository = self.repository
        do {
            let preview = try await Task.detached(priority: .userInitiated) {
                try repository.previewBundledContent()
            }.value
            guard loadGeneration == generation, !Task.isCancelled else { return nil }
            return preview
        } catch {
            guard loadGeneration == generation, !Task.isCancelled else { return nil }
            let recovery = snapshot == nil
                ? "コンテンツはまだ読み込まれていません。別のフォルダを選ぶか、再試行してください。"
                : "現在のコンテンツを引き続き利用できます。"
            message = error.localizedDescription + " " + recovery
            return nil
        }
    }

    func install(from url: URL) async {
        _ = await installContent(from: url, bundledSelection: false)
    }

    @discardableResult
    func activateBundledContent() async -> Bool {
        guard allowsBundledContentActivation else { return false }
        return await installContent(from: repository.bundledRoot, bundledSelection: true)
    }

    private func installContent(from url: URL, bundledSelection: Bool) async -> Bool {
        guard allowsContentImport, !isLoading, !Task.isCancelled else { return false }
        let generation = UUID()
        loadGeneration = generation
        importing = true
        isLoading = true
        defer {
            if loadGeneration == generation { isLoading = false; importing = false; loadGeneration = nil }
        }
        let accessed = url.startAccessingSecurityScopedResource()
        defer { if accessed { url.stopAccessingSecurityScopedResource() } }
        let repository = self.repository
        do {
            let result = try await Task.detached(priority: .userInitiated) {
                if bundledSelection {
                    let activation = try repository.activateBundledContent()
                    return (LibraryLoadedContent(snapshot: activation.snapshot), activation.alreadyActive)
                }
                return (LibraryLoadedContent(snapshot: try repository.install(from: url)), false)
            }.value
            // Repository may already have committed current.json. Cancellation
            // cannot roll that back, so publish the matching bundle even if the
            // caller was cancelled while the detached operation was running.
            guard loadGeneration == generation else { return false }
            apply(result.0)
            loadError = nil
            if bundledSelection {
                message = result.1
                    ? "同梱コンテンツと同じ内容を利用しています。保存したしおりと読書位置を維持します。"
                    : "同梱コンテンツへ切り替えました。保存したしおりと読書位置を引き継ぎます。"
            } else {
                message = "コンテンツを更新しました。保存したしおりと読書位置を引き継ぎます。"
            }
            return true
        } catch {
            guard loadGeneration == generation, !Task.isCancelled else { return false }
            let recovery = snapshot == nil
                ? "コンテンツはまだ読み込まれていません。別のフォルダを選ぶか、再試行してください。"
                : "現在のコンテンツを引き続き利用できます。"
            message = error.localizedDescription + " " + recovery
            return false
        }
    }

    private func apply(_ loaded: LibraryLoadedContent) {
        // One synchronous MainActor commit: never await between the snapshot and
        // its metadata, and never launch a second metadata task after publication.
        loadedContent = loaded
    }

    private func syncReadingSaveSuspension() {
        if readingSaveSuspended != reading.readingSaveSuspended {
            readingSaveSuspended = reading.readingSaveSuspended
        }
    }

    func exportReadingBackup(createdAt: Date, appVersion: String) throws -> Data {
        defer { syncReadingSaveSuspension() }
        guard allowsReadingBackup else { throw ReadingBackupCodec.Failure.unsupportedScope }
        return try reading.exportBackup(createdAt: createdAt, appVersion: appVersion)
    }

    func previewReadingRestore(from data: Data) throws -> ReadingStore.RestorePreview {
        guard allowsReadingRestore else { throw ReadingBackupCodec.Failure.unsupportedScope }
        defer { syncReadingSaveSuspension() }
        return try reading.previewRestore(from: data)
    }

    func applyReadingRestore(_ preview: ReadingStore.RestorePreview, backupCreatedAt: Date) throws {
        guard allowsReadingRestore else { throw ReadingBackupCodec.Failure.unsupportedScope }
        defer { syncReadingSaveSuspension() }
        try reading.applyRestore(preview, backupCreatedAt: backupCreatedAt)
        // The engine confirms the exact primary bytes before this publication.
        bookmarks = reading.bookmarks
        lastArticleID = reading.lastArticleID
    }

    func retainedReadingRestoreBackup() throws -> ReadingStore.RetainedRestoreBackup? {
        guard allowsReadingRestore else { throw ReadingBackupCodec.Failure.unsupportedScope }
        defer { syncReadingSaveSuspension() }
        return try reading.retainedRestoreBackup()
    }

    func exportRetainedReadingRestoreBackup(_ retained: ReadingStore.RetainedRestoreBackup,
                                           appVersion: String) throws -> Data {
        guard allowsReadingRestore else { throw ReadingBackupCodec.Failure.unsupportedScope }
        defer { syncReadingSaveSuspension() }
        return try reading.exportRetainedRestoreBackup(retained, appVersion: appVersion)
    }

    func releaseReadingRestoreBackup(_ retained: ReadingStore.RetainedRestoreBackup) throws {
        guard allowsReadingRestore else { throw ReadingBackupCodec.Failure.unsupportedScope }
        defer { syncReadingSaveSuspension() }
        try reading.releaseRetainedRestoreBackup(retained)
    }

    func recoverReadingState() {
        defer { syncReadingSaveSuspension() }
        reading.recoverReadableState()
        readingRecoveryIssue = reading.recoveryIssue
        bookmarks = reading.bookmarks
        lastArticleID = reading.lastArticleID
    }

    func toggleBookmark(_ id: String) {
        defer { syncReadingSaveSuspension() }
        reading.toggleBookmark(id)
        bookmarks = reading.bookmarks
    }

    func markOpened(_ articleID: String) {
        defer { syncReadingSaveSuspension() }
        reading.markOpened(articleID)
        if lastArticleID != reading.lastArticleID { lastArticleID = reading.lastArticleID }
    }

    func record(articleID: String, heading: String?, fraction: Double, blockID: String? = nil,
                anchor: NativeReadingAnchor? = nil) {
        defer { syncReadingSaveSuspension() }
        reading.record(articleID: articleID, heading: heading, fraction: fraction, blockID: blockID,
                       anchor: anchor)
        if lastArticleID != reading.lastArticleID { lastArticleID = reading.lastArticleID }
    }
}

/// Both validation passes run on the detached loading task. Optional metadata
/// errors are recoverable without replacing a successfully validated article body.
private struct LibraryLoadedContent: Sendable {
    let snapshot: ContentSnapshot
    let searchIndex: LibrarySearchIndex
    let learningIndex: NativeLearningIndex?
    let learningError: String?

    init(snapshot: ContentSnapshot) {
        self.snapshot = snapshot
        searchIndex = LibrarySearchIndex(articles: snapshot.manifest.articles)
        do {
            learningIndex = try NativeLearningIndex.load(from: snapshot)
            learningError = nil
        } catch {
            learningIndex = nil
            learningError = error.localizedDescription
        }
    }
}
#if DEBUG
/// Explicit isolated-suite diagnostics only. No body, query, URL, defaults raw or ID string is retained.
enum ReaderPlacementRecordTrace {
    static let maximumEvents = 32
    static let maximumBytes = 8_192
    static let unavailable = #"{"schemaVersion":1,"kind":"reader-placement-record","status":"unavailable","events":[],"dropCount":null}"#

    static var requested: Bool {
        let environment = ProcessInfo.processInfo.environment
        guard environment["AILIBRARY_UI_TEST_READING_PLACEMENT_TRACE"] == "1",
              let suite = environment["AILIBRARY_UI_TEST_SUITE"],
              suite.hasPrefix("ailibrary-uitest-"), suite.count < 100 else { return false }
        let suffix = String(suite.dropFirst("ailibrary-uitest-".count))
        // Same canonical UUID validation as the existing isolated reading/font profiles.
        return UUID(uuidString: suffix)?.uuidString == suffix
    }

    static func fingerprint(_ identifier: String?) -> String? {
        guard let identifier else { return nil }
        let bytes = Array(identifier.utf8.prefix(257))
        guard !bytes.isEmpty, bytes.count <= 256 else { return nil }
        return SHA256.hash(data: Data(bytes)).prefix(16).map { String(format: "%02x", $0) }.joined()
    }

    static func unit(_ value: Double?) -> Double? {
        guard let value, value.isFinite, (0...1).contains(value) else { return nil }
        return value == 0 ? 0 : value
    }

    static func point(block: String?, fraction: Double?, intra: Double?) -> String? {
        guard let block = fingerprint(block), let fraction = unit(fraction),
              intra == nil || unit(intra) != nil else { return nil }
        return fingerprint(block + ":" + String(fraction.bitPattern) + ":" + (intra.map { String($0.bitPattern) } ?? "nil"))
    }
}

struct ReaderPlacementRecordTraceEvent: Encodable {
    enum Kind: String, Encodable { case resumeLoad, destination, placementComplete, recordReturned }
    enum Purpose: String, Encodable { case automaticResume, automaticReflow, explicitNavigation }
    enum Outcome: String, Encodable { case aligned, interrupted, exhausted, cancelled, superseded, unavailable }
    enum Effect: String, Encodable {
        case measuredAlignment, measuredUserPan, preserveAutomaticPosition, preserveUnreachedNavigation, ignoreSuperseded
    }
    let kind: Kind
    var articleFP: String? = nil
    var readerFP: String? = nil
    var requestFP: String? = nil
    var targetFP: String? = nil
    var containerFP: String? = nil
    var sampleFP: String? = nil
    var resolvedFP: String? = nil
    var purpose: Purpose? = nil
    var outcome: Outcome? = nil
    var effect: Effect? = nil
    var measured: Bool? = nil
    var blockedEpoch: UInt64? = nil
    var userPanEpoch: UInt64? = nil
    var fraction: Double? = nil
    var intra: Double? = nil
    var resolvedFraction: Double? = nil
    var resolvedIntra: Double? = nil
    var matches: Bool? = nil
    var recoveryIssue: Bool? = nil
    var saveSuspended: Bool? = nil
    var initialHeading: Bool? = nil
    var searchRequested: Bool? = nil

    static func purpose(_ value: NativeReadingPlacementRequest.Purpose) -> Purpose {
        switch value {
        case .automaticResume: return .automaticResume
        case .automaticReflow: return .automaticReflow
        case .explicitNavigation: return .explicitNavigation
        }
    }
    static func outcome(_ value: NativeReaderPlacementPolicy.Outcome) -> Outcome {
        switch value {
        case .aligned: return .aligned
        case .interrupted: return .interrupted
        case .exhausted: return .exhausted
        case .cancelled: return .cancelled
        case .superseded: return .superseded
        case .unavailable: return .unavailable
        }
    }
    static func effect(_ value: NativeReadingProgressSession.CompletionEffect) -> Effect {
        switch value {
        case .measuredAlignment: return .measuredAlignment
        case .measuredUserPan: return .measuredUserPan
        case .preserveAutomaticPosition: return .preserveAutomaticPosition
        case .preserveUnreachedNavigation: return .preserveUnreachedNavigation
        case .ignoreSuperseded: return .ignoreSuperseded
        }
    }
}

struct ReaderPlacementRecordTraceBuffer {
    private var events: [ReaderPlacementRecordTraceEvent] = []
    private var dropCount = 0
    private struct Envelope: Encodable {
        let schemaVersion = 1
        let kind = "reader-placement-record"
        let status = "observed"
        let events: [ReaderPlacementRecordTraceEvent]
        let dropCount: Int
    }
    private func encoded(_ events: [ReaderPlacementRecordTraceEvent]) -> Data? {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
        return try? encoder.encode(Envelope(events: events, dropCount: dropCount))
    }
    mutating func append(_ event: ReaderPlacementRecordTraceEvent) {
        // Keep a bounded latest window across navigation. Drop only complete events and count every omission.
        events.append(event)
        while !events.isEmpty {
            if events.count <= ReaderPlacementRecordTrace.maximumEvents,
               let data = encoded(events), data.count <= ReaderPlacementRecordTrace.maximumBytes - 64 { break }
            events.removeFirst()
            if dropCount < Int.max { dropCount += 1 }
        }
    }
    var json: String {
        guard let data = encoded(events), data.count <= ReaderPlacementRecordTrace.maximumBytes else {
            return #"{"schemaVersion":1,"kind":"reader-placement-record","status":"unavailable","events":[],"dropCount":\#(dropCount)}"#
        }
        return String(decoding: data, as: UTF8.self)
    }
}
#endif
