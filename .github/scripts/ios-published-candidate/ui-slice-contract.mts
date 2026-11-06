import assert from 'node:assert/strict';

// Fixed full28 functional cases. Data never comes from a result or caller.
export const ORIGINAL_CASE_IDS = Object.freeze([
  "NativeReaderUITests/testContentsBookmarkAndResumeAfterRelaunch()",
  "NativeReaderUITests/testHealthyLegacyHeadingPositionAndBookmarkPersistAfterNativeResumeAndRelaunch()",
  "NativeReaderUITests/testThreeArticlesHaveNativeBodyText()",
  "PublishedReaderUITests/testBodySearchArrivesAtNestedParagraphContainingAllTermsWithoutReaderGestures()",
  "PublishedReaderUITests/testBundledContentSelectionCancelConfirmAndRestartKeepReadingAndGuide()",
  "PublishedReaderUITests/testCancelContentFolderPickerPreservesFiltersAndReadingAndAllowsMoreActions()",
  "PublishedReaderUITests/testChapter03LargeDiagramCanExpandAndShowSource()",
  "PublishedReaderUITests/testChapter03LongArticleContentsBookmarkAndResume()",
  "PublishedReaderUITests/testChapter08LargestTableReachesFinalRowAndColumn()",
  "PublishedReaderUITests/testFilteredFixtureActionsAndReadingChangesRemainIsolatedFromNormalLibrary()",
  "PublishedReaderUITests/testFilteredMoreActionsAboutRoundTripPreservesQueryAndLearningTag()",
  "PublishedReaderUITests/testFixtureBodyLinksShowFragmentFilenameFarAndDuplicateWitnesses()",
  "PublishedReaderUITests/testFixtureCrossArticleBodyLinkReturnsToMeasuredSourcePositionAndBookmark()",
  "PublishedReaderUITests/testFixtureFirstCodeCopyUsesThePublicButton()",
  "PublishedReaderUITests/testFixtureTallSingleBlockResumesNearItsMeasuredInternalRowAfterRelaunch()",
  "PublishedReaderUITests/testFreshStorageBundledLaunchAndRelaunchKeepReadingWithoutImport()",
  "PublishedReaderUITests/testGlossarySearchRelatedArticleAndReturnPreserveReaderState()",
  "PublishedReaderUITests/testLearningRouteShowsItsInstructionChapterOrderAndArticle()",
  "PublishedReaderUITests/testLearningTagSearchCombinesWithArticleSearchAndClearsZeroResults()",
  "PublishedReaderUITests/testRelatedChapterLinkClosesInPlaceAndOpensAnArticleWithoutLosingTheReader()",
  "PublishedReaderUITests/testResumeUsesLaterReadingPositionInsteadOfReplayingThePreviousBodyQuery()",
  "PublishedReaderUITests/testStorageUsageRecheckAndClosePreserveFilteredLibrary()",
  "ReaderViewportGeometryTests/testCopiedFramesSelectLowestFullyVisibleParagraph()",
  "ReaderViewportGeometryTests/testEqualTopFramesPreserveCollectionOrder()",
  "ReaderViewportGeometryTests/testForegroundOcclusionAndPartialFrameRemainExcluded()",
  "ReaderViewportGeometryTests/testInvalidViewportAndEmptyCollectionFailClosed()",
  "ReaderViewportGeometryTests/testNonfiniteEmptyAndOccludedFramesCannotWin()",
  "ReaderViewportGeometryTests/testUnknownOrAmbiguousForegroundDoesNotBecomeVisible()"
]);
export const SLICE_CASE_IDS = Object.freeze({
  'reading-state': Object.freeze([
  "NativeReaderUITests/testContentsBookmarkAndResumeAfterRelaunch()",
  "NativeReaderUITests/testHealthyLegacyHeadingPositionAndBookmarkPersistAfterNativeResumeAndRelaunch()",
  "NativeReaderUITests/testThreeArticlesHaveNativeBodyText()",
  "PublishedReaderUITests/testBodySearchArrivesAtNestedParagraphContainingAllTermsWithoutReaderGestures()",
  "PublishedReaderUITests/testBundledContentSelectionCancelConfirmAndRestartKeepReadingAndGuide()",
  "PublishedReaderUITests/testCancelContentFolderPickerPreservesFiltersAndReadingAndAllowsMoreActions()",
  "PublishedReaderUITests/testChapter03LongArticleContentsBookmarkAndResume()",
  "PublishedReaderUITests/testFilteredFixtureActionsAndReadingChangesRemainIsolatedFromNormalLibrary()",
  "PublishedReaderUITests/testFilteredMoreActionsAboutRoundTripPreservesQueryAndLearningTag()",
  "PublishedReaderUITests/testFixtureCrossArticleBodyLinkReturnsToMeasuredSourcePositionAndBookmark()",
  "PublishedReaderUITests/testFixtureTallSingleBlockResumesNearItsMeasuredInternalRowAfterRelaunch()",
  "PublishedReaderUITests/testFreshStorageBundledLaunchAndRelaunchKeepReadingWithoutImport()",
  "PublishedReaderUITests/testResumeUsesLaterReadingPositionInsteadOfReplayingThePreviousBodyQuery()",
  "PublishedReaderUITests/testStorageUsageRecheckAndClosePreserveFilteredLibrary()",
  "ReaderViewportGeometryTests/testCopiedFramesSelectLowestFullyVisibleParagraph()",
  "ReaderViewportGeometryTests/testEqualTopFramesPreserveCollectionOrder()",
  "ReaderViewportGeometryTests/testForegroundOcclusionAndPartialFrameRemainExcluded()",
  "ReaderViewportGeometryTests/testInvalidViewportAndEmptyCollectionFailClosed()",
  "ReaderViewportGeometryTests/testNonfiniteEmptyAndOccludedFramesCannotWin()",
  "ReaderViewportGeometryTests/testUnknownOrAmbiguousForegroundDoesNotBecomeVisible()"
]),
  'content-copy': Object.freeze([
  "PublishedReaderUITests/testChapter03LargeDiagramCanExpandAndShowSource()",
  "PublishedReaderUITests/testChapter08LargestTableReachesFinalRowAndColumn()",
  "PublishedReaderUITests/testFixtureBodyLinksShowFragmentFilenameFarAndDuplicateWitnesses()",
  "PublishedReaderUITests/testFixtureFirstCodeCopyUsesThePublicButton()",
  "PublishedReaderUITests/testGlossarySearchRelatedArticleAndReturnPreserveReaderState()",
  "PublishedReaderUITests/testLearningRouteShowsItsInstructionChapterOrderAndArticle()",
  "PublishedReaderUITests/testLearningTagSearchCombinesWithArticleSearchAndClearsZeroResults()",
  "PublishedReaderUITests/testRelatedChapterLinkClosesInPlaceAndOpensAnArticleWithoutLosingTheReader()"
])
});

// Deliberately narrow source grammar: unfamiliar/ambiguous declarations fail.
// This preserves class-selector detection of future methods before filtering.
export function flatUISourceNames(entries: readonly import('node:fs').Dirent[]) {
  assert.ok(Array.isArray(entries));
  assert.ok(entries.every(entry => typeof entry.name === 'string' && entry.isFile() && !entry.isSymbolicLink()),
    'UI source layout must contain regular files only; directories, links and special entries are rejected');
  return entries.map(entry => entry.name).filter(name => name.endsWith('.swift')).sort();
}

export function validateSwiftCaseSources(sources: Record<string, string>, otherSources: Record<string, string> = {}) {
  const specs: [string, [string, string][]][] = [
    ['ios/AILibraryUITests/NativeReaderUITests.swift', [
      ['NativeReaderUITests', 'NativeReaderUITestCase'], ['ReaderViewportGeometryTests', 'XCTestCase']]],
    ['ios/AILibraryUITests/PublishedReaderUITests.swift', [['PublishedReaderUITests', 'NativeReaderUITestCase']]]
  ];
  assert.ok(sources && typeof sources === 'object' && !Array.isArray(sources));
  assert.deepEqual(Object.keys(sources).sort(), specs.map(([file]) => file).sort());
  assert.ok(otherSources && typeof otherSources === 'object' && !Array.isArray(otherSources));
  assert.ok(Object.keys(otherSources).length <= 32);
  for (const [file, text] of Object.entries(otherSources)) {
    assert.ok(/^ios\/AILibraryUITests\/[A-Za-z0-9_-]+\.swift$/.test(file) && !Object.hasOwn(sources, file));
    assert.equal(typeof text, 'string'); assert.ok(text.length <= 1024 * 1024);
    assert.ok(!/\b(?:class|extension)\s+(?:NativeReaderUITests|PublishedReaderUITests|ReaderViewportGeometryTests|NativeReaderUITestCase)\b/.test(text),
      'Selected test or inherited base declarations outside the fixed source files are ambiguous');
  }
  const ids = [], classes = [];
  for (const [file, targets] of specs) {
    const text = sources[file];
    assert.equal(typeof text, 'string'); assert.ok(text.length > 0 && text.length <= 1024 * 1024 && !text.includes('\r'));
    const allFunctions = [...text.matchAll(/\bfunc\s+([^\s(]+)\s*\(/g)];
    assert.equal(allFunctions.length, [...text.matchAll(/\bfunc\b/g)].length, 'Ambiguous function declaration');
    assert.ok(allFunctions.every(match => /^[A-Za-z_][A-Za-z0-9_]*(?:<[A-Za-z_][A-Za-z0-9_]*(?:,[A-Za-z_][A-Za-z0-9_]*)*>)?$/.test(match[1])), 'Unsupported function name');
    const globalTests = allFunctions.filter(match => match[1].startsWith('test')).map(match => [match.index, match[1]]);
    const classified: [number, string][] = [];
    for (const [name, parent] of targets) {
      assert.equal([...text.matchAll(new RegExp(`\\b(?:class|extension)\\s+${name}\\b`, 'g'))].length, 1,
        'Target class missing, duplicated or extended');
      const headers = [...text.matchAll(new RegExp(`^final class ${name}: ${parent} \\{$`, 'gm'))];
      assert.equal(headers.length, 1, 'Noncanonical target class declaration');
      const start = headers[0].index + headers[0][0].length;
      const end = text.indexOf('\n}\n', start); assert.ok(end > start, 'Canonical class closing boundary missing');
      const body = text.slice(start, end);
      const methods = [...body.matchAll(/^    func (test[A-Za-z0-9_]+)\(\)(?: throws)? \{$/gm)];
      assert.ok(methods.length > 0, 'No canonical test methods in target class');
      for (const method of methods) {
        classified.push([start + method.index + 4, method[1]]);
        ids.push(`${name}/${method[1]}()`);
      }
      classes.push({ source: file, class: name, methods: methods.map(method => method[1]) });
    }
    assert.deepEqual(classified.sort((a,b) => a[0]-b[0]), globalTests,
      'Every test declaration must belong to one canonical target class; ambiguous syntax is rejected');
  }
  assert.equal(new Set(ids).size, ids.length, 'Duplicate source test method');
  assert.deepEqual(ids.sort(), [...ORIGINAL_CASE_IDS], 'Update the fixed full UI roster and slices for every source test change');
  return { status: 'exact-source28-method-roster-verified', case_IDs: ids, classes };
}


export function validatePartitions(partitions: Record<string, readonly string[]> = SLICE_CASE_IDS) {
  assert.ok(partitions && typeof partitions === 'object' && !Array.isArray(partitions));
  assert.deepEqual(Object.keys(partitions).sort(), ['content-copy', 'reading-state']);
  assert.equal(ORIGINAL_CASE_IDS.length, 28); assert.equal(new Set(ORIGINAL_CASE_IDS).size, 28);
  const flattened = [];
  for (const slice of ['reading-state', 'content-copy']) {
    const cases = partitions[slice];
    assert.ok(Array.isArray(cases));
    assert.equal(cases.length, slice === 'reading-state' ? 20 : 8);
    assert.equal(new Set(cases).size, cases.length);
    assert.ok(cases.every(id => typeof id === 'string' && ORIGINAL_CASE_IDS.includes(id)));
    flattened.push(...cases);
  }
  assert.equal(flattened.length, 28); assert.equal(new Set(flattened).size, 28, 'Slices must be disjoint');
  assert.deepEqual(flattened.sort(), [...ORIGINAL_CASE_IDS], 'Both fixed slices must exactly cover the fixed28');
  return true;
}

export function caseIDsForSlice(slice: string | undefined) {
  validatePartitions();
  assert.ok(Object.hasOwn(SLICE_CASE_IDS, slice as string), 'Unknown finite UI slice');
  return [...SLICE_CASE_IDS[slice as keyof typeof SLICE_CASE_IDS]];
}

export function validateUITestTree(tree: { devices: Record<string, unknown>[]; testNodes: Record<string, unknown>[] }, binding: Record<string, unknown>, slice: string | undefined) {
  const expectedCaseIDs = caseIDsForSlice(slice);
  const expectedSuites = [...new Set(expectedCaseIDs.map(id => id.split('/')[0]))].sort();
  assert.equal(binding.slice, slice);
  assert.deepEqual(binding.expected_case_IDs, expectedCaseIDs);
  assert.ok(Array.isArray(tree.devices)); assert.equal(tree.devices.length, 1);
  const device = tree.devices[0];
  assert.equal((device.deviceId as string).toUpperCase(), binding.UUID); assert.equal(device.osVersion, '18.5');
  assert.equal(device.platform, 'iOS Simulator');
  if (device.modelName !== undefined) assert.equal(device.modelName, 'iPhone 16');
  const container = (node: Record<string, unknown>, type: string, name: unknown) => {
    assert.ok(node && typeof node === 'object' && !Array.isArray(node));
    assert.equal(node.nodeType, type, 'Only the observed Xcode16.4 node hierarchy is supported');
    assert.equal(node.name, name); assert.equal(node.result, 'Passed');
    assert.ok(Array.isArray(node.children)); assert.ok(node.children.length > 0);
    return node.children as Record<string, unknown>[];
  };
  assert.ok(Array.isArray(tree.testNodes)); assert.equal(tree.testNodes.length, 1);
  const bundles = container(tree.testNodes[0], 'Test Plan', 'AILibrary'); assert.equal(bundles.length, 1);
  const suites = container(bundles[0], 'UI test bundle', 'AILibraryUITests');
  const bundleURL = 'test://com.apple.xcode/AILibrary/AILibraryUITests';
  assert.equal(bundles[0].nodeIdentifierURL, bundleURL);
  assert.equal(suites.length, expectedSuites.length);
  assert.deepEqual(suites.map(suite => suite.name).sort(), expectedSuites);
  const cases = [];
  for (const suite of suites) {
    const children = container(suite, 'Test Suite', suite.name);
    assert.equal(suite.nodeIdentifierURL, `${bundleURL}/${suite.name}`);
    for (const node of children) {
      assert.ok(node && typeof node === 'object' && !Array.isArray(node));
      assert.equal(node.nodeType, 'Test Case'); assert.equal(node.result, 'Passed');
      assert.equal(node.children, undefined, 'A Test Case must be a leaf in the observed schema');
      assert.equal(typeof node.name, 'string'); assert.match(node.name as string, /^test\w+\(\)$/);
      assert.equal(node.nodeIdentifier, `${suite.name}/${node.name}`);
      assert.equal(node.nodeIdentifierURL, `${bundleURL}/${suite.name}/${(node.name as string).slice(0, -2)}`);
      cases.push(node);
    }
  }
  assert.equal(cases.length, expectedCaseIDs.length, 'All selected native UI cases must run without skips or repeats');
  const actualCaseIDs = cases.map(node => node.nodeIdentifier);
  assert.equal(new Set(actualCaseIDs).size, actualCaseIDs.length, 'No selected case may repeat');
  assert.deepEqual(actualCaseIDs.sort(), expectedCaseIDs, 'The complete source-derived selected case set must pass');
  return { cases, device, expectedCaseIDs };
}
