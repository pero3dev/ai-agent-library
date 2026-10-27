import assert from 'node:assert/strict';

const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const own = (value, key) => Object.hasOwn(value, key);
const name = value => typeof value === 'string' && value.length > 0 && value.trim() === value;

function targetRecord(value) {
  assert.ok(record(value), 'Malformed xctestrun target dictionary');
  assert.ok(own(value, 'BlueprintName') && name(value.BlueprintName), 'Target BlueprintName is required');
  if (own(value, 'IsUITestBundle')) assert.equal(typeof value.IsUITestBundle, 'boolean', 'IsUITestBundle must be boolean');
  return value;
}

// Select the observed legacy/modern schemas only. Paths are deliberately left
// untouched: the caller must resolve and audit its owned build products.
export function selectUITestTarget(metadata, options) {
  assert.ok(record(metadata), 'xctestrun metadata must be a dictionary');
  assert.ok(record(options), 'Expected target and actual App identifiers are required');
  const { expectedBlueprintName, expectedBundleIdentifier, actualAppBundleIdentifier } = options;
  assert.ok(own(options, 'expectedBlueprintName') && name(expectedBlueprintName), 'Expected BlueprintName is required');
  assert.ok(own(options, 'expectedBundleIdentifier') && name(expectedBundleIdentifier), 'Expected App bundle identifier is required');
  assert.ok(own(options, 'actualAppBundleIdentifier') && name(actualAppBundleIdentifier), 'Actual App bundle identifier is required');
  assert.equal(actualAppBundleIdentifier, expectedBundleIdentifier, 'Actual App bundle identifier mismatch');
  assert.ok(own(metadata, '__xctestrun_metadata__') && record(metadata.__xctestrun_metadata__), 'xctestrun format header is required');
  const formatVersion = metadata.__xctestrun_metadata__.FormatVersion;
  assert.ok(own(metadata.__xctestrun_metadata__, 'FormatVersion') && (formatVersion === 1 || formatVersion === 2), 'Unsupported or missing xctestrun FormatVersion');

  let targets;
  if (formatVersion === 1) {
    assert.ok(!own(metadata, 'TestConfigurations'), 'Mixed legacy and TestConfigurations xctestrun schema');
    targets = Object.entries(metadata).filter(([key]) => key !== '__xctestrun_metadata__').map(([key, value]) => {
      const target = targetRecord(value);
      assert.equal(target.BlueprintName, key, 'Legacy target key and BlueprintName mismatch');
      return target;
    });
  } else {
    // Additional non-target metadata (for example coverage arrays) is not a
    // second target source. Top-level legacy target dictionaries are refused.
    for (const [key, value] of Object.entries(metadata)) {
      if (key === '__xctestrun_metadata__' || key === 'TestConfigurations') continue;
      assert.ok(key !== expectedBlueprintName && !(record(value) &&
        ['BlueprintName', 'IsUITestBundle', 'TestBundlePath', 'UITargetAppPath'].some(field => own(value, field))),
      'Mixed legacy top-level target and TestConfigurations xctestrun schema');
    }
    assert.ok(own(metadata, 'TestConfigurations') && Array.isArray(metadata.TestConfigurations), 'Modern TestConfigurations array is required');
    targets = metadata.TestConfigurations.flatMap(configuration => {
      assert.ok(record(configuration), 'Malformed xctestrun test configuration');
      if (own(configuration, 'IsEnabled')) assert.equal(typeof configuration.IsEnabled, 'boolean', 'Configuration IsEnabled must be boolean');
      if (own(configuration, 'IsEnabled') && configuration.IsEnabled === false) return [];
      assert.ok(own(configuration, 'TestTargets') && Array.isArray(configuration.TestTargets), 'Enabled configuration TestTargets array is required');
      return configuration.TestTargets.map(targetRecord);
    });
  }

  const matches = targets.filter(target => target.BlueprintName === expectedBlueprintName);
  assert.equal(matches.length, 1, 'Expected exactly one UI target BlueprintName');
  const target = matches[0];
  assert.ok(own(target, 'IsUITestBundle') && target.IsUITestBundle === true, 'Expected target must be a UI test bundle');
  if (formatVersion === 2) assert.ok(own(target, 'UITargetAppBundleIdentifier'), 'Modern UI target App bundle identifier is required');
  if (own(target, 'UITargetAppBundleIdentifier')) {
    assert.ok(name(target.UITargetAppBundleIdentifier), 'Metadata UI target App bundle identifier is invalid');
    assert.equal(target.UITargetAppBundleIdentifier, expectedBundleIdentifier, 'Metadata UI target App bundle identifier mismatch');
  }
  return { formatVersion, target };
}

// Pure path resolution only: the caller must additionally realpath/lstat and
// inspect the Info.plists before installing these owned build products.
const absoluteOwnedPath = value => typeof value === 'string' && value.startsWith('/') &&
  !/[\x00-\x1f\x7f\\]/.test(value) && !value.includes('__') &&
  value.split('/').slice(1).every(part => part !== '' && part !== '.' && part !== '..');
const within = (root, value) => value.startsWith(root + '/');
const bundleIdentifier = value => typeof value === 'string' && /^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(value);

export function resolveUITestBuildPaths(metadata, options) {
  const { formatVersion, target } = selectUITestTarget(metadata, options);
  const { testRoot, appPath } = options;
  assert.ok(own(options, 'testRoot') && absoluteOwnedPath(testRoot), 'Canonical owned test root is required');
  assert.ok(own(options, 'appPath') && absoluteOwnedPath(appPath) && within(testRoot, appPath) && appPath.endsWith('.app'), 'Owned App path is required');
  if (own(target, 'UseDestinationArtifacts')) assert.equal(target.UseDestinationArtifacts, false, 'Expected stock source artifacts');
  function resolve(field, testHost) {
    assert.ok(own(target, field) && name(target[field]), 'Stock ' + field + ' is required');
    let value = target[field];
    if (value.startsWith('__TESTROOT__/')) value = testRoot + value.slice('__TESTROOT__'.length);
    else if (testHost && value.startsWith('__TESTHOST__/')) value = testHost + value.slice('__TESTHOST__'.length);
    assert.ok(absoluteOwnedPath(value) && within(testRoot, value), 'Escaping or unresolved ' + field);
    return value;
  }
  const targetAppPath = resolve('UITargetAppPath');
  assert.equal(targetAppPath, appPath, 'Stock UI App path mismatch');
  const runnerPath = resolve('TestHostPath');
  assert.ok(runnerPath.endsWith('.app') && runnerPath !== appPath && !within(appPath, runnerPath) && !within(runnerPath, appPath), 'Distinct owned UI runner App is required');
  const testBundlePath = resolve('TestBundlePath', runnerPath);
  assert.ok(testBundlePath.endsWith('.xctest') && within(runnerPath, testBundlePath), 'Test bundle must be inside the owned runner App');
  return { formatVersion, runnerPath, testBundlePath, targetAppPath,
    testBundleDestinationRelativePath: '__TESTHOST__/' + testBundlePath.slice(runnerPath.length + 1) };
}

// xcodebuild.xctestrun(5): destination artifacts exclude the three source paths
// and require these three destination identifiers/paths. Keep the new runfile
// beside the stock file so all other __TESTROOT__ references retain their base.
export function destinationUITestRun(metadata, options) {
  const paths = resolveUITestBuildPaths(metadata, options);
  for (const key of ['runnerBundleIdentifier', 'testBundleIdentifier']) {
    assert.ok(own(options, key) && bundleIdentifier(options[key]), 'Actual Info.plist ' + key + ' is required');
    assert.notEqual(options[key], options.actualAppBundleIdentifier, 'Test artifacts cannot be the UI App');
  }
  const { target } = selectUITestTarget(metadata, options);
  if (own(target, 'TestHostBundleIdentifier')) assert.equal(target.TestHostBundleIdentifier, options.runnerBundleIdentifier, 'Stock runner bundle identifier mismatch');
  if (own(target, 'TestBundleDestinationRelativePath')) assert.equal(target.TestBundleDestinationRelativePath, paths.testBundleDestinationRelativePath, 'Stock destination test path mismatch');
  const destination = structuredClone(target);
  for (const key of ['TestBundlePath', 'TestHostPath', 'UITargetAppPath']) delete destination[key];
  Object.assign(destination, { UseDestinationArtifacts: true,
    TestHostBundleIdentifier: options.runnerBundleIdentifier,
    TestBundleDestinationRelativePath: paths.testBundleDestinationRelativePath,
    UITargetAppBundleIdentifier: options.actualAppBundleIdentifier });
  let converted;
  if (paths.formatVersion === 1) {
    converted = { __xctestrun_metadata__: structuredClone(metadata.__xctestrun_metadata__), [options.expectedBlueprintName]: destination };
  } else {
    const configuration = metadata.TestConfigurations.find(row => row.IsEnabled !== false && row.TestTargets.includes(target));
    converted = structuredClone(metadata);
    converted.TestConfigurations = [{ ...structuredClone(configuration), TestTargets: [destination] }];
  }
  return { metadata: converted, paths };
}
