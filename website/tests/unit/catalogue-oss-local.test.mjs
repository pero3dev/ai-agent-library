import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdx from 'remark-mdx'
import remarkStringify from 'remark-stringify'
import { CATALOGUE_OSS_LOCAL_STAGES, catalogueOssLocalFrame, assetAcceptance, localCloudRoute } from '../../lib/catalogue-oss-local-model.mjs'
import { CATALOGUE_OSS_LOCAL_BINDINGS } from '../../lib/catalogue-oss-local-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['CatalogueOssLocalWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(CATALOGUE_OSS_LOCAL_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, article.endsWith('/llm-landscape.md') ? 3 : 2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, CATALOGUE_OSS_LOCAL_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(CATALOGUE_OSS_LOCAL_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=catalogueOssLocalFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>catalogueOssLocalFrame(id,NaN),TypeError);
 }
 assert.throws(()=>catalogueOssLocalFrame('unknown',0),TypeError);
});
test('asset acceptance cannot omit the current version intended use provenance or maintenance and is not legal approval',()=>{
 for(const versionVerified of [false,true])for(const useCompared of [false,true])for(const provenanceKnown of [false,true])for(const maintenanceAssessed of [false,true])assert.deepEqual(assetAcceptance({versionVerified,useCompared,provenanceKnown,maintenanceAssessed}),{reviewCandidate:versionVerified&&useCompared&&provenanceKnown&&maintenanceAssessed,legalComplianceGuaranteed:false,deploymentExecuted:false});
 assert.throws(()=>assetAcceptance({versionVerified:true,useCompared:true,provenanceKnown:true}),TypeError);
});
test('quality failure cannot authorize external transmission while offline or data use is unapproved',()=>{
 for(const localQualityAccepted of [false,true])for(const networkAvailable of [false,true])for(const externalUseAllowed of [false,true])assert.deepEqual(localCloudRoute({localQualityAccepted,networkAvailable,externalUseAllowed}),{next:localQualityAccepted?'local':networkAvailable&&externalUseAllowed?'confirm-cloud-route':'hold-and-confirm',externalTransmissionExecuted:false,qualityGuaranteed:false});
 assert.throws(()=>localCloudRoute({localQualityAccepted:false,networkAvailable:true}),TypeError);
});
