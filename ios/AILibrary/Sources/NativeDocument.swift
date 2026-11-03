import CryptoKit
import Foundation

struct NativeDocument: Codable, Hashable, Sendable {
    let schema_version: Int
    let article_id: String
    let source_sha256: String
    let blocks: [NativeBlock]

    var allBlocks: [NativeBlock] { blocks.flatMap { $0.descendants } }
    func block(id: String) -> NativeBlock? { allBlocks.first { $0.id == id } }
    func block(forHeading id: String) -> NativeBlock? { allBlocks.first { $0.heading_id == id && $0.type == "heading" } }
    func topLevelBlockID(containing id: String) -> String? { blocks.first { $0.descendants.contains { $0.id == id } }?.id }
    func topLevelBlockID(forHeading id: String) -> String? {
        guard let block = block(forHeading: id) else { return nil }
        return topLevelBlockID(containing: block.id)
    }
    func headingID(forBlock id: String) -> String? {
        var heading: String?
        for block in allBlocks {
            if block.type == "heading" { heading = block.heading_id }
            if block.id == id { return heading }
        }
        return nil
    }

    /// Persist only the displayed top-level block. Asset paths and generated IDs
    /// are intentionally absent from the semantic fingerprints.
    func readingAnchor(blockID: String?, documentDigest: String,
                       intraBlockFraction: Double? = nil) -> NativeReadingAnchor? {
        guard let blockID, let container = blocks.first(where: { $0.descendants.contains { $0.id == blockID } }),
              let fingerprint = container.readingFingerprint else { return nil }
        let heading = headingID(forBlock: container.id).flatMap { block(forHeading: $0) }
        return NativeReadingAnchor(documentDigest: documentDigest, blockFingerprint: fingerprint,
                                   headingFingerprint: heading?.readingHeadingFingerprint,
                                   intraBlockFraction: intraBlockFraction)
    }

    /// Resolving a saved record is pure: only a later scroll record updates it.
    /// Changed documents never trust a possibly reassigned duplicate block ID.
    func readingBlockID(for position: ReadingPosition, documentDigest: String? = nil) -> String? {
        readingResolution(for: position, documentDigest: documentDigest)?.blockID
    }

    /// The old ID lookup is retained. Only an identified same block may carry a
    /// block-internal position across revisions; heading/order fallbacks may not.
    func readingResolution(for position: ReadingPosition, documentDigest: String? = nil) -> NativeReadingResolution? {
        guard !blocks.isEmpty else { return nil }
        let fractionIndex = min(blocks.count - 1, Int(position.fraction * Double(blocks.count - 1)))
        let fractional = blocks[fractionIndex].id
        let direct = position.blockID.flatMap { topLevelBlockID(containing: $0) }
        guard let anchor = position.anchor else {
            return NativeReadingResolution(blockID: direct ?? position.heading.flatMap { topLevelBlockID(forHeading: $0) } ?? fractional,
                                           restoresSameBlock: false)
        }
        if documentDigest == anchor.documentDigest, let direct {
            return NativeReadingResolution(blockID: direct, restoresSameBlock: true)
        }

        let candidates = blocks.filter { $0.readingFingerprint == anchor.blockFingerprint }
        if candidates.count == 1 { return NativeReadingResolution(blockID: candidates[0].id, restoresSameBlock: true) }
        if let headingFingerprint = anchor.headingFingerprint {
            let headings = allBlocks.filter { $0.type == "heading" && $0.readingHeadingFingerprint == headingFingerprint }
            if headings.count == 1, let headingID = headings[0].heading_id {
                // Scan once even for thousands of identical paragraphs.
                let candidateIDs = Set(candidates.map(\.id))
                var currentHeading: String?
                var inSection: [NativeBlock] = []
                for block in allBlocks {
                    if block.type == "heading" { currentHeading = block.heading_id }
                    if candidateIDs.contains(block.id), currentHeading == headingID { inSection.append(block) }
                }
                if inSection.count == 1 { return NativeReadingResolution(blockID: inSection[0].id, restoresSameBlock: true) }
                return NativeReadingResolution(blockID: topLevelBlockID(containing: headings[0].id) ?? fractional,
                                               restoresSameBlock: false)
            }
        }
        return NativeReadingResolution(blockID: fractional, restoresSameBlock: false)
    }

    /// Prefer a leaf containing all query terms. If terms occur in different
    /// blocks, use the most matching distinct terms and keep document order for
    /// ties. The article list retains its whole-article AND condition.
    func searchHit(query: String) -> NativeSearchHit? {
        let terms = LibrarySearch.normalizedTerms(query)
        guard !terms.isEmpty else { return nil }
        var nearestHeading: String?
        var best: NativeSearchHit?
        var bestScore = 0
        func visit(_ values: [NativeBlock], containerID: String) -> Bool {
            for block in values {
                if block.type == "heading" { nearestHeading = block.heading_id }
                if let text = block.searchableText {
                    let normalized = LibrarySearch.normalize(text)
                    let score = terms.reduce(0) { $0 + (normalized.contains($1) ? 1 : 0) }
                    if score > bestScore {
                        best = NativeSearchHit(blockID: block.id, containerBlockID: containerID,
                                               headingID: nearestHeading)
                        bestScore = score
                        if score == terms.count { return true }
                    }
                }
                if visit(block.blocks ?? [], containerID: containerID) { return true }
                for item in block.items ?? [] {
                    if visit(item.blocks, containerID: containerID) { return true }
                }
            }
            return false
        }
        for block in blocks {
            if visit([block], containerID: block.id) { break }
        }
        return best
    }
}

struct NativeReadingResolution: Equatable, Sendable {
    let blockID: String
    let restoresSameBlock: Bool
}

struct NativeSearchHit: Hashable, Sendable {
    let blockID: String
    let containerBlockID: String
    let headingID: String?
}

struct NativeBlock: Codable, Hashable, Identifiable, Sendable {
    let id: String
    let type: String
    var heading_id: String? = nil
    var level: Int? = nil
    var inlines: [NativeInline]? = nil
    var ordered: Bool? = nil
    var start: Int? = nil
    var items: [NativeListItem]? = nil
    var blocks: [NativeBlock]? = nil
    var language: String? = nil
    var text: String? = nil
    var table: NativeTable? = nil
    var asset: NativeAsset? = nil
    var source: String? = nil
    var accessibility_text: String? = nil

    fileprivate var descendants: [NativeBlock] {
        [self] + (blocks ?? []).flatMap { $0.descendants } + (items ?? []).flatMap { $0.blocks.flatMap { $0.descendants } }
    }

    fileprivate var readingFingerprint: String? { semanticReadingBlock.fingerprint }
    fileprivate var readingHeadingFingerprint: String? {
        guard type == "heading" else { return nil }
        // A heading can move to another level without changing its meaning.
        return NativeBlock(id: "", type: "heading", inlines: inlines?.map(\.semanticReadingInline)).fingerprint
    }
    private var fingerprint: String? {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
        guard let data = try? encoder.encode(self) else { return nil }
        return SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
    }
    fileprivate var semanticReadingBlock: NativeBlock {
        NativeBlock(id: "", type: type, level: level, inlines: inlines?.map(\.semanticReadingInline),
                    ordered: ordered, start: start,
                    items: items?.map { NativeListItem(id: "", blocks: $0.blocks.map(\.semanticReadingBlock)) },
                    blocks: blocks?.map(\.semanticReadingBlock), language: language, text: text, table: table.map {
                        NativeTable(header: $0.header.map { $0.map(\.semanticReadingInline) },
                                    rows: $0.rows.map { $0.map { $0.map(\.semanticReadingInline) } }, alignments: $0.alignments)
                    }, source: source, accessibility_text: accessibility_text)
    }

    fileprivate var searchableText: String? {
        switch type {
        case "heading", "paragraph":
            return (inlines ?? []).map(\.searchableText).joined()
        case "code":
            return text ?? ""
        case "table":
            guard let table else { return nil }
            return ([table.header] + table.rows).map { row in
                row.map { $0.map(\.searchableText).joined() }.joined(separator: " ")
            }.joined(separator: "\n")
        case "diagram", "math":
            return [source ?? "", accessibility_text ?? ""].joined(separator: " ")
        default:
            // Containers have no target of their own; their leaf blocks are
            // visited individually so a distant nested hit is not lost.
            return nil
        }
    }

    fileprivate var fields: Set<String> {
        Set([("heading_id", heading_id != nil), ("level", level != nil), ("inlines", inlines != nil),
             ("ordered", ordered != nil), ("start", start != nil), ("items", items != nil), ("blocks", blocks != nil),
             ("language", language != nil), ("text", text != nil), ("table", table != nil), ("asset", asset != nil),
             ("source", source != nil), ("accessibility_text", accessibility_text != nil)].compactMap { $0.1 ? $0.0 : nil })
    }
}

struct NativeInline: Codable, Hashable, Sendable {
    let type: String
    var text: String? = nil
    var children: [NativeInline]? = nil
    var target: NativeLink? = nil
    var asset: NativeAsset? = nil
    var source: String? = nil
    var accessibility_text: String? = nil

    fileprivate var semanticReadingInline: NativeInline {
        NativeInline(type: type, text: text, children: children?.map(\.semanticReadingInline),
                     target: target.map { NativeLink(kind: $0.kind, article_id: $0.article_id, url: $0.url) },
                     source: source, accessibility_text: accessibility_text)
    }

    fileprivate var searchableText: String {
        switch type {
        case "text", "code": return text ?? ""
        case "strong", "emphasis", "link": return (children ?? []).map(\.searchableText).joined()
        case "soft_break": return " "
        case "hard_break": return "\n"
        case "math": return [source ?? "", accessibility_text ?? ""].joined(separator: " ")
        default: return ""
        }
    }

    fileprivate var fields: Set<String> {
        Set([("text", text != nil), ("children", children != nil), ("target", target != nil), ("asset", asset != nil),
             ("source", source != nil), ("accessibility_text", accessibility_text != nil)].compactMap { $0.1 ? $0.0 : nil })
    }
}

struct NativeAsset: Codable, Hashable, Sendable {
    let light: String
    let dark: String
    let width: Double
    let height: Double
    let scale: Double
    var baseline: Double? = nil
}

struct NativeLink: Codable, Hashable, Sendable {
    let kind: String
    var article_id: String? = nil
    var heading_id: String? = nil
    var url: String? = nil
}

struct NativeTable: Codable, Hashable, Sendable {
    let header: [[NativeInline]]
    let rows: [[[NativeInline]]]
    let alignments: [String]
}

struct NativeListItem: Codable, Hashable, Identifiable, Sendable {
    let id: String
    let blocks: [NativeBlock]
}

enum NativeDocumentValidator {
    static let maximumDocumentBytes = 16 * 1024 * 1024
    static let maximumDepth = 32
    static let maximumElements = 20_000
    static let maximumPNGBytes = 32 * 1024 * 1024
    static let maximumPixelDimension = 8192
    static let maximumPixels = 32_000_000
    private static let blockFields: [String: Set<String>] = [
        "heading": ["heading_id", "level", "inlines"], "paragraph": ["inlines"], "list": ["ordered", "start", "items"],
        "quote": ["blocks"], "code": ["language", "text"], "table": ["table"],
        "diagram": ["asset", "source", "accessibility_text"], "math": ["asset", "source", "accessibility_text"], "thematic_break": []]
    private static let inlineFields: [String: Set<String>] = [
        "text": ["text"], "code": ["text"], "strong": ["children"], "emphasis": ["children"], "link": ["children", "target"],
        "math": ["asset", "source", "accessibility_text"], "soft_break": [], "hard_break": []]

    static func load(article: LibraryArticle, manifest: ContentManifest, root: URL) throws -> NativeDocument {
        guard let path = article.document_path, path.hasPrefix("articles/"), path.hasSuffix(".json"),
              let digest = manifest.files[path], ContentValidator.isDigest(digest) else {
            throw ContentError.invalid("ネイティブ本文の参照先が無効です。")
        }
        let data = try verifiedData(path: path, digest: digest, root: root, maximumBytes: maximumDocumentBytes)
        try preflight(data)
        let document = try JSONDecoder().decode(NativeDocument.self, from: data)
        try validate(document, article: article, manifest: manifest, root: root)
        return document
    }

    static func validate(_ document: NativeDocument, article: LibraryArticle, manifest: ContentManifest, root: URL) throws {
        guard manifest.schema_version == 2, document.schema_version == 1, document.article_id == article.id,
              document.source_sha256 == article.source_sha256,
              ContentValidator.isDigest(document.source_sha256), !document.blocks.isEmpty,
              Set(article.headings.map(\.id)).count == article.headings.count else {
            throw ContentError.invalid("ネイティブ本文の形式・記事・原本SHAが一致しません。")
        }
        var context = Context(manifest: manifest, root: root)
        try context.blocks(document.blocks, depth: 0)
        let expected = Dictionary(uniqueKeysWithValues: article.headings.map { ($0.id, $0.level) })
        guard context.headings == expected else { throw ContentError.invalid("本文と目次の見出しが一致しません。") }
    }

    static func validatePNG(path: String, digest: String, root: URL) throws -> (Int, Int) {
        let data = try verifiedData(path: path, digest: digest, root: root, maximumBytes: maximumPNGBytes)
        return try pngDimensions(data)
    }

    private static func preflight(_ data: Data) throws {
        let object = try JSONSerialization.jsonObject(with: data)
        var elements = 0
        func visit(_ value: Any, depth: Int) throws {
            elements += 1
            guard depth <= 128, elements <= 200_000 else { throw ContentError.invalid("本文JSONの深さ・要素数が上限を超えています。") }
            if let values = value as? [Any] { for child in values { try visit(child, depth: depth + 1) } }
            else if let values = value as? [String: Any] { for child in values.values { try visit(child, depth: depth + 1) } }
        }
        try visit(object, depth: 0)
    }

    private static func verifiedData(path: String, digest: String, root: URL, maximumBytes: Int) throws -> Data {
        guard ContentValidator.isSafeRelativePath(path) else { throw ContentError.invalid("本文・画像のパスが無効です。") }
        var url = root
        for component in path.split(separator: "/") {
            url.appendPathComponent(String(component))
            guard try url.resourceValues(forKeys: [.isSymbolicLinkKey]).isSymbolicLink != true else {
                throw ContentError.invalid("本文・画像にシンボリックリンクは使用できません。")
            }
        }
        let values = try url.resourceValues(forKeys: [.isRegularFileKey, .fileSizeKey])
        guard values.isRegularFile == true, let size = values.fileSize, size <= maximumBytes else {
            throw ContentError.invalid("本文・画像の形式または容量上限を確認してください。")
        }
        let data = try Data(contentsOf: url)
        guard data.count <= maximumBytes,
              SHA256.hash(data: data).map({ String(format: "%02x", $0) }).joined() == digest else {
            throw ContentError.invalid("本文・画像のSHA-256が一致しません。")
        }
        return data
    }

    private struct Context {
        let manifest: ContentManifest
        let root: URL
        var count = 0
        var ids = Set<String>()
        var headings: [String: Int] = [:]
        var pngSizes: [String: (Int, Int)] = [:]

        mutating func element(depth: Int) throws {
            count += 1
            guard depth <= maximumDepth, count <= maximumElements else { throw ContentError.invalid("本文の深さ・要素数が上限を超えています。") }
        }
        func identifier(_ id: String) throws {
            guard !id.isEmpty, id.utf8.count <= 512, !id.unicodeScalars.contains(where: { CharacterSet.controlCharacters.contains($0) }) else {
                throw ContentError.invalid("本文のIDが無効です。")
            }
        }
        func text(_ text: String, nonempty: Bool = false) throws {
            guard text.utf8.count <= 1024 * 1024, !nonempty || !text.isEmpty else { throw ContentError.invalid("本文の文字列が無効です。") }
        }
        mutating func blocks(_ values: [NativeBlock], depth: Int) throws {
            for block in values {
                try element(depth: depth); try identifier(block.id)
                guard ids.insert(block.id).inserted else { throw ContentError.invalid("本文のIDが重複しています。") }
                guard let allowed = blockFields[block.type], block.fields == allowed else { throw ContentError.invalid("本文ブロックのフィールドが形式と一致しません。") }
                switch block.type {
                case "heading":
                    guard let id = block.heading_id, let level = block.level, let spans = block.inlines,
                          (1...6).contains(level), headings[id] == nil else { throw ContentError.invalid("見出しが無効です。") }
                    try identifier(id); headings[id] = level
                    try inlines(spans, depth: depth + 1, nonempty: true)
                case "paragraph":
                    guard let spans = block.inlines else { throw ContentError.invalid("段落の本文がありません。") }
                    try inlines(spans, depth: depth + 1, nonempty: true)
                case "list":
                    guard block.ordered != nil, let start = block.start, (1...1_000_000).contains(start),
                          let items = block.items, !items.isEmpty, items.count <= 1000 else { throw ContentError.invalid("リストが無効です。") }
                    for item in items {
                        try element(depth: depth + 1); try identifier(item.id)
                        guard ids.insert(item.id).inserted, !item.blocks.isEmpty else { throw ContentError.invalid("リスト項目が無効です。") }
                        try blocks(item.blocks, depth: depth + 2)
                    }
                case "quote":
                    guard let children = block.blocks, !children.isEmpty else { throw ContentError.invalid("引用の本文がありません。") }
                    try blocks(children, depth: depth + 1)
                case "code":
                    guard let language = block.language, let content = block.text, language.utf8.count <= 64 else { throw ContentError.invalid("コードが無効です。") }
                    try text(content)
                case "table":
                    guard let table = block.table, (1...64).contains(table.header.count), table.rows.count <= 1000,
                          table.alignments.count == table.header.count,
                          table.alignments.allSatisfy({ ["left", "center", "right"].contains($0) }),
                          table.rows.allSatisfy({ $0.count == table.header.count }) else { throw ContentError.invalid("表が無効です。") }
                    for row in [table.header] + table.rows {
                        try element(depth: depth + 1)
                        for cell in row { try element(depth: depth + 2); try inlines(cell, depth: depth + 3) }
                    }
                case "diagram", "math":
                    guard let image = block.asset, let source = block.source, let description = block.accessibility_text else { throw ContentError.invalid("図・数式が無効です。") }
                    try text(source, nonempty: true); try text(description, nonempty: true); try asset(image)
                case "thematic_break": break
                default: throw ContentError.invalid("未知の本文ブロックです。")
                }
            }
        }
        mutating func inlines(_ values: [NativeInline], depth: Int, nonempty: Bool = false) throws {
            guard !nonempty || !values.isEmpty else { throw ContentError.invalid("本文のインラインがありません。") }
            for inline in values {
                try element(depth: depth)
                guard let allowed = inlineFields[inline.type], inline.fields == allowed else { throw ContentError.invalid("インラインのフィールドが形式と一致しません。") }
                switch inline.type {
                case "text", "code":
                    guard let value = inline.text else { throw ContentError.invalid("インラインの文字列がありません。") }; try text(value)
                case "strong", "emphasis":
                    guard let children = inline.children else { throw ContentError.invalid("強調の本文がありません。") }
                    try inlines(children, depth: depth + 1, nonempty: true)
                case "link":
                    guard let children = inline.children, let target = inline.target else { throw ContentError.invalid("リンクが無効です。") }
                    try inlines(children, depth: depth + 1, nonempty: true); try link(target)
                case "math":
                    guard let image = inline.asset, let source = inline.source, let description = inline.accessibility_text else { throw ContentError.invalid("数式が無効です。") }
                    try text(source, nonempty: true); try text(description, nonempty: true); try asset(image)
                case "soft_break", "hard_break": break
                default: throw ContentError.invalid("未知のインラインです。")
                }
            }
        }
        func link(_ value: NativeLink) throws {
            switch value.kind {
            case "article":
                guard let id = value.article_id, let article = manifest.articles.first(where: { $0.id == id }), value.url == nil,
                      value.heading_id == nil || article.headings.contains(where: { $0.id == value.heading_id }) else { throw ContentError.invalid("記事リンクの参照先がありません。") }
            case "external":
                guard let raw = value.url, raw.utf8.count <= 8192, let url = URL(string: raw), url.scheme == "https",
                      url.host?.isEmpty == false, url.user == nil, url.password == nil,
                      value.article_id == nil, value.heading_id == nil,
                      !raw.unicodeScalars.contains(where: { CharacterSet.controlCharacters.contains($0) }) else { throw ContentError.invalid("外部リンクは資格情報なしのHTTPSに限定します。") }
            default: throw ContentError.invalid("未知のリンク形式です。")
            }
        }
        mutating func asset(_ value: NativeAsset) throws {
            guard value.width.isFinite, value.height.isFinite, value.scale.isFinite,
                  value.width > 0, value.height > 0, value.width <= 8192, value.height <= 8192,
                  value.scale > 0, value.scale <= 4,
                  value.baseline == nil || (value.baseline!.isFinite && value.baseline! >= 0 && value.baseline! <= value.height) else {
                throw ContentError.invalid("PNGの表示寸法が無効です。")
            }
            for path in [value.light, value.dark] {
                guard path.hasSuffix(".png"), let digest = manifest.files[path] else { throw ContentError.invalid("PNGがファイル一覧にありません。") }
                let size: (Int, Int)
                if let cached = pngSizes[path] { size = cached }
                else {
                    let bytes = try verifiedData(path: path, digest: digest, root: root, maximumBytes: maximumPNGBytes)
                    size = try pngDimensions(bytes); pngSizes[path] = size
                }
                guard abs(Double(size.0) - value.width * value.scale) <= 2,
                      abs(Double(size.1) - value.height * value.scale) <= 2 else { throw ContentError.invalid("PNGのpixel寸法と表示寸法が一致しません。") }
            }
        }
    }

    private static func pngDimensions(_ data: Data) throws -> (Int, Int) {
        let bytes = [UInt8](data)
        guard bytes.count >= 57, Array(bytes.prefix(8)) == [137, 80, 78, 71, 13, 10, 26, 10] else { throw ContentError.invalid("PNG形式ではありません。") }
        func number(_ offset: Int) -> Int { (0..<4).reduce(0) { ($0 << 8) | Int(bytes[offset + $1]) } }
        guard number(8) == 13, Array(bytes[12..<16]) == [73, 72, 68, 82] else { throw ContentError.invalid("PNGのIHDRが無効です。") }
        let width = number(16), height = number(20)
        let validDepths: [UInt8: [UInt8]] = [0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16]]
        guard (1...maximumPixelDimension).contains(width), (1...maximumPixelDimension).contains(height),
              width * height <= maximumPixels, validDepths[bytes[25]]?.contains(bytes[24]) == true,
              bytes[26] == 0, bytes[27] == 0, bytes[28] <= 1 else { throw ContentError.invalid("PNGの寸法・形式が上限外です。") }
        var offset = 8, sawData = false, sawEnd = false, chunks = 0
        while offset + 12 <= bytes.count {
            chunks += 1
            let length = number(offset)
            guard chunks <= 4096, length <= bytes.count - offset - 12 else { throw ContentError.invalid("PNGのchunkが無効です。") }
            let kind = Array(bytes[(offset + 4)..<(offset + 8)])
            if kind == [73, 68, 65, 84] { sawData = sawData || length > 0 }
            if kind == [73, 69, 78, 68] {
                guard length == 0, offset + 12 == bytes.count else { throw ContentError.invalid("PNGの終端が無効です。") }
                sawEnd = true; break
            }
            offset += length + 12
        }
        guard sawData, sawEnd else { throw ContentError.invalid("PNGの画像データがありません。") }
        return (width, height)
    }
}
