import { planAttentionSection } from './attention-decoration.mjs'
import { assertDiagramSource, diagramRegistry, validateDiagramRegistry } from './diagram-registry.mjs'

const element = (name, children, attributes = []) => ({ type: 'mdxJsxFlowElement', name, attributes, children })
const attribute = (name, value) => ({ type: 'mdxJsxAttribute', name, value: String(value) })
const step = (index, children) => element('ReadingStep', children, [attribute('step', index)])
const components = {
  'se-common-principles': 'SeProcessWalkthrough',
  'se-v-model-map': 'SeProcessWalkthrough',
  'se-upstream-review': 'SeProcessWalkthrough',
  'se-document-delivery': 'SeProcessWalkthrough',
  'se-test-design-generation': 'SeProcessWalkthrough',
  'se-test-oracle-evidence': 'SeProcessWalkthrough',
  'cursor-runtime-data': 'CodingIdeCloudWalkthrough',
  'cursor-rules-security': 'CodingIdeCloudWalkthrough',
  'cursor-connections-adoption': 'CodingIdeCloudWalkthrough',
  'windsurf-runtime-migration': 'CodingIdeCloudWalkthrough',
  'windsurf-rules-security': 'CodingIdeCloudWalkthrough',
  'windsurf-connections-adoption': 'CodingIdeCloudWalkthrough',
  'devin-delegation-runtime': 'CodingIdeCloudWalkthrough',
  'devin-teaching-security': 'CodingIdeCloudWalkthrough',
  'devin-connections-adoption': 'CodingIdeCloudWalkthrough',
  'claude-surfaces-runtime': 'CodingProductsWalkthrough',
  'claude-config-permission': 'CodingProductsWalkthrough',
  'claude-integrations-adoption': 'CodingProductsWalkthrough',
  'codex-surfaces-runtime': 'CodingProductsWalkthrough',
  'codex-config-permission': 'CodingProductsWalkthrough',
  'codex-integrations-adoption': 'CodingProductsWalkthrough',
  'google-products-runtime': 'CodingProductsWalkthrough',
  'google-config-data': 'CodingProductsWalkthrough',
  'google-integrations-adoption': 'CodingProductsWalkthrough',
  'coding-team-rollout': 'CodingOutcomesWalkthrough',
  'coding-team-review': 'CodingOutcomesWalkthrough',
  'coding-team-governance': 'CodingOutcomesWalkthrough',
  'coding-evaluation-experiment': 'CodingOutcomesWalkthrough',
  'coding-evaluation-effects': 'CodingOutcomesWalkthrough',
  'coding-cost-consumption': 'CodingOutcomesWalkthrough',
  'coding-cost-context': 'CodingOutcomesWalkthrough',
  'coding-cost-limits': 'CodingOutcomesWalkthrough',
  'coding-rules-content': 'CodingControlsWalkthrough',
  'coding-rules-scope-maintenance': 'CodingControlsWalkthrough',
  'coding-security-threat-paths': 'CodingControlsWalkthrough',
  'coding-security-permission-modes': 'CodingControlsWalkthrough',
  'coding-security-defense-audit': 'CodingControlsWalkthrough',
  'coding-automation-task-design': 'CodingControlsWalkthrough',
  'coding-automation-runtime-recovery': 'CodingControlsWalkthrough',
  'coding-support-forms': 'CodingDecisionsWalkthrough',
  'coding-trigger-execution-map': 'CodingDecisionsWalkthrough',
  'coding-autonomy-learning': 'CodingDecisionsWalkthrough',
  'coding-selection-constraints': 'CodingDecisionsWalkthrough',
  'coding-selection-trial': 'CodingDecisionsWalkthrough',
  'coding-request-contract': 'CodingDecisionsWalkthrough',
  'coding-request-verification-recovery': 'CodingDecisionsWalkthrough',
  'durable-resume-design': 'DurableContractWalkthrough',
  'durable-side-effect-contract': 'DurableContractWalkthrough',
  'durable-wait-and-progress': 'DurableContractWalkthrough',
  'tenant-data-and-settings': 'DurableContractWalkthrough',
  'tenant-capacity-and-cost': 'DurableContractWalkthrough',
  'agent-api-job-states': 'DurableContractWalkthrough',
  'agent-api-events-and-idempotency': 'DurableContractWalkthrough',
  'agent-api-change-and-metering': 'DurableContractWalkthrough',
  'harness-system-boundaries': 'HarnessLoopWalkthrough',
  'harness-environment-evolution': 'HarnessLoopWalkthrough',
  'loop-type-and-stopping': 'HarnessLoopWalkthrough',
  'loop-replanning-recovery': 'HarnessLoopWalkthrough',
  'orchestration-basics': 'ActionBoundariesWalkthrough',
  'orchestration-composition': 'ActionBoundariesWalkthrough',
  'human-intervention-positions': 'ActionBoundariesWalkthrough',
  'human-approval-lifecycle': 'ActionBoundariesWalkthrough',
  'error-layer-routing': 'ActionBoundariesWalkthrough',
  'retry-and-recovery-boundaries': 'ActionBoundariesWalkthrough',
  'context-input-design': 'ContextDesignWalkthrough',
  'context-cycle-retrieval': 'ContextDesignWalkthrough',
  'context-layout-budget': 'ContextDesignWalkthrough',
  'context-information-design': 'ContextDesignWalkthrough',
  'context-compaction-design': 'ContextDesignWalkthrough',
  'context-trust-restart': 'ContextDesignWalkthrough',
  'learning-section-map': 'OverviewReadingWalkthrough',
  'learning-practice-loop': 'OverviewReadingWalkthrough',
  'skill-development': 'OverviewReadingWalkthrough',
  'information-evidence': 'OverviewReadingWalkthrough',
  'information-maintenance': 'OverviewReadingWalkthrough',
  'screen-observation': 'AgentConceptsWalkthrough',
  'screen-boundaries': 'AgentConceptsWalkthrough',
  'loop-stop-reasons': 'AgentConceptsWalkthrough',
  'loop-runtime': 'AgentConceptsWalkthrough',
  'ai-design-lineage': 'AgentConceptsWalkthrough',
  'world-model-usages': 'AgentConceptsWalkthrough',
  'world-model-evidence': 'AgentConceptsWalkthrough',
  'physical-ai-boundaries': 'AgentConceptsWalkthrough',
  'physical-ai-evidence': 'AgentConceptsWalkthrough',
  'planning-patterns': 'AgentConceptsWalkthrough',
  'planning-maintenance': 'AgentConceptsWalkthrough',
  'retrieval-paths': 'AgentConceptsWalkthrough',
  'retrieval-choice': 'AgentConceptsWalkthrough',
  'delegation-boundaries': 'AgentConceptsWalkthrough',
  'delegation-patterns': 'AgentConceptsWalkthrough',
  'agent-components': 'AgentConceptsWalkthrough',
  'agent-autonomy': 'AgentConceptsWalkthrough',
  'tool-execution': 'AgentConceptsWalkthrough',
  'tool-contract': 'AgentConceptsWalkthrough',
  'memory-layers': 'AgentConceptsWalkthrough',
  'memory-lifecycle': 'AgentConceptsWalkthrough',
  'multimodal-representation': 'MultimodalWalkthrough',
  'multimodal-input-tradeoffs': 'MultimodalWalkthrough',
  'capabilities-assessment': 'CapabilitiesWalkthrough',
  'interpretability-evidence': 'InterpretabilityWalkthrough',
  'interpretability-sae': 'InterpretabilityWalkthrough',
  'icl-hypotheses': 'IclWalkthrough',
  'icl-demonstrations': 'IclWalkthrough',
  'icl-memory-evaluation': 'IclWalkthrough',
  'context-causal-cost': 'ContextWalkthrough',
  'context-cache-quality': 'ContextWalkthrough',
  'reasoning-sequence': 'ReasoningWalkthrough',
  'reasoning-evaluation': 'ReasoningWalkthrough',
  'alignment-preference': 'AlignmentWalkthrough',
  'alignment-reward-risk': 'AlignmentWalkthrough',
  'alignment-feedback': 'AlignmentWalkthrough',
  'pretraining-loss-perplexity': 'PretrainingWalkthrough',
  'pretraining-scaling': 'PretrainingWalkthrough',
  'pretraining-data': 'PretrainingWalkthrough',
  'pretraining-metrics': 'PretrainingWalkthrough',
  'pretraining-compute': 'PretrainingWalkthrough',
  'training-stages': 'TrainingWalkthrough', 'training-runtime-boundary': 'TrainingWalkthrough',
  'inference-sampling': 'InferenceWalkthrough', 'inference-cache-batching': 'InferenceWalkthrough',
  'inference-speculative': 'InferenceWalkthrough', 'inference-quantization': 'InferenceWalkthrough',
  'generation-token-loop': 'FoundationsWalkthrough', 'tokenization-counting': 'FoundationsWalkthrough',
  'moe-routing-load': 'MoEWalkthrough', 'moe-parameters-communication': 'MoEWalkthrough',
  'agent-loop': 'ReadingWalkthrough', 'workflow-comparison': 'ReadingWalkthrough',
  'transformer-io': 'TransformerWalkthrough', 'transformer-position': 'TransformerWalkthrough', 'transformer-block': 'TransformerWalkthrough',
  'attention-kv-sharing': 'AttentionVariantsWalkthrough', 'attention-compute-memory': 'AttentionVariantsWalkthrough', 'attention-context-range': 'AttentionVariantsWalkthrough'
}
const figure = (entry, children) => element(components[entry.id], children, [attribute('diagramId', entry.id)])

/** Validate every source binding against the same original, unmodified AST. */
export function planRegisteredDiagrams(tree, route, registry = diagramRegistry) {
  validateDiagramRegistry(registry)
  const entries = registry.diagrams.filter(entry => entry.route === route && entry.enabled)
  const plans = entries.map(entry => {
    if (entry.id === 'self-attention') return planAttentionSection(tree, entry)
    const sections = assertDiagramSource(tree, entry)
    if (entry.binding === 'ordered-steps') {
      const [{ start, end, body }] = sections
      const [intro, list] = body
      if (body.length !== 2 || intro.type !== 'paragraph' || list?.type !== 'list' || !list.ordered
        || list.start !== 1 || list.children.length !== entry.stageCount || list.children.some(item => item.type !== 'listItem')) {
        throw new Error(`${route}: 動的図の5段階リストの構成が変わりました。`)
      }
      // Wrap INSIDE each original list item: keep a single ol and its numbering.
      const trackedList = { ...list, children: list.children.map((item, index) => ({ ...item, children: [step(index, item.children)] })) }
      return { id: entry.id, start: start + 1, end, replacement: figure(entry, [intro, trackedList]) }
    } else if (entry.binding === 'consecutive-sections') {
      const start = sections[0].start, end = sections.at(-1).end
      return { id: entry.id, start, end, replacement: figure(entry, sections.map((section, index) => step(index, [section.heading, ...section.body]))) }
    } else if (entry.binding === 'grouped-blocks') {
      const children = sections.flatMap((section, sectionIndex) => {
        let offset = 0
        return entry.blockGroups[sectionIndex].map(({ stage, count }, groupIndex) => {
          const nodes = section.body.slice(offset, offset + count)
          offset += count
          // A heading belongs to its first group, but is not a counted body
          // block. Lists, formulas and paragraphs retain their original nodes.
          return step(stage, groupIndex === 0 ? [section.heading, ...nodes] : nodes)
        })
      })
      return { id: entry.id, start: sections[0].start, end: sections.at(-1).end, replacement: figure(entry, children) }
    }
    throw new Error(`${route}: 動的図 ${entry.id} の未対応 binding です。`)
  }).sort((a, b) => a.start - b.start)
  assertNonoverlappingDiagramPlans(plans)
  return plans
}

/** Source dependencies may overlap; the ranges replaced in the article may not. */
export function assertNonoverlappingDiagramPlans(plans) {
  for (const [index, plan] of plans.entries()) {
    if (!Number.isInteger(plan.start) || !Number.isInteger(plan.end) || plan.start < 0 || plan.end <= plan.start
      || (index > 0 && plans[index - 1].end > plan.start)) {
      throw new Error(`動的図 ${plan.id}: 本文の包装範囲が重複しているか不正です。`)
    }
  }
}

/** Apply only after every plan succeeds, from the last original range backward. */
export function wrapRegisteredDiagrams(tree, route, registry = diagramRegistry) {
  const plans = planRegisteredDiagrams(tree, route, registry)
  for (const plan of [...plans].reverse()) tree.children.splice(plan.start, plan.end - plan.start, plan.replacement)
  return { firstDiagramId: plans[0]?.id ?? null, diagramIds: plans.map(plan => plan.id) }
}

/** Read the final MDX, including content-src overrides, before emitting SSR data. */
export function assertDiagramPageMetadata(tree, expected) {
  const diagramIds = []
  const walk = node => {
    if (node.name === 'AttentionWalkthrough') diagramIds.push('self-attention')
    if (['SeProcessWalkthrough', 'CodingIdeCloudWalkthrough', 'CodingProductsWalkthrough', 'CodingOutcomesWalkthrough', 'CodingControlsWalkthrough', 'CodingDecisionsWalkthrough', 'DurableContractWalkthrough', 'HarnessLoopWalkthrough', 'ActionBoundariesWalkthrough', 'ContextDesignWalkthrough', 'OverviewReadingWalkthrough', 'AgentConceptsWalkthrough', 'ReadingWalkthrough', 'TransformerWalkthrough', 'AttentionVariantsWalkthrough', 'MoEWalkthrough', 'FoundationsWalkthrough', 'InferenceWalkthrough', 'TrainingWalkthrough', 'PretrainingWalkthrough', 'AlignmentWalkthrough', 'ReasoningWalkthrough', 'ContextWalkthrough', 'IclWalkthrough', 'InterpretabilityWalkthrough', 'CapabilitiesWalkthrough', 'MultimodalWalkthrough'].includes(node.name)) {
      diagramIds.push(node.attributes?.find(attribute => attribute.name === 'diagramId')?.value)
    }
    for (const child of node.children ?? []) walk(child)
  }
  walk(tree)
  if (JSON.stringify(diagramIds) !== JSON.stringify(expected.diagramIds)
    || expected.firstDiagramId !== (diagramIds[0] ?? null)) {
    throw new Error('動的図: 最終 MDX の順序・有効状態と記事目次の対応が一致しません。')
  }
  return expected
}
