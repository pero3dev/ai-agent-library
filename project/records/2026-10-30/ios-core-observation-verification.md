# 保存済みCoreホスト観測の再検証

作成日: 2026-10-30。状態: 提出候補。公開parentはライセンス検査PR #309と本文位置修正PR #310を通常統合した実main `1c7e10cb1bff81bcc5251a58c820e3de3a7ed6a7`。固定バイト契約の基準は`cb66343ddc18f28f780b8f240c07910839e7cc6a`であり、現在のアプリや実機の性能受入とは区別する。

## 目的と作業契約

入力Contentは別工程で監査済みであることを前提とし、このinventory確認をSwift consumer監査の代用にしない。保存した19回のmacOSホストCLI観測について、欠測・identity不一致・改変された統計を、再コンパイルや保存commandの実行なしに検知する。所有範囲は`ios/tests/verify-core-performance.mjs`、`tests/unit/ios-core-performance-acceptance.test.mjs`、`tests/unit/ios-core-performance-private-temp.test.mjs`、`ios/tests/core-performance.md`、この記録と同名JSON、`project/README.md`、[完成版TODO](../../plans/engineering/ios-app-completion.md)の8パスである。[共通契約](../../../AGENTS.md)と[Git規約](../../../harness/git-rules.md)・[運用文書の規約](../../../harness/writing-rules.md#調査記録と運用文書)を適用する。

ユーザーによる優先度順の自律TODO実施、通常のcommit・PR・main統合までの継続依頼を許可根拠とする。先行単位の統合後に公開parentを確認し、対象試験・共通検査・独立レビュー・必要CIを経て別PRとして通常統合する。

## 検証器と試験

CLIの固定契約はCore4ソース・harness・runner・queryと199記事の原文集合を束縛する。操作者が指定した期待revisionとの一致は確認するが、Gitや署名による発行元認証や、記録どおりに実行されたことの証明は行わない。期待revisionと凍結バイトの対応は操作者が別に確認する必要がある。

正当性確認1回、各シナリオのwarmup1回と計測5回、合計19回のraw・stderr・順序・一意なPID/UUID・query結果digestを照合し、15標本の統計を再計算する。全19回でstdoutとstderrの合計1MiBを守り、warmup込み18計時区間の和を900秒と全体経過時間へ照合する。許容するのは整数ミリ秒時計の量子化幅と浮動小数点の丸めだけである。パス、symlink、型、深さ、サイズにも上限を設ける。

合成fixtureのtrusted契約は明示したJS factoryへ渡す。CLIはbuiltin固定instanceだけを使い、候補のmetadata・flag・環境変数から契約を選べない。試験は3記事・3queryと小さい合成ソースを使い、通常の記事追加やCore修正だけで過去観測の試験が壊れないよう、live記事やCoreのコピーを使わない。疎な3module構成の子Nodeでも確認した。

対象のNode試験は15件成功・失敗0、構文検査と`--help`も成功した。これは合成観測の整合性検査で、production CLIが実保存結果を受理した成功や、新しい性能標本ではない。共通検査・最終独立レビューと新head CIは公開前後に確認する。

公開parentへ結合した最初の共通検査は1203件中1187成功・15skip・1失敗だった。既存のprivate-temp試験が、Node子プロセスの準備より先に150msで終了させ、確認用markerを読めなかった。試験内の独立parentだけで`setTimeout`を制御し、実childのmarker・PID・payloadを確認してから149msと150msへ進める。実プロセスの生成・終了と一時領域の削除、外側の実時間watchdogは維持し、本体runnerのバイトと上限を変えない。これは150msの壁時計測定ではない。

独立レビュー後、実signalを通すspyで149msのgroup killが0回・150msで1回であることも同期確認し、異常時はmarkerで確認した所有childだけを後始末する。parentを意図的に停止させた私有negative controlでは、外側のwatchdogを誤って成功とせず、子の終了とfixture削除を確認した。修正後の対象6件と、同じtimeoutケースの8並列実行は成功した。ローカルはNode24であり、Node22での実行はCIで別に確認する。

## 保持する未完了事項

判定`accepted-host-observation`は保存結果の整合性に限り、性能予算は`unadopted`のままとする。最適化macOSホストCLIと、iOS Release・実機・起動入力遅延・描画・画像decode・アプリメモリを区別する。5標本からp95やSLOを採択しない。新しい実観測、製品性能の目標と受入、実機・VoiceOverは未完了で、IOS-15とTODO14/32を維持する。
