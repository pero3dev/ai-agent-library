import assert from 'node:assert/strict';

const emptyCredentialFields = [
  'CODE_SIGN_IDENTITY',
  'DEVELOPMENT_TEAM',
  'EXPANDED_CODE_SIGN_IDENTITY',
  'EXPANDED_CODE_SIGN_IDENTITY_NAME',
  'PROVISIONING_PROFILE',
  'PROVISIONING_PROFILE_SPECIFIER',
];

// Xcode omits unset signing credentials from -showBuildSettings -json.
// The suppression flags must still be reported explicitly; absence is not NO.
export function assertSigningDisabledBuildSettings(settings) {
  assert.ok(settings !== null && typeof settings === 'object' && !Array.isArray(settings)
    && [Object.prototype, null].includes(Object.getPrototypeOf(settings)), 'Build settings must be a JSON object');
  for (const field of ['CODE_SIGNING_ALLOWED', 'CODE_SIGNING_REQUIRED']) {
    assert.ok(Object.hasOwn(settings, field), `${field} must be reported explicitly`);
    assert.equal(settings[field], 'NO', `${field} must equal NO`);
  }
  for (const field of emptyCredentialFields) {
    if (Object.hasOwn(settings, field)) {
      assert.ok(settings[field] === '', `${field} must be absent or an empty string`);
    }
  }
}
