import assert from 'node:assert/strict';
import { objectFixture, objectArrayFixture, stringFixture } from './json-fixtures.mjs';
import type { NativeAsset, NativeBlock, NativeDocument, NativeImage, NativeInline, NativeLink, MarkdownToken } from '../../scripts/lib/ios-types.d.mts';

function number(value: unknown): number { assert.equal(typeof value, 'number'); if (typeof value !== 'number') throw new Error('Expected number'); return value; }
function bool(value: unknown): boolean { assert.equal(typeof value, 'boolean'); if (typeof value !== 'boolean') throw new Error('Expected boolean'); return value; }
function asset(value: unknown): NativeAsset {
  const row = objectFixture(value);
  return { light: stringFixture(row.light), dark: stringFixture(row.dark), width: number(row.width), height: number(row.height), scale: number(row.scale), ...(row.baseline === undefined ? {} : {baseline: number(row.baseline)}) };
}
function image(value: Record<string, unknown>): NativeImage {
  return {asset: asset(value.asset), source: stringFixture(value.source), accessibility_text: stringFixture(value.accessibility_text)};
}
function target(value: unknown): NativeLink {
  const row = objectFixture(value);
  if (row.kind === 'article') return {kind: 'article', article_id: stringFixture(row.article_id), ...(row.heading_id === undefined ? {} : {heading_id: stringFixture(row.heading_id)})};
  assert.equal(row.kind, 'external');
  return {kind: 'external', url: stringFixture(row.url)};
}
function inlines(value: unknown): NativeInline[] { return objectArrayFixture(value).map(inline); }
function inline(row: Record<string, unknown>): NativeInline {
  switch (row.type) {
    case 'text': case 'code': return {type: row.type, text: stringFixture(row.text)};
    case 'soft_break': case 'hard_break': return {type: row.type};
    case 'math': return {type: row.type, ...image(row)};
    case 'link': return {type: row.type, children: inlines(row.children), target: target(row.target)};
    case 'strong': case 'emphasis': return {type: row.type, children: inlines(row.children)};
    default: throw new Error(`Unexpected inline fixture: ${String(row.type)}`);
  }
}
function blocks(value: unknown): NativeBlock[] { return objectArrayFixture(value).map(block); }
function block(row: Record<string, unknown>): NativeBlock {
  const id = stringFixture(row.id);
  switch (row.type) {
    case 'heading': return {id, type: row.type, heading_id: stringFixture(row.heading_id), level: number(row.level), inlines: inlines(row.inlines)};
    case 'paragraph': return {id, type: row.type, inlines: inlines(row.inlines)};
    case 'list': return {id, type: row.type, ordered: bool(row.ordered), start: number(row.start), items: objectArrayFixture(row.items).map(item => ({id: stringFixture(item.id), blocks: blocks(item.blocks)}))};
    case 'quote': return {id, type: row.type, blocks: blocks(row.blocks)};
    case 'code': return {id, type: row.type, language: stringFixture(row.language), text: stringFixture(row.text)};
    case 'math': case 'diagram': return {id, type: row.type, ...image(row)};
    case 'thematic_break': return {id, type: row.type};
    case 'table': {
      const table = objectFixture(row.table);
      assert.ok(Array.isArray(table.header) && Array.isArray(table.rows) && Array.isArray(table.alignments));
      return {id, type: row.type, table: {header: table.header.map(inlines), rows: table.rows.map((cells: unknown) => { assert.ok(Array.isArray(cells)); return cells.map(inlines); }), alignments: table.alignments.map(stringFixture)}};
    }
    default: throw new Error(`Unexpected block fixture: ${String(row.type)}`);
  }
}
export function nativeDocumentFixture(value: unknown): NativeDocument {
  const row = objectFixture(value);
  assert.equal(row.schema_version, 1);
  return {schema_version: 1, article_id: stringFixture(row.article_id), source_sha256: stringFixture(row.source_sha256), blocks: blocks(row.blocks)};
}

type Keys<T> = T extends T ? keyof T : never;
type CompleteUnion<T, All = T> = T extends T ? T & Partial<Record<Exclude<Keys<All>, keyof T>, never>> : never;
type ListItem = {id: string; blocks: NativeBlock[]; type?: never};
export type NativeFixtureNode = CompleteUnion<NativeBlock | NativeInline | ListItem>;
type Container = NativeDocument | NativeFixtureNode | readonly Container[];

/** Visit exactly the native nodes and list items whose identities are checked by the tests. */
export function nativeNodes(value: Container): NativeFixtureNode[] {
  if (Array.isArray(value)) return (value as readonly Container[]).flatMap(nativeNodes);
  const node = value as NativeDocument | NativeFixtureNode;
  if ('article_id' in node) return node.blocks.flatMap(nativeNodes);
  const result: NativeFixtureNode[] = [node];
  if (node.blocks) result.push(...node.blocks.flatMap(nativeNodes));
  if (node.inlines) result.push(...node.inlines.flatMap(nativeNodes));
  if (node.children) result.push(...node.children.flatMap(nativeNodes));
  if (node.items) result.push(...node.items.flatMap(nativeNodes));
  if (node.table) {
    result.push(...node.table.header.flatMap(cell => cell.flatMap(nativeNodes)));
    result.push(...node.table.rows.flatMap(row => row.flatMap(cell => cell.flatMap(nativeNodes))));
  }
  return result;
}

export function markdownNodes(values: readonly MarkdownToken[]): MarkdownToken[] {
  return values.flatMap(value => [value, ...markdownNodes(value.children ?? [])]);
}
