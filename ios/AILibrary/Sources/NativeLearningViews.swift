import Foundation

enum NativeGlossaryDestination: Hashable {
    case list
    case term(String)
}

enum NativeLearningDestination: Hashable {
    case article(ReaderRoute)
    case chapter(String)
    case external(URL)
}

/// Navigation decisions are independent of presentation. Callers provide term IDs
/// only from the optional index accepted for the current content snapshot.
enum NativeLearningNavigation {
    static func glossaryDestination(for url: URL, termIDs: Set<String>?) -> NativeGlossaryDestination? {
        guard let termIDs, let parts = URLComponents(url: url, resolvingAgainstBaseURL: false),
              parts.scheme?.lowercased() == "https", parts.host?.lowercased() == "pero3dev.github.io",
              parts.port == nil, parts.user == nil, parts.password == nil,
              parts.percentEncodedPath == "/ai-agent-library/glossary", parts.query == nil else { return nil }
        guard let fragment = parts.fragment, !fragment.isEmpty else { return .list }
        return termIDs.contains(fragment) ? .term(fragment) : nil
    }

    static func chapterID(for url: URL, chapterIDs: Set<String>?) -> String? {
        guard let chapterIDs, let parts = URLComponents(url: url, resolvingAgainstBaseURL: false),
              parts.scheme?.lowercased() == "https", parts.host?.lowercased() == "pero3dev.github.io",
              parts.port == nil, parts.user == nil, parts.password == nil, parts.query == nil,
              parts.fragment == nil || parts.fragment == "" else { return nil }
        // The producer maps NN-slug/README.md to /docs/slug. Only an exact,
        // unambiguous chapter in this snapshot can use the local guide.
        let matches = chapterIDs.filter { id in
            parts.percentEncodedPath == "/ai-agent-library/docs/" + String(id.dropFirst(3))
        }
        return matches.count == 1 ? matches.first : nil
    }

    static func destination(for target: NativeLearningTarget) -> NativeLearningDestination? {
        switch target {
        case .article(let id, let heading):
            return .article(ReaderRoute(articleID: id, heading: heading))
        case .chapter(let id): return .chapter(id)
        case .external(let value):
            guard let parts = URLComponents(string: value), parts.scheme == "https",
                  let host = parts.host, !host.isEmpty, parts.user == nil, parts.password == nil,
                  let url = parts.url else { return nil }
            return .external(url)
        }
    }

    static func chapterTitle(_ chapter: NativeLearningChapter) -> String {
        let prefix = chapter.id + " — "
        let title = chapter.title.hasPrefix(prefix) ? String(chapter.title.dropFirst(prefix.count)) : chapter.title
        return String(chapter.id.prefix(2)) + " " + title
    }

    static func terms(_ terms: [NativeLearningTerm], matching query: String) -> [NativeLearningTerm] {
        let words = LibrarySearch.normalizedTerms(query)
        guard !words.isEmpty else { return terms }
        return terms.filter { term in
            let text = LibrarySearch.normalize([term.name, term.english ?? "", term.summary].joined(separator: " "))
            return words.allSatisfy { text.contains($0) }
        }
    }
}

#if canImport(SwiftUI)
import SwiftUI

enum NativeLearningPresentation: Identifiable {
    case guide
    case glossary(NativeGlossaryDestination)
    case chapter(String)

    var id: String {
        switch self {
        case .guide: return "guide"
        case .glossary(.list): return "glossary"
        case .glossary(.term(let id)): return "term:" + id
        case .chapter(let id): return "chapter:" + id
        }
    }
}

struct NativeTagPicker: View {
    let tags: [String]
    @Binding var selection: String?
    @State private var query = ""
    @Environment(\.dismiss) private var dismiss

    private var matchingTags: [String] {
        let words = LibrarySearch.normalizedTerms(query)
        return tags.filter { tag in words.allSatisfy { LibrarySearch.normalize(tag).contains($0) } }
    }

    var body: some View {
        NavigationStack {
            List {
                Button("すべてのタグ") { selection = nil; dismiss() }
                    .accessibilityAddTraits(selection == nil ? .isSelected : [])
                ForEach(matchingTags, id: \.self) { tag in
                    Button { selection = tag; dismiss() } label: {
                        HStack {
                            Text(tag)
                            Spacer()
                            if selection == tag { Image(systemName: "checkmark").accessibilityHidden(true) }
                        }
                    }
                    .accessibilityIdentifier("learning-tag-" + tag)
                    .accessibilityAddTraits(selection == tag ? .isSelected : [])
                }
                if matchingTags.isEmpty { Text("一致するタグがありません").foregroundStyle(.secondary) }
            }
            .navigationTitle("タグ")
            .searchable(text: $query, prompt: "タグを検索")
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("閉じる") { dismiss() } } }
        }
        .accessibilityIdentifier("learning-tag-picker")
    }
}

struct NativeLearningSheet: View {
    let index: NativeLearningIndex
    let presentation: NativeLearningPresentation
    let select: (NativeLearningDestination) -> Void
    var articles: [LibraryArticle] = []
    /// Root-library chapter actions retain their filter behavior. Reader sheets
    /// keep chapter navigation here so closing them preserves the source reader.
    var chapterNavigationInSheet = false
    @State private var chapterPath: [String] = []
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack(path: $chapterPath) {
            Group {
                switch presentation {
                case .guide: guide
                case .glossary(.list): NativeGlossaryList(index: index, select: choose)
                case .glossary(.term(let id)):
                    if let term = index.glossary.first(where: { $0.id == id }) {
                        NativeGlossaryTerm(term: term, index: index, select: choose)
                    } else { NativeGlossaryList(index: index, select: choose) }
                case .chapter(let id): chapterGuide(id)
                }
            }
            .navigationDestination(for: String.self) { id in chapterGuide(id) }
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("閉じる") { dismiss() } } }
        }
    }

    private var guide: some View {
        List {
            Section {
                NavigationLink {
                    NativeGlossaryList(index: index, select: choose)
                } label: { Label("用語集", systemImage: "character.book.closed") }
                .accessibilityIdentifier("learning-open-glossary")
            }
            Section("学習ルート") {
                ForEach(index.routes) { route in
                    NavigationLink {
                        NativeLearningRouteView(route: route, index: index, select: choose)
                    } label: {
                        VStack(alignment: .leading, spacing: 5) {
                            Text("\(route.id) \(route.label)").font(.headline)
                            Text(route.persona).font(.subheadline).foregroundStyle(.secondary)
                        }
                    }
                    .accessibilityIdentifier("learning-route-" + route.id)
                }
            }
            Section("章から選ぶ") {
                ForEach(index.chapters) { chapter in
                    Button { choose(.chapter(chapter.id)) } label: {
                        VStack(alignment: .leading, spacing: 5) {
                            Text(NativeLearningNavigation.chapterTitle(chapter)).font(.headline)
                            Text(chapter.description).font(.subheadline).foregroundStyle(.secondary)
                        }
                    }
                    .accessibilityIdentifier("learning-chapter-" + chapter.id)
                }
            }
        }
        .navigationTitle("学習ガイド")
    }

    @ViewBuilder private func chapterGuide(_ id: String) -> some View {
        if let chapter = index.chapters.first(where: { $0.id == id }) {
            NativeChapterGuide(chapter: chapter, articles: articles, select: choose)
        } else {
            ContentUnavailableView("章を利用できません", systemImage: "books.vertical",
                                   description: Text("学習ガイドから選び直してください。"))
        }
    }

    private func choose(_ destination: NativeLearningDestination) {
        if chapterNavigationInSheet, case .chapter(let id) = destination,
           index.chapters.contains(where: { $0.id == id }) {
            chapterPath.append(id)
        } else { select(destination) }
    }
}

private struct NativeChapterGuide: View {
    let chapter: NativeLearningChapter
    let articles: [LibraryArticle]
    let select: (NativeLearningDestination) -> Void

    private var orderedArticles: [LibraryArticle] {
        let ids = Set(chapter.article_ids)
        return LibraryArticleOrder.ordered(articles.filter { ids.contains($0.id) }, articleIDs: chapter.article_ids)
    }

    var body: some View {
        List {
            Section {
                Text(chapter.description).textSelection(.enabled)
                    .accessibilityIdentifier("learning-chapter-description")
            }
            Section("この章の記事") {
                ForEach(orderedArticles) { article in
                    Button { select(.article(ReaderRoute(articleID: article.id))) } label: {
                        VStack(alignment: .leading, spacing: 5) {
                            Text(article.title).font(.headline)
                            Text(article.summary).font(.subheadline).foregroundStyle(.secondary)
                        }
                    }
                    .accessibilityIdentifier("learning-chapter-article-" + article.id)
                }
            }
        }
        .navigationTitle(NativeLearningNavigation.chapterTitle(chapter))
    }
}

private struct NativeLearningTargetButton: View {
    let label: String
    let target: NativeLearningTarget
    let select: (NativeLearningDestination) -> Void

    var body: some View {
        Button {
            if let destination = NativeLearningNavigation.destination(for: target) { select(destination) }
        } label: {
            switch target {
            case .external: Label(label + "（外部サイト）", systemImage: "arrow.up.right.square")
            case .chapter: Label(label, systemImage: "books.vertical")
            case .article: Label(label, systemImage: "doc.text")
            }
        }
    }
}

private struct NativeLearningRouteView: View {
    let route: NativeLearningRoute
    let index: NativeLearningIndex
    let select: (NativeLearningDestination) -> Void

    private func label(_ text: String, target: NativeLearningTarget) -> String {
        if case .chapter(let id) = target, let chapter = index.chapters.first(where: { $0.id == id }) {
            return NativeLearningNavigation.chapterTitle(chapter)
        }
        return text
    }

    private func instruction(_ step: NativeLearningStep) -> String {
        step.inlines.map { inline in
            switch inline {
            case .text(let text): return text
            case .link(let text, let target): return label(text, target: target)
            }
        }.joined()
    }

    var body: some View {
        List {
            Section { Text(route.persona).textSelection(.enabled) }
            ForEach(Array(route.steps.enumerated()), id: \.offset) { number, step in
                Section("ステップ \(number + 1)") {
                    if step.inlines.contains(where: { if case .text(let text) = $0 { return !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }; return false }) {
                        Text(instruction(step)).textSelection(.enabled)
                            .accessibilityIdentifier("learning-route-\(route.id)-instruction-\(number + 1)")
                    }
                    ForEach(Array(step.inlines.enumerated()), id: \.offset) { offset, inline in
                        if case .link(let text, let target) = inline {
                            NativeLearningTargetButton(label: label(text, target: target), target: target, select: select)
                                .accessibilityIdentifier("learning-route-\(route.id)-step-\(number + 1)-link-\(offset)")
                        }
                    }
                }
            }
        }
        .navigationTitle("学習ルート \(route.id)")
    }
}

private struct NativeGlossaryList: View {
    let index: NativeLearningIndex
    let select: (NativeLearningDestination) -> Void
    @State private var query = ""

    private var terms: [NativeLearningTerm] { NativeLearningNavigation.terms(index.glossary, matching: query) }

    var body: some View {
        List {
            ForEach(terms) { term in
                NavigationLink {
                    NativeGlossaryTerm(term: term, index: index, select: select)
                } label: {
                    VStack(alignment: .leading, spacing: 5) {
                        Text(term.name).font(.headline)
                        if let english = term.english { Text(english).font(.subheadline).foregroundStyle(.secondary) }
                    }
                }
                .accessibilityIdentifier("learning-term-" + term.id)
            }
        }
        .overlay {
            if terms.isEmpty {
                ContentUnavailableView {
                    Label("用語が見つかりません", systemImage: "magnifyingglass")
                } actions: { Button("検索をクリア") { query = "" } }
            }
        }
        .searchable(text: $query, prompt: "用語・英語名・定義を検索")
        .navigationTitle("用語集")
    }
}

private struct NativeGlossaryTerm: View {
    let term: NativeLearningTerm
    let index: NativeLearningIndex
    let select: (NativeLearningDestination) -> Void

    private func label(_ link: NativeLearningLink) -> String {
        if case .chapter(let id) = link.target, let chapter = index.chapters.first(where: { $0.id == id }) {
            return NativeLearningNavigation.chapterTitle(chapter)
        }
        return link.label
    }

    var body: some View {
        List {
            Section {
                if let english = term.english { Text(english).foregroundStyle(.secondary) }
                Text(term.summary).textSelection(.enabled)
                    .accessibilityIdentifier("learning-term-definition")
            }
            if !term.links.isEmpty {
                Section("関連する記事・資料") {
                    ForEach(Array(term.links.enumerated()), id: \.offset) { number, link in
                        NativeLearningTargetButton(label: label(link), target: link.target, select: select)
                            .accessibilityIdentifier("learning-related-\(number)")
                    }
                }
            }
        }
        .navigationTitle(term.name)
    }
}
#endif
