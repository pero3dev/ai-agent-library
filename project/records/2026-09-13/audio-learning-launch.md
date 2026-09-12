# 音声学習の運用開始記録

記録日: 2026-09-13。状態: **公開・定期運用を開始**。初回2記事を公開し、残りの制作を継続しています。

[確定要件](../../plans/engineering/audio-learning.md)に沿った実装と導入を進めました。実装の経緯は[実装記録](audio-learning-implementation.md)、日常の操作と復旧は[制作・運用手順](../../../automation/audio/README.md)を参照してください。

## 作業契約

- 目的: 合格した記事音声をサイトで公開し、全公開記事と今後の追加・更新分をローカルで順次制作・検査・公開する運用を開始します。
- 許可根拠: 実装開始への「OK」と、その後の「可能なところまですべての実装完了に向けて自律的に作業を進めていただきたいです。」。制作から公開までの自動化と追加費用をかけない要件を引き継ぎます。
- 所有範囲: 音声機能の修正・検証・公開、初回カタログ、専用checkoutと定期タスク、運用文書と索引。他の作業の変更やworktreeを戻しません。
- 検証・終了条件: 最終差分の独立レビューとCI、mainの公開、実音声配信・ブラウザー再生、定期タスクの登録・起動を確認し、残る制作と実機受入を追跡できること。199記事すべての生成完了は長期の定期運用で進めます。

## 利用と運用

[音声一覧](https://pero3dev.github.io/ai-agent-library/audio)と記事ページから再生できます。画面下のプレイヤーで15秒移動、速度変更、章への移動、再生リストの並べ替えができます。ページ間で再生を維持し、位置・リスト・速度は同じブラウザー内に保存します。

現在の公開対象は199記事です。初回は概要章の合格2記事を掲載し、同章のskill-mapは自動修正上限後も指摘が残るため保留にしています。以後は原則として章内で3記事以上をまとめ、章の最後の端数や残りが保留の場合も合格分を公開します。既存音声の更新はまとまりを待ちません。

| 初回音声 | 長さ | 章数 |
| --- | --- | --- |
| AI Agent 学習ロードマップ | 約26分16秒 | 9 |
| AI情報の追い方（一次情報の目利き） | 約19分58秒 | 10 |

台本制作にはClaude Codeを使い、別の実行で原文・補助資料と照合します。学習ロードマップはCopilot利用と本人のAPI呼び出し経験・実行環境の混同を2箇所訂正し、再レビュー・再合成まで完了しました。初回カタログのPRとsquashには、実際に参加したCodexとClaudeの共同編集者名義を記録しています。

音声はローカルのVOICEVOX Nemo 0.24.0とFFmpeg 9.0.1で作り、GitHub Releasesから配信します。クレジットは「VOICEVOX Nemo（女声1・男声1）」です。Extra usage無効はユーザーが確認済みで、有料APIや他の有料サービスへ自動切替しません。Claudeの普段の利用と契約枠を共有するため、制作は1回最大1記事とし、上限到達時には6時間待機します。

Windowsのタスク名は `AI Agent Library - Audio Learning` です。4時間ごと、およびログオンの2分後に実行し、ユーザーのログイン中に低優先度で動きます。PCを起こさず、重複起動を避けます。専用checkoutはGit共通ディレクトリの `audio-learning/production-checkout`、branchは `chore/audio-production-main` です。起動時にmainをfast-forwardし、依存の変更時だけ `npm ci` を行います。

専用checkoutで以下を実行すると、登録状態を確認・一時停止・再開できます。

```powershell
./scripts/Register-AudioLearningTask.ps1 -Mode Status
./scripts/Register-AudioLearningTask.ps1 -Mode Pause
./scripts/Register-AudioLearningTask.ps1 -Mode Resume
```

## 確認した証拠

- 実装[PR #35](https://github.com/pero3dev/ai-agent-library/pull/35)はmainへ反映し、[CI 34714897460](https://github.com/pero3dev/ai-agent-library/actions/runs/34714897460)のPages deployが成功しました。
- 公開検査URLの修正[PR #36](https://github.com/pero3dev/ai-agent-library/pull/36)は `f668c2328ec36949d44bd5177beae4d30b16781b` としてmainへ反映。[CI 34715702761](https://github.com/pero3dev/ai-agent-library/actions/runs/34715702761)もdeployまで成功しました。
- 初回カタログ[PR #37](https://github.com/pero3dev/ai-agent-library/pull/37)は10チェックを通過し、`983a0e00def0fa4bb82da5be18c80ac9f0d25188` としてmainへ反映しました。[main CI 34715968053](https://github.com/pero3dev/ai-agent-library/actions/runs/34715968053)はdeployまで成功し、公開証拠と音声一覧の200応答を確認しました。
- 音声修復・CI待機の[PR #38](https://github.com/pero3dev/ai-agent-library/pull/38)はmainへ反映し、[CI 34717240915](https://github.com/pero3dev/ai-agent-library/actions/runs/34717240915)のdeployまで成功しました。ローカル `npm run check` は431件すべて成功、skipなし。合成43件には実FFmpegによる不良断片の修復を含み、公開28件と両差分の独立レビューも完了しました。
- 公開待ちPRの更新順序は[PR #39](https://github.com/pero3dev/ai-agent-library/pull/39)で修正します。公開処理32件、全体435件がskipなしで成功し、独立レビューは指摘なしでした。最終CIはPRで、マージ・配信確認はローカルの `launch-completion.json` で追跡できます。
- 2本とも実公開URLの先頭・末尾のRange/206と、全ファイルのSHA-256一致を確認しました。
- 本番の実Chromeで2本の連続再生、速度変更、15秒移動、記事遷移中の再生、章の頭出し、再読み込み後の位置・速度の復元を確認しました。iPhone実機や人間による聴き取り評価ではありません。
- 専用checkoutでの実wrapper起動では、main同期・依存準備・完成音声2本の再利用・カタログPR作成が成功しました。
- 定期タスクは2026-09-13 05:05:47 JSTに自動起動し、全199記事を認識してAgentループの記事の制作を開始しました。この時点では定期実行の全工程完了をまだ確認していません。

ローカルの証拠はGit共通ディレクトリの `audio-learning/` にあります。

- `signal-recovery-check.log`: 最終修復コードの全体検査。
- `refresh-events-check.log` と `events-check-evidence.json`: 公開待ちPRの更新順序の検査と最終headの実CI。
- `publication/probes/`: 実配信URL、Range、ハッシュ、サイズ、確認日時。
- `evidence/audio-live-browser.json` と `evidence/audio-live-mobile.png`: 本番の実音声を使ったChromeの再生操作と画面。
- `jobs/`: 原文・台本・レビュー・実音声・パート別の信号検査。
- `production-checkout-first-run.log`: 専用checkoutからの実制作・公開処理。
- `installed-scheduled-task.xml` と `installed-task-first-start.json`: 実登録したタスクと自動起動の観測。
- `queue.json` と `logs/`: 制作中・完成・保留の現在の状態と各実行結果。
- `publication/pending-pr.json` と `publication/published-pr-*.json`: 公開待ちと公開確認後の証拠。存在・内容は進行に応じて変わります。

## 継続する制作と未検証事項

### 公開待ちPRの更新順序

PR #38の提出では、同じheadへのpushと本文更新が近接し、policy workflowのキャンセルが残ってGitHubのマージを止めました。キャンセルされた2実行を正規に再実行すると解消し、PR #38は `3ec24df27d07581c28f6276227414129f3f23ea2` としてmainへ反映しました。保護設定は変更していません。

同じ条件が自動カタログ更新にもあるため、既存の自律継続の許可で、`fix/audio-refresh-events` をこのmainから作成しました。所有範囲は公開処理・その回帰試験・本記録と運用手順です。本文を旧headで先に揃えてから新headをpushし、head・本文・自動マージ状態・保存済みjournalの整合を維持します。独立レビュー、再開・途中変更の回帰、最終CIと公開確認を終了条件とします。

### 制作と実機受入

保留中のskill-mapは、自動修正で解消しなかった原文との不整合を確認し、原因を直した後だけ明示的に再試行します。通常の定期運用は保留記事を飛ばして次の記事へ進みます。完成済みの有効な台本・音声は再制作せず、新規・更新記事を順次扱います。

iPhone 12 / iOS 26.1 / Safari通常タブとAirPods Pro 2 / 3の実機受入は未実施です。画面ロック中の連続再生、イヤホン操作、着信からの復帰、画面を見ずに聴く発音・自然さ・理解の確認は、[受入表](../../../automation/audio/README.md#検証と-iphone-受入)に従って別途記録します。Chromeの自動試験や台本レビューで代用したとは扱いません。
