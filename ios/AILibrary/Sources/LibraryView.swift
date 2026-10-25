import SwiftUI
import UniformTypeIdentifiers

struct LibraryView: View {
    @ObservedObject var store: LibraryStore
    @State private var filter = LibraryArticleFilter()
    @State private var importPresented = false
    @State private var aboutPresented = false
    @State private var path: [ReaderRoute] = []
    @Environment(\.dismiss) private var dismiss
    #if DEBUG
    @State private var readerTestPresented = false
    #endif

    private var articles: [LibraryArticle] {
        filter.articles(in: store.listedArticles, bookmarks: store.bookmarks)
    }

    private var searchQuery: String? {
        LibrarySearch.normalizedTerms(filter.query).isEmpty ? nil : filter.query
    }

    private var filterSummary: String {
        var conditions: [String] = []
        if let category = filter.category { conditions.append("章: \(category)") }
        if let level = filter.level { conditions.append("難易度: \(level)") }
        if filter.bookmarksOnly { conditions.append("しおり") }
        if searchQuery != nil { conditions.append("検索: \(filter.query)") }
        return conditions.joined(separator: "、")
    }

    private func clearFilters() { filter.reset() }

    @ViewBuilder private var filterMenu: some View {
        Picker("章", selection: $filter.category) {
            Text("すべての章").tag(String?.none)
            ForEach(LibraryArticleFilter.categories(in: store.listedArticles), id: \.self) { category in
                Text(category).tag(Optional(category))
            }
        }
        Picker("難易度", selection: $filter.level) {
            Text("すべての難易度").tag(String?.none)
            ForEach(LibraryArticleFilter.levels(in: store.listedArticles), id: \.self) { level in
                Text(level).tag(Optional(level))
            }
        }
        if filter.isActive {
            Button("絞り込みをすべて解除", systemImage: "line.3.horizontal.decrease.circle") { clearFilters() }
        }
    }

    var body: some View {
        NavigationStack(path: $path) {
            List {
                if filter.isActive {
                    Section("絞り込み中") {
                        Text(filterSummary).font(.subheadline)
                        Button("絞り込みをすべて解除") { clearFilters() }
                    }
                }
                if let last = store.listedArticles.first(where: { $0.id == store.lastArticleID }), !filter.isActive {
                    Section {
                        NavigationLink(value: ReaderRoute(articleID: last.id)) {
                            Label {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("続きを読む").font(.caption).foregroundStyle(.secondary)
                                    Text(last.title)
                                }
                            } icon: { Image(systemName: "book.pages") }
                        }
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
                    }
                } header: {
                    Text(filter.bookmarksOnly ? "しおり" : "記事")
                } footer: {
                    if store.isTestLibrary {
                        Text("表示確認用の記事です。通常のしおりや読書位置とは別に保存します。")
                    } else if let snapshot = store.snapshot {
                        Text("\(articles.count)件表示・全\(snapshot.manifest.articles.count)記事・オフライン試作")
                    }
                }
            }
            .overlay {
                if store.isLoading { ProgressView("コンテンツを確認中") }
                else if articles.isEmpty {
                    ContentUnavailableView {
                        Label("記事が見つかりません", systemImage: filter.bookmarksOnly ? "bookmark" : "magnifyingglass")
                    } description: {
                        if filter.isActive { Text("章・難易度・検索・しおりの条件を変えてお試しください。") }
                    } actions: {
                        if filter.isActive { Button("絞り込みをすべて解除") { clearFilters() } }
                    }
                }
            }
            .disabled(store.isLoading)
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
                        Image(systemName: filter.category != nil || filter.level != nil ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
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
                        #if DEBUG
                        if !store.isTestLibrary {
                            Button("本文表示テスト", systemImage: "doc.text.magnifyingglass") { readerTestPresented = true }
                        }
                        #endif
                        Button("このアプリについて", systemImage: "info.circle") { aboutPresented = true }
                    } label: { Image(systemName: "ellipsis.circle") }
                    .accessibilityLabel("その他の操作")
                    .disabled(store.isLoading)
                }
            }
            .navigationDestination(for: ReaderRoute.self) { route in
                if let snapshot = store.snapshot, let article = snapshot.article(id: route.articleID) {
                    ArticleReaderView(store: store, snapshot: snapshot, article: article,
                                      initialHeading: route.heading, initialSearchQuery: route.searchQuery) { next in path.append(next) }
                }
            }
        }
        .task { await store.load() }
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
