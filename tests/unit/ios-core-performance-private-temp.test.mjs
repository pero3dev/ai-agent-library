import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, lstat, chmod, rm, rename, symlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createPrivateTempRoot, cleanupPrivateTempRoot, controlledChildEnvironment, runBounded } from '../../ios/tests/core-performance-runner.mjs';

const candidate = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const runnerURL = pathToFileURL(path.join(candidate, 'ios/tests/core-performance-runner.mjs')).href;
async function fixture(action) {
  const root = await mkdtemp(path.join(candidate, '.core-private-temp-test-'));
  try { return await action(root); } finally { await rm(root, { recursive: true, force: true }); }
}
async function absent(location) {
  try { await lstat(location); return false; } catch (error) { if (error.code === 'ENOENT') return true; throw error; }
}
function alive(pid) {
  try { process.kill(pid, 0); return true; } catch (error) { if (error.code === 'ESRCH') return false; throw error; }
}
async function waitFor(predicate, message, limit = 3000) {
  const deadline = Date.now() + limit;
  while (Date.now() < deadline) { if (await predicate()) return; await new Promise(resolve => setTimeout(resolve, 20)); }
  assert.fail(message);
}

test('controlled child gets only PATH/private TMPDIR, creates real private tempfile, and normal cleanup removes it', async () => {
  await fixture(async root => {
    const context = createPrivateTempRoot(root);
    const previousTMP = process.env.TMPDIR, previousSecret = process.env.ARTIFICIAL_CORE_SECRET;
    process.env.TMPDIR = path.join(root, 'operator-uncontrolled-tmp'); process.env.ARTIFICIAL_CORE_SECRET = 'parent-secret-must-not-pass';
    try {
      assert.equal((await lstat(context.root)).mode & 0o777, 0o700);
      assert.deepEqual(Object.keys(controlledChildEnvironment(context)).sort(), ['PATH', 'TMPDIR']);
      const child = `const fs=require('node:fs'),os=require('node:os'),path=require('node:path');const temp=fs.mkdtempSync(path.join(os.tmpdir(),'actual-child-'));fs.writeFileSync(path.join(temp,'payload'),'fixture');process.stdout.write(JSON.stringify({tmpdir:os.tmpdir(),temp,keys:Object.keys(process.env).sort(),secret:process.env.ARTIFICIAL_CORE_SECRET??null,home:process.env.HOME??null}));`;
      const value = JSON.parse((await runBounded(process.execPath, ['-e', child], { privateTempRoot: context, env: { ARTIFICIAL_CORE_SECRET: 'caller-secret-must-not-pass', HOME: '/uncontrolled-home' } })).stdout);
      assert.equal(value.tmpdir, context.root); assert(value.temp.startsWith(context.root + path.sep));
      // Darwin Node startup can add this runtime key after receiving the two-key
      // spawn environment. All other unexpected keys remain a failure.
      const runtimeKeys = process.platform === 'darwin' ? ['__CF_USER_TEXT_ENCODING'] : [];
      assert.deepEqual(value.keys.filter(key => !runtimeKeys.includes(key)), ['PATH', 'TMPDIR']);
      assert.equal(value.secret, null); assert.equal(value.home, null);
      assert.equal(await readFile(path.join(value.temp, 'payload'), 'utf8'), 'fixture');
      cleanupPrivateTempRoot(context); assert(await absent(context.root));
      assert(await absent(process.env.TMPDIR), 'Must not fall back to operator TMPDIR');
    } finally {
      if (previousTMP === undefined) delete process.env.TMPDIR; else process.env.TMPDIR = previousTMP;
      if (previousSecret === undefined) delete process.env.ARTIFICIAL_CORE_SECRET; else process.env.ARTIFICIAL_CORE_SECRET = previousSecret;
      if (!(await absent(context.root))) cleanupPrivateTempRoot(context);
    }
  });
});

test('relative/symlink/preexisting/forged/changed ownership contexts reject without fallback or substitute deletion', async () => {
  await fixture(async root => {
    assert.throws(() => createPrivateTempRoot('relative'), /absolute/);
    const linked = path.join(root, 'linked'); await symlink(root, linked);
    assert.throws(() => createPrivateTempRoot(linked), /boundary/);
    const parent = path.join(root, 'owner'); await mkdir(parent);
    const existing = path.join(parent, '.process-tmp'); await mkdir(existing); await writeFile(path.join(existing, 'sentinel'), 'keep');
    assert.throws(() => createPrivateTempRoot(parent), /EEXIST/); assert.equal(await readFile(path.join(existing, 'sentinel'), 'utf8'), 'keep');
    await rm(existing, { recursive: true });
    const context = createPrivateTempRoot(parent);
    assert.throws(() => runBounded(process.execPath, ['-e', 'process.exit(0)'], { privateTempRoot: { ...context } }), /Unregistered/);
    await chmod(context.root, 0o755);
    assert.throws(() => runBounded(process.execPath, [], { privateTempRoot: context }), /identity\/mode/);
    await chmod(context.root, 0o700);
    const moved = path.join(parent, 'owned-original'); await rename(context.root, moved); await mkdir(context.root, { mode: 0o700 });
    await writeFile(path.join(context.root, 'substitute'), 'keep replacement');
    assert.throws(() => cleanupPrivateTempRoot(context));
    assert.equal(await readFile(path.join(context.root, 'substitute'), 'utf8'), 'keep replacement');
    await rm(context.root, { recursive: true }); await rename(moved, context.root);
    const markerBytes = await readFile(context.marker); await rm(context.marker);
    const outside = path.join(root, 'outside-marker'); await writeFile(outside, markerBytes); await symlink(outside, context.marker);
    assert.throws(() => cleanupPrivateTempRoot(context), /marker/); assert.equal(await readFile(outside, 'utf8'), markerBytes.toString());
    await rm(context.marker); await writeFile(context.marker, markerBytes, { mode: 0o600 });
    cleanupPrivateTempRoot(context); assert(await absent(context.root));
  });
});

test('actual Node parent timeout path removes its owned private temp and terminated child', async () => {
  await fixture(async root => {
    const owner = path.join(root, 'owner'); await mkdir(owner); const marker = path.join(root, 'child.json');
    const childCode = `const fs=require('node:fs'),os=require('node:os'),path=require('node:path');fs.writeFileSync(path.join(os.tmpdir(),'timeout-payload'),'fixture');fs.writeFileSync(process.argv[1]+'.pending',JSON.stringify({pid:process.pid,tmp:os.tmpdir()}));fs.renameSync(process.argv[1]+'.pending',process.argv[1]);setInterval(()=>{},1000);`;
    // Advance only this isolated parent's timeout clock after the real child is
    // ready. A 150 ms wall-clock deadline could expire during Node startup under
    // parallel suite load, leaving no child witness. Real process creation,
    // process-group termination, close events, and private-temp cleanup remain live.
    const parentCode = `
      import assert from 'node:assert/strict';
      import { mock } from 'node:test';
      import { existsSync, readFileSync } from 'node:fs';
      import { createPrivateTempRoot, cleanupPrivateTempRoot, runBounded, installProcessCleanup } from ${JSON.stringify(runnerURL)};
      installProcessCleanup();
      const context = createPrivateTempRoot(process.argv[1]);
      mock.timers.enable({ apis: ['setTimeout'] });
      try {
        let settled = false;
        const outcome = runBounded(process.execPath, ['-e', ${JSON.stringify(childCode)}, process.argv[2]], { timeoutMs: 150, privateTempRoot: context })
          .then(value => { settled = true; return { value }; }, error => { settled = true; return { error }; });
        await new Promise((resolve, reject) => {
          const readinessDeadline = Date.now() + 3000;
          const poll = setInterval(() => {
            if (existsSync(process.argv[2])) { clearInterval(poll); resolve(); }
            else if (Date.now() >= readinessDeadline) { clearInterval(poll); reject(new Error('Private child did not start')); }
          }, 20);
        });
        const child = JSON.parse(readFileSync(process.argv[2], 'utf8'));
        assert.equal(child.tmp, context.root);
        assert.equal(readFileSync(context.root + '/timeout-payload', 'utf8'), 'fixture');
        process.kill(child.pid, 0);
        const killSpy = mock.method(process, 'kill'); // Default implementation calls through to the real OS signal.
        const timeoutKills = () => killSpy.mock.calls.filter(call => call.arguments[0] === -child.pid && call.arguments[1] === 'SIGKILL').length;
        mock.timers.tick(149);
        await Promise.resolve();
        assert.equal(timeoutKills(), 0, 'The 150 ms timeout must not signal its child group at 149 ms');
        assert.equal(settled, false, 'The 150 ms timeout must not fire at 149 ms');
        process.kill(child.pid, 0);
        mock.timers.tick(1);
        assert.equal(timeoutKills(), 1, 'The timeout must issue one real child-group SIGKILL at 150 ms');
        const result = await outcome;
        assert.equal(result.error?.message, 'Subprocess time limit exceeded');
        throw result.error;
      } finally {
        cleanupPrivateTempRoot(context);
        mock.timers.reset();
        mock.restoreAll();
      }
    `;
    let child;
    try {
      await assert.rejects(runBounded(process.execPath, ['--input-type=module', '-e', parentCode, owner, marker], { timeoutMs: 3000 }), error => {
        assert.match(error.message, /^Subprocess failed \(1\):/, 'The real outer watchdog must not be the timeout witness');
        assert.match(error.message, /Error: Subprocess time limit exceeded/);
        return true;
      });
      child = JSON.parse(await readFile(marker)); assert.equal(child.tmp, path.join(owner, '.process-tmp'));
      assert(await absent(child.tmp)); await waitFor(() => !alive(child.pid), 'Timeout child survived');
      assert((await lstat(owner)).isDirectory(), 'Only private temp was removed');
    } finally {
      // An outer watchdog/early assertion failure can kill the parent before its
      // synchronous exit hook runs. Reap only the child identified by this
      // fixture's atomically published marker before fixture() removes the root.
      if (!child && !(await absent(marker))) child = JSON.parse(await readFile(marker));
      if (child) {
        assert(Number.isSafeInteger(child.pid) && child.pid > 0, 'The fixture marker must identify one positive child PID');
        if (alive(child.pid)) {
          try { process.kill(process.platform === 'win32' ? child.pid : -child.pid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
          await waitFor(() => !alive(child.pid), 'Timeout fallback child survived');
        }
      }
    }
  });
});

for (const [ending, code] of [['SIGINT', 130], ['SIGTERM', 143], ['exit', 7]]) {
  test(`actual Node parent ${ending} cleans owned temp and child while unrelated paths/processes survive`, { timeout: 10000 }, async () => {
    await fixture(async root => {
      const owner = path.join(root, 'owner'); await mkdir(owner); const marker = path.join(root, 'child.json'), sentinel = path.join(root, 'sentinel'); await writeFile(sentinel, 'keep');
      const childCode = `const fs=require('node:fs'),os=require('node:os'),path=require('node:path');fs.writeFileSync(path.join(os.tmpdir(),'signal-payload'),'fixture');fs.writeFileSync(process.argv[1],JSON.stringify({pid:process.pid,tmp:os.tmpdir()}));setInterval(()=>{},1000);`;
      const parentCode = `import {createPrivateTempRoot,runBounded,installProcessCleanup} from ${JSON.stringify(runnerURL)};import{existsSync}from'node:fs';installProcessCleanup();const context=createPrivateTempRoot(process.argv[1]);${ending === 'exit' ? 'setInterval(()=>{if(existsSync(process.argv[2]))process.exit(7);},20);' : ''}await runBounded(process.execPath,['-e',${JSON.stringify(childCode)},process.argv[2]],{timeoutMs:20000,privateTempRoot:context});`;
      const control = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { stdio: 'ignore' });
      const controlClosed = new Promise(resolve => control.once('close', resolve));
      const parent = spawn(process.execPath, ['--input-type=module', '-e', parentCode, owner, marker], { stdio: 'ignore' });
      const parentClosed = new Promise((resolve, reject) => { parent.once('error', reject); parent.once('close', (exitCode, signal) => resolve({ code: exitCode, signal })); });
      let child;
      try {
        await waitFor(async () => { try { child = JSON.parse(await readFile(marker)); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } }, 'Private child did not start');
        if (ending !== 'exit') { assert(alive(child.pid)); assert(parent.kill(ending)); }
        const result = await Promise.race([parentClosed, new Promise((_, reject) => setTimeout(() => reject(new Error('Parent did not terminate')), 3000).unref())]);
        assert.deepEqual(result, { code, signal: null }); assert(await absent(child.tmp)); await waitFor(() => !alive(child.pid), 'Owned child survived');
        assert(alive(control.pid)); assert.equal(await readFile(sentinel, 'utf8'), 'keep'); assert((await lstat(owner)).isDirectory());
      } finally {
        if (parent.exitCode === null && parent.signalCode === null) parent.kill('SIGKILL');
        if (child && alive(child.pid)) { try { process.kill(-child.pid, 'SIGKILL'); } catch {} }
        control.kill('SIGKILL'); await Promise.all([parentClosed, controlClosed]);
      }
    });
  });
}
