import Foundation
import XCTest

/// Observes the Debug Simulator launch-to-ready UI transaction, including
/// accessibility synchronization. It is not cold launch or a device SLO.
final class PublishedPerformanceUITests: XCTestCase {
    private var app: XCUIApplication!
    private var expectedPublishedCount = 0

    override func setUpWithError() throws {
        continueAfterFailure = false
        let environment = ProcessInfo.processInfo.environment
        guard environment["AILIBRARY_PERFORMANCE_RUNNER"] == "1",
              let raw = environment["AILIBRARY_EXPECTED_PUBLISHED_COUNT"],
              let count = Int(raw), (4...2000).contains(count) else {
            throw NSError(domain: "PublishedPerformanceUITests", code: 1,
                userInfo: [NSLocalizedDescriptionKey:
                    "A dedicated performance runner and independently audited published count greater than three are required."])
        }
        expectedPublishedCount = count
        app = XCUIApplication()
        app.launchEnvironment["AILIBRARY_UI_TEST_SUITE"] = "ailibrary-uitest-performance-" + UUID().uuidString
        app.launchArguments = ["-AppleLanguages", "(ja)", "-AppleLocale", "ja_JP"]
        // Setup deliberately does not launch. Content storage is not replaced or
        // reset; the dedicated CI runner/Simulator must be fresh and never import.
    }

    func testLaunchToPublishedReadiness() throws {
        defer { app.terminate() }
        let countLabel = app.staticTexts["library-article-count"]
        let guide = app.buttons["library-learning-guide"]
        let options = XCTMeasureOptions()
        options.iterationCount = 3
        options.invocationOptions = [.manuallyStart, .manuallyStop]
        var invocations = 0

        measure(metrics: [XCTClockMetric()], options: options) {
            app.terminate()
            invocations += 1
            startMeasuring()
            app.launch()
            XCTAssertTrue(countLabel.waitForExistence(timeout: 45),
                          "The asynchronous full-catalog load must finish before readiness.")
            XCTAssertEqual(countLabel.label, "全\(expectedPublishedCount)記事")
            XCTAssertTrue(guide.waitForExistence(timeout: 10),
                          "The accepted learning index must also be ready.")
            stopMeasuring()
        }

        // XCTest discards one warm-up invocation and records three iterations.
        // CSV/xcresult extraction verifies the actual measurements separately.
        XCTAssertEqual(invocations, 4)
        let protocolRecord: [String: Any] = [
            "scenario": "launch-to-published-readiness",
            "expected_articles": expectedPublishedCount,
            "observed_count_label": countLabel.label,
            "guide_present": guide.exists,
            "declared_recorded_iterations": 3,
            "block_invocations": invocations,
            "discarded_warmup_invocations": 1,
            "metric": "XCTClockMetric",
            "boundary": "app.launch through exact full count and learning guide; app termination excluded",
            "limits": "Debug Simulator; UI automation and AX polling included; not cold disk, first install, Release, device or a product performance target"
        ]
        let bytes = try JSONSerialization.data(withJSONObject: protocolRecord, options: [.sortedKeys])
        let attachment = XCTAttachment(string: String(decoding: bytes, as: UTF8.self))
        attachment.name = "Published-readiness-measurement-protocol"
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}


/// First observation of app-process memory plus the public search transaction.
/// Kept separate from the existing launch Clock and functional UI selectors.
final class PublishedAppMemoryUITests: XCTestCase {
    private func visibleAndHittable(_ element: XCUIElement, in app: XCUIApplication) -> Bool {
        guard element.exists else { return false }
        let frame = element.frame, viewport = app.frame
        guard !frame.isNull, !frame.isInfinite, !frame.isEmpty,
              !viewport.isNull, !viewport.isInfinite, !viewport.isEmpty,
              [frame.minX, frame.minY, frame.width, frame.height,
               viewport.minX, viewport.minY, viewport.width, viewport.height].allSatisfy(\.isFinite),
              frame.intersects(viewport) else { return false }
        return element.isHittable
    }

    private func waitUntil(_ condition: @escaping () -> Bool, timeout: TimeInterval) -> Bool {
        let ready = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in condition() }, object: nil)
        return XCTWaiter.wait(for: [ready], timeout: timeout) == .completed
    }

    @MainActor
    func testSearchFullPublishedCatalogMemoryAndClock() throws {
        continueAfterFailure = false
        let environment = ProcessInfo.processInfo.environment
        guard environment["AILIBRARY_MEMORY_PROFILE_RUNNER"] == "1",
              let raw = environment["AILIBRARY_EXPECTED_PUBLISHED_COUNT"],
              let expected = Int(raw), (4...2000).contains(expected) else {
            throw NSError(domain: "PublishedAppMemoryUITests", code: 1,
                userInfo: [NSLocalizedDescriptionKey: "A dedicated runner and independently audited full published count are required."])
        }
        let app = XCUIApplication()
        app.launchEnvironment["AILIBRARY_UI_TEST_SUITE"] = "ailibrary-uitest-app-memory-" + UUID().uuidString
        app.launchArguments = ["-AppleLanguages", "(ja)", "-AppleLocale", "ja_JP"]
        let query = "回復 チャンス 一時的"
        let targetID = "library-article-01-concepts/agent-loop"
        // Apple's WWDC21 UI example constructs the app-bound metric first.
        // The default XCTMemoryMetric() would measure the UI-test process.
        let memoryMetric = XCTMemoryMetric(application: app)
        let clockMetric = XCTClockMetric()
        let options = XCTMeasureOptions()
        options.iterationCount = 5
        options.invocationOptions = [.manuallyStart, .manuallyStop]
        var invocations = 0
        var observations: [[String: Any]] = []
        defer { app.terminate() }

        measure(metrics: [memoryMetric, clockMetric], options: options) {
            invocations += 1
            // launch may replace the previous process; this is before start.
            app.launch()
            let count = app.staticTexts["library-article-count"]
            let guide = app.buttons["library-learning-guide"]
            guard count.waitForExistence(timeout: 45), count.label == "全\(expected)記事",
                  guide.waitForExistence(timeout: 10), app.state == .runningForeground else {
                XCTFail("The exact full catalog and learning guide must be ready before measurement.")
                return
            }
            let search = app.searchFields["記事の本文を検索"]
            var setupSwipes = 0
            while !self.visibleAndHittable(search, in: app), setupSwipes < 8 {
                app.swipeDown(velocity: .slow); setupSwipes += 1
            }
            guard self.visibleAndHittable(search, in: app) else {
                XCTFail("The real article search must be visible before measurement."); return
            }
            search.tap()
            guard self.waitUntil({ app.keyboards.firstMatch.exists }, timeout: 10),
                  let value = search.value as? String,
                  value.isEmpty || value == search.placeholderValue,
                  !app.staticTexts["library-filter-summary"].exists else {
                XCTFail("An empty, focused search with no active filters is required before start."); return
            }

            let summary = app.staticTexts["library-filter-summary"]
            let row = app.descendants(matching: .any).matching(identifier: targetID).firstMatch
            var measuredSwipes = 0
            startMeasuring()
            search.typeText(query + "\n")
            let queryReady = self.waitUntil({ summary.exists && summary.label.contains("検索: " + query) }, timeout: 15)
            if queryReady {
                while !self.visibleAndHittable(row, in: app), measuredSwipes < 12 {
                    app.swipeUp(velocity: .slow); measuredSwipes += 1
                }
            }
            let finalReady = queryReady && self.waitUntil({
                summary.exists && summary.label.contains("検索: " + query)
                    && self.visibleAndHittable(summary, in: app)
                    && self.visibleAndHittable(row, in: app)
            }, timeout: 15)
            stopMeasuring()
            observations.append([
                "invocation": invocations, "count_label_before_start": "全\(expected)記事",
                "guide_ready_before_start": true, "search_empty_and_focused_before_start": true,
                "query": query, "target_id": targetID, "query_summary_and_row_ready": finalReady,
                "setup_swipes_outside_interval": setupSwipes, "result_swipes_inside_interval": measuredSwipes
            ])
            XCTAssertTrue(finalReady, "The exact query summary and Agent-loop row must be visible and hittable.")
            XCTAssertFalse(app.scrollViews["native-reader"].exists, "This workload never opens article content.")
            // Keep the app alive through block return. Final terminate is outside measure.
        }
        let record: [String: Any] = [
            "schema_version": 1, "scenario": "published-search-app-memory-and-clock",
            "expected_articles": expected, "query": query, "target_id": targetID,
            "declared_iteration_count": 5, "observed_block_invocations": invocations,
            "observed_discarded_warmup_invocations": NSNull(), "observed_recorded_sample_count": NSNull(),
            "metric_identifiers": NSNull(), "metric_units": NSNull(), "measurement_row_cardinality": NSNull(),
            "declared_metrics": ["XCTMemoryMetric(application: app)", "XCTClockMetric"],
            "iterations": observations, "metric_contract": "unobserved-awaiting-raw-review",
            "boundary": "ready empty focused search; start, type fixed query, summary and Agent-loop row visible/hittable, stop; launch/setup/terminate excluded",
            "limits": "Debug Simulator app-process interval; Clock includes automation, keyboard, gestures and AX synchronization; not per-keystroke/render time, cold launch, reader memory, device acceptance or a product budget"
        ]
        let bytes = try JSONSerialization.data(withJSONObject: record, options: [.sortedKeys])
        let attachment = XCTAttachment(string: String(decoding: bytes, as: UTF8.self))
        attachment.name = "Published-app-memory-search-protocol"
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
