import { QualityTraceWalkthrough } from './components/diagrams/quality-trace-walkthrough'
import { EvaluationContextWalkthrough } from './components/diagrams/evaluation-context-walkthrough'
import { EvaluationLifecycleWalkthrough } from './components/diagrams/evaluation-lifecycle-walkthrough'
import { EvaluationEvidenceWalkthrough } from './components/diagrams/evaluation-evidence-walkthrough'
import { ModelMcpEvaluationWalkthrough } from './components/diagrams/model-mcp-evaluation-walkthrough'
import { VendorPromptControlsWalkthrough } from './components/diagrams/vendor-prompt-controls-walkthrough'
import { SyntheticSandboxInteropWalkthrough } from './components/diagrams/synthetic-sandbox-interop-walkthrough'
import { SlmComputerVoiceWalkthrough } from './components/diagrams/slm-computer-voice-walkthrough'
import { CatalogueOssLocalWalkthrough } from './components/diagrams/catalogue-oss-local-walkthrough'
import { FrameworkModelTuningWalkthrough } from './components/diagrams/framework-model-tuning-walkthrough'
import { RagMemoryGraphWalkthrough } from './components/diagrams/rag-memory-graph-walkthrough'
import { RetrievalDataWalkthrough } from './components/diagrams/retrieval-data-walkthrough'
import { FeedbackStreamingWalkthrough } from './components/diagrams/feedback-streaming-walkthrough'
import { PromptTechniquesAssetsWalkthrough } from './components/diagrams/prompt-techniques-assets-walkthrough'
import { PromptToolOutputWalkthrough } from './components/diagrams/prompt-tool-output-walkthrough'
import { ClientAdoptionWalkthrough } from './components/diagrams/client-adoption-walkthrough'
import { SeContinuityWalkthrough } from './components/diagrams/se-continuity-walkthrough'
import { CodingPracticeWalkthrough } from './components/diagrams/coding-practice-walkthrough'
import { CodingOptionsWalkthrough } from './components/diagrams/coding-options-walkthrough'
import { SeProcessWalkthrough } from './components/diagrams/se-process-walkthrough'
import { CodingIdeCloudWalkthrough } from './components/diagrams/coding-ide-cloud-walkthrough'
import { CodingProductsWalkthrough } from './components/diagrams/coding-products-walkthrough'
import { CodingOutcomesWalkthrough } from './components/diagrams/coding-outcomes-walkthrough'
import { CodingControlsWalkthrough } from './components/diagrams/coding-controls-walkthrough'
import { useMDXComponents as getDocsMDXComponents } from 'nextra-theme-docs'
import { ChecklistBox } from './components/mdx/checklist-box'
import { DocMeta } from './components/mdx/doc-meta'
import { GlossaryTerm } from './components/mdx/glossary-term'
import { PracticeSection } from './components/mdx/practice-section'
import { TodoCallout } from './components/mdx/todo-callout'
import { ArticleAudio } from './components/audio/article-audio'
import { AttentionStep, AttentionWalkthrough, ReadingStep } from './components/diagrams/diagram-entry'
import { ReadingWalkthrough } from './components/diagrams/concept-walkthrough'
import { AgentConceptsWalkthrough } from './components/diagrams/agent-concepts-walkthrough'
import { OverviewReadingWalkthrough } from './components/diagrams/overview-reading-walkthrough'
import { ContextDesignWalkthrough } from './components/diagrams/context-design-walkthrough'
import { ActionBoundariesWalkthrough } from './components/diagrams/action-boundaries-walkthrough'
import { HarnessLoopWalkthrough } from './components/diagrams/harness-loop-walkthrough'
import { DurableContractWalkthrough } from './components/diagrams/durable-contract-walkthrough'
import { CodingDecisionsWalkthrough } from './components/diagrams/coding-decisions-walkthrough'
import { TransformerWalkthrough } from './components/diagrams/transformer-walkthrough'
import { AttentionVariantsWalkthrough } from './components/diagrams/attention-variants-walkthrough'
import { MoEWalkthrough } from './components/diagrams/moe-walkthrough'
import { FoundationsWalkthrough } from './components/diagrams/foundations-walkthrough'
import { InferenceWalkthrough } from './components/diagrams/inference-walkthrough'
import { TrainingWalkthrough } from './components/diagrams/training-walkthrough'
import { ReasoningWalkthrough } from './components/diagrams/reasoning-walkthrough'
import { ContextWalkthrough } from './components/diagrams/context-walkthrough'
import { IclWalkthrough } from './components/diagrams/icl-walkthrough'
import { InterpretabilityWalkthrough } from './components/diagrams/interpretability-walkthrough'
import { CapabilitiesWalkthrough } from './components/diagrams/capabilities-walkthrough'
import { MultimodalWalkthrough } from './components/diagrams/multimodal-walkthrough'
import { AlignmentWalkthrough } from './components/diagrams/alignment-walkthrough'
import { PretrainingWalkthrough } from './components/diagrams/pretraining-walkthrough'

const docsComponents = getDocsMDXComponents()
const DocsWrapper = docsComponents.wrapper

// Markdown 要素 → React コンポーネントのマッピング(project/plans/engineering/website.md §5 段階 2)。
// sync が注入する記事装飾・動的図のコンポーネントはここで解決される。
export const useMDXComponents = components => ({
  ...docsComponents,
  AttentionStep,
  AttentionWalkthrough,
  ReadingWalkthrough,
  AgentConceptsWalkthrough,
  OverviewReadingWalkthrough,
  ContextDesignWalkthrough,
  ActionBoundariesWalkthrough,
  HarnessLoopWalkthrough,
  DurableContractWalkthrough,
  QualityTraceWalkthrough,
  EvaluationContextWalkthrough,
  EvaluationLifecycleWalkthrough,
  EvaluationEvidenceWalkthrough,
  ModelMcpEvaluationWalkthrough,
  VendorPromptControlsWalkthrough,
  SyntheticSandboxInteropWalkthrough,
  SlmComputerVoiceWalkthrough,
  CatalogueOssLocalWalkthrough,
  FrameworkModelTuningWalkthrough,
  RagMemoryGraphWalkthrough,
  RetrievalDataWalkthrough,
  FeedbackStreamingWalkthrough,
  PromptTechniquesAssetsWalkthrough,
  PromptToolOutputWalkthrough,
  ClientAdoptionWalkthrough,
  SeContinuityWalkthrough,
  CodingPracticeWalkthrough,
  CodingOptionsWalkthrough,
  SeProcessWalkthrough,
  CodingIdeCloudWalkthrough,
  CodingProductsWalkthrough,
  CodingOutcomesWalkthrough,
  CodingControlsWalkthrough,
  CodingDecisionsWalkthrough,
  TransformerWalkthrough,
  AttentionVariantsWalkthrough,
  MoEWalkthrough,
  FoundationsWalkthrough,
  InferenceWalkthrough,
  TrainingWalkthrough,
  PretrainingWalkthrough,
  AlignmentWalkthrough,
  MultimodalWalkthrough,
  CapabilitiesWalkthrough,
  InterpretabilityWalkthrough,
  IclWalkthrough,
  ContextWalkthrough,
  ReasoningWalkthrough,
  ReadingStep,
  TodoCallout,
  PracticeSection,
  GlossaryTerm,
  // KaTeX のブロック数式はキーボードでも横スクロールできるようにする。
  span(props) {
    if (props.className?.split(/\s+/).includes('katex-display')) {
      return <span {...props} tabIndex={0} role="region" aria-label="数式" />
    }
    return <span {...props} />
  },
  // GFM タスクリストのチェックボックスをクリック可能にする
  input(props) {
    if (props.type === 'checkbox') {
      return <ChecklistBox defaultChecked={props.checked} />
    }
    return <input {...props} />
  },
  // 記事ヘッダーに front matter バッジ(level / tags / last_updated)を差し込む
  wrapper({ children, ...props }) {
    return (
      <DocsWrapper {...props}>
        <DocMeta metadata={props.metadata} />
        <ArticleAudio />
        {children}
      </DocsWrapper>
    )
  },
  ...components
})
