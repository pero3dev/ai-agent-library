// Compatibility exports for model consumers and the shared model tests.
// Article scenes import their own model directly to keep loading independent.
export { LOOP_STAGES, RESPONSE_OPTIONS, loopFrame } from './agent-loop-model.mjs'
export { CHOICE_OPTIONS, COMPARISON_ROWS, WORKFLOW_STAGES, workflowChoice } from './workflow-comparison-model.mjs'
