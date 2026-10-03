import Link from 'next/link'
import report from '../../generated/freshness.json'
import { pageMetadata } from '../../lib/page-metadata.mjs'

export const metadata = pageMetadata('/freshness', '記事の確認状況', '系統ごとの一次情報の確認範囲、部分観測日、次回確認期日と証拠を公開します。未確認を明示します。')
const labels = { current: '期日内', overdue: '確認期日を超過', unknown: '宣言範囲の確認記録なし' }
const sourceUrl = source => `https://github.com/pero3dev/ai-agent-library/blob/main/${source}`

export default function FreshnessPage() {
  return <main id="nextra-skip-nav" tabIndex={-1} className="page-shell">
    <h1 className="page-title">記事の確認状況</h1>
    <p className="page-lead">生成日: {report.checked_on}。記事の更新日と、宣言した確認範囲を一次情報で確認した日を分けて表示します。</p>
    <p>確認範囲を宣言して完了した記録がない系統は「確認記録なし」です。完了した場合も、全記事の全主張や実API動作を検証した意味ではありません。部分観測を完了へ置き換えず、2026-09-10 の初回観測にも確認範囲不明の完了日を補いません。記録の範囲と判断基準は <a href={sourceUrl('freshness-automation.md')}>定期最新化の運用手順</a> を参照してください。</p>
    <div className="freshness-table" tabIndex={0} role="region" aria-label="系統別の確認状況"><table><caption>一次情報の定点観測 {report.systems.length} 系統</caption><thead><tr><th>系統</th><th>宣言範囲の最終確認</th><th>次回期日</th><th>状態と確認範囲</th><th>部分観測・証拠</th></tr></thead><tbody>
      {report.systems.map(system => <tr key={system.id}>
        <th scope="row">{system.title}</th><td>{system.last_verified_at || '記録なし'}</td><td>{system.next_due_on || '未確定'}</td>
        <td>{labels[system.status]}<br />{system.verification_scope || '記録なし'}</td>
        <td>{system.last_partial_observation_on || '部分観測なし'}<ul>{[...new Set([...(Array.isArray(system.evidence) ? system.evidence : system.evidence ? [system.evidence] : []), ...system.partial_observations.map(item => item.evidence)])].map((item, index) => <li key={index}><a href={sourceUrl(item)}>{item}</a></li>)}</ul><p>{system.partial_observations.length}件の部分観測</p></td>
      </tr>)}
    </tbody></table></div>
    <p>確認が必要な記述や古い情報は <a href="https://github.com/pero3dev/ai-agent-library/issues/new?template=article-correction.yml">記事訂正フォーム</a> へお寄せください。制作と検証の限界は <Link prefetch={false} href="/about">このライブラリについて</Link> に記載しています。</p>
  </main>
}
