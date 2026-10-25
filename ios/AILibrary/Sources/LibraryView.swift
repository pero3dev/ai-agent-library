import SwiftUI
import UniformTypeIdentifiers

struct LibraryView: View {
    @ObservedObject var store: LibraryStore
    @State private var filter = LibraryArticleFilter()
    @State private var importPresented = false
    @State private var aboutPresented = false
    @State private var path: [ReaderRoute] = []
    @State private var selectedChapterID: String?
    @State private var tagPresented = false
    @State private var learningPresented: NativeLearningPresentation?
    @State private var pendingLearningDestination: NativeLearningDestination?
    @State private var bundledPreview: BundledContentPreview?
    @State private var bundledPreviewing = false
    @State private var bundledPresented = false
    @State private var bundledActivationPending = false
    @State private var bundledActivating = false
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL
    #if DEBUG
    @State private var readerTestPresented = false
    #endif

    private var articles: [LibraryArticle] {
        let ordered = store.orderedListedArticles
        let scoped: [LibraryArticle]
        if let selectedChapterID {
            let ids = Set(store.learningIndex?.chapters.first(where: { $0.id == selectedChapterID })?.article_ids ?? [])
            scoped = ordered.filter { ids.contains($0.id) }
        } else { scoped = ordered }
        return filter.articles(in: scoped, bookmarks: store.bookmarks, articleTags: store.learningIndex?.article_tags ?? [:],
                               searchIndex: store.searchIndex)
    }

    private var isFiltering: Bool { filter.isActive || selectedChapterID != nil }
    private var isBusy: Bool { store.isLoading || bundledPreviewing || bundledActivating }

    private var searchQuery: String? {
        LibrarySearch.normalizedTerms(filter.query).isEmpty ? nil : filter.query
    }

    private var filterSummary: String {
        var conditions: [String] = []
        if let selectedChapterID {
            let chapter = store.learningIndex?.chapters.first(where: { $0.id == selectedChapterID })
            conditions.append("章: " + (chapter.map(NativeLearningNavigation.chapterTitle) ?? "選択した章"))
        }
        if let category = filter.category { conditions.append("章: \(category)") }
        if let level = filter.level { conditions.append("難易度: \(level)") }
        if let tag = filter.tag { conditions.append("タグ: \(tag)") }
        if filter.bookmarksOnly { conditions.append("しおり") }
        if searchQuery != nil { conditions.append("検索: \(filter.query)") }
        return conditions.joined(separator: "、")
    }

    private func clearFilters() { filter.reset(); selectedChapterID = nil }

    @ViewBuilder private var filterMenu: some View {
        if let index = store.learningIndex {
            Picker("章", selection: $selectedChapterID) {
                Text("すべての章").tag(String?.none)
                ForEach(index.chapters) { chapter in
                    Text(NativeLearningNavigation.chapterTitle(chapter)).tag(Optional(chapter.id))
                }
            }
            Button("タグを選ぶ") { tagPresented = true }
        } else {
            Picker("章", selection: $filter.category) {
                Text("すべての章").tag(String?.none)
                ForEach(LibraryArticleFilter.categories(in: store.listedArticles), id: \.self) { category in
                    Text(category).tag(Optional(category))
                }
            }
        }
        Picker("難易度", selection: $filter.level) {
            Text("すべての難易度").tag(String?.none)
            ForEach(LibraryArticleFilter.levels(in: store.listedArticles), id: \.self) { level in
                Text(level).tag(Optional(level))
            }
        }
        if isFiltering {
            Button("絞り込みをすべて解除", systemImage: "line.3.horizontal.decrease.circle") { clearFilters() }
        }
    }

    var body: some View {
        NavigationStack(path: $path) {
            List {
                if store.learningIndex != nil {
                    Section {
                        Button { learningPresented = .guide } label: { Label("学習ガイド", systemImage: "map") }
                            .accessibilityIdentifier("library-learning-guide")
                        Button { tagPresented = true } label: {
                            Label(filter.tag.map { "タグ: " + $0 } ?? "タグで絞り込む", systemImage: "tag")
                        }
                        .accessibilityIdentifier("library-tag-filter")
                        .accessibilityValue(filter.tag ?? "すべてのタグ")
                    }
                } else if store.learningError != nil {
                    Section("学習ガイドを読み込めません") {
                        Text("学習ルートと用語集の情報を確認できませんでした。").font(.callout)
                        Text("記事本文は引き続き読めます。").font(.callout).foregroundStyle(.secondary)
                        Button("学習ガイドを再試行") { Task { await store.retryLoad() } }
                    }
                }
                if isFiltering {
                    Section("絞り込み中") {
                        Text(filterSummary).font(.subheadline)
                            .accessibilityIdentifier("library-filter-summary")
                        Button("絞り込みをすべて解除") { clearFilters() }
                            .accessibilityIdentifier("library-clear-filters")
                    }
                }
                if let last = store.listedArticles.first(where: { $0.id == store.lastArticleID }), !isFiltering {
                    Section {
                        NavigationLink(value: ReaderRoute(articleID: last.id)) {
                            Label {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("続きを読む").font(.caption).foregroundStyle(.secondary)
                                    Text(last.title)
                                }
                            } icon: { Image(systemName: "book.pages") }
                        }
                        .accessibilityIdentifier("library-resume")
                    }
                }
                Section {
                    ForEach(articles) { article in
                        NavigationLink(value: ReaderRoute(articleID: article.id, searchQuery: searchQuery)) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text(article.title).font(.headline)
                                Text(article.summary).font(.subheadline).foregroundStyle(.secondary).lineLimit(3)
                                HStack(alignment: .firstTextBaseline) {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("章: \(article.category)")
                                        Text("難易度: \(article.level)")
                                    }.font(.caption).foregroundStyle(.secondary)
                                    Spacer()
                                    if store.allowsAudioPlayback, article.audio_id != nil { Image(systemName: "headphones").accessibilityLabel("音声あり") }
                                    if store.bookmarks.contains(article.id) { Image(systemName: "bookmark.fill").accessibilityLabel("しおりあり") }
                                }
                            }.padding(.vertical, 4)
                        }
                        .accessibilityIdentifier("library-article-\(article.id)")
                    }
                } header: {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(filter.bookmarksOnly ? "しおり" : "記事")
                        if store.snapshot != nil {
                            Text("全\(store.listedArticles.count)記事")
                                .font(.caption).foregroundStyle(.secondary)
                                .accessibilityIdentifier("library-article-count")
                        }
                    }
                } footer: {
                    if store.isTestLibrary {
                        Text("表示確認用の記事です。通常のしおりや読書位置とは別に保存します。")
                    } else if let snapshot = store.snapshot {
                        Text("\(articles.count)件表示・全\(snapshot.manifest.articles.count)記事・オフライン試作")
                    }
                }
            }
            .overlay {
                if isBusy { ProgressView(bundledActivating ? "同梱コンテンツへ切り替え中" : "コンテンツを確認中") }
                else if store.snapshot == nil {
                    if let error = store.loadError {
                        ContentUnavailableView {
                            Label("コンテンツを読み込めません", systemImage: "exclamationmark.triangle")
                        } description: {
                            Text(error)
                        } actions: {
                            Button("再試行") { Task { await store.retryLoad() } }
                        }
                    } else {
                        ProgressView("コンテンツを確認中")
                    }
                }
                else if articles.isEmpty {
                    ContentUnavailableView {
                        Label("記事が見つかりません", systemImage: filter.bookmarksOnly ? "bookmark" : "magnifyingglass")
                    } description: {
                        if isFiltering { Text("章・難易度・検索・しおり・タグの条件を変えてお試しください。") }
                    } actions: {
                        if isFiltering {
                            Button("絞り込みをすべて解除") { clearFilters() }
                                .accessibilityIdentifier("library-clear-empty-filters")
                        }
                    }
                }
            }
            .disabled(isBusy)
            .navigationTitle(store.isTestLibrary ? "本文表示テスト" : "AI Agent Library")
            .searchable(text: $filter.query, prompt: "記事の本文を検索")
            .toolbar {
                if store.isTestLibrary {
                    ToolbarItem(placement: .topBarLeading) {
                        Button("閉じる") { dismiss() }
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Menu { filterMenu } label: {
                        Image(systemName: selectedChapterID != nil || filter.category != nil || filter.level != nil || filter.tag != nil ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                    }
                    .accessibilityLabel("記事の絞り込み")
                    .accessibilityValue(filterSummary.isEmpty ? "すべての記事" : filterSummary)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button { filter.bookmarksOnly.toggle() } label: {
                        Image(systemName: filter.bookmarksOnly ? "bookmark.fill" : "bookmark")
                    }
                    .accessibilityLabel(filter.bookmarksOnly ? "しおりの絞り込みを解除" : "しおりの記事を表示")
                    .accessibilityAddTraits(filter.bookmarksOnly ? [.isSelected] : [])
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        if store.allowsContentImport {
                            Button("ファイルからコンテンツを更新", systemImage: "folder") { importPresented = true }
                        }
                        if store.allowsBundledContentActivation {
                            Button("同梱コンテンツへ切り替える", systemImage: "arrow.triangle.2.circlepath") {
                                previewBundledContent()
                            }
                            .accessibilityIdentifier("library-bundled-content")
                            .disabled(store.snapshot == nil || !path.isEmpty)
                        }
                        #if DEBUG
                        if !store.isTestLibrary {
                            Button("本文表示テスト", systemImage: "doc.text.magnifyingglass") { readerTestPresented = true }
                        }
                        #endif
                        Button("このアプリについて", systemImage: "info.circle") { aboutPresented = true }
                    } label: { Image(systemName: "ellipsis.circle") }
                    .accessibilityLabel("その他の操作")
                    .disabled(isBusy)
                }
            }
            .navigationDestination(for: ReaderRoute.self) { route in
                if let snapshot = store.snapshot, let article = snapshot.article(id: route.articleID) {
                    ArticleReaderView(store: store, snapshot: snapshot, article: article,
                                      initialHeading: route.heading, initialSearchQuery: route.searchQuery,
                                      navigate: { next in path.append(next) }, openLearningChapter: showChapter)
                } else {
                    ContentUnavailableView {
                        Label("記事を利用できません", systemImage: "doc.text")
                    } description: {
                        Text("現在のコンテンツには対象の記事がありません。記事一覧から選び直してください。")
                    } actions: {
                        Button("記事一覧へ戻る") { path.removeAll() }
                    }
                    .navigationTitle("記事を利用できません")
                }
            }
        }
        .task { await store.load() }
        .onChange(of: store.learningIndex == nil) { _, absent in
            if absent { selectedChapterID = nil; filter.tag = nil }
            else { filter.category = nil }
        }
        .sheet(isPresented: $tagPresented) {
            NativeTagPicker(tags: LibraryArticleFilter.tags(in: store.listedArticles,
                            articleTags: store.learningIndex?.article_tags ?? [:]), selection: $filter.tag)
        }
        .sheet(item: $learningPresented, onDismiss: dispatchLearningSelection) { presentation in
            if let index = store.learningIndex {
                NativeLearningSheet(index: index, presentation: presentation, select: selectLearningDestination)
            }
        }
        .sheet(isPresented: $bundledPresented, onDismiss: dispatchBundledActivation) {
            bundledContentConfirmation
        }
        .sheet(isPresented: $aboutPresented) { LibraryAboutView(snapshot: store.snapshot) }
        #if DEBUG
        .sheet(isPresented: $readerTestPresented) { ReaderTestLibrarySheet() }
        #endif
        .fileImporter(isPresented: $importPresented, allowedContentTypes: [.folder]) { result in
            switch result {
            case .success(let url): Task { await store.install(from: url) }
            case .failure(let error): store.message = error.localizedDescription
            }
        }
        .alert("コンテンツ", isPresented: Binding(get: { store.message != nil }, set: { if !$0 { store.message = nil } })) {
            Button("閉じる", role: .cancel) { store.message = nil }
        } message: { Text(store.message ?? "") }
    }

    private func showChapter(_ id: String) {
        guard store.learningIndex?.chapters.contains(where: { $0.id == id }) == true else { return }
        clearFilters()
        selectedChapterID = id
        path.removeAll()
    }

    private func selectLearningDestination(_ destination: NativeLearningDestination) {
        if case .external(let url) = destination { openURL(url); return }
        pendingLearningDestination = destination
        learningPresented = nil
    }

    private func dispatchLearningSelection() {
        guard let destination = pendingLearningDestination else { return }
        pendingLearningDestination = nil
        switch destination {
        case .article(let route): path.append(route)
        case .chapter(let id): showChapter(id)
        case .external: break
        }
    }

    private func previewBundledContent() {
        guard store.allowsBundledContentActivation, store.snapshot != nil,
              path.isEmpty, learningPresented == nil, !tagPresented, !isBusy else { return }
        bundledPreviewing = true
        Task { @MainActor in
            let preview = await store.previewBundledContent()
            bundledPreviewing = false
            guard !Task.isCancelled, let preview else { return }
            bundledPreview = preview
            bundledPresented = true
        }
    }

    private var bundledContentConfirmation: some View {
        NavigationStack {
            Form {
                if let preview = bundledPreview {
                    Section("現在のコンテンツ") {
                        Text("記事数: \(preview.currentArticleCount)記事")
                            .accessibilityIdentifier("bundled-content-current-count")
                        VStack(alignment: .leading, spacing: 5) {
                            Text("版").font(.caption).foregroundStyle(.secondary)
                            Text(preview.currentRevision).font(.caption.monospaced()).textSelection(.enabled)
                        }
                    }
                    Section("このアプリの同梱コンテンツ") {
                        Text("記事数: \(preview.bundledArticleCount)記事")
                            .accessibilityIdentifier("bundled-content-bundled-count")
                        VStack(alignment: .leading, spacing: 5) {
                            Text("版").font(.caption).foregroundStyle(.secondary)
                            Text(preview.bundledRevision).font(.caption.monospaced()).textSelection(.enabled)
                        }
                        if preview.isAlreadyActive { Text("すでにこの同梱版と同じ内容を利用しています。").font(.callout) }
                    }
                    Section {
                        Text("しおりと読書位置を引き継ぎます。同梱版にない記事の保存記録も残ります。")
                        Text("一覧の検索・絞り込みは解除されます。")
                        Button("この同梱コンテンツを使う") {
                            bundledActivationPending = true
                            bundledActivating = true
                            bundledPresented = false
                        }
                        .accessibilityIdentifier("bundled-content-confirm")
                        .disabled(isBusy)
                    }
                }
            }
            .navigationTitle("同梱コンテンツ")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("キャンセル", role: .cancel) { bundledPresented = false }
                        .accessibilityIdentifier("bundled-content-cancel")
                        .disabled(bundledActivating)
                }
            }
        }
        .interactiveDismissDisabled(bundledActivating)
    }

    private func dispatchBundledActivation() {
        bundledPreview = nil
        guard bundledActivationPending else { return }
        bundledActivationPending = false
        // The confirmation has fully closed before activation can publish an
        // alert. Failure leaves the current navigation and list conditions intact.
        Task { @MainActor in
            let activated = await store.activateBundledContent()
            if activated {
                path.removeAll()
                clearFilters()
                pendingLearningDestination = nil
            }
            bundledActivating = false
        }
    }
}

#if DEBUG
private struct ReaderTestLibrarySheet: View {
    @State private var store: LibraryStore?
    @State private var didPrepare = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        Group {
            if let store {
                LibraryView(store: store)
            } else {
                NavigationStack {
                    Group {
                        if didPrepare {
                            ContentUnavailableView("本文表示テストを利用できません", systemImage: "doc.text",
                                description: Text("このアプリには本文表示テストの記事が含まれていません。"))
                        } else {
                            ProgressView("テスト記事を準備中")
                        }
                    }
                    .navigationTitle("本文表示テスト")
                    .toolbar { ToolbarItem(placement: .confirmationAction) { Button("閉じる") { dismiss() } } }
                }
            }
        }
        .task {
            guard !didPrepare else { return }
            store = LibraryStore.makeReaderTestStore()
            didPrepare = true
        }
    }
}
#endif

private struct LibraryAboutView: View {
    let snapshot: ContentSnapshot?
    @Environment(\.dismiss) private var dismiss

    private func license(_ path: String) -> String? {
        guard let root = snapshot?.root else { return nil }
        return try? String(contentsOf: root.appendingPathComponent(path), encoding: .utf8)
    }

    var body: some View {
        NavigationStack {
            List {
                Section("AI Agent Library") {
                    Text("ソフトウェアエンジニア向けAI Agent学習ライブラリのiOS試作です。本文・図・数式・検索を端末内で利用できます。")
                    if let snapshot = snapshot {
                        Text("コンテンツ版: \(snapshot.manifest.revision)").font(.caption).textSelection(.enabled)
                    }
                    Link("記事の原本とプロジェクト", destination: URL(string: "https://github.com/pero3dev/ai-agent-library")!)
                }
                Section("データと通信") {
                    Text("しおり、読書位置、音声の再生位置をこの端末に保存します。アカウント登録やアクセス解析、クラウド同期はありません。")
                    Text("音声の再生時はGitHubの配信先へ接続します。本文の外部リンクはSafariで開きます。コンテンツ更新は選択したフォルダだけを読み込みます。")
                }
                Section("記事・コードのライセンス") {
                    Text("記事: AI Agent Library contributors / CC BY 4.0。アプリ用に構造化データへ変換し、SwiftUIで表示しています。図・数式はビルド時に画像化しています。")
                    Link("CC BY 4.0 ライセンス", destination: URL(string: "https://creativecommons.org/licenses/by/4.0/")!)
                    if let text = license("assets/licenses/NOTICE.txt") {
                        DisclosureGroup("記事・コードのライセンス全文") { Text(text).font(.footnote).textSelection(.enabled) }
                    } else {
                        Text("Code: MIT License. Copyright (c) 2026 AI Agent Library contributors").font(.footnote)
                    }
                }
                Section("KaTeX") {
                    if let text = license("assets/katex/LICENSE.txt") {
                        DisclosureGroup("KaTeXライセンス全文") { Text(text).font(.footnote).textSelection(.enabled) }
                    }
                    Link("KaTeX プロジェクト", destination: URL(string: "https://katex.org/")!)
                }
                Section("Mermaid") {
                    if let text = license("assets/licenses/Mermaid-LICENSE.txt") {
                        DisclosureGroup("Mermaidライセンス全文") { Text(text).font(.footnote).textSelection(.enabled) }
                    }
                    Link("Mermaid プロジェクト", destination: URL(string: "https://mermaid.js.org/")!)
                }
            }
            .navigationTitle("このアプリについて")
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("閉じる") { dismiss() } } }
        }
    }
}
