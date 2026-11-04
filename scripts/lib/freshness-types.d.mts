export interface RegistryPattern {
  id: string
  title: string
  docPatterns: string[]
  researchPatterns: string[]
  cadenceDays: number
}
export interface RegistrySystem {
  id: string
  title: string
  docs: string[]
  research: string[]
  cadenceDays: number
}
export type RegistryEntry = RegistryPattern | RegistrySystem
export interface SelectionOptions {
  mode?: string
  now?: Date | string
  limit?: number
  ids?: string[]
  excludeIds?: string[]
  priorityIds?: string[]
}
export interface ObservationRow {
  system_id: string
  status: string
  affected_docs?: string[]
  summary?: string
}
export interface CoverageRow {
  system_id: string
  scope: string
  status: string
  verified_on?: string
  description?: string
  doc?: string
  claims?: string[]
  sources?: Array<{ url: string; accessed_at: string }>
}
export interface ObservationRecord {
  completed_at?: string
  started_at?: string
  observations?: ObservationRow[]
  coverage?: CoverageRow[]
  vendor_checks?: Array<{ vendor: string; release_notes: string; deprecations: string; pricing: string }>
}
export interface ObservationRun {
  file: string
  record: ObservationRecord
}
