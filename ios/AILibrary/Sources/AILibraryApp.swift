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
