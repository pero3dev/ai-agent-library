import test from 'node:test';
import { requiredFixture, objectFixture, objectArrayFixture } from '../helpers/json-fixtures.mjs';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { selectUITestTarget, phaseUITestRun, copyPhaseApp } from '../../ios/tests/xctestrun-metadata.mjs';

const expected = { expectedBlueprintName: 'AILibraryUITests', expectedBundleIdentifier: 'dev.example.AILibrary', actualAppBundleIdentifier: 'dev.example.AILibrary' };
/** @returns {Record<string,unknown> & {BlueprintName:string,IsUITestBundle:boolean,TestBundlePath:string,TestHostPath:string,UITargetAppPath:string}} */
const ui = () => ({ BlueprintName: 'AILibraryUITests', IsUITestBundle: true,
  TestBundlePath: '__TESTHOST__/PlugIns/AILibraryUITests.xctest',
  TestHostPath: '__TESTROOT__/Debug-iphonesimulator/AILibraryUITests-Runner.app',
  UITargetAppPath: '__TESTROOT__/Debug-iphonesimulator/AILibrary.app' });
/** @returns {Record<string,unknown> & {BlueprintName:string,IsUITestBundle:boolean,TestBundlePath:string}} */
const unit = () => ({ BlueprintName: 'AILibraryTests', IsUITestBundle: false,
  TestBundlePath: '__TESTROOT__/Debug-iphonesimulator/AILibraryTests.xctest' });
const legacy = () => ({ __xctestrun_metadata__: { ContainerInfo: { ContainerName: 'AILibrary', SchemeName: 'AILibrary' }, FormatVersion: 1 },
  AILibraryTests: unit(), AILibraryUITests: ui() });
/** @returns {Record<string,unknown> & {__xctestrun_metadata__:{FormatVersion:number},TestConfigurations:(Record<string,unknown>&{TestTargets:ReturnType<typeof unit>[]})[]}} */
const modern = () => ({ __xctestrun_metadata__: { FormatVersion: 2 }, TestConfigurations: [
  { Name: 'Default', IsEnabled: true, TestTargets: [unit(), { ...ui(), UITargetAppBundleIdentifier: expected.expectedBundleIdentifier }] }
] });
/** @template T @param {T} value @returns {T} */
const frozen = value => { if (value && typeof value === 'object') { Object.values(value).forEach(frozen); Object.freeze(value); } return value; };

test('observed Xcode16.4 legacy unit/UI dictionaries select the original UI target without metadata bundle ID', () => {
  const input = legacy(), result = selectUITestTarget(input, expected);
  assert.equal(result.formatVersion, 1); assert.equal(result.target, input.AILibraryUITests);
  assert.equal(Object.hasOwn(result.target, 'UITargetAppBundleIdentifier'), false);
  for (const key of ['TestBundlePath', 'TestHostPath', 'UITargetAppPath']) assert.equal(result.target[key], Reflect.get(input.AILibraryUITests, key));
});

test('modern enabled configuration selects the original UI target and keeps unresolved path tokens', () => {
  const input = modern(), target = input.TestConfigurations[0].TestTargets[1], result = selectUITestTarget(input, expected);
  assert.equal(result.formatVersion, 2); assert.equal(result.target, target);
  assert.equal(result.target.UITargetAppPath, '__TESTROOT__/Debug-iphonesimulator/AILibrary.app');
  assert.equal(result.target.TestBundlePath, '__TESTHOST__/PlugIns/AILibraryUITests.xctest');
});

test('legacy accepts a present matching metadata bundle ID as an additional assertion', () => {
  const input = legacy(); Reflect.set(input.AILibraryUITests, "UITargetAppBundleIdentifier", expected.expectedBundleIdentifier);
  assert.equal(selectUITestTarget(input, expected).target, input.AILibraryUITests);
});

test('both formats always require a separately supplied actual App bundle identifier', () => {
  for (const fixture of [legacy, modern]) for (const actual of [undefined, null, '', 42, ' dev.example.AILibrary', 'dev.example.Other']) {
    assert.throws(() => selectUITestTarget(fixture(), { ...expected, actualAppBundleIdentifier: actual }), /Actual App bundle identifier/);
  }
});

test('matching metadata bundle ID never compensates for a missing actual App ID', () => {
  const input = legacy(); Reflect.set(input.AILibraryUITests, "UITargetAppBundleIdentifier", expected.expectedBundleIdentifier);
  const options = { ...expected }; Reflect.deleteProperty(options, "actualAppBundleIdentifier");
  assert.throws(() => selectUITestTarget(input, options), /Actual App bundle identifier/);
});

test('both formats refuse mismatched or malformed present metadata bundle IDs', () => {
  for (const fixture of [legacy, modern]) for (const id of ['dev.example.Other', '', null, false, 42, ' dev.example.AILibrary']) {
    const input = fixture(), target = objectFixture('AILibraryUITests' in input ? input.AILibraryUITests : input.TestConfigurations[0].TestTargets[1]); Reflect.set(target, "UITargetAppBundleIdentifier", id);
    assert.throws(() => selectUITestTarget(input, expected), /Metadata UI target App bundle identifier/);
  }
});

test('modern format requires its metadata bundle ID while legacy alone permits absence', () => {
  const input = modern(); Reflect.deleteProperty(input.TestConfigurations[0].TestTargets[1], "UITargetAppBundleIdentifier");
  assert.throws(() => selectUITestTarget(input, expected), /Modern UI target App bundle identifier is required/);
});

test('missing, string, unsupported or non-finite format versions do not fall back to a guessed schema', () => {
  for (const version of [undefined, null, '1', '2', 0, 3, -1, 1.5, NaN, Infinity]) {
    const input = legacy(); Reflect.set(input.__xctestrun_metadata__, "FormatVersion", version);
    assert.throws(() => selectUITestTarget(input, expected), /FormatVersion/);
  }
  const input = legacy(); Reflect.deleteProperty(input.__xctestrun_metadata__, "FormatVersion");
  assert.throws(() => selectUITestTarget(input, expected), /FormatVersion/);
});

test('malformed root or format header is rejected', () => {
  for (const input of [undefined, null, [], 'metadata', 1, {}, { __xctestrun_metadata__: null }, { __xctestrun_metadata__: [] }]) {
    assert.throws(() => selectUITestTarget(input, expected), /dictionary|header/);
  }
});

test('expected blueprint and bundle options must be explicit nonempty strings', () => {
  for (const options of [undefined, null, [], {}]) assert.throws(() => selectUITestTarget(legacy(), options));
  for (const key of ['expectedBlueprintName', 'expectedBundleIdentifier']) for (const value of ['', undefined, 42, ' bad ']) {
    assert.throws(() => selectUITestTarget(legacy(), { ...expected, [key]: value }), /Expected/);
  }
});

test('legacy cannot contain TestConfigurations even if it would otherwise select a valid UI target', () => {
  for (const configurations of [[], undefined, modern().TestConfigurations]) {
    const input = legacy(); Reflect.set(input, "TestConfigurations", configurations);
    assert.throws(() => selectUITestTarget(input, expected), /Mixed/);
  }
});

test('modern cannot mix enabled configuration targets with legacy top-level UI or unit targets', () => {
  for (const [key, value] of /** @type {[string,unknown][]} */ ([['AILibraryUITests', ui()], ['AILibraryTests', unit()], ['AILibraryUITests', {}]])) {
    const input = modern(); Reflect.set(input, key, value);
    assert.throws(() => selectUITestTarget(input, expected), /Mixed/);
  }
});

test('legacy dictionary keys must match each BlueprintName, including the normal unit target', () => {
  for (const key of ['AILibraryTests', 'AILibraryUITests']) {
    const input = legacy(); Reflect.set(objectFixture(Reflect.get(input, key)), "BlueprintName", 'Other');
    assert.throws(() => selectUITestTarget(input, expected), /key and BlueprintName mismatch/);
  }
});

test('legacy malformed target entries are refused rather than ignored', () => {
  for (const value of [null, [], 'target', 1, {}, { BlueprintName: '' }, { BlueprintName: 'AILibraryTests', IsUITestBundle: 'false' }]) {
    const input = legacy(); Reflect.set(input, "AILibraryTests", value);
    assert.throws(() => selectUITestTarget(input, expected), /target dictionary|BlueprintName|IsUITestBundle/);
  }
});

test('legacy missing target and aliased duplicate BlueprintName are refused', () => {
  const missing = legacy(); Reflect.deleteProperty(missing, "AILibraryUITests");
  assert.throws(() => selectUITestTarget(missing, expected), /exactly one/);
  const duplicated = legacy(); Reflect.set(duplicated, "AnotherKey", ui());
  assert.throws(() => selectUITestTarget(duplicated, expected), /key and BlueprintName mismatch/);
});

test('modern duplicate expected target across enabled configurations is ambiguous', () => {
  const input = modern(); input.TestConfigurations.push({ TestTargets: [{ ...ui(), UITargetAppBundleIdentifier: expected.expectedBundleIdentifier }] });
  assert.throws(() => selectUITestTarget(input, expected), /exactly one/);
});

test('a same-name unit target cannot be hidden by filtering only UI roles first', () => {
  const input = modern(); input.TestConfigurations[0].TestTargets.push({ ...unit(), BlueprintName: 'AILibraryUITests' });
  assert.throws(() => selectUITestTarget(input, expected), /exactly one/);
});

test('expected target must have literal true UI role in both formats', () => {
  for (const fixture of [legacy, modern]) for (const role of [false, undefined, 'true', 1]) {
    const input = fixture(), target = objectFixture('AILibraryUITests' in input ? input.AILibraryUITests : input.TestConfigurations[0].TestTargets[1]);
    if (role === undefined) Reflect.deleteProperty(target, "IsUITestBundle"); else Reflect.set(target, "IsUITestBundle", role);
    assert.throws(() => selectUITestTarget(input, expected), /UI test bundle|IsUITestBundle/);
  }
});

test('modern configurations and enabled TestTargets must be arrays of dictionaries', () => {
  for (const values of [undefined, null, {}, 'targets']) {
    const input = modern(); Reflect.set(input, "TestConfigurations", values);
    assert.throws(() => selectUITestTarget(input, expected), /TestConfigurations/);
  }
  for (const value of [null, [], 'configuration']) {
    const input = modern(); Reflect.set(input, "TestConfigurations", [value]);
    assert.throws(() => selectUITestTarget(input, expected), /configuration/);
  }
  for (const targets of [undefined, null, {}, 'targets', [null], [{}]]) {
    const input = modern(); Reflect.set(input.TestConfigurations[0], "TestTargets", targets);
    assert.throws(() => selectUITestTarget(input, expected), /TestTargets|target dictionary|BlueprintName/);
  }
});

test('configuration enabled flag has strict boolean type when supplied', () => {
  for (const flag of ['false', 0, null]) {
    const input = modern(); Reflect.set(input.TestConfigurations[0], "IsEnabled", flag);
    assert.throws(() => selectUITestTarget(input, expected), /IsEnabled/);
  }
});

test('disabled configurations cannot create an expected-target duplicate and need no active target list', () => {
  const input = modern(); Reflect.apply(input.TestConfigurations.push, input.TestConfigurations, [{ IsEnabled: false, TestTargets: [ui()] }, { IsEnabled: false }]);
  assert.equal(selectUITestTarget(input, expected).target, input.TestConfigurations[0].TestTargets[1]);
});

test('only disabled configurations or empty enabled target lists do not produce a UI target', () => {
  for (const configurations of [[], [{ IsEnabled: false, TestTargets: modern().TestConfigurations[0].TestTargets }], [{ TestTargets: [] }]]) {
    const input = modern(); Reflect.set(input, "TestConfigurations", configurations);
    assert.throws(() => selectUITestTarget(input, expected), /exactly one/);
  }
});

test('unrelated modern unit/coverage metadata cannot replace the expected UI target', () => {
  const input = modern(); Reflect.set(input, "CodeCoverageBuildableInfos", []);
  Reflect.apply(input.TestConfigurations[0].TestTargets.push, input.TestConfigurations[0].TestTargets, [{ BlueprintName: 'OtherUITests', IsUITestBundle: true, UITargetAppBundleIdentifier: 'dev.example.Other' }]);
  assert.equal(selectUITestTarget(input, expected).target, input.TestConfigurations[0].TestTargets[1]);
});

test('frozen parsed metadata and options remain unchanged after success and failure', () => {
  for (const fixture of [legacy, modern]) {
    const input = frozen(fixture()), options = frozen({ ...expected }), before = JSON.stringify(input), beforeOptions = JSON.stringify(options);
    const result = selectUITestTarget(input, options); assert.ok(Object.isFrozen(result.target));
    assert.equal(JSON.stringify(input), before); assert.equal(JSON.stringify(options), beforeOptions);
    assert.throws(() => selectUITestTarget(input, { ...options, actualAppBundleIdentifier: 'dev.example.Other' }));
    assert.equal(JSON.stringify(input), before);
  }
});

test('inherited App identifier or expected options do not count as explicit caller evidence', () => {
  const options = Object.create(expected);
  assert.throws(() => selectUITestTarget(legacy(), options), /Expected BlueprintName/);
  const noActual = Object.assign(Object.create({ actualAppBundleIdentifier: expected.actualAppBundleIdentifier }), {
    expectedBlueprintName: expected.expectedBlueprintName, expectedBundleIdentifier: expected.expectedBundleIdentifier
  });
  assert.throws(() => selectUITestTarget(legacy(), noActual), /Actual App bundle identifier/);
});

test('an inherited format version does not count as an explicit metadata format', () => {
  const input = legacy(); Reflect.set(input, "__xctestrun_metadata__", Object.create({ FormatVersion: 1 }));
  assert.throws(() => selectUITestTarget(input, expected), /FormatVersion/);
});

test('an inherited UI role is not evidence that the selected target is a UI bundle', () => {
  const input = legacy(), target = input.AILibraryUITests; Reflect.deleteProperty(target, "IsUITestBundle");
  Object.setPrototypeOf(target, { IsUITestBundle: true });
  assert.throws(() => selectUITestTarget(input, expected), /UI test bundle/);
});

test('enabled configuration requires its own explicit TestTargets array', () => {
  const input = modern(); Reflect.set(input, "TestConfigurations", [Object.create({ TestTargets: modern().TestConfigurations[0].TestTargets })]);
  assert.throws(() => selectUITestTarget(input, expected), /TestTargets/);
});


/** @param {string} phase */
const phaseOptions = phase => ({ ...expected, testRoot: '/owned/Products', appPath: '/owned/Products/Debug-iphonesimulator/AILibrary.app', phase });

test('phase legacy keeps stock runner/test paths and other settings, prunes unit, and synchronizes only original App dependency entries', () => {
  const input = legacy(), target = input.AILibraryUITests;
  Reflect.set(target, "TestingEnvironmentVariables", { DYLD_LIBRARY_PATH: '__TESTROOT__/Debug-iphonesimulator' });
  Reflect.set(target, "DependentProductPaths", [target.UITargetAppPath, phaseOptions('failure').appPath, target.TestHostPath,
    '__TESTHOST__/PlugIns/AILibraryUITests.xctest', '/canonical/Framework.framework',
    target.UITargetAppPath + '/PlugIns/AILibraryTests.xctest', phaseOptions('failure').appPath + '/PlugIns/AILibraryTests.xctest']);
  frozen(input); const before = JSON.stringify(input);
  for (const phase of ['failure', 'restored']) {
  const result = phaseUITestRun(input, phaseOptions(phase)), t = objectFixture(result.metadata.AILibraryUITests);
  assert.deepEqual(Object.keys(result.metadata).sort(), ['AILibraryUITests', '__xctestrun_metadata__']);
  assert.equal(t.TestHostPath, target.TestHostPath); assert.equal(t.TestBundlePath, target.TestBundlePath);
  assert.equal(t.UITargetAppPath, '__TESTROOT__/owned-phase-apps/' + phase + '/AILibrary.app'); assert.equal(result.dependencyReplacements, 4);
  assert.deepEqual(t.DependentProductPaths, [t.UITargetAppPath, result.phaseApp, target.TestHostPath,
    '__TESTHOST__/PlugIns/AILibraryUITests.xctest', '/canonical/Framework.framework',
    t.UITargetAppPath + '/PlugIns/AILibraryTests.xctest', result.phaseApp + '/PlugIns/AILibraryTests.xctest']);
  assert.deepEqual(t.TestingEnvironmentVariables, target.TestingEnvironmentVariables); assert.equal(Object.hasOwn(t, 'UseDestinationArtifacts'), false);
  assert.equal(JSON.stringify(input), before);
  }
});

test('phase modern keeps selected configuration and metadata but F and R use distinct source paths with no original App reference', () => {
  const input = modern(); Reflect.set(input.TestConfigurations[0], "Setting", 'retain'); Reflect.set(input, "TestPlan", { Name: 'observed' });
  input.TestConfigurations.push({ IsEnabled: false, TestTargets: [ui()] }, { TestTargets: [unit()] });
  const f = phaseUITestRun(frozen(input), phaseOptions('failure')), r = phaseUITestRun(input, phaseOptions('restored'));
  assert.notEqual(f.phaseApp, r.phaseApp); assert.notEqual(f.phaseTargetPath, r.phaseTargetPath);
  const configurations = objectArrayFixture(r.metadata.TestConfigurations);
  assert.equal(configurations.length, 1); assert.equal(objectArrayFixture(configurations[0].TestTargets).length, 1);
  assert.equal(configurations[0].Setting, 'retain'); assert.deepEqual(r.metadata.TestPlan, input.TestPlan);
  const t = objectArrayFixture(configurations[0].TestTargets)[0]; assert.equal(t.UITargetAppBundleIdentifier, expected.expectedBundleIdentifier);
  assert.equal(t.TestHostPath, input.TestConfigurations[0].TestTargets[1].TestHostPath);
  assert.equal(JSON.stringify(r.metadata).includes('Debug-iphonesimulator/AILibrary.app'), false);
});

test('phase refuses residual original App references outside dependency products and malformed dependency arrays', () => {
  for (const mutate of /** @type {((t:ReturnType<typeof ui>)=>void)[]} */ ([t => { Reflect.set(t, "EnvironmentVariables", { unexpected: t.UITargetAppPath }); },
    t => { Reflect.set(t, "TestingEnvironmentVariables", { unexpected: t.UITargetAppPath + '/PlugIns/Other.xctest' }); },
    t => { Reflect.set(t, "DependentProductPaths", [t.UITargetAppPath + '-other/PlugIns/Other.xctest']); },
    t => { Reflect.set(t, "DependentProductPaths", 'not-array'); }, t => { Reflect.set(t, "DependentProductPaths", [null]); },
    ...['__TESTROOT__/Debug-iphonesimulator/../Debug-iphonesimulator/AILibrary.app',
      '__TESTROOT__/Debug-iphonesimulator/./AILibrary.app', '__UNKNOWN__/Other.app', 'relative/Other.app',
      '/canonical/../Other.app', '/canonical//Other.app'].map(value => /** @param {ReturnType<typeof ui>} t */ t => { Reflect.set(t, "DependentProductPaths", [value]); })])) {
    const input = legacy(); mutate(input.AILibraryUITests); assert.throws(() => phaseUITestRun(input, phaseOptions('failure')), /Residual|DependentProductPaths/);
  }
});

test('phase refuses unsupported destination mode, path escape, runner aliases, wrong identity and missing phase', () => {
  for (const changes of [{ UseDestinationArtifacts: true }, { UITargetAppPath: '__TESTROOT__/../Other.app' },
    { TestHostPath: ui().UITargetAppPath }, { TestBundlePath: '__TESTHOST__/../Other.xctest' }]) {
    const input = legacy(); Object.assign(input.AILibraryUITests, changes); assert.throws(() => phaseUITestRun(input, phaseOptions('failure')));
  }
  for (const options of [{ ...phaseOptions('failure'), phase: 'other' }, { ...phaseOptions('failure'), actualAppBundleIdentifier: 'dev.other.App' },
    { ...phaseOptions('failure'), testRoot: '/owned/Products/..' }]) assert.throws(() => phaseUITestRun(legacy(), options));
});

/** @param {import('node:crypto').BinaryLike} bytes */
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
/** @param {string} directory */
function freeGuard(directory) { const stat = fs.statfsSync(directory, { bigint: true }); assert.ok(stat.bavail * stat.bsize >= 734003200n, 'Fixture free-space floor'); }
/** @template T @param {string} directory @param {()=>T} action @returns {T} */
function mutateAt(directory, action) { freeGuard(directory); const value = action(); freeGuard(directory); return value; }
/** @param {string} directory @returns {import('../../ios/tests/xctestrun-metadata.mjs').InventoryFile[]} */
function inventory(directory) {
  /** @type {import('../../ios/tests/xctestrun-metadata.mjs').InventoryFile[]} */
  const rows = [];
  /** @param {string} current */
  function visit(current) { for (const name of fs.readdirSync(current).sort()) {
    const full = path.join(current, name), stat = fs.lstatSync(full);
    if (stat.isDirectory()) visit(full); else { const bytes = fs.readFileSync(full); rows.push({ path: path.relative(directory, full), bytes: bytes.length, mode: stat.mode & 0o777, sha256: sha(bytes) }); }
  } } visit(directory); return rows;
}
/** @param {(fixture:{root:string,products:string,app:string,stock:string,expected:ReturnType<typeof inventory>})=>void} action */
function appFixture(action) {
  const parent = process.env.AILIBRARY_PHASE_FIXTURE_ROOT ?? os.tmpdir();
  const root = mutateAt(parent, () => fs.mkdtempSync(path.join(parent, 'phase-source-')));
  const products = path.join(root, 'Products'), app = path.join(products, 'Debug-iphonesimulator/AILibrary.app');
  try {
    mutateAt(root, () => fs.mkdirSync(path.join(app, 'Content/articles'), { recursive: true, mode: 0o755 }));
    for (const [relative, bytes, mode] of /** @type {[string,string,number][]} */ ([['AILibrary', 'executable-v1', 0o755], ['Info.plist', 'immutable-info', 0o444],
      ['Content/articles/a.json', '{"a":1}\n', 0o644], ['Content/articles/b.json', '{"b":2}\n', 0o444]])) {
      mutateAt(root, () => fs.writeFileSync(path.join(app, relative), bytes, { flag: 'wx', mode }));
      mutateAt(root, () => fs.chmodSync(path.join(app, relative), mode));
    }
    mutateAt(root, () => fs.chmodSync(path.join(app, 'Content'), 0o750));
    const stock = path.join(products, 'stock.xctestrun'); mutateAt(root, () => fs.writeFileSync(stock, 'stock-runfile-v1', { flag: 'wx', mode: 0o444 }));
    action({ root, products, app, stock, expected: inventory(app) });
  } finally { mutateAt(parent, () => fs.rmSync(root, { recursive: true, force: true })); }
}

test('phase copies preserve baseline and stock, exact file/directory modes and independent F/R inodes', { skip: process.platform === 'win32' ? "The phase-copy contract requires POSIX absolute paths, modes and independent inodes" : false }, () => appFixture(({ root, products, app, stock, expected }) => {
  const stockBefore = fs.readFileSync(stock), f = mutateAt(root, () => copyPhaseApp(products, 'failure', expected, 'Content/articles/a.json'));
  const r = mutateAt(root, () => copyPhaseApp(products, 'restored', expected));
  assert.equal(fs.existsSync(path.join(f.destination, 'Content/articles/a.json')), false); assert.equal(fs.existsSync(path.join(r.destination, 'Content/articles/a.json')), true);
  assert.deepEqual(f.inventory, expected.filter(row => row.path !== 'Content/articles/a.json')); assert.deepEqual(r.inventory, expected);
  assert.equal(fs.statSync(path.join(f.destination, 'Content')).mode & 0o777, 0o750);
  assert.equal(fs.statSync(path.join(r.destination, 'Info.plist')).mode & 0o777, 0o444);
  for (const relative of ['AILibrary', 'Info.plist', 'Content/articles/b.json']) {
    const ids = [app, f.destination, r.destination].map(base => fs.statSync(path.join(base, relative), { bigint: true }));
    assert.equal(new Set(ids.map(stat => stat.dev + ':' + stat.ino)).size, 3); assert.equal(ids[1].nlink, 1n); assert.equal(ids[2].nlink, 1n);
  }
  mutateAt(root, () => fs.writeFileSync(path.join(f.destination, 'AILibrary'), 'F-only mutation'));
  assert.equal(fs.readFileSync(path.join(app, 'AILibrary'), 'utf8'), 'executable-v1'); assert.equal(fs.readFileSync(path.join(r.destination, 'AILibrary'), 'utf8'), 'executable-v1');
  assert.deepEqual(inventory(app), expected); assert.deepEqual(fs.readFileSync(stock), stockBefore);
}));

test('phase copies reject reuse and invalid omission without overwriting any existing baseline or copy', { skip: process.platform === 'win32' ? "The phase-copy contract requires POSIX absolute paths, modes and independent inodes" : false }, () => appFixture(({ root, products, app, expected }) => {
  const f = mutateAt(root, () => copyPhaseApp(products, 'failure', expected, 'Content/articles/a.json')), before = inventory(f.destination);
  assert.throws(() => mutateAt(root, () => copyPhaseApp(products, 'failure', expected, 'Content/articles/a.json')), /EEXIST/);
  assert.throws(() => copyPhaseApp(products, 'restored', expected, 'Content/articles/a.json'), /Only one/);
  assert.throws(() => copyPhaseApp(products, 'restored', expected, '../escape.json'), /Only one/);
  assert.deepEqual(inventory(app), expected); assert.deepEqual(inventory(f.destination), before);
}));

test('phase copies refuse source and destination-parent symlinks before copying outside the owned namespace', { skip: process.platform === 'win32' ? "The phase-copy contract requires POSIX absolute paths, modes and independent inodes" : false }, () => {
  appFixture(({ root, products, app, expected }) => {
    mutateAt(root, () => fs.symlinkSync(path.join(app, 'Info.plist'), path.join(app, 'linked')));
    assert.throws(() => copyPhaseApp(products, 'failure', expected)); assert.equal(fs.existsSync(path.join(products, 'owned-phase-apps')), false);
  });
  appFixture(({ root, products, expected }) => {
    const other = path.join(root, 'other'); mutateAt(root, () => fs.mkdirSync(other));
    mutateAt(root, () => fs.symlinkSync(other, path.join(products, 'owned-phase-apps')));
    assert.throws(() => copyPhaseApp(products, 'failure', expected)); assert.deepEqual(fs.readdirSync(other), []);
  });
});

test('phase copies refuse a changed baseline snapshot before creating a phase and keep stock bytes unchanged', { skip: process.platform === 'win32' ? "The phase-copy contract requires POSIX absolute paths, modes and independent inodes" : false }, () => appFixture(({ root, products, app, stock, expected }) => {
  mutateAt(root, () => fs.writeFileSync(path.join(app, 'AILibrary'), 'changed'));
  assert.throws(() => copyPhaseApp(products, 'failure', expected), /Baseline before copy/);
  assert.equal(fs.existsSync(path.join(products, 'owned-phase-apps')), false); assert.equal(fs.readFileSync(stock, 'utf8'), 'stock-runfile-v1');
}));
