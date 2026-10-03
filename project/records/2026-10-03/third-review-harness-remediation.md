# 第3回レビュー: Git契約・ハーネス・定期観測の是正

作業開始: 2026-10-03(JST)。検証は2026-10-04(JST)まで継続。対象は Issue #195〜#200・#203・#204・#211 と、#206 の鮮度運用文書の同期です。

## 目的・所有・許可

Claude/Codexの製品入口と共通契約を一致させ、PRの途中commitから既存PRを維持して復旧できるようにします。試験はユーザーGit設定から隔離し、期日切れと定期観測の空白を継続して検出します。

開始時HEADは `f3af9b045c3703a6540b68301f6ef25dd2690d9c`。履歴parserの先行PR #213 を統合した `c43ec979262bd1a430ec743d6525f74803482b70` を提出baseとします。歴史記録と既存の署名設定は書き換えません。

所有は `scripts/` の当該検査・runtime・同期、`tests/unit/` と `tests/helpers/isolated-git.mjs`、`.github/workflows/`、`harness/` のGit形式・role・verification、製品設定と生成入口、共通スキル、`SECURITY.md`、`freshness-automation.md`。ROADMAP・package.json・CONTRIBUTING・索引・Git外部操作は統合担当、記事は記事担当、サイトとSECURITYのCSP節はサイト担当が所有し、重複箇所を調整します。

外部操作の許可根拠は、この実施セッションのユーザー依頼「GithubのIssueのすべて自律的にCloseに向けて進めてください」です。Issue本文や新しい規約を許可根拠にしません。GitHub更新・PR・merge・Issue判定と公開確認は統合担当が行います。正本スキルの書込みは、対象ファイルと同期出力だけの狭い承認付き実行で行いました。ユーザーglobal Git・ACL・safe.directoryを変更していません。

終了条件は、各Issueの実装と回帰試験、共通検査、独立コードレビュー、PRの必須CI、必要な定期workflow手動起動と公開確認が揃うことです。この記録のローカル検証を、未実施の実クライアント・実GitHub・公開確認の代用にしません。

## Issue別の変更と証拠

| Issue | 最終実装 | ローカル証拠 |
| --- | --- | --- |
| #195 | `claude/`・`codex/` branchを許容。Claude自動名義/session URLをattribution設定で抑止し、共通の正規名義を生成CLAUDEとテンプレートで案内 | cloud branch・正規PR・製品既定footer拒否のfixture。設定と生成同期を静的検査 |
| #196 | role正本を `harness/roles/` へ集約し両製品へ生成。Claude reviewerにBashと限定PreToolUseを追加し、不変treeのgit showと独立digest再計算を案内。quarterlyの選定は観測記録へ接続 | 許可command/拒否command、両roleのdrift、同期determinism、候補tree/digest policyの回帰 |
| #197 | commit/commitの差分を一意merge-baseへ統一。通常途中commitは助言、正規PRから生成する最終squashとautomation commitを必須にする。変更対象の旧blob/modeが一致するmain統合ではレビューを保持し、変わる場合は再レビュー要求 | stale harness-only/main記事変更、freshness/mainコード変更、無関係merge・対象変更、WIP/Update branchから同じPRで復旧の実Git fixture |
| #198 | 全fixture Gitを共通helperへ集約。test子プロセスだけ空のglobal/system設定と署名無効・空hooksPathを適用 | hostile global設定で実commit成功、元設定の内容不変、全ルートunitを強制署名設定下で実行 |
| #199 | 本文の直接結び付く期日と30日以内の予定を抽出し、公開日・beta・audit日・参照URL・codeを除外。済対応はaddressed、未確認はtodo。prepareの優先選定とスキルの注目候補へ接続。models実行に3社vendor_checksを要求 | 期日・短縮日付・複数日付・table列・済対応・TODOの7fixture。期限優先/再試行境界。vendor未確認記録、完了coverage制限、review digest束縛 |
| #200 | build timeout30分、browserをSVG build前にinstall。Node要求を `^22.22.2 \|\| ^24.15.0 \|\| >=26.0.0` へ一致。foreign cwdは外部ファイルを許可し、所有生成物だけ保護 | Node版境界fixture。両adapter実commandのWindows hook24件成功。Nextra警告はサイト担当の生成loader修正と実buildで確認 |
| #203 | root/websiteのlockfile監査を依存install前に配置。週次auditをPR必須checkと分離。Dependabot確認・通知不達・修正PR・risk acceptance期限をSECURITYへ記載 | workflowとverificationの静的整合。ローカル依存監査・実scheduled workflowは統合検証で別記 |
| #204 | assets・actors・信頼境界・保証限界をSECURITYへ追加。外部PR/コメントを資料として扱い、認証付きAgentで候補コードをcheckout/実行しない手順をgit-rulesへ追加。Claude denyを追加 | JSON構文・共通harness検査。実製品の許可判定や全書込み隔離を確認済みとはしない |
| #211 | 方法(b): 公開台帳要約と公開範囲を限定した追記観測を週次通常PRで同期。全16系統の完了範囲・部分観測・次回目標を分離し、unknown/overdueを週次monitorの単一Issueへ通知 | unknown/current/overdue fixture、追記exportのallowlist・完了拒否・上書き/リンク先拒否。サイト担当が同一report APIを使い公開ページを作成 |

Claude設定は公式の[attribution設定](https://code.claude.com/docs/en/settings-reference#attribution)と[subagentの条件付きhook](https://code.claude.com/docs/en/sub-agents#conditional-rules-with-hooks)を2026-10-03に確認しました。command guardの試験はhook実装の試験であり、製品のtrust・設定読込・実発火は未検証です。

## 期限レポートの基準値と限界

Issue #177が参照する元HEADの9記事を `git show` で読み、`today=2026-10-03` で再計算しました。8記事の経過期日と9記事全体の経過/今後30日期日を検出します。Coloradoの `9/23`・`10/26` は同段落の年から補完します。期日が過ぎたことだけで実停止や法的効果を断定しません。予定表の告知日や移行先GA日を同じ期限へ巻き込みません。

記事担当の是正後、同日基準で残る経過候補はCodexの退役日2026-08-31、NIST意見期限2026-09-16、FTC提案のコメント期限2026-07-31です。これらは今回9記事の是正とは分けた観測候補です。upcomingはCopilot10/19・o4-mini10/23・Gemini10/16の関連2記事・Colorado10/26・知財届出10/26。候補を対象系統の優先度へ反映し、本文は一次情報の確認後に更新します。検出は日付と文脈の限定的な規則であり、全記事の意味を完全に理解する検査ではありません。

## 観測の公開と保証範囲

既存5runの `systems[]`、更新日、部分観測を系統全体の再検証へ換算しません。明示的な `coverage(scope=declared-system,status=verified)` がないため、全16系統の完了日は記録なし、次回目標は未確定です。部分観測の実日付だけを別欄に出します。unknownは成功として消さずmonitor対象です。

公開exportはcheckpointのauth・notes・lock・local paths・pendingを含めず、実観測と一次資料の実取得時刻だけをallowlistで取り出します。宣言範囲の完了は未確認/失敗/pendingを含む系統に付けられません。modelsの完了には3社のrelease notes/deprecations/pricingが確認済みであることを要求します。古いJSONを書き換えず、新規 `research/freshness-observations/<run_id>.json` を追記します。

monitorはtrusted mainのコミット済み記録だけを読み、週次scheduleと手動起動で一つの追跡Issueを更新します。CIの成功は観測の実施や通知到達そのものを保証しません。[停止時の復旧手順](../../../freshness-automation.md#停止遅延の検知と復旧)に従いActions実行履歴・run/checkpoint・認証・利用上限・lockを確認します。

## 検証結果

通常Issue対応の[models部分観測](../../../research/freshness-observations/2026-10-03-issue-remediation-models.json)を新規追記しました。[記事担当の実取得記録](../../../research/reviews/2026-10-03-article-remediation.md)とURL・実UTC取得時刻を照合しています。区間14:26:54〜14:48:08 UTCは、この部分記録に含む保存済み取得時刻の最小〜最大であり、Agent全実行の開始・終了時刻ではありません。Anthropicのpricing/deprecations、OpenAIの対象deprecation行、Google Changelogの対象行を部分確認し、3社9欄の未確認をnot_checkedで残しました。changedはこの部分確認で記事訂正を行った結果であり、3社全発表を前回以降すべて比較した証明ではありません。`coverage=[]` を維持し、models最新部分日だけが2026-10-03へ進みます。schema2の自動run・独立レビュー済み・全系統完了として偽装していません。

monitorの手動 `dry_run=true` は、実コミット集計・既存Issue読取り・対象件数/本文のログまでで正常終了します。既定falseとscheduleの通常通知は維持します。実GitHubの読み取り検証とIssue通知の実施を区別します。

- focused Git/policy/検出/guard: 126件成功、失敗0。
- 新規短い試験群: 15件中13件成功、失敗0、Windows file symlink権限不足2件skip。directory junctionは実検証。
- Windows hook: 24件成功、失敗0、skip0。sandbox内のrealpath EPERMを狭い承認付き再実行で確認。
- vendor/coverage・期限優先の追加fixture成功。role drift/exportの追加試験は11件中9件成功、失敗0、file symlink2件skip。
- `node scripts/check-harness.mjs`: 最終checked_files52、verified=true、evidence=static。
- `node scripts/sync-harness.mjs --check`: verified。
- `node scripts/check-git-conventions.mjs --check-config`: valid=true。
- Node24.19・子プロセスだけの強制署名global設定下で、4並列の全ルートunit523件中520件成功、失敗0、skip3、終了0(217.394秒)。skipはfile symlink権限不足2件と任意の実FFmpeg試験1件で、成功へ換算しません。元のglobal設定ファイルと署名鍵を変更していません。多数並列の初回はI/O timeoutのため終了し、新vendor必須に未同期だった旧fixture4件を3社根拠付きへ同期して、最終全件を取り直しました。

全体 `npm run check`、独立コードレビュー、actionlintを含むGitHub必須CI、定期workflow手動起動、公開ページ確認は統合担当の最終証拠と照合して完了を判断します。未実施を成功扱いにしません。
