import assert from 'node:assert/strict';

const requests = new Map([
  ['runtimes', ['simctl', 'list', 'runtimes', '--json']],
  ['device-types', ['simctl', 'list', 'devicetypes', '--json']],
  ['devices-before-create', ['simctl', 'list', 'devices', '--json']],
  ['devices-after-boot', ['simctl', 'list', 'devices', '--json']],
]);

/** @param {unknown} value @param {string} name @returns {Record<string, unknown> & {stdout: string}} */
function receipt(value: unknown, name: string): Record<string, unknown> & { stdout: string } {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), name);
  const fields = (value as Record<string, unknown>);
  assert.ok(typeof fields.stdout === 'string', name);
  return { ...fields, stdout: fields.stdout };
}

/**
 * Repeat only an exact timed-out inventory read. The injected executor must keep
 * the original per-read cap and shared stage deadline, and retain each attempt
 * under the supplied distinct name. This helper never spawns or sets a budget.
 * The accepted attempt and its unchanged output are returned so later ownership
 * checks can verify the same successful raw read, including after a retry.
 */
/** @param {string} name @param {readonly string[]} args @param {(attempt: string) => unknown} execute */
export function readSimctlInventory(name: string, args: readonly string[], execute: (attempt: string) => unknown) {
  assert.ok(requests.has(name), 'Only the four inventory reads may repeat');
  assert.deepEqual(args, requests.get(name), name);
  assert.equal(typeof execute, 'function');

  let attempt = name;
  let result = receipt(execute(attempt), attempt);
  if (result.exit_code === null && result.signal === 'SIGKILL'
      && result.error === 'spawnSync xcrun ETIMEDOUT') {
    attempt = name + '-timeout-retry-1';
    result = receipt(execute(attempt), attempt);
  }

  assert.equal(result.error, null, attempt);
  assert.equal(result.signal, null, attempt);
  assert.equal(result.exit_code, 0, attempt);
  return { attempt, stdout: result.stdout };
}
