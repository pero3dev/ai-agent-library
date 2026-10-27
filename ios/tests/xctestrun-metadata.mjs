import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

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

const canonical = value => name(value) && value.startsWith('/') && !/[\x00-\x1f\x7f\\]/.test(value) &&
  !value.includes('__') && value.split('/').slice(1).every(p => p !== '' && p !== '.' && p !== '..');
const relativeFile = value => name(value) && !value.startsWith('/') && !/[\x00-\x1f\x7f\\]/.test(value) &&
  value.split('/').every(p => p !== '' && p !== '.' && p !== '..');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

function sourcePath(value, root, host) {
  assert.ok(name(value), 'Source path is required');
  if (value.startsWith('__TESTROOT__/')) value = root + value.slice('__TESTROOT__'.length);
  else if (host && value.startsWith('__TESTHOST__/')) value = host + value.slice('__TESTHOST__'.length);
  assert.ok(canonical(value) && value.startsWith(root + '/'), 'Escaping or unresolved owned source path');
  return value;
}

// Simulator source-artifact mode. The caller keeps this runfile beside stock.
export function phaseUITestRun(metadata, options) {
  const { formatVersion, target } = selectUITestTarget(metadata, options);
  const { testRoot, appPath, phase } = options;
  assert.ok(own(options, 'testRoot') && canonical(testRoot), 'Owned test root is required');
  assert.ok(own(options, 'appPath') && appPath === testRoot + '/Debug-iphonesimulator/AILibrary.app', 'Owned baseline App is required');
  assert.ok(own(options, 'phase') && ['failure', 'restored'].includes(phase), 'Explicit phase is required');
  if (own(target, 'UseDestinationArtifacts')) assert.equal(target.UseDestinationArtifacts, false, 'Simulator requires source artifacts');
  assert.equal(sourcePath(target.UITargetAppPath, testRoot), appPath, 'Stock UI App path mismatch');
  const runner = sourcePath(target.TestHostPath, testRoot);
  assert.ok(runner.endsWith('.app') && runner !== appPath && !runner.startsWith(appPath + '/'), 'Distinct owned UI runner is required');
  const test = sourcePath(target.TestBundlePath, testRoot, runner);
  assert.ok(test.startsWith(runner + '/') && test.endsWith('.xctest'), 'UI test bundle must remain inside runner');
  const phaseApp = testRoot + '/owned-phase-apps/' + phase + '/AILibrary.app';
  const phaseToken = '__TESTROOT__/owned-phase-apps/' + phase + '/AILibrary.app';
  const convertedTarget = structuredClone(target);
  convertedTarget.UITargetAppPath = phaseToken;
  let dependencyReplacements = 0;
  if (own(target, 'DependentProductPaths')) {
    assert.ok(Array.isArray(target.DependentProductPaths) && target.DependentProductPaths.every(name), 'DependentProductPaths must contain strings');
    convertedTarget.DependentProductPaths = target.DependentProductPaths.map(value => {
      let resolved = value;
      if (value.startsWith('__TESTROOT__/')) resolved = testRoot + value.slice('__TESTROOT__'.length);
      else if (value.startsWith('__TESTHOST__/')) resolved = runner + value.slice('__TESTHOST__'.length);
      assert.ok(canonical(resolved), 'DependentProductPaths must be canonical paths with known macros');
      if (resolved !== appPath && !resolved.startsWith(appPath + '/')) return value;
      const suffix = resolved.slice(appPath.length);
      dependencyReplacements += 1; return (value.startsWith('__TESTROOT__/') ? phaseToken : phaseApp) + suffix;
    });
  }
  let converted;
  if (formatVersion === 1) converted = { __xctestrun_metadata__: structuredClone(metadata.__xctestrun_metadata__), [options.expectedBlueprintName]: convertedTarget };
  else {
    const configuration = metadata.TestConfigurations.find(row => row.IsEnabled !== false && row.TestTargets.includes(target));
    converted = structuredClone(metadata);
    converted.TestConfigurations = [{ ...structuredClone(configuration), TestTargets: [convertedTarget] }];
  }
  const originalReferences = [appPath, '__TESTROOT__/Debug-iphonesimulator/AILibrary.app'];
  function rejectOriginal(value) {
    if (typeof value === 'string') assert.ok(!originalReferences.some(original => value.includes(original)), 'Residual original App reference');
    else if (Array.isArray(value)) value.forEach(rejectOriginal);
    else if (record(value)) Object.values(value).forEach(rejectOriginal);
  }
  rejectOriginal(converted);
  return { metadata: converted, phaseApp, phaseTargetPath: phaseToken, dependencyReplacements, formatVersion };
}

// Fresh regular-file copies only. The built baseline is never written/unlinked.
export function copyPhaseApp(testRoot, phase, expected, omitted = null) {
  assert.ok(canonical(testRoot) && fs.realpathSync(testRoot) === testRoot, 'Canonical owned Products is required');
  assert.ok(['failure', 'restored'].includes(phase), 'Explicit phase is required');
  assert.ok(Array.isArray(expected) && expected.length > 0 && expected.length <= 8192, 'Bounded baseline inventory is required');
  if (omitted !== null) assert.ok(phase === 'failure' && relativeFile(omitted) && /^Content\/articles\/[A-Za-z0-9/_-]+\.json$/.test(omitted) && expected.filter(row => row.path === omitted).length === 1, 'Only one baseline article may be omitted in F');
  const source = path.join(testRoot, 'Debug-iphonesimulator/AILibrary.app');
  const phaseRoot = path.join(testRoot, 'owned-phase-apps');
  const parent = path.join(phaseRoot, phase), destination = path.join(parent, 'AILibrary.app');
  function snapshot(root) {
    const rows = [], directories = [], identities = new Map(); let count = 0, total = 0;
    function walk(full, relative) {
      assert.ok(++count <= 8192, 'Copy tree entry bound'); assert.equal(fs.realpathSync(full), full);
      const stat = fs.lstatSync(full, { bigint: true }); assert.equal(stat.isSymbolicLink(), false);
      identities.set(relative, { dev: stat.dev, ino: stat.ino, nlink: stat.nlink });
      if (stat.isDirectory()) {
        directories.push({ path: relative, mode: Number(stat.mode & 0o777n) });
        for (const part of fs.readdirSync(full).sort()) walk(path.join(full, part), relative ? relative + '/' + part : part);
      } else {
        assert.ok(stat.isFile() && relativeFile(relative)); total += Number(stat.size); assert.ok(total <= 512 * 1024 * 1024);
        const bytes = fs.readFileSync(full); assert.equal(bytes.length, Number(stat.size));
        rows.push({ path: relative, bytes: bytes.length, mode: Number(stat.mode & 0o777n), sha256: digest(bytes) });
      }
    }
    walk(root, ''); return { rows, directories, identities };
  }
  const before = snapshot(source); assert.deepEqual(before.rows, expected, 'Baseline before copy must match');
  if (!fs.existsSync(phaseRoot)) fs.mkdirSync(phaseRoot, { mode: 0o700 });
  assert.equal(fs.realpathSync(phaseRoot), phaseRoot); assert.ok(fs.lstatSync(phaseRoot).isDirectory());
  fs.mkdirSync(parent, { mode: 0o700 }); // Exclusive: no overwrite or same-phase reuse.
  fs.mkdirSync(destination, { mode: 0o700 });
  for (const row of before.directories.slice(1)) fs.mkdirSync(path.join(destination, row.path), { mode: 0o700 });
  for (const row of before.rows) {
    if (row.path === omitted) continue;
    const from = path.join(source, row.path), to = path.join(destination, row.path);
    fs.copyFileSync(from, to, fs.constants.COPYFILE_EXCL);
    const identity = fs.lstatSync(to, { bigint: true }), original = before.identities.get(row.path);
    assert.ok(identity.isFile() && identity.nlink === 1n && (identity.dev !== original.dev || identity.ino !== original.ino), 'Copy must not alias baseline inode');
    fs.chmodSync(to, row.mode);
  }
  for (const row of [...before.directories].reverse()) fs.chmodSync(path.join(destination, row.path), row.mode);
  const actual = snapshot(destination), after = snapshot(source);
  assert.deepEqual(after.rows, expected, 'Baseline after copy must match'); assert.deepEqual(after.directories, before.directories);
  assert.deepEqual(actual.rows, expected.filter(row => row.path !== omitted), 'Phase paths/bytes/modes/SHA must match');
  assert.deepEqual(actual.directories, before.directories, 'Phase directory modes must match');
  for (const [relative, identity] of actual.identities) {
    const original = before.identities.get(relative);
    assert.ok(identity.dev !== original.dev || identity.ino !== original.ino, 'Every copied inode must be distinct');
  }
  return { source, destination, inventory: actual.rows, baselineAfter: after.rows,
    directories: actual.directories.length, regularFiles: actual.rows.length,
    exclusiveCopies: true, baselineUnchanged: true, fileAndDirectoryModesMatch: true, inodesDistinct: true };
}
