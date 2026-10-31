import XCTest

/// Isolated default-text rotation and app-local font-size relaunch regressions.
/// These are not live system Settings, glyph-position, content-revision,
/// VoiceOver or physical-device acceptance tests.
final class ReaderReflowUITests: NativeReaderUITestCase {
    private var startingOrientation = XCUIDevice.shared.orientation

    override func setUpWithError() throws {
        switch XCUIDevice.shared.orientation {
        case .portrait, .portraitUpsideDown, .landscapeLeft, .landscapeRight:
            startingOrientation = XCUIDevice.shared.orientation
        default:
            startingOrientation = .portrait
        }
        XCUIDevice.shared.orientation = .portrait
        try super.setUpWithError()
    }

    override func tearDownWithError() throws {
        // XCTest calls teardown after a failed assertion as well. Only the app
        // and orientation owned by this test are changed; no Settings are set.
        defer { XCUIDevice.shared.orientation = startingOrientation }
        app?.terminate()
        try super.tearDownWithError()
    }

    private func singleForegroundControl(_ query: XCUIElementQuery,
                                         name: String) throws -> XCUIElement {
        let available = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            query.allElementsBoundByIndex.filter { self.isHittableOnScreen($0) }.count == 1
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [available], timeout: 15), .completed,
                       "Exactly one foreground \(name) must be usable")
        let visible = query.allElementsBoundByIndex.filter { isHittableOnScreen($0) }
        guard visible.count == 1 else {
            throw NSError(domain: "ReaderReflowUITests", code: 1,
                          userInfo: [NSLocalizedDescriptionKey: "Missing or ambiguous foreground " + name])
        }
        return visible[0]
    }

    private func requireLayout(portrait: Bool) {
        let layout = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            let frame = self.app.frame
            guard self.app.state == .runningForeground, !frame.isNull, !frame.isInfinite,
                  !frame.isEmpty,
                  [frame.minX, frame.minY, frame.width, frame.height].allSatisfy(\.isFinite)
            else { return false }
            return portrait ? frame.height > frame.width : frame.width > frame.height
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [layout], timeout: 15), .completed,
                       "The foreground application must actually use the requested layout")
    }

    private func foregroundArticleSearch() throws -> XCUIElement {
        let prompt = "記事の本文を検索"
        let query = app.searchFields.matching(
            NSPredicate(format: "identifier == %@ OR label == %@", prompt, prompt))
        // searchable has no always-visible placement. Use the baseline's bounded
        // reveal only when no foreground search field is currently hittable.
        for _ in 0..<8 {
            if query.allElementsBoundByIndex.contains(where: { isHittableOnScreen($0) }) { break }
            app.swipeDown(velocity: .slow)
        }
        return try singleForegroundControl(query, name: "article search")
    }

    private func setForegroundArticleQuery(_ query: String) throws {
        let search = try foregroundArticleSearch()
        search.tap()
        if let current = search.value as? String, !current.isEmpty, current != search.placeholderValue {
            let clear = search.buttons.firstMatch
            requireHittable(clear)
            clear.tap()
        }
        search.typeText(query + "\n")
        XCTAssertEqual(search.value as? String, query)
    }

    private func openFixtureLibrary() throws {
        XCTAssertTrue(app.staticTexts["library-article-count"].waitForExistence(timeout: 45))
        // The filtered public Button presents the sheet; the unfiltered toolbar
        // Menu does not have the More Actions navigation stack used below.
        try setForegroundArticleQuery("Transformer")
        let summary = app.staticTexts["library-filter-summary"]
        let filtered = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            summary.exists && summary.label.contains("検索: Transformer")
        }, object: nil)
        let filterResult = XCTWaiter.wait(for: [filtered], timeout: 10)
        XCTAssertEqual(filterResult, .completed, "The public article query must activate the filtered library")
        guard filterResult == .completed else {
            throw NSError(domain: "ReaderReflowUITests", code: 2,
                          userInfo: [NSLocalizedDescriptionKey: "The filtered library was not ready"])
        }
        let more = try singleForegroundControl(app.buttons.matching(
            NSPredicate(format: "label == %@", "その他の操作")), name: "More Actions button")
        more.tap()
        XCTAssertTrue(app.navigationBars["その他の操作"].waitForExistence(timeout: 10))
        let fixture = try singleForegroundControl(app.buttons.matching(identifier: "本文表示テスト"),
                                                 name: "fixture action")
        fixture.tap()
        XCTAssertTrue(app.navigationBars["本文表示テスト"].waitForExistence(timeout: 45))
        let count = try singleForegroundControl(app.staticTexts.matching(identifier: "library-article-count"),
                                               name: "fixture article count")
        XCTAssertEqual(count.label, "全1記事")
    }

    private func soleCell(blockID: String, row: Int) -> XCUIElement {
        let identifier = "native-table-cell-\(blockID)-\(row)-1"
        let query = app.descendants(matching: .any).matching(identifier: identifier)
        let unique = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in query.count == 1 }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [unique], timeout: 15), .completed)
        XCTAssertEqual(query.count, 1, "A row witness must be an unambiguous cell")
        return query.element(boundBy: 0)
    }

    private func requireRowWitness(blockID: String) -> (offset: CGFloat, rowHeight: CGFloat) {
        let reader = app.scrollViews["native-reader"]
        let middle = soleCell(blockID: blockID, row: 25)
        requireHittable(middle, inside: reader, fullyVisible: true)
        XCTAssertEqual(middle.label, "INTRABLOCK-R25")
        // R24 may intersect the viewport, but may not be fully visible. This
        // is deliberately weaker than claiming adjacent zero-gap cells align
        // on an exact subpixel boundary. R25 itself must remain fully visible.
        XCTAssertFalse(hasVisibleFrame(soleCell(blockID: blockID, row: 24), inside: reader,
                                       fullyVisible: true),
                       "The previous row must not also be fully visible")
        XCTAssertFalse(hasVisibleFrame(soleCell(blockID: blockID, row: 1), inside: reader),
                       "Restoring the start of the tall block is not restoration of R25")
        requireHittable(app.navigationBars["ネイティブ本文テスト専用記事"].buttons["しおりを削除"])
        let frame = middle.frame
        let visibleReader = reader.frame.intersection(app.frame)
        let bar = app.navigationBars["ネイティブ本文テスト専用記事"]
        let offset = frame.minY - max(visibleReader.minY, bar.frame.maxY)
        XCTAssertTrue(offset.isFinite && frame.height.isFinite && frame.height > 0)
        return (offset, frame.height)
    }

    // Adjacent origins measure the row spacing. A cell's StaticText height
    // can stay unchanged when the scaled column width changes its wrapping.
    private func measuredRowStride(blockID: String) throws -> CGFloat {
        let previous = soleCell(blockID: blockID, row: 24).frame
        let current = soleCell(blockID: blockID, row: 25).frame
        let validFrames = [previous, current].allSatisfy { frame in
            !frame.isNull && !frame.isInfinite && !frame.isEmpty &&
            [frame.minX, frame.minY, frame.maxX, frame.maxY, frame.width, frame.height]
                .allSatisfy(\.isFinite) && frame.width > 0 && frame.height > 0
        }
        guard validFrames else {
            XCTFail("Both adjacent row frames must be finite with positive width and height")
            throw NSError(domain: "ReaderReflowUITests", code: 4,
                          userInfo: [NSLocalizedDescriptionKey: "Invalid adjacent row geometry"])
        }
        let stride = current.minY - previous.minY
        guard stride.isFinite && stride > 0 else {
            XCTFail("Adjacent row origins must yield a finite positive stride")
            throw NSError(domain: "ReaderReflowUITests", code: 5,
                          userInfo: [NSLocalizedDescriptionKey: "Invalid adjacent row stride"])
        }
        return stride
    }

    func testFixtureMeasuredRowAndBookmarkSurviveRotatedRelaunchAndLiveReturn() throws {
        requireLayout(portrait: true)
        let ownedSuite = app.launchEnvironment["AILIBRARY_UI_TEST_SUITE"]
        XCTAssertNotNil(ownedSuite)
        XCTAssertTrue(ownedSuite?.hasPrefix("ailibrary-uitest-") == true)
        try openFixtureLibrary()
        let article = try singleForegroundControl(app.descendants(matching: .any).matching(
            identifier: "library-article-test-fixtures/native-reader"), name: "fixture article")
        article.tap()
        requireNativeBody()
        let fixtureBar = app.navigationBars["ネイティブ本文テスト専用記事"]
        XCTAssertTrue(fixtureBar.waitForExistence(timeout: 10))
        let addBookmark = fixtureBar.buttons["しおりを追加"]
        requireHittable(addBookmark)
        addBookmark.tap()
        requireHittable(fixtureBar.buttons["しおりを削除"])

        // TOC and capped swipes are preparation only. Neither is used after
        // saved-position restoration, including the later live rotation.
        goToContents("CASE-INTRABLOCK-01", headingID: "case-intrablock-01")
        let reader = app.scrollViews["native-reader"]
        let tables = reader.scrollViews.matching(NSPredicate(format:
            "identifier BEGINSWITH %@ AND label CONTAINS %@", "native-table-", "データ40行、2列"))
        XCTAssertTrue(tables.firstMatch.waitForExistence(timeout: 10))
        XCTAssertEqual(tables.count, 1, "Exactly one forty-row table must be present")
        let blockID = String(tables.element(boundBy: 0).identifier.dropFirst("native-table-".count))
        XCTAssertFalse(blockID.isEmpty)
        let middle = soleCell(blockID: blockID, row: 25)
        for _ in 0..<18 where !isHittableOnScreen(middle, inside: reader, fullyVisible: true) {
            reader.swipeUp(velocity: .slow)
        }
        requireHittable(middle, inside: reader, fullyVisible: true)
        XCTAssertEqual(middle.label, "INTRABLOCK-R25")
        let middleFrame = middle.frame
        let visibleReader = reader.frame.intersection(app.frame)
        let top = max(visibleReader.minY, fixtureBar.frame.maxY)
        XCTAssertTrue([middleFrame.minY, top, visibleReader.maxY, middleFrame.height].allSatisfy(\.isFinite))
        XCTAssertGreaterThan(middleFrame.height, 0)
        // This single measured setup drag places the short marker near the
        // reading top. It does not require an exact zero-gap cell boundary.
        let targetY = top + 24
        let shift = middleFrame.minY - targetY
        XCTAssertGreaterThan(shift, middleFrame.height,
                             "The predeparture position must differ from the initial TOC/swipe arrival")
        let startY = visibleReader.maxY - 12
        XCTAssertGreaterThan(startY - shift, top + 12)
        let origin = app.coordinate(withNormalizedOffset: .zero)
        let start = origin.withOffset(CGVector(dx: visibleReader.midX, dy: startY))
        let end = origin.withOffset(CGVector(dx: visibleReader.midX, dy: startY - shift))
        start.press(forDuration: 0.05, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.2)
        let savedWitness = requireRowWitness(blockID: blockID)
        capture("Reflow-R25-portrait-before-departure")

        let back = fixtureBar.buttons.element(boundBy: 0)
        requireHittable(back)
        back.tap()
        let leftReader = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            !self.app.scrollViews["native-reader"].exists
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [leftReader], timeout: 10), .completed)
        XCTAssertTrue(app.navigationBars["本文表示テスト"].exists)
        app.terminate()
        XCUIDevice.shared.orientation = .landscapeLeft
        app.launch()
        XCTAssertEqual(app.launchEnvironment["AILIBRARY_UI_TEST_SUITE"], ownedSuite)
        requireLayout(portrait: false)
        try openFixtureLibrary()
        let resume = try singleForegroundControl(app.buttons.matching(identifier: "library-resume"),
                                                name: "fixture Continue button")
        resume.tap()
        XCTAssertTrue(reader.waitForExistence(timeout: 20))
        XCTAssertTrue(fixtureBar.waitForExistence(timeout: 10))
        // First arrival only: no corrective TOC, search, swipe or drag below.
        // Do not compare raw portrait Y to landscape Y or loosen visibility.
        let landscapeWitness = requireRowWitness(blockID: blockID)
        XCTAssertLessThanOrEqual(abs(landscapeWitness.offset - savedWitness.offset),
                                max(landscapeWitness.rowHeight, savedWitness.rowHeight),
                                "The row must remain within one measured row height of its saved reading-top offset")
        capture("Reflow-R25-landscape-after-relaunch")
        XCUIDevice.shared.orientation = .portrait
        requireLayout(portrait: true)
        let portraitWitness = requireRowWitness(blockID: blockID)
        XCTAssertLessThanOrEqual(abs(portraitWitness.offset - savedWitness.offset),
                                max(portraitWitness.rowHeight, savedWitness.rowHeight))
        capture("Reflow-R25-portrait-after-live-return")
    }

    /// App-local DEBUG font overrides exercise saved-position relaunches, not
    /// live system Settings, glyph accuracy, VoiceOver or physical-device use.
    func testFixtureMeasuredRowAndBookmarkSurviveDynamicTypeRelaunches() throws {
        guard let requestedSuite = app.launchEnvironment["AILIBRARY_UI_TEST_SUITE"],
              requestedSuite.hasPrefix("ailibrary-uitest-"), requestedSuite.count < 100,
              UUID(uuidString: String(requestedSuite.dropFirst("ailibrary-uitest-".count)))?.uuidString
                == String(requestedSuite.dropFirst("ailibrary-uitest-".count)) else {
            throw NSError(domain: "ReaderReflowUITests", code: 3,
                          userInfo: [NSLocalizedDescriptionKey: "A canonical isolated UUID suite is required"])
        }
        app.terminate()
        app.launchEnvironment["AILIBRARY_UI_TEST_DYNAMIC_TYPE"] = "default"
        app.launch()
        requireLayout(portrait: true)
        let ownedSuite = app.launchEnvironment["AILIBRARY_UI_TEST_SUITE"]
        XCTAssertNotNil(ownedSuite)
        XCTAssertTrue(ownedSuite?.hasPrefix("ailibrary-uitest-") == true)
        try openFixtureLibrary()
        let article = try singleForegroundControl(app.descendants(matching: .any).matching(
            identifier: "library-article-test-fixtures/native-reader"), name: "fixture article")
        article.tap()
        requireNativeBody()
        let fixtureBar = app.navigationBars["ネイティブ本文テスト専用記事"]
        XCTAssertTrue(fixtureBar.waitForExistence(timeout: 10))
        let addBookmark = fixtureBar.buttons["しおりを追加"]
        requireHittable(addBookmark)
        addBookmark.tap()
        requireHittable(fixtureBar.buttons["しおりを削除"])

        // TOC and capped swipes are preparation only. Neither is used after
        // saved-position restoration, including both font-size relaunches.
        goToContents("CASE-INTRABLOCK-01", headingID: "case-intrablock-01")
        let reader = app.scrollViews["native-reader"]
        let tables = reader.scrollViews.matching(NSPredicate(format:
            "identifier BEGINSWITH %@ AND label CONTAINS %@", "native-table-", "データ40行、2列"))
        XCTAssertTrue(tables.firstMatch.waitForExistence(timeout: 10))
        XCTAssertEqual(tables.count, 1, "Exactly one forty-row table must be present")
        let blockID = String(tables.element(boundBy: 0).identifier.dropFirst("native-table-".count))
        XCTAssertFalse(blockID.isEmpty)
        let middle = soleCell(blockID: blockID, row: 25)
        for _ in 0..<18 where !isHittableOnScreen(middle, inside: reader, fullyVisible: true) {
            reader.swipeUp(velocity: .slow)
        }
        requireHittable(middle, inside: reader, fullyVisible: true)
        XCTAssertEqual(middle.label, "INTRABLOCK-R25")
        let middleFrame = middle.frame
        let visibleReader = reader.frame.intersection(app.frame)
        let top = max(visibleReader.minY, fixtureBar.frame.maxY)
        XCTAssertTrue([middleFrame.minY, top, visibleReader.maxY, middleFrame.height].allSatisfy(\.isFinite))
        XCTAssertGreaterThan(middleFrame.height, 0)
        // This single measured setup drag places the short marker near the
        // reading top. It does not require an exact zero-gap cell boundary.
        let targetY = top + 24
        let shift = middleFrame.minY - targetY
        XCTAssertGreaterThan(shift, middleFrame.height,
                             "The predeparture position must differ from the initial TOC/swipe arrival")
        let startY = visibleReader.maxY - 12
        XCTAssertGreaterThan(startY - shift, top + 12)
        let origin = app.coordinate(withNormalizedOffset: .zero)
        let start = origin.withOffset(CGVector(dx: visibleReader.midX, dy: startY))
        let end = origin.withOffset(CGVector(dx: visibleReader.midX, dy: startY - shift))
        start.press(forDuration: 0.05, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.2)
        let savedWitness = requireRowWitness(blockID: blockID)
        let savedStride = try measuredRowStride(blockID: blockID)
        capture("DynamicType-R25-default-before-departure")

        let back = fixtureBar.buttons.element(boundBy: 0)
        requireHittable(back)
        back.tap()
        let leftReader = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            !self.app.scrollViews["native-reader"].exists
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [leftReader], timeout: 10), .completed)
        XCTAssertTrue(app.navigationBars["本文表示テスト"].exists)
        app.terminate()

        for mode in ["accessibility5", "default"] {
            app.launchEnvironment["AILIBRARY_UI_TEST_DYNAMIC_TYPE"] = mode
            app.launch()
            XCTAssertEqual(app.launchEnvironment["AILIBRARY_UI_TEST_SUITE"], ownedSuite)
            XCTAssertEqual(app.launchEnvironment["AILIBRARY_UI_TEST_SUITE"], requestedSuite)
            requireLayout(portrait: true)
            try openFixtureLibrary()
            let resume = try singleForegroundControl(app.buttons.matching(identifier: "library-resume"),
                                                    name: "fixture Continue button")
            resume.tap()
            XCTAssertTrue(reader.waitForExistence(timeout: 20))
            XCTAssertTrue(fixtureBar.waitForExistence(timeout: 10))
            // First restored reader arrival only. No corrective TOC, search,
            // swipe or drag is allowed after Continue in either font mode.
            let witness = requireRowWitness(blockID: blockID)
            XCTAssertLessThanOrEqual(abs(witness.offset - savedWitness.offset),
                                    max(witness.rowHeight, savedWitness.rowHeight),
                                    "The measured R25 must restore within one row height of its saved top offset")
            let currentStride = try measuredRowStride(blockID: blockID)
            if mode == "accessibility5" {
                XCTAssertGreaterThan(currentStride, savedStride * 1.25,
                                     "The measured row spacing must actually grow; a requested font mode alone is not proof")
            } else {
                XCTAssertEqual(currentStride, savedStride, accuracy: 1,
                               "Returning to the fixed default mode must restore the original measured row spacing")
            }
            capture("DynamicType-R25-" + mode + "-after-relaunch")
            if mode == "accessibility5" {
                let back = fixtureBar.buttons.element(boundBy: 0)
                requireHittable(back)
                back.tap()
                let leftReader = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
                    !self.app.scrollViews["native-reader"].exists
                }, object: nil)
                XCTAssertEqual(XCTWaiter.wait(for: [leftReader], timeout: 10), .completed)
                app.terminate()
            }
        }
    }
}
