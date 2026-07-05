/**
 * 「### アンチパターン」「### チェックリスト」直後のブロックを囲む装飾コンテナ。
 * remark-doc-decorations が自動変換する(見出しはこの外側に残る)
 */
export function PracticeSection({ kind, children }) {
  return <div className={`practice-section practice-${kind}`}>{children}</div>
}
