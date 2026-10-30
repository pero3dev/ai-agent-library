import SwiftUI

@main
struct AILibraryApp: App {
    @StateObject private var store: LibraryStore

    init() {
        // An explicit test launch uses a separate suite on Simulator and device.
        // Normal launches keep the user's reading records in standard defaults.
        #if DEBUG
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

    var body: some Scene {
        WindowGroup { LibraryView(store: store) }
    }
}
