import SwiftUI
import UIKit

private struct NativeBlockFrames: PreferenceKey {
    static var defaultValue: [String: CGFloat] = [:]
    static func reduce(value: inout [String: CGFloat], nextValue: () -> [String: CGFloat]) {
        value.merge(nextValue(), uniquingKeysWith: { _, latest in latest })
    }
}

private struct NativeReadProgress {
    let heading: String?
    let blockID: String
    let fraction: Double
}

/// Fragment and TOC destinations are one-shot requests. A reader retained below
/// another article resumes its current block instead of replaying an old link.
struct NativeReaderNavigationState {
    private var initialHeadingConsumed = false
    private var consumedHeadingRequestID: UUID?

    func destination(document: NativeDocument, position: ReadingPosition, initialHeading: String?,
                     requestedHeading: String?, headingRequestID: UUID, currentBlockID: String?) -> (heading: String?, blockID: String?) {
        let requested = consumedHeadingRequestID == headingRequestID ? nil : requestedHeading
        let heading = requested ?? (initialHeadingConsumed ? nil : initialHeading)
        let blockID = heading.flatMap { document.topLevelBlockID(forHeading: $0) }
            ?? currentBlockID.flatMap { document.topLevelBlockID(containing: $0) }
            ?? position.blockID.flatMap { document.topLevelBlockID(containing: $0) }
            ?? position.heading.flatMap { document.topLevelBlockID(forHeading: $0) }
            ?? document.blocks.first?.id
        return (heading, blockID)
    }

    mutating func consume(headingRequestID: UUID) {
        initialHeadingConsumed = true
        consumedHeadingRequestID = headingRequestID
    }
}

struct NativeReaderView: View {
    let snapshot: ContentSnapshot
    let article: LibraryArticle
    let document: NativeDocument
    let position: ReadingPosition
    let initialHeading: String?
    let requestedHeading: String?
    let headingRequestID: UUID
    let onPosition: (String?, String?, Double) -> Void
    let navigate: (ReaderRoute) -> Void
    @ScaledMetric(relativeTo: .body) private var bodySize: CGFloat = 17
    @Environment(\.scenePhase) private var scenePhase
    @State private var restoring = true
    @State private var trackingReady = false
    @State private var currentBlockID: String?
    @State private var pendingProgress: NativeReadProgress?
    @State private var saveTask: Task<Void, Never>?
    @State private var navigationTask: Task<Void, Never>?
    @State private var restoreGeneration = UUID()
    @State private var navigationState = NativeReaderNavigationState()
    @AccessibilityFocusState(for: .voiceOver) private var focusedHeadingID: String?

    var body: some View {
        GeometryReader { viewport in
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 18) {
                        ForEach(document.blocks) { block in
                            NativeBlockView(block: block, snapshot: snapshot,
                                            fontScale: min(4, max(0.8, bodySize / 17)),
                                            availableWidth: max(1, viewport.size.width - 36),
                                            focusedHeading: $focusedHeadingID)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .id(block.id)
                                .background {
                                    GeometryReader { bounds in
                                        Color.clear.preference(key: NativeBlockFrames.self,
                                                               value: [block.id: bounds.frame(in: .named("native-article-scroll")).minY])
                                    }
                                }
                        }
                    }
                    .padding(.horizontal, 18)
                    .padding(.top, 20)
                    .padding(.bottom, 72)
                }
                .coordinateSpace(name: "native-article-scroll")
                .accessibilityIdentifier("native-reader")
                .task(id: document.source_sha256) { await restore(using: proxy) }
                .onChange(of: headingRequestID) { _, _ in
                    if let requestedHeading { jump(to: requestedHeading, using: proxy) }
                }
                .onPreferenceChange(NativeBlockFrames.self) { frames in
                    receive(frames, viewportHeight: viewport.size.height)
                }
                .environment(\.openURL, OpenURLAction { open($0, using: proxy) })
                .onChange(of: scenePhase) { _, phase in
                    if phase != .active { flushProgress() }
                }
                .onDisappear {
                    navigationTask?.cancel()
                    flushProgress()
                }
            }
        }
    }

    @MainActor private func restore(using proxy: ScrollViewProxy) async {
        let generation = UUID()
        restoreGeneration = generation
        restoring = true
        trackingReady = false
        let destination = navigationState.destination(document: document, position: position,
            initialHeading: initialHeading, requestedHeading: requestedHeading,
            headingRequestID: headingRequestID, currentBlockID: currentBlockID)
        let heading = destination.heading
        let target = destination.blockID
        // Lazy stacks discover row sizes as they appear. A second, nonanimated
        // placement after layout also handles long code and diagram blocks.
        try? await Task.sleep(for: .milliseconds(100))
        guard !Task.isCancelled, restoreGeneration == generation else { return }
        if let target {
            proxy.scrollTo(target, anchor: .top)
            currentBlockID = target
            pendingProgress = progress(for: target)
        }
        navigationState.consume(headingRequestID: headingRequestID)
        try? await Task.sleep(for: .milliseconds(250))
        guard !Task.isCancelled, restoreGeneration == generation else { return }
        if let target { proxy.scrollTo(target, anchor: .top) }
        try? await Task.sleep(for: .milliseconds(200))
        guard !Task.isCancelled, restoreGeneration == generation else { return }
        currentBlockID = target
        restoring = false
        trackingReady = true
        // A fragment is an explicit destination; resuming a saved position must
        // leave VoiceOver's current focus alone.
        if let heading, UIAccessibility.isVoiceOverRunning { focusedHeadingID = heading }
    }

    private func jump(to heading: String, using proxy: ScrollViewProxy) {
        guard let blockID = document.topLevelBlockID(forHeading: heading) else { return }
        move(to: blockID, heading: heading, using: proxy)
    }

    private func move(to blockID: String, heading: String? = nil, using proxy: ScrollViewProxy) {
        guard let progress = progress(for: blockID) else { return }
        restoreGeneration = UUID()
        navigationTask?.cancel()
        saveTask?.cancel()
        // A deliberate jump is already a new reading position. Retain it before
        // animation so leaving or backgrounding the reader can flush it at once.
        pendingProgress = progress
        currentBlockID = blockID
        navigationState.consume(headingRequestID: headingRequestID)
        restoring = true
        focusedHeadingID = nil
        withAnimation(.easeOut(duration: 0.2)) { proxy.scrollTo(blockID, anchor: .top) }
        navigationTask = Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(350))
            guard !Task.isCancelled else { return }
            currentBlockID = blockID
            restoring = false
            trackingReady = true
            if let heading, UIAccessibility.isVoiceOverRunning { focusedHeadingID = heading }
            flushProgress()
        }
    }

    private func receive(_ frames: [String: CGFloat], viewportHeight: CGFloat) {
        guard trackingReady, !restoring else { return }
        let visible = frames.filter { $0.value < viewportHeight }
        let above = visible.filter { $0.value <= 24 }.max { $0.value < $1.value }
        let next = above ?? visible.min { $0.value < $1.value }
        guard let next, currentBlockID != next.key else { return }
        currentBlockID = next.key
        enqueueProgress(for: next.key)
    }

    private func enqueueProgress(for blockID: String) {
        guard let progress = progress(for: blockID) else { return }
        pendingProgress = progress
        saveTask?.cancel()
        saveTask = Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(350))
            guard !Task.isCancelled else { return }
            flushProgress()
        }
    }

    private func progress(for blockID: String) -> NativeReadProgress? {
        guard let index = document.blocks.firstIndex(where: { $0.id == blockID }) else { return nil }
        return NativeReadProgress(heading: document.headingID(forBlock: blockID), blockID: blockID,
                                  fraction: Double(index) / Double(max(1, document.blocks.count - 1)))
    }

    private func flushProgress() {
        saveTask?.cancel()
        saveTask = nil
        guard let progress = pendingProgress else { return }
        pendingProgress = nil
        onPosition(progress.heading, progress.blockID, progress.fraction)
    }

    private func open(_ url: URL, using proxy: ScrollViewProxy) -> OpenURLAction.Result {
        if url.scheme == "ailibrary-article", url.host == "open",
           let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
           let articleID = components.queryItems?.first(where: { $0.name == "id" })?.value,
           let target = snapshot.article(id: articleID) {
            let heading = components.queryItems?.first(where: { $0.name == "heading" })?.value
            guard heading == nil || target.headings.contains(where: { $0.id == heading }) else { return .discarded }
            if target.id == article.id {
                if let heading { jump(to: heading, using: proxy) }
                else if let first = document.blocks.first { move(to: first.id, using: proxy) }
            } else {
                flushProgress()
                navigate(ReaderRoute(articleID: target.id, heading: heading))
            }
            return .handled
        }
        guard url.scheme?.lowercased() == "https", url.host != nil,
              url.user == nil, url.password == nil else { return .discarded }
        return .systemAction(url)
    }
}

/// Recursive document nodes are type-erased only at the block boundary. Inline
/// content stays in a native Text so wrapping and selection work across runs.
private struct NativeBlockView: View {
    let block: NativeBlock
    let snapshot: ContentSnapshot
    let fontScale: CGFloat
    let availableWidth: CGFloat
    let focusedHeading: AccessibilityFocusState<String?>.Binding

    var body: some View { rendered }

    private var rendered: AnyView {
        switch block.type {
        case "heading":
            return AnyView(NativeInlineText(inlines: block.inlines ?? [], snapshot: snapshot,
                                            font: headingFont, uiTextStyle: headingTextStyle, bold: true, fontScale: fontScale,
                                            maximumWidth: availableWidth)
                .accessibilityAddTraits(.isHeader)
                .accessibilityHeading(headingAccessibilityLevel)
                .accessibilityFocused(focusedHeading, equals: block.heading_id)
                .accessibilityIdentifier("native-heading-\(block.heading_id ?? block.id)")
                .padding(.top, (block.level ?? 2) <= 2 ? 14 : 6))
        case "paragraph":
            return AnyView(NativeInlineText(inlines: block.inlines ?? [], snapshot: snapshot,
                                            fontScale: fontScale, maximumWidth: availableWidth)
                .lineSpacing(5)
                .accessibilityIdentifier("native-text-\(block.id)"))
        case "list":
            return AnyView(VStack(alignment: .leading, spacing: 10) {
                ForEach(Array((block.items ?? []).enumerated()), id: \.element.id) { index, item in
                    let marker = block.ordered == true ? "\((block.start ?? 1) + index)." : "•"
                    let markerWidth = max(18, CGFloat(marker.count) * 10 * fontScale)
                    HStack(alignment: .firstTextBaseline, spacing: 10) {
                        Text(marker).monospacedDigit().lineLimit(1)
                            .accessibilityLabel(block.ordered == true ? "項目 \((block.start ?? 1) + index)" : "箇条書きの項目")
                            .frame(width: markerWidth, alignment: .trailing)
                        VStack(alignment: .leading, spacing: 10) {
                            ForEach(item.blocks) { child in
                                NativeBlockView(block: child, snapshot: snapshot, fontScale: fontScale,
                                                availableWidth: max(1, availableWidth - markerWidth - 10),
                                                focusedHeading: focusedHeading)
                            }
                        }
                    }
                    .accessibilityElement(children: .contain)
                }
            }
            .accessibilityElement(children: .contain)
            .accessibilityLabel(block.ordered == true ? "番号付きリスト、\((block.items ?? []).count)項目" : "箇条書き、\((block.items ?? []).count)項目"))
        case "quote":
            return AnyView(HStack(alignment: .top, spacing: 12) {
                RoundedRectangle(cornerRadius: 2).fill(Color.secondary.opacity(0.35)).frame(width: 3)
                VStack(alignment: .leading, spacing: 12) {
                    ForEach(block.blocks ?? []) { child in
                        NativeBlockView(block: child, snapshot: snapshot, fontScale: fontScale,
                                        availableWidth: max(1, availableWidth - 15),
                                        focusedHeading: focusedHeading)
                    }
                }.foregroundStyle(.secondary)
            }.fixedSize(horizontal: false, vertical: true)
                .accessibilityElement(children: .contain)
                .accessibilityLabel("引用"))
        case "code":
            return AnyView(NativeCodeView(text: block.text ?? "", language: block.language ?? ""))
        case "table":
            if let table = block.table {
                return AnyView(NativeTableView(table: table, snapshot: snapshot, fontScale: fontScale))
            }
            return AnyView(EmptyView())
        case "diagram", "math":
            if let asset = block.asset {
                return AnyView(NativeFigureView(asset: asset, snapshot: snapshot, source: block.source ?? "",
                                                description: block.accessibility_text ?? (block.type == "math" ? "数式" : "図"),
                                                isMath: block.type == "math", fontScale: fontScale,
                                                availableWidth: availableWidth))
            }
            return AnyView(EmptyView())
        case "thematic_break": return AnyView(Divider().padding(.vertical, 4))
        default: return AnyView(Text("この本文要素を表示できません。再度記事を開いてください。"))
        }
    }

    private var headingFont: Font {
        switch block.level ?? 2 {
        case 1: return .title
        case 2: return .title2
        case 3: return .title3
        default: return .headline
        }
    }

    private var headingAccessibilityLevel: AccessibilityHeadingLevel {
        switch block.level ?? 2 {
        case 1: return .h1
        case 2: return .h2
        case 3: return .h3
        case 4: return .h4
        case 5: return .h5
        case 6: return .h6
        default: return .unspecified
        }
    }

    private var headingTextStyle: UIFont.TextStyle {
        switch block.level ?? 2 {
        case 1: return .title1
        case 2: return .title2
        case 3: return .title3
        default: return .headline
        }
    }
}

private struct NativeCodeView: View {
    let text: String
    let language: String
    @State private var copied = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text(language.isEmpty ? "コード" : language).font(.caption).foregroundStyle(.secondary)
                Spacer()
                Button {
                    UIPasteboard.general.string = text
                    copied = true
                    UIAccessibility.post(notification: .announcement, argument: "コードをコピーしました")
                } label: {
                    Label(copied ? "コピー済み" : "コピー", systemImage: copied ? "checkmark" : "doc.on.doc")
                        .font(.caption)
                }
                .frame(minHeight: 44)
                .accessibilityLabel("コードをコピー")
            }.padding(.horizontal, 12)
            Divider()
            ScrollView(.horizontal) {
                Text(text).font(.system(.body, design: .monospaced))
                    .textSelection(.enabled).fixedSize(horizontal: true, vertical: false)
                    .padding(12)
            }
        }
        .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.secondary.opacity(0.2)))
    }
}

private struct NativeTableView: View {
    let table: NativeTable
    let snapshot: ContentSnapshot
    let fontScale: CGFloat

    private var columnWidths: [CGFloat] {
        table.header.indices.map { column in
            let content = [table.header[column]] + table.rows.compactMap { row in
                row.indices.contains(column) ? row[column] : nil
            }
            let count = content.map { NativeInlineContent.plainText($0).count }.max() ?? 0
            return min(320 * fontScale, max(120 * fontScale, CGFloat(min(count, 28)) * 9 * fontScale))
        }
    }

    var body: some View {
        let widths = columnWidths
        ScrollView(.horizontal) {
            Grid(alignment: .topLeading, horizontalSpacing: 0, verticalSpacing: 0) {
                GridRow(alignment: .top) {
                    ForEach(table.header.indices, id: \.self) { column in
                        cell(table.header[column], column: column, row: nil, width: widths[column])
                    }
                }
                ForEach(table.rows.indices, id: \.self) { row in
                    GridRow(alignment: .top) {
                        ForEach(table.header.indices, id: \.self) { column in
                            cell(table.rows[row][column], column: column, row: row + 1, width: widths[column])
                        }
                    }
                }
            }
            .padding(.vertical, 1)
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("見出し行とデータ\(table.rows.count)行、\(table.header.count)列の表")
        .accessibilityHint("横にスクロールするとすべての列を読めます")
    }

    private func cell(_ inlines: [NativeInline], column: Int, row: Int?, width: CGFloat) -> some View {
        NativeInlineText(inlines: inlines, snapshot: snapshot, bold: row == nil,
                         fontScale: fontScale, maximumWidth: width - 24)
            .multilineTextAlignment(textAlignment(column))
            .frame(maxWidth: .infinity, alignment: alignment(column))
            .padding(12)
            .frame(width: width, alignment: alignment(column))
            .frame(minHeight: 44, alignment: .topLeading)
            .background(row == nil ? Color.secondary.opacity(0.14) : Color.secondary.opacity(0.03))
            .overlay(Rectangle().stroke(Color.secondary.opacity(0.25), lineWidth: 0.5))
            .accessibilityCustomContent("表の位置", Text(cellPosition(column: column, row: row)), importance: .high)
    }

    private func cellPosition(column: Int, row: Int?) -> String {
        guard let row else { return "\(column + 1)列目の見出し" }
        return "データ\(row)行目、\(column + 1)列目。列名: \(NativeInlineContent.plainText(table.header[column]))"
    }

    private func alignment(_ column: Int) -> Alignment {
        guard table.alignments.indices.contains(column) else { return .leading }
        switch table.alignments[column] {
        case "center": return .center
        case "right": return .trailing
        default: return .leading
        }
    }

    private func textAlignment(_ column: Int) -> TextAlignment {
        guard table.alignments.indices.contains(column) else { return .leading }
        switch table.alignments[column] {
        case "center": return .center
        case "right": return .trailing
        default: return .leading
        }
    }
}

private struct NativeFigureView: View {
    let asset: NativeAsset
    let snapshot: ContentSnapshot
    let source: String
    let description: String
    let isMath: Bool
    let fontScale: CGFloat
    let availableWidth: CGFloat
    @Environment(\.colorScheme) private var colorScheme
    @State private var enlarged = false

    private var image: UIImage? {
        NativeAssetImageCache.shared.image(for: asset, snapshot: snapshot, dark: colorScheme == .dark)
    }

    private var displayWidth: CGFloat {
        let scaled = max(1, CGFloat(asset.width) * fontScale)
        let height = max(1, CGFloat(asset.height) * fontScale)
        return scaled * min(1, min(3_000 / scaled, 640 / height))
    }

    private var displayHeight: CGFloat {
        displayWidth * CGFloat(asset.height / asset.width)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let image {
                ScrollView(.horizontal) {
                    Image(uiImage: image).resizable().interpolation(.high)
                        .frame(width: displayWidth, height: displayHeight)
                        .accessibilityLabel(description)
                        .frame(minWidth: availableWidth, alignment: isMath ? .center : .leading)
                        .padding(.vertical, 2)
                }
                .frame(height: displayHeight + 4)
                HStack {
                    Text(isMath ? "数式" : "図").font(.caption).foregroundStyle(.secondary)
                    Spacer()
                    Button { enlarged = true } label: {
                        Label("拡大", systemImage: "arrow.up.left.and.arrow.down.right")
                    }
                    .font(.caption).frame(minHeight: 44)
                    .accessibilityLabel(isMath ? "数式を拡大" : "図を拡大")
                }
            } else {
                Label("画像を表示できません。テキスト表現をご確認ください。", systemImage: "photo")
                    .font(.callout).foregroundStyle(.secondary)
            }
            DisclosureGroup(isMath ? "数式のテキスト表現" : "図のテキスト表現") {
                Text(source.isEmpty ? description : source)
                    .font(.system(.callout, design: .monospaced))
                    .textSelection(.enabled)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 8)
            }
            .font(.callout)
        }
        .sheet(isPresented: $enlarged) {
            if let image {
                NativeImageDetail(image: image, description: description,
                                  initialWidth: max(320, min(1_600, CGFloat(asset.width))))
            }
        }
    }
}

private struct NativeImageDetail: View {
    let image: UIImage
    let description: String
    let initialWidth: CGFloat
    @Environment(\.dismiss) private var dismiss
    @State private var zoom: CGFloat = 1
    @State private var lastZoom: CGFloat = 1

    var body: some View {
        NavigationStack {
            ScrollView([.horizontal, .vertical]) {
                Image(uiImage: image).resizable().interpolation(.high)
                    .frame(width: initialWidth * zoom,
                           height: initialWidth * zoom * image.size.height / image.size.width)
                    .padding(20)
                    .accessibilityLabel(description)
            }
            .simultaneousGesture(MagnificationGesture()
                .onChanged { zoom = min(4, max(1, lastZoom * $0)) }
                .onEnded { _ in lastZoom = zoom })
            .navigationTitle("図・数式を拡大")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("閉じる") { dismiss() } }
                ToolbarItemGroup(placement: .bottomBar) {
                    Button {
                        zoom = max(1, zoom / 1.5)
                        lastZoom = zoom
                    } label: { Image(systemName: "minus.magnifyingglass") }
                    .accessibilityLabel("縮小")
                    .disabled(zoom <= 1)
                    Spacer()
                    Text("\(Int(zoom * 100))%").monospacedDigit().accessibilityLabel("倍率 \(Int(zoom * 100)) パーセント")
                    Spacer()
                    Button {
                        zoom = min(4, zoom * 1.5)
                        lastZoom = zoom
                    } label: { Image(systemName: "plus.magnifyingglass") }
                    .accessibilityLabel("拡大")
                    .disabled(zoom >= 4)
                }
            }
        }
    }
}
