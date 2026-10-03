# 記事Issueの修正記録

- 作業日: 2026-10-03(日本時間)
- 対象: #151 → #152、#153 → #154、#155、#156 → #167
- 目的: 認可・承認・構造化出力の保証範囲、製品仕様、APIキー不要の学習入口を各Issueの完了条件に同期します。
- 適用規約: `AGENTS.md`、`harness/writing-rules.md`、`ROADMAP.md` の記事タスク・定期メンテナンス入口、`project/README.md` の記録配置。
- 所有: 各Issueで列挙された記事・調査メモ、`examples/README.md`、本記録、`.tmp/issue-close-2026-10-03/article-manifest-input.json`。他担当の変更を戻しません。
- 検証: 一次資料照合、4種の構造化出力と4種の承認ケースの机上確認、記事/リンク機械検査、README通りのmock実行、最終差分の独立レビュー。
- 終了条件: 本文とチェックリストが一致し、各Issueの完了条件を証拠付きで満たし、独立レビューと全体検査を通過します。
- 外部操作: ユーザーの「GithubのIssueのすべて自律的にCloseに向けて進めてください」が修正とCloseまでの根拠です。この担当は一次資料取得のみ行い、GitHub書込・Git操作は全体担当が行います。有料API/実Agent試験は行いません。

## 一次資料と反映

取得時刻・対象主張・対応する記事・ROADMAPタスクの全成果物は `.tmp/issue-close-2026-10-03/article-manifest-input.json` に保存しました。最終のコミット済みmanifestは全体担当が `harness/changes/` に保存します。執筆runは `/root/articles` です。

| Issue | 訂正内容と確認根拠 |
| --- | --- |
| #151 | 直接/間接を入力経路とし、共有サービスアカウントで他部署情報へ及ぶ直接型の反例を追加。認可拒否を引数不正から分離し、許可済み代替・正規承認・停止と報告を定義。agent-identity-and-authの委任/実効権限の交差と照合 |
| #152 | 未承認を拒否する強制ゲートと人の誤承認リスクを分離。操作・対象・実引数・差分・対象の版・期限・再使用条件、変更時再承認、実行時認可を本文とチェックリストに同期 |
| #153 | strict/対応スキーマ/正常完了の保証条件を明記。正常完了、refusal、incomplete、設定エラーを擬似コードとOpenAI記事で分岐。公式Structured Outputsと照合 |
| #154 | 公式Models/Gateway compatibilityに従いResponses互換endpointへ訂正。Sol/LunaモデルページとYour dataのStandard/Flex/Batchを取得日付きで保存。独立レビューのPricing再取得では旧Standard限定の残存を確認できず、資料差の現存断定を撤回。Fastとregional storage/processing、実アカウント適格条件の未検証を分離 |
| #155 | Manualの動作と開始モードを分離。端末/VS Code v2.1.283、-p/SDK v2.1.285と機能フラグ/組織設定/初回/fallbackを公式表で照合。比較記事と実践記事の同条件も同期 |
| #156 | 追加予定を実装済み6サンプルとexamples索引に置換。structured-output --mockとPython条件を案内し、任意の実API準備と分離 |
| #167 | Aの構成メモ、Bの設計メモ、Cの2mock実行記録に入力・必要記事・成果物・終了条件・次のリンクを追加。既存の到達レベルや実務自己評価を保持 |

一次資料の取得はUTCで記録しました。OpenAI6ページは2026-10-03T06:45:36Z、OWASP/Claude Permission modesは06:45:50Z、Gateway compatibilityは06:57:38Zです。GitHub connectorで固定HEAD `d990973c2c02b6108cd9911fc06e45b3a29f9332` のREADMEと2サンプルREADMEを07:04:57Zに取得し、ローカルGit正本とも照合しました。一般WebのGitHub取得はcache miss、sandbox内ghはconfig読取拒否でしたが、既存のGitHub connectorで読み取りを完了しました。

記事のresearch参照はサイトに未収録のためGitHub正本URLにしました。変更記事11本はすべてpublishedを維持し、last_updatedを2026-10-03に更新しています。

## 検証結果と限界

### 記事とリンクの機械検査

- `node scripts/validate-docs.mjs <変更記事11パス>`: exit0、`OK: 11 files`。
- 対象記事/調査メモ/サンプルREADME/本記録の `npx --no-install markdownlint <対象パス>`: exit0。追加した強調だけの見出し3件をH4へ訂正して再検査しました。
- `node scripts/check-links.mjs`: exit0、`OK: 457 files, 5999 links`。新しいA/B/C見出しへのアンカー2件を実際のslugへ訂正して再検査しました。ファイル・リンク件数はこの並行作業中の検査時点です。

### 机上確認

実UI・実APIの試験ではなく、最終本文の処理分岐を読み合わせた結果です。

| 構造化出力の入力 | 処理先 |
| --- | --- |
| 正常完了した正常JSON | 構造・業務検証を通過した結果だけ返す |
| refusal | 通知して停止。再生成なし |
| トークン上限打切り | 予算と回数上限内だけ再生成。部分出力は使わず、上限到達は停止 |
| 非対応スキーマ/設定 | 設定訂正担当へ渡す。同じ設定の自動再送なし |

| 承認の入力 | 保証と残余リスク |
| --- | --- |
| 未承認 | 強制ゲートが実行を拒否 |
| 承認後の実引数/差分/対象の版の変更 | 元の承認では拒否し再承認 |
| 期限切れ/1回限りの承認の再使用 | 拒否。再承認前に前回実行の成否を照合 |
| 危険操作を人が承認 | 条件一致・認可ありなら実行され得る。人の誤判断は残り最小権限/レビュー/監査で抑える |

### mockの実行

PATHのpython/pyは利用できなかったため、`load_workspace_dependencies` が返したbundled Python `<user-home>\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe` を使いました。版はPython 3.12.14です。各READMEのディレクトリで `-X utf8 <script> --mock` を実行し、追加依存もAPIキーも使っていません。

- structured-output: exit0。試行1はpriority「至急」で検証NG、試行2は「高」で検証OK、最終categoryは「請求」。
- evaluation-harness: exit0。c4だけ予測「その他」/期待「請求」でNG、全体4/5=80%で閾値80%を満たしました。
- evaluation-harnessの閾値90%: READMEの手順を所有する `.tmp/issue-close-2026-10-03/evaluation-harness-90/` のコピーで実施しました。同じ4/5=80%、閾値90%でexit1。正本のPythonコードは変更していません。

2サンプルREADMEのmock確認日・版・結果だけを同期し、旧SDK/プロトコル確認日は維持しました。実API生成品質・実Agent/承認UI・外部接続・資格認定・本番適性は確認していません。最終独立レビュー・全体の `npm run check`・CI・公開確認は全体担当の記録と接続します。

## 変更パス

- `docs/06-security/prompt-injection.md`
- `docs/02-architecture/error-handling-and-retries.md`
- `docs/02-architecture/human-in-the-loop.md`
- `docs/03-implementation/structured-output.md`
- `docs/03-implementation/openai-prompting.md`
- `docs/08-coding-agents/openai-codex.md`
- `docs/08-coding-agents/claude-code.md`
- `docs/08-coding-agents/claude-code-in-practice.md`
- `docs/08-coding-agents/coding-agents-comparison.md`
- `docs/00-overview/learning-roadmap.md`
- `docs/00-overview/skill-map.md`
- `research/prompting/openai.md`
- `research/coding-agents/openai-codex.md`
- `research/coding-agents/claude-code.md`
- `examples/README.md`
- `examples/python/structured-output/README.md`
- `examples/python/evaluation-harness/README.md`
- 本記録

全体担当がproject索引と最終manifestを同期し、最終独立レビュー後の内容変更は再レビューへ渡します。
