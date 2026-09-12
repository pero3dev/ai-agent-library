# Git操作の共通規約

2026-09-12採択。AgentのGit操作ではこの規約を読み、形式の定義は [git-conventions.json](git-conventions.json)、検査は [check-git-conventions.mjs](../scripts/check-git-conventions.mjs) を使います。過去のcommitや保存refは書き換えず、導入後に提出する変更へ適用します。日本語要約の意味・typeの妥当性・名義の事実確認は内容レビューで確認します。

## 作業開始と権限

作業記録に目的、所有パス、元HEAD、終了条件、外部操作の許可根拠を残します。最初に `git status --short --branch`、`git remote -v`、対象PRとworktreeの利用状況を確認します。push先のリポジトリ名・公開範囲と、依頼された到達点を照合します。既存の許可を引き継ぎ、同じ通常作業に確認を要求し直しません。規約の存在だけで新しいpush・マージ・タグ公開の許可を得たとは扱いません。

作業ブランチは最新の取得済みmainを起点にします。未保存差分がある場合は所有者と作業を分け、他者の差分をstash・reset・一括stageで取り込みません。mainへ直接commit/pushせず、PRで検証します。履歴の修正は所有する未公開commitだけを対象にし、公開済みの履歴は追加commitで修正します。通常の修正に `--force`、`--admin`、`--no-verify`、保護ルールの無効化は使いません。

## ブランチ名

通常は `<type>/<英語ケバブケースの目的>` です。例: `docs/agent-loop-examples`、`fix/search-navigation`、`chore/git-conventions`。個人名、Agent名、作業順の番号だけ、`tmp`・`misc`など目的不明な語は避けます。typeは次節と同じ一覧を使い、scopeや日本語はブランチ名へ入れません。

定期最新化の `automation/freshness-<run_id>` はruntimeが返した名前をそのまま使います。これはfreshness policyの境界なので、見た目を揃えるために変更しません。`main`、detached HEAD、内部の `refs/harness/`・`refs/freshness/`・`refs/archive/` を通常のPR作業ブランチとして扱いません。

## 件名

通常commit、PRタイトル、squash件名は `type(scope): 日本語の要約` とします。要約は具体的な変更結果を表し、技術名は英語のままで構いません。件名は全体で72 Unicode文字以内、改行・末尾句読点・連続した空白を入れません。未記入の `{{...}}`、`fixup!`、`squash!`、`WIP`、曖昧な「修正する」「更新する」だけの件名を提出しません。`!`は使わず、互換性への影響は本文の影響欄に記します。

| type | 主目的 | 例 |
| --- | --- | --- |
| `feat` | 新しい機能・能力 | `feat(website): 記事のタグ絞り込みを追加する` |
| `fix` | 誤った動作の訂正 | `fix(website): 検索結果から記事へ遷移できるようにする` |
| `docs` | 記事・調査・規約など文章の変更 | `docs(docs): Agentループの停止条件を明確にする` |
| `refactor` | 挙動を保つ実装の整理 | `refactor(harness): 共通のパス検査を集約する` |
| `perf` | 性能の改善 | `perf(website): 検索索引の読込を遅延する` |
| `test` | 試験の追加・修正 | `test(harness): 中断後の復元を検証する` |
| `build` | 依存・ビルド方式 | `build(website): 固定依存を更新する` |
| `ci` | CIの実行条件・構成 | `ci(ci): 文書検査の対象漏れを防ぐ` |
| `chore` | 上記に含まれない保守・運用整備 | `chore(repo): 完了作業の記録を整理する` |
| `revert` | 既存変更の取り消し | `revert(website): 検索方式の変更を取り消す` |

scopeは `docs`、`research`、`examples`、`website`、`harness`、`automation`、`ci`、`repo` です。変更の主対象を1つ選び、複数領域にまたがることだけで必ず `repo` にしません。記事の事実訂正は `docs(docs)`、検査コードの不具合修正は `fix(harness)` のように成果物の主目的で判断します。独立した変更理由はcommitを分けます。

GitHubがマージ後の件名へ付ける末尾の半角空白と `(#123)` はcommit検査で許容します。この連番をPRタイトルや手書きのsquash件名へ先に付けません。PRとsquashの意味やscopeを別々に変えず、最終差分に合わせて同じタイトルに揃えます。

## 通常commitの本文と名義

[commit-message.txt](commit-message.txt)をコピーして埋め、type/scopeも実際の目的へ変更します。理由・検証・影響の3欄を空行で区切り、最後の連続したtrailerブロックにAgentと共同編集者を置きます。長い説明は欄の次行へ続けられます。

```text
fix(harness): 未記入のPR本文を検出する

理由: 空の検証欄でも提出できていたため、実行した確認内容を必須にする。

検証: npm run check が成功。失敗例を含む形式検査も成功。

影響: Git操作の検査のみ。記事本文と公開URLへの変更はなし。

Agent: codex
Co-authored-by: Codex <codex@openai.com>
```

検証していない場合は「未実施」と理由を具体的に書きます。失敗・未実施・静的・モック・実Agent・GitHub・公開確認を区別し、コマンド名だけで成功を示唆しません。影響がなければ「なし」と対象・条件を必要に応じて補足します。trailerの後ろに説明を続けません。`Co-authored-by` の綴りと大文字小文字を変えず、同じ名義を重複させません。

| 実際の編集参加 | Agent trailer | 必要な共同編集者 |
| --- | --- | --- |
| Codex | `Agent: codex` | `Co-authored-by: Codex <codex@openai.com>` |
| Claude Code | `Agent: claude` | `Co-authored-by: Claude <noreply@anthropic.com>` |
| 両方 | `Agent: codex,claude` | 上記2行をCodex、Claudeの順に記載 |
| AIが編集に参加していない | `Agent: none` | AI名義を付けない |

この表示名はリポジトリ内の固定名義であり、モデルの版を追記しません。実際に共同編集した人は本人の正しい名義を追加できます。レビューだけのAgentや利用していないAgentを共同編集者にしません。著作者を隠す目的で `none` を選ばず、Agentが変わったら本文と検査の `--agent` を合わせます。検査は申告と形式の整合を確認するもので、本人性を証明するものではありません。通常commitのGit author、個人の `user.name`・`user.email` は変更しません。

## 保存・main同期・取り消し

runtimeの保存commitは `chore(harness): 作業状態を保存する`、隔離評価の準備commitは `test(harness): 隔離評価環境を準備する` に固定します。`Agent: automation` と `Generated-by: ai-agent-library` で機械生成と示し、AI共同編集者を捏造しません。内部のGit authorは `AI Agent Library automation <automation@ai-agent-library.invalid>` です。`.invalid` は配送しない内部記録用の名義で、通常のユーザー設定は変更しません。`automation` はこの内部形式専用で、通常commitやPRの編集者として選びません。

復元で保存commitが作業履歴へ入っても、形式検査を通るように共通formatterを使います。導入前の非公開WIP保存を復元した場合は、復元refを残して所有する未公開部分だけを通常commitへまとめ直してから提出します。既に共有した履歴をこの目的で書き換えません。

main同期のmerge commitも通常形式に従います。例えば `chore(repo): mainの変更を作業ブランチへ取り込む` とし、取り込み元SHA・競合解消・再検証を本文へ記録します。fast-forward可能なら `git merge --ff-only origin/main` で取り込み、新しいcommitを増やしません。履歴が分岐している場合は `git merge --no-commit --no-ff origin/main` の結果を確認し、作成が必要なmerge commitには検証したメッセージファイルを使います。既存レビューに影響した内容は再レビューします。

revertは取り消すSHA、理由、影響、再検証を同じ本文形式へ記載します。Gitが自動生成した `Revert "..."` をそのまま提出せず、未commitの取り消し差分を確認してから通常形式でcommitします。タグやリリースは今回の自動化対象ではなく、依頼された場合だけ別の公開条件を確認します。

### push後にcommitの形式違反が見つかった場合

コードの修正は追加commitで行えますが、メッセージ違反は後続commitでは消えません。CIはPR内の全新規commitを検査するためです。通常作業では元branch・PR・復元refを保持し、最新mainから別の所有branchを作り、必要な差分を確認して正規形式のcommitとして作り直します。元PRとの対応を作業記録と代替PR本文へ記し、再レビューとローカル検証後に代替PRを作り、そのPRで全CIを確認します。置換先を確定してから元PRを閉じ、共有履歴をforce pushで書き換えません。

定期最新化はbranch名の変更でpolicyを外さず、[運用手順](../freshness-automation.md)のrun操作を使います。旧runの `notes` に旧PR・head・復元ref・再作成理由、`pending` に未解決事項を記録し、残件のある系統を `completed_systems` から外して `checkpoint` を取ります。`finish --outcome held` は状態・pendingの保存とlock解放を行いますが、差分snapshotは作らないため、必ずcheckpointの成功後に実行します。旧証拠を保持したまま `prepare --mode manual --ids <対象ID>` で置換を開始します。`suspend`（外部待ちの場合は `--wait-until` / `--wait-reason`）は同じrunの継続用であり、新runへの置換には使いません。

`prepare` は再開待ちrunを先に返す場合があるので、`resuming: false` と対象系統の一致を確認します。別runが返った場合はその作業を取り違えず、置換処理を進めません。新runが返した `automation/freshness-<run_id>` と証拠パスを使い、新base・run_id・digest・独立レビュー・head・CIを作り直します。新runの `previous_pending` に含まれる旧pendingのIDを、実際の解消後だけ `resolved_pending_ids` に記録し、旧証拠を新runの成功証拠として複製しません。

## 提出・PR・squash

Gitへの入力はUTF-8のファイルで準備します。PowerShellでは `;` で並べただけでは失敗後も次の操作が動くため、検査ごとに終了コードを確認します。shell文字列への本文埋め込みや、未確認ファイルを含む `git add .` を避け、所有パスを明示してstageします。

```powershell
git diff --cached --check
if ($LASTEXITCODE -ne 0) { throw 'ステージ差分を修正してください' }
node scripts/check-git-conventions.mjs --message-file <message.txt> --agent codex
if ($LASTEXITCODE -ne 0) { throw 'メッセージを修正してください' }
git commit -F <message.txt>
```

PR本文は [.github/pull_request_template.md](../.github/pull_request_template.md) を使い、「変更内容」「検証」「影響・残件」の3節と末尾の名義を埋めます。各節に実際の変更前後、実行した検証と結果、互換性・未実施範囲・残件を記します。該当なしも理由を添えて書き、テンプレートの未記入欄や無関係な見出しを残しません。関連Issue・資料・実施記録は該当する節へリンクし、依頼会話や実装の試行錯誤をそのまま転載しません。Issueを閉じる記法は本当にそのIssueを完了する場合だけ使います。

`gh pr view --json title,body,headRefName,headRefOid,baseRefName,baseRefOid` で取得したJSONは検査の入力にできます。作成前は同じ内容の `{ "title": "...", "body": "...", "branch": "..." }` でも構いません。検査のために外部操作を実行する必要はありません。

```text
node scripts/check-git-conventions.mjs --pr-file <pr.json>
node scripts/check-git-conventions.mjs --base <base SHA> --head <head SHA> --pr-file <pr.json>
node scripts/check-git-conventions.mjs --squash-file <pr.json> --body-file <squash-body.txt>
```

push前にremote・base・既存PR head・対象branchとロックを再確認し、同じbranchのPRがあれば更新します。PR作成・編集の本文は `--body-file` を使います。新しいcommitだけでなく、タイトル・本文を変えた場合も形式検査の再実行結果を確認します。

merge前に最終PRのJSONとheadを取得し直し、本文から共通formatterでsquash本文を生成します。PRの変更内容を「理由」、検証を「検証」、影響・残件を「影響」に移し、名義を維持します。次の操作ではJSONから得た値を各引数へ渡し、PRタイトルをshellコードとして展開しません。

```text
gh pr merge <PR番号> --auto --squash --match-head-commit <確認したhead SHA> --subject <検査済みPRタイトル> --body-file <squash-body.txt>
```

既存9必須チェック・独立レビュー・作業区分の条件を満たすことが前提です。GitHubの自動生成したcommit一覧に本文を任せず、PRとsquashの情報を揃えます。予約を完了とせず、実merge SHA・main CI・必要な公開内容まで確認します。マージ後は取得したmerge SHAの `%B` をUTF-8ファイルに保存し、`--message-file` で再検査して、予約した件名・本文・名義との一致も確認します。PRのtitle/bodyはheadとは別に変わるため、予約後にmetadataを変更する場合は自動マージを解除し、検査・squash本文生成・予約をやり直します。

## 検査と保守

`npm run check:harness` は規約設定とテンプレートの整合を検査します。`harness-policy` CIはtrusted baseのコードで、イベントJSONのPR metadataとbaseからheadまでの新規commitを読み取ります。候補コード・候補設定を権限付きの実行面で起動しません。merge commitも検査対象です。実在しないSHA、未記入の本文、不正な名義、書式の違うbranchを失敗にします。

ローカルの明示検査とCIが形式を検査し、commit内容の正しさ・本人性・外部操作の権限は別に確認します。個人のGit templateや `core.hooksPath` を自動変更する仕組みではありません。新しいtype/scope、Agent名義、内部生成形式を増やす場合は、JSON契約・規約・テンプレート・formatter・回帰試験を同じ変更で更新します。規約の変更は既存の履歴へ遡って適用しません。
