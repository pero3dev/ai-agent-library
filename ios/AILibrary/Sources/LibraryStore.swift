import Foundation
import SwiftUI

@MainActor
final class LibraryStore: ObservableObject {
    @Published private var loadedContent: LibraryLoadedContent?
    @Published private(set) var isLoading = false
    @Published private(set) var loadError: String?
    @Published private(set) var bookmarks: Set<String>
    @Published private(set) var lastArticleID: String?
    @Published var message: String?
    let reading: ReadingStore
    let isTestLibrary: Bool
    private let repository: ContentRepository
    private let snapshotLoader: (() throws -> ContentSnapshot)?
    private var loadGeneration: UUID?
    private var importing = false

    var snapshot: ContentSnapshot? { loadedContent?.snapshot }
    var learningIndex: NativeLearningIndex? { loadedContent?.learningIndex }
    var learningError: String? { loadedContent?.learningError }

    var allowsAudioPlayback: Bool { !isTestLibrary }
    var allowsContentImport: Bool { !isTestLibrary }
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

    func install(from url: URL) async {
        guard allowsContentImport, !isLoading, !Task.isCancelled else { return }
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
            let loaded = try await Task.detached(priority: .userInitiated) {
                LibraryLoadedContent(snapshot: try repository.install(from: url))
            }.value
            // Repository.install has already committed current.json. Cancellation
            // cannot roll that back, so publish the matching bundle even if the
            // caller was cancelled while the detached import was running.
            guard loadGeneration == generation else { return }
            apply(loaded)
            loadError = nil
            message = "コンテンツを更新しました。保存したしおりと読書位置を引き継ぎます。"
        } catch {
            guard loadGeneration == generation, !Task.isCancelled else { return }
            let recovery = snapshot == nil
                ? "コンテンツはまだ読み込まれていません。別のフォルダを選ぶか、再試行してください。"
                : "現在のコンテンツを引き続き利用できます。"
            message = error.localizedDescription + " " + recovery
        }
    }

    private func apply(_ loaded: LibraryLoadedContent) {
        // One synchronous MainActor commit: never await between the snapshot and
        // its metadata, and never launch a second metadata task after publication.
        loadedContent = loaded
    }

    func toggleBookmark(_ id: String) {
        reading.toggleBookmark(id)
        bookmarks = reading.bookmarks
    }

    func markOpened(_ articleID: String) {
        reading.markOpened(articleID)
        if lastArticleID != reading.lastArticleID { lastArticleID = reading.lastArticleID }
    }

    func record(articleID: String, heading: String?, fraction: Double, blockID: String? = nil,
                anchor: NativeReadingAnchor? = nil) {
        reading.record(articleID: articleID, heading: heading, fraction: fraction, blockID: blockID,
                       anchor: anchor)
        if lastArticleID != reading.lastArticleID { lastArticleID = reading.lastArticleID }
    }
}

/// Both validation passes run on the detached loading task. Optional metadata
/// errors are recoverable without replacing a successfully validated article body.
private struct LibraryLoadedContent: Sendable {
    let snapshot: ContentSnapshot
    let learningIndex: NativeLearningIndex?
    let learningError: String?

    init(snapshot: ContentSnapshot) {
        self.snapshot = snapshot
        do {
            learningIndex = try NativeLearningIndex.load(from: snapshot)
            learningError = nil
        } catch {
            learningIndex = nil
            learningError = error.localizedDescription
        }
    }
}
