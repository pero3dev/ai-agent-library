export interface GitConventionContract {
  schema_version: 1
  subject: {
    types: string[]
    scopes: string[]
    max_codepoints: number
    japanese_required: true
    breaking_marker: false
  }
  commit_sections: string[]
  pr_sections: string[]
  agents: Record<string, string>
  agent_values: string[]
  automation: { subjects: string[]; generated_by: string }
  range_policy: 'canonical-squash-and-automation'
  branch_prefixes: string[]
  base_branch: string
}
export interface PrMetadata {
  title?: unknown
  body?: unknown
  branch?: unknown
  headRefName?: unknown
  baseRefName?: unknown
}
export interface CommitFormat {
  type?: string
  scope?: string
  summary?: string
  reason?: string
  validation?: string
  impact?: string
  agent?: string
  generatedBy?: string
}
export interface CommitRange {
  root?: string
  base?: string
  head?: string
  pr?: PrMetadata
}
