# GitHub Pages の診断と復旧

対象は現行の [.github/workflows/ci.yml](../.github/workflows/ci.yml) が公開する [AI Agent Library](https://pero3dev.github.io/ai-agent-library/) です。音声制作・Release公開のjournal回復は[音声運用](../automation/audio/README.md)で扱います。ここでは本文・検索・Mermaid・音声入口を含むサイトの公開を診断します。

## 対象SHAと証拠を固定する

最初に取得したmain SHAを保持し、そのSHAのCIとdeploymentを調べます。調査中にmainが進んだら、元SHAの結果と新SHAの結果を分けます。以下は読み取りだけです。`gh` は認証済みの環境で使います。

```powershell
$pagesRepo = 'pero3dev/ai-agent-library'
$pagesSha = gh api "repos/$pagesRepo/commits/main" --jq .sha
if ($LASTEXITCODE -ne 0) { throw 'main SHAを取得できません' }
gh run list --repo $pagesRepo --commit $pagesSha --event push --json databaseId,name,headSha,status,conclusion,url
if ($LASTEXITCODE -ne 0) { throw 'CI一覧を取得できません' }
gh api "repos/$pagesRepo/actions/variables/DEPLOY_PAGES"
if ($LASTEXITCODE -ne 0) { throw '公開条件を取得できません' }
gh api --paginate "repos/$pagesRepo/deployments?environment=github-pages&per_page=100" --jq '.[] | {id,sha,created_at,statuses_url}'
if ($LASTEXITCODE -ne 0) { throw 'deployment一覧を取得できません' }
```

一覧から **`name: CI`、push event、同じ`headSha`** のrunを選びます。deploymentも`sha`の一致を確認し、対応するIDを指定して詳細を取得します。該当run/deploymentがないことを成功と扱いません。

```powershell
# 実際に一覧で確認したIDへ置き換える。
$pagesRunId = '<CI run ID>'
$pagesDeploymentId = '<deployment ID>'
gh run view $pagesRunId --repo $pagesRepo --json headSha,event,status,conclusion,jobs,url
if ($LASTEXITCODE -ne 0) { throw 'runを取得できません' }
gh api "repos/$pagesRepo/deployments/$pagesDeploymentId/statuses" --jq '.[] | {state,environment_url,log_url,created_at}'
if ($LASTEXITCODE -ne 0) { throw 'deployment statusを取得できません' }
```

記録には日本時間の確認日、UTC取得時刻、対象main SHA、run ID/URL・event・headSha、job名/結論、deployment ID/SHA/最新status、公開URL、画面確認のブラウザーと条件を残します。公開画面自体にはSHAを証明する埋込み表示がないため、deploymentの対応と画面の観測を別々に記録します。

## 4つのケースと次の操作

| 状態 | 現CIとの照合 | 次の操作 | 終了条件 |
| --- | --- | --- | --- |
| deployがskip・起動しない | workflowの起動はpush/PR。deployのifは`refs/heads/main`かつ`DEPLOY_PAGES == 'true'`。PRのskipは正常。main push runの有無・変数・needsの結論を確認 | PR runならmain反映待ち。mainで起動条件が不一致なら設定の責任者へ原因と必要な変更を提示。workflow_dispatchは未定義なのでdispatchを案内しない | 目的のSHAのmain push runと公開条件が一致し、同SHA deployment成功と公開内容を確認 |
| 必須job・deployのneedsが失敗 | `lint/actionlint/build/docs/examples/harness/harness-windows/audio-browser/audio-webkit`がdeployのneeds。policyは別workflow。音声jobの表示名は`Audio playback regression`と`Safari audio playback regression` | ログから原因を限定する。一時的な取得/runner障害だけなら当該runの失敗job再実行候補を作る。コード・依存・検査失敗は通常の修正PRへ | 全必要job成功、同SHA deploy成功、公開内容確認 |
| deploy jobが失敗 | needsは成功、deploy job/statusがfailure。Pages設定・権限・artifact取得・サービス障害をログで分ける | 一時的失敗なら同runの失敗job再実行候補。設定問題は必要な権限と変更だけを責任者へ提示。artifact期限切れなら旧artifact再公開を避け、現mainの通常PR/push CIで再構築 | 同SHAまたは修正PRの新SHAについて全jobとdeployment成功、公開内容確認 |
| deploy成功後の表示不具合 | deployment最新statusと対象SHA一致を先に確認。公開URL・basePath・キャッシュ・本文・検索・Mermaid・音声入口をブラウザーで確認 | 再読み込み/新規ブラウザー環境で再現条件を記録。成果物の不具合なら現mainから修正PR、公開相当ビルドと回帰を追加 | 修正SHAのCI/deployment成功と、元の再現条件で不具合解消 |

再実行が適切な場合の候補コマンドは `gh run rerun <run ID> --failed --repo pero3dev/ai-agent-library` です。ログ取得は `gh run view <run ID> --log-failed --repo pero3dev/ai-agent-library`。CIは一般的な`workflow_dispatch`を持ちません。再実行は実際の外部操作であり、この手順の文書検証で実行するものではありません。設定変更・再実行・修正PRは依頼とセッションの許可に従います。

復旧でmainのreset/force-push、保護の緩和、古いartifactの再公開を行いません。廃止した動的図解や私有バックアップの成果物を復旧対象へ混ぜません。新しい修正PRを作った場合は元SHAとの関係を記録し、新SHAで検証を取り直します。

## 公開内容の正常確認

deployment成功後、同じ公開URLで次を確認し、条件と時刻を残します。

1. 本文: [ツール使用](https://pero3dev.github.io/ai-agent-library/docs/concepts/tool-use/)を開き、本文・数式・通常リンクが読める。
2. 検索: 「ツール使用」から対応記事へ移動でき、URLに`/ai-agent-library`が保持される。
3. Mermaid: [学習ロードマップ](https://pero3dev.github.io/ai-agent-library/docs/overview/learning-roadmap/)の図が描画され、テーマ変更・拡大・閉じる操作を確認する。
4. 音声入口: [音声一覧](https://pero3dev.github.io/ai-agent-library/audio/)と音声付き記事の入口を確認する。ブラウザーの実再生・通信・実iPhone操作は、それぞれ実施した場合だけ別項目として記録する。

「HTTP 200」「CI成功」「deployment成功」「画面操作成功」を分けます。画面確認だけで全記事・実API・Safari実機の受入を完了としません。読み取り試行の実施結果は[Issue解決記録](../project/records/2026-10-03/issue-resolution.md)を参照してください。
