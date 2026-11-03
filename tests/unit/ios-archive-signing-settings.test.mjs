import assert from 'node:assert/strict';
import test from 'node:test';
import { assertSigningDisabledBuildSettings } from '../../ios/tests/archive-signing-settings.mjs';

// Signing-related projection of the first actual Xcode 26.6 / SDK 26.5 output.
// Blank identity/team/profile fields were omitted, while platform metadata stayed.
const observedSettings = {
  CODE_SIGNING_ALLOWED: 'NO',
  CODE_SIGNING_REQUIRED: 'NO',
  CODE_SIGN_STYLE: 'Automatic',
  PROVISIONING_PROFILE_REQUIRED: 'YES',
  PROVISIONING_PROFILE_SUPPORTED: 'YES',
};
const credentialFields = [
  'CODE_SIGN_IDENTITY', 'DEVELOPMENT_TEAM', 'EXPANDED_CODE_SIGN_IDENTITY',
  'EXPANDED_CODE_SIGN_IDENTITY_NAME', 'PROVISIONING_PROFILE', 'PROVISIONING_PROFILE_SPECIFIER',
];

test('accepts actual Xcode signing-disabled output with omitted empty credential fields', () => {
  assert.doesNotThrow(() => assertSigningDisabledBuildSettings(observedSettings));
});

test('accepts only empty strings when optional signing credential fields are present', () => {
  const explicit = { ...observedSettings, ...Object.fromEntries(credentialFields.map(field => [field, ''])) };
  assert.doesNotThrow(() => assertSigningDisabledBuildSettings(explicit));
  delete explicit.CODE_SIGN_IDENTITY;
  delete explicit.PROVISIONING_PROFILE;
  assert.doesNotThrow(() => assertSigningDisabledBuildSettings(explicit));
});

test('requires both signing suppression flags rather than treating missing as disabled', () => {
  for (const field of ['CODE_SIGNING_ALLOWED', 'CODE_SIGNING_REQUIRED']) {
    const missing = { ...observedSettings };
    delete missing[field];
    assert.throws(() => assertSigningDisabledBuildSettings(missing), new RegExp(field));
  }
  assert.throws(() => assertSigningDisabledBuildSettings({}), /CODE_SIGNING_ALLOWED/);
});

test('rejects enabled, blank and wrongly typed signing suppression flags', () => {
  for (const field of ['CODE_SIGNING_ALLOWED', 'CODE_SIGNING_REQUIRED']) {
    for (const value of ['YES', '', 'NO ', 'no', undefined, null, false, 0, [], {}]) {
      assert.throws(() => assertSigningDisabledBuildSettings({ ...observedSettings, [field]: value }), new RegExp(field));
    }
  }
});

test('rejects credentials and every present non-string or null credential value', () => {
  for (const field of credentialFields) {
    for (const value of ['Apple Development: Example', 'TEAM12345', 'profile-uuid', ' ', undefined, null, false, 0, [], {}]) {
      assert.throws(() => assertSigningDisabledBuildSettings({ ...observedSettings, [field]: value }), new RegExp(field));
    }
  }
});

test('rejects non-object settings and inherited credentials instead of silently treating them as absent', () => {
  for (const value of [undefined, null, [], '', 0, false, Object.create({ DEVELOPMENT_TEAM: 'TEAM12345' })]) {
    assert.throws(() => assertSigningDisabledBuildSettings(value), /Build settings must be a JSON object/);
  }
});

test('does not insert default values or change the original settings evidence', () => {
  const settings = Object.freeze({ ...observedSettings, DEVELOPMENT_TEAM: '', UNRELATED_SETTING: 'retained' });
  const before = { ...settings };
  assertSigningDisabledBuildSettings(settings);
  assert.deepEqual(settings, before);
  assert.equal(Object.hasOwn(settings, 'CODE_SIGN_IDENTITY'), false);
});
