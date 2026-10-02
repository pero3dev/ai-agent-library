import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath)
  .use(remarkFrontmatter, ['yaml']).use(remarkMdx)

const readingStages = {
  'identity-delegation-scope': 7,
  'identity-audit-credentials': 6,
  'identity-standards-connection': 6,
  'exfiltration-routes-url': 6,
  'exfiltration-structure-authorization': 6,
  'guard-layers-enforcement': 5,
  'guard-quality-response': 6,
  'threat-boundary-cycle': 6,
  'threat-trifecta-workflow': 6,
  'injection-input-defense': 6,
  'injection-repeated-risk': 5,
  'permission-gates-scope': 6,
  'permission-sandbox-mcp': 6,
  'hardware-weights-runtime': 6,
  'hardware-bottleneck-purchase': 5,
  'serving-engines-throughput': 5,
  'serving-memory-rollout': 6,
  'environment-scope-mechanisms': 6,
  'environment-measure-report': 5,
  'environment-honest-claims': 5,
  'deployment-state-execution': 6,
  'deployment-capacity-fallback': 6,
  'resident-maintenance-signals': 5,
  'resident-succession-retirement': 6,
  'mlops-common-differences': 6,
  'mlops-roles-training-join': 5,
  'gateway-crossroads-topology': 5,
  'gateway-routing-boundaries': 6,
  'cache-levels-semantic-risk': 6,
  'cache-reuse-invalidation': 6,
  'batch-route-capacity': 5,
  'batch-results-deadlines': 6,
  'conversation-collection-layers': 6,
  'conversation-retention-deletion': 5,
  'conversation-use-access': 5,
  'governance-ownership-catalogue': 5,
  'governance-quality-permission': 6,
  'chaos-hypothesis-targets': 5,
  'chaos-environment-learning': 6,
  'version-composition-pinning': 6,
  'version-rollout-migration': 6,
  'incident-detection-containment': 6,
  'incident-effects-learning': 6,
  'feedback-signals-collection': 6,
  'feedback-triage-release': 6,
  'cost-history-measurement': 5,
  'cost-reduction-quality': 5,
  'cost-budget-cache-accounting': 7,
  'latency-breakdown-tools': 5,
  'latency-levers-priorities': 5,
  'slo-indicators-reliability': 5,
  'slo-budget-release-sla': 6,
  'fairness-types-measurement': 5,
  'fairness-japanese-remediation': 5,
  'japanese-axes-exceptions': 5,
  'japanese-judge-division': 5,
  'trace-hierarchy-versions': 5,
  'trace-signals-data-response': 6,
  'environment-layers-state': 5,
  'environment-repro-fidelity': 5,
  'simulator-roles-constraints': 5,
  'simulator-scenarios-validation': 5,
  'calibration-signals-bins': 5,
  'calibration-abstain-update': 6,
  'regression-layer-scope': 5,
  'regression-gate-recovery': 5,
  'online-sequence-signals': 5,
  'online-comparison-release': 6,
  'benchmark-map-provenance': 5,
  'benchmark-reliability-cost': 7,
  'judge-format-bias': 4,
  'judge-validation-split': 6,
  'trajectory-path-review': 5,
  'trajectory-record-constraints': 5,
  'dataset-source-synthetic': 5,
  'dataset-label-maintenance': 6,
  'cross-provider-map': 5,
  'cross-provider-migration': 6,
  'mcp-connection-versions': 6,
  'mcp-tool-authority': 6,
  'evaluation-layers-graders': 5,
  'evaluation-harness-decision': 6,
  'claude-structure-examples': 4,
  'claude-thinking-output': 4,
  'claude-history-migration': 6,
  'openai-instruction-contract': 5,
  'openai-thinking-output': 4,
  'openai-history-migration': 6,
  'gemini-structure-examples': 4,
  'gemini-thinking-context': 4,
  'gemini-tool-migration': 4,
  'synthetic-purpose-generation': 5,
  'synthetic-quality-separation': 6,
  'sandbox-isolation-selection': 6,
  'sandbox-lifecycle-egress': 7,
  'interop-tool-peer-structure': 5,
  'interop-trust-update': 6,
  'slm-quality-components': 4,
  'slm-routing-cost': 5,
  'computer-observation-permission': 5,
  'computer-stability-evidence': 6,
  'voice-architecture-latency': 6,
  'voice-interruption-tools': 6,
  'voice-evaluation-providers': 4,
  'catalogue-common-map': 4,
  'catalogue-provider-boundaries': 5,
  'catalogue-openweight-licenses': 5,
  'oss-layers-permission': 4,
  'oss-provenance-maintenance': 5,
  'local-runtime-selection': 4,
  'local-quality-deployment': 4,
  'framework-abstraction-selection': 5,
  'framework-boundary-migration': 4,
  'model-constraints-tier': 5,
  'model-portfolio-updates': 4,
  'tuning-choice-methods': 5,
  'distillation-data-lifecycle': 6,
  'rag-ingestion-search': 5,
  'rag-agent-evidence': 5,
  'memory-extract-store': 5,
  'memory-recall-forget': 5,
  'graph-build-quality': 4,
  'graph-types-investment': 5,
  'embedding-choice-asymmetry': 5,
  'embedding-chunk-deploy': 4,
  'vector-choice-approximation': 4,
  'vector-filter-operations': 5,
  'preprocess-extraction-quality': 5,
  'preprocess-metadata-lineage': 5,
  'optimization-failure-cycle': 6,
  'optimization-search-boundaries': 5,
  'feedback-observation-design': 4,
  'feedback-verifier-control': 6,
  'stream-progress-surface': 3,
  'stream-cancellation-state': 6,
  'prompt-basics-input': 5,
  'prompt-basics-chain': 5,
  'prompt-pattern-layout': 5,
  'prompt-pattern-verification': 6,
  'prompt-management-assets': 5,
  'prompt-management-change': 5,
  'prompt-structure-boundaries': 6,
  'prompt-cause-revision': 4,
  'tool-definition-contract': 5,
  'tool-result-maintenance': 4,
  'structured-method-schema': 5,
  'structured-validation-loop': 5,
  'client-approval-contract': 5,
  'client-staged-adoption': 4,
  'client-measured-evidence': 4,
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
const walkthroughs = new Set(['SecurityAuthorityWalkthrough', 'SecurityBoundariesWalkthrough', 'HardwareServingWalkthrough', 'DeploymentLifecycleWalkthrough', 'GatewayReuseWalkthrough', 'DataResilienceWalkthrough', 'ReleaseResponseWalkthrough', 'ServiceBudgetsWalkthrough', 'QualityTraceWalkthrough', 'EvaluationContextWalkthrough', 'EvaluationLifecycleWalkthrough', 'EvaluationEvidenceWalkthrough', 'ModelMcpEvaluationWalkthrough', 'VendorPromptControlsWalkthrough', 'SyntheticSandboxInteropWalkthrough', 'SlmComputerVoiceWalkthrough', 'CatalogueOssLocalWalkthrough', 'FrameworkModelTuningWalkthrough', 'RagMemoryGraphWalkthrough', 'RetrievalDataWalkthrough', 'FeedbackStreamingWalkthrough', 'PromptTechniquesAssetsWalkthrough', 'PromptToolOutputWalkthrough', 'ClientAdoptionWalkthrough', 'SeContinuityWalkthrough', 'CodingPracticeWalkthrough', 'CodingOptionsWalkthrough', 'SeProcessWalkthrough', 'CodingIdeCloudWalkthrough', 'CodingProductsWalkthrough', 'CodingOutcomesWalkthrough', 'CodingControlsWalkthrough', 'CodingDecisionsWalkthrough', 'DurableContractWalkthrough', 'HarnessLoopWalkthrough', 'ActionBoundariesWalkthrough', 'ContextDesignWalkthrough', 'OverviewReadingWalkthrough', 'AgentConceptsWalkthrough', 'AttentionWalkthrough', 'ReadingWalkthrough', 'TransformerWalkthrough', 'AttentionVariantsWalkthrough', 'MoEWalkthrough', 'FoundationsWalkthrough', 'InferenceWalkthrough', 'TrainingWalkthrough', 'PretrainingWalkthrough', 'AlignmentWalkthrough', 'ReasoningWalkthrough', 'ContextWalkthrough', 'IclWalkthrough', 'InterpretabilityWalkthrough', 'CapabilitiesWalkthrough', 'MultimodalWalkthrough'])

// sync が装飾として挿入する props だけを許可する。コンポーネント名だけでは、
// 属性式や {...spread} を経由したビルド時の JavaScript 実行を防げない。
const attributes = {
  SecurityAuthorityWalkthrough: { diagramId: value => ["identity-delegation-scope","identity-audit-credentials","identity-standards-connection","exfiltration-routes-url","exfiltration-structure-authorization","guard-layers-enforcement","guard-quality-response"].includes(value) },
  SecurityBoundariesWalkthrough: { diagramId: value => ["threat-boundary-cycle","threat-trifecta-workflow","injection-input-defense","injection-repeated-risk","permission-gates-scope","permission-sandbox-mcp"].includes(value) },
  HardwareServingWalkthrough: { diagramId: value => ["hardware-weights-runtime","hardware-bottleneck-purchase","serving-engines-throughput","serving-memory-rollout","environment-scope-mechanisms","environment-measure-report","environment-honest-claims"].includes(value) },
  DeploymentLifecycleWalkthrough: { diagramId: value => ["deployment-state-execution","deployment-capacity-fallback","resident-maintenance-signals","resident-succession-retirement","mlops-common-differences","mlops-roles-training-join"].includes(value) },
  GatewayReuseWalkthrough: { diagramId: value => ["gateway-crossroads-topology","gateway-routing-boundaries","cache-levels-semantic-risk","cache-reuse-invalidation","batch-route-capacity","batch-results-deadlines"].includes(value) },
  DataResilienceWalkthrough: { diagramId: value => ["conversation-collection-layers","conversation-retention-deletion","conversation-use-access","governance-ownership-catalogue","governance-quality-permission","chaos-hypothesis-targets","chaos-environment-learning"].includes(value) },
  ReleaseResponseWalkthrough: { diagramId: value => ["version-composition-pinning","version-rollout-migration","incident-detection-containment","incident-effects-learning","feedback-signals-collection","feedback-triage-release"].includes(value) },
  ServiceBudgetsWalkthrough: { diagramId: value => ["cost-history-measurement","cost-reduction-quality","cost-budget-cache-accounting","latency-breakdown-tools","latency-levers-priorities","slo-indicators-reliability","slo-budget-release-sla"].includes(value) },
  QualityTraceWalkthrough: { diagramId: value => ["fairness-types-measurement","fairness-japanese-remediation","japanese-axes-exceptions","japanese-judge-division","trace-hierarchy-versions","trace-signals-data-response"].includes(value) },
  EvaluationContextWalkthrough: { diagramId: value => ["environment-layers-state","environment-repro-fidelity","simulator-roles-constraints","simulator-scenarios-validation","calibration-signals-bins","calibration-abstain-update"].includes(value) },
  EvaluationLifecycleWalkthrough: { diagramId: value => ["regression-layer-scope","regression-gate-recovery","online-sequence-signals","online-comparison-release","benchmark-map-provenance","benchmark-reliability-cost"].includes(value) },
  EvaluationEvidenceWalkthrough: { diagramId: value => ["judge-format-bias","judge-validation-split","trajectory-path-review","trajectory-record-constraints","dataset-source-synthetic","dataset-label-maintenance"].includes(value) },
  ModelMcpEvaluationWalkthrough: { diagramId: value => ["cross-provider-map","cross-provider-migration","mcp-connection-versions","mcp-tool-authority","evaluation-layers-graders","evaluation-harness-decision"].includes(value) },
  VendorPromptControlsWalkthrough: { diagramId: value => ["claude-structure-examples","claude-thinking-output","claude-history-migration","openai-instruction-contract","openai-thinking-output","openai-history-migration","gemini-structure-examples","gemini-thinking-context","gemini-tool-migration"].includes(value) },
  SyntheticSandboxInteropWalkthrough: { diagramId: value => ["synthetic-purpose-generation","synthetic-quality-separation","sandbox-isolation-selection","sandbox-lifecycle-egress","interop-tool-peer-structure","interop-trust-update"].includes(value) },
  SlmComputerVoiceWalkthrough: { diagramId: value => ["slm-quality-components","slm-routing-cost","computer-observation-permission","computer-stability-evidence","voice-architecture-latency","voice-interruption-tools","voice-evaluation-providers"].includes(value) },
  CatalogueOssLocalWalkthrough: { diagramId: value => ["catalogue-common-map","catalogue-provider-boundaries","catalogue-openweight-licenses","oss-layers-permission","oss-provenance-maintenance","local-runtime-selection","local-quality-deployment"].includes(value) },
  FrameworkModelTuningWalkthrough: { diagramId: value => ["framework-abstraction-selection","framework-boundary-migration","model-constraints-tier","model-portfolio-updates","tuning-choice-methods","distillation-data-lifecycle"].includes(value) },
  RagMemoryGraphWalkthrough: { diagramId: value => ["rag-ingestion-search","rag-agent-evidence","memory-extract-store","memory-recall-forget","graph-build-quality","graph-types-investment"].includes(value) },
  RetrievalDataWalkthrough: { diagramId: value => ["embedding-choice-asymmetry","embedding-chunk-deploy","vector-choice-approximation","vector-filter-operations","preprocess-extraction-quality","preprocess-metadata-lineage"].includes(value) },
  FeedbackStreamingWalkthrough: { diagramId: value => ["optimization-failure-cycle","optimization-search-boundaries","feedback-observation-design","feedback-verifier-control","stream-progress-surface","stream-cancellation-state"].includes(value) },
  PromptTechniquesAssetsWalkthrough: { diagramId: value => ["prompt-basics-input","prompt-basics-chain","prompt-pattern-layout","prompt-pattern-verification","prompt-management-assets","prompt-management-change"].includes(value) },
  PromptToolOutputWalkthrough: { diagramId: value => ["prompt-structure-boundaries","prompt-cause-revision","tool-definition-contract","tool-result-maintenance","structured-method-schema","structured-validation-loop"].includes(value) },
  ClientAdoptionWalkthrough: { diagramId: value => ["client-approval-contract","client-staged-adoption","client-measured-evidence"].includes(value) },
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
        const required = { SecurityAuthorityWalkthrough: 'diagramId', SecurityBoundariesWalkthrough: 'diagramId', HardwareServingWalkthrough: 'diagramId', DeploymentLifecycleWalkthrough: 'diagramId', GatewayReuseWalkthrough: 'diagramId', DataResilienceWalkthrough: 'diagramId', ReleaseResponseWalkthrough: 'diagramId', ServiceBudgetsWalkthrough: 'diagramId', QualityTraceWalkthrough: 'diagramId', EvaluationContextWalkthrough: 'diagramId', EvaluationLifecycleWalkthrough: 'diagramId', EvaluationEvidenceWalkthrough: 'diagramId', ModelMcpEvaluationWalkthrough: 'diagramId', VendorPromptControlsWalkthrough: 'diagramId', SyntheticSandboxInteropWalkthrough: 'diagramId', SlmComputerVoiceWalkthrough: 'diagramId', CatalogueOssLocalWalkthrough: 'diagramId', FrameworkModelTuningWalkthrough: 'diagramId', RagMemoryGraphWalkthrough: 'diagramId', RetrievalDataWalkthrough: 'diagramId', FeedbackStreamingWalkthrough: 'diagramId', PromptTechniquesAssetsWalkthrough: 'diagramId', PromptToolOutputWalkthrough: 'diagramId', ClientAdoptionWalkthrough: 'diagramId', SeContinuityWalkthrough: 'diagramId', CodingPracticeWalkthrough: 'diagramId', CodingOptionsWalkthrough: 'diagramId', SeProcessWalkthrough: 'diagramId', CodingIdeCloudWalkthrough: 'diagramId', CodingProductsWalkthrough: 'diagramId', CodingOutcomesWalkthrough: 'diagramId', CodingControlsWalkthrough: 'diagramId', CodingDecisionsWalkthrough: 'diagramId', DurableContractWalkthrough: 'diagramId', HarnessLoopWalkthrough: 'diagramId', ActionBoundariesWalkthrough: 'diagramId', ContextDesignWalkthrough: 'diagramId', OverviewReadingWalkthrough: 'diagramId', AgentConceptsWalkthrough: 'diagramId', ReadingWalkthrough: 'diagramId', TransformerWalkthrough: 'diagramId', AttentionVariantsWalkthrough: 'diagramId', MoEWalkthrough: 'diagramId', FoundationsWalkthrough: 'diagramId', InferenceWalkthrough: 'diagramId', TrainingWalkthrough: 'diagramId', PretrainingWalkthrough: 'diagramId', AlignmentWalkthrough: 'diagramId', ReasoningWalkthrough: 'diagramId', ContextWalkthrough: 'diagramId', IclWalkthrough: 'diagramId', InterpretabilityWalkthrough: 'diagramId', CapabilitiesWalkthrough: 'diagramId', MultimodalWalkthrough: 'diagramId', ReadingStep: 'step', AttentionStep: 'step' }[node.name]
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
