import SwiftUI
#if DEBUG
import Darwin
#endif

@main
struct AILibraryApp: App {
    @StateObject private var store: LibraryStore
    #if DEBUG
    private let uiTestDynamicTypeSize: DynamicTypeSize?
    private let uiTestFreshBundledLaunch: UITestFreshBundledLaunchContext?
    #endif

    init() {
        // An explicit test launch uses a separate suite on Simulator and device.
        // Normal launches keep the user's reading records in standard defaults.
        #if DEBUG
        uiTestDynamicTypeSize = Self.requestedUITestDynamicTypeSize()
        // Either new request field opts into a fail-closed DEBUG path. A malformed
        // or incomplete request must never reach ordinary content/defaults.
        let freshContext: UITestFreshBundledLaunchContext?
        do {
            if let request = try UITestFreshBundledLaunchRequest.parse(ProcessInfo.processInfo.environment) {
                guard let support = FileManager.default.urls(for: .applicationSupportDirectory,
                                                            in: .userDomainMask).first else {
                    preconditionFailure("Fresh bundled launch has no Application Support root")
                }
                let bundled = Bundle.main.url(forResource: "Content", withExtension: nil)
                    ?? Bundle.main.bundleURL.appendingPathComponent("Content", isDirectory: true)
                freshContext = try request.prepare(supportRoot: support, bundledRoot: bundled)
            } else {
                freshContext = nil
            }
        } catch {
            preconditionFailure("Invalid isolated fresh bundled launch: \(error)")
        }
        uiTestFreshBundledLaunch = freshContext
        if let context = freshContext {
            _store = StateObject(wrappedValue: LibraryStore(reading: ReadingStore(defaults: context.defaults),
                                                            bundledRoot: context.bundledRoot,
                                                            storageRoot: context.storageRoot))
            return
        }
        if let suite = ProcessInfo.processInfo.environment["AILIBRARY_UI_TEST_SUITE"],
           suite.hasPrefix("ailibrary-uitest-"), suite.count < 100,
           let defaults = UserDefaults(suiteName: suite) {
            // Seed only this explicit DEBUG test request in a fresh random suite.
            let suffix = String(suite.dropFirst("ailibrary-uitest-".count))
            if ProcessInfo.processInfo.environment["AILIBRARY_UI_TEST_READING_RECOVERY"] == "partial-v1",
               UUID(uuidString: suffix)?.uuidString == suffix,
               (defaults.persistentDomain(forName: suite)?.isEmpty ?? true) {
                let partial = Data(#"{"bookmarks":["01-concepts/agent-loop",7],"positions":{}}"#.utf8)
                defaults.set(partial, forKey: "library.reading.v1")
            }
            // A healthy old-format record is a separate request from damaged recovery.
            // An existing domain or any recovery request must never be overwritten.
            if ProcessInfo.processInfo.environment["AILIBRARY_UI_TEST_READING_LEGACY"] == "heading-v1",
               ProcessInfo.processInfo.environment["AILIBRARY_UI_TEST_READING_RECOVERY"] == nil,
               UUID(uuidString: suffix)?.uuidString == suffix,
               (defaults.persistentDomain(forName: suite)?.isEmpty ?? true) {
                let legacy = Data(#"{"bookmarks":["11-llm-internals/transformer-architecture"],"positions":{"11-llm-internals/transformer-architecture":{"heading":"自己注意の数式","fraction":0}},"lastArticleID":"11-llm-internals/transformer-architecture"}"#.utf8)
                defaults.set(legacy, forKey: "library.reading.v1")
            }
            _store = StateObject(wrappedValue: LibraryStore(reading: ReadingStore(defaults: defaults)))
            return
        }
        #endif
        _store = StateObject(wrappedValue: LibraryStore())
    }

    #if DEBUG
    static func requestedUITestDynamicTypeSize() -> DynamicTypeSize? {
        let environment = ProcessInfo.processInfo.environment
        guard let suite = environment["AILIBRARY_UI_TEST_SUITE"],
              suite.hasPrefix("ailibrary-uitest-"), suite.count < 100 else { return nil }
        let suffix = String(suite.dropFirst("ailibrary-uitest-".count))
        guard UUID(uuidString: suffix)?.uuidString == suffix else { return nil }
        switch environment["AILIBRARY_UI_TEST_DYNAMIC_TYPE"] ?? "" {
        case "default": return .large
        case "accessibility5": return .accessibility5
        default: return nil
        }
    }
    #endif

    var body: some Scene {
        WindowGroup {
            #if DEBUG
            if let uiTestFreshBundledLaunch {
                LibraryView(store: store).overlay(alignment: .bottom) {
                    UITestFreshBundledLaunchProbe(store: store, context: uiTestFreshBundledLaunch)
                }
            } else if let uiTestDynamicTypeSize {
                LibraryView(store: store).dynamicTypeSize(uiTestDynamicTypeSize)
            } else {
                LibraryView(store: store)
            }
            #else
            LibraryView(store: store)
            #endif
        }
    }
}

#if DEBUG
// This contract is deliberately separate from OS offline/install state. It reads
// metadata and isolated preferences only; no root or preferences are erased.
enum UITestFreshBundledLaunchError: Error, Equatable {
    case invalidRequest, unsupportedRoot, preferencesUnavailable
    case nonEmptyInitialReading, emptyResumeReading, storageNotAbsent
    case storageObservationFailed(Int32)
}

struct UITestFreshBundledLaunchRequest {
    enum Mode: String { case initial, resume }
    static let namespaceKey = "AILIBRARY_UI_TEST_FRESH_BUNDLE_UUID"
    static let modeKey = "AILIBRARY_UI_TEST_FRESH_BUNDLE_MODE"
    static let suiteKey = "AILIBRARY_UI_TEST_SUITE"
    static let storagePrefix = "LibraryFreshBundle-"
    let namespaceID: String
    let mode: Mode
    var suiteName: String { "ailibrary-uitest-" + namespaceID }

    private init(namespaceID: String, mode: Mode) { self.namespaceID = namespaceID; self.mode = mode }

    static func parse(_ environment: [String: String]) throws -> Self? {
        guard environment[namespaceKey] != nil || environment[modeKey] != nil else { return nil }
        guard let identifier = environment[namespaceKey],
              UUID(uuidString: identifier)?.uuidString == identifier,
              let rawMode = environment[modeKey], let mode = Mode(rawValue: rawMode),
              environment[suiteKey] == "ailibrary-uitest-" + identifier,
              environment["AILIBRARY_UI_TEST_READING_RECOVERY"] == nil,
              environment["AILIBRARY_UI_TEST_READING_LEGACY"] == nil,
              environment["AILIBRARY_UI_TEST_DYNAMIC_TYPE"] == nil else {
            throw UITestFreshBundledLaunchError.invalidRequest
        }
        return Self(namespaceID: identifier, mode: mode)
    }

    func prepare(supportRoot: URL, bundledRoot: URL,
                 defaultsFactory: (String) -> UserDefaults? = { UserDefaults(suiteName: $0) }) throws -> UITestFreshBundledLaunchContext {
        guard supportRoot.isFileURL, bundledRoot.isFileURL else {
            throw UITestFreshBundledLaunchError.unsupportedRoot
        }
        guard let defaults = defaultsFactory(suiteName) else {
            throw UITestFreshBundledLaunchError.preferencesUnavailable
        }
        let readingEmpty = defaults.persistentDomain(forName: suiteName)?.isEmpty ?? true
        if mode == .initial && !readingEmpty { throw UITestFreshBundledLaunchError.nonEmptyInitialReading }
        if mode == .resume && readingEmpty { throw UITestFreshBundledLaunchError.emptyResumeReading }
        let storage = supportRoot.appendingPathComponent(Self.storagePrefix + namespaceID, isDirectory: true)
        let storageAbsent = try UITestFreshBundledLaunchContext.isAbsent(storage)
        guard storageAbsent else { throw UITestFreshBundledLaunchError.storageNotAbsent }
        return UITestFreshBundledLaunchContext(request: self, defaults: defaults, storageRoot: storage,
                                               bundledRoot: bundledRoot, initialRootAbsent: storageAbsent,
                                               initialReadingEmpty: readingEmpty)
    }
}

struct UITestFreshBundledLaunchContext {
    let request: UITestFreshBundledLaunchRequest
    let defaults: UserDefaults
    let storageRoot: URL
    let bundledRoot: URL
    let initialRootAbsent: Bool
    let initialReadingEmpty: Bool

    fileprivate init(request: UITestFreshBundledLaunchRequest, defaults: UserDefaults, storageRoot: URL,
                     bundledRoot: URL, initialRootAbsent: Bool, initialReadingEmpty: Bool) {
        self.request = request; self.defaults = defaults; self.storageRoot = storageRoot
        self.bundledRoot = bundledRoot; self.initialRootAbsent = initialRootAbsent
        self.initialReadingEmpty = initialReadingEmpty
    }

    static func isAbsent(_ root: URL) throws -> Bool {
        guard root.isFileURL else { throw UITestFreshBundledLaunchError.unsupportedRoot }
        // A trailing slash can make even lstat follow a final directory symlink.
        // Observe the final entry itself, including a dangling link, without following it.
        var path = root.path
        while path.count > 1 && path.hasSuffix("/") { path.removeLast() }
        var information = stat()
        if path.withCString({ lstat($0, &information) }) == 0 { return false }
        let code = errno
        guard code == ENOENT else { throw UITestFreshBundledLaunchError.storageObservationFailed(code) }
        return true
    }

    // Called on a load boundary, never by an accessibility getter or UI predicate.
    func observation(snapshotRoot: URL, articleCount: Int) throws -> UITestFreshBundledLaunchProof {
        let absent = try Self.isAbsent(storageRoot)
        let bundled = snapshotRoot.standardizedFileURL == bundledRoot.standardizedFileURL
        return UITestFreshBundledLaunchProof(status: absent && bundled && articleCount > 0 ? "passed" : "failed",
            mode: request.mode.rawValue, namespaceID: request.namespaceID,
            storageNamespace: storageRoot.lastPathComponent, readingSuite: request.suiteName,
            rootInitiallyAbsent: initialRootAbsent, readingInitiallyEmpty: initialReadingEmpty,
            selectedBundledRoot: bundled, rootAbsentAfterLoad: absent, articleCount: articleCount)
    }
}

struct UITestFreshBundledLaunchProof: Encodable {
    let schemaVersion = 1
    let status: String
    let mode: String
    let namespaceID: String
    let storageNamespace: String
    let readingSuite: String
    let rootInitiallyAbsent: Bool
    let readingInitiallyEmpty: Bool
    let selectedBundledRoot: Bool
    let rootAbsentAfterLoad: Bool
    let articleCount: Int

    func boundedJSON() -> String {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
        guard let data = try? encoder.encode(self), data.count <= 1024 else {
            return #"{"schemaVersion":1,"status":"failed"}"#
        }
        return String(decoding: data, as: UTF8.self)
    }
}

private struct UITestFreshBundledLaunchProbe: View {
    @ObservedObject var store: LibraryStore
    let context: UITestFreshBundledLaunchContext
    @State private var captured = #"{"schemaVersion":1,"status":"loading"}"#

    var body: some View {
        Text("同梱起動の試験証拠")
            .font(.caption2).padding(2).background(.thinMaterial)
            .accessibilityElement(children: .ignore)
            .accessibilityIdentifier("uitest-fresh-bundled-launch-proof")
            .accessibilityValue(Text(captured))
            .allowsHitTesting(false)
            .task(id: store.snapshot?.root) {
                guard let snapshot = store.snapshot else { return }
                do {
                    captured = try context.observation(snapshotRoot: snapshot.root,
                        articleCount: snapshot.manifest.articles.count).boundedJSON()
                } catch {
                    captured = #"{"schemaVersion":1,"status":"failed","reason":"metadata"}"#
                }
            }
    }
}

/// Test-only metadata on existing AX elements, never a displayed control or a font override.
/// The app-local request and opt-in must both belong to the canonical isolated test suite.
enum UITestDynamicTypeProbe {
    static var requestedMode: String? {
        let environment = ProcessInfo.processInfo.environment
        guard environment["AILIBRARY_UI_TEST_DYNAMIC_TYPE_PROBE"] == "1",
              let suite = environment["AILIBRARY_UI_TEST_SUITE"],
              suite.hasPrefix("ailibrary-uitest-"), suite.count < 100 else { return nil }
        let suffix = String(suite.dropFirst("ailibrary-uitest-".count))
        guard UUID(uuidString: suffix)?.uuidString == suffix else { return nil }
        switch environment["AILIBRARY_UI_TEST_DYNAMIC_TYPE"] ?? "" {
        case "default": return "default"
        case "accessibility5": return "accessibility5"
        default: return nil
        }
    }

    static func name(_ size: DynamicTypeSize) -> String {
        switch size {
        case .xSmall: return "xSmall"
        case .small: return "small"
        case .medium: return "medium"
        case .large: return "large"
        case .xLarge: return "xLarge"
        case .xxLarge: return "xxLarge"
        case .xxxLarge: return "xxxLarge"
        case .accessibility1: return "accessibility1"
        case .accessibility2: return "accessibility2"
        case .accessibility3: return "accessibility3"
        case .accessibility4: return "accessibility4"
        case .accessibility5: return "accessibility5"
        @unknown default: return "unknown"
        }
    }

    static func value(stage: String, actual: DynamicTypeSize, fixtureSize: String?,
                      bodySize: CGFloat?, fontScale: CGFloat?, widths: [CGFloat], blockID: String?) -> String {
        guard let requestedMode, ["root", "fixture", "reader", "table"].contains(stage),
              widths.count <= 2, widths.allSatisfy({ $0.isFinite && $0 > 0 }),
              bodySize.map({ $0.isFinite && $0 > 0 }) ?? true,
              fontScale.map({ $0.isFinite && $0 > 0 }) ?? true,
              blockID.map({ $0.utf8.count <= 128 }) ?? true else {
            return #"{"schema":1,"status":"unavailable"}"#
        }
        var record: [String: Any] = ["schema": 1, "status": "observed", "stage": stage,
                                     "request": requestedMode, "actual": name(actual)]
        if stage == "fixture", let fixtureSize { record["sheetActual"] = fixtureSize }
        if let bodySize { record["bodySize"] = Double(bodySize) }
        if let fontScale { record["fontScale"] = Double(fontScale) }
        if !widths.isEmpty { record["widths"] = widths.map(Double.init) }
        if let blockID { record["blockID"] = blockID }
        guard let data = try? JSONSerialization.data(withJSONObject: record, options: [.sortedKeys]),
              data.count <= 512 else { return #"{"schema":1,"status":"unavailable"}"# }
        return String(decoding: data, as: UTF8.self)
    }
}

private struct UITestDynamicTypeFixtureSizeKey: EnvironmentKey {
    static let defaultValue: String? = nil
}
extension EnvironmentValues {
    var uiTestDynamicTypeFixtureSize: String? {
        get { self[UITestDynamicTypeFixtureSizeKey.self] }
        set { self[UITestDynamicTypeFixtureSizeKey.self] = newValue }
    }
}

struct UITestDynamicTypeProbeValue: ViewModifier {
    let stage: String
    var bodySize: CGFloat? = nil
    var fontScale: CGFloat? = nil
    var widths: [CGFloat] = []
    var blockID: String? = nil
    @Environment(\.dynamicTypeSize) private var actualSize
    @Environment(\.uiTestDynamicTypeFixtureSize) private var fixtureSize

    @ViewBuilder func body(content: Content) -> some View {
        if UITestDynamicTypeProbe.requestedMode != nil {
            content.accessibilityValue(Text(UITestDynamicTypeProbe.value(stage: stage, actual: actualSize,
                fixtureSize: fixtureSize, bodySize: bodySize, fontScale: fontScale, widths: widths, blockID: blockID)))
        } else {
            content
        }
    }
}
#endif
