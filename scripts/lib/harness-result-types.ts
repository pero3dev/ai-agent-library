export interface HarnessChange {
  path: string; kind: 'new' | 'substantive' | 'reference-only' | 'editorial' | 'status-only' | 'relocate' | 'remove'
  previous_path?: string; summary: string
}
export interface HarnessTask { id: string; artifacts: string[] }
export interface RoadmapTask extends HarnessTask { status: string }
export interface HarnessSource { url: string; accessed_at: string; claim: string; affected_docs: string[] }
export interface HarnessReview { verdict: 'approved' | 'changes_requested'; independent: true; reviewer_run_id: string; reviewed_at: string; content_digest: string }
export interface HarnessManifest {
  schema_version: 1; run_id: string; base_sha: string; writer_run_id: string; completed_at: string
  changes: HarnessChange[]; tasks: HarnessTask[]; sources: HarnessSource[]; review: HarnessReview | null
}
