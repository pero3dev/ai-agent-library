import { array, object, objects, values, property, jsonObject, jsonArray, jsonValue, match, optionalMessage } from './contracts.mts'
type CommandRecord = { name?: string; label?: string; binary: string; arguments: string[]; exit_code: number | null; signal: NodeJS.Signals | null; error: unknown }
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { assertSigningDisabledBuildSettings } from '../../../ios/tests/archive-signing-settings.mjs';
const evidence = process.env.EVIDENCE_DIR!;
const archive = path.resolve('.local/ios-sdk27/AILibrary.xcarchive');
const app = path.join(archive, 'Products/Applications/AILibrary.app');
const commands: CommandRecord[] = [], findings: Record<string, unknown> = { schema_version: 1, status: 'incomplete', distribution_acceptance: 'unadopted' };
const put = (name: string, value: string | Uint8Array) => writeFileSync(path.join(evidence, name), value, { flag: 'wx', mode: 0o600 });
const json = (file: string) => jsonValue(readFileSync(file, 'utf8'));
const hash = (bytes: import('node:crypto').BinaryLike) => createHash('sha256').update(bytes).digest('hex');
const command = (label: string, binary: string, args: string[], allowFailure = false) => {
  const result = spawnSync(binary, args, { encoding: 'utf8', timeout: 120000, maxBuffer: 8 * 1024 * 1024 });
  put(label + '.stdout.log', result.stdout ?? ''); put(label + '.stderr.log', result.stderr ?? '');
  commands.push({ label, binary, arguments: args, exit_code: result.status, signal: result.signal, error: optionalMessage(result.error) ?? null });
  assert.equal(result.error, undefined, label);
  if (!allowFailure) assert.equal(result.status, 0, label);
  return result;
};
const text = (label: string, binary: string, args: string[]) => command(label, binary, args).stdout.trim();
const plist = (label: string, file: string) => jsonObject(text(label, '/usr/bin/plutil', ['-convert', 'json', '-o', '-', file]));
const version = (value: unknown) => {
  match(value, /^\d+(?:\.\d+){0,2}$/);
  return value.split('.').concat(['0', '0']).slice(0, 3).map(Number).join('.');
};
const UUIDs = (value: string) => {
  const rows = [...value.matchAll(/^UUID:\s+([A-Fa-f0-9-]{36})\s+\(([^)]+)\)\s+.+$/gm)]
    .map((match) => ({ architecture: match[2], uuid: match[1].toUpperCase() }));
  assert.equal(rows.length, 1); assert.equal(rows[0].architecture, 'arm64');
  match(rows[0].uuid, /^[A-F0-9]{8}(?:-[A-F0-9]{4}){3}-[A-F0-9]{12}$/);
  return rows;
};
try {
  const runtime = json(path.join(evidence, 'toolchain.json')); object(runtime);
  findings.toolchain = runtime;
  const expected = Number(process.env.PUBLISHED_ARTICLE_COUNT);
  assert.ok(Number.isInteger(expected) && expected >= 4 && expected <= 2000);
  const sources = json(path.join(evidence, 'published-sources.json')); object(sources);
  assert.equal(sources.articles, expected);
  const sourceAudit = json(path.join(evidence, 'published-source-audit.json')); object(sourceAudit);
  assert.equal(sourceAudit.result, 'passed'); assert.equal(sourceAudit.profile, 'published-library');
  array(sourceAudit.articles); assert.equal(sourceAudit.articles.length, expected);
  const packageAudit = json(path.join(evidence, 'release-package.json')); object(packageAudit);
  const consumerAudit = json(path.join(evidence, 'archive-consumer.json')); object(consumerAudit);
  for (const audit of [packageAudit, consumerAudit]) {
    assert.equal(audit.status, 'passed'); assert.equal(audit.articles, expected);
  }
  const applications = path.join(archive, 'Products/Applications');
  assert.ok(lstatSync(applications).isDirectory());
  assert.deepEqual(readdirSync(applications).sort(), ['AILibrary.app']);
  assert.ok(lstatSync(app).isDirectory());
  const settings = objects(values(json(path.join(evidence, 'release-build-settings.json'))).filter((value) => property(value, 'target') === 'AILibrary'));
  assert.equal(settings.length, 1);
  const build = settings[0].buildSettings; object(build);
  assert.equal(build.CONFIGURATION, 'Release');
  assert.equal(version(build.IPHONEOS_DEPLOYMENT_TARGET), '17.0.0');
  assert.equal(build.ENABLE_USER_SCRIPT_SANDBOXING, 'YES');
  assert.equal(build.DEBUG_INFORMATION_FORMAT, 'dwarf-with-dsym');
  assertSigningDisabledBuildSettings(build);
  const info = plist('app-info', path.join(app, 'Info.plist'));
  put('archive-application-properties.plist', text('archive-info-properties', '/usr/bin/plutil',
    ['-extract', 'ApplicationProperties', 'xml1', '-o', '-', path.join(archive, 'Info.plist')]));
  const archiveProperties = plist('archive-info', path.join(evidence, 'archive-application-properties.plist'));
  assert.equal(info.CFBundleIdentifier, build.PRODUCT_BUNDLE_IDENTIFIER);
  assert.equal(info.CFBundleShortVersionString, build.MARKETING_VERSION);
  assert.equal(info.CFBundleVersion, build.CURRENT_PROJECT_VERSION);
  assert.equal(info.CFBundleExecutable, 'AILibrary'); assert.equal(info.CFBundlePackageType, 'APPL');
  assert.equal(info.LSRequiresIPhoneOS, true); assert.deepEqual(info.UIDeviceFamily, [1]);
  assert.deepEqual(info.CFBundleSupportedPlatforms, ['iPhoneOS']);
  assert.equal(info.DTPlatformName, 'iphoneos'); assert.equal(info.DTSDKName, 'iphoneos' + runtime.sdk);
  assert.equal(info.DTSDKBuild, runtime.sdk_build); assert.equal(info.DTXcodeBuild, runtime.xcode_build);
  assert.equal(version(info.MinimumOSVersion), '17.0.0');
  assert.ok(archiveProperties !== null && typeof archiveProperties === 'object' && !Array.isArray(archiveProperties),
    'Archive ApplicationProperties must be an object');
  assert.equal(archiveProperties.ApplicationPath, 'Applications/AILibrary.app');
  assert.equal(archiveProperties.CFBundleIdentifier, info.CFBundleIdentifier);
  assert.equal(archiveProperties.CFBundleShortVersionString, info.CFBundleShortVersionString);
  assert.equal(archiveProperties.CFBundleVersion, info.CFBundleVersion);
  const privacy = plist('app-privacy', path.join(app, 'PrivacyInfo.xcprivacy'));
  const sourcePrivacy = plist('source-privacy', 'ios/AILibrary/PrivacyInfo.xcprivacy');
  assert.deepEqual(privacy, sourcePrivacy);
  assert.equal(privacy.NSPrivacyTracking, false);
  assert.deepEqual(privacy.NSPrivacyCollectedDataTypes, []); assert.deepEqual(privacy.NSPrivacyTrackingDomains, []);
  const manifest = json(path.join(app, 'Content/manifest.json')); object(manifest);
  assert.deepEqual(objects(manifest.articles).map((article) => article.source_path), sources.source_paths);
  object(manifest.files);
  const licenses = ['assets/licenses/NOTICE.txt', 'assets/katex/LICENSE.txt', 'assets/licenses/Mermaid-LICENSE.txt'];
  for (const relative of licenses) {
    assert.ok(Object.hasOwn(manifest.files, relative));
    const actual = readFileSync(path.join(app, 'Content', relative));
    assert.ok(actual.length > 0); assert.equal(hash(actual), manifest.files[relative]);
    assert.deepEqual(actual, readFileSync(path.join('ios/AILibrary/Content', relative)));
  }
  assert.deepEqual(readFileSync(path.join(app, 'Content/assets/licenses/NOTICE.txt')), readFileSync('LICENSE'));
  const inventory: { path: string; bytes: number; sha256: string }[] = [];
  const walk = (directory: string, prefix = '') => {
    for (const name of readdirSync(directory).sort()) {
      assert.notEqual(name, 'TestContent', 'Debug fixtures must not be archived');
      assert.notEqual(name, 'embedded.mobileprovision', 'No provisioning profile is allowed');
      assert.ok(!name.endsWith('.xctest'), 'No test bundle is allowed');
      const file = path.join(directory, name), relative = prefix + name, stat = lstatSync(file);
      assert.ok(!stat.isSymbolicLink(), 'No symlinks in the app inventory');
      if (stat.isDirectory()) walk(file, relative + '/');
      else {
        assert.ok(stat.isFile());
        const bytes = readFileSync(file);
        inventory.push({ path: relative, bytes: bytes.length, sha256: hash(bytes) });
      }
    }
  };
  walk(app); assert.ok(inventory.length > 0);
  put('app-file-inventory.json', JSON.stringify({ files: inventory, file_count: inventory.length,
    bytes: inventory.reduce((sum, file) => sum + file.bytes, 0) }, null, 2) + '\n');
  const executable = path.join(app, info.CFBundleExecutable);
  assert.ok(lstatSync(executable).isFile());
  const architectures = text('binary-architectures', 'xcrun', ['lipo', '-archs', executable]).split(/\s+/);
  assert.deepEqual(architectures, ['arm64']);
  const loads = text('binary-load-commands', 'xcrun', ['otool', '-l', executable]);
  const builds = loads.split(/(?=^Load command \d+\s*$)/m).filter((block) => /^\s*cmd LC_BUILD_VERSION\s*$/m.test(block));
  assert.equal(builds.length, 1, 'The device binary must have one LC_BUILD_VERSION');
  const field = (name: string) => {
    const matches = [...builds[0].matchAll(new RegExp('^\\s*' + name + '\\s+(\\S+)\\s*$', 'gm'))];
    assert.equal(matches.length, 1, name); return matches[0][1];
  };
  assert.equal(field('platform'), '2', 'Mach-O PLATFORM_IOS is the device platform');
  assert.equal(version(field('minos')), '17.0.0'); assert.equal(version(field('sdk')), version(runtime.sdk));
  const dwarf = path.join(archive, 'dSYMs/AILibrary.app.dSYM/Contents/Resources/DWARF/AILibrary');
  assert.ok(lstatSync(dwarf).isFile());
  assert.deepEqual(text('dsym-architectures', 'xcrun', ['lipo', '-archs', dwarf]).split(/\s+/), architectures);
  const binaryUUIDs = UUIDs(text('binary-UUID', 'xcrun', ['dwarfdump', '--uuid', executable]));
  const symbolUUIDs = UUIDs(text('dsym-UUID', 'xcrun', ['dwarfdump', '--uuid', dwarf]));
  assert.deepEqual(symbolUUIDs, binaryUUIDs);
  const signature = command('codesign-inspection', '/usr/bin/codesign', ['-d', '--verbose=4', app], true);
  const signatureText = signature.stdout + '\n' + signature.stderr;
  let signatureState;
  if (signature.status === 1 && /code object is not signed at all/.test(signatureText)) signatureState = 'unsigned';
  else if (signature.status === 0 && /^Signature=adhoc\s*$/m.test(signatureText)
    && /^TeamIdentifier=not set\s*$/m.test(signatureText) && !/^Authority=/m.test(signatureText)) signatureState = 'ad-hoc-without-team';
  else throw new Error('Unexpected signing identity or unreadable signature; inspect retained raw output');
  Object.assign(findings, {
    status: 'passed', source_head: runtime.source_head, source_tree: runtime.source_tree,
    app: { version: info.CFBundleShortVersionString, build: info.CFBundleVersion, bundle_id: info.CFBundleIdentifier,
      minimum_OS: info.MinimumOSVersion, DTSDKName: info.DTSDKName, DTSDKBuild: info.DTSDKBuild,
      DTXcode: info.DTXcode, DTXcodeBuild: info.DTXcodeBuild, architectures },
    content: { articles: expected, revision: manifest.revision, verified_files: packageAudit.verified_files,
      verified_bytes: packageAudit.verified_bytes, license_files: licenses },
    app_inventory: { files: inventory.length, bytes: inventory.reduce((sum, file) => sum + file.bytes, 0),
      file: 'app-file-inventory.json', sha256: hash(readFileSync(path.join(evidence, 'app-file-inventory.json'))) },
    privacy: { source_semantics_match: true, actual_sha256: hash(readFileSync(path.join(app, 'PrivacyInfo.xcprivacy'))),
      source_sha256: hash(readFileSync('ios/AILibrary/PrivacyInfo.xcprivacy')), legal_acceptance: 'unadopted' },
    build_version: { platform: 2, minos: field('minos'), sdk: field('sdk') }, dSYM_UUIDs: symbolUUIDs,
    signature_inspection: { state: signatureState, exit_code: signature.status,
      credentialed_signing_or_provisioning_requested: false, provisioning_profile_present: false },
    limits: ['No signed export/IPA/upload or distribution acceptance', 'No Simulator or device launch in this archive job',
      'No minimum-iOS17 runtime, UI, VoiceOver or performance acceptance', 'Hosted images roll forward; toolchain presence is asserted']
  });
} catch (error) { findings.status = 'failed'; findings.error = String(optionalMessage(error)); process.exitCode = 1; }
finally {
  put('archive-audit-commands.json', JSON.stringify(commands, null, 2) + '\n');
  put('archive-audit.json', JSON.stringify(findings, null, 2) + '\n');
  console.log(JSON.stringify(findings, null, 2));
}
