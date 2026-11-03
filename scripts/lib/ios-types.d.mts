export type MarkdownToken = import('markdown-it/lib/token.mjs').default
export interface IOSArticle {
  id: string
  source_path: string
  source_sha256: string
  normalized_digest: string
  title: string
  category: string
  level: string
  last_updated: string
  body: string
  is_test_fixture?: boolean
}
export interface IOSHeading { id: string; title: string; level: number }
export interface IOSSelection {
  schema_version: 1
  articles: string[]
  audio_article: string
  diagram_descriptions?: Record<string, string>
}
export type IOSSelected = Set<string> | Map<string, string>
export interface IOSAudioDeclaration {
  episode_id: string
  article_id: string
  article_path: string
  audio_url: string
  audio_sha256: string
  source_digest: string
  script_sha256: string
  credit: string
  license_url: string
}
export interface IOSChapter { id: string; title: string; start_seconds: number }
export interface IOSAudioEpisode {
  id: string
  article_path: string
  audio_url: string
  audio_sha256: string
  source_digest: string
  script_sha256?: string
  attribution: string
  part?: number
  parts: number
  title: string
  duration_seconds: number
  voices: { license_url: string }[]
  chapters: IOSChapter[]
}
export interface IOSAudioCatalog { schema_version: 1; episodes: IOSAudioEpisode[] }
export interface IOSContentOptions {
  root?: string
  output?: string
  dependencies?: IOSRenderDependencies
  selection?: unknown
}
export interface IOSNativeOptions {
  root?: string
  output?: string
  fixtures?: boolean
  allPublished?: boolean
  publishedLibrary?: boolean
  dependencies?: IOSNativeDependencies
  selection?: unknown
  trustedAudioDeclarations?: readonly IOSAudioDeclaration[]
}
export interface IOSRenderDependencies {
  mathAssets: Map<string, Buffer>
  renderMath(source: string, displayMode: boolean): string
  renderDiagrams(diagrams: Map<string, string>): Promise<Map<string, Buffer>>
}
export interface IOSNativeDependencies {
  renderAssets(requests: Map<string, NativeImageRequest>): Promise<NativeRenderedAssets>
}
export interface NativeImageRequest { key: string; kind: 'math' | 'diagram'; source: string; display: boolean }
export interface NativeAsset { light: string; dark: string; width: number; height: number; scale: number; baseline?: number }
export interface NativeAssetMetadata { asset: NativeAsset; accessibility_text: string }
export interface NativeRenderedAssets { files: Map<string, Buffer>; metadata: Map<string, NativeAssetMetadata> }
export type NativeLink = { kind: 'article'; article_id: string; heading_id?: string } | { kind: 'external'; url: string }
export interface NativeImage { asset: NativeAsset; source: string; accessibility_text: string; [key: symbol]: string | undefined }
export type NativeInline =
  | { type: 'text' | 'code'; text: string }
  | { type: 'soft_break' | 'hard_break' }
  | ({ type: 'math' } & NativeImage)
  | { type: 'link'; children: NativeInline[]; target: NativeLink }
  | { type: 'strong' | 'emphasis'; children: NativeInline[] }
export type NativeBlockValue =
  | { type: 'heading'; heading_id: string; level: number; inlines: NativeInline[] }
  | { type: 'paragraph'; inlines: NativeInline[] }
  | { type: 'list'; ordered: boolean; start: number; items: { id: string; blocks: NativeBlock[] }[] }
  | { type: 'quote'; blocks: NativeBlock[] }
  | { type: 'code'; language: string; text: string }
  | ({ type: 'math' | 'diagram' } & NativeImage)
  | { type: 'table'; table: { header: NativeInline[][]; rows: NativeInline[][][]; alignments: string[] } }
  | { type: 'thematic_break' }
export type NativeBlock = NativeBlockValue & { id: string }
export interface NativeDocument { schema_version: 1; article_id: string; source_sha256: string; blocks: NativeBlock[] }
export interface NativeRect { left: number; top: number; right: number; bottom: number }
export interface NativePaint { bounds: NativeRect; clips: { bounds: NativeRect; x: boolean; y: boolean }[] }
export interface LearningArticle { id: string; source_path: string; source_sha256: string; headings: Pick<IOSHeading, 'id'>[] }
export type LearningTarget = { type: 'external'; url: string } | { type: 'article'; article_id: string; heading_id?: string } | { type: 'chapter'; chapter_id: string }
export type LearningInline = { type: 'text'; text: string } | { type: 'link'; text: string; target: LearningTarget }
export interface LearningStep { inlines: LearningInline[] }

/** Minimal browser protocol consumed only by build-time rendering. */
export interface RenderRoute { request(): { url(): string }; continue(): Promise<void>; abort(): Promise<void> }
export interface RenderPage {
  route(pattern: string, action: (route: RenderRoute) => Promise<void>): Promise<void>
  goto(url: string): Promise<unknown>
  evaluate<R>(action: () => R | Promise<R>): Promise<Awaited<R>>
  evaluate<A, R>(action: (argument: A) => R | Promise<R>, argument: A): Promise<Awaited<R>>
  locator(selector: string): { screenshot(options: { omitBackground: boolean; animations: 'disabled' }): Promise<Buffer> }
}
export interface RenderBrowser {
  newPage(options: { viewport: { width: number; height: number }; deviceScaleFactor?: number }): Promise<RenderPage>
  close(): Promise<void>
}
export interface RenderChromium { launch(options: { channel?: string }): Promise<RenderBrowser> }
export interface RenderMermaid {
  initialize(options: Record<string, unknown>): void
  render(id: string, source: string, host: { innerHTML: string }): Promise<{ svg: string }>
}
declare global {
  interface Window { mermaid: RenderMermaid }
  var mermaid: RenderMermaid
}
