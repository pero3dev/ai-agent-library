/** Static counterparts of scripts/schemas/freshness-result.schema.json. */
export interface SourceReference { url: string; accessed_at: string; published_at?: string; effective_at?: string }
export interface FreshnessObservation { system_id: string; status: 'changed' | 'unchanged' | 'unverifiable' | 'failed'; summary: string; sources: SourceReference[]; affected_docs: string[] }
export interface FreshnessCoverage { system_id: string; scope: 'declared-system'; status: 'verified'; verified_on: string; description: string }
export interface VendorCheck {
  vendor: 'anthropic' | 'openai' | 'google'
  release_notes: 'changed' | 'unchanged' | 'not_checked'
  deprecations: 'changed' | 'unchanged' | 'not_checked'
  pricing: 'changed' | 'unchanged' | 'not_checked'
  summary: string
  sources: SourceReference[]
}
export interface FreshnessChange { path: string; kind: 'substantive' | 'reference-only' | 'supporting'; observation_indices: number[]; summary: string }
export interface FreshnessReview { verdict: 'approved' | 'changes_requested'; risk: 'low' | 'requires-human'; independent: true; reviewer_run_id: string; reviewed_at: string; content_digest: string }
export interface FreshnessManifest {
  schema_version: 2; run_id: string; base_sha: string; writer_run_id: string; started_at: string; completed_at: string
  systems: string[]; observations: FreshnessObservation[]; changes: FreshnessChange[]; review: FreshnessReview
  coverage?: FreshnessCoverage[]; vendor_checks?: VendorCheck[]
}
export interface PublicObservation {
  schema_version: 1; run_id: string; started_at: string; completed_at: string; systems: string[]
  observations: FreshnessObservation[]; coverage: FreshnessCoverage[]; vendor_checks: VendorCheck[]
}
