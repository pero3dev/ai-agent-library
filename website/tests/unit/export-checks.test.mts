import assert from 'node:assert/strict'
import test from 'node:test'
import { missingSectionLinks, skipTargetErrors } from '../../lib/export-checks.mjs'

test('skip navigation requires exactly one target, including error pages', () => {
  const link = '<a href="#nextra-skip-nav">Skip</a>'
  assert.equal(skipTargetErrors(`${link}<main>Page</main>`).length, 1)
  assert.deepEqual(skipTargetErrors(`${link}<main id="nextra-skip-nav" tabindex="-1">Page</main>`), [])
  assert.equal(skipTargetErrors(`${link}<main id="nextra-skip-nav"></main><div id="nextra-skip-nav"></div>`).length, 1)
})

test('section coverage checks route targets with the published base path', () => {
  const sections = [{ route: '/docs/overview' }, { route: '/docs/human-ai' }]
  const html = '<main><a href="/ai-agent-library/docs/overview">Overview</a></main>'
  assert.deepEqual(missingSectionLinks(html, sections, '/ai-agent-library'), ['/docs/human-ai'])
  assert.deepEqual(missingSectionLinks(`${html}<a href="/ai-agent-library/docs/human-ai/">Human AI</a>`, sections, '/ai-agent-library'), [])
})
