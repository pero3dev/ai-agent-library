import assert from 'node:assert/strict'
import test from 'node:test'
import { reviewerCommandAllowed } from '../../scripts/reviewer-command-guard.mjs'
const sha = 'a'.repeat(40)
test('reviewer allows immutable Git reads and independent digest calculation only', () => {
  for (const command of [`git show ${sha}:docs/01-concepts/agent-loop.md`, `git ls-tree -r --name-only ${sha}`, `node scripts/harness-policy.mjs --base ${sha} --head ${sha} --branch fix/review --print-digest`, `node scripts/freshness-policy.mjs --base ${sha} --head ${sha} --branch automation/freshness-run --print-digest`]) assert.equal(reviewerCommandAllowed(command), true, command)
  for (const command of ['git show HEAD:docs/a.md', 'git commit -m fix', `git show ${sha}:../secret`, `git show ${sha}:docs/a.md > out`, `git show ${sha}:docs/a.md; git push`, 'node scripts/harness-policy.mjs --help', `node scripts/harness-policy.mjs --base ${sha} --head ${sha} --branch fix/a --print-digest && npm test`, `git ls-tree -r --name-only ${sha}\nrm -rf x`]) assert.equal(reviewerCommandAllowed(command), false, command)
})
