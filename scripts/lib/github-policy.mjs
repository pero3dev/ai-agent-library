/** 必須チェックと実行元の共通正本。信頼する実装側から読み、候補 PR の設定を使わない。 */
const ci = Object.freeze({ path: '.github/workflows/ci.yml', event: 'pull_request' })
export const requiredWorkflows = Object.freeze({
  lint: ci,
  actionlint: ci,
  docs: ci,
  examples: ci,
  build: ci,
  'freshness-policy': Object.freeze({ path: '.github/workflows/freshness-policy.yml', event: 'pull_request_target', runName: 'Freshness policy PR #' }),
  harness: ci,
  'harness-windows': ci,
  'harness-policy': Object.freeze({ path: '.github/workflows/harness-policy.yml', event: 'pull_request_target', runName: 'Harness policy PR #' })
})
export const requiredChecks = Object.freeze(Object.keys(requiredWorkflows))

export function workflowFor(name) {
  if (!Object.hasOwn(requiredWorkflows, name)) throw new Error(`必須チェックの workflow 対応が未登録です: ${name}`)
  return requiredWorkflows[name]
}
