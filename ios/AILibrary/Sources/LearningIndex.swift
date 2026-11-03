import CryptoKit
import Foundation

/// Optional, read-only navigation metadata. Its source hashes identify the exported
/// sources; the device does not have the original Markdown bytes to revalidate.
struct NativeLearningIndex: Decodable, Sendable {
    static let path = "assets/learning/index.json"
    static let maximumBytes = 4 * 1024 * 1024
    static let maximumTextBytes = 16 * 1024

    let schema_version: Int
    let source_sha256: [String: String]
    let article_tags: [String: [String]]
    let chapters: [NativeLearningChapter]
    let routes: [NativeLearningRoute]
    let glossary: [NativeLearningTerm]

    init(from decoder: Decoder) throws {
        let fields = try learningFields(decoder, ["schema_version", "source_sha256", "article_tags", "chapters", "routes", "glossary"])
        schema_version = try fields.decode(Int.self, forKey: .key("schema_version"))
        source_sha256 = try fields.decode([String: String].self, forKey: .key("source_sha256"))
        article_tags = try fields.decode([String: [String]].self, forKey: .key("article_tags"))
        chapters = try fields.decode([NativeLearningChapter].self, forKey: .key("chapters"))
        routes = try fields.decode([NativeLearningRoute].self, forKey: .key("routes"))
        glossary = try fields.decode([NativeLearningTerm].self, forKey: .key("glossary"))
    }

    static func decode(data: Data, manifest: ContentManifest) throws -> Self {
        try preflight(data)
        let index = try JSONDecoder().decode(Self.self, from: data)
        try index.validate(manifest: manifest)
        return index
    }

    /// Call with the snapshot accepted by ContentValidator. Absence is compatible
    /// with old packages; a declared, unlisted, or malformed sidecar fails explicitly.
    static func load(from snapshot: ContentSnapshot, fileManager: FileManager = .default) throws -> Self? {
        guard snapshot.manifest.schema_version == 2, snapshot.root.isFileURL,
              try fileManager.attributesOfItem(atPath: snapshot.root.path)[.type] as? FileAttributeType == .typeDirectory else {
            throw learningError("索引のルートフォルダが無効です。")
        }
        let digest = snapshot.manifest.files[path]
        if let digest, !ContentValidator.isDigest(digest) { throw learningError("索引のSHA-256が無効です。") }
        var url = snapshot.root
        let components = path.split(separator: "/")
        for (offset, component) in components.enumerated() {
            url.appendPathComponent(String(component))
            let attributes: [FileAttributeKey: Any]
            do { attributes = try fileManager.attributesOfItem(atPath: url.path) }
            catch {
                let failure = error as NSError
                if digest == nil, failure.domain == NSCocoaErrorDomain,
                   [NSFileNoSuchFileError, NSFileReadNoSuchFileError].contains(failure.code) { return nil }
                throw error
            }
            let expected: FileAttributeType = offset == components.count - 1 ? .typeRegular : .typeDirectory
            guard attributes[.type] as? FileAttributeType == expected else {
                throw learningError("索引に通常のファイル・フォルダ以外が含まれています。")
            }
            if offset == components.count - 1 {
                guard let size = attributes[.size] as? NSNumber, size.int64Value > 0,
                      size.int64Value <= Int64(maximumBytes) else { throw learningError("索引の容量上限を超えています。") }
            }
        }
        guard let digest, url.resolvingSymlinksInPath().standardizedFileURL.path.hasPrefix(snapshot.readAccessRoot.path + "/") else {
            throw learningError("索引がファイル一覧にありません。")
        }
        let handle = try FileHandle(forReadingFrom: url)
        defer { try? handle.close() }
        // A size check alone is insufficient if a file grows between checking and reading.
        var data = Data()
        while data.count <= maximumBytes {
            let remaining = maximumBytes + 1 - data.count
            guard let chunk = try handle.read(upToCount: min(64 * 1024, remaining)), !chunk.isEmpty else { break }
            data.append(chunk)
        }
        guard data.count <= maximumBytes,
              SHA256.hash(data: data).map({ String(format: "%02x", $0) }).joined() == digest else {
            throw learningError("索引のSHA-256または容量が一致しません。")
        }
        return try decode(data: data, manifest: snapshot.manifest)
    }

    private static func preflight(_ data: Data) throws {
        guard !data.isEmpty, data.count <= maximumBytes, String(data: data, encoding: .utf8) != nil else {
            throw learningError("索引の容量またはUTF-8が無効です。")
        }
        // Bound nesting before Foundation's JSON parser allocates a nested tree.
        // Schema 1 needs at most eight nested containers, including link targets.
        struct Container {
            let opening: UInt8
            var expectingKey: Bool
            var keys = Set<String>()
        }
        var containers: [Container] = []
        var quoted = false
        var escaped = false
        var keyStart: Int?
        for (offset, byte) in data.enumerated() {
            if quoted {
                if escaped { escaped = false }
                else if byte == 92 { escaped = true }
                else if byte == 34 {
                    quoted = false
                    if let start = keyStart {
                        let keyData = Data(data.dropFirst(start).prefix(offset - start + 1))
                        let key = try JSONDecoder().decode(String.self, from: keyData)
                        guard key.utf8.count <= maximumTextBytes,
                              containers[containers.count - 1].keys.insert(key).inserted else {
                            throw learningError("索引JSONのキーが重複または長すぎます。")
                        }
                    }
                    keyStart = nil
                }
            } else if byte == 34 {
                quoted = true
                keyStart = containers.last?.expectingKey == true ? offset : nil
            }
            else if byte == 123 || byte == 91 {
                containers.append(Container(opening: byte, expectingKey: byte == 123))
                guard containers.count <= 12 else { throw learningError("索引JSONが深すぎます。") }
            } else if byte == 125 || byte == 93 {
                guard let container = containers.popLast(),
                      (container.opening == 123 && byte == 125) || (container.opening == 91 && byte == 93) else {
                    throw learningError("索引JSONの構造が無効です。")
                }
            } else if byte == 58, containers.last?.opening == 123 {
                containers[containers.count - 1].expectingKey = false
            } else if byte == 44, containers.last?.opening == 123 {
                containers[containers.count - 1].expectingKey = true
            }
        }
        guard !quoted, containers.isEmpty else { throw learningError("索引JSONの構造が無効です。") }
    }

    private func validate(manifest: ContentManifest) throws {
        guard schema_version == 1, manifest.schema_version == 2, (1...2000).contains(manifest.articles.count),
              (1...100).contains(chapters.count), (1...2000).contains(glossary.count) else {
            throw learningError("索引の形式・件数が無効です。")
        }
        var articles: [String: LibraryArticle] = [:]
        for article in manifest.articles {
            guard article.id.utf8.count <= 512, Self.matches(article.id, "[0-9]{2}-[a-z0-9-]+/[a-z0-9-]+"),
                  article.source_path == "docs/\(article.id).md", ContentValidator.isDigest(article.source_sha256),
                  articles.updateValue(article, forKey: article.id) == nil,
                  Set(article.headings.map(\.id)).count == article.headings.count else {
                throw learningError("索引と記事の識別情報が一致しません。")
            }
        }
        let articleIDs = Set(articles.keys)
        guard articleIDs.contains("00-overview/learning-roadmap") else {
            throw learningError("索引には学習ロードマップ記事が必要です。")
        }
        guard Set(article_tags.keys) == articleIDs else { throw learningError("索引のタグ対象が記事一覧と一致しません。") }
        for tags in article_tags.values {
            guard tags.count <= 64, Set(tags).count == tags.count,
                  tags.allSatisfy({ $0.utf8.count <= 128 && Self.matches($0, "[a-z0-9]+(?:-[a-z0-9]+)*") }) else {
                throw learningError("索引のタグが無効または重複しています。")
            }
        }
        let chapterIDs = Set(articleIDs.map { String($0.split(separator: "/")[0]) })
        guard chapters.map(\.id) == chapterIDs.sorted() else { throw learningError("索引の章と順序が記事一覧と一致しません。") }
        var covered = Set<String>()
        for chapter in chapters {
            try Self.text(chapter.title); try Self.text(chapter.description)
            guard !chapter.article_ids.isEmpty, chapter.article_ids.count <= 2000 else { throw learningError("索引の章が空または大きすぎます。") }
            for id in chapter.article_ids {
                guard articleIDs.contains(id), id.hasPrefix(chapter.id + "/"), covered.insert(id).inserted else {
                    throw learningError("索引の章に無効または重複する記事があります。")
                }
            }
        }
        guard covered == articleIDs else { throw learningError("索引の章に記事が不足しています。") }
        let sourcePaths = Set(manifest.articles.map(\.source_path))
            .union(chapterIDs.map { "docs/\($0)/README.md" }).union(["GLOSSARY.md"])
        guard Set(source_sha256.keys) == sourcePaths,
              source_sha256.allSatisfy({ ContentValidator.isSafeRelativePath($0.key) && ContentValidator.isDigest($0.value) }),
              manifest.articles.allSatisfy({ source_sha256[$0.source_path] == $0.source_sha256 }) else {
            throw learningError("索引の原本パス・SHA-256が記事一覧と一致しません。")
        }
        guard routes.map(\.id) == Array("ABCDEFGH").map(String.init) else { throw learningError("索引の学習ルート順が無効です。") }
        for route in routes {
            try Self.text(route.label); try Self.text(route.persona)
            guard (1...128).contains(route.steps.count) else { throw learningError("索引の学習ステップ数が無効です。") }
            for step in route.steps {
                guard (1...64).contains(step.inlines.count) else { throw learningError("索引の学習ステップ内の項目数が無効です。") }
                var hasContent = false
                for inline in step.inlines {
                    switch inline {
                    case .text(let value):
                        try Self.text(value, empty: true)
                        hasContent = hasContent || !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                    case .link(let value, let target):
                        try Self.text(value); try Self.target(target, articles: articles, chapters: chapterIDs)
                        hasContent = true
                    }
                }
                guard hasContent else { throw learningError("索引の学習ステップに本文またはリンクがありません。") }
            }
        }
        var termIDs = Set<String>()
        for term in glossary {
            try Self.text(term.id); try Self.text(term.name); try Self.text(term.summary)
            if let english = term.english { try Self.text(english) }
            guard termIDs.insert(term.id).inserted, term.links.count <= 256 else { throw learningError("索引の用語IDまたはリンク数が無効です。") }
            for link in term.links {
                try Self.text(link.label); try Self.target(link.target, articles: articles, chapters: chapterIDs)
            }
        }
    }

    private static func target(_ target: NativeLearningTarget, articles: [String: LibraryArticle], chapters: Set<String>) throws {
        switch target {
        case .article(let id, let heading):
            guard let article = articles[id] else { throw learningError("索引から参照する記事がありません。") }
            if let heading {
                guard !heading.isEmpty, heading.utf8.count <= 256, article.headings.contains(where: { $0.id == heading }) else {
                    throw learningError("索引から参照する見出しがありません。")
                }
            }
        case .chapter(let id):
            guard chapters.contains(id) else { throw learningError("索引から参照する章がありません。") }
        case .external(let value):
            try text(value)
            guard let parts = URLComponents(string: value), parts.scheme == "https", let host = parts.host, !host.isEmpty,
                  parts.user == nil, parts.password == nil, parts.url != nil else { throw learningError("索引の外部リンクが無効です。") }
        }
    }

    private static func text(_ value: String, empty: Bool = false) throws {
        guard value.utf8.count <= maximumTextBytes, empty || !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw learningError("索引の文字列が空または長すぎます。")
        }
    }

    private static func matches(_ value: String, _ expression: String) -> Bool {
        value.range(of: "\\A(?:" + expression + ")\\z", options: .regularExpression) != nil
    }
}

struct NativeLearningChapter: Decodable, Sendable, Identifiable {
    let id: String
    let title: String
    let description: String
    let article_ids: [String]

    init(from decoder: Decoder) throws {
        let fields = try learningFields(decoder, ["id", "title", "description", "article_ids"])
        id = try fields.decode(String.self, forKey: .key("id"))
        title = try fields.decode(String.self, forKey: .key("title"))
        description = try fields.decode(String.self, forKey: .key("description"))
        article_ids = try fields.decode([String].self, forKey: .key("article_ids"))
    }
}

struct NativeLearningRoute: Decodable, Sendable, Identifiable {
    let id: String
    let label: String
    let persona: String
    let steps: [NativeLearningStep]

    init(from decoder: Decoder) throws {
        let fields = try learningFields(decoder, ["id", "label", "persona", "steps"])
        id = try fields.decode(String.self, forKey: .key("id"))
        label = try fields.decode(String.self, forKey: .key("label"))
        persona = try fields.decode(String.self, forKey: .key("persona"))
        steps = try fields.decode([NativeLearningStep].self, forKey: .key("steps"))
    }
}

struct NativeLearningStep: Decodable, Sendable {
    let inlines: [NativeLearningInline]

    init(from decoder: Decoder) throws {
        let fields = try learningFields(decoder, ["inlines"])
        inlines = try fields.decode([NativeLearningInline].self, forKey: .key("inlines"))
    }
}

enum NativeLearningInline: Decodable, Hashable, Sendable {
    case text(String)
    case link(text: String, target: NativeLearningTarget)

    init(from decoder: Decoder) throws {
        let fields = try decoder.container(keyedBy: LearningKey.self)
        let type = try fields.decode(String.self, forKey: .key("type"))
        switch type {
        case "text":
            try learningKeys(fields, ["type", "text"])
            self = .text(try fields.decode(String.self, forKey: .key("text")))
        case "link":
            try learningKeys(fields, ["type", "text", "target"])
            self = .link(text: try fields.decode(String.self, forKey: .key("text")),
                         target: try fields.decode(NativeLearningTarget.self, forKey: .key("target")))
        default: throw learningError("索引の文中項目の型が無効です。")
        }
    }
}

enum NativeLearningTarget: Decodable, Hashable, Sendable {
    case article(articleID: String, headingID: String?)
    case chapter(chapterID: String)
    case external(url: String)

    init(from decoder: Decoder) throws {
        let fields = try decoder.container(keyedBy: LearningKey.self)
        let type = try fields.decode(String.self, forKey: .key("type"))
        switch type {
        case "article":
            let hasHeading = fields.contains(.key("heading_id"))
            try learningKeys(fields, hasHeading ? ["type", "article_id", "heading_id"] : ["type", "article_id"])
            self = .article(articleID: try fields.decode(String.self, forKey: .key("article_id")),
                            headingID: hasHeading ? try fields.decode(String.self, forKey: .key("heading_id")) : nil)
        case "chapter":
            try learningKeys(fields, ["type", "chapter_id"])
            self = .chapter(chapterID: try fields.decode(String.self, forKey: .key("chapter_id")))
        case "external":
            try learningKeys(fields, ["type", "url"])
            self = .external(url: try fields.decode(String.self, forKey: .key("url")))
        default: throw learningError("索引のリンク先の型が無効です。")
        }
    }
}

struct NativeLearningTerm: Decodable, Sendable, Identifiable {
    let id: String
    let name: String
    let english: String?
    let summary: String
    let links: [NativeLearningLink]

    init(from decoder: Decoder) throws {
        let fields = try learningFields(decoder, ["id", "name", "english", "summary", "links"])
        id = try fields.decode(String.self, forKey: .key("id"))
        name = try fields.decode(String.self, forKey: .key("name"))
        english = try fields.decodeIfPresent(String.self, forKey: .key("english"))
        summary = try fields.decode(String.self, forKey: .key("summary"))
        links = try fields.decode([NativeLearningLink].self, forKey: .key("links"))
    }
}

struct NativeLearningLink: Decodable, Hashable, Sendable {
    let label: String
    let target: NativeLearningTarget

    init(from decoder: Decoder) throws {
        let fields = try learningFields(decoder, ["label", "target"])
        label = try fields.decode(String.self, forKey: .key("label"))
        target = try fields.decode(NativeLearningTarget.self, forKey: .key("target"))
    }
}

private struct LearningKey: CodingKey {
    let stringValue: String
    var intValue: Int? { nil }
    init?(stringValue: String) { self.stringValue = stringValue }
    init?(intValue: Int) { return nil }
    static func key(_ value: String) -> Self { Self(stringValue: value)! }
}

private func learningFields(_ decoder: Decoder, _ keys: Set<String>) throws -> KeyedDecodingContainer<LearningKey> {
    let fields = try decoder.container(keyedBy: LearningKey.self)
    try learningKeys(fields, keys)
    return fields
}

private func learningKeys(_ fields: KeyedDecodingContainer<LearningKey>, _ keys: Set<String>) throws {
    guard Set(fields.allKeys.map(\.stringValue)) == keys else { throw learningError("索引のフィールドが形式と一致しません。") }
}

private func learningError(_ detail: String) -> ContentError { .invalid("学習案内: " + detail) }
