# PR59 公開 WebKit 段階操作の限定診断

作成: 2026-09-24T15:48:38.726Z。リポジトリ・製品・Git は無変更。修正候補は TEMP 限定、独立レビュー待ち。公開先は読み取りだけで使用した。

## 判定

1280×720 light の sampling 初段で、READ による再配置と自動クリックの競合を再現した。押下はロジットに届いたが、224 ms 後の離上までに stage 0→1 へ変わり、ボタン上端が 340.6875→394.265625 px（53.578125 px 下）へ移動した。ポインターは (751,359)、scrollY=1755 のまま。離上と click にボタン記録はなく、手動モードには到達せず reading のままだった。

これは「正しい段階ボタンを選択した後に READ が manual を上書きした」証拠ではない。製品コードも manual の同期設定と READ 側の modeRef guard を持つ。具体的な非ボタンの離上 DOM は記録していないため、別の段階ボタンへ入力したとも主張しない。独立担当 portable_review はコードと当該イベント記録を読み、操作競合の説明を支持した。候補そのものの正式承認は未了。

## 比較結果と限界

| TEMP 実行 | 対象 | 結果 |
| --- | --- | --- |
| diagnostic-original-webkit-2026-09-24T15-40-56-606Z | 原 helper、元の3失敗ケース、イベント記録を追加 | 2成功 / 1失敗、1280 sampling S0で再現 |
| diagnostic-stabilized-webkit-2026-09-24T15-42-24-121Z | 同3ケース、既存の安定待機だけ追加 | 3成功 / 0失敗 |
| diagnostic-stabilized-webkit-2026-09-24T15-45-35-346Z | sampling/cache の native elapsed playback 2ケース | 2成功 / 0失敗 |

原runで既知の5失敗ケースすべてを限定再検証し、候補で5/5成功。元ケースの数値・READ独立性・実時間再生・一時停止・再開・完了・ネットワーク検証は保持した。3ケース版の安定待機と候補 helper の待機部分はコメント・空白・セミコロン区切りを除いたトークン列が一致し、追加2ケースは候補 helper 本体を実行した。

原公開runはこの担当が一切上書きしていない。観測時は 71 件、状態 failed。この診断は全71件再実行、画像承認、公開受入、実機Safari検証ではない。5件中1件で原因イベントを再現した。他4件は同じ初段 helper の症状と候補での成功を確認したが、原失敗時のイベントは未取得。発生率も推定しない。

最初の diagnostic-original-webkit-2026-09-24T15-40-20-387Z は制限環境で page.goto が接続失敗し、製品ロード前に終了した別原証拠。接続が許可された後の比較と混同しない。

## 最小修正候補

旧 helper は自動スクロールを含む button.click() に直行する。既存の website/tests/browser/inference.spec.mjs seekForFit は、index 0 前に明示スクロールし、stage・scrollY・ボタン矩形・viewport内の状態が3 rAF変わらないことを確認する。後者の24行だけを候補へ移した。aria-pressed / data-stage / manual / slider の元assertは完全維持。強制クリック、DOM click、再試行による成功化、固定sleepは追加しない。

- helper全文: pr59-stage-helper-candidate.mjs
- 元helper: pr59-stage-helper-original.mjs
- 元runnerに唯一の24行を加えた候補: pr59-verify-public-stage-candidate.mjs
- exact diff: pr59-stage-helper-candidate.diff
- 逆除去で元helperへ完全復帰する証明とテストコードhash: pr59-stage-candidate-proof.json
- 診断実行コード: pr59-stage-diagnostic.mjs / pr59-stage-playback-diagnostic.mjs

原runner SHA256: 87a8ada23f194d9cf4cdcfceda71aacc711626d02f0c0ff7f84e95193cf2d90c

候補runner SHA256: 123d3d7e3ed4243f15b5933bcf0b71aeb55f2c22e94a18ac31045ee380f1f999

候補helper SHA256: 6c6b1d1c501a31d3837ba0a538e9fa2a7cdbdee20c1826b9890fad89da2cbcb1

3ケース診断コード SHA256: dbd25f4914cf0437e23400aeadd2c694a163e308521038c31f320fecd94aad98

2ケース診断コード SHA256: 0a690d4af4fb985076106f1b625bc3912900b6ab538cc742d54b443dd2c459ec

各ファイルと完了raw result のSHA256、pointerイベント全文、元runの失敗名/error、公開HTML照合は同名JSONに固定した。診断用コードは本番kitではない。配置の移植は root の次branchでの明示割当まで待つ。

## 同一性と次の操作

公開BUILD EliX86DAnCpMQHOKIyCQx、merge 517dc8b5166bd7b0c85baef3800d7fe57bac7b31、CI run 36019573674 / artifact 10816009077。元の厳密7記事artifact前提・固定URL/repo・成功deploy状態を保持。限定ケースで実取得した inference のHTML SHA256は 19e9dbcedadaadf3e3d6ed22a66af49ce3af1423f719cc82f7e8925f0c7eba4e、すべてartifactと一致した。他6記事を今回ライブで再監査したとは主張しない。

独立レビューでは24行差分、pointer証拠、5ケース成功・同一性を確認する。採用を許可された後は helper 追加を明示した可逆来歴とmanifest更新、オフライン19 unit・prep・構文の再検証を行い、root 管理の公開全件検証・画像承認を別途満たす。旧失敗runは失敗原証拠として残す。index 0 以外を初回操作する経路まで解決したとは扱わず、追加対応は実証された必要範囲に限る。
