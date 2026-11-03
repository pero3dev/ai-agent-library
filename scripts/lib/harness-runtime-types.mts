import type { RunBudget } from './harness-state.mts';
import type { LockOwner, budgetStatus, queuedRuns, recoverGeneration } from './harness-state.mts';
import type { GithubVerification, GithubVerificationOptions } from './github-evidence.mts';

export interface HarnessProfile {
  allowed_files: string[];
  allowed_roots: string[];
  extensions: string[];
  completion: string;
  change_manifests?: boolean;
  root_markdown?: boolean;
  review_required?: boolean;
  runtime?: string;
}
export interface HarnessContract {
  profile: string;
  goal: string;
  authorization: string;
  owned_paths: string[];
  task_key?: string;
  completion?: string;
}
export interface HarnessBudget extends RunBudget { deadline_at: string; save_margin_seconds: number }
export interface HarnessReviewRecord { decision?: string; tree_sha?: string; reviewer_run_id?: string }
export interface LocalEvidence {
  passed?: boolean;
  verified?: boolean;
  type?: string;
  command?: string;
  started_at?: string;
  completed_at?: string;
  node?: string;
  commit_sha?: string;
  tree_sha?: string;
}
export interface HarnessRecord extends HarnessContract {
  schema_version: 1;
  run_id: string;
  completion: string;
  status: string;
  queue_state: string;
  started_at: string;
  base_sha: string;
  worktree: string;
  branch: string | null;
  budget: HarnessBudget;
  attempt_id?: string;
  notes: unknown;
  pending: unknown;
  saved_at?: string;
  completed_at?: string;
  generation?: number;
  snapshot_commit?: string | null;
  snapshot_head?: string | null;
  next_eligible_at?: string | null;
  wait_reason?: string | null;
  pr_url?: string | null;
  head_sha?: string | null;
  publication_urls?: Array<string | { url: string; includes?: string }>;
  review?: HarnessReviewRecord | null;
  verification?: { local?: LocalEvidence; github?: unknown };
  github_verification?: unknown;
}
export interface HarnessSummary {
  run_id: string;
  task_key?: string;
  status: string;
  queue_state?: string;
  started_at: string;
  next_eligible_at?: string | null;
}
export interface HarnessState { schema_version: 1; generation?: number; runs: Record<string, HarnessSummary> }
export interface PullRequestState { state?: string; headRefOid?: string }
export interface HarnessDependencies {
  now?: Date;
  runLocalCheck?: (root: string, options: { timeoutMs: number }) => LocalEvidence;
  verifyGithubEvidence?: (options: GithubVerificationOptions) => GithubVerification;
  readPullRequest?: (root: string, url: string) => PullRequestState;
}
/** JSON result envelope; absence is explicit for command-specific fields. */
export interface HarnessRunResult extends Partial<HarnessRecord> {
  command?: string;
  storage?: string;
  lock?: LockOwner | null;
  recovery?: ReturnType<typeof recoverGeneration>;
  compatibility?: { schema_version?: unknown; supported?: boolean; migration_required?: boolean; automatic_migration: boolean };
  queue?: ReturnType<typeof queuedRuns<HarnessRecord>>;
  records?: HarnessRecord[];
  state?: HarnessState;
  next?: string;
  checkpoint?: string;
  dry_run?: boolean;
  external_verification_required?: boolean;
  outcome?: string;
  reconciliation?: HarnessReconciliation;
  restored?: boolean;
  budget_status?: ReturnType<typeof budgetStatus>;
  released?: boolean;
  verified?: boolean;
  record?: HarnessRecord;
  finished?: boolean;
}
export interface HarnessReconciliation {
  action: string;
  current_head: string;
  current_main_sha: string | null;
  base_sha: string;
  branch_head: string | null;
  snapshot_commit: string | null;
  snapshot_head: string | null;
  orphan_snapshot: boolean;
  clean: boolean;
  pull_request: PullRequestState | null;
}
