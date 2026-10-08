import assert from 'node:assert/strict'
import test from 'node:test'
import { datedPlans } from '../../scripts/deadline-report.mjs'
const options = { today: '2026-10-03', file: 'docs/sample.md' }
test('expired plans and upcoming 30 day events include deadlines without asserting completion', () => {
  const rows = datedPlans('2026-10-02 に廃止予定です。\n2026-10-26 開始予定です。\n2026-11-03 終了予定です。\n2026-09-30 EOL と案内されています。', options)
  assert.deepEqual(rows.map(row => [row.date, row.status]), [['2026-10-02', 'expired'], ['2026-10-26', 'upcoming'], ['2026-09-30', 'expired']])
  assert.ok(rows.every(row => row.needs_verification))
})
test('audit dates, quotations, code, unrelated tables and completed events are excluded', () => {
  const text = '---\nlast_updated: 2026-01-01\n---\n確認日: 2026-09-01、次回終了予定を確認します。\n> 2026-09-01 終了予定\n```text\n2026-09-01 廃止予定\n```\n| 確認日 | 内容 |\n| 2026-09-01 | 確認済み |\n2026-09-01 に終了しました。\n2026-09-01 終了済み。'
  assert.deepEqual(datedPlans(text, options), [])
})
test('deadline table rows are detected while historical table rows remain excluded', () => {
  const rows = datedPlans('| モデル | 終了予定 |\n| --- | --- |\n| old | 2026-09-30 |\n\n| モデル | 確認日 |\n| old | 2026-09-30 |', options)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].line, 3)
})

test('publication, beta, audit and announcement dates do not inherit a neighbouring deadline', () => {
  const rows = datedPlans('API 公開日を 2026-04-14、停止予定日を 2026-08-31 としています。カードの 2026-04-20 とは別です。予定日を経過しています。\n`mid-conversation-system-clear-at-2026-08-21` beta を使い、期限後も再送します。\n2026-09-21 の部分確認で期限を照合しました。\n2026-09-28 の退役表で 2026-10-01 終了予定を確認しました。\n| 対象 | 終了日 | 移行 |\n| --- | --- | --- |\n| old | 2026-09-30 (告知 2026-03-24) | 2026-08-27 GA |', options)
  assert.deepEqual(rows.map(row => [row.date, row.status]), [['2026-08-31', 'addressed'], ['2026-10-01', 'expired'], ['2026-09-30', 'expired']])
})

test('short dates use the paragraph year and unresolved TODO deadlines remain explicit', () => {
  const rows = datedPlans('2026-08-11 に提出し、改訂案を 9/23 までに共有する予定です。意見提出期限は 10/26 です。\nTODO(要確認): 2026-09-30 サポート終了予定です。', options)
  assert.deepEqual(rows.map(row => [row.date, row.classification]), [['2026-09-23', 'pending'], ['2026-10-26', 'pending'], ['2026-09-30', 'todo']])
})

test('an acknowledged past deadline does not classify a later upcoming event as addressed', () => {
  const rows = datedPlans('2026-10-01 終了予定の期日は経過していますが実施状況は確認不能です。2026-10-23 終了予定を期日後に確認します。\n\n告知期日の経過一覧です。\n\n| 対象 | 終了日 |\n| --- | --- |\n| old | 2026-09-30 |', options)
  assert.deepEqual(rows.map(row => [row.date, row.status]), [['2026-10-01', 'addressed'], ['2026-10-23', 'upcoming'], ['2026-09-30', 'addressed']])
})

test('a later event stays unresolved before and after its deadline despite another event acknowledgement', () => {
  const text = '2026-10-03 の退役表では、Cyber の告知された終了期日 2026-10-01 が掲載されています。後継モデルは未指定です。期日は経過していますが、実停止・延期の実施状況は確認不能です。o4-mini は 2026-10-23 終了予定で、別モデルの 2026-12-11 とは異なります。'
  for (const [today, status] of [['2026-10-08', 'upcoming'], ['2026-10-24', 'expired']]) {
    const rows = datedPlans(text, { ...options, today })
    assert.deepEqual(rows.map(row => [row.date, row.status, row.classification, row.needs_verification]), [
      ['2026-10-01', 'addressed', 'addressed', false],
      ['2026-10-23', status, 'pending', true]
    ])
  }
})

test('withdrawn future announcements are addressed without suppressing a separate live event', () => {
  const text = 'Gemini 2.5 系は終了日未定です(2026-10-16 提供終了の告知は撤回されました)。別モデルは 2026-10-23 終了予定です。'
  const rows = datedPlans(text, { ...options, today: '2026-10-08' })
  assert.deepEqual(rows.map(row => [row.date, row.status, row.needs_verification]), [
    ['2026-10-16', 'addressed', false], ['2026-10-23', 'upcoming', true]
  ])
  const clauses = datedPlans('2026-10-16 終了予定は撤回され、2026-10-23 終了予定は未確認です。', { ...options, today: '2026-10-24' })
  assert.deepEqual(clauses.map(row => [row.date, row.classification, row.needs_verification]), [
    ['2026-10-16', 'addressed', false], ['2026-10-23', 'todo', true]
  ])
})

test('a postponed original deadline is addressed while its replacement remains a live deadline', () => {
  for (const text of [
    '終了予定日は 2026-10-01 から 2026-10-23 に延期されました。',
    '終了予定日は 2026-10-01 を 2026-10-23 に延期しました。',
    '2026-10-01 終了予定は 2026-10-23 に延期されました。',
    '2026-10-01 終了予定は延期され、新しい終了予定日は 2026-10-23 です。'
  ]) {
    for (const [today, status] of [['2026-10-08', 'upcoming'], ['2026-10-24', 'expired']]) {
      const rows = datedPlans(text, { ...options, today })
      assert.deepEqual(rows.map(row => [row.date, row.status, row.needs_verification]), [
        ['2026-10-01', 'addressed', false], ['2026-10-23', status, true]
      ], text)
    }
  }
})

test('unverified withdrawal or postponement wording does not assert that a future deadline was cancelled', () => {
  const rows = datedPlans('2026-10-16 終了予定です。撤回を確認できません。\n2026-10-23 終了予定ですが、延期の実施状況は未確認です。', { ...options, today: '2026-10-08' })
  assert.deepEqual(rows.map(row => [row.status, row.classification, row.needs_verification]), [
    ['upcoming', 'todo', true], ['upcoming', 'todo', true]
  ])
})

test('denied or unconfirmed status assertions leave future and past deadlines requiring verification', () => {
  const statements = [
    ['撤回されていません', 'pending'],
    ['延期されていません', 'pending'],
    ['撤回されたとの情報を確認できません', 'todo'],
    ['実施済みではありません', 'pending'],
    ['終了済みではない', 'pending'],
    ['廃止済みと確認していません', 'pending'],
    ['延期されたかどうかは未確認です', 'todo'],
    ['撤回された場合は移行を止めます', 'pending'],
    ['延期される予定です', 'pending']
  ]
  for (const [statement, classification] of statements) {
    for (const [today, status] of [['2026-10-08', 'upcoming'], ['2026-10-24', 'expired']]) {
      const rows = datedPlans(`2026-10-16 終了予定は${statement}。`, { ...options, today })
      assert.deepEqual(rows.map(row => [row.date, row.status, row.classification, row.needs_verification]), [
        ['2026-10-16', status, classification, true]
      ], statement)
    }
  }
})

test('a denied or unconfirmed postponement does not withdraw the original date or create a replacement deadline', () => {
  for (const statement of ['延期されていません', '延期されなかった', '延期されたとの情報を確認できません', '延期される予定です']) {
    for (const [today, status] of [['2026-10-08', 'upcoming'], ['2026-10-24', 'expired']]) {
      const rows = datedPlans(`終了予定日は 2026-10-16 から 2026-10-23 に${statement}。`, { ...options, today })
      assert.deepEqual(rows.map(row => [row.date, row.status, row.needs_verification]), [
        ['2026-10-16', status, true]
      ], statement)
    }
  }
})

test('confirmed completion is addressed independently of whether the planned date has passed', () => {
  for (const assertion of ['実施済みです', '終了済みです', '廃止済みです', '撤回されました', '延期されました']) {
    for (const today of ['2026-10-08', '2026-10-24']) {
      const rows = datedPlans(`2026-10-16 終了予定は${assertion}。`, { ...options, today })
      assert.deepEqual(rows.map(row => [row.status, row.needs_verification]), [['addressed', false]], assertion)
    }
  }
  const acknowledged = datedPlans('2026-10-16 終了予定の期日は経過していますが、実施状況は確認不能です。', { ...options, today: '2026-10-24' })
  assert.deepEqual(acknowledged.map(row => [row.status, row.needs_verification]), [['addressed', false]])
})

test('unresolved status notes do not leak to another event on the same line or across table cells', () => {
  const rows = datedPlans('2026-10-16 終了予定は未確認です。2026-10-23 終了予定です。\n| 対象 | 終了予定 | 別の終了予定 |\n| --- | --- | --- |\n| old | 2026-10-16 (告知は撤回されました) | 2026-10-23 |', { ...options, today: '2026-10-08' })
  assert.deepEqual(rows.map(row => [row.date, row.classification, row.needs_verification]), [
    ['2026-10-16', 'todo', true], ['2026-10-23', 'pending', true],
    ['2026-10-16', 'addressed', false], ['2026-10-23', 'pending', true]
  ])
  const nextPrefix = datedPlans('2026-10-16 終了予定です。TODO(要確認): 2026-10-23 終了予定です。', { ...options, today: '2026-10-08' })
  assert.deepEqual(nextPrefix.map(row => row.classification), ['pending', 'todo'])
})

test('a migration deadline paragraph heading does not turn its announcement date into a deadline', () => {
  const rows = datedPlans('**モデル移行期限**: 2026-09-03 の告知では、対象モデルは **2026-10-02 に廃止予定**です。', options)
  assert.deepEqual(rows.map(row => row.date), ['2026-10-02'])
})
