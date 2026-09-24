import assert from 'node:assert/strict'
import test from 'node:test'
import { speculativeDistributions, selectSpeculativeToken, speculativeAcceptance, acceptsSpeculativeToken,
  speculativeResidual, simulateSpeculativeBlock, speculativeFrame } from '../../lib/inference-speculative-model.mjs'

// Independent target/proposal oracle: no model constants or transition helpers.
const V = 'ABCD'
const P = [[1,2,6,1], [2,1,3,4], [4,1,2,3], [3,2,1,4]]
const Q = [[4,3,2,1], [1,4,3,2], [2,1,4,3], [1,3,4,2]]
const state = prefix => prefix === 'AB' ? 0 : ({ A: 1, B: 2, C: 3, D: 0 })[prefix.at(-1)]
const approximate = (a, b) => {
  assert.equal(a.length, b.length)
  a.forEach((value, i) => assert.ok(Math.abs(value - b[i]) < 1e-12, `${value} != ${b[i]}`))
}
const values = tokens => tokens.map(token => token.value).join('')
const midpoint = (p, i) => p.slice(0, i).reduce((a, b) => a + b, 0) + p[i] / 2

test('all 341 prefixes have their own oracle distribution and preserve local mass', () => {
  let count = 0
  const visit = prefix => {
    const { p, q } = speculativeDistributions(prefix), r = state(prefix)
    assert.deepEqual(p, P[r].map(n => n / 10)); assert.deepEqual(q, Q[r].map(n => n / 10))
    const { mass, probabilities } = speculativeResidual(p, q)
    approximate(p.map((x, i) => Math.min(x, q[i]) + mass * probabilities[i]), p)
    for (let i = 0; i < 4; i++) assert.equal(speculativeAcceptance(p, q, i), Math.min(1, p[i] / q[i]))
    count++
    if (prefix.length < 6) for (const token of V) visit(prefix + token)
  }
  visit('AB'); assert.equal(count, 341)
})

test('five stochastic paths and three greedy paths use the right rejection and bonus prefix', () => {
  for (const [mode, caseId, options, candidate, rejected, output] of [
    ['sampling', 'first-reject', {}, 'ABC', 0, 'C'],
    ['sampling', 'middle-reject', {}, 'ABC', 1, 'AD'],
    ['sampling', 'all-accept', {}, 'ABC', null, 'ABCD'],
    ['sampling', 'all-accept', { acceptanceDraws: [.1,.1,.75] }, 'ABC', 2, 'ABA'],
    ['sampling', 'all-accept', { draftCount: 2 }, 'AB', null, 'ABD'],
    ['greedy', 'first-reject', {}, 'ABC', 0, 'C'],
    ['greedy', 'middle-reject', {}, 'CCC', 1, 'CD'],
    ['greedy', 'all-accept', {}, 'CDC', null, 'CDCD']
  ]) {
    const result = simulateSpeculativeBlock({ mode, caseId, ...options })
    assert.equal(values(result.draft), candidate)
    assert.equal(result.firstRejectedIndex, rejected)
    assert.equal(values(result.committedSuffix), output)
    assert.equal(values(result.nextPrefix), 'AB' + output)
    assert.equal(result.acceptedDraftCount, rejected ?? candidate.length)
    result.draft.forEach((token, i) => assert.equal(token.prefixBefore, 'AB' + candidate.slice(0, i)))
    if (rejected !== null) {
      assert.equal(result.bonus, null)
      assert.equal(result.correction.prefixBefore, 'AB' + candidate.slice(0, rejected))
      assert.ok(result.draft.slice(rejected + 1).every(token => token.status === 'discarded' && token.acceptanceDraw === null))
    } else { assert.equal(result.correction, null); assert.equal(result.bonus.prefixBefore, 'AB' + candidate) }
    if (mode === 'greedy') for (const token of result.draft) {
      assert.equal(token.targetDistribution.filter(n => n === 1).length, 1)
      assert.equal(token.proposalDistribution.filter(n => n === 1).length, 1)
      assert.notDeepEqual(token.targetDistribution, token.targetReference)
      assert.equal(token.acceptanceDraw, null)
    }
  }
})

test('zero support, zero residual, CDF and acceptance endpoints have explicit behavior', () => {
  const p = [.1,.2,.6,.1], q = [0,.5,.5,0]
  const residual = speculativeResidual(p, q)
  assert.ok(Math.abs(residual.mass - .3) < 1e-12)
  approximate(residual.probabilities, [1/3,0,1/3,1/3])
  assert.equal(selectSpeculativeToken(q, 0), 1)
  assert.equal(selectSpeculativeToken(q, .5), 2)
  assert.equal(selectSpeculativeToken(q, 1 - Number.EPSILON), 2)
  assert.throws(() => speculativeAcceptance(p, q, 0))
  for (const u of [0, .4, 1 - Number.EPSILON]) assert.equal(acceptsSpeculativeToken(p, p, 0, u), true)
  assert.deepEqual(speculativeResidual(p, p), { mass: 0, probabilities: null })
  assert.equal(acceptsSpeculativeToken([0,0,1,0], [.5,.5,0,0], 0, 0), false)
  assert.equal(acceptsSpeculativeToken(p, [.4,.3,.2,.1], 0, .25), false)
  assert.equal(acceptsSpeculativeToken(p, [.4,.3,.2,.1], 0, .25 - Number.EPSILON), true)
  assert.equal(selectSpeculativeToken([.5,.25,.125,.125], .75), 2)
})

test('unknown prefixes, modes, probabilities, sparse arrays and invalid draws are rejected', () => {
  for (const prefix of ['', 'A', 'BA', 'AC', 'ABZ', ['A','B'], null]) assert.throws(() => speculativeDistributions(prefix))
  for (const p of [[], [1,0,0], [1,0,0,NaN], [1,-1,1,0], [0,0,0,0], [1,,,]]) assert.throws(() => speculativeResidual(p, [.25,.25,.25,.25]))
  for (const u of [-1, 1, NaN, Infinity, undefined]) assert.throws(() => selectSpeculativeToken([.25,.25,.25,.25], u))
  for (const options of [{mode:'unknown'}, {caseId:'unknown'}, {draftCount:0}, {draftCount:4}, {proposalDraws:[.2]},
    {acceptanceDraws:[.1,,.4]}, {correctionDraw:1}, {bonusDraw:-1}, {prefix:'ABX'}]) assert.throws(() => simulateSpeculativeBlock(options))
  for (const tokenId of [-1,4,.5,NaN,'A']) assert.throws(() => speculativeAcceptance([.25,.25,.25,.25], [.25,.25,.25,.25], tokenId))
})

test('accepted occurrences keep identity; corrections and bonus are new, and rewinds are pure', () => {
  for (const caseId of ['first-reject','middle-reject','all-accept']) {
    const result = simulateSpeculativeBlock({caseId})
    const ids = result.nextPrefix.map(token => token.occurrenceId)
    assert.equal(new Set(ids).size, ids.length)
    for (const token of result.draft) assert.equal(ids.includes(token.occurrenceId), token.status === 'accepted')
    assert.notEqual(result.initialPrefix[0].occurrenceId, result.draft[0].occurrenceId)
    assert.equal(result.initialPrefix[0].tokenId, result.draft[0].tokenId)
    assert.deepEqual(result, simulateSpeculativeBlock({caseId}))
  }
  const options = {mode:'greedy',caseId:'all-accept'}
  for (const phase of [0,.49,.5,1,1.499999,1.5,2,2.499999,2.5,3,3.499999,3.5,4,4.499999,4.5,5].reverse()) {
    const frame = speculativeFrame(phase, options), stage = Math.round(phase)
    assert.equal(frame.stage, stage)
    assert.equal(frame.mode, stage === 2 || stage === 5 ? 'greedy' : 'sampling')
    assert.equal(frame.caseId, stage < 2 ? 'middle-reject' : 'all-accept')
    assert.deepEqual(frame, speculativeFrame(phase, options))
    if (stage < 2) assert.equal(frame.visibleSuffix.length, 0)
    if (stage === 3) assert.ok(frame.visibleSuffix.every(token => token.origin === 'draft'))
  }
  assert.equal(speculativeFrame(4, options).mode, 'sampling')
  assert.throws(() => speculativeFrame(NaN))
  assert.throws(() => speculativeFrame(4,{mode:'other'}))
})

// Exact reference branch weights are independent of the Number model. The model
// supplies only its actual emitted sequence for every positive branch.
const gcd = (a,b) => b ? gcd(b,a%b) : a
const fraction = (n,d=1n) => { n=BigInt(n); d=BigInt(d); const g=gcd(n,d); return [n/g,d/g] }
const add = (a,b) => fraction(a[0]*b[1]+b[0]*a[1],a[1]*b[1])
const mul = (a,b) => fraction(a[0]*b[0],a[1]*b[1])
const one = fraction(1), zero = fraction(0)
const push = (map,key,value) => map.set(key,add(map.get(key)??zero,value))
const sum = values => [...values].reduce(add,zero)

test('all 1364 complete sequences preserve the target law across block restarts, using rational branch enumeration', () => {
  const kernels = new Map()
  const kernelFor = prefix => {
    if (kernels.has(prefix)) return kernels.get(prefix)
    const kernel = new Map()
    const visit = (candidate,weight,draws) => {
      if (candidate.length < 3) {
        const q=Q[state(prefix+candidate)]
        for (let i=0;i<4;i++) visit(candidate+V[i],mul(weight,fraction(q[i],10)),[...draws,midpoint(q.map(x=>x/10),i)])
        return
      }
      let acceptedWeight = one
      const acceptDraws=[]
      for (let i=0;i<3;i++) {
        const p=P[state(prefix+candidate.slice(0,i))], q=Q[state(prefix+candidate.slice(0,i))], x=V.indexOf(candidate[i])
        const a=fraction(Math.min(p[x],q[x]),q[x]), alpha=Number(a[0])/Number(a[1])
        const d=p.map((n,j)=>Math.max(n-q[j],0)), z=d.reduce((a,b)=>a+b)
        if (alpha<1) for (let y=0;y<4;y++) if(d[y]) {
          const u=[...acceptDraws,(alpha+1)/2,...Array(2-i).fill(0)]
          const result=simulateSpeculativeBlock({prefix,proposalDraws:draws,acceptanceDraws:u,correctionDraw:midpoint(d.map(n=>n/z),y)})
          assert.equal(result.firstRejectedIndex,i)
          assert.equal(result.correction.prefixBefore,prefix+candidate.slice(0,i))
          assert.equal(values(result.draft),candidate)
          push(kernel,values(result.committedSuffix),mul(mul(mul(weight,acceptedWeight),fraction(a[1]-a[0],a[1])),fraction(d[y],z)))
        }
        acceptedWeight=mul(acceptedWeight,a); acceptDraws.push(alpha/2)
      }
      const p=P[state(prefix+candidate)]
      for (let y=0;y<4;y++) {
        const result=simulateSpeculativeBlock({prefix,proposalDraws:draws,acceptanceDraws:acceptDraws,bonusDraw:midpoint(p.map(n=>n/10),y)})
        assert.equal(result.firstRejectedIndex,null)
        assert.equal(result.bonus.prefixBefore,prefix+candidate)
        push(kernel,values(result.committedSuffix),mul(mul(weight,acceptedWeight),fraction(p[y],10)))
      }
    }
    visit('',one,[]); assert.deepEqual(sum(kernel.values()),one); kernels.set(prefix,kernel)
    return kernel
  }
  const cache=new Map()
  const emitted=(prefix,count)=>{
    if(!count)return new Map([['',one]])
    const key=prefix+':'+count
    if(cache.has(key))return cache.get(key)
    const out=new Map()
    for(const [tokens,w] of kernelFor(prefix)) {
      if(tokens.length>=count)push(out,tokens.slice(0,count),w)
      else for(const [tail,v]of emitted(prefix+tokens,count-tokens.length))push(out,tokens+tail,mul(w,v))
    }
    cache.set(key,out);return out
  }
  let compared=0
  for(let length=1;length<=5;length++) {
    const actual=emitted('AB',length)
    const direct=(suffix,weight)=>{
      if(suffix.length===length){assert.deepEqual(actual.get(suffix),weight,suffix);compared++;return}
      const p=P[state('AB'+suffix)]
      for(let i=0;i<4;i++)direct(suffix+V[i],mul(weight,fraction(p[i],10)))
    }
    direct('',one);assert.deepEqual(sum(actual.values()),one)
  }
  assert.equal(compared,1364)
})
