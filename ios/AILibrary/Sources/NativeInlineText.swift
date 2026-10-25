import Foundation
import SwiftUI
import UIKit

/// The package is validated before opening it. Keep UI image reads bounded as well,
/// including when a future package contains unusually large figures.
final class NativeAssetImageCache {
    static let shared = NativeAssetImageCache()
    private let images = NSCache<NSString, UIImage>()

    private init() {
        images.totalCostLimit = 64 * 1_024 * 1_024
        images.countLimit = 96
    }

    func image(for asset: NativeAsset, snapshot: ContentSnapshot, dark: Bool) -> UIImage? {
        let relative = dark ? asset.dark : asset.light
        guard !relative.hasPrefix("/"), !relative.contains("\\"),
              !relative.split(separator: "/", omittingEmptySubsequences: false).contains(where: { $0 == ".." || $0 == "." || $0.isEmpty }),
              relative.lowercased().hasSuffix(".png"), let digest = snapshot.manifest.files[relative],
              asset.scale.isFinite, (1...4).contains(asset.scale) else { return nil }
        let directory = snapshot.readAccessRoot
        let url = directory.appendingPathComponent(relative).standardizedFileURL.resolvingSymlinksInPath()
        guard url.path.hasPrefix(directory.path + "/") else { return nil }
        let key = "\(directory.path):\(digest):\(relative):\(asset.scale)" as NSString
        if let cached = images.object(forKey: key) { return cached }
        guard let loaded = UIImage(contentsOfFile: url.path), let cgImage = loaded.cgImage,
              cgImage.width <= 8_192, cgImage.height <= 8_192,
              cgImage.width * cgImage.height <= 32 * 1_024 * 1_024 else { return nil }
        let image = UIImage(cgImage: cgImage, scale: CGFloat(asset.scale), orientation: .up)
        images.setObject(image, forKey: key, cost: cgImage.width * cgImage.height * 4)
        return image
    }

    func inlineImage(for asset: NativeAsset, snapshot: ContentSnapshot, dark: Bool,
                     fontScale: CGFloat, maximumWidth: CGFloat) -> UIImage? {
        let relative = dark ? asset.dark : asset.light
        guard let digest = snapshot.manifest.files[relative],
              let original = image(for: asset, snapshot: snapshot, dark: dark),
              asset.width.isFinite, asset.height.isFinite, asset.width > 0, asset.height > 0 else { return nil }
        let scale = min(4, max(0.8, fontScale))
        let fit = min(1, max(1, maximumWidth) / (CGFloat(asset.width) * scale))
        let target = CGSize(width: CGFloat(asset.width) * scale * fit,
                            height: CGFloat(asset.height) * scale * fit)
        let pixelScale = min(3, UIScreen.main.scale)
        guard target.width <= 4_096, target.height <= 2_048,
              target.width * target.height * pixelScale * pixelScale <= 16 * 1_024 * 1_024 else { return nil }
        let key = "inline:\(snapshot.readAccessRoot.path):\(digest):\(relative):\(target.width):\(target.height):\(pixelScale)" as NSString
        if let cached = images.object(forKey: key) { return cached }
        let format = UIGraphicsImageRendererFormat()
        format.scale = pixelScale
        format.opaque = false
        let renderer = UIGraphicsImageRenderer(size: target, format: format)
        let image = renderer.image { _ in original.draw(in: CGRect(origin: .zero, size: target)) }
        images.setObject(image, forKey: key,
                         cost: Int(target.width * target.height * pixelScale * pixelScale * 4))
        return image
    }
}

enum NativeInlineContent {
    struct Link: Hashable {
        let url: URL
        let label: String
    }

    static func containsLinkedMath(_ values: [NativeInline], insideLink: Bool = false) -> Bool {
        values.contains { value in
            (value.type == "math" && insideLink)
                || containsLinkedMath(value.children ?? [], insideLink: insideLink || value.type == "link")
        }
    }

    static func links(_ values: [NativeInline]) -> [Link] {
        var result: [Link] = []
        for value in values {
            if value.type == "link", let url = linkURL(value.target) {
                let spoken = plainText(value.children ?? []).trimmingCharacters(in: .whitespacesAndNewlines)
                let link = Link(url: url, label: spoken.isEmpty ? "リンク" : spoken)
                if !result.contains(link) { result.append(link) }
            }
            for link in links(value.children ?? []) where !result.contains(link) { result.append(link) }
        }
        return result
    }

    static func plainText(_ inlines: [NativeInline]) -> String {
        inlines.map { inline in
            switch inline.type {
            case "text", "code": return inline.text ?? ""
            case "math": return inline.accessibility_text ?? inline.source ?? "数式"
            case "soft_break": return " "
            case "hard_break": return "\n"
            default: return plainText(inline.children ?? [])
            }
        }.joined()
    }

    static func linkURL(_ target: NativeLink?) -> URL? {
        guard let target else { return nil }
        if target.kind == "article", let articleID = target.article_id {
            var url = URLComponents()
            url.scheme = "ailibrary-article"
            url.host = "open"
            url.queryItems = [URLQueryItem(name: "id", value: articleID)]
            if let heading = target.heading_id { url.queryItems?.append(URLQueryItem(name: "heading", value: heading)) }
            return url.url
        }
        guard target.kind == "external", let value = target.url, let url = URL(string: value),
              url.scheme?.lowercased() == "https", url.host != nil, url.user == nil, url.password == nil else { return nil }
        return url
    }
}

/// A single native Text preserves Japanese wrapping, selection, inline traits and links.
/// Formula PNGs are Text image runs; baseline metadata aligns them with the surrounding text.
struct NativeInlineText: View {
    let inlines: [NativeInline]
    let snapshot: ContentSnapshot
    var font: Font = .body
    var uiTextStyle: UIFont.TextStyle = .body
    var bold = false
    var fontScale: CGFloat = 1
    var maximumWidth: CGFloat = 360
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Environment(\.multilineTextAlignment) private var textAlignment
    @Environment(\.lineSpacing) private var lineSpacing
    @Environment(\.openURL) private var openURL
    @State private var mathSourcePresented = false

    private var mathSources: [String] {
        func collect(_ values: [NativeInline]) -> [String] {
            values.flatMap { value in
                value.type == "math" ? [value.source ?? "数式"] : collect(value.children ?? [])
            }
        }
        return collect(inlines)
    }

    var body: some View {
        inlineContent
            .sheet(isPresented: $mathSourcePresented) {
                NavigationStack {
                    ScrollView {
                        Text(mathSources.joined(separator: "\n\n"))
                            .font(.system(.body, design: .monospaced))
                            .textSelection(.enabled)
                            .frame(maxWidth: .infinity, alignment: .leading).padding()
                    }
                    .navigationTitle("数式のテキスト表現")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar { ToolbarItem(placement: .confirmationAction) { Button("閉じる") { mathSourcePresented = false } } }
                }
            }
    }

    @ViewBuilder private var inlineContent: some View {
        if NativeInlineContent.containsLinkedMath(inlines) {
            // Text(Image) has no public per-run link attribute. TextKit preserves
            // attachment images, range links and native selection for this case.
            NativeLinkedMathText(inlines: inlines, snapshot: snapshot, textStyle: uiTextStyle,
                                 bold: bold, dark: colorScheme == .dark, fontScale: fontScale,
                                 maximumWidth: maximumWidth, lineSpacing: lineSpacing,
                                 textAlignment: textAlignment, dynamicTypeSize: dynamicTypeSize,
                                 openLink: { openURL($0) }, showMathSource: { mathSourcePresented = true })
                .fixedSize(horizontal: false, vertical: true)
        } else if mathSources.isEmpty {
            selectableText
        } else {
            selectableText
                .contextMenu {
                    Button("数式のテキスト表現", systemImage: "function") { mathSourcePresented = true }
                }
                .accessibilityAction(named: Text("数式のテキスト表現")) { mathSourcePresented = true }
        }
    }

    private var selectableText: some View {
        makeText(inlines, strong: bold)
            .textSelection(.enabled)
            .fixedSize(horizontal: false, vertical: true)
    }

    private func makeText(_ values: [NativeInline], strong: Bool = false,
                          emphasis: Bool = false, link: URL? = nil) -> Text {
        values.reduce(Text("")) { result, inline in
            let next: Text
            switch inline.type {
            case "strong":
                next = makeText(inline.children ?? [], strong: true, emphasis: emphasis, link: link)
            case "emphasis":
                next = makeText(inline.children ?? [], strong: strong, emphasis: true, link: link)
            case "link":
                next = makeText(inline.children ?? [], strong: strong, emphasis: emphasis,
                                link: NativeInlineContent.linkURL(inline.target))
            case "math":
                if let asset = inline.asset,
                   let image = NativeAssetImageCache.shared.inlineImage(for: asset, snapshot: snapshot,
                                                                       dark: colorScheme == .dark,
                                                                       fontScale: fontScale, maximumWidth: maximumWidth),
                   let cgImage = image.cgImage {
                    let fit = min(1, max(1, maximumWidth) / (CGFloat(asset.width) * min(4, max(0.8, fontScale))))
                    let label = inline.accessibility_text ?? inline.source ?? "数式"
                    next = Text(Image(cgImage, scale: image.scale, orientation: .up, label: Text(label)))
                        .baselineOffset(-CGFloat(asset.baseline ?? 0) * min(4, max(0.8, fontScale)) * fit)
                } else {
                    next = styled(inline.source ?? "数式", strong: strong, emphasis: emphasis, code: true, link: link)
                }
            case "soft_break": next = styled(" ", strong: strong, emphasis: emphasis, link: link)
            case "hard_break": next = Text("\n")
            case "code": next = styled(inline.text ?? "", strong: strong, emphasis: emphasis, code: true, link: link)
            default: next = styled(inline.text ?? "", strong: strong, emphasis: emphasis, link: link)
            }
            return result + next
        }
    }

    private func styled(_ value: String, strong: Bool, emphasis: Bool,
                        code: Bool = false, link: URL?) -> Text {
        var attributes = AttributedString(value)
        var selected = code ? font.monospaced() : font
        if strong { selected = selected.bold() }
        if emphasis { selected = selected.italic() }
        attributes.font = selected
        if let link {
            attributes.link = link
            attributes.foregroundColor = .accentColor
        }
        return Text(attributes)
    }
}

/// UIKit's native text attachment retains its spoken description and TeX for
/// accessibility and plain-text copying. No HTML or document import is used.
final class NativeMathTextAttachment: NSTextAttachment {
    var source = ""
    var spokenText = "数式"
}

@MainActor
enum NativeLinkedMathAttributedContent {
    static func make(inlines: [NativeInline], snapshot: ContentSnapshot, font: UIFont,
                     bold: Bool, dark: Bool, fontScale: CGFloat, maximumWidth: CGFloat,
                     lineSpacing: CGFloat, alignment: NSTextAlignment) -> NSAttributedString {
        let paragraph = NSMutableParagraphStyle()
        paragraph.lineSpacing = lineSpacing
        paragraph.alignment = alignment
        paragraph.lineBreakMode = .byWordWrapping

        func attributes(strong: Bool, emphasis: Bool, code: Bool, link: URL?) -> [NSAttributedString.Key: Any] {
            var selected = code ? UIFont.monospacedSystemFont(ofSize: font.pointSize, weight: strong ? .bold : .regular) : font
            var traits = selected.fontDescriptor.symbolicTraits
            if strong { traits.insert(.traitBold) }
            if emphasis { traits.insert(.traitItalic) }
            if let descriptor = selected.fontDescriptor.withSymbolicTraits(traits) {
                selected = UIFont(descriptor: descriptor, size: selected.pointSize)
            }
            var result: [NSAttributedString.Key: Any] = [.font: selected, .foregroundColor: UIColor.label, .paragraphStyle: paragraph]
            if let link {
                result[.link] = link
                result[.foregroundColor] = UIColor.link
                result[.underlineStyle] = NSUnderlineStyle.single.rawValue
            }
            return result
        }

        func append(_ values: [NativeInline], to result: NSMutableAttributedString,
                    strong: Bool, emphasis: Bool = false, link: URL? = nil) {
            for value in values {
                switch value.type {
                case "strong": append(value.children ?? [], to: result, strong: true, emphasis: emphasis, link: link)
                case "emphasis": append(value.children ?? [], to: result, strong: strong, emphasis: true, link: link)
                case "link":
                    append(value.children ?? [], to: result, strong: strong, emphasis: emphasis,
                           link: NativeInlineContent.linkURL(value.target))
                case "math":
                    if let asset = value.asset,
                       let image = NativeAssetImageCache.shared.inlineImage(for: asset, snapshot: snapshot, dark: dark,
                                                                           fontScale: fontScale, maximumWidth: maximumWidth) {
                        let attachment = NativeMathTextAttachment(data: nil, ofType: nil)
                        attachment.image = image
                        attachment.source = value.source ?? "数式"
                        attachment.spokenText = value.accessibility_text ?? attachment.source
                        attachment.accessibilityLabel = attachment.spokenText
                        image.accessibilityLabel = attachment.spokenText
                        let scale = min(4, max(0.8, fontScale))
                        let fit = min(1, max(1, maximumWidth) / (CGFloat(asset.width) * scale))
                        attachment.bounds = CGRect(x: 0, y: -CGFloat(asset.baseline ?? 0) * scale * fit,
                                                   width: image.size.width, height: image.size.height)
                        let run = NSMutableAttributedString(attributedString: NSAttributedString(attachment: attachment))
                        run.addAttributes(attributes(strong: strong, emphasis: emphasis, code: false, link: link),
                                          range: NSRange(location: 0, length: run.length))
                        result.append(run)
                    } else {
                        result.append(NSAttributedString(string: value.source ?? "数式",
                                                         attributes: attributes(strong: strong, emphasis: emphasis, code: true, link: link)))
                    }
                default:
                    let string = value.type == "hard_break" ? "\n" : value.type == "soft_break" ? " " : value.text ?? ""
                    result.append(NSAttributedString(string: string,
                                                     attributes: attributes(strong: strong, emphasis: emphasis, code: value.type == "code", link: link)))
                }
            }
        }
        let result = NSMutableAttributedString(string: "")
        append(inlines, to: result, strong: bold)
        return result
    }

    static func copyableText(_ text: NSAttributedString, range: NSRange) -> String {
        guard range.location != NSNotFound, range.location >= 0, range.length >= 0,
              range.location <= text.length, range.length <= text.length - range.location else { return "" }
        let selection = text.attributedSubstring(from: range)
        var result = ""
        selection.enumerateAttributes(in: NSRange(location: 0, length: selection.length)) { attributes, range, _ in
            if let attachment = attributes[.attachment] as? NativeMathTextAttachment { result += attachment.source }
            else { result += (selection.string as NSString).substring(with: range) }
        }
        return result
    }
}

@MainActor
final class NativeMathLinkTextView: UITextView {
    override func copy(_ sender: Any?) {
        guard selectedRange.length > 0 else { return }
        UIPasteboard.general.string = NativeLinkedMathAttributedContent.copyableText(attributedText, range: selectedRange)
    }
}

@MainActor
struct NativeLinkedMathText: UIViewRepresentable {
    let inlines: [NativeInline]
    let snapshot: ContentSnapshot
    let textStyle: UIFont.TextStyle
    let bold: Bool
    let dark: Bool
    let fontScale: CGFloat
    let maximumWidth: CGFloat
    let lineSpacing: CGFloat
    let textAlignment: TextAlignment
    let dynamicTypeSize: DynamicTypeSize
    let openLink: (URL) -> Void
    let showMathSource: () -> Void

    struct RenderKey: Equatable {
        let inlines: [NativeInline]
        let revision: String
        let root: String
        let textStyle: String
        let bold: Bool
        let dark: Bool
        let fontScale: CGFloat
        let width: CGFloat
        let lineSpacing: CGFloat
        let alignment: NSTextAlignment
        let sizeCategory: String
    }

    func makeCoordinator() -> NativeMathLinkCoordinator { NativeMathLinkCoordinator() }

    func makeUIView(context: Context) -> NativeMathLinkTextView {
        let view = NativeMathLinkTextView()
        view.delegate = context.coordinator
        view.backgroundColor = .clear
        view.isOpaque = false
        view.isEditable = false
        view.isSelectable = true
        view.isScrollEnabled = false
        view.dataDetectorTypes = []
        view.textContainerInset = .zero
        view.textContainer.lineFragmentPadding = 0
        view.textContainer.lineBreakMode = .byWordWrapping
        view.contentInset = .zero
        view.adjustsFontForContentSizeCategory = true
        view.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        view.setContentHuggingPriority(.defaultLow, for: .horizontal)
        return view
    }

    func updateUIView(_ view: NativeMathLinkTextView, context: Context) {
        let coordinator = context.coordinator
        view.overrideUserInterfaceStyle = dark ? .dark : .light
        coordinator.links = NativeInlineContent.links(inlines)
        coordinator.openLink = openLink
        coordinator.showMathSource = showMathSource
        view.accessibilityCustomActions = coordinator.actions()
        let alignment: NSTextAlignment = textAlignment == .center ? .center : textAlignment == .trailing ? .right : .left
        let key = RenderKey(inlines: inlines, revision: snapshot.manifest.revision, root: snapshot.root.path,
                            textStyle: textStyle.rawValue, bold: bold, dark: dark, fontScale: fontScale,
                            width: maximumWidth, lineSpacing: lineSpacing, alignment: alignment,
                            sizeCategory: sizeCategory.rawValue)
        guard coordinator.renderKey != key else { return }
        coordinator.renderKey = key
        let selected = view.selectedRange
        let traits = UITraitCollection(preferredContentSizeCategory: sizeCategory)
        view.attributedText = NativeLinkedMathAttributedContent.make(inlines: inlines, snapshot: snapshot,
            font: UIFont.preferredFont(forTextStyle: textStyle, compatibleWith: traits), bold: bold, dark: dark,
            fontScale: fontScale, maximumWidth: maximumWidth, lineSpacing: lineSpacing, alignment: alignment)
        view.linkTextAttributes = [.foregroundColor: view.tintColor ?? UIColor.link, .underlineStyle: NSUnderlineStyle.single.rawValue]
        if selected.location <= view.attributedText.length, selected.length <= view.attributedText.length - selected.location {
            view.selectedRange = selected
        }
        view.invalidateIntrinsicContentSize()
    }

    func sizeThatFits(_ proposal: ProposedViewSize, uiView: NativeMathLinkTextView, context: Context) -> CGSize? {
        let width = proposal.width ?? maximumWidth
        guard width.isFinite, width > 0 else { return nil }
        let size = uiView.sizeThatFits(CGSize(width: width, height: .greatestFiniteMagnitude))
        guard size.height.isFinite else { return nil }
        return CGSize(width: width, height: ceil(size.height))
    }

    private var sizeCategory: UIContentSizeCategory {
        switch dynamicTypeSize {
        case .xSmall: return .extraSmall
        case .small: return .small
        case .medium: return .medium
        case .large: return .large
        case .xLarge: return .extraLarge
        case .xxLarge: return .extraExtraLarge
        case .xxxLarge: return .extraExtraExtraLarge
        case .accessibility1: return .accessibilityMedium
        case .accessibility2: return .accessibilityLarge
        case .accessibility3: return .accessibilityExtraLarge
        case .accessibility4: return .accessibilityExtraExtraLarge
        case .accessibility5: return .accessibilityExtraExtraExtraLarge
        @unknown default: return .large
        }
    }
}

@MainActor
final class NativeMathLinkCoordinator: NSObject, UITextViewDelegate {
    var renderKey: NativeLinkedMathText.RenderKey?
    var links: [NativeInlineContent.Link] = []
    var openLink: (URL) -> Void = { _ in }
    var showMathSource: () -> Void = {}

    @discardableResult func performLink(_ url: URL) -> Bool {
        guard links.contains(where: { $0.url == url }) else { return false }
        openLink(url)
        return true
    }

    func actions() -> [UIAccessibilityCustomAction] {
        var result = links.map { link in
            UIAccessibilityCustomAction(name: "リンク: \(link.label)") { [weak self] _ in self?.performLink(link.url) ?? false }
        }
        result.append(UIAccessibilityCustomAction(name: "数式のテキスト表現") { [weak self] _ in
            guard let self else { return false }
            self.showMathSource()
            return true
        })
        return result
    }

    private func link(in view: UITextView, item: UITextItem) -> URL? {
        guard item.range.location >= 0, item.range.location < view.attributedText.length else { return nil }
        var target = view.attributedText.attribute(.link, at: item.range.location, effectiveRange: nil) as? URL
        if target == nil, case .link(let url) = item.content { target = url }
        return target.flatMap { url in links.contains(where: { $0.url == url }) ? url : nil }
    }

    func textView(_ textView: UITextView, primaryActionFor textItem: UITextItem, defaultAction: UIAction) -> UIAction? {
        if let url = link(in: textView, item: textItem) {
            return UIAction(title: "リンクを開く") { [weak self] _ in self?.performLink(url) }
        }
        if case .textAttachment(let attachment) = textItem.content, attachment is NativeMathTextAttachment {
            return UIAction(title: "数式のテキスト表現") { [weak self] _ in self?.showMathSource() }
        }
        return nil
    }

    func textView(_ textView: UITextView, menuConfigurationFor textItem: UITextItem, defaultMenu: UIMenu) -> UITextItem.MenuConfiguration? {
        var children: [UIMenuElement] = []
        if let url = link(in: textView, item: textItem) {
            children.append(UIAction(title: "リンクを開く") { [weak self] _ in self?.performLink(url) })
        }
        children.append(UIAction(title: "数式のテキスト表現") { [weak self] _ in self?.showMathSource() })
        return UITextItem.MenuConfiguration(menu: UIMenu(children: children))
    }

    func textView(_ textView: UITextView, editMenuForTextIn range: NSRange, suggestedActions: [UIMenuElement]) -> UIMenu? {
        UIMenu(children: suggestedActions + [UIAction(title: "数式のテキスト表現") { [weak self] _ in self?.showMathSource() }])
    }
}
