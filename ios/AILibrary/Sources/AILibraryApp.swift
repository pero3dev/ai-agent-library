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
