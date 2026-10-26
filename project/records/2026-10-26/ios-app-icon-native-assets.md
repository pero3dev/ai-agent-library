# iPhone AppIconとビルド後監査

現在は実CAR観測を基に、倍率要件を保った監査修正を準備する段階である。各節の未実施は記載時点のsnapshotとして保持し、最新状態は末尾「CARの実観測と監査修正」を参照する。

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

## CARの実観測と監査修正

診断head `2eedf063b1c6b34e51f68e98adab7e0b53eed051` のSDK26 run40307987707とFull run40307987669から、実Info・loose PNG・CARのSHAと公式reader一覧を取得した。Archive ZIP105,174 bytes（SHA-256 `25ec7d2194ada8813a5187d3709696c3ea83a491e08f6af8bb1ea3d286949c77`）の56entriesと、Debug ZIP365,316 bytes（SHA-256 `36243d5922184be9a9bc6cf14d8e8cc458844ec5c242c3530d8cbda724602a72`）の357entriesを、Rootと別担当が各メモリ内で全SHA/CRC照合した。diskへのZIP保存・展開は0。

両Infoのprimary名はAppIcon、legacy stemはAppIcon60x60、familyは1。loose PNGは2xの120pxだけだったが、CARには標準phone60ptへの参照と180px/scale3のIcon Imageがあった。generic Archiveには120px/scale2もあり、thin Debugはscale3だけだった。監査をloose3x PNGの常時出力という想定から、実CARの参照関係を確認する形へ修正する。

観測したSchema2/Storage17で、標準phone MultiSized Imageの60x60参照からindexとNameIdentifierを導出し、同じ名前・ID・idiom・subtype・indexで、要求倍率を持つIcon Imageへ対応付ける。数値IDを事前固定せず、60×倍率の寸法と不透明RGB8のmetadataを要求する。別subtypeの90pt/2xである180px、marketingやPackedImageは代用しない。reader一覧の表現に基づく明示的な参照joinであり、CAR画素の復号を主張しない。Info・legacy stem解決・loose PNGのCRC/寸法・regular CAR上限を保持し、CAR読取前後のbytes/SHA一致を確認する。CIのrequired-scales（Debug3、generic Release/Archive2,3）は保持する。

追加の非binding metadataは許容し、必須field/type・未知構造・重複・誤namespace・誤参照は拒否する。実reader CoreUI/DumpToolVersionはArchive975/975、Debug918/918.8。collectorのpartialは未サポートhelp optionのexit1だけで、Info/path/infoはexit0・非切詰・正常JSONだったため、不要なhelp呼出1行だけを除く。find/info・上限・非阻害制御は保つ。

独立担当はloose120の全CRCとIDAT画素を復号し、ArchiveのCgBI/BGRA変換後も元120画像と全画素一致、DebugはPNG bytes自体が元画像と一致したと確認した。CAR内180の画素、色管理後のHome表示、実機は未確認。回帰fixtureは実readerの選択fieldsを正規化した派生入力で、raw artifactのコピーや新しいSDK観測ではない。

今回のsource3・派生fixture3・記録2の8pathとmain累積27pathは最終結合で確認する。App本体・PNG・PBX・版0.2.17（19）・CI5call・UI条件/予算を保持。新headの実built監査・Native/full/runtime26/Archiveと通常CIが揃うまではDraftを維持し、IOS-29全体は未完了とする。

新source6の独立レビューは、凍結manifest SHA-256 `e9ba03f4f81a45f61eadccd498213d631d90acea8079423ffee59fe5867d8d0c` を照合しblocker0だった。review SHA-256は `7f76ca30c3ab9024bbb53fe4078b86a9bc43fc557fbc4998d53f47a6e507777a`。別担当がportable VM20件・collector VM27件を再実行し、実adapter2件と新head CIは未実施のまま区別した。
