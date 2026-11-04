import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const perCallLimit = 30000;
const pairLimit = 2 * perCallLimit;

const observedPOSIXTimeoutStderr = "An error was encountered processing the command (domain=NSPOSIXErrorDomain, code=60):\nThe operation couldn’t be completed. Operation timed out\nOperation timed out\n";

/** Seed the same controlled pre-UI canary twice at most; no other action retries. */
/**
 * @param {string} UUID
 * @param {Buffer} canary
 * @param {(name: string, destination: string, input: Buffer, timeout: number, acquirePermit: () => Readonly<{timeout_ms: number, remaining_ms: number}>) => unknown} execute
 * @param {() => number} [now]
 */
export function seedClipboardCanary(UUID: string, canary: Buffer, execute: (name: string, destination: string, input: Buffer, timeout: number, acquirePermit: () => Readonly<{ timeout_ms: number; remaining_ms: number }>) => unknown, now: () => number = () => performance.now()) {
  assert.match(UUID, /^[A-F0-9]{8}(?:-[A-F0-9]{4}){3}-[A-F0-9]{12}$/);
  assert.ok(Buffer.isBuffer(canary) && canary.length > 0 && canary.length <= 256);
  const text = canary.toString('utf8');
  const shape = /^AILibrary-code-copy-canary:[1-9][0-9]*:[1-9][0-9]*:[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\n$/.exec(text);
  assert.ok(shape && shape[0] === text, 'Only the exact controlled pre-UI canary bytes');
  assert.equal(typeof execute, 'function'); assert.equal(typeof now, 'function');

  // Strings are immutable; neither a callback nor a consumed stdin buffer can
  // change the bytes or destination used by the optional second attempt.
  const destination = UUID, inputHex = canary.toString('hex');
  const inputSHA256 = createHash('sha256').update(canary).digest('hex');
  const inputBytes = canary.length, started = now();
  assert.ok(Number.isFinite(started) && started >= 0);
  const deadline = started + pairLimit;
  assert.ok(Number.isFinite(deadline));
  let previous = started;
  const attempts = [];
  const readClock = () => {
    const value = now();
    assert.ok(Number.isFinite(value) && value >= previous, 'Monotonic seed clock');
    previous = value; return value;
  };

  for (const name of ['seed', 'seed-timeout-retry-1']) {
    const before = readClock();
    const plannedTimeout = Math.min(perCallLimit, Math.max(0, Math.floor(deadline - before)));
    assert.ok(plannedTimeout > 0, 'Canary seed allowance exhausted before another call');
    /** @type {Readonly<{timeout_ms: number, remaining_ms: number}> | null} */
    let permit: Readonly<{ timeout_ms: number; remaining_ms: number }> | null = null;
    const acquirePermit = () => {
      assert.equal(permit, null, 'One spawn permit per seed attempt');
      const checked = readClock(), remaining = Math.floor(deadline - checked);
      const timeout = Math.min(plannedTimeout, Math.max(0, remaining));
      assert.ok(timeout > 0, 'Canary seed allowance exhausted before spawn');
      permit = Object.freeze({ timeout_ms: timeout, remaining_ms: remaining });
      return permit;
    };
    const rawResult = execute(name, destination, Buffer.from(inputHex, 'hex'), plannedTimeout, acquirePermit);
    const after = readClock();
    // The synchronous callback acquires the captured permit; widen its type after that call.
    const acquired = (permit as Readonly<{timeout_ms: number, remaining_ms: number}> | null);
    assert.ok(acquired, 'Seed callback must acquire its spawn permit');
    assert.ok(rawResult && typeof rawResult === 'object' && !Array.isArray(rawResult), name);
    const result = (rawResult as Record<string, unknown>);
    assert.equal(result.spawned, true, name);
    assert.equal(result.planned_timeout_ms, plannedTimeout, name);
    assert.equal(result.actual_timeout_ms, acquired.timeout_ms, name);
    const receipt = { name, planned_timeout_ms: plannedTimeout, actual_timeout_ms: acquired.timeout_ms,
      exit_code: result.exit_code, signal: result.signal,
      error_code: result.error_code, error: result.error,
      stderr_text: typeof result.stderr_text === 'string' && result.stderr_text.length <= 512 ? result.stderr_text : null };
    attempts.push(receipt);
    assert.ok(after <= deadline, 'Canary seed allowance exhausted');

    const nodeTimeout = result.exit_code === null && result.signal === 'SIGKILL'
      && result.error_code === 'ETIMEDOUT' && result.error === 'spawnSync xcrun ETIMEDOUT';
    const observedPOSIXTimeout = result.exit_code === 60 && result.signal === null
      && result.error_code === null && result.error === null && result.stderr_text === observedPOSIXTimeoutStderr;
    if (name === 'seed' && (nodeTimeout || observedPOSIXTimeout)) continue;
    assert.equal(result.error, null, name); assert.equal(result.error_code, null, name);
    assert.equal(result.signal, null, name); assert.equal(result.exit_code, 0, name);
    return { status: 'controlled-canary-seeded', accepted_attempt: name, UUID: destination,
      input_bytes: inputBytes, input_SHA256: inputSHA256, attempts };
  }
  assert.fail('Canary seed did not succeed within the two permitted attempts');
}
