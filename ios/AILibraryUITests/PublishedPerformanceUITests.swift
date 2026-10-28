import Foundation
import XCTest

/// Observes one explicitly selected Debug Simulator UI transaction, including
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

    /// Includes public keyboard input and AX readiness checks, not query-engine-only cost.
    /// This case is selected explicitly; automatic observations still select launch only.
    func testSearchQueryToVisibleWitness() throws {
        guard ProcessInfo.processInfo.environment["AILIBRARY_PERFORMANCE_SCENARIO"] == "search-query-to-visible-witness" else {
            throw NSError(domain: "PublishedPerformanceUITests", code: 2,
                userInfo: [NSLocalizedDescriptionKey: "The search UI observation requires its explicit scenario."])
        }
        defer { app.terminate() }
        app.launch()
        let countLabel = app.staticTexts["library-article-count"]
        XCTAssertTrue(countLabel.waitForExistence(timeout: 45))
        XCTAssertEqual(countLabel.label, "全\(expectedPublishedCount)記事")
        XCTAssertTrue(app.buttons["library-learning-guide"].waitForExistence(timeout: 10))
        _ = try foregroundArticleSearch()
        let negative = "AILIBRARY_UI_PERF_NO_MATCH_67404f8127"
        let positive = "データを外部 API に出せるか"
        let options = XCTMeasureOptions()
        options.iterationCount = 3
        options.invocationOptions = [.manuallyStart, .manuallyStop]
        var invocations = 0

        measure(metrics: [XCTClockMetric()], options: options) {
            do {
                let search = try foregroundArticleSearch()
                replaceArticleQuery(negative, in: search)
                waitForSearchState(negative, search: search, empty: true)
                invocations += 1
                startMeasuring()
                replaceArticleQuery(positive, in: search)
                waitForSearchState(positive, search: search, empty: false)
                stopMeasuring()
            } catch {
                XCTFail("The public search control must remain unique and usable: \(error)")
            }
        }
        XCTAssertEqual(invocations, 4)
        let protocolRecord: [String: Any] = [
            "scenario": "search-query-to-visible-witness",
            "expected_articles": expectedPublishedCount,
            "negative_query": negative, "positive_query": positive,
            "positive_witness_article": "03-implementation/model-selection",
            "expected_result_total": NSNull(),
            "declared_recorded_iterations": 3, "block_invocations": invocations,
            "discarded_warmup_invocations": 1, "metric": "XCTClockMetric",
            "boundary": "replace the public negative query through exact positive query, filter summary and visible article witness; launch and negative reset excluded",
            "limits": "Debug Simulator; keyboard input and AX polling included; no total-result-count, engine-only, per-keystroke, cold, device or performance-target claim"
        ]
        let bytes = try JSONSerialization.data(withJSONObject: protocolRecord, options: [.sortedKeys])
        let attachment = XCTAttachment(string: String(decoding: bytes, as: UTF8.self))
        attachment.name = "Published-search-UI-measurement-protocol"
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    private func isUsableOnScreen(_ element: XCUIElement) -> Bool {
        guard element.exists else { return false }
        let frame = element.frame
        guard !frame.isEmpty, !frame.isNull, !frame.isInfinite,
              [frame.minX, frame.minY, frame.maxX, frame.maxY].allSatisfy(\.isFinite),
              app.frame.intersects(frame) else { return false }
        return element.isHittable
    }

    // The same public prompt and bounded reveal as the functional reader suite.
    private func foregroundArticleSearch() throws -> XCUIElement {
        let prompt = "記事の本文を検索"
        let query = app.searchFields.matching(
            NSPredicate(format: "identifier == %@ OR label == %@", prompt, prompt))
        for _ in 0..<8 {
            if query.allElementsBoundByIndex.contains(where: { isUsableOnScreen($0) }) { break }
            app.swipeDown(velocity: .slow)
        }
        let available = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            query.allElementsBoundByIndex.filter { self.isUsableOnScreen($0) }.count == 1
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [available], timeout: 15), .completed)
        let visible = query.allElementsBoundByIndex.filter { isUsableOnScreen($0) }
        guard visible.count == 1 else {
            throw NSError(domain: "PublishedPerformanceUITests", code: 3,
                userInfo: [NSLocalizedDescriptionKey: "Missing or ambiguous foreground article search"])
        }
        return visible[0]
    }

    private func replaceArticleQuery(_ query: String, in search: XCUIElement) {
        XCTAssertTrue(isUsableOnScreen(search))
        search.tap()
        if let current = search.value as? String, !current.isEmpty, current != search.placeholderValue {
            let clear = search.buttons.firstMatch
            XCTAssertTrue(clear.waitForExistence(timeout: 5))
            XCTAssertTrue(isUsableOnScreen(clear))
            clear.tap()
        }
        search.typeText(query + "\n")
        XCTAssertEqual(search.value as? String, query)
    }

    private func waitForSearchState(_ query: String, search: XCUIElement, empty: Bool) {
        let summaries = app.staticTexts.matching(identifier: "library-filter-summary")
        let witness = app.buttons["library-article-03-implementation/model-selection"]
        let zero = app.staticTexts["記事が見つかりません"]
        let applied = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            let visible = summaries.allElementsBoundByIndex.filter { self.isUsableOnScreen($0) }
            guard search.value as? String == query,
                  visible.count == 1, visible[0].label == "検索: " + query else { return false }
            return empty ? zero.exists && !witness.exists : !zero.exists && self.isUsableOnScreen(witness)
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [applied], timeout: 20), .completed,
                       "The exact query, filter summary and expected empty/witness state must agree")
    }
}
