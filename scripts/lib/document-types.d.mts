/** Shared, erased contracts for the dependency-free documentation tools. */
export interface SourceDocument {
  abs: string
  repoRel: string
  section: string
  isReadme: boolean
}

export interface FrontMatterField {
  key: string
  value: string
  line: number
}

export interface SourceIssue {
  line: number
  message: string
}

export interface FrontMatter {
  fields: FrontMatterField[]
  errors: SourceIssue[]
  endLine: number
  unclosed: boolean
}

export type FenceKind = 'open' | 'close' | 'content' | null
export type LineVisitor = (line: string, lineNo: number, inFence: boolean, kind: FenceKind) => void
export type DirectoryEntryCache = Map<string, Set<string> | null>
export type LocalDestination =
  | { external: true; error?: never; pathname?: never; fragment?: never; suffix?: never }
  | { error: string; external?: false; pathname?: never; fragment?: never; suffix?: never }
  | { pathname: string; fragment: string; suffix: string; error?: never; external?: false }

export type ValidationCheck = 'front-matter' | 'h2' | 'todo' | 'filename' | 'fence'
export interface ValidationIssue extends SourceIssue {
  check: ValidationCheck
}

export interface MarkdownLink {
  target: string
  line: number
  inTable: boolean
  label: string
}

export interface MarkdownHeading {
  text: string
  id: string
  level: number
  line: number
}

export interface ParsedMarkdown {
  links: MarkdownLink[]
  headings: MarkdownHeading[]
  anchors: Set<string>
}

export interface MarkdownArticle {
  file: string
  level: string
  parsed: ParsedMarkdown
}

export interface SourceText {
  file: string
  text: string
}

export interface ManifestChange {
  path: string
  oldMode: string
  oldBlob: string
}

export interface PublicRecordBaseline {
  sha256: string
  reason: string
  privacy_exception?: boolean
}

export interface PublicRecordsContract {
  public_records?: {
    max_bytes: number
    extensions: string[]
    legacy?: Record<string, PublicRecordBaseline>
  }
}

export interface LinkTarget {
  abs: string
  repoRel: string
}

export interface LinkOptions {
  additionalFiles?: string[]
}

export interface LinkResult {
  problems: string[]
  checkedLinks: number
  checkedFiles: number
}
