import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { createHash } from 'node:crypto'
import os from 'node:os'
import path from 'node:path'
import test, { type TestContext } from 'node:test'
import ts from 'typescript'
import { isolateGitForTests, fixtureGit } from '../helpers/isolated-git.mjs'
import { checkTypeCoverage, type Contract } from '../../scripts/check-type-coverage.mts'
isolateGitForTests()

function fixture(t: TestContext) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'type-coverage-'))
  t.after(() => { assert.equal(path.dirname(root), os.tmpdir()); assert(path.basename(root).startsWith('type-coverage-')); rmSync(root, {recursive:true,force:true}) })
  fixtureGit(['init','--quiet'], {cwd:root,encoding:'utf8'})
  const write = (name: string, text: string) => { mkdirSync(path.dirname(path.join(root,name)),{recursive:true});writeFileSync(path.join(root,name),text) }
  const compilerOptions = { strict:true,noEmit:true,checkJs:true,allowJs:true,target:'ES2022',module:'NodeNext',types:[] as string[] }
  const configure = (overrides: Record<string,unknown> = {}) => write('tsconfig.json',JSON.stringify({compilerOptions:{...compilerOptions,...overrides},include:['checked/**/*']}))
  configure()
  write('checked/entry.mts','export const value: number = 1\n')
  const contract: Contract = {schema_version:1,typescript:ts.version,projects:[{id:'fixture',cwd:'.',config:'tsconfig.json'}],exceptions:[],wrappers:[]}
  return {root,write,configure,contract,check:()=>checkTypeCoverage(root,{contract,compilerForProject:()=>ts})}
}

test('an untracked source outside all strict programs fails coverage',t=>{
  const f=fixture(t);assert.equal(f.check().verified,true)
  f.write('new-source.mjs','export const newlyAdded = 1\n')
  const result=f.check();assert.equal(result.verified,false);assert.equal(result.counts.unclassified,1);assert(result.problems.some(value=>value.includes('new-source.mjs')))
})
test('comment type suppression fails while quoted documentation does not',t=>{
  const f=fixture(t);f.write('checked/entry.mts',`export const note = "@ts-ignore is forbidden"\n`);assert.equal(f.check().verified,true)
  for(const directive of ['@ts-nocheck','@ts-ignore']){f.write('checked/entry.mts',`// ${directive}\nexport const value = 1\n`);assert(f.check().problems.some(value=>value.includes('Type suppression')))}
  f.write('checked/entry.mts','const value = `${1}`\n// @ts-ignore\nexport const hidden: string = 1\n');assert(f.check().problems.some(value=>value.includes('Type suppression')))
  f.write('checked/entry.mts','export const value = 1\n');f.write('checked/view.tsx','export const view = <div>// @ts-ignore is visible JSX text</div>\n');assert.equal(f.check().verified,true)
})
test('same-stem declaration cannot stand in for checking a JavaScript body',t=>{
  const f=fixture(t);f.write('checked/shadowed.mjs','export const value = missingAtRuntime\n');f.write('checked/shadowed.d.mts','export const value: number\n')
  const result=f.check();assert.equal(result.verified,false);assert(result.problems.includes('Unclassified source: checked/shadowed.mjs'))
})
test('compatibility wrappers are separate from checked implementations and have a fixed AST',t=>{
  const f=fixture(t);f.write('checked/entry.mjs',`export * from './entry.mts'\n`);f.contract.wrappers.push({path:'checked/entry.mjs',target:'checked/entry.mts',kind:'reexport'})
  const result=f.check();assert.equal(result.verified,true);assert.equal(result.counts.implementations,1);assert.equal(result.counts.wrappers,1)
  f.write('checked/entry.mjs',`export * from './entry.mts'\nconst hidden = missingAtRuntime\n`);assert(f.check().problems.some(value=>value.includes('fixed AST')))
})
test('frozen source requires its original byte hash and a checked declaration boundary',t=>{
  const f=fixture(t),text='export const frozen = 1\n';f.write('frozen.mjs',text);f.write('checked/frozen.d.mts','export const frozen: number\n')
  f.contract.exceptions.push({path:'frozen.mjs',kind:'frozen',sha256:createHash('sha256').update(text).digest('hex'),boundary:'checked/frozen.d.mts',reason:'immutable fixture'})
  assert.equal(f.check().verified,true);assert.equal(f.check().counts.frozen,1)
  f.write('frozen.mjs',text+'// changed\n');assert(f.check().problems.some(value=>value.includes('Exception hash changed')))
  f.contract.exceptions[0].boundary='absent.d.mts';assert(f.check().problems.some(value=>value.includes('declaration boundary')))
})
test('JavaScript with checkJs disabled and relaxed strict options cannot claim checked coverage',t=>{
  const f=fixture(t);f.write('checked/javascript.mjs','export const value = 1\n');f.configure({checkJs:false});assert(f.check().problems.includes('Unclassified source: checked/javascript.mjs'))
  f.configure({strictNullChecks:false});assert(f.check().problems.some(value=>value.includes('strict/noEmit')))
  f.configure({noCheck:true});assert(f.check().problems.some(value=>value.includes('without noCheck')))
})
