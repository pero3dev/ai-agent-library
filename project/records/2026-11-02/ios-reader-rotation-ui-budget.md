# 回転UIの共有時間枠の追加配分

2026-11-02の私有Source5候補である。実PR320 head `89e00df21dfde6a93dd75f70c847b0f61b733d6a`（tree `64f6316cffbcae9efff5214de0b0a2f4ca257636`、2876件）を親に、回転workflow1・新記録2・索引2だけを追加する。600秒枠での新しいUI成功やmain採用は未受入である。

## 保存された回転試験の停止

[head89の回転run](https://github.com/pero3dev/ai-agent-library/actions/runs/41358339476)のattempt2、job125005995253は、UIが実行中にNodeのspawnSync xcodebuild ETIMEDOUTでSIGKILLとなった。executionのexitはnull、実command timeoutは419977ms、console上のUI区間は421.987758秒だった。case開始1、完了leaf0、停止までのassertion-error出力0であり、完了したXCTest assertion失敗や回転成功とは数えない。

実stdoutは約205.01秒でlandscape capture、205.02秒でportraitへのlive復帰を記録し、219.01秒のR24可視性計測中に途切れた。続くR1・しおり・最終offset・captureは未観測で、strict1 auditもskipだった。420−219.01の約201秒は起動やcase外などを含む概算であり、純粋な起動時間の実測値や600秒で完了する予測ではない。

Rootは公式artifact ID13104848687の全ZIP5,937,804Bを取得し、公式SHA-256 `527d78d3b6101c4f19c4e90623931508986b45648e5d363af004a142e1049829`との一致、source-head/treeとexecution/intentを確認した。stdout81,629BのSHAは `a23c9b5b085dec1d154406a5af8f488d17bc71c5cbe01ddf7130ddbd829cbf6e`である。初回のpreUI停止と今回の不完了を別に保持し、外部retryは許可された1回を使用済み、追加は0回である。補助terminal票の古いattempt1表示は上書きせず、公式run/job/artifact-2と別分類票を正とする。

## 5個の数値だけを変更する

専用driverは`.github/workflows/ios-reader-reflow.yml`内のinlineコードである。`ios/tests/reader-reflow-preflight.mjs`は実head89に存在せず、新設しない。共有UI stageとUI spawn上限を420000msから600000ms、UI stepを8分から12分へ配分する。15stepの明示上限総和は42分から46分、jobは43分から47分となり、総和に対する余裕1分を保つ。commentを含めた5literalだけを変え、逆変換で旧workflow全文を復元できるようにする。

全case本文・2case・53assert・phase最大15getter、selector・待機・操作、1.25倍超と標準復帰±1pt・しおり/offset・補正gestureなしを変えない。Dynamic専用720秒とstrict1、他stage/step上限、証跡とbuffer/file容量、source固定、Simulator所有判定、always cleanupとpost処理も保持する。UI commandの時間枠だけを広げる候補であり、初回preUIのCLI timeout・OS font・製品機能を修復したとは扱わない。

## 同一コードのDynamic受入と今回の境界

[head89のDynamic run](https://github.com/pero3dev/ai-agent-library/actions/runs/41358339478)は元の1caseが260.339秒で成功し、strict1を満たした。Rootは全ZIP4,170,921Bと公式SHA `f5dd7c23ee095a76dd6746363293374e17e4af35b179ea22066d2f5eab51e319`を照合し、default→accessibility5→defaultの3phaseでRoot・fixture(sheetActual)・Reader・Tableの全12stageを観測した。strideは132.333→397.667→132.333、拡大比3.005、標準復帰差0で元のoffset許容も成功した。

これは保存済みhead89の、canonical隔離DEBUG requestと同一Font Code3の実証である。自然なOS設定のlive変更・実機・VoiceOverや全IOS-11を受入済みとせず、旧bc25の失敗と未観測fixture、旧Font記録の作成時点の未受入も履歴として残す。今回の600秒候補のCIへ過去の成功を代入しない。

## 作業単位と残件

親2876件から記録new2の2878件へ投影し、所有5（既存変更3・new2）と非所有2873を保持する。実main0a47との累積20パスは別mapで扱い、新しいNative-owned Simulator・StorageGate・改訂UI prototypeを混ぜない。索引はH1直後への段落追加だけとし旧全文を保持する。App0.2.28（30）・PBX・TODO32行14完了と全Core/Conf/Tag/Seed/Font/Dynamic/Budget/Probe履歴、Original110・Content626を保つ。

設計分析P1/P2=0は編集前の配分案への判定であり、Source5最終レビューではない。作者はPythonの静的準備とtrusted readonly Gitのmap・正逆・保護確認だけを行い、SDK/tests/Node/API/Gitwrite/managed編集・Simulator/実機を実行していない。Rootが最終レビュー・構文・形式・必要CI、実objectとfresh公式head/mainの確認を行い、新headで元の回転strict1を確認して通常保護でmainへ統合する。新mainpushは別確認とし、実機等はユーザー許可に従い未完了のまま残す。
