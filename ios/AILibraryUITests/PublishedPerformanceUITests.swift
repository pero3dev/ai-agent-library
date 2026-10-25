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
