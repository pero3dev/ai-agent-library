import CryptoKit
import Foundation
import UIKit
import XCTest
@testable import AILibrary

/// Native text and scroll geometry: no web view, browser, network, user records or
/// system pasteboard. Physical link activation and VoiceOver remain device QA.
@MainActor
final class NativeInlineTests: XCTestCase {
    private let target = NativeLink(kind: "article", article_id: "test-fixtures/native-reader", heading_id: "case-end-01")

    func testReaderScrollBoundsUseAdjustedInsetsAndClampEnds() {
        for (top, expected) in [(CGFloat(0), CGFloat(1600)), (103, 1497), (140, 1460)] {
            XCTAssertEqual(NativeReaderScrollBounds.offset(targetMinY: 1600, topInset: top, bottomInset: 34,
                contentHeight: 4000, viewportHeight: 852), expected)
        }
        XCTAssertEqual(NativeReaderScrollBounds.offset(targetMinY: 3950, topInset: 103, bottomInset: 34,
            contentHeight: 4000, viewportHeight: 852), 3182)
        XCTAssertEqual(NativeReaderScrollBounds.offset(targetMinY: 0, topInset: 103, bottomInset: 34,
            contentHeight: 4000, viewportHeight: 852), -103)
        XCTAssertEqual(NativeReaderScrollBounds.offset(targetMinY: 160, topInset: 103, bottomInset: 34,
            contentHeight: 200, viewportHeight: 852), -103)
        XCTAssertEqual(NativeReaderScrollBounds.offset(targetMinY: -30, topInset: 103, bottomInset: 34,
            contentHeight: 4000, viewportHeight: 852), -103)
    }

    func testReaderScrollBoundsRejectInvalidGeometry() {
        for index in 0..<5 {
            for invalid in [CGFloat.nan, .infinity, -.infinity] {
                var values: [CGFloat] = [1600, 103, 34, 4000, 852]
                values[index] = invalid
                XCTAssertNil(NativeReaderScrollBounds.offset(targetMinY: values[0], topInset: values[1],
                    bottomInset: values[2], contentHeight: values[3], viewportHeight: values[4]))
            }
        }
        let invalidSizes: [[CGFloat]] = [[1600, -1, 34, 4000, 852], [1600, 103, -1, 4000, 852],
                                        [1600, 103, 34, -1, 852], [1600, 103, 34, 4000, 0]]
        for values in invalidSizes {
            XCTAssertNil(NativeReaderScrollBounds.offset(targetMinY: values[0], topInset: values[1],
                bottomInset: values[2], contentHeight: values[3], viewportHeight: values[4]))
        }
    }

    func testReaderProgressChoosesBlockAtTheVisibleInset() {
        let frames: [String: CGFloat] = ["previous": -900, "selected": 103, "next": 145]
        XCTAssertEqual(NativeReaderScrollBounds.readingBlockID(frames: frames, viewportHeight: 852, topInset: 103), "selected")
        XCTAssertEqual(NativeReaderScrollBounds.readingBlockID(frames: frames, viewportHeight: 852, topInset: 0), "previous")
        XCTAssertEqual(NativeReaderScrollBounds.readingBlockID(frames: ["previous": -500, "selected": 140, "next": 200],
            viewportHeight: 852, topInset: 140), "selected")
        XCTAssertEqual(NativeReaderScrollBounds.readingBlockID(frames: ["selected": 0, "next": 80],
            viewportHeight: 852, topInset: 0), "selected")
        XCTAssertNil(NativeReaderScrollBounds.readingBlockID(frames: [:], viewportHeight: 852, topInset: 103))
        XCTAssertNil(NativeReaderScrollBounds.readingBlockID(frames: ["invalid": .nan], viewportHeight: 852, topInset: 103))
        XCTAssertNil(NativeReaderScrollBounds.readingBlockID(frames: frames, viewportHeight: 0, topInset: 103))
    }

    private func readerScrollFixture(_ run: (UIScrollView, UIView, NativeReaderScrollAnchors) throws -> Void) rethrows {
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 393, height: 852))
        let scroll = UIScrollView(frame: window.bounds)
        scroll.contentInsetAdjustmentBehavior = .never
        scroll.contentInset = UIEdgeInsets(top: 103, left: 0, bottom: 34, right: 0)
        scroll.contentSize = CGSize(width: 393, height: 4000)
        window.addSubview(scroll)
        let content = UIView(frame: CGRect(x: 0, y: 0, width: 393, height: 4000))
        scroll.addSubview(content)
        let root = UIView(frame: .zero)
        content.addSubview(root)
        let anchors = NativeReaderScrollAnchors()
        anchors.registerRoot(root)
        try withExtendedLifetime(window) { try run(scroll, content, anchors) }
    }

    func testReaderScrollMarkersConvertNestedTargetsWithoutDoubleCountingOffset() {
        readerScrollFixture { scroll, content, anchors in
            let group = UIView(frame: CGRect(x: 0, y: 1200, width: 393, height: 1000))
            content.addSubview(group)
            let marker = UIView(frame: CGRect(x: 0, y: 400, width: 1, height: 0))
            group.addSubview(marker)
            anchors.registerTarget(marker, id: "nested")
            for offset in [CGFloat(20), CGFloat(800)] {
                scroll.contentOffset = CGPoint(x: 0, y: offset)
                XCTAssertEqual(marker.convert(marker.bounds, to: scroll).minY, 1600)
                XCTAssertEqual(anchors.placeTarget("nested"), .aligned)
                XCTAssertEqual(scroll.contentOffset.y, 1497)
            }
            scroll.contentInset.top = 140
            XCTAssertEqual(anchors.placeTarget("nested"), .aligned)
            XCTAssertEqual(scroll.contentOffset.y, 1460)
        }
    }

    func testReaderScrollMarkersKeepHorizontalAndDisabledTextViewOffsets() {
        readerScrollFixture { scroll, content, anchors in
            let horizontal = UIScrollView(frame: CGRect(x: 0, y: 1200, width: 300, height: 180))
            horizontal.contentInsetAdjustmentBehavior = .never
            horizontal.contentSize = CGSize(width: 2000, height: 180)
            horizontal.contentOffset = CGPoint(x: 250, y: 0)
            content.addSubview(horizontal)
            let text = UITextView(frame: CGRect(x: 0, y: 100, width: 150, height: 40))
            text.isScrollEnabled = false
            text.contentInsetAdjustmentBehavior = .never
            horizontal.addSubview(text)
            let marker = UIView(frame: CGRect(x: 0, y: 8, width: 1, height: 0))
            text.addSubview(marker)
            anchors.registerTarget(marker, id: "inside-text")
            XCTAssertEqual(anchors.placeTarget("inside-text"), .aligned)
            XCTAssertEqual(scroll.contentOffset.y, 1205)
            XCTAssertEqual(horizontal.contentOffset, CGPoint(x: 250, y: 0))
            XCTAssertEqual(text.contentOffset, .zero)
        }
    }

    func testReaderScrollMarkersRejectForeignViewsAndRetainOnlyWeakTargets() {
        readerScrollFixture { scroll, content, anchors in
            scroll.contentOffset = CGPoint(x: 0, y: 500)
            let foreign = UIView(frame: CGRect(x: 0, y: 1600, width: 1, height: 0))
            content.window?.addSubview(foreign)
            anchors.registerTarget(foreign, id: "foreign")
            XCTAssertEqual(anchors.placeTarget("foreign"), .unavailable)
            XCTAssertEqual(scroll.contentOffset.y, 500)
            weak var probe: UIView?
            autoreleasepool {
                let detached = UIView(frame: .zero)
                probe = detached
                anchors.registerTarget(detached, id: "released")
            }
            XCTAssertNil(probe)
            XCTAssertEqual(anchors.placeTarget("released"), .waitingForLayout)
            XCTAssertEqual(scroll.contentOffset.y, 500)
        }
    }

    private func fixture(_ run: (ContentSnapshot, NativeAsset) throws -> Void) throws {
        let root = FileManager.default.temporaryDirectory.appendingPathComponent("native-inline-" + UUID().uuidString)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: root) }
        for (name, color) in [("light.png", UIColor.black), ("dark.png", UIColor.white)] {
            let image = UIGraphicsImageRenderer(size: CGSize(width: 80, height: 24)).image { context in
                color.setFill()
                context.fill(CGRect(x: 0, y: 0, width: 80, height: 24))
            }
            try XCTUnwrap(image.pngData()).write(to: root.appendingPathComponent(name))
        }
        let manifest = ContentManifest(schema_version: 2, revision: UUID().uuidString,
            articles: [], audio: [], files: ["light.png": "test", "dark.png": "test"])
        let asset = NativeAsset(light: "light.png", dark: "dark.png", width: 80, height: 24, scale: 1, baseline: 5)
        try run(ContentSnapshot(root: root, manifest: manifest), asset)
    }

    private func math(_ asset: NativeAsset) -> NativeInline {
        NativeInline(type: "math", asset: asset, source: "x^2", accessibility_text: "エックスの二乗")
    }

    func testImageCachesSeparatePackagesAndUpdatedDigestsWithTheSameRevision() throws {
        try fixture { first, asset in
            try fixture { second, _ in
                let white = try Data(contentsOf: second.root.appendingPathComponent("dark.png"))
                try white.write(to: second.root.appendingPathComponent("light.png"))
                func snapshot(_ root: URL) throws -> ContentSnapshot {
                    var hashes: [String: String] = [:]
                    for file in ["light.png", "dark.png"] {
                        let data = try Data(contentsOf: root.appendingPathComponent(file))
                        hashes[file] = SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
                    }
                    let manifest = ContentManifest(schema_version: 2, revision: "shared-revision",
                        articles: [], audio: [], files: hashes)
                    return ContentSnapshot(root: root, manifest: manifest)
                }
                let original = try snapshot(first.root)
                let other = try snapshot(second.root)
                let cache = NativeAssetImageCache.shared
                let originalImage = try XCTUnwrap(cache.image(for: asset, snapshot: original, dark: false)?.pngData())
                let originalInline = try XCTUnwrap(cache.inlineImage(for: asset, snapshot: original, dark: false,
                    fontScale: 1, maximumWidth: 300)?.pngData())
                XCTAssertNotEqual(originalImage, try XCTUnwrap(cache.image(for: asset, snapshot: other, dark: false)?.pngData()))
                XCTAssertNotEqual(originalInline, try XCTUnwrap(cache.inlineImage(for: asset, snapshot: other, dark: false,
                    fontScale: 1, maximumWidth: 300)?.pngData()))
                // A new manifest for the same root also invalidates old cached pixels.
                try white.write(to: first.root.appendingPathComponent("light.png"))
                let updated = try snapshot(first.root)
                XCTAssertNotEqual(originalImage, try XCTUnwrap(cache.image(for: asset, snapshot: updated, dark: false)?.pngData()))
                XCTAssertNotEqual(originalInline, try XCTUnwrap(cache.inlineImage(for: asset, snapshot: updated, dark: false,
                    fontScale: 1, maximumWidth: 300)?.pngData()))
            }
        }
    }

    private func render(_ inlines: [NativeInline], snapshot: ContentSnapshot, dark: Bool = false,
                        scale: CGFloat = 1, width: CGFloat = 300, alignment: NSTextAlignment = .left) -> NSAttributedString {
        NativeLinkedMathAttributedContent.make(inlines: inlines, snapshot: snapshot,
            font: UIFont.systemFont(ofSize: 17), bold: false, dark: dark, fontScale: scale,
            maximumWidth: width, lineSpacing: 5, alignment: alignment)
    }

    func testFallbackOnlyAppliesToMathInsideLinkIncludingNestedStyles() {
        let formula = NativeInline(type: "math", source: "x")
        XCTAssertFalse(NativeInlineContent.containsLinkedMath([formula]))
        XCTAssertFalse(NativeInlineContent.containsLinkedMath([
            NativeInline(type: "link", children: [NativeInline(type: "text", text: "本文")], target: target)]))
        XCTAssertTrue(NativeInlineContent.containsLinkedMath([
            NativeInline(type: "strong", children: [NativeInline(type: "link", children: [
                NativeInline(type: "emphasis", children: [formula])], target: target)])]))
    }

    func testMathOnlyLinkRetainsImageTargetSpokenLabelAndBaseline() throws {
        try fixture { snapshot, asset in
            let text = render([NativeInline(type: "link", children: [math(asset)], target: target)], snapshot: snapshot)
            XCTAssertEqual(text.string, "\u{fffc}")
            XCTAssertEqual(text.attribute(.link, at: 0, effectiveRange: nil) as? URL, NativeInlineContent.linkURL(target))
            let attachment = try XCTUnwrap(text.attribute(.attachment, at: 0, effectiveRange: nil) as? NativeMathTextAttachment)
            XCTAssertNotNil(attachment.image)
            XCTAssertEqual(attachment.source, "x^2")
            XCTAssertEqual(attachment.spokenText, "エックスの二乗")
            XCTAssertEqual(attachment.accessibilityLabel, "エックスの二乗")
            XCTAssertEqual(attachment.bounds, CGRect(x: 0, y: -5, width: 80, height: 24))
        }
    }

    func testMixedMathLinkSharesTargetAcrossTextAndImageOnly() throws {
        try fixture { snapshot, asset in
            let inlines = [NativeInline(type: "text", text: "前 "),
                NativeInline(type: "link", children: [NativeInline(type: "text", text: "式 "), math(asset),
                    NativeInline(type: "text", text: " を開く")], target: target), NativeInline(type: "text", text: " 後")]
            let text = render(inlines, snapshot: snapshot)
            let string = text.string as NSString
            let range = string.range(of: "式 \u{fffc} を開く")
            let url = NativeInlineContent.linkURL(target)
            for index in range.location..<NSMaxRange(range) {
                XCTAssertEqual(text.attribute(.link, at: index, effectiveRange: nil) as? URL, url)
            }
            XCTAssertNil(text.attribute(.link, at: 0, effectiveRange: nil))
            XCTAssertNil(text.attribute(.link, at: text.length - 1, effectiveRange: nil))
            XCTAssertEqual(NativeLinkedMathAttributedContent.copyableText(text, range: NSRange(location: 0, length: text.length)),
                           "前 式 x^2 を開く 後")
        }
    }

    func testCellStylesAlignmentAndLineSpacingSurviveAttributedAssembly() throws {
        try fixture { snapshot, asset in
            let inlines = [NativeInline(type: "strong", children: [NativeInline(type: "emphasis", children: [
                NativeInline(type: "text", text: "強調")])]), NativeInline(type: "code", text: "code"),
                NativeInline(type: "link", children: [math(asset)], target: target)]
            for alignment in [NSTextAlignment.center, .right] {
                let text = render(inlines, snapshot: snapshot, alignment: alignment)
                let font = try XCTUnwrap(text.attribute(.font, at: 0, effectiveRange: nil) as? UIFont)
                XCTAssertTrue(font.fontDescriptor.symbolicTraits.contains(.traitBold))
                XCTAssertTrue(font.fontDescriptor.symbolicTraits.contains(.traitItalic))
                let codeFont = try XCTUnwrap(text.attribute(.font, at: 2, effectiveRange: nil) as? UIFont)
                XCTAssertTrue(codeFont.fontDescriptor.symbolicTraits.contains(.traitMonoSpace))
                let paragraph = try XCTUnwrap(text.attribute(.paragraphStyle, at: 0, effectiveRange: nil) as? NSParagraphStyle)
                XCTAssertEqual(paragraph.alignment, alignment)
                XCTAssertEqual(paragraph.lineSpacing, 5)
            }
        }
    }

    func testMathUsesMatchingScaleWidthBaselineAndDarkAsset() throws {
        try fixture { snapshot, asset in
            let link = NativeInline(type: "link", children: [math(asset)], target: target)
            let wide = render([link], snapshot: snapshot, scale: 2, width: 200)
            let narrow = render([link], snapshot: snapshot, dark: true, scale: 2, width: 60)
            let wideImage = try XCTUnwrap(wide.attribute(.attachment, at: 0, effectiveRange: nil) as? NativeMathTextAttachment)
            let narrowImage = try XCTUnwrap(narrow.attribute(.attachment, at: 0, effectiveRange: nil) as? NativeMathTextAttachment)
            XCTAssertEqual(wideImage.bounds, CGRect(x: 0, y: -10, width: 160, height: 48))
            XCTAssertEqual(narrowImage.bounds, CGRect(x: 0, y: -3.75, width: 60, height: 18))
            let light = render([link], snapshot: snapshot, width: 60)
            let lightImage = try XCTUnwrap(light.attribute(.attachment, at: 0, effectiveRange: nil) as? NativeMathTextAttachment)
            XCTAssertNotEqual(lightImage.image?.pngData(), narrowImage.image?.pngData())
        }
    }

    func testMissingImageFallsBackToLinkedSelectableTeX() throws {
        try fixture { snapshot, asset in
            var missing = asset
            missing = NativeAsset(light: "missing.png", dark: "missing.png", width: missing.width,
                                  height: missing.height, scale: missing.scale, baseline: missing.baseline)
            let text = render([NativeInline(type: "link", children: [math(missing)], target: target)], snapshot: snapshot)
            XCTAssertEqual(text.string, "x^2")
            XCTAssertNil(text.attribute(.attachment, at: 0, effectiveRange: nil))
            XCTAssertEqual(text.attribute(.link, at: 0, effectiveRange: nil) as? URL, NativeInlineContent.linkURL(target))
        }
    }

    func testCopyPreservesUnicodeBreaksAndFormulaSourceAndRejectsInvalidRanges() throws {
        try fixture { snapshot, asset in
            let text = render([NativeInline(type: "text", text: "🤖日本語"), NativeInline(type: "soft_break"),
                NativeInline(type: "link", children: [math(asset)], target: target), NativeInline(type: "hard_break"),
                NativeInline(type: "code", text: "次の行")], snapshot: snapshot)
            XCTAssertEqual(NativeLinkedMathAttributedContent.copyableText(text, range: NSRange(location: 0, length: text.length)),
                           "🤖日本語 x^2\n次の行")
            XCTAssertEqual(NativeLinkedMathAttributedContent.copyableText(text, range: (text.string as NSString).range(of: "日本語")), "日本語")
            XCTAssertEqual(NativeLinkedMathAttributedContent.copyableText(text, range: NSRange(location: NSNotFound, length: 0)), "")
            XCTAssertEqual(NativeLinkedMathAttributedContent.copyableText(text, range: NSRange(location: text.length, length: 1)), "")
        }
    }

    func testAccessibilityActionsHaveMeaningfulNamesAndDispatchOnlyCurrentLinks() throws {
        let mathLink = NativeInline(type: "link", children: [NativeInline(type: "math", source: "x^2", accessibility_text: "エックスの二乗")], target: target)
        let coordinator = NativeMathLinkCoordinator()
        coordinator.links = NativeInlineContent.links([mathLink, mathLink])
        XCTAssertEqual(coordinator.links.count, 1)
        var opened: [URL] = []
        var sources = 0
        coordinator.openLink = { opened.append($0) }
        coordinator.showMathSource = { sources += 1 }
        let actions = coordinator.actions()
        XCTAssertEqual(actions.map(\.name), ["リンク: エックスの二乗", "数式のテキスト表現"])
        XCTAssertTrue(try XCTUnwrap(actions[0].actionHandler)(actions[0]))
        XCTAssertTrue(try XCTUnwrap(actions[1].actionHandler)(actions[1]))
        XCTAssertEqual(opened, [try XCTUnwrap(NativeInlineContent.linkURL(target))])
        XCTAssertEqual(sources, 1)
        XCTAssertFalse(coordinator.performLink(try XCTUnwrap(URL(string: "https://example.com/unlisted"))))
        coordinator.links = []
        XCTAssertFalse(coordinator.performLink(try XCTUnwrap(NativeInlineContent.linkURL(target))))
        XCTAssertEqual(opened.count, 1)
    }

    private var navigationDocument: NativeDocument {
        NativeDocument(schema_version: 1, article_id: "navigation-test", source_sha256: "test", blocks: [
            NativeBlock(id: "first-block", type: "heading", heading_id: "first", level: 2),
            NativeBlock(id: "first-body", type: "paragraph"),
            NativeBlock(id: "last-block", type: "heading", heading_id: "last", level: 2),
            NativeBlock(id: "last-body", type: "paragraph")])
    }

    func testInitialFragmentIsConsumedAndReturningReaderResumesCurrentBlock() {
        var state = NativeReaderNavigationState()
        let request = UUID()
        let saved = ReadingPosition(heading: "first", fraction: 0, blockID: "first-body")
        let first = state.destination(document: navigationDocument, position: saved, initialHeading: "last",
            requestedHeading: nil, headingRequestID: request, currentBlockID: nil)
        XCTAssertEqual(first.heading, "last")
        XCTAssertEqual(first.blockID, "last-block")
        state.consume(headingRequestID: request)
        let resumed = state.destination(document: navigationDocument, position: saved, initialHeading: "last",
            requestedHeading: nil, headingRequestID: request, currentBlockID: "last-body")
        XCTAssertNil(resumed.heading, "A normal resume must not move VoiceOver to an old fragment")
        XCTAssertEqual(resumed.blockID, "last-body")
    }

    func testTOCRequestIsConsumedButNewRequestIDMovesAgain() {
        var state = NativeReaderNavigationState()
        let request = UUID()
        let saved = ReadingPosition(heading: "first", fraction: 0)
        let first = state.destination(document: navigationDocument, position: saved, initialHeading: "first",
            requestedHeading: "last", headingRequestID: request, currentBlockID: "first-body")
        XCTAssertEqual(first.heading, "last")
        XCTAssertEqual(first.blockID, "last-block")
        state.consume(headingRequestID: request)
        let resumed = state.destination(document: navigationDocument, position: saved, initialHeading: "first",
            requestedHeading: "last", headingRequestID: request, currentBlockID: "last-body")
        XCTAssertNil(resumed.heading)
        XCTAssertEqual(resumed.blockID, "last-body")
        let repeated = state.destination(document: navigationDocument, position: saved, initialHeading: "first",
            requestedHeading: "last", headingRequestID: UUID(), currentBlockID: "last-body")
        XCTAssertEqual(repeated.heading, "last")
        XCTAssertEqual(repeated.blockID, "last-block")
    }

    func testUnplacedRequestCanRetryAndConsumedReaderFallsBackToSavedPosition() {
        var state = NativeReaderNavigationState()
        let request = UUID()
        let saved = ReadingPosition(heading: "last", fraction: 1, blockID: "last-body")
        for _ in 0..<2 {
            let retry = state.destination(document: navigationDocument, position: saved, initialHeading: "first",
                requestedHeading: nil, headingRequestID: request, currentBlockID: nil)
            XCTAssertEqual(retry.heading, "first")
            XCTAssertEqual(retry.blockID, "first-block")
        }
        state.consume(headingRequestID: request)
        let resumed = state.destination(document: navigationDocument, position: saved, initialHeading: "first",
            requestedHeading: nil, headingRequestID: request, currentBlockID: "removed-block")
        XCTAssertNil(resumed.heading)
        XCTAssertEqual(resumed.blockID, "last-body")
    }

    private var nestedNavigationDocument: NativeDocument {
        NativeDocument(schema_version: 1, article_id: "search-navigation", source_sha256: "test", blocks: [
            NativeBlock(id: "first-block", type: "heading", heading_id: "first", level: 2),
            NativeBlock(id: "quote-container", type: "quote", blocks: [
                NativeBlock(id: "nested-list", type: "list", ordered: false, items: [
                    NativeListItem(id: "item", blocks: [NativeBlock(id: "nested-hit", type: "paragraph")])])]),
            NativeBlock(id: "last-block", type: "heading", heading_id: "last", level: 2),
            NativeBlock(id: "last-body", type: "paragraph")])
    }

    func testSearchDestinationKeepsNestedAnchorSeparateFromSavedContainer() {
        let state = NativeReaderNavigationState()
        let hit = NativeSearchHit(blockID: "nested-hit", containerBlockID: "quote-container", headingID: "first")
        let destination = state.destination(document: nestedNavigationDocument,
            position: ReadingPosition(heading: "last", fraction: 1, blockID: "last-body"),
            initialHeading: nil, requestedHeading: nil, headingRequestID: UUID(), currentBlockID: nil,
            initialSearchHit: hit, searchStartsAtBeginning: true)
        XCTAssertEqual(destination.blockID, "quote-container", "Reading persistence still uses a top-level block")
        XCTAssertEqual(destination.scrollBlockID, "nested-hit", "The visible destination must be the actual nested hit")
        XCTAssertEqual(destination.focusBlockID, "nested-hit")
    }

    func testConsumedSearchDoesNotReplayWhenReturningFromAnotherArticle() {
        var state = NativeReaderNavigationState()
        let request = UUID()
        let hit = NativeSearchHit(blockID: "nested-hit", containerBlockID: "quote-container", headingID: "first")
        state.consume(headingRequestID: request)
        let destination = state.destination(document: nestedNavigationDocument,
            position: ReadingPosition(heading: "first", fraction: 0), initialHeading: nil,
            requestedHeading: nil, headingRequestID: request, currentBlockID: "last-body",
            initialSearchHit: hit, searchStartsAtBeginning: true)
        XCTAssertEqual(destination.blockID, "last-body")
        XCTAssertEqual(destination.scrollBlockID, "last-body")
        XCTAssertNil(destination.focusBlockID, "Normal resume must not take VoiceOver focus")
    }

    func testNewTOCRequestAndInitialFragmentTakePriorityOverSearch() {
        var state = NativeReaderNavigationState()
        let hit = NativeSearchHit(blockID: "nested-hit", containerBlockID: "quote-container", headingID: "first")
        let saved = ReadingPosition(heading: "first", fraction: 0)
        let initial = state.destination(document: nestedNavigationDocument, position: saved,
            initialHeading: "last", requestedHeading: nil, headingRequestID: UUID(), currentBlockID: nil,
            initialSearchHit: hit, searchStartsAtBeginning: true)
        XCTAssertEqual(initial.scrollBlockID, "last-block")
        state.consume(headingRequestID: UUID())
        let requested = state.destination(document: nestedNavigationDocument, position: saved,
            initialHeading: nil, requestedHeading: "last", headingRequestID: UUID(), currentBlockID: "quote-container",
            initialSearchHit: hit, searchStartsAtBeginning: true)
        XCTAssertEqual(requested.heading, "last")
        XCTAssertEqual(requested.blockID, "last-block")
        XCTAssertEqual(requested.focusBlockID, "last-block")
    }

    func testSearchWithoutBodyHitStartsAtBeginningButEmptySearchResumes() {
        let saved = ReadingPosition(heading: "last", fraction: 1, blockID: "last-body")
        var state = NativeReaderNavigationState()
        let request = UUID()
        let fallback = state.destination(document: nestedNavigationDocument, position: saved,
            initialHeading: nil, requestedHeading: nil, headingRequestID: request, currentBlockID: nil,
            initialSearchHit: nil, searchStartsAtBeginning: true)
        XCTAssertEqual(fallback.blockID, "first-block")
        XCTAssertEqual(fallback.focusBlockID, "first-block")
        let empty = state.destination(document: nestedNavigationDocument, position: saved,
            initialHeading: nil, requestedHeading: nil, headingRequestID: request, currentBlockID: nil)
        XCTAssertEqual(empty.blockID, "last-body")
        XCTAssertNil(empty.focusBlockID)
        state.consume(headingRequestID: request)
        let resumed = state.destination(document: nestedNavigationDocument, position: saved,
            initialHeading: nil, requestedHeading: nil, headingRequestID: request, currentBlockID: "last-body",
            initialSearchHit: nil, searchStartsAtBeginning: true)
        XCTAssertEqual(resumed.blockID, "last-body", "The metadata fallback must also be one-shot")
    }

    func testUnplacedSearchCanRetryAndInvalidSearchAnchorFallsBackSafely() {
        let state = NativeReaderNavigationState()
        let saved = ReadingPosition(heading: "last", fraction: 1)
        let hit = NativeSearchHit(blockID: "nested-hit", containerBlockID: "quote-container", headingID: "first")
        let request = UUID()
        for _ in 0..<2 {
            let retry = state.destination(document: nestedNavigationDocument, position: saved,
                initialHeading: nil, requestedHeading: nil, headingRequestID: request, currentBlockID: nil,
                initialSearchHit: hit, searchStartsAtBeginning: true)
            XCTAssertEqual(retry.scrollBlockID, "nested-hit")
        }
        let invalid = NativeSearchHit(blockID: "nested-hit", containerBlockID: "last-body", headingID: nil)
        let fallback = state.destination(document: nestedNavigationDocument, position: saved,
            initialHeading: nil, requestedHeading: nil, headingRequestID: request, currentBlockID: nil,
            initialSearchHit: invalid, searchStartsAtBeginning: true)
        XCTAssertEqual(fallback.blockID, "first-block")
        XCTAssertEqual(fallback.scrollBlockID, "first-block")
    }
}
