import SwiftUI

struct ArticleReaderView: View {
    @ObservedObject var store: LibraryStore
    let snapshot: ContentSnapshot
    let article: LibraryArticle
    let initialHeading: String?
    let navigate: (ReaderRoute) -> Void
    @State private var document: NativeDocument?
    @State private var loadedContentID: String?
    @State private var loadError: String?
    @State private var reloadID = UUID()
    @State private var requestedHeading: String?
    @State private var headingRequestID = UUID()
    @State private var contentsPresented = false
    @State private var episode: AudioEpisode?

    var body: some View {
        readerContent
            .task(id: loadID) { await loadDocument() }
            .onAppear { store.markOpened(article.id) }
            .navigationTitle(article.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { readerToolbar }
            .sheet(isPresented: $contentsPresented) { contentsSheet }
            .sheet(item: $episode) { selected in audioSheet(selected) }
    }

    private var contentID: String { article.id + ":" + snapshot.manifest.revision }
    private var loadID: String { contentID + ":" + reloadID.uuidString }
    private var isBookmarked: Bool { store.bookmarks.contains(article.id) }

    @ViewBuilder private var readerContent: some View {
        Group {
            if let document {
                nativeReader(document)
            } else if let loadError {
                loadFailure(loadError)
            } else {
                ProgressView("記事を読み込んでいます")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
    }

    private func nativeReader(_ document: NativeDocument) -> some View {
        let saved = store.reading.position(for: article, document: document)
        return NativeReaderView(snapshot: snapshot, article: article, document: document,
                                position: saved, initialHeading: initialHeading,
                                requestedHeading: requestedHeading, headingRequestID: headingRequestID,
                                onPosition: recordPosition, navigate: navigate)
            .id(contentID)
    }

    private func recordPosition(_ heading: String?, _ blockID: String?, _ fraction: Double) {
        store.record(articleID: article.id, heading: heading, fraction: fraction, blockID: blockID)
    }

    private func loadFailure(_ message: String) -> some View {
        ContentUnavailableView {
            Label("記事を表示できません", systemImage: "doc.text.magnifyingglass")
        } description: {
            Text(message)
        } actions: {
            Button("再試行") { reloadID = UUID() }
        }
    }

    @ToolbarContentBuilder private var readerToolbar: some ToolbarContent {
        ToolbarItemGroup(placement: .topBarTrailing) {
            Button { store.toggleBookmark(article.id) } label: {
                Image(systemName: isBookmarked ? "bookmark.fill" : "bookmark")
            }
            .accessibilityLabel(isBookmarked ? "しおりを削除" : "しおりを追加")
            if store.allowsAudioPlayback, let audio = snapshot.episode(for: article) {
                Button { episode = audio } label: { Image(systemName: "headphones") }
                    .accessibilityLabel("音声で聴く")
            }
            Button { contentsPresented = true } label: { Image(systemName: "list.bullet") }
                .accessibilityLabel("目次")
        }
    }

    private var contentsSheet: some View {
        NavigationStack {
            List(article.headings) { heading in headingButton(heading) }
                .navigationTitle("目次")
                .toolbar {
                    ToolbarItem(placement: .confirmationAction) {
                        Button("閉じる") { contentsPresented = false }
                    }
                }
        }
    }

    private func headingButton(_ heading: ArticleHeading) -> some View {
        Button {
            requestedHeading = heading.id
            headingRequestID = UUID()
            contentsPresented = false
        } label: {
            Text(heading.title).padding(.leading, CGFloat(max(0, heading.level - 2)) * 12)
        }
        .accessibilityCustomContent("見出しレベル", Text(String(heading.level)), importance: .high)
    }

    private func audioSheet(_ selected: AudioEpisode) -> some View {
        NavigationStack {
            AudioPlayerView(episode: selected)
                .toolbar {
                    ToolbarItem(placement: .confirmationAction) {
                        Button("閉じる") { episode = nil }
                    }
                }
        }
    }

    @MainActor private func loadDocument() async {
        // NavigationStack restarts .task when returning from a linked article.
        // Keeping the successful document also retains the reader's consumed
        // fragment requests, current block and VoiceOver state.
        guard loadedContentID != contentID || document == nil else { return }
        document = nil
        loadedContentID = nil
        loadError = nil
        do {
            let loaded = try await Task.detached(priority: .userInitiated) {
                try snapshot.document(for: article)
            }.value
            guard !Task.isCancelled else { return }
            document = loaded
            loadedContentID = contentID
        } catch {
            guard !Task.isCancelled else { return }
            loadError = error.localizedDescription
        }
    }
}
