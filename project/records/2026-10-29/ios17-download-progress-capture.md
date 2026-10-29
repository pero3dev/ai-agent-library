# iOS17取得進捗の収集を分離する候補

2026-10-29。自分用iOSアプリの継続した自律実装依頼に基づく、専用CIの修正準備である。実機確認は未完了のまま進めてよいという許可を引き継ぐ。所有範囲はdriver・Node検査と本記録2本・索引・計画の6ファイルで、新しい契約・課金・配布・ローカルOS導入は含めない。実行履歴は[専用CIの記録](ios17-functional-ci-pilot.md)、全体の未完了は[完成計画](../../plans/engineering/ios-app-completion.md)で追跡する。

## 初回実行の停止と別の残件

作者base `cd5be5ba4225a5f24509e172bf20e7f2ac20efc7`の[初回run 40872101000](https://github.com/pero3dev/ai-agent-library/actions/runs/40872101000/attempts/1)／job `123441489687`は、quiet付きdownload中に`output-cap`で停止した。107.010秒でSIGKILL、観測4,194,523 byte・保持stdout 4,194,251 byte・stderr 0、resource failure false・cancelなしだった。末尾4KiBには同じ77.6%のCR進捗が繰り返され、quantityには5.86／5.87GBがある。全4MiBの内容やdownloaderの終端結果を独立に保持した証拠ではない。quietがこの通常進捗を十分に抑えなかったことを確認した。

import・所有device作成・機能ケースには到達せず、functionalはnull、受入false、cleanupはnot-created、全体132.045秒である。以前のhead11eaで報告されたpretestの`Ambiguous exact17.0 runtime`とは別の停止であり、その原因や取得後の条件付きimportの効果を解決したとは扱わない。初回失敗票を残し、同一条件の再試行だけで成功を得る方針にはしない。

## 出力の扱い

| 対象 | raw受信上限 | stdoutとstderrの合計保持上限 |
| --- | --- | --- |
| runtime-download | 新しく提案する64MiB | 従来と同じ4MiB |
| その他の全command | 従来と同じ4MiB | 従来と同じ4MiB |

全raw上限を維持する変更ではない。downloadだけに独立した進捗channelのraw64MiBを設ける提案で、実測した必要量や十分性の保証ではない。download 10分・work 19分・cleanup最大2分、空き容量・所有領域・signal・resource・OS／device所有・機能判定の条件は維持する。

間引くのはdownloadのstdoutにある、最大256 byteの完全なASCII CR／LF／CRLFレコードだけである。`Downloading iOS 17.0 Simulator (英数字build):`の固定prefix、桁数を制限した百分率・容量、Installing（registering download／Mounting）・Doneの既知形を厳密に照合する。build・空白数も制限する。連続して全byteが同じ場合、初回と最初の繰返しを保持し、3本目以降だけを除く。変化した進捗と未知stdoutは保持し、未知stdoutまたはstderrは連続照合を解除する。未知の警告・認証・エラー、非ASCII・不正UTF8・binary、未終端レコードと全stderrは保持上限の範囲でbyteを変えない。長い行は256 byteを超える前に保持する経路へ移し、無制限な行bufferやregexを使わない。

保持用arenaはstdoutとstderrで4MiBを共有し、pending bufferは256 byteに固定する。保持超過は従来の`output-cap`、downloadのraw超過は別の`download-wire-cap`として停止する。全受信stdout／stderrのbyte数とstreaming SHA256は間引きより先に更新し、`observed_stream_bytes`はrawの意味を保つ。保持したbytesのhash、除去した既知レコード・bytes、上限による未保持bytesも分ける。間引きが1 byteでもあればexit 0でも`captured_output_complete=false`とし、raw全体を保存した証拠にしない。認証scannerは保持された未知stdoutとstderrを確認し、後続の厳密な取得・所有・機能guardを省かない。

## 確認した範囲

凍結Source2は旧25検査の全文をprefixとして保ち、新12検査を追加した。production helperを使うNode37件が約2.496秒で全成功、両ファイルの構文検査もexit 0である。4MiB超の同一進捗、変化や未知／stderrによる照合解除、binary／UTF8・1 byte chunk・CRLF分断・未終端長文、rawと保持のhash、4MiB／64MiBの境界、他commandの無間引き、cancel状態を確認した。helperと既存5箇所の収集接続だけを逆変換すると元driverの全byteへ戻る。厳密OS選択・runtime重複拒否・条件付きimport・限定postboot回復・XCTest／cleanupの条件は変えない。

基準cd5の実行面を読む静的確認では、既存postbootのreceipt利用は正確なcommandとsilent 0 byteを要求するままである。driverはdownloadの`captured_output_complete=true`を成功条件にせず、stop／spawn error／signalなし・exit 0を要求して後続guardへ進む。workflowは小さいevidenceだけを90日保持し、1ファイル512KiB・合計2MiBのguardを保つ。調べた実行面に、全commandでraw 4MiB以下やcomplete trueを要求する別consumerはなかった。一般の保持validatorは90日・棚卸し・通常ファイルの実サイズを扱い、commandのraw counterを解釈しない。これは外部collectorや新しいHostedの実行確認ではない。

Source2の独立レビュー、共通検査と最終6ファイルのレビュー、新headでの実取得・機能47件・必要CIは後続である。64MiBの十分性、実runtime成功、最低OS全体・実機・VoiceOver・性能の受入には広げない。検証recipeの区間復元・anchorの誤りは私有票へ保持し、Sourceを変えずに補助recipeだけを訂正した。成功したNodeをその訂正のために繰り返していない。hashと区分は[機械可読記録](ios17-download-progress-capture.json)を参照する。

## コミットと通常統合の区切り

この候補は作者base cd5／tree `c5e09425a2c6c28c4dea348ef35b7e7c9ff9d314`の2,810パスへ、既存4ファイルの変更と新記録2本を重ねる私有準備である。cd5をmain採用済みとは扱わない。別作業のPR #300を含め、Rootが最後に取得した採用済みmainへ内容を結合し直し、対象blob・索引・TODO・全treeとレビューを確認する。

区切りは、Source2と記録の準備、共通検査と独立レビュー、検証済み1作業単位のcommit／Draft PR、新headの実Hostedと必要CI、Ready後の必須検査と通常保護でのmain統合、反映後のCI確認とする。形式のPR案とcommit案は別に用意し、実際の新headと検証結果に合わせてRootが提出前に更新する。

[PR #299](https://github.com/pero3dev/ai-agent-library/pull/299)では、通常の再開操作後もhidden pull refの11eaとbranchのcd5が一致しない状態をRootが観測した。候補Sourceの完成・検証と最新mainの照合後に限り、Draftを1回置き換える計画とする。この候補ではまだ実行していない。旧PRの履歴を保持し、新PRでも正確なheadによる通常CIを要求する。検査の迂回・管理者例外・保護設定変更は使わない。

App0.2.23（25）、TODO32行・完了13行の全行を保持する。実機上書き・保存維持・VoiceOverなどは未完了として進め、別作業の本文UI受入やmain統合を本記録で先取りしない。
