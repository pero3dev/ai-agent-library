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
import { FRAMEWORK_MODEL_TUNING_STAGES, frameworkModelTuningFrame, frameworkMigration, TUNING_CONDITIONS, tuningCandidate, modelConditions } from '../../lib/framework-model-tuning-model.mjs'
import { FRAMEWORK_MODEL_TUNING_BINDINGS } from '../../lib/framework-model-tuning-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['FrameworkModelTuningWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(FRAMEWORK_MODEL_TUNING_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, FRAMEWORK_MODEL_TUNING_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(FRAMEWORK_MODEL_TUNING_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=frameworkModelTuningFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>frameworkModelTuningFrame(id,NaN),TypeError);
 }
 assert.throws(()=>frameworkModelTuningFrame('unknown',0),TypeError);
});
test('migration needs separated tools prompts evaluation and a recorded version without executing a migration',()=>{
 for(const toolsIndependent of [false,true])for(const promptsIndependent of [false,true])for(const evaluationIndependent of [false,true])for(const versionRecorded of [false,true])assert.deepEqual(frameworkMigration({toolsIndependent,promptsIndependent,evaluationIndependent,versionRecorded}),{verificationCandidate:toolsIndependent&&promptsIndependent&&evaluationIndependent&&versionRecorded,migrationExecuted:false});
 assert.throws(()=>frameworkMigration({toolsIndependent:true,promptsIndependent:true,evaluationIndependent:true}),TypeError);
});
test('all seven FT prerequisites are explicit and none can be skipped or converted to training or quality guarantees',()=>{
 for(let mask=0;mask<128;mask++){const state=Object.fromEntries(TUNING_CONDITIONS.map((key,i)=>[key,Boolean(mask&(1<<i))]));assert.deepEqual(tuningCandidate(state),{evaluationCandidate:mask===127,trainingExecuted:false,qualityGuaranteed:false});}
 for(const missing of TUNING_CONDITIONS){const state=Object.fromEntries(TUNING_CONDITIONS.map(key=>[key,true]));delete state[missing];assert.throws(()=>tuningCandidate(state),TypeError);}
});
test('unknown modal provision or evaluation never becomes a deployable model and unavailable conditions need an alternative',()=>{
 for(const modality of ['unknown','yes','no'])for(const provision of ['unknown','yes','no'])for(const evaluation of ['unknown','yes','no']){const values=[modality,provision,evaluation];assert.deepEqual(modelConditions({modality,provision,evaluation}),{next:values.includes('no')?'alternative':values.includes('unknown')?'confirm':'evaluate-candidate',deploymentExecuted:false});}
 assert.throws(()=>modelConditions({modality:'yes',provision:'yes'}),TypeError);
});
