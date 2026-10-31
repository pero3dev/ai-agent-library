import SwiftUI
import UIKit
import UniformTypeIdentifiers

/// Validated JSON data for backup exports; importing is handled by the restore engine.
private struct ReadingBackupFile: FileDocument {
    static var readableContentTypes: [UTType] { [.json] }
    let data: Data
    init(data: Data) { self.data = data }
    init(configuration: ReadConfiguration) throws {
        guard let contents = configuration.file.regularFileContents else { throw ReadingBackupCodec.Failure.invalid }
        _ = try ReadingBackupCodec.decode(contents)
        data = contents
    }
    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper {
        FileWrapper(regularFileWithContents: data)
    }
}

struct LibraryView: View {
    @ObservedObject var store: LibraryStore
    @State private var filter = LibraryArticleFilter()
    @State private var importPresented = false
    @State private var readingBackupPresented = false
    @State private var readingBackupFile: ReadingBackupFile?
    @State private var readingBackupMessage: String?
    @State private var readingRestorePresented = false
    @State private var aboutPresented = false
    @State private var readingRecoveryPresented = false
    @State private var moreActionsPresented = false
    @State private var pendingMoreAction: MoreAction?
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

    private enum MoreAction {
        case importContent, bundledContent, exportReadingBackup, restoreReadingBackup, about
        #if DEBUG
        case readerTest
        #endif
    }

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

    @ViewBuilder private func moreActions(inSheet: Bool = false) -> some View {
        if store.allowsContentImport {
            Button("ファイルからコンテンツを更新", systemImage: "folder") {
                selectMoreAction(.importContent, inSheet: inSheet)
            }
        }
        if store.allowsBundledContentActivation {
            Button("同梱コンテンツへ切り替える", systemImage: "arrow.triangle.2.circlepath") {
                selectMoreAction(.bundledContent, inSheet: inSheet)
            }
            .accessibilityIdentifier("library-bundled-content")
            .disabled(store.snapshot == nil || !path.isEmpty)
        }
        if store.allowsReadingBackup {
            Button("読書記録を書き出す", systemImage: "square.and.arrow.up") {
                selectMoreAction(.exportReadingBackup, inSheet: inSheet)
            }
            .accessibilityIdentifier("library-export-reading")
            .disabled(store.readingSaveSuspended)
        }
        if store.allowsReadingRestore {
            Button("読書記録を復元", systemImage: "arrow.counterclockwise") {
                selectMoreAction(.restoreReadingBackup, inSheet: inSheet)
            }
            .accessibilityIdentifier("library-restore-reading")
            .disabled(!path.isEmpty)
        }
        #if DEBUG
        if !store.isTestLibrary {
            Button("本文表示テスト", systemImage: "doc.text.magnifyingglass") {
                selectMoreAction(.readerTest, inSheet: inSheet)
            }
        }
        #endif
        Button("このアプリについて", systemImage: "info.circle") {
            selectMoreAction(.about, inSheet: inSheet)
        }
    }

    private var moreActionsSheet: some View {
        NavigationStack {
            List { moreActions(inSheet: true) }
                .disabled(isBusy)
                .navigationTitle("その他の操作")
                .toolbar {
                    ToolbarItem(placement: .confirmationAction) {
                        Button("閉じる") { moreActionsPresented = false }
                    }
                }
        }
    }

    private func selectMoreAction(_ action: MoreAction, inSheet: Bool) {
        if inSheet {
            pendingMoreAction = action
            moreActionsPresented = false
        } else {
            performMoreAction(action)
        }
    }

    private func dispatchMoreAction() {
        guard let action = pendingMoreAction else { return }
        pendingMoreAction = nil
        performMoreAction(action)
    }

    private func performMoreAction(_ action: MoreAction) {
        switch action {
        case .importContent: importPresented = true
        case .bundledContent: previewBundledContent()
        case .exportReadingBackup:
            do {
                let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "unknown"
                readingBackupFile = ReadingBackupFile(data: try store.exportReadingBackup(createdAt: Date(), appVersion: version))
                readingBackupPresented = true
            } catch { readingBackupMessage = error.localizedDescription }
        case .restoreReadingBackup:
            guard path.isEmpty, store.allowsReadingRestore else { return }
            readingRestorePresented = true
        case .about: aboutPresented = true
        #if DEBUG
        case .readerTest: readerTestPresented = true
        #endif
        }
    }

    var body: some View {
        NavigationStack(path: $path) {
            List {
                if store.readingSaveSuspended {
                    Section("読書記録の保存を停止しています") {
                        Text("保存内容の変化を確認したため、しおりと読書位置の保存・編集を止めています。アプリを開き直して、保存されている読書記録を確認してください。")
                            .font(.callout)
                    }
                    .accessibilityIdentifier("library-reading-save-suspended")
                }
                if let issue = store.readingRecoveryIssue {
                    Section("読書記録の復旧が必要です") {
                        Text(issue.message).font(.callout)
                        Text("復旧するまで、今回のしおりや読書位置の変更はアプリ終了後に残りません。")
                            .font(.callout).foregroundStyle(.secondary)
                        if issue.canRecover {
                            Button("読み取れる記録で復旧") { readingRecoveryPresented = true }
                                .accessibilityIdentifier("library-reading-recovery")
                                .disabled(store.readingSaveSuspended)
                        }
                    }
                    .accessibilityIdentifier("library-reading-recovery-notice")
                }
                if let count = store.unavailableReadingArticleCount(isRestorePresented: readingRestorePresented), count > 0 {
                    Section("現在の記事版にない読書記録") {
                        Text("現在の記事版に含まれない\(count)記事分の記録を保管しています。")
                            .accessibilityIdentifier("library-unavailable-reading-count")
                        Text("その記事が再び含まれると、保存されている記録を利用できます。")
                            .font(.callout).foregroundStyle(.secondary)
                        Text("書き出す場合は「その他の操作」から「読書記録を書き出す」を選んでください。")
                            .font(.callout).foregroundStyle(.secondary)
                    }
                    .accessibilityIdentifier("library-unavailable-reading-notice")
                }
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
                        Button {
                            pendingMoreAction = nil
                            moreActionsPresented = true
                        } label: {
                            Label("その他の操作", systemImage: "ellipsis.circle")
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .contentShape(Rectangle())
                        }
                            .accessibilityLabel("その他の操作")
                            .disabled(isBusy)
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
                        Text("\(articles.count)件表示・全\(snapshot.manifest.articles.count)記事・オフライン閲覧")
                    }
                }
                if store.snapshot != nil, articles.isEmpty {
                    Section {
                        Label("記事が見つかりません", systemImage: filter.bookmarksOnly ? "bookmark" : "magnifyingglass")
                            .font(.headline)
                        if isFiltering {
                            Text("章・難易度・検索・しおり・タグの条件を変えてお試しください。")
                            Button("絞り込みをすべて解除") { clearFilters() }
                                .accessibilityIdentifier("library-clear-empty-filters")
                        }
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
                if !isFiltering {
                    ToolbarItem(placement: .topBarTrailing) {
                        Menu { moreActions() } label: { Image(systemName: "ellipsis.circle") }
                            .accessibilityLabel("その他の操作")
                            .disabled(isBusy)
                    }
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
        .confirmationDialog("読み取れる記録で復旧しますか？", isPresented: $readingRecoveryPresented,
                            titleVisibility: .visible) {
            Button("復旧して記録の保存を再開") { store.recoverReadingState() }
            Button("キャンセル", role: .cancel) {}
        } message: {
            Text("元の保存データを端末内に退避してから、読み取れた記録と今回の変更を保存します。読み取れない記録は利用できません。")
        }
        .sheet(isPresented: $moreActionsPresented, onDismiss: dispatchMoreAction) { moreActionsSheet }
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
        .sheet(isPresented: $readingRestorePresented) { ReadingRestoreCenter(store: store, isPresented: $readingRestorePresented) }
        #if DEBUG
        .sheet(isPresented: $readerTestPresented) { ReaderTestLibrarySheet() }
        #endif
        .fileImporter(isPresented: $importPresented, allowedContentTypes: [.folder]) { result in
            switch result {
            case .success(let url): Task { await store.install(from: url) }
            case .failure(let error): store.message = error.localizedDescription
            }
        }
        .fileExporter(isPresented: $readingBackupPresented, document: readingBackupFile, contentType: .json,
                      defaultFilename: "AI-Agent-Library-Reading-Backup") { result in
            if case .failure(let error) = result {
                let failure = error as NSError
                if failure.domain != NSCocoaErrorDomain || failure.code != NSUserCancelledError {
                    readingBackupMessage = "読書記録を書き出せませんでした。元の記録は変更していません。 " + error.localizedDescription
                }
            }
            readingBackupFile = nil
        }
        .alert("読書記録", isPresented: Binding(get: { readingBackupMessage != nil },
                                            set: { if !$0 { readingBackupMessage = nil } })) {
            Button("閉じる", role: .cancel) { readingBackupMessage = nil }
        } message: { Text(readingBackupMessage ?? "") }
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
    @State private var copiedDiagnostics = false

    private var appVersion: String? { Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String }
    private var appBuild: String? { Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String }

    private func copyDiagnostics() {
        let report = LibraryDiagnostics.report(appVersion: appVersion, buildNumber: appBuild, manifest: snapshot?.manifest)
        UIPasteboard.general.string = report.text
        copiedDiagnostics = true
        UIAccessibility.post(notification: .announcement, argument: "診断情報をコピーしました")
    }

    private func license(_ path: String) -> String? {
        guard let root = snapshot?.root else { return nil }
        return try? String(contentsOf: root.appendingPathComponent(path), encoding: .utf8)
    }

    var body: some View {
        NavigationStack {
            List {
                Section("AI Agent Library") {
                    Text("ソフトウェアエンジニア向けAI Agent学習ライブラリのiOS版です。本文・図・数式・検索を端末内で利用できます。")
                    Text(LibraryDiagnostics.versionLabel(appVersion: appVersion, buildNumber: appBuild))
                        .font(.caption)
                        .accessibilityIdentifier("library-about-app-version")
                    if let snapshot = snapshot {
                        Text("コンテンツ版: \(snapshot.manifest.revision)").font(.caption).textSelection(.enabled)
                    }
                    Link("記事の原本とプロジェクト", destination: URL(string: "https://github.com/pero3dev/ai-agent-library")!)
                }
                Section("診断情報") {
                    Button(action: copyDiagnostics) {
                        Label(copiedDiagnostics ? "診断情報をコピーしました" : "診断情報をコピー",
                              systemImage: copiedDiagnostics ? "checkmark" : "doc.on.doc")
                    }
                    .accessibilityIdentifier("library-copy-diagnostics")
                    .accessibilityLabel("診断情報をコピー")
                    .accessibilityValue(copiedDiagnostics ? "コピー済み" : "未コピー")
                    Text("コピーには読書記録や端末情報を含めません。")
                        .font(.footnote)
                }
                Section("データと通信") {
                    Text("本文・図・数式は端末内で表示し、しおり・読書位置・音声の再生位置や設定を端末内に保存します。アカウント登録はありません。")
                    Text("音声の再生時はGitHubの配信先へ、外部リンクを開くとリンク先へ通信します。外部リンクはiOSが選ぶブラウザや対応アプリで開きます。通信先での接続情報の扱いは各サービスの方針によります。")
                    Text("読書バックアップは、しおりや読書位置を含む暗号化されていないJSONです。音声の再生位置や設定は含みません。")
                    Text("記事を取り込むときは、選択したフォルダを読み込みます。")
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

/// Restore and retention management have their own presentation owner so the
/// content-folder importer and the ordinary backup exporter remain independent.
private struct ReadingRestoreCenter: View {
    @ObservedObject var store: LibraryStore
    @Binding var isPresented: Bool
    @Environment(\.dismiss) private var dismiss
    @State private var pickerPresented = false
    @State private var preview: ReadingStore.RestorePreview?
    @State private var retained: ReadingStore.RetainedRestoreBackup?
    @State private var retentionMessage: String?
    @State private var statusMessage: String?
    @State private var isReading = false
    @State private var selectionToken = UUID()
    @State private var readTask: Task<Data, Error>?
    @State private var completionTask: Task<Void, Never>?
    @State private var didLoadRetention = false
    @State private var confirmation: Confirmation?
    @State private var exportPresented = false
    @State private var exportFile: ReadingBackupFile?
    @State private var exportSnapshot: ReadingStore.RetainedRestoreBackup?
    @State private var releaseSnapshot: ReadingStore.RetainedRestoreBackup?
    @State private var exportCompleted = false
    @State private var personallyCheckedExport = false

    private enum Confirmation {
        case restore(ReadingStore.RestorePreview)
        case release(ReadingStore.RetainedRestoreBackup)
    }

    private var busy: Bool { isReading || pickerPresented || exportPresented }
    private var appVersion: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "unknown"
    }
    private var confirmationTitle: String {
        switch confirmation {
        case .some(.restore(_)): return "現在の読書記録を置き換えますか？"
        case .some(.release(_)): return "復元前の保全を削除しますか？"
        case .none: return "読書記録"
        }
    }

    var body: some View {
        NavigationStack {
            Form {
                if store.allowsReadingRestore {
                    if store.readingSaveSuspended {
                        Section("保存と編集を停止しています") {
                            Text("保存内容と編集中の記録の一致を確認できません。アプリを開き直して確認してください。保全した復元前データがある場合は、この画面から書き出せます。")
                        }
                        .accessibilityIdentifier("reading-restore-suspended")
                    }
                    Section("バックアップを選ぶ") {
                        Text("対象はしおり・読書位置・続きを読むの記録です。ファイルの内容を確認してから、現在の記録を置き換えます。")
                        Button("バックアップファイルを選ぶ", systemImage: "doc") { chooseFile() }
                            .accessibilityIdentifier("reading-restore-choose-file")
                            .disabled(busy)
                        if isReading {
                            ProgressView("ファイルを確認中")
                            Button("読み込みを取り消す", role: .cancel) { cancelRead() }
                                .accessibilityIdentifier("reading-restore-cancel-read")
                        }
                    }
                    if let preview { previewSection(preview) }
                    if let statusMessage {
                        Section("結果") {
                            Text(statusMessage).textSelection(.enabled)
                                .accessibilityIdentifier("reading-restore-result")
                        }
                    }
                    retentionSection
                } else {
                    Text("本文表示テストでは読書記録の復元を利用できません。")
                }
            }
            .accessibilityIdentifier("reading-restore-center")
            .navigationTitle("読書記録の復元")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("閉じる") { isPresented = false; cancelRead(); dismiss() }
                        .accessibilityIdentifier("reading-restore-close")
                        .disabled(pickerPresented || exportPresented)
                }
            }
        }
        .interactiveDismissDisabled(busy || confirmation != nil)
        .task {
            if !didLoadRetention { didLoadRetention = true; refreshRetention() }
        }
        .onDisappear { cancelRead() }
        .fileImporter(isPresented: $pickerPresented, allowedContentTypes: [.json]) { result in
            switch result {
            case .success(let url):
                if isPresented { beginRead(url) }
            case .failure(let error):
                if !isCancellation(error) { statusMessage = error.localizedDescription }
            }
        }
        .fileExporter(isPresented: $exportPresented, document: exportFile, contentType: .json,
                      defaultFilename: "AI-Agent-Library-Before-Restore") { result in
            switch result {
            case .success:
                // Keep the exact engine handle. A later external slot/current
                // change still makes release fail its own validation.
                releaseSnapshot = exportSnapshot
                exportCompleted = true
                personallyCheckedExport = false
                statusMessage = "書き出し操作が完了しました。保存先にファイルがあることを、ご自身で確認してください。"
            case .failure(let error):
                if !isCancellation(error) { statusMessage = error.localizedDescription }
            }
            exportFile = nil
            exportSnapshot = nil
        }
        .alert(confirmationTitle,
               isPresented: Binding(get: { confirmation != nil }, set: { if !$0 { confirmation = nil } }),
               presenting: confirmation) { value in
            switch value {
            case .restore(let target):
                Button(target.containsNoBookmarksOrPositions ? "しおり・読書位置0件で復元" : "この記録で復元する", role: .destructive) {
                    confirmation = nil
                    apply(target)
                }
                .accessibilityIdentifier("reading-restore-confirm")
            case .release(let snapshot):
                Button("復元前の保全を削除", role: .destructive) {
                    confirmation = nil
                    release(snapshot)
                }
                .accessibilityIdentifier("reading-restore-release-confirm")
            }
            Button("キャンセル", role: .cancel) { confirmation = nil }
        } message: { value in
            switch value {
            case .restore(let target):
                Text(target.containsNoBookmarksOrPositions
                     ? "このファイルのしおりと読書位置は0件です。現在の記録を、このファイルの内容へ置き換えます。復元前の保存データは端末内に保全します。"
                     : "現在の記録を、表示したバックアップの内容へ置き換えます。復元前の保存データは端末内に保全します。")
            case .release(let snapshot):
                Text(snapshot.beforeHasSavedData
                     ? "保存先のバックアップファイルを確認したうえで、端末内の復元前データを削除します。現在の読書記録は置き換えません。"
                     : "復元前は保存記録が未作成でした。その状態を示す端末内の保全を削除します。現在の読書記録は置き換えません。")
            }
        }
    }

    private func previewSection(_ target: ReadingStore.RestorePreview) -> some View {
        Section("選んだバックアップ") {
            LabeledContent("作成日時", value: displayDate(target.createdAt))
            LabeledContent("作成したアプリ", value: target.sourceAppVersion)
            LabeledContent("しおり", value: "\(target.counts.bookmarks)件")
            LabeledContent("読書位置", value: "\(target.counts.positions)件")
            if let current = target.currentCounts {
                Text("現在の保存記録: しおり\(current.bookmarks)件・読書位置\(current.positions)件")
            } else {
                Text("現在は保存記録がまだ作成されていません。")
            }
            if target.containsNoBookmarksOrPositions {
                Text("注意: このバックアップのしおりと読書位置は0件です。")
                    .foregroundStyle(.orange).font(.headline)
                    .accessibilityIdentifier("reading-restore-empty-warning")
            }
            Button("置き換える内容を確認") { confirmation = .restore(target) }
                .accessibilityIdentifier("reading-restore-review")
                .disabled(busy)
            Button("この選択を取り消す", role: .cancel) { preview = nil }
                .accessibilityIdentifier("reading-restore-cancel-preview")
                .disabled(busy)
        }
        .accessibilityIdentifier("reading-restore-preview")
    }

    @ViewBuilder private var retentionSection: some View {
        Section("復元前データの保全") {
            if let retained {
                LabeledContent("保全日時", value: displayDate(retained.createdAt))
                if let counts = retained.beforeCounts {
                    Text("しおり\(counts.bookmarks)件・読書位置\(counts.positions)件")
                }
                if retained.beforeHasSavedData {
                    Button("復元前の記録を書き出す", systemImage: "square.and.arrow.up") { export(retained) }
                        .accessibilityIdentifier("reading-restore-export-retained")
                        .disabled(busy)
                    Text("書き出した後、保存先にファイルがあることを確認してください。")
                    if exportCompleted {
                        Toggle("保存先のバックアップファイルを自分で確認しました", isOn: $personallyCheckedExport)
                            .accessibilityIdentifier("reading-restore-checked-export")
                    }
                } else {
                    Text("復元前は保存記録が未作成でした。書き出す読書記録はありません。")
                }
                Button("復元前の保全を削除", role: .destructive) {
                    let snapshot = retained.beforeHasSavedData ? releaseSnapshot : retained
                    if let snapshot { confirmation = .release(snapshot) }
                }
                .accessibilityIdentifier("reading-restore-release")
                .disabled(busy || store.readingSaveSuspended ||
                          (retained.beforeHasSavedData && (!exportCompleted || !personallyCheckedExport || releaseSnapshot == nil)))
            } else if let retentionMessage {
                Text(retentionMessage)
                    .accessibilityIdentifier("reading-restore-retention-error")
            } else {
                Text("保全した復元前データはありません。")
                    .accessibilityIdentifier("reading-restore-no-retained")
            }
            Button("保全の状態を読み直す") { refreshRetention() }
                .accessibilityIdentifier("reading-restore-refresh-retained")
                .disabled(busy)
        }
        .accessibilityIdentifier("reading-restore-retention")
    }

    private func chooseFile() {
        guard isPresented else { return }
        cancelRead()
        preview = nil
        statusMessage = nil
        pickerPresented = true
    }

    private func beginRead(_ url: URL) {
        guard isPresented else { return }
        cancelRead()
        preview = nil
        statusMessage = nil
        let token = UUID()
        selectionToken = token
        isReading = true
        let reader = Task.detached(priority: .userInitiated) { try ReadingBackupDocumentReader.read(from: url) }
        readTask = reader
        completionTask = Task { @MainActor in
            do {
                let data = try await reader.value
                guard !Task.isCancelled, isPresented, selectionToken == token else { return }
                preview = try store.previewReadingRestore(from: data)
            } catch {
                guard !Task.isCancelled, isPresented, selectionToken == token else { return }
                if !isCancellation(error) { statusMessage = error.localizedDescription }
            }
            guard selectionToken == token else { return }
            isReading = false
            readTask = nil
            completionTask = nil
        }
    }

    private func cancelRead() {
        selectionToken = UUID()
        readTask?.cancel()
        completionTask?.cancel()
        readTask = nil
        completionTask = nil
        isReading = false
    }

    private func apply(_ target: ReadingStore.RestorePreview) {
        guard isPresented else { return }
        do {
            try store.applyReadingRestore(target, backupCreatedAt: Date())
            statusMessage = "読書記録を復元しました。復元前の保存データを端末内に保全しています。"
        } catch { statusMessage = error.localizedDescription }
        preview = nil
        refreshRetention()
    }

    private func refreshRetention() {
        guard isPresented else { return }
        retained = nil
        retentionMessage = nil
        exportCompleted = false
        personallyCheckedExport = false
        releaseSnapshot = nil
        do { retained = try store.retainedReadingRestoreBackup() }
        catch { retentionMessage = error.localizedDescription }
    }

    private func export(_ retained: ReadingStore.RetainedRestoreBackup) {
        guard isPresented else { return }
        do {
            exportFile = ReadingBackupFile(data: try store.exportRetainedReadingRestoreBackup(retained, appVersion: appVersion))
            exportSnapshot = retained
            exportCompleted = false
            personallyCheckedExport = false
            releaseSnapshot = nil
            exportPresented = true
        } catch { statusMessage = error.localizedDescription }
    }

    private func release(_ retained: ReadingStore.RetainedRestoreBackup) {
        guard isPresented else { return }
        do {
            try store.releaseReadingRestoreBackup(retained)
            statusMessage = "復元前データの端末内での保全を削除しました。"
        } catch { statusMessage = error.localizedDescription }
        refreshRetention()
    }

    private func displayDate(_ value: String) -> String {
        guard let date = ISO8601DateFormatter().date(from: value) else { return value }
        return date.formatted(date: .abbreviated, time: .standard)
    }

    private func isCancellation(_ error: Error) -> Bool {
        if error is CancellationError { return true }
        let value = error as NSError
        return value.domain == NSCocoaErrorDomain && value.code == NSUserCancelledError
    }
}
