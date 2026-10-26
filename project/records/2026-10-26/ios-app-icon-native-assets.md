# iPhone AppIconとビルド後監査の準備

23pathの私有候補を明示指定した実source commit `30a8a1db8d6c30eeb2c6e682f92ba94126cc5e35` / tree `7e4a5fcd93b00caf67ea171c426d735555b507c7`へ構成する。source_basisは今回の入力、snapshotは準備時点、historyは凍結済みPR275 head5f590/treeaf655上の旧previewを区別する。Git/APIの書込・新commit・公開操作はなく、最終payloadの別人レビューとlive-main確認は未実施。preview_only=true / publishable=falseを維持する。

8PNG/22,198B・9slotは既存favicon/MIT由来の承認bytesを保持する。helper/validator/単体sourceとbinary recipeも凍結候補と同一。packageと3CIは承認icon呼出だけ、PBXはasset6項目＋0.2.16(18)→0.2.17(19)の4値だけで、docsはunique anchorへ挿入する。PR275のPublished setup、runtime workflowと既存記録を含む全非対象mode/type/blobは今回の入力から保持する。

元図柄は[repository favicon](../../../website/public/favicon.svg)、権利表記は[MIT LICENSE](../../../LICENSE)。元の色・本の図柄を保ち、新デザイン・新依存・再生成はない。source metadata/check・合成Node13の成功は旧freezeの履歴で、このhelperの実行結果ではない。

過去のactool1回はexit1・partial120px CgBI/InfoだけでAssets.carなし。完全compile、実built Info/PNG/CAR、Debug3x/Release2x+3xの初期条件、Home/Store・配布・実機受入は未観測。新SDK/actool/Simulator/UI/計測は行わず、旧CI失敗を成功へ読み替えない。IOS-11/IOS-29全体とTODO状態は変えない。

履歴previewの内容レビューSHAは `e2cf172008dde8e86ee9d2e9fbc3b626e7b1d2e61b77c5bdbc4e69a75ed81d1a`、元manifestSHAは `4849a9755628718ae9360c70bd513605b92ca1c8328d7598573d6ccf61ea2186`。これらは旧private contentの範囲だけで、今回のsource親・payloadの自己承認に使わない。JSONのhistoryへ旧観測とsource snapshotを保存する。actual main到着後の構成・公開記録検査・差分確認・別人レビュー・exact-head CI/Hosted観測を残す。
