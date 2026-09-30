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
// D1 extends this helper after the byte-identical C2 prefix. Proof data is never executed.
export function restoreC2ReleaseBodies(current, proof) {
  assert.equal(proof.schemaVersion, 1)
  assert.equal(proof.revision, 'D1-alignment')
  assert.equal(proof.predecessorManifestSHA256, 'caa2a618c84e6277b9fd6d60698765787a4667f4b73253fe26f86f6ec147544b')
  assert.deepEqual(proof.predecessorFiles.map(item => item.file), revised, 'Only the fixed three D1 entrypoints have reversal edits')
  assert.equal(hash(JSON.stringify(proof.priorCaseNames)), 'afcdab45db9d16af442aaeb284add5d6e952724e912e6f2b8eb6b46255550972', 'The ordered 91-case baseline changed')
  assert.equal(proof.priorCaseNamesSHA256, hash(JSON.stringify(proof.priorCaseNames)))
  assert.deepEqual(proof.controlMigration, {
    oldName: 'alignment-theory control: zero heavy figure or shared-frame chunks',
    newName: 'embeddings control: zero heavy figure or shared-frame chunks',
    oldRoute: '/docs/llm-internals/alignment-theory', newRoute: '/docs/implementation/embeddings', priorIndex: 89
  }, 'Only the explicit no-diagram control migration is allowed')
  const result = { ...current }
  for (const item of proof.predecessorFiles) {
    assert.equal(typeof current[item.file], 'string', 'Missing fixed predecessor input')
    let body = current[item.file]
    for (const edit of item.sourceEdits.toReversed()) {
      assert.equal(typeof edit.before, 'string'); assert.ok(edit.before.length > 0)
      assert.equal(typeof edit.after, 'string'); assert.ok(edit.after.length > 0)
      assert.equal(body.split(edit.after).length - 1, 1, 'A declared D1 replacement must occur exactly once')
      body = body.replace(edit.after, () => edit.before)
    }
    const historical = proof.historicalFiles.find(entry => entry.file === item.file)
    assert.ok(historical, 'Missing predecessor file inventory')
    assert.equal(item.previousSHA256, historical.sha256, 'Predecessor hash differs from historical inventory')
    assert.equal(hash(body), item.previousSHA256, `Release file changed beyond declared D1 additions: ${item.file}`)
    result[item.file] = body
  }
  for (const file of [...unchanged, 'pretraining-checks.mjs', 'c2-predecessor-proof.json']) {
    const historical = proof.historicalFiles.find(entry => entry.file === file)
    assert.ok(historical, 'Missing unchanged predecessor inventory')
    assert.equal(hash(current[file]), historical.sha256, `An unchanged regression module differs: ${file}`)
  }
  const prefix = current['predecessor-proof.mjs'].slice(0, current['predecessor-proof.mjs'].indexOf('// D1 extends this helper'))
  assert.equal(hash(prefix), 'e5ddfa8a35d527918654b683b59deb964380fd446d6da2564d3656bf665c2f39', 'The complete old C2 helper prefix is protected')
  result['predecessor-proof.mjs'] = prefix
  return result
}

export function restoreD1CaseNames(names, addedNames, proof) {
  assert.equal(names.length, 107); assert.equal(new Set(names).size, 107)
  assert.equal(addedNames.length, 16); assert.equal(new Set(addedNames).size, 16)
  const prior = names.filter(name => !addedNames.includes(name))
  assert.equal(prior.length, 91)
  assert.equal(prior.filter(name => name === proof.controlMigration.newName).length, 1)
  assert.equal(prior.filter(name => name === proof.controlMigration.oldName).length, 0)
  assert.equal(prior[89], proof.controlMigration.newName, 'Control retains its old relative position')
  assert.deepEqual(names.filter(name => addedNames.includes(name)), addedNames, 'All D1 cases remain in order')
  assert.equal(names.indexOf(addedNames[0]), 65, 'D1 follows C2 and precedes mandatory favicon')
  const restored = prior.map(name => name === proof.controlMigration.newName ? proof.controlMigration.oldName : name)
  assert.deepEqual(restored, proof.priorCaseNames, 'All prior 91 cases must be recovered by only the explicit control rename')
  return restored
}
