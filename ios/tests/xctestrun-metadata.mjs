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
