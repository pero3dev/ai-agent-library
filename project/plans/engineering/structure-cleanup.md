# プロジェクト構造の整理計画

作成日: 2026-09-11(JST)  
状態: 採択済み・実施中(2026-09-11)  
調査基準: main `948a418cc0f78f1846238cf23c13d63c4efdc8a2`

## 目的と今回の範囲

学習者が記事を見つけやすく、執筆者とAgentが現行の作業手順を迷わず参照できる配置にします。完了した計画・検証証拠・再生成可能なデータを用途別に整理し、今後もルートや作業領域が膨らみ続けない運用を整えます。

この計画は「まずは整理計画」という依頼に対して作成しました。その後、2026-09-11に全工程の自律実施が依頼されました。移動・削除・ブランチ整理・コミット・push・PR・マージは以下の条件内で進めます。[実施記録](../../records/2026-09-11/structure-cleanup.md)と[移行台帳](../../records/2026-09-11/structure-migration.json)で進捗を管理します。

対象は追跡済みのプロジェクト構造と、このリポジトリが所有するローカル生成物・worktreeです。`C:/dev/ai-agent-library` 自体の移動・改名や、他プロジェクト、個人の認証・設定の整理は含めません。

## 棚卸し結果

数値は本計画追加前の実測です。容量はファイルサイズの合計であり、ファイルシステム上の割当容量ではありません。シンボリックリンクは追跡せず集計しました。以下の主領域でリンク・読取エラーはありませんでした。

| 対象 | 観測 | 整理上の判断 |
| --- | --- | --- |
| Git追跡 | 473ファイル | 大部分は役割がある正本・実装・証拠です |
| ルート | 48ファイル、うちMarkdown 41 | 計画・履歴33ファイルを移動でき、15ファイル・Markdown 8まで絞れます |
| `docs/` | 215ファイル=199記事+16章索引 | 章構成と公開URLを維持します |
| `research/` | 59ファイル=Markdown 50+JSON 9 | 調査起点・観測・適用結果です。用途を索引化します |
| `scripts/` | CLI等16、単体試験12、共通実装9、schema 3 | 試験と試験専用helperを移して実行入口を見つけやすくします |
| `website/` | 追跡44ファイル、ローカル約1,534.65 MiB | 依存・生成物が容量の中心です |
| `.git/` 全体 | 約726.99 MiB | Git履歴そのものより作業専用ツール・評価領域が大きい状態です |
| 登録worktree | mainを含む19件 | main以外に、兄弟フォルダ14件・Git内の評価2件・アプリ管理2件があります |
| worktreeの差分 | 17件は追跡・通常未追跡差分なし、評価2件に各3パス | cleanという判定だけでignoredデータまで不要とは判断できません |
| 独立した評価コピー | `C:/dev/ai-agent-library-harness-claude-probe` | worktree一覧に出ないため別途管理が必要です |
| 定期実行 | 本番2件ACTIVE、ロック・保留・未完了runなし | 配置整理で起動経路を変えない方針にします |

現在の `harness:health` が報告する保持領域は約65.92 MiBです。これはcheckout・依存・作業ツール等を含む `.git/` 全体の容量ではありません。容量表示を用途別に分け、未計測領域を含む全容量のように表示しないことも整理に含めます。

見つかった構造上の問題は次のとおりです。

1. ルートに、現行手順・完了計画・監査・修正結果・受入記録が並んでいます。
2. READMEの構成図には「未着手18計画」という古い紹介が残る一方、PRIORITY-MAP本文では全計画が完了しています。
3. `DOMAIN-AGENTS-PLAN.md` 冒頭の「進行中」と「完結」が混在しています。旧導入記録の6必須チェックと現行の9必須チェックも、時点を読まないと混同します。
4. 実装と単体試験が同じ `scripts/` に並び、`tests/harness/` が実行試験か固定課題か分かりにくい状態です。
5. `research/` 全体の入口がなく、現行の調査メモと日付付きの観測・適用記録の関係が見えにくい状態です。
6. ローカルの生成物、評価ログ、評価checkout、補助ツールを一括して削除できる状態ではありません。削除条件と保管期限が異なります。

調査した文書・資料領域に、内容が完全一致する追跡ファイルや、根拠なく即時削除してよい追跡文書は見つかっていません。

## 推奨する最終配置

```text
ai-agent-library/
├── README.md / CONTRIBUTING.md / SECURITY.md / LICENSE
├── AGENTS.md / CLAUDE.md
├── ROADMAP.md / GLOSSARY.md
├── freshness-automation.md       # 登録済みタスクも参照する現行運用入口
├── package.json / package-lock.json / 各種dotfile
├── docs/                        # 学習記事と章索引。既存パスを維持
├── examples/                    # 自己完結サンプルとPython横断試験
├── website/                     # サイト実装。別packageを維持
│   ├── app/ / components/ / lib/ / content-src/
│   ├── scripts/                 # 生成・ビルド・配信処理
│   └── tests/unit/ / tests/browser/
├── project/                     # プロジェクトの計画・実施履歴
│   ├── README.md                # 現行計画、完了計画、実施記録への入口
│   ├── plans/
│   │   ├── content/             # 記事拡張22計画とpriority-map
│   │   ├── maintenance/         # 四半期の計画
│   │   └── engineering/         # サイト・自動化・ハーネス・本整理計画
│   └── records/2026-09-10/      # 監査・修正・導入・受入の記録
│       └── evidence/            # 当該記録の監査出力
├── research/                    # 出典・主張・取得時点・適用結果
│   ├── README.md                # 用途と系統の索引を追加
│   └── freshness-runs/          # policyが参照する根拠記録。配置維持
├── harness/                     # 現行の詳細規約・profile・検証一覧
├── automation/                  # 定期タスク登録用prompt。配置維持
├── scripts/                     # CLI、共通実装、schema
├── tests/
│   ├── unit/
│   ├── helpers/
│   └── fixtures/harness/        # 自動認識されない .example の固定課題
├── templates/ / assets/diagrams/
└── .agents/ / .claude/ / .codex/ / .github/
```

ディレクトリ名で「完了」を管理せず、計画索引に状態・適用時点・後継記録を載せます。完了するたびにファイルを再移動する運用にはしません。記事の状態の正本はfront matter、執筆タスクの正本はROADMAPを維持します。

`ROADMAP.md` は固定位置に保ち、現行メンテナンスと読むべき節への案内を上部に置きます。既存タスクID・成果物・完了表は保持します。履歴の別冊化は、policyが既存タスクの脱落を拒否するため、今回の整理には含めません。

## 移動・整理の具体的な対応

| 現在 | 提案先・対応 | 同時に確認するもの |
| --- | --- | --- |
| 大文字 `*-PLAN.md` のうち `WEBSITE-PLAN.md` と `MAINTENANCE-2026Q3-PLAN.md` を除く22件 | `project/plans/content/<小文字ケバブケース>.md`。例: `CODING-AGENTS-PLAN.md` → `coding-agents.md` | README、ROADMAP、章索引、計画相互参照、research内の参照 |
| `PRIORITY-MAP.md` | `project/plans/content/priority-map.md` | 「未着手」の現行案内を完了した実施順の説明へ修正 |
| `WEBSITE-PLAN.md` | `project/plans/engineering/website.md` | website/READMEと過去の設計判断への参照 |
| `MAINTENANCE-2026Q3-PLAN.md` | `project/plans/maintenance/2026q3.md` | 現行の定期観測台帳との関係を冒頭に明記 |
| `freshness-automation-plan.md`、`harness-improvement-plan.md` | `project/plans/engineering/freshness-automation.md`、`harness-improvement.md` | 採択時点の計画と実施結果を区別 |
| ルートの監査・修正・受入6件 | `project/records/2026-09-10/` 配下へ用途名で移動 | 具体名は次段落。過去の失敗も残す |
| `review-evidence/2026-09-10/` の2件 | `project/records/2026-09-10/evidence/` | 内容のSHA一致、レビュー本文からの参照 |
| `scripts/*.test.mjs` 12件 | `tests/unit/` | glob、import、root算出、fixtureコピー、CI・検証一覧・eval |
| `scripts/lib/windows-test-path.mjs` | `tests/helpers/windows-test-path.mjs` | 利用するWindows試験2件のimport |
| `tests/harness/*.example` 2件 | `tests/fixtures/harness/` | evalの固定課題読込と教材の不活性検査 |
| `website/scripts/*.test.mjs` 4件 | `website/tests/unit/` | websiteのtest globとlibへのimport |

実施記録6件の対応は、`freshness-audit-2026-09-10.md` → `freshness-audit.md`、`freshness-update-2026-09-10.md` → `freshness-update.md`、`freshness-automation-setup.md` → `freshness-automation-setup.md`、`harness-implementation-status.md` → `harness-acceptance.md`、`review-2026-09-10.md` → `review.md`、`review-remediation-2026-09-10.md` → `review-remediation.md` です。

実装開始時に、全33件と関連移動の旧パス・新パス・参照元・変更理由を移行台帳へ確定します。上表の規則だけで無差別にファイル名を変えることはしません。旧ファイルURLはGit履歴で参照できるようにし、現行の案内は新しい索引へ更新します。公開記事のURLを保つことと、GitHub上の旧ファイルパスが変わることは別に記録します。

`research/README.md` では、系統ごとの継続調査、日付付き監査、修正の適用台帳、`freshness-runs/` のレビュー根拠を区分します。監査JSONの `identified_not_applied` は監査時点の事実です。後続の適用結果と統合・上書きせず、対応する記録へリンクします。過去の証拠JSONに含まれる当時のパスやdigestは書き換えません。

## 削除対象の選び方

| 区分 | 候補 | 実行条件・扱い |
| --- | --- | --- |
| 再生成できるサイト出力 | `website/.next/`、`out/`、`content/`、`generated/`、`public/_pagefind/`、`next-env.d.ts` | 正本が追跡済み、サーバー・ビルド停止、再生成検証、対象パス確認後に削除可 |
| 一時出力 | `website/dev-server.log`、`test-results/`、`playwright-report/`、Python `__pycache__/` | 障害調査や提出証拠として必要なものを保存してから削除 |
| 再インストールできる依存 | 使い終えたworktreeの `node_modules/`・評価fixtureの依存/cache | 当該worktreeの利用終了と証拠保存を確認。mainの通常開発環境は毎回消さない |
| 旧互換コード | `.codex/hooks/edited-paths.mjs` | 現行repo内利用は試験のみ。core参照へ変更し、外部呼出契約がないことを確認できた場合に削除 |
| 空の予定ディレクトリ | `examples/typescript/.gitkeep` | 実サンプルなし。予定をexamples/READMEへ集約し、空ディレクトリのためだけの追跡を終了する案 |
| 完了worktree・作業ブランチ | 兄弟ディレクトリ14件など | PRのマージ・最終差分の取り込み・未保存/ignoredデータ・所有者・利用中でないことを個別確認 |
| 評価の生ログ・fixture・WIP ref | `.git/harness-eval/`、`harness-evaluations/` 等 | 既存の完了後90日保持を守る。2026-09-10の証拠は今回の即時削除対象にしない |
| 作業専用ツール | `.git/harness-tools/` | 現に使うCodex CLIやPython環境を含む。必要な版と再導入手順を確認し、不要な版だけ個別判断 |

実測では `website/.next/` 約535.69 MiB、`out/` 約303.80 MiB、`public/` 約45.92 MiB、`content/` 約3.13 MiB、devログ約1.27 MiBです。`public/` 全体の数値を削除許可とはせず、生成先 `_pagefind/` だけを対象にします。生成物等で約890 MiBを一時的に回収できる見込みですが、ビルドすると再生成されます。

`website/node_modules/` 約644.30 MiB、rootの `node_modules/` 約11.45 MiB、`.git/harness-tools/` 約545.83 MiBは、常用環境を含むため削減見込みへ加算しません。兄弟worktreeの容量は上記集計の外であり、実装時の個別棚卸しで確定します。

worktreeは `git worktree remove` で登録ごと扱います。squash/cherry-pickされたブランチは `git branch --merged` に出ない場合があるため、祖先判定だけで未マージ・削除可を決めません。PR head・マージ結果・差分の取り込みを照合し、記録済みのHEADを残します。ローカル/remoteブランチの削除はworktree解放とバックアップを確認した後です。

差分がある `.git/harness-eval/hook worktree` と `review-agent` は実受入の証拠として保持します。アプリ管理の `3da0`・`bb1b` はセッションとの対応を確認し、通常の管理導線で解放できるものだけ扱います。個人DBへの直接書込や、所有不明なフォルダの削除は行いません。

削除操作は一覧・理由・容量・復元方法を先に保存し、既定はdry-runとします。実削除は確定した絶対パスの許可リストに限定します。Windowsではreparse pointや実体パスの逸脱も検査します。repo全体への `git clean -fdx` や、`.git/` 一括削除、シェルをまたいだ削除は使いません。以前の自動承認レビューに拒否された再帰削除を別経路で迂回しません。

## 維持する構造とその理由

- `docs/` の記事名・章・categoryは維持します。サイト生成は章名と記事名からURLを作るため、配置だけの都合で公開URLを変えません。
- ルートとwebsiteのpackage/lockfileは、検証ツールと公開アプリの別環境として維持します。依存更新やworkspace化は今回に混ぜません。
- `.agents/`・`.claude/`・`.codex/`・`.github/` は製品の認識入口です。`CLAUDE.md` と `.claude/skills/` は必要な生成コピーであり、削除対象ではありません。
- 実働hookのadapter/core/bootstrap、CLI名と位置、`automation/*.txt`、`freshness-automation.md` は維持します。登録済みpromptや信頼確認への影響を抑えます。
- `scripts/schemas/` は3件であり、policyと試験が参照しています。今回は場所を維持し、harnessの索引から案内します。
- Pythonサンプルの `llm_client.py` は各サンプルを自己完結させるために置かれています。似ていることだけを理由に共通ライブラリ化しません。`examples/tests/` もPythonの検証境界として維持します。
- `templates/` の3種類と `assets/diagrams/README.md` は用途・配置ルールを持つため残します。
- `research/freshness-runs/*.json`、ローカルrun状態、snapshot、digestに結び付く記録は配置と内容を保ちます。

## 移動前に解消する依存

新しい `project/` を作るだけでは検査範囲に入りません。リンク検査は [scripts/check-links.mjs](../../../scripts/check-links.mjs) の明示的なディレクトリ一覧を使っています。移動前に `project/` を加え、移動後も同じ文書が検査されることを回帰試験で確認します。新設するresearchの索引と、今回参照を変更するresearch Markdownも対象を明示して検証します。research全体へ学習記事テンプレートやlintを無条件に適用しません。

作業profileは [harness/profiles.json](../../../harness/profiles.json)、検証コマンドは [harness/verification.json](../../../harness/verification.json) と対応します。新配置を扱うハーネス作業の所有範囲を先に追加し、記事最新化profileの編集権限は広げません。

`scripts/harness-policy.mjs` の `classifyPath` は、試験領域のうち旧 `tests/harness/` をハーネス変更として扱っています。S1で新しい `tests/unit/`・`tests/helpers/`・`tests/fixtures/` の分類も明示し、所有範囲だけ対応してPR分類が取り残されることを防ぎます。

試験移動では [package.json](../../../package.json)、CI、検証一覧、eval suite、各試験のimport・fixtureコピー・root算出を同時に変えます。検出数が0件になって成功する状態を防ぎ、移動前後の試験ファイル一覧を比較します。テスト教材の不活性検査は `tests/` 配下全体を対象にし、旧 `tests/harness/` だけを走査していないか確認します。

trusted-base policyは変更候補自身の検査コードで審査される仕組みではありません。新しい配置や所有範囲を扱う互換対応を先にマージし、そのbaseで実移動を検証します。候補コードを権限付きCIで実行する変更や、必須9チェックの削減は行いません。

Markdownリンク以外にも、READMEのツリー、章索引のコード表記、スキルの手順、スクリプト定数、設定、ignoreコメントを検索します。履歴JSON・過去ログの旧パスは例外として台帳に明記し、現行参照の取り残しと区別します。記事の変更がリンク修正だけであれば、`last_updated` は進めません。

実装中に `docs/` の記事内リンクも修正する場合は、通常の記事変更manifestへ適切な変更分類を記録し、最終差分の独立レビューを受けます。配置整理という目的だけを理由に記事policyを免除しません。調査時点では、移動予定ファイルへ向いた記事本文内のリンクは見つかっていません。

定期タスクは [scripts/register-freshness-tasks.ps1](../../../scripts/register-freshness-tasks.ps1) により登録時にprompt本文と絶対cwdをコピーしており、既存タスクへのUpdateモードはありません。本計画ではその参照先を維持するため、再登録は不要です。将来これらを移す場合は、別途、対象2件だけのprompt更新・登録照合・起動確認が必要です。

## 実施工程と完了条件

| 工程 | 作業 | 完了条件 |
| --- | --- | --- |
| S0: 基準と台帳 | 新しい整理用ブランチを作成。tracked/ignored/generated/worktreeを分類し、旧新パス、削除理由、復元元、保持期限を確定 | 未保存差分・稼働runを把握し、削除対象と保持対象を個別識別できる |
| S1: 検査の先行対応 | projectのリンク走査、適切なprofile、新配置のfixture検査を追加。必要な既存検証を拡張 | 旧配置と新配置の正常/異常例を検出し、trusted baseへ先行マージ |
| S2: 計画・履歴の集約 | ルート33件と監査出力2件を移動。project/researchの索引、README構成図、時点と後継リンクを整理 | ルート15ファイル・Markdown 8。現行参照の旧パス0、歴史的参照は台帳で説明できる |
| S3: 試験配置の整理 | root単体試験12件、専用helper、固定課題2件、website単体試験4件を移動 | 同じ試験を検出・実行し、Linux/Windows・website・evalが成功 |
| S4: 不要物とローカル領域 | 確認済み旧互換入口・空placeholderを整理。生成物を再生成検証し、完了worktreeを個別解放。証拠は保持 | 削除台帳と復元方法があり、所有外データ・必要な証拠・常用ツールを失わない |
| S5: 最終受入と運用 | 新しいcheckoutから導線を実行。独立レビュー、PR/CI/マージ、公開確認、棚卸し結果を記録 | 記事URLと定期運用を維持し、計画の各対象の処置と残す理由が記録される |

S1〜S3と、S4の追跡ファイル修正を主に4〜5本のPRへ分ける見込みです。ローカル削除は公開ソースの変更と分けて記録します。各コミットとsquash本文に `Co-authored-by: Codex <codex@openai.com>` を付けます。実行量は移行台帳確定後に見直し、PR本数を達成目標にはしません。

復旧はPR単位のrevert、記録したcommitからのworktree再作成、lockfileからの依存再導入、正本からのサイト再生成を使います。削除予定の証拠をGitのreflogだけに頼って保護しません。

## 検証と再発防止

提出時には変更範囲に応じて以下を確認します。計画作成の段階では、これらの実装試験を実行済みとは扱いません。

- rootの `npm run check`、スキル同期、Windows重点試験、オフライン `eval:harness`。既存272試験を基準に、移動だけで対象が脱落していないことを確認します。
- 移動文書のリンク・アンカー・大文字小文字、コード表記の現行参照、移動した生証拠のSHA一致を確認します。
- websiteの単体試験、公開相当のclean build、ブラウザー確認。全記事のURL集合が同じで、代表ページ・用語集・依存マップ・検索が使えることを確認します。
- Python横断試験と、サンプルREADMEから記事への往復リンクを確認します。構造整理のために有料API試験を追加しません。
- 必須9チェックとmain CI・Pages公開を確認します。配置を保った本番定期タスク2件のprompt・cwd・状態が変わっていないことも照合します。
- hook設定を変更しない場合は定義の一致を確認します。実装中に変更が必要になった場合だけ、公式導線で再信頼し、関連する実イベントを再試験します。
- Windows限定sandboxのGit所有権エラーは [既存の実施記録](../../../harness-implementation-status.md) と区別します。別環境での成功により未成功条件を消しません。

恒久的な追加は、既存検査の必要な拡張と、小さな構造台帳・棚卸し入口に限定します。ルートへ置くファイルの許可範囲、正本/生成物の区分、新しい文書ディレクトリの検査対象、教材の不活性化、保持期間と削除条件を機械検証できる形にします。内容の正しさや全ファイルの不要判定まで自動化したとは扱いません。

新しい計画と実施記録は `project/` に追加し、READMEには長いファイル列挙を戻しません。worktree作成時に所有タスク・元HEAD・終了条件・残す証拠を記録し、完了時に解放可否を判定します。容量棚卸しは、Git本体・依存・生成物・評価証拠・補助ツール・別worktreeを分け、除外領域を明示します。

## 最終的に得たい状態

ルートの入口、学習記事、現行の運用、採択計画、実施証拠、試験と生成物の置き場が明確になります。追跡文書の削除量より、現行手順を見つけられること、移動しても検査が続くこと、不要な作業コピーを個別に解放できることを完了の基準にします。
