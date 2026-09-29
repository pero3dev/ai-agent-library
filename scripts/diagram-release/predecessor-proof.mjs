import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

const hash = text => createHash('sha256').update(text).digest('hex')
const revised = ['extract-ci-html.mjs', 'collect-deployment.ps1', 'verify-public.mjs']
const unchanged = ['inference-checks.mjs', 'foundations-checks.mjs', 'training-checks.mjs', 'known-site-observations.mjs', 'portable-paths.mjs']

// One fixed, flat revision. No code from the proof is evaluated and no paths are opened here.
export function restoreC1ReleaseBodies(current, proof) {
  assert.equal(proof.schemaVersion, 1)
  assert.equal(proof.revision, 'C2-pretraining')
  assert.equal(proof.predecessorManifestSHA256, '4359f9abf06785671e980686f89e596eb8c0d8cd1842fc3480712941a3b40507')
  assert.deepEqual(proof.predecessorFiles.map(item => item.file), revised, 'Only the fixed three C2 entrypoints have reversal edits')
  assert.equal(hash(JSON.stringify(proof.priorCaseNames)), '82b7e9d9f2964b0e2a8771792683357603ec450a37de522b4c8b9ab8f5ca1092', 'The ordered 71-case baseline changed')
  assert.equal(proof.priorCaseNamesSHA256, hash(JSON.stringify(proof.priorCaseNames)))
  const result = { ...current }
  for (const item of proof.predecessorFiles) {
    assert.equal(typeof current[item.file], 'string', 'Missing fixed predecessor input')
    let body = current[item.file]
    for (const edit of item.sourceEdits.toReversed()) {
      assert.equal(typeof edit.before, 'string'); assert.ok(edit.before.length > 0)
      assert.equal(typeof edit.after, 'string'); assert.ok(edit.after.length > 0)
      assert.equal(body.split(edit.after).length - 1, 1, 'A declared C2 replacement must occur exactly once')
      // before may be a substring of an additive after; restore the full declared span.
      body = body.replace(edit.after, () => edit.before)
    }
    const historical = proof.historicalFiles.find(entry => entry.file === item.file)
    assert.ok(historical, 'Missing predecessor file inventory')
    assert.equal(item.previousSHA256, historical.sha256, 'Predecessor hash differs from historical inventory')
    assert.equal(hash(body), item.previousSHA256, `Release file changed beyond declared C2 additions: ${item.file}`)
    result[item.file] = body
  }
  for (const file of unchanged) {
    const historical = proof.historicalFiles.find(entry => entry.file === file)
    assert.ok(historical, 'Missing unchanged predecessor inventory')
    assert.equal(hash(current[file]), historical.sha256, `An unchanged regression module differs: ${file}`)
  }
  return result
}
