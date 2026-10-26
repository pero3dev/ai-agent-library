# iPhone AppIconとビルド後監査

現在はPR278の初回Hostedで監査が失敗したため、合格条件を維持した出力収集を準備する段階である。以降の最初の準備説明と未実施項目は、その時点のsnapshotとして保持する。

23pathの私有候補を明示指定した実source commit `30a8a1db8d6c30eeb2c6e682f92ba94126cc5e35` / tree `7e4a5fcd93b00caf67ea171c426d735555b507c7`へ構成する。source_basisは今回の入力、snapshotは準備時点、historyは凍結済みPR275 head5f590/treeaf655上の旧previewを区別する。Git/APIの書込・新commit・公開操作はなく、最終payloadの別人レビューとlive-main確認は未実施。preview_only=true / publishable=falseを維持する。

8PNG/22,198B・9slotは既存favicon/MIT由来の承認bytesを保持する。helper/validator/単体sourceとbinary recipeも凍結候補と同一。packageと3CIは承認icon呼出だけ、PBXはasset6項目＋0.2.16(18)→0.2.17(19)の4値だけで、docsはunique anchorへ挿入する。PR275のPublished setup、runtime workflowと既存記録を含む全非対象mode/type/blobは今回の入力から保持する。

元図柄は[repository favicon](../../../website/public/favicon.svg)、権利表記は[MIT LICENSE](../../../LICENSE)。元の色・本の図柄を保ち、新デザイン・新依存・再生成はない。source metadata/check・合成Node13の成功は旧freezeの履歴で、このhelperの実行結果ではない。

過去のactool1回はexit1・partial120px CgBI/InfoだけでAssets.carなし。完全compile、実built Info/PNG/CAR、Debug3x/Release2x+3xの初期条件、Home/Store・配布・実機受入は未観測。新SDK/actool/Simulator/UI/計測は行わず、旧CI失敗を成功へ読み替えない。IOS-11/IOS-29全体とTODO状態は変えない。

履歴previewの内容レビューSHAは `e2cf172008dde8e86ee9d2e9fbc3b626e7b1d2e61b77c5bdbc4e69a75ed81d1a`、元manifestSHAは `4849a9755628718ae9360c70bd513605b92ca1c8328d7598573d6ccf61ea2186`。これらは旧private contentの範囲だけで、今回のsource親・payloadの自己承認に使わない。JSONのhistoryへ旧観測とsource snapshotを保存する。actual main到着後の構成・公開記録検査・差分確認・別人レビュー・exact-head CI/Hosted観測を残す。

## 初回Hostedの失敗と診断用出力の追加

実head `1f07778791e3fc24464ed2512a9944639788bee5` は、Rootが実tree・親・messageを照合して通常PR278へ提出した。source23path/API literalの最終独立レビューはblocker0で、PNG8枚のCRC・RGB・画素復号・9slot、PBX/CI/非所有2709entriesを確認した。新しい合成callback11件はchild processを禁止して成功、real CLI adapter2件の単独実行は未実施として区別する。

SDK26 run40301396609/job121499884040は**Archive本体が成功**した後、追加したbuilt icon監査が `Missing required iPhone60@3x PNG` で失敗した。full run40301396664/job121499884429も、Debugの同じ監査で停止し、UIとReleaseへ未到達である。この失敗をアイコン受入の成功にはしない。actoolの完成logにはloose `AppIcon60x60@2x.png` と `Assets.car` が列挙されたが、3x renditionのCAR内有無は未観測である。

SDK artifact12640846633（ZIP97,178 bytes、SHA-256 `f7148b10da598773b9444502be3b28df01facde52e3e895f969a54a6312a6a78`）は容量保護のためメモリ内だけで検証し、45entries全CRCが正常だった。保持されたicon結果はerror1行で、actual App Info/CAR/PNGのbytesやCAR内部一覧は含まれていない。Info/AppIcon名やCAR regular存在の前段assertを通過した制御フローと、実値を取得した証拠は区別する。**loose PNGの3xが見つからないことは、CARに180pxがないことの証明ではない。**

この追変更は新collectorと3CIへの監査前の呼出だけを追加する。Infoの固定plist reader結果、top-level Icon PNGの一覧・寸法・SHA、Assets.carのSHA、公式assetutil help／infoのstdout・stderr・exitを上限付きで記録する。capture結果はdiagnostic-onlyで製品受入にはしない。収集の失敗で既存の主監査を迂回せず、元のrequired-scales・判定と同じ位置で必ず実行する。出力を観測してから、収録不足か監査の想定違いかを別の修正として判断する。

PNG8枚・PBX・App本文・読書位置・保存・版0.2.17（19）と既存のUI判定、CI予算・selectorは保持する。現在の6path差分はcollector1・CI3・記録2、mainからの累積path数は最終結合で導出する。診断の新head／実行は未作成で、SDK・Simulatorをlocalで実行せず、同じheadの再試行も行わない。実機とHome画面、IOS-29全体は引き続き未完了である。
