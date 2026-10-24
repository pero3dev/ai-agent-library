import Foundation
import SwiftUI

@MainActor
final class LibraryStore: ObservableObject {
    @Published private(set) var snapshot: ContentSnapshot?
    @Published private(set) var isLoading = false
    @Published private(set) var bookmarks: Set<String>
    @Published private(set) var lastArticleID: String?
    @Published var message: String?
    let reading: ReadingStore
    let isTestLibrary: Bool
    private let repository: ContentRepository

    var allowsAudioPlayback: Bool { !isTestLibrary }
    var allowsContentImport: Bool { !isTestLibrary }
    var listedArticles: [LibraryArticle] {
        (snapshot?.manifest.articles ?? []).filter { $0.isTestFixture == isTestLibrary }
    }

    init(reading: ReadingStore? = nil, bundledRoot: URL? = nil,
         storageName: String = "LibraryContent", isTestLibrary: Bool = false, storageRoot: URL? = nil) {
        let root = bundledRoot ?? Bundle.main.url(forResource: "Content", withExtension: nil)
            ?? Bundle.main.bundleURL.appendingPathComponent("Content", isDirectory: true)
        let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? FileManager.default.temporaryDirectory
        let resolvedStorageName = isTestLibrary && storageName == "LibraryContent" ? "LibraryReaderTestContent" : storageName
        repository = ContentRepository(bundledRoot: root, storageRoot: storageRoot ?? support.appendingPathComponent(resolvedStorageName, isDirectory: true),
                                       allowsTestFixtures: isTestLibrary)
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
        isLoading = true
        defer { isLoading = false }
        let repository = self.repository
        do {
            let loaded = try await Task.detached(priority: .userInitiated) { try repository.load() }.value
            guard !isTestLibrary || loaded.manifest.containsTestFixtures else {
                throw ContentError.invalid("本文表示テストの記事を読み込めませんでした。")
            }
            snapshot = loaded
        }
        catch { message = error.localizedDescription }
    }

    func install(from url: URL) async {
        guard allowsContentImport, !isLoading else { return }
        isLoading = true
        defer { isLoading = false }
        let accessed = url.startAccessingSecurityScopedResource()
        defer { if accessed { url.stopAccessingSecurityScopedResource() } }
        let repository = self.repository
        do {
            snapshot = try await Task.detached(priority: .userInitiated) { try repository.install(from: url) }.value
            message = "コンテンツを更新しました。保存したしおりと読書位置を引き継ぎます。"
        } catch { message = error.localizedDescription + " 現在のコンテンツを引き続き利用できます。" }
    }

    func toggleBookmark(_ id: String) {
        reading.toggleBookmark(id)
        bookmarks = reading.bookmarks
    }

    func markOpened(_ articleID: String) {
        reading.markOpened(articleID)
        if lastArticleID != reading.lastArticleID { lastArticleID = reading.lastArticleID }
    }

    func record(articleID: String, heading: String?, fraction: Double, blockID: String? = nil) {
        reading.record(articleID: articleID, heading: heading, fraction: fraction, blockID: blockID)
        if lastArticleID != reading.lastArticleID { lastArticleID = reading.lastArticleID }
    }
}
