# セキュリティレビューへの対応

2026-09-12 に採択。対象はレビュー時点の `f8dd5d2db4ba09d5f4d6fa619be704d764fe8d3b` です。
依頼に基づき、対応可能な防御修正・設定変更・回帰検証を実施し、PR と CI を経由して反映します。
ローカル修正・検証・独立レビューと導入 PR のマージを完了しました。実 CI・公開の受入は後続の節で追跡します。

## 範囲と所有

対象は Mermaid の描画設定、公開完了の証拠照合、参考資料変更の分類、共有 lock の保存先、非公開報告窓口です。
root は設定・Python 監査・記録と統合、別担当はサイト、runtime、CI/policy をそれぞれ所有します。
既存のブランチ・commit・push・PR・merge の許可を引き継ぎ、共同編集者を Codex と明記します。
元の監査と隔離再現はローカルに保持し、攻撃用の入力や原ログは公開しません。

## 対応台帳

| ID | 対応 | 状態 |
| --- | --- | --- |
| SEC-01 | 実際に使われる Mermaid 描画器を strict に固定し、通常表示を回帰検証 | 実装・ローカル検証・独立レビュー済み |
| SEC-02 | ローカル候補・PR head・定期 run の証拠を結合し、開始時契約を state へ別保存 | 実装・ローカル検証・独立レビュー済み |
| SEC-03 | CI 証拠を repository・PR・head branch へ結合 | 実装・単体検証・独立レビュー済み。導入後の実 CI 受入は後述 |
| SEC-04 | 非公開の脆弱性報告を有効化 | 実 API で `enabled: true` を確認 |
| SEC-05 | 必須9チェックの契約を共通化 | 実装・単体検証・独立レビュー済み |
| SEC-06 | 参考資料の変更判定を Markdown 構造に基づいて共通化 | 実装・単体検証・独立レビュー済み |
| SEC-07 | 共有 lock の root・子孫のリンクと型・owner を検査 | 実装・ローカル検証・独立レビュー済み |

## 追加の予防設定

secret scanning、push protection、Dependabot alerts を有効化しました。Actions は GitHub 所有とローカルに
限定し、完全な commit SHA 固定を必須にしました。既存 workflow の全 Action が許可範囲内であることを
確認してから設定し、変更後の API 応答を保存しています。main の9必須チェックや管理者保護は緩めていません。

Claude の共有設定から Git コマンド全引数の事前許可を外し、クライアント既定の判断と個別の作業許可へ委ねます。
実 Claude による承認動作の試験は今回の受入に含めません。

CI の examples job と検証一覧に Python 依存監査を追加します。監査ツールの版を固定し、収集失敗を含めて
失敗させます。サンプルの推移依存を全 OS 共通の hash lock に固定する変更は含めません。
Dependabot の修正 PR 自動作成は Git 共通規約との接続が必要なため、alerts と監査までを有効化します。

## 検証と制約

単体試験、Windows、サイトの公開相当ビルドと通常ブラウザー操作、実 GitHub の設定・CI・公開確認を分けて記録します。
前回ツール側で停止されたサイトの追加攻撃実験は再試行せず、防御設定と通常動作を検証します。
ローカルの API fixture は実 GitHub の保護突破を示すものではありません。

最終差分の独立レビューと各検査の結果を以下に記録します。導入 PR と後続の証拠結合の受入は区別します。

ローカルの最終検証は `npm ci`、`npm run check` 359試験、Windows 対象140試験、オフライン評価297試験が成功し、skip は0でした。
runtime の3 suite は88試験、その後の起動補完を含む freshness suite は45試験、CI/policy の関連 suite と追加の workflow 契約試験も成功しています。
これらは重複するため、試験数を合算しません。独立レビューで見つかった開始時契約の結合不足と
prepare の state 更新競合を修正し、最終ソースは別担当の承認を得ています。

新規 worktree の起動順も確認し、依存準備前の状態確認・prepare・保存・再開を維持しました。
公開完了時だけ実装に隣接する policy CLI を呼び出し、依存不足を成功扱いにしません。
依存を持たない隔離した実 CLI の2ケースと独立レビューで、この境界を確認しています。

サイトは31単体試験、223ルートの公開相当ビルド、84件の実 Edge ブラウザー試験が成功しました。
既存73記事・74図を巡回し、空 SVG・描画エラー・改行タグの文字列露出がないことを確認しました。
通常図の明暗テーマ切替と CSS による200%拡大も確認しました。配布 chunk に strict の初期化とサイト所有の
renderer が含まれることを記録し、別担当がハッシュを再照合しました。Webpack は実コンパイラと設定の単体試験、
Turbopack は実ビルドとブラウザー試験であり、両者を同じ検証段階とは扱いません。

Python は監査ツールとサンプル依存を同じ専用 venv に入れ、17試験が成功しました。
`check:ci -- --run python-audit` も既知脆弱性0件で成功しました。Windows では requirements の日本語コメントを
正しく扱うため `-X utf8` を明示しています。Actionlint 1.7.12 と互換入口の同期検査も成功しました。

開始時契約の導入前に、実際の定期実行記録が未完了0件・完了2件・lock なしであることを読み取り確認しました。
状態と各 run JSON のハッシュは読み取り照合の前後で一致しています。旧完了記録を変更せず、契約のない旧未完了は自動再開せず保持します。

## GitHub への反映と導入後の受入

[導入 PR #33](https://github.com/pero3dev/ai-agent-library/pull/33) は9必須チェック成功後、2026-09-12 にマージしました。
対象 head は `269c9953724fcc07ac6f3df4538d7ea9af6985d3`、merge SHA は `203e468ff6c121d741d4b0e24ab2bc5c47ed7f96` です。
両者の tree は `507f63da172aeea2e696905f2361e2dc952323b1` と一致し、実 merge メッセージも PR から生成した件名・本文・Codex 共同編集者と一致しました。
別担当が実 API で各チェックの App・repository・PR・head branch・workflow・event・suite を照合しています。

同じ merge SHA の [main CI](https://github.com/pero3dev/ai-agent-library/actions/runs/34695159726) と
Pages deployment `6409913663` が成功しました。deploy job と deployment の実行 URL が一致することも別担当が照合しています。
[公開記事](https://pero3dev.github.io/ai-agent-library/docs/concepts/agent-loop) は HTTP 200 で、記事の見出しと所有 renderer の印を確認しました。
ページから参照される配布 JavaScript 内の strict 初期化も取得して確認し、対象 chunk の SHA-256
`f64305c2374314f74b46beccb9c77f9c3dc9c1cde4ea4e0065c0281fdcb41c41` はローカル公開相当ビルドと一致しました。
これは公開 HTTP・配布ファイルの照合であり、公開サイト上のブラウザー実行試験は別途行っていません。

導入 PR の policy は旧 base で動くため、新しい固定 `run-name` をまだ持ちません。この PR の成功を、
導入後の照合処理の成功として保存しません。後続の通常 PR は `test/security-evidence-acceptance` で記録のみを変更し、
導入済みの trusted-base workflow が `Harness policy PR #<番号>` と `Freshness policy PR #<番号>` で実行されることを確認します。

後続 PR のマージ後は `scripts/lib/github-evidence.mjs` の `verifyGithubEvidence` に、その PR の実 URL・
レビュー済み head・tree と `requirePublication: true` を渡します。9必須チェック、merge tree、exact merge SHA の main CI、
Pages deployment と公開記事の本文を実 API / HTTP で照合します。保存済みの成功フラグやローカル fixture で代用しません。

この最終記録を含む受入 PR の最終状態は GitHub で確認し、配送結果を common Git directory の
`security-remediation/acceptance-publication.json` に保存します。検査ログと元の監査記録も同じ作業領域に保持し、
公開記録には攻撃入力・認証情報を含めません。
