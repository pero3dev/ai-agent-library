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

    /// One bounded public scroll transaction. Reset/TOC preparation is outside
    /// Clock; gestures, XCTest idle synchronization and AX witnesses are inside.
    func testLongArticleBoundedScroll() throws {
        guard ProcessInfo.processInfo.environment["AILIBRARY_PERFORMANCE_SCENARIO"] == "long-article-bounded-scroll" else {
            throw longScrollError("The long-scroll observation requires its explicit scenario.")
        }
        defer { app.terminate() }
        let articleID = "03-implementation/openai-prompting"
        let title = "OpenAI(GPT 系)特化プロンプティングガイド"
        let startID = "メッセージ構造と指示階層"
        let endID = "長文長コンテキスト"
        let startLabel = "メッセージ構造と指示階層"
        let endLabel = "長文・長コンテキスト"
        let maximumSwipes = 16
        let workload: [String: Any] = [
            "article_id": articleID, "article_title": title,
            "source_path": "docs/03-implementation/openai-prompting.md",
            "document_path": "articles/03-implementation--openai-prompting.json",
            // This is the declared expected source hash, not read from the App
            // at runtime. Workflow independently binds audited Debug input bytes.
            "expected_source_sha256": "d81e7f0984464c530d0b8bbdd8fbfffea6c1e398f037ae2f2133f053dce5a45f",
            "start_heading_id": startID, "start_label": startLabel,
            "end_heading_id": endID, "end_label": endLabel,
            "maximum_swipes": maximumSwipes, "gesture": "vertical-drag-0.80-to-0.40",
            "start_offset_max_points": 64
        ]
        let options = XCTMeasureOptions()
        options.iterationCount = 3
        options.invocationOptions = [.manuallyStart, .manuallyStop]
        var invocations = 0
        var observations: [[String: Any]] = []
        measure(metrics: [XCTClockMetric()], options: options) {
            var measuring = false
            do {
                // Each invocation opens a new reader, then explicitly resets via
                // public contents. No scroll route or App storage hook is seeded.
                try self.prepareLongScroll(articleID: articleID, title: title,
                                           startID: startID, startLabel: startLabel)
                guard let start = self.longScrollWitness(title: title, headingID: startID, label: startLabel),
                      start.offset <= 64,
                      self.longScrollWitness(title: title, headingID: endID, label: endLabel) == nil else {
                    throw self.longScrollError("The fixed start must be near the viewport top and the later endpoint must not already be fully visible.")
                }
                invocations += 1
                var swipes = 0
                var endOffset: CGFloat?
                self.startMeasuring()
                measuring = true
                while swipes < maximumSwipes {
                    guard let context = self.longScrollContext(title: title) else {
                        throw self.longScrollError("The same foreground native reader must own every measured gesture.")
                    }
                    let origin = self.app.coordinate(withNormalizedOffset: .zero)
                    let from = origin.withOffset(CGVector(dx: context.viewport.midX,
                        dy: context.viewport.minY + context.viewport.height * 0.80))
                    let to = origin.withOffset(CGVector(dx: context.viewport.midX,
                        dy: context.viewport.minY + context.viewport.height * 0.40))
                    from.press(forDuration: 0.05, thenDragTo: to)
                    swipes += 1
                    if let end = self.longScrollWitness(title: title, headingID: endID, label: endLabel) {
                        endOffset = end.offset
                        break
                    }
                }
                guard let finalOffset = endOffset else {
                    throw self.longScrollError("The exact endpoint did not become fully visible within16 vertical drags.")
                }
                self.stopMeasuring()
                measuring = false
                observations.append([
                    "index": invocations, "swipes": swipes,
                    "start_fully_visible": true, "end_initially_fully_visible": false,
                    "end_fully_visible": true,
                    "start_offset_points": Double(start.offset), "end_offset_points": Double(finalOffset)
                ])
            } catch {
                if measuring { self.stopMeasuring() }
                XCTFail("The bounded scroll transaction did not complete: \(error)")
            }
        }
        // Expected XCTest warm-up behavior must be confirmed by the actual run;
        // a missing/extra invocation fails rather than inventing a fourth record.
        guard invocations == 4, observations.count == 4 else {
            throw longScrollError("Exactly four completed invocations are required for one warm-up plus three records.")
        }
        let record: [String: Any] = [
            "schema_version": 1, "scenario": "long-article-bounded-scroll", "metric": "XCTClockMetric",
            "expected_articles": expectedPublishedCount, "workload": workload,
            "declared_recorded_iterations": 3, "block_invocations": invocations,
            "discarded_warmup_invocations": 1, "invocations": observations
        ]
        let bytes = try JSONSerialization.data(withJSONObject: record, options: [.sortedKeys])
        guard bytes.count <= 8192 else { throw longScrollError("The scroll protocol exceeds its8-KiB bound.") }
        let text = String(decoding: bytes, as: UTF8.self)
        // Exactly one bounded complete line is independently parsed with context,
        // typed Clock summary and CSV. Preserve the xcresult attachment as well.
        print("AILIBRARY_LONG_SCROLL_PROTOCOL " + text)
        let attachment = XCTAttachment(string: text)
        attachment.name = "Published-long-scroll-measurement-protocol"
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    private func longScrollError(_ message: String) -> NSError {
        NSError(domain: "PublishedLongScrollObservation", code: 60,
                userInfo: [NSLocalizedDescriptionKey: message])
    }

    private func longScrollWait(_ message: String, trace: PublishedLongScrollPreparationWaitTrace? = nil,
                                condition: @escaping () -> Bool) throws {
        if let trace {
            defer { trace.emit() }
            trace.markExpectationStarted()
            let expectation = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
                let poll = trace.beginPoll()
                let satisfied = condition()
                trace.endPoll(poll, satisfied: satisfied)
                return satisfied
            }, object: nil)
            trace.markExpectationReturned()
            trace.markWaitStarted()
            let result = XCTWaiter.wait(for: [expectation], timeout: 15)
            trace.markWaitReturned(resultCode: Int(result.rawValue), completed: result == .completed)
            guard result == .completed else {
                trace.markOutcome(.waitNotCompletedThrown)
                throw longScrollError(message)
            }
            trace.markOutcome(.completed)
            return
        }
        let expectation = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in condition() }, object: nil)
        guard XCTWaiter.wait(for: [expectation], timeout: 15) == .completed else {
            throw longScrollError(message)
        }
    }

    private func longScrollContext(title: String) -> (reader: XCUIElement, viewport: CGRect)? {
        guard let context = memoryForegroundContext(title: title) else { return nil }
        let readers = app.scrollViews.matching(identifier: "native-reader").allElementsBoundByIndex.filter {
            $0.exists && memoryFiniteFrame($0.frame.intersection(context.appFrame))
        }
        guard readers.count == 1 else { return nil }
        let intersection = readers[0].frame.intersection(context.appFrame)
        let top = max(intersection.minY, context.barFrame.maxY)
        let viewport = CGRect(x: intersection.minX, y: top, width: intersection.width,
                              height: max(0, intersection.maxY - top))
        guard memoryFiniteFrame(viewport) else { return nil }
        return (readers[0], viewport)
    }

    private func longScrollWitness(title: String, headingID: String, label: String) -> (offset: CGFloat, element: XCUIElement)? {
        guard let context = longScrollContext(title: title) else { return nil }
        let matching = context.reader.staticTexts.matching(identifier: "native-heading-" + headingID)
            .allElementsBoundByIndex.filter { $0.label == label && memoryVisible($0, viewport: context.viewport) }
        guard matching.count == 1 else { return nil }
        return (matching[0].frame.minY - context.viewport.minY, matching[0])
    }

    private func prepareLongScroll(articleID: String, title: String, startID: String, startLabel: String) throws {
        app.terminate()
        app.launch()
        let count = app.staticTexts["library-article-count"]
        guard count.waitForExistence(timeout: 45), count.label == "全\(expectedPublishedCount)記事",
              app.buttons["library-learning-guide"].waitForExistence(timeout: 10) else {
            throw longScrollError("The audited full library and learning guide must be ready before preparation.")
        }
        let search = try foregroundArticleSearch()
        replaceArticleQuery(title, in: search)
        let rows = app.buttons.matching(identifier: "library-article-" + articleID)
        func preparedRows() -> [XCUIElement] {
            guard memoryForegroundContext(title: "AI Agent Library") != nil,
                  search.value as? String == title else { return [] }
            let summaries = app.staticTexts.matching(identifier: "library-filter-summary")
                .allElementsBoundByIndex.filter { isUsableOnScreen($0) }
            guard summaries.count == 1, summaries[0].label == "検索: " + title else { return [] }
            return rows.allElementsBoundByIndex.filter { isUsableOnScreen($0) }
        }
        let preparationWaitTrace = PublishedLongScrollPreparationWaitTrace()
        for _ in 0..<12 {
            let prepared = preparedRows().count == 1
            preparationWaitTrace.recordPrecheck(satisfied: prepared)
            if prepared { break }
            app.swipeUp(velocity: .slow)
        }
        try longScrollWait("One foreground exact-title article row is required before opening",
                           trace: preparationWaitTrace) { preparedRows().count == 1 }
        let readyRows = preparedRows()
        guard readyRows.count == 1 else { throw longScrollError("The prepared article row became ambiguous.") }
        readyRows[0].tap()
        try longScrollWait("The selected foreground native reader must open") { self.longScrollContext(title: title) != nil }
        let contents = app.buttons.matching(NSPredicate(format: "identifier == %@ OR label == %@", "目次", "目次"))
            .allElementsBoundByIndex.filter { isUsableOnScreen($0) }
        guard contents.count == 1 else { throw longScrollError("One foreground contents control is required.") }
        contents[0].tap()
        try longScrollWait("The public contents sheet must open") { self.memoryForegroundContext(title: "目次") != nil }
        let targets = app.buttons.matching(NSPredicate(format: "label == %@", startLabel))
        for _ in 0..<18 {
            if targets.allElementsBoundByIndex.filter({ isUsableOnScreen($0) }).count == 1 { break }
            app.swipeUp(velocity: .slow)
        }
        let visibleTargets = targets.allElementsBoundByIndex.filter { isUsableOnScreen($0) }
        guard visibleTargets.count == 1 else { throw longScrollError("The fixed start contents row must be unique and visible.") }
        visibleTargets[0].tap()
        try longScrollWait("The fixed start heading must be fully visible near the foreground viewport top") {
            guard let witness = self.longScrollWitness(title: title, headingID: startID, label: startLabel) else { return false }
            return witness.offset <= 64
        }
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
        let trace = PublishedMemoryPhaseTrace()
        trace.record("case-enter")
        let articleID = "11-llm-internals/transformer-architecture"
        let articleTitle = "Transformer アーキテクチャ詳解"
        defer {
            trace.record("terminate-enter")
            app.terminate()
            trace.record("terminate-return")
        }
        trace.record("launch-enter")
        app.launch()
        trace.record("launch-return")
        trace.record("readiness-enter")
        let countLabel = app.staticTexts["library-article-count"]
        let guide = app.buttons["library-learning-guide"]
        XCTAssertTrue(countLabel.waitForExistence(timeout: 45))
        let observedCount = countLabel.label
        XCTAssertEqual(observedCount, "全\(expectedPublishedCount)記事")
        XCTAssertTrue(guide.waitForExistence(timeout: 10))
        let guidePresent = guide.exists
        try memoryWait("The full library must be the unique foreground navigation context", trace: trace, phase: "library") {
            self.memoryForegroundContext(title: "AI Agent Library") != nil
        }

        trace.record("readiness-return")

        // The application is already launched. Never substitute XCTMemoryMetric(),
        // whose default target would be the test Runner's own process.
        trace.record("metric-init-enter")
        let metric = XCTMemoryMetric(application: app)
        trace.record("metric-init-return")
        let options = XCTMeasureOptions()
        options.iterationCount = 3
        options.invocationOptions = [.manuallyStart, .manuallyStop]
        var invocations = 0
        var bodyWitnesses: [[String: String]] = []

        trace.record("measure-enter")
        measure(metrics: [metric], options: options) {
            trace.setInvocation(invocations + 1)
            trace.record("invocation-enter")
            var measuring = false
            do {
                trace.record("prepare-enter")
                if invocations > 0 { try self.memoryReturnToLibrary(articleTitle: articleTitle, trace: trace) }
                let row = try self.memoryPrepareArticleRow(articleID: articleID, title: articleTitle, trace: trace)
                trace.record("prepare-return")
                guard self.app.state == .runningForeground else {
                    throw NSError(domain: "PublishedAppMemoryObservation", code: 41,
                        userInfo: [NSLocalizedDescriptionKey: "The same explicitly launched application must remain foreground."])
                }
                invocations += 1
                trace.record("measure-start-enter")
                self.startMeasuring()
                trace.record("measure-start-return")
                measuring = true
                trace.record("row-tap-enter")
                row.tap()
                trace.record("row-tap-return")
                try self.memoryWait("The selected Transformer reader must expose foreground native body text", trace: trace, phase: "body-witness") {
                    self.memoryBodyWitness(articleTitle: articleTitle) != nil
                }
                trace.record("body-final-witness-enter")
                guard self.app.state == .runningForeground,
                      let witness = self.memoryBodyWitness(articleTitle: articleTitle) else {
                    throw NSError(domain: "PublishedAppMemoryObservation", code: 42,
                        userInfo: [NSLocalizedDescriptionKey: "The foreground native-body witness changed before the measurement stopped."])
                }
                trace.record("body-final-witness-return")
                trace.record("measure-stop-enter")
                self.stopMeasuring()
                trace.record("measure-stop-return")
                measuring = false
                bodyWitnesses.append(["identifier": witness.identifier, "label": witness.label])
                trace.record("invocation-return")
            } catch {
                trace.record("invocation-error")
                if measuring {
                    trace.record("error-stop-enter")
                    self.stopMeasuring()
                    trace.record("error-stop-return")
                }
                XCTFail("The scoped App memory transaction did not complete: \(error)")
            }
        }
        trace.record("measure-return")

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
        trace.record("protocol-return")
    }

    private func memoryWait(_ message: String, trace: PublishedMemoryPhaseTrace, phase: String,
                            condition: @escaping () -> Bool) throws {
        trace.record(phase + ".expectation-init-enter")
        let expectation = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            trace.record(phase + ".poll-enter", poll: true)
            let satisfied = condition()
            trace.record(phase + ".poll-return", poll: true, result: satisfied)
            return satisfied
        }, object: nil)
        trace.record(phase + ".expectation-init-return")
        trace.record(phase + ".wait-enter")
        let result = XCTWaiter.wait(for: [expectation], timeout: 15)
        trace.record(phase + ".wait-return")
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

    private func memoryPrepareArticleRow(articleID: String, title: String, trace: PublishedMemoryPhaseTrace) throws -> XCUIElement {
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
        try memoryWait("The exact title query and one fully visible Transformer row must agree", trace: trace, phase: "prepared-row") {
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

    private func memoryReturnToLibrary(articleTitle: String, trace: PublishedMemoryPhaseTrace) throws {
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
        trace.record("back-tap-enter")
        visible[0].tap()
        trace.record("back-tap-return")
        try memoryWait("The prior native reader must close before the next memory transaction", trace: trace, phase: "return-library") {
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

// Runner-only progress; it does not validate or time-limit XCTest interactions.
// No accessibility values are read here. The two event pools keep phase markers
// available after repetitive polls are capped. At most 186 lines of 176 bytes
// (32,736 bytes) can be attempted; truncation itself has two reserved lines.
private final class PublishedMemoryPhaseTrace {
    static let prefix = "AILIBRARY_MEMORY_PHASE "
    static let maximumLineBytes = 176
    static let maximumTotalBytes = 32 * 1024
    static let maximumPhaseRecords = 160
    static let maximumPollRecords = 24

    private let lock = NSLock()
    private let writeLine: (Data) -> Void
    private let clock: () -> UInt64
    private var invocation: Int? = 0
    private var sequence = 0
    private var phaseRecords = 0
    private var pollRecords = 0
    private var totalBytes = 0
    private var phaseTruncated = false
    private var pollTruncated = false
    private var stopped = false

    init(writeLine: @escaping (Data) -> Void = { data in
        _ = try? FileHandle.standardOutput.write(contentsOf: data)
    }, clock: @escaping () -> UInt64 = { DispatchTime.now().uptimeNanoseconds }) {
        self.writeLine = writeLine
        self.clock = clock
    }

    func setInvocation(_ value: Int) {
        lock.lock()
        defer { lock.unlock() }
        invocation = (0...9999).contains(value) ? value : nil
    }

    func record(_ phase: String, poll: Bool = false, result: Bool? = nil) {
        lock.lock()
        defer { lock.unlock() }
        guard !stopped else { return }
        if poll {
            guard !pollTruncated else { return }
            guard pollRecords < Self.maximumPollRecords else {
                pollTruncated = true
                _ = emitLocked("poll-budget-exhausted")
                return
            }
        } else {
            guard !phaseTruncated else { return }
            guard phaseRecords < Self.maximumPhaseRecords else {
                phaseTruncated = true
                _ = emitLocked("phase-budget-exhausted")
                return
            }
        }
        guard !phase.isEmpty, phase.utf8.count <= 40,
              phase.utf8.allSatisfy({ (97...122).contains($0) || (48...57).contains($0) || $0 == 45 || $0 == 46 }) else {
            stopped = true
            _ = emitLocked("invalid-event")
            return
        }
        guard emitLocked(phase, result: result) else {
            stopped = true
            _ = emitLocked("record-bound-exceeded")
            return
        }
        if poll { pollRecords += 1 } else { phaseRecords += 1 }
    }

    private func emitLocked(_ phase: String, result: Bool? = nil) -> Bool {
        var payload: [String: Any] = [
            "v": 1, "seq": sequence + 1, "phase": phase,
            "invocation": invocation.map { $0 as Any } ?? NSNull(),
            "uptime_ns": String(clock())
        ]
        if let result { payload["result"] = result }
        guard let json = try? JSONSerialization.data(withJSONObject: payload, options: [.sortedKeys]) else { return false }
        var line = Data(Self.prefix.utf8)
        line.append(json)
        line.append(0x0a)
        guard line.count <= Self.maximumLineBytes,
              totalBytes + line.count <= Self.maximumTotalBytes else { return false }
        sequence += 1
        totalBytes += line.count
        writeLine(line)
        return true
    }
}


/// Preparation-only boundaries: reads no App/UI property and prints once after the waiter returns.
/// A callback may finish after the waiter; its returned time remains separate from that boundary.
private final class PublishedLongScrollPreparationWaitTrace {
    enum Outcome: String {
        case pending
        case completed
        case waitNotCompletedThrown = "wait-not-completed-thrown"
    }

    private struct Poll {
        let sequence: UInt64
        let started: UInt64
        var returned: UInt64?
        var satisfied: Bool?
    }

    private static let prefix = "AILIBRARY_LONG_SCROLL_PREPARATION "
    private let lock = NSLock()
    private let origin = DispatchTime.now().uptimeNanoseconds
    private var expectationStarted: UInt64?
    private var expectationReturned: UInt64?
    private var waitStarted: UInt64?
    private var waitReturned: UInt64?
    private var resultCode: Int?
    private var waiterCompleted: Bool?
    private var startedAtWaitReturn: UInt64?
    private var returnedAtWaitReturn: UInt64?
    private var inflightAtWaitReturn: UInt64?
    private var totalStarted: UInt64 = 0
    private var totalReturned: UInt64 = 0
    private var polls: [Poll] = []
    private var precheckEvaluations = 0
    private var precheckLastSatisfied: Bool?
    private var outcome: Outcome = .pending
    private var outcomeRecorded: UInt64?
    private var emitted = false

    private func locked<T>(_ body: () -> T) -> T {
        lock.lock()
        defer { lock.unlock() }
        return body()
    }

    func recordPrecheck(satisfied: Bool) {
        locked {
            if precheckEvaluations < 12 { precheckEvaluations += 1 }
            precheckLastSatisfied = satisfied
        }
    }

    func markExpectationStarted() { locked { expectationStarted = DispatchTime.now().uptimeNanoseconds } }
    func markExpectationReturned() { locked { expectationReturned = DispatchTime.now().uptimeNanoseconds } }
    func markWaitStarted() { locked { waitStarted = DispatchTime.now().uptimeNanoseconds } }

    func beginPoll() -> UInt64 {
        locked {
            totalStarted += 1
            if polls.count == 8 { polls.removeFirst() }
            polls.append(Poll(sequence: totalStarted, started: DispatchTime.now().uptimeNanoseconds,
                              returned: nil, satisfied: nil))
            return totalStarted
        }
    }

    func endPoll(_ sequence: UInt64, satisfied: Bool) {
        locked {
            totalReturned += 1
            if let index = polls.firstIndex(where: { $0.sequence == sequence }) {
                polls[index].returned = DispatchTime.now().uptimeNanoseconds
                polls[index].satisfied = satisfied
            }
        }
    }

    func markWaitReturned(resultCode: Int, completed: Bool) {
        locked {
            waitReturned = DispatchTime.now().uptimeNanoseconds
            self.resultCode = resultCode
            waiterCompleted = completed
            startedAtWaitReturn = totalStarted
            returnedAtWaitReturn = totalReturned
            inflightAtWaitReturn = totalStarted - totalReturned
        }
    }

    func markOutcome(_ value: Outcome) {
        locked {
            outcome = value
            outcomeRecorded = DispatchTime.now().uptimeNanoseconds
        }
    }

    private func nullable<T>(_ value: T?) -> Any {
        if let value { return value }
        return NSNull()
    }

    private func milliseconds(_ value: UInt64?) -> Any {
        guard let value, value >= origin else { return NSNull() }
        return Double(value - origin) / 1_000_000
    }

    func emit() {
        let payload: [String: Any]? = locked {
            guard !emitted else { return nil }
            emitted = true
            return [
                "schema_version": 1, "phase": "prepared-article-row",
                "scenario": "long-article-bounded-scroll", "article_id": "03-implementation/openai-prompting",
                "sampling": "after-wait-return-sequential", "wait_timeout_seconds": 15,
                "expectation_init_started_ms": milliseconds(expectationStarted),
                "expectation_init_returned_ms": milliseconds(expectationReturned),
                "wait_started_ms": milliseconds(waitStarted), "wait_returned_ms": milliseconds(waitReturned),
                "wait_result_code": nullable(resultCode), "waiter_completed": nullable(waiterCompleted),
                "polls_started_at_wait_return": nullable(startedAtWaitReturn),
                "polls_returned_at_wait_return": nullable(returnedAtWaitReturn),
                "inflight_at_wait_return": nullable(inflightAtWaitReturn),
                "polls_started_at_snapshot": totalStarted, "polls_returned_at_snapshot": totalReturned,
                "last_poll_starts": polls.map { poll -> [String: Any] in
                    ["sequence": poll.sequence, "started_ms": milliseconds(poll.started),
                     "returned_ms": milliseconds(poll.returned), "satisfied": nullable(poll.satisfied)]
                },
                "precheck_evaluations": precheckEvaluations, "precheck_last_satisfied": nullable(precheckLastSatisfied),
                "helper_outcome": outcome.rawValue, "outcome_recorded_ms": milliseconds(outcomeRecorded),
                "snapshot_ms": milliseconds(DispatchTime.now().uptimeNanoseconds)
            ]
        }
        guard let payload else { return }
        // JSON serialization and console I/O never hold the callback-state lock.
        let maximumJSONBytes = 8192 - Self.prefix.utf8.count - 1
        let text: String
        if let data = try? JSONSerialization.data(withJSONObject: payload, options: [.sortedKeys]),
           data.count <= maximumJSONBytes {
            text = String(decoding: data, as: UTF8.self)
        } else {
            text = #"{"schema_version":1,"phase":"prepared-article-row","snapshot_unavailable":"encoding-or-size-limit"}"#
        }
        print(Self.prefix + text)
    }
}
