# 復旧確認タイトルの失敗時診断

2026-11-02の候補。main da820のNative再試行で、復旧確認タイトルが5秒以内に見つからなかった。元の待機・1タップ・全assertを保持し、失敗時だけ専用の画面情報を残す。原因を修復したという記録ではない。

## 元の失敗と追加調査

[Native run](https://github.com/pero3dev/ai-agent-library/actions/runs/41339326495)の初回は、起動先の解決に失敗してexit70となり、XCTestは未開始だった。1回だけの再試行では単体278件が276成功・2skip・失敗0、UI8件が7成功・1失敗だった。`testRestoreFilePickerCancelKeepsHealthyBookmarksAfterRelaunch`は確認タイトルの5秒待機で失敗し、復元pickerとRelease監査には到達していない。初回と再試行を別々に保持し、このmainを全gate受入済みにしない。

公式SHAと一致した元artifactから、失敗caseの既知PNGは0件と確認した。自動添付の画面階層は、待機後のアプリのMain Window階層と画面内の復旧ボタンを示すが、Sheetと確認タイトルを含まない。タップのcallback、5秒中の状態、原因は証明しない。compactの`known_failure_image_not_unique`は0件でも発生し、複数画像があったとは扱わない。大きなZIP・画面階層・traceはローカル証跡に保持し、追跡ファイルへ複製しない。

## 変更範囲

- 5秒waitの結果を一度保存し、false時だけ既存captureを呼ぶ。同じBooleanを元のassertへ渡し、再タップ・待機延長・条件の弱体化は加えない。
- 成功経路の追加AX読取は0。失敗後は1画面、6 scalar、app state1回、階層snapshot1回を各test最大1回だけ採取する。contextは2KiB、階層は128KiB以内の全文か未収録表示とする。
- collectorへ固定名の確認失敗roleだけを追加する。対象は既存ReadingRecovery5caseで、既存UI8・元の全上限・未知添付の除外・一意画像・opaque参照の検査を維持する。

観測は待機後の逐次読取であり、同時点のsnapshotや期限内成立を示さない。出力容量の上限は、XCTestのAX・画像取得の時間や中間allocationを制限する保証ではない。App本体・0.2.28（30）・PBX・保存形式・TODO32行14完了は保つ。

## 検証と残件

RootのNode24で旧43件と新8件の計51件が成功し、skip・失敗は0だった。JS構文2入力とSwift frontend構文1入力も成功した。collectorのmetadata/process doublesと所有する一時fileを使った検査であり、実xcresult・SDK型検査・新UI診断分岐の実行ではない。Code3の独立レビューはP1/P2=0である。

この記録の作成時点では、Source7の文書・実親結合レビュー、形式検査、最終sourceのHosted XCTest・UIと必要CI、Ready後のfresh policy、通常main統合と新mainの別検証は未実施である。新しい診断が実失敗で収録されるかも未確認。実機・provider・VoiceOver、原因解消とIOS-22/25全体は未完了のまま残す。

## 作業単位と統合条件

目的は失敗の観測不足を埋めることである。所有はUI test・collector・unitの3ファイル、記録2ファイルと索引2ファイル。ユーザーの自律実装・機能単位のcommit/通常PR/main統合依頼を根拠とし、実機確認は未完了でスキップする。

この7ファイルを1つの診断commitとDraft PRへ分け、最終差分のレビュー・全必要CI・fresh policyを満たしてから通常保護で統合する。失敗した旧mainを成功に書き換えず、検証済みの新しい診断・修正PRを復旧経路とする。PR320はDraftのまま保持し、mainが進んだら実親へ再結合する。Simulator新規所有の準備や文字サイズprobeは別理由の後続単位とし、この変更へ混ぜない。
