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

    /// A target-App memory observation, separate from either Clock transaction.
    /// Public query preparation and navigation back are outside the measured interval.
    func testPublishedArticleAppMemory() throws {
        let environment = ProcessInfo.processInfo.environment
        guard environment["AILIBRARY_MEMORY_RUNNER"] == "1",
              environment["AILIBRARY_PERFORMANCE_SCENARIO"] == "published-article-app-memory" else {
            throw NSError(domain: "PublishedAppMemoryObservation", code: 40,
                userInfo: [NSLocalizedDescriptionKey: "The App memory case requires its dedicated runner and explicit scenario."])
        }
        let articleID = "11-llm-internals/transformer-architecture"
        let articleTitle = "Transformer アーキテクチャ詳解"
        defer { app.terminate() }
        app.launch()
        let countLabel = app.staticTexts["library-article-count"]
        let guide = app.buttons["library-learning-guide"]
        XCTAssertTrue(countLabel.waitForExistence(timeout: 45))
        let observedCount = countLabel.label
        XCTAssertEqual(observedCount, "全\(expectedPublishedCount)記事")
        XCTAssertTrue(guide.waitForExistence(timeout: 10))
        let guidePresent = guide.exists
        try memoryWait("The full library must be the unique foreground navigation context") {
            self.memoryForegroundContext(title: "AI Agent Library") != nil
        }

        // The application is already launched. Never substitute XCTMemoryMetric(),
        // whose default target would be the test Runner's own process.
        let metric = XCTMemoryMetric(application: app)
        let options = XCTMeasureOptions()
        options.iterationCount = 3
        options.invocationOptions = [.manuallyStart, .manuallyStop]
        var invocations = 0
        var bodyWitnesses: [[String: String]] = []

        measure(metrics: [metric], options: options) {
            var measuring = false
            do {
                if invocations > 0 { try self.memoryReturnToLibrary(articleTitle: articleTitle) }
                let row = try self.memoryPrepareArticleRow(articleID: articleID, title: articleTitle)
                guard self.app.state == .runningForeground else {
                    throw NSError(domain: "PublishedAppMemoryObservation", code: 41,
                        userInfo: [NSLocalizedDescriptionKey: "The same explicitly launched application must remain foreground."])
                }
                invocations += 1
                self.startMeasuring()
                measuring = true
                row.tap()
                try self.memoryWait("The selected Transformer reader must expose foreground native body text") {
                    self.memoryBodyWitness(articleTitle: articleTitle) != nil
                }
                guard self.app.state == .runningForeground,
                      let witness = self.memoryBodyWitness(articleTitle: articleTitle) else {
                    throw NSError(domain: "PublishedAppMemoryObservation", code: 42,
                        userInfo: [NSLocalizedDescriptionKey: "The foreground native-body witness changed before the measurement stopped."])
                }
                self.stopMeasuring()
                measuring = false
                bodyWitnesses.append(["identifier": witness.identifier, "label": witness.label])
            } catch {
                if measuring { self.stopMeasuring() }
                XCTFail("The scoped App memory transaction did not complete: \(error)")
            }
        }

        XCTAssertEqual(invocations, 4)
        XCTAssertEqual(bodyWitnesses.count, 4)
        guard invocations == 4, bodyWitnesses.count == 4,
              bodyWitnesses.allSatisfy({ ($0["label"]?.utf8.count ?? 0) <= 8192 }),
              let bodyLabel = bodyWitnesses.last?["label"] else {
            throw NSError(domain: "PublishedAppMemoryObservation", code: 43,
                userInfo: [NSLocalizedDescriptionKey: "Four completed invocations and bounded native-body labels are required."])
        }
        // No metric identifier, output-row count, unit, or growth-sign assumption
        // is made here. The separate exporter must adopt the actual raw contract.
        let protocolRecord: [String: Any] = [
            "schema_version": 1, "scenario": "published-article-app-memory",
            "test_method": "testPublishedArticleAppMemory",
            "target_application": "dev.pero3.aiagentlibrary.prototype",
            "metric_configuration": "XCTMemoryMetric(application: app)",
            "expected_articles": expectedPublishedCount,
            "observed_count_label": observedCount, "guide_present": guidePresent,
            "article_id": articleID, "article_title": articleTitle, "selection_query": articleTitle,
            "body_witness_label": bodyLabel, "body_witnesses": bodyWitnesses,
            "declared_recorded_iterations": 3, "block_invocations": invocations,
            "discarded_warmup_invocations": 1, "application_launches": 1,
            "process_lifecycle": "one explicit launch before metric construction; foreground checked each invocation; no process identifier read",
            "boundary": "public Transformer row tap through unique foreground Transformer context, native-reader and fully visible nonempty scoped native-text; query preparation, return, protocol serialization and termination excluded",
            "limits": "Debug Simulator; one discarded warm-up then three records with retained same-application caches; UI/AX and navigation effects included; not launch/cold/lifetime peak, RSS, all images/scroll, Release, device, leak proof, p95 or a product memory budget"
        ]
        let bytes = try JSONSerialization.data(withJSONObject: protocolRecord, options: [.sortedKeys])
        guard bytes.count <= 65536 else {
            throw NSError(domain: "PublishedAppMemoryObservation", code: 44,
                userInfo: [NSLocalizedDescriptionKey: "The memory protocol exceeds its 64-KiB attachment bound."])
        }
        let attachment = XCTAttachment(string: String(decoding: bytes, as: UTF8.self))
        attachment.name = "Published-app-memory-observation-protocol"
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    private func memoryWait(_ message: String, condition: @escaping () -> Bool) throws {
        let expectation = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in condition() }, object: nil)
        let result = XCTWaiter.wait(for: [expectation], timeout: 15)
        guard result == .completed else {
            XCTFail(message)
            throw NSError(domain: "PublishedAppMemoryObservation", code: 50,
                          userInfo: [NSLocalizedDescriptionKey: message])
        }
    }

    private func memoryFiniteFrame(_ frame: CGRect) -> Bool {
        !frame.isNull && !frame.isInfinite && !frame.isEmpty &&
        [frame.minX, frame.minY, frame.width, frame.height].allSatisfy(\.isFinite)
    }

    /// Mirrors the functional reader's single foreground-bar control witness.
    /// AX reads are sequential, and an ambiguous or invalid viewport stays unsatisfied.
    private func memoryForegroundContext(title: String) -> (bar: XCUIElement, appFrame: CGRect, barFrame: CGRect)? {
        guard app.state == .runningForeground else { return nil }
        let appFrame = app.frame
        guard memoryFiniteFrame(appFrame) else { return nil }
        let foreground = app.navigationBars.allElementsBoundByIndex.compactMap { bar -> (XCUIElement, CGRect)? in
            guard bar.exists else { return nil }
            let frame = bar.frame
            guard self.memoryFiniteFrame(frame), appFrame.contains(frame),
                  bar.buttons.allElementsBoundByIndex.contains(where: { control in
                      guard control.exists, control.isEnabled else { return false }
                      let controlFrame = control.frame
                      guard self.memoryFiniteFrame(controlFrame), appFrame.contains(controlFrame),
                            frame.intersects(controlFrame) else { return false }
                      return control.isHittable
                  }) else { return nil }
            return (bar, frame)
        }
        guard foreground.count == 1, foreground[0].0.identifier == title else { return nil }
        return (foreground[0].0, appFrame, foreground[0].1)
    }

    private func memoryVisible(_ element: XCUIElement, viewport: CGRect) -> Bool {
        guard element.exists else { return false }
        let frame = element.frame
        guard memoryFiniteFrame(frame), memoryFiniteFrame(viewport), viewport.contains(frame) else { return false }
        return element.isHittable
    }

    private func memoryPrepareArticleRow(articleID: String, title: String) throws -> XCUIElement {
        guard memoryForegroundContext(title: "AI Agent Library") != nil,
              !app.scrollViews["native-reader"].exists else {
            throw NSError(domain: "PublishedAppMemoryObservation", code: 51,
                userInfo: [NSLocalizedDescriptionKey: "Article preparation requires the foreground library, not a retained reader."])
        }
        let search = try foregroundArticleSearch()
        replaceArticleQuery(title, in: search)
        let rows = app.buttons.matching(identifier: "library-article-" + articleID)
        let summaries = app.staticTexts.matching(identifier: "library-filter-summary")
        func usableRows() -> [XCUIElement] {
            guard let context = memoryForegroundContext(title: "AI Agent Library"),
                  search.value as? String == title else { return [] }
            let summary = summaries.allElementsBoundByIndex.filter { isUsableOnScreen($0) }
            guard summary.count == 1, summary[0].label == "検索: " + title else { return [] }
            let viewport = CGRect(x: context.appFrame.minX, y: context.barFrame.maxY,
                                  width: context.appFrame.width, height: context.appFrame.maxY - context.barFrame.maxY)
            return rows.allElementsBoundByIndex.filter { memoryVisible($0, viewport: viewport) }
        }
        // The bounded reveal prepares the workload; no gesture occurs after startMeasuring.
        for _ in 0..<12 {
            if usableRows().count == 1 { break }
            app.swipeUp(velocity: .slow)
        }
        try memoryWait("The exact title query and one fully visible Transformer row must agree") {
            usableRows().count == 1
        }
        let visible = usableRows()
        guard visible.count == 1 else {
            throw NSError(domain: "PublishedAppMemoryObservation", code: 52,
                userInfo: [NSLocalizedDescriptionKey: "The prepared Transformer row became missing or ambiguous."])
        }
        return visible[0]
    }

    private func memoryBodyWitness(articleTitle: String) -> (identifier: String, label: String)? {
        guard let context = memoryForegroundContext(title: articleTitle) else { return nil }
        let readers = app.scrollViews.matching(identifier: "native-reader").allElementsBoundByIndex.filter {
            guard $0.exists else { return false }
            let frame = $0.frame
            return memoryFiniteFrame(frame) && memoryFiniteFrame(context.appFrame.intersection(frame))
        }
        guard readers.count == 1 else { return nil }
        let reader = readers[0]
        let intersection = context.appFrame.intersection(reader.frame)
        guard memoryFiniteFrame(intersection) else { return nil }
        let top = max(intersection.minY, context.barFrame.maxY)
        let viewport = CGRect(x: intersection.minX, y: top, width: intersection.width,
                              height: max(0, intersection.maxY - top))
        guard memoryFiniteFrame(viewport) else { return nil }
        let paragraphs = reader.staticTexts.matching(NSPredicate(format: "identifier BEGINSWITH %@", "native-text-"))
        for paragraph in paragraphs.allElementsBoundByIndex where memoryVisible(paragraph, viewport: viewport) {
            let label = paragraph.label.trimmingCharacters(in: .whitespacesAndNewlines)
            if !label.isEmpty { return (paragraph.identifier, label) }
        }
        return nil
    }

    private func memoryReturnToLibrary(articleTitle: String) throws {
        guard let context = memoryForegroundContext(title: articleTitle) else {
            throw NSError(domain: "PublishedAppMemoryObservation", code: 53,
                userInfo: [NSLocalizedDescriptionKey: "The prior measured reader must still be the foreground navigation context."])
        }
        let backLabels = ["AI Agent Library", "戻る", "Back"] as NSArray
        let back = context.bar.buttons.matching(NSPredicate(
            format: "identifier IN %@ OR label IN %@", backLabels, backLabels))
        let visible = back.allElementsBoundByIndex.filter { memoryVisible($0, viewport: context.barFrame) }
        guard visible.count == 1 else {
            throw NSError(domain: "PublishedAppMemoryObservation", code: 54,
                userInfo: [NSLocalizedDescriptionKey: "One public back control must belong to the foreground Transformer bar."])
        }
        visible[0].tap()
        try memoryWait("The prior native reader must close before the next memory transaction") {
            !self.app.scrollViews["native-reader"].exists &&
            self.memoryForegroundContext(title: "AI Agent Library") != nil
        }
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
