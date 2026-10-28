# iOS26本文待機の境界診断：候補と確認範囲

2026-10-28。目次をtapした後の本文見出し待機について、既存の判定を変えずに時刻と戻りBoolを記録する候補を準備した。固定SourceはPR293 head `f6561b17e0a6b7b50435e7c26878e2eccadb626f`の`NativeReaderUITests.swift`である。診断Source1の独立レビューはP1・P2が0件だった。

[手動復元](ios-reading-manual-restore.md)は[PR #294](https://github.com/pero3dev/ai-agent-library/pull/294)を通常統合したmain `d74c68179aa2053a457b964f4cf756d0a9bf77b1`、tree `fc7a9f10041461efd9de728fec2985724fd02207`、0.2.22（24）へ採用した。承認headは `a8b882c8bcd7ea6182ded4d4e2f3ebb639216160`で、全treeの一致と診断Sourceの元tupleの全文一致を確認した。この別単位は採用mainを起点とし、新たな診断PR・実trace・mergeはまだ未実施である。

## 過去の失敗とretry

[PR292の観測記録](ios-search-ui-clock.md#pr292の採用と実観測の追記)とPR293では、iOS26.5の通常2ケースの初回で、目次tap後の`requireHittable`が失敗した。各初回は1成功・1失敗である。それぞれSource・selector・timeoutを変えないretryを1回だけ行い、同じ2ケースが成功した。初回失敗は保持し、retry成功を原因修正や診断Sourceの成功へ読み替えない。

| 対象 | 初回と1回のretry |
| --- | --- |
| PR292 | [run 40626005893](https://github.com/pero3dev/ai-agent-library/actions/runs/40626005893)。固定head `358988e5876e4c8641b41286cccfd4ac4f7ffdeb`、attempt1失敗・attempt2の2ケース成功 |
| PR293 | [run 40633561964](https://github.com/pero3dev/ai-agent-library/actions/runs/40633561964)。固定head `f6561b17e0a6b7b50435e7c26878e2eccadb626f`、初回job `122635269922`失敗・retry job `122645120730`の2ケース成功 |

PR293初回要約のSHA-256は`0ad2fe9c5ea77bb38952e658ee60e15bde4524c918c7449ec50b9b59044a0557`、retry要約は`496cca170537e72879f4e8956d7836a2bcce182e5b80f543863bb43a71cbb676`で、raw logのdigestとは別である。初回のgeometry=trueはtimeout後の別の逐次採取であり、待機中もtrueだった証明ではない。AX応答・アプリ処理・CI等のどれが原因かは未確定である。

## 判定を保った診断

iOS26以降の`NativeReaderUITests`通常2ケースだけで有効にする。既定15秒、`fullyVisible`、前面barの一意性、target hittable、selector、scroll／retry上限、最終assertionを保持する。既存のvisibility呼出しは1回のままで、その戻りBoolをpredicateの戻り値と診断の双方へ使う。元の8テスト全文とfailure geometry／screenshot／hierarchy取得本体を保持し、ログのためのidentifier・label・frame等のAX読取は追加しない。

expectation生成前後、wait呼出し前、poll開始・終了と戻りBoolをメモリに記録する。NSLockで全mutable stateとsnapshot copyを保護し、最新の開始8pollだけを保持する。古いinflight entryが押し出されても総開始・終了数から未返却数を数える。waiterが戻った直後のlock区間で、wait境界・completed比較・`inflightAtReturn`とpayloadをまとめて写す。内部のwaiter returnと完全に同時ではなく、lock取得までにcallbackが返る可能性は残る。

poll中のconsole I/Oは0である。wait-returnで1行、失敗時だけ既存geometry capture直前・直後にもJSONを出す。JSON本文は各8192B以内（prefix／改行を除く）、成功時1行・失敗時最大3行となる。geometry区間には開始側JSON生成・出力と既存capture側の出力費用も含まれ、純粋なAX／RPC時間ではない。単調時刻・Boolの観測を新しい合格条件にはしない。

最新8件は完了順ではなく開始順である。最後の出力後に返ったpollの終了は回収されない場合がある。waiterが戻らずprocessが終了すればメモリのtraceを失い、既存geometryが中断すれば終了境界が欠け得る。traceはAX呼出しを中断せず、追加のlock・時刻取得・出力にも費用がある。

## Clockとの関係と検証

固定Sourceの`PublishedPerformanceUITests`は`XCTestCase`を直接継承し、shared helper／`requireHittable`を呼ばず、Clock区間も自分のprivate helperを使うとread-only explorerが確認した。今回App・PBX・workflow・Clock Source4は変更せず、版上げもしない。静的なcall pathの分離と追加AX0は、性能値や実行時間が不変という証明ではない。

| 確認 | 結果と範囲 |
| --- | --- |
| Source1 | Swift grammar成功。import解決・XCTest／iOS SDK型検査ではない |
| trace helper | exact helperのMac Foundation synthetic5件を1回実行して成功。Bool・pre-wait poll、late callback、120開始からlast8保持、12並行callback、空／非finite metadataのJSONを確認。Appのテスト本体は実行していない |
| 保持の照合 | helper・override・trace処理を逆除去すると固定元ファイル全bytesへ戻る。visibility／geometry／failure capture本体と元テストを保持 |
| 独立レビュー | Source1と証拠のレビューはP1・P2が0件。reviewerによるruntime再実行は0回 |

新headのiOS／XCTest型検査、iOS26の通常2ケース、実trace出力、Hosted、実機・VoiceOver、新性能観測は未実施である。synthetic5と過去のretry成功を、新しいtraceのUI成功へ広げない。初回のtoolchain stdlib load失敗とprobe定数のprivate修正は小票へ保持し、候補Sourceの変更やApp実行失敗とは区別した。

## 後続PRと残件

復元の実採用mainでSourceの元tupleを照合し、1つの別PRを2コミットで進める。先に診断Source1、次に診断記録2・復元採用追記2・索引とrunbook3の計7pathを反映する。全体で8pathであり、parent・commit・PR・mergeは実際の結果から得る。通常の必要検査と実traceを確認しても、原因解決は別の証拠で判断する。

TODOは32行・完了13行の全行を保持し、IOS-23・25は未完了のままとする。ユーザー指定により新しい実機受入は未完了と記録してスキップできる。診断追加だけで実機品質・回帰網羅や原因修正の完了にはしない。
