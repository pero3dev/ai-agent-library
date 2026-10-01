import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath)
  .use(remarkFrontmatter, ['yaml']).use(remarkMdx)

const readingStages = {
  'legacy-observation-draft': 5,
  'legacy-measure-migrate': 5,
  'maintenance-hypothesis-change': 5,
  'maintenance-production-boundary': 5,
  'enterprise-constraints-topology': 5,
  'enterprise-contract-route': 5,
  'claude-practice-mechanisms': 5,
  'claude-practice-context-cache': 6,
  'claude-practice-automation-quality': 5,
  'codex-practice-surfaces-config': 5,
  'codex-practice-budget-context': 5,
  'codex-practice-automation-quality': 6,
  'copilot-practice-functions-config': 5,
  'copilot-practice-budget-cache': 5,
  'copilot-practice-automation': 4,
  'copilot-surfaces-flow': 5,
  'copilot-policy-boundaries': 5,
  'copilot-adoption-budget': 5,
  'oss-freedom-responsibility': 4,
  'oss-evaluation-controls': 5,
  'comparison-matrix-meaning': 4,
  'comparison-contract-use': 4,
  'se-common-principles': 3,
  'se-v-model-map': 5,
  'se-upstream-review': 4,
  'se-document-delivery': 4,
  'se-test-design-generation': 4,
  'se-test-oracle-evidence': 4,
  'cursor-runtime-data': 5,
  'cursor-rules-security': 5,
  'cursor-connections-adoption': 5,
  'windsurf-runtime-migration': 5,
  'windsurf-rules-security': 5,
  'windsurf-connections-adoption': 4,
  'devin-delegation-runtime': 5,
  'devin-teaching-security': 5,
  'devin-connections-adoption': 5,
  'claude-surfaces-runtime': 5,
  'claude-config-permission': 5,
  'claude-integrations-adoption': 5,
  'codex-surfaces-runtime': 5,
  'codex-config-permission': 6,
  'codex-integrations-adoption': 5,
  'google-products-runtime': 5,
  'google-config-data': 6,
  'google-integrations-adoption': 5,
  'coding-team-rollout': 5,
  'coding-team-review': 4,
  'coding-team-governance': 4,
  'coding-evaluation-experiment': 5,
  'coding-evaluation-effects': 4,
  'coding-cost-consumption': 5,
  'coding-cost-context': 5,
  'coding-cost-limits': 4,
  'coding-rules-content': 5, 'coding-rules-scope-maintenance': 5,
  'coding-security-threat-paths': 5, 'coding-security-permission-modes': 5, 'coding-security-defense-audit': 5,
  'coding-automation-task-design': 5, 'coding-automation-runtime-recovery': 6,
  'coding-support-forms': 5, 'coding-trigger-execution-map': 4, 'coding-autonomy-learning': 3,
  'coding-selection-constraints': 5, 'coding-selection-trial': 4, 'coding-request-contract': 4, 'coding-request-verification-recovery': 4,
  'durable-resume-design': 5, 'durable-side-effect-contract': 5, 'durable-wait-and-progress': 6,
  'tenant-data-and-settings': 6, 'tenant-capacity-and-cost': 6,
  'agent-api-job-states': 6, 'agent-api-events-and-idempotency': 6, 'agent-api-change-and-metering': 5,
  'harness-system-boundaries': 5, 'harness-environment-evolution': 5, 'loop-type-and-stopping': 5, 'loop-replanning-recovery': 6,
  'orchestration-basics': 6, 'orchestration-composition': 5, 'human-intervention-positions': 6, 'human-approval-lifecycle': 5, 'error-layer-routing': 5, 'retry-and-recovery-boundaries': 6,
  'context-input-design': 6, 'context-cycle-retrieval': 5, 'context-layout-budget': 6, 'context-information-design': 7, 'context-compaction-design': 5, 'context-trust-restart': 6,
  'learning-section-map': 5, 'learning-practice-loop': 3, 'skill-development': 6, 'information-evidence': 5, 'information-maintenance': 4,
  'screen-observation': 6, 'screen-boundaries': 6, 'loop-stop-reasons': 6, 'loop-runtime': 5,
  'multimodal-representation': 5,
  'multimodal-input-tradeoffs': 4,
  'capabilities-assessment': 5,
  'interpretability-evidence': 5,
  'interpretability-sae': 4,
  'icl-hypotheses': 5,
  'icl-demonstrations': 3,
  'icl-memory-evaluation': 5,
  'context-causal-cost': 5,
  'context-cache-quality': 6,
  'reasoning-sequence': 4,
  'reasoning-evaluation': 5,
  'alignment-preference': 7,
  'alignment-reward-risk': 3,
  'alignment-feedback': 5,
  'pretraining-loss-perplexity': 5,
  'pretraining-scaling': 6,
  'pretraining-data': 4,
  'pretraining-metrics': 4,
  'pretraining-compute': 4,
  'training-stages': 6, 'training-runtime-boundary': 4,
  'inference-sampling': 7, 'inference-cache-batching': 6, 'inference-speculative': 6, 'inference-quantization': 4,
  'generation-token-loop': 8, 'tokenization-counting': 7,
  'moe-routing-load': 8, 'moe-parameters-communication': 6,
  'ai-design-lineage': 8, 'world-model-usages': 6, 'world-model-evidence': 4, 'physical-ai-boundaries': 7, 'physical-ai-evidence': 6,
  'planning-patterns': 5, 'planning-maintenance': 6, 'retrieval-paths': 5, 'retrieval-choice': 5, 'delegation-boundaries': 7, 'delegation-patterns': 5,
  'agent-components': 5, 'agent-autonomy': 6, 'tool-execution': 7, 'tool-contract': 6, 'memory-layers': 5, 'memory-lifecycle': 7,
  'agent-loop': 5, 'workflow-comparison': 5,
  'transformer-io': 4, 'transformer-position': 4, 'transformer-block': 9,
  'attention-kv-sharing': 5, 'attention-compute-memory': 6, 'attention-context-range': 4
}
const walkthroughs = new Set(['SeContinuityWalkthrough', 'CodingPracticeWalkthrough', 'CodingOptionsWalkthrough', 'SeProcessWalkthrough', 'CodingIdeCloudWalkthrough', 'CodingProductsWalkthrough', 'CodingOutcomesWalkthrough', 'CodingControlsWalkthrough', 'CodingDecisionsWalkthrough', 'DurableContractWalkthrough', 'HarnessLoopWalkthrough', 'ActionBoundariesWalkthrough', 'ContextDesignWalkthrough', 'OverviewReadingWalkthrough', 'AgentConceptsWalkthrough', 'AttentionWalkthrough', 'ReadingWalkthrough', 'TransformerWalkthrough', 'AttentionVariantsWalkthrough', 'MoEWalkthrough', 'FoundationsWalkthrough', 'InferenceWalkthrough', 'TrainingWalkthrough', 'PretrainingWalkthrough', 'AlignmentWalkthrough', 'ReasoningWalkthrough', 'ContextWalkthrough', 'IclWalkthrough', 'InterpretabilityWalkthrough', 'CapabilitiesWalkthrough', 'MultimodalWalkthrough'])

// sync が装飾として挿入する props だけを許可する。コンポーネント名だけでは、
// 属性式や {...spread} を経由したビルド時の JavaScript 実行を防げない。
const attributes = {
  SeContinuityWalkthrough: { diagramId: value => ["legacy-observation-draft","legacy-measure-migrate","maintenance-hypothesis-change","maintenance-production-boundary","enterprise-constraints-topology","enterprise-contract-route"].includes(value) },
  CodingPracticeWalkthrough: { diagramId: value => ["claude-practice-mechanisms","claude-practice-context-cache","claude-practice-automation-quality","codex-practice-surfaces-config","codex-practice-budget-context","codex-practice-automation-quality","copilot-practice-functions-config","copilot-practice-budget-cache","copilot-practice-automation"].includes(value) },
  CodingOptionsWalkthrough: { diagramId: value => ["copilot-surfaces-flow","copilot-policy-boundaries","copilot-adoption-budget","oss-freedom-responsibility","oss-evaluation-controls","comparison-matrix-meaning","comparison-contract-use"].includes(value) },
  SeProcessWalkthrough: { diagramId: value => ["se-common-principles","se-v-model-map","se-upstream-review","se-document-delivery","se-test-design-generation","se-test-oracle-evidence"].includes(value) },
  CodingIdeCloudWalkthrough: { diagramId: value => ["cursor-runtime-data","cursor-rules-security","cursor-connections-adoption","windsurf-runtime-migration","windsurf-rules-security","windsurf-connections-adoption","devin-delegation-runtime","devin-teaching-security","devin-connections-adoption"].includes(value) },
  CodingProductsWalkthrough: { diagramId: value => ["claude-surfaces-runtime","claude-config-permission","claude-integrations-adoption","codex-surfaces-runtime","codex-config-permission","codex-integrations-adoption","google-products-runtime","google-config-data","google-integrations-adoption"].includes(value) },
  CodingOutcomesWalkthrough: { diagramId: value => ["coding-team-rollout","coding-team-review","coding-team-governance","coding-evaluation-experiment","coding-evaluation-effects","coding-cost-consumption","coding-cost-context","coding-cost-limits"].includes(value) },
  CodingControlsWalkthrough: { diagramId: value => ["coding-rules-content","coding-rules-scope-maintenance","coding-security-threat-paths","coding-security-permission-modes","coding-security-defense-audit","coding-automation-task-design","coding-automation-runtime-recovery"].includes(value) },
  CodingDecisionsWalkthrough: { diagramId: value => ['coding-support-forms', 'coding-trigger-execution-map', 'coding-autonomy-learning', 'coding-selection-constraints', 'coding-selection-trial', 'coding-request-contract', 'coding-request-verification-recovery'].includes(value) },
  DurableContractWalkthrough: { diagramId: value => ['durable-resume-design', 'durable-side-effect-contract', 'durable-wait-and-progress', 'tenant-data-and-settings', 'tenant-capacity-and-cost', 'agent-api-job-states', 'agent-api-events-and-idempotency', 'agent-api-change-and-metering'].includes(value) },
  HarnessLoopWalkthrough: { diagramId: value => ['harness-system-boundaries', 'harness-environment-evolution', 'loop-type-and-stopping', 'loop-replanning-recovery'].includes(value) },
  ActionBoundariesWalkthrough: { diagramId: value => ['orchestration-basics', 'orchestration-composition', 'human-intervention-positions', 'human-approval-lifecycle', 'error-layer-routing', 'retry-and-recovery-boundaries'].includes(value) },
  ContextDesignWalkthrough: { diagramId: value => ['context-input-design', 'context-cycle-retrieval', 'context-layout-budget', 'context-information-design', 'context-compaction-design', 'context-trust-restart'].includes(value) },
  OverviewReadingWalkthrough: { diagramId: value => ['learning-section-map', 'learning-practice-loop', 'skill-development', 'information-evidence', 'information-maintenance'].includes(value) },
  AgentConceptsWalkthrough: { diagramId: value => ['screen-observation', 'screen-boundaries', 'loop-stop-reasons', 'loop-runtime', 'ai-design-lineage', 'world-model-usages', 'world-model-evidence', 'physical-ai-boundaries', 'physical-ai-evidence', 'planning-patterns', 'planning-maintenance', 'retrieval-paths', 'retrieval-choice', 'delegation-boundaries', 'delegation-patterns', 'agent-components', 'agent-autonomy', 'tool-execution', 'tool-contract', 'memory-layers', 'memory-lifecycle'].includes(value) },
  MultimodalWalkthrough: { diagramId: value => [
  "multimodal-representation",
  "multimodal-input-tradeoffs"
].includes(value) },
  CapabilitiesWalkthrough: { diagramId: value => [
  "capabilities-assessment"
].includes(value) },
  InterpretabilityWalkthrough: { diagramId: value => [
  "interpretability-evidence",
  "interpretability-sae"
].includes(value) },
  IclWalkthrough: { diagramId: value => [
  "icl-hypotheses",
  "icl-demonstrations",
  "icl-memory-evaluation"
].includes(value) },
  ContextWalkthrough: { diagramId: value => [
  "context-causal-cost",
  "context-cache-quality"
].includes(value) },
  ReasoningWalkthrough: { diagramId: value => [
  "reasoning-sequence",
  "reasoning-evaluation"
].includes(value) },
  AlignmentWalkthrough: { diagramId: value => [
  "alignment-preference",
  "alignment-reward-risk",
  "alignment-feedback"
].includes(value) },
  PretrainingWalkthrough: { diagramId: value => [
  'pretraining-loss-perplexity',
  'pretraining-scaling',
  'pretraining-data',
  'pretraining-metrics',
  'pretraining-compute'
].includes(value) },
  TrainingWalkthrough: { diagramId: value => ['training-stages', 'training-runtime-boundary'].includes(value) },
  InferenceWalkthrough: { diagramId: value => ['inference-sampling', 'inference-cache-batching', 'inference-speculative', 'inference-quantization'].includes(value) },
  AttentionWalkthrough: {},
  AttentionStep: { step: value => ['0', '1', '2', '3', '4', '5'].includes(value) },
  ReadingWalkthrough: { diagramId: value => ['agent-loop', 'workflow-comparison'].includes(value) },
  TransformerWalkthrough: { diagramId: value => ['transformer-io', 'transformer-position', 'transformer-block'].includes(value) },
  AttentionVariantsWalkthrough: { diagramId: value => ['attention-kv-sharing', 'attention-compute-memory', 'attention-context-range'].includes(value) },
  FoundationsWalkthrough: { diagramId: value => ['generation-token-loop', 'tokenization-counting'].includes(value) },
  MoEWalkthrough: { diagramId: value => ['moe-routing-load', 'moe-parameters-communication'].includes(value) },
  ReadingStep: { step: value => /^[0-8]$/.test(value) },
  TodoCallout: {},
  PracticeSection: { kind: value => ['antipattern', 'checklist'].includes(value) },
  GlossaryTerm: {
    href: value => /^\/(?!\/)/.test(value) && !/[\\\u0000-\u0020\u007f]/.test(value),
    summary: () => true
  }
}

/** 実行せずに生成 MDX を再パースし、許可外の構造・属性を返す。 */
export function findUnsafeMdx(mdx) {
  let tree
  try {
    tree = parser.parse(mdx)
  } catch (error) {
    return [`生成 MDX の再パースに失敗(${error.message})`]
  }
  const bad = new Set()
  const walk = (node, parentFigure = null) => {
    let figure = parentFigure
    switch (node.type) {
      case 'html': bad.add('生 HTML'); break
      case 'mdxjsEsm': bad.add('import/export (ESM)'); break
      case 'mdxFlowExpression':
      case 'mdxTextExpression': bad.add('{式}'); break
      case 'mdxJsxFlowElement':
      case 'mdxJsxTextElement': {
        const allowed = Object.hasOwn(attributes, node.name) ? attributes[node.name] : null
        if (!allowed) bad.add(`JSX <${node.name ?? '?'}>`)
        const seen = new Set()
        for (const attribute of node.attributes ?? []) {
          if (attribute.type !== 'mdxJsxAttribute') {
            bad.add('JSX 属性スプレッド')
            continue
          }
          if (typeof attribute.value !== 'string') {
            bad.add(`JSX 属性式・非文字列値 (${attribute.name})`)
          } else if (!allowed || !Object.hasOwn(allowed, attribute.name) || !allowed[attribute.name](attribute.value)) {
            bad.add(`許可外の JSX 属性・値 (${node.name}.${attribute.name})`)
          }
          if (seen.has(attribute.name)) bad.add(`重複した JSX 属性 (${attribute.name})`)
          seen.add(attribute.name)
        }
        const required = { SeContinuityWalkthrough: 'diagramId', CodingPracticeWalkthrough: 'diagramId', CodingOptionsWalkthrough: 'diagramId', SeProcessWalkthrough: 'diagramId', CodingIdeCloudWalkthrough: 'diagramId', CodingProductsWalkthrough: 'diagramId', CodingOutcomesWalkthrough: 'diagramId', CodingControlsWalkthrough: 'diagramId', CodingDecisionsWalkthrough: 'diagramId', DurableContractWalkthrough: 'diagramId', HarnessLoopWalkthrough: 'diagramId', ActionBoundariesWalkthrough: 'diagramId', ContextDesignWalkthrough: 'diagramId', OverviewReadingWalkthrough: 'diagramId', AgentConceptsWalkthrough: 'diagramId', ReadingWalkthrough: 'diagramId', TransformerWalkthrough: 'diagramId', AttentionVariantsWalkthrough: 'diagramId', MoEWalkthrough: 'diagramId', FoundationsWalkthrough: 'diagramId', InferenceWalkthrough: 'diagramId', TrainingWalkthrough: 'diagramId', PretrainingWalkthrough: 'diagramId', AlignmentWalkthrough: 'diagramId', ReasoningWalkthrough: 'diagramId', ContextWalkthrough: 'diagramId', IclWalkthrough: 'diagramId', InterpretabilityWalkthrough: 'diagramId', CapabilitiesWalkthrough: 'diagramId', MultimodalWalkthrough: 'diagramId', ReadingStep: 'step', AttentionStep: 'step' }[node.name]
        if (required && !seen.has(required)) bad.add(`必須の JSX 属性がありません (${node.name}.${required})`)
        if (walkthroughs.has(node.name)) {
          if (parentFigure) bad.add('図解コンポーネントの入れ子')
          const id = node.attributes?.find(attribute => attribute.name === 'diagramId')?.value
          figure = { name: node.name, stageCount: node.name === 'AttentionWalkthrough' ? 6 : readingStages[id] }
        }
        if (['ReadingStep', 'AttentionStep'].includes(node.name)) {
          const value = node.attributes?.find(attribute => attribute.name === 'step')?.value
          const expectedStep = parentFigure?.name === 'AttentionWalkthrough' ? 'AttentionStep' : 'ReadingStep'
          if (!parentFigure || node.name !== expectedStep || !(Number(value) < parentFigure.stageCount)) {
            bad.add(`図解と段階の対応が不正です (${node.name}.step)`)
          }
        }
        break
      }
    }
    for (const child of node.children ?? []) walk(child, figure)
  }
  walk(tree)
  return [...bad]
}
