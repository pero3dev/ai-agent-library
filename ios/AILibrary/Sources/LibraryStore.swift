import Foundation
import SwiftUI

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

    var snapshot: ContentSnapshot? { loadedContent?.snapshot }
    var searchIndex: LibrarySearchIndex? { loadedContent?.searchIndex }
    var learningIndex: NativeLearningIndex? { loadedContent?.learningIndex }
    var learningError: String? { loadedContent?.learningError }

    var allowsReadingBackup: Bool { !isTestLibrary }
    var allowsAudioPlayback: Bool { !isTestLibrary }
    var allowsContentImport: Bool { !isTestLibrary }
    var allowsBundledContentActivation: Bool { !isTestLibrary }
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
