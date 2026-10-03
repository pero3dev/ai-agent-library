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

test('a migration deadline paragraph heading does not turn its announcement date into a deadline', () => {
  const rows = datedPlans('**モデル移行期限**: 2026-09-03 の告知では、対象モデルは **2026-10-02 に廃止予定**です。', options)
  assert.deepEqual(rows.map(row => row.date), ['2026-10-02'])
})
