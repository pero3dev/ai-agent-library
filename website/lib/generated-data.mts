import type { PagesMetadata, Section } from './content-types.ts'

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const nullableText = (value: unknown) => value === null || typeof value === 'string'

export function assertStringArray(value: unknown, label: string): asserts value is string[] {
  if (!Array.isArray(value) || !value.every((item: unknown) => typeof item === 'string')) throw new Error(`Invalid generated ${label}`)
}

export function assertPagesMetadata(value: unknown): asserts value is PagesMetadata {
  if (!record(value) || !Object.values(value).every(page => record(page) && typeof page.title === 'string' && typeof page.description === 'string' && nullableText(page.last_updated) && typeof page.source_path === 'string')) throw new Error('Invalid generated page metadata')
}

export function assertSections(value: unknown): asserts value is Section[] {
  if (!Array.isArray(value) || !value.every((section: unknown) => record(section) && ['slug', 'num', 'title', 'description', 'route'].every(field => typeof section[field] === 'string') && typeof section.count === 'number' && Number.isInteger(section.count) && section.count >= 0)) throw new Error('Invalid generated section metadata')
}
