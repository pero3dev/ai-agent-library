import SwiftUI

@main
struct AILibraryApp: App {
    @StateObject private var store: LibraryStore
    #if DEBUG
    private let uiTestDynamicTypeSize: DynamicTypeSize?
    #endif

    init() {
        // An explicit test launch uses a separate suite on Simulator and device.
        // Normal launches keep the user's reading records in standard defaults.
        #if DEBUG
        uiTestDynamicTypeSize = Self.requestedUITestDynamicTypeSize()
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
    private static func requestedUITestDynamicTypeSize() -> DynamicTypeSize? {
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
            if let uiTestDynamicTypeSize {
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
