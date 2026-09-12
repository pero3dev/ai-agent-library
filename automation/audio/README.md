# 音声学習の制作・運用

記事を日本語の二人の対話に変換し、独立した台本検査、VOICEVOX Nemo による合成、音声検査を経て公開します。[要件](../../project/plans/engineering/audio-learning.md)と[導入・検証記録](../../project/records/2026-09-13/audio-learning-implementation.md)を参照してください。

## サイトで聴く

ナビゲーションの「音声」から公開済みの回を探し、記事ページの再生ボタンからも開始できます。長い記事の前後編は別の回として表示します。再生リストに追加し、リスト内の上下ボタンで順番を変えます。

画面下のプレイヤーで一時停止、15 秒戻る・進む、速度変更、チャプターへの移動ができます。ページ間の移動でも同じ音声要素を保持します。再生位置・順番・速度は同じブラウザーに保存します。ページを開いただけでは再生を開始しません。サイトデータを削除すると保存内容は失われます。

記事が更新された場合は旧音声に「記事より古い内容です」と表示します。新音声が公開されても再生中の版を突然差し替えません。取り下げた版を新規に開いた場合は、残っている再生リストと整合させます。

バックグラウンド再生は HTML audio と Media Session を利用します。iPhone 12 / iOS 26.1 / Safari 通常タブでの実機確認は、下記の受入手順で別に行います。

## 初回の準備

Windows の PowerShell で、リポジトリのルートから実行します。Node.js 22 以上、Git、GitHub CLI、Claude Code が必要です。

```powershell
npm ci
npm --prefix website ci
./scripts/Install-AudioLearningTools.ps1
claude auth login --claudeai
claude auth status
```

導入スクリプトは Nemo 0.24.0 CPU と FFmpeg 9.0.1 を指定の SHA-256 で検証し、Git 共通ディレクトリの `harness-tools/audio-learning/` に展開します。実行パスは同じ Git 共通ディレクトリの `audio-learning/tools.json` に保存します。マシン全体の PATH は変更しません。配布元のファイルが更新されハッシュが一致しない場合は停止するので、正規の新版を確認して固定値を更新します。

Claude のアカウント設定で Extra usage を無効にします。API キー、API 用の Console ログイン、追加使用枠への自動切替は利用しません。プログラムからアカウントの追加使用設定は読み取れないため、所有者が確認した後に次を保存します。

```powershell
$audioGit = (& git rev-parse --path-format=absolute --git-common-dir).Trim()
$audioConfirmation = Join-Path $audioGit 'audio-learning/account-confirmation.json'
$audioConfirmed = @{
    subscription_only_confirmed = $true
    extra_usage_disabled_confirmed = $true
    confirmed_at = [DateTime]::UtcNow.ToString('o')
} | ConvertTo-Json
[IO.File]::WriteAllText($audioConfirmation, $audioConfirmed, [Text.UTF8Encoding]::new($false))
```

認証・確認記録・ツールパス・制作中の台本・音声・ログは Git に追加しません。アカウント設定を変更したときは制作タスクを止め、確認記録も見直します。通常の Claude 利用と使用枠を共有します。無料枠の残量を予約する仕組みではありません。

## 制作する

対象は `docs/NN-section/article.md` の `status: published` の記事です。索引、draft、用語集、運用文書を除きます。既存記事と追加・更新された記事を同じ方法で見つけます。

```powershell
# 対象一覧だけを確認。Claude も音声エンジンも呼びません。
npm run audio:plan

# エンジンの起動も含め、最大 1 記事を制作。公開操作は dry-run です。
./scripts/Invoke-AudioLearning.ps1 -Limit 1

# 章のまとまりを制作。1 本の失敗で残りを停止しません。
./scripts/Invoke-AudioLearning.ps1 -Section 00-overview -Limit 3

# エンジンが動作中なら、各前提を個別診断できます。
npm run audio:doctor
```

[config.json](config.json)で話者、速度、分割合成の長さ、1 回の件数、修正回数を指定します。既定は 1 回 1 記事、修正は最大 2 回、記事間は 60 秒待機です。使用上限に達したら状態を保存して 6 時間待機します。既定の声は聞き手が女声1、解説者が男声1、クレジットは「VOICEVOX Nemo（女声1・男声1）」です。[Nemo の規約](https://voicevox.hiroshiba.jp/nemo/term/)を参照してください。

制作処理は次を順に行います。

1. 記事全文の改行を正規化して SHA-256 を取り、節ごとの対応表を作ります。
2. Claude Code の隔離したツールなしの実行で対話台本を生成します。別の実行で原文との対応、条件・例外・設計理由・重要な識別子、脱落・追加された断定を検査します。
3. 不合格の指摘を使って台本を修正します。上限に達した記事だけを保留にします。
4. 短い発話に分けてローカルで合成し、検証済みの断片を再利用します。チャプターの境界で最大約 60 分に分け、音量を調整して MP3 にします。
5. デコード、長さ、無音、結合前後の時間を検査します。制作中に原文が変更されていたら公開用の完了状態にしません。

台本検査と音声信号検査は、発音や自然さを人間が聴いて確認した記録ではありません。問題に気づいた回は、元記事・エピソード ID とともに確認し、該当箇所を直します。

## 状態の確認と再開

状態は Git 共通ディレクトリの `audio-learning/queue.json`、記事ごとの成果物は `audio-learning/jobs/` にあります。通常の再実行は完成した音声を再生成せず、中断した作業を継続します。修正上限に達した記事は自動で無限に再試行しません。

```powershell
# 保留原因を修正した後、明示的に再試行します。
node scripts/audio-run.mjs --run --retry-held --section 01-concepts --limit 1

# 公開に必要な原文・レビュー・音声の対応を検査するだけです。
npm run audio:publish
```

記事が変わると新しいソースハッシュの作業として検出されます。完成済みでも音声ハッシュが一致しなくなった場合は再生成します。処理が起動中なら別プロセスはロックにより重複実行を避けます。PC の停止後は保存した台本・音声断片を使って継続します。

## 公開・更新

公開処理は `--apply` を付けた場合に実行します。初回の登録先は公開リポジトリ `pero3dev/ai-agent-library` の GitHub Releases です。別サービスや課金方式へ自動で切り替えません。保管・帯域の条件と制約は[実現性調査](../../research/audio-learning-feasibility-2026-09-13.md)を参照してください。

```powershell
# 検証済み音声をアップロードし、カタログだけを更新する PR を作ります。
node scripts/audio-publish.mjs --apply

# 必須チェックと保護条件を満たした PR の自動マージも含めます。
node scripts/audio-publish.mjs --apply --auto-merge
```

通常は同じ章で 3 記事以上のまとまりを公開します。章の最後の端数や、残りの記事が保留になった場合も、合格した記事を進めます。公開済み記事の新版は待たせず差し替えます。

原文を `origin/main` と照合し、レビュー済みの台本・音声ハッシュを確認してから、不変の版名でアップロードします。公開 URL の先頭・末尾の Range 応答とファイル全体のハッシュを確認した後、[公開カタログ](../../website/audio/catalog.json)を更新する PR を隔離した worktree で作ります。保護条件・必須 CI が確認できなければマージを保留します。作業者の main や未保存のファイルを上書きしません。

通常の改訂では古い音声ファイルを自動削除しません。重大な誤りや権利上の問題で取り下げる場合は、対象記事の全パートをカタログから外す PR を作成します。音声ファイル自体の配信停止も必要なら、対象 Release asset を特定して削除する別の明示的な操作が必要です。カタログから外すだけでは、既存の直接 URL まで無効にはなりません。

## Windows の定期実行

公開運用には、実装が main に反映された後の専用 checkout を利用します。branch は `main` または `chore/audio-production-main` とし、未保存の変更を残しません。`-SyncMain` が起動時に fetch と fast-forward を行い、新規・更新記事を取り込みます。更新に失敗した場合は reset せず停止します。普段の開発 branch の未公開記事を自動公開の正本にしません。

タスクはユーザーのログイン中に低優先度で実行し、PC を起こしません。既定は 4 時間ごとに最大 1 記事です。初期制作を増やす場合も Claude の普段の利用を優先して上限を調整します。専用 checkout の root で `npm ci` を済ませてから次を実行します。

```powershell
# 登録内容を確認するだけです。
./scripts/Register-AudioLearningTask.ps1 -Mode Xml -Publish -AutoMerge -SyncMain

# この checkout から実行するタスクを登録します。
./scripts/Register-AudioLearningTask.ps1 -Mode Install -Publish -AutoMerge -SyncMain

./scripts/Register-AudioLearningTask.ps1 -Mode Status
./scripts/Register-AudioLearningTask.ps1 -Mode Pause
./scripts/Register-AudioLearningTask.ps1 -Mode Resume
```

登録済みの同名タスクは上書きしません。起動中の重複実行を避け、次の起動時に状態から継続します。wrapper が起動したエンジンだけを終了し、利用者が先に起動していたエンジンは終了しません。登録成功、制作成功、PR の CI 成功、公開サイトへの反映は、それぞれ別の確認結果です。

## 検証と iPhone 受入

```powershell
npm run check
npm --prefix website test
$env:STATIC_EXPORT = '1'
$env:NEXT_PUBLIC_BASE_PATH = '/ai-agent-library'
npm --prefix website run build:clean
npm --prefix website run test:browser
```

再生の fixture 試験は `AUDIO_TEST_CATALOG=tests/browser/fixtures/audio-catalog.json` と `NEXT_PUBLIC_BASE_PATH=/__audio-test` で別に静的ビルドし、`npm --prefix website run test:audio` を実行します。テストの音は教材ではありません。通常の公開ビルドへ戻すときは `AUDIO_TEST_CATALOG` を解除してビルドし直します。CI は専用 job を使い、その出力を公開しません。

実際に公開した音声で、iPhone 12 / iOS 26.1 / Safari 通常タブにて以下を確認します。Chromium の自動試験や Media Session のモックだけでこの表を合格にしません。

| 操作 | 合格条件 |
| --- | --- |
| 記事から開始し、別の記事へ移動 | 音声と位置が途切れず、常駐プレイヤーで操作できる |
| 画面ロック、他アプリ使用 | 再生が続き、ロック画面から停止・再開できる |
| 2 回以上をリストに追加して画面ロック | 終了後に次の回へ順番どおり進む |
| AirPods Pro 2 / 3 の操作、取り外し | 再生・停止が意図どおり動き、アプリに状態が反映される |
| 15 秒移動、チャプター、速度変更 | 正しい位置・速度で再生を継続する |
| ページ再読込、Safari を再度開く | 勝手に再生せず、前の位置・リストから再開できる |
| 通信断、回復、着信の割り込み | 再生失敗が分かり、再開操作で戻れる |
| 実装を含む回を画面を見ずに聴く | 話者が区別でき、略語・条件・設計理由を理解できる |
