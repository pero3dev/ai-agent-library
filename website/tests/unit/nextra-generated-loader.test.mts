import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generatedContentLoaderSource } from '../../lib/nextra-generated-loader.mjs'

test('generated content adapter disables only Git date discovery while keeping compilation and non-Git diagnostics', () => {
  const source = generatedContentLoaderSource()
  assert.match(source, /const repository = undefined;/)
  assert.doesNotMatch(source, /Repository\.discover/)
  assert.match(source, /compileMetadata/); assert.match(source, /compileMdx/)
  assert.match(source, /Unable to find/)
  assert.match(source, /from "file:\/\//)
})
