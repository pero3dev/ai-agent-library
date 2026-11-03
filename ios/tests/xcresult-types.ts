/** Wire fields consumed by the fixed Xcode result audits; exact semantic checks stay in each exporter. */
export interface LegacyNode {
  _type?: { _name?: string }
  _value?: string | number | boolean | null
  _values?: LegacyNode[]
  actions?: LegacyNode
  actionResult?: LegacyNode
  testsRef?: LegacyNode
  id?: LegacyNode
  identifier?: LegacyNode
  summaryRef?: LegacyNode
  testStatus?: LegacyNode
  performanceMetrics?: LegacyNode
  displayName?: LegacyNode
  unitOfMeasurement?: LegacyNode
  measurements?: LegacyNode
  baselineName?: LegacyNode
  baselineAverage?: LegacyNode
  maxPercentRegression?: LegacyNode
  maxPercentRelativeStandardDeviation?: LegacyNode
}
export interface ResultDevice { deviceName?: string; deviceId?: string; modelName?: string; platform?: string; osVersion?: string }
export interface ResultDetails {
  testIdentifier?: string
  testResult?: string
  hasPerformanceMetrics?: boolean
  devices?: ResultDevice[]
  testPlanConfigurations?: { configurationName?: string }[]
}
export interface ResultCase { nodeIdentifier: string; result: 'Passed'|'Failed' }
export interface ExportOptions { result: string; output: string; context: string }
export interface MemoryExportOptions extends ExportOptions { expectedHead: string }
export interface PerformanceExportOptions extends ExportOptions { scenario?: string; 'protocol-log'?: string }
export interface CommandReceipt { arguments: string[]; exit_code: number|null }
export interface ExecutionError extends Error { execution?: CommandReceipt; status?: number|null }
export interface MemoryCandidate {
  identifier: string; display_name: string; unit: string; raw_samples: string[]; samples: number[]; sample_count: number
  interpretation: string; baseline: { average_raw: string; name: string; acceptance: string }
}
export interface CompactEntry { path: string; bytes: number; sha256?: string }
export interface CsvCandidate { name: string; original_relative_path?: string; bytes: Buffer }
export interface CsvInventoryEntry { relative_path: string|null; path_sha256?: string; kind: string; bytes?: number|null; eligible_csv: boolean; captured_as: string|null; rejection: string|null }
export interface CsvInventory {
  schema_version: number; status: string; traversal_complete: boolean; observed_entries: number; entries_omitted: number
  captured_csv_files: number; retained_opaque_manifest: boolean; entries: CsvInventoryEntry[]; issues: string[]
  limits: { depth: number; entries: number; relative_path_bytes: number; CSV_files: number; CSV_bytes: number; inventory_bytes: number }
}
export interface ScrollWorkload {
  article_id: string; article_title: string; source_path: string; document_path: string; expected_source_sha256: string
  start_heading_id: string; start_label: string; end_heading_id: string; end_label: string
  maximum_swipes: number; gesture: string; start_offset_max_points: number
}
export interface ScrollInvocation { index: number; swipes: number; start_fully_visible: boolean; end_initially_fully_visible: boolean; end_fully_visible: boolean; start_offset_points: number; end_offset_points: number }
export interface ScrollProtocol { schema_version: number; scenario: string; metric: string; expected_articles: number; workload: ScrollWorkload; declared_recorded_iterations: number; block_invocations: number; discarded_warmup_invocations: number; invocations: ScrollInvocation[] }
