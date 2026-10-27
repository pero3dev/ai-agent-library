# iOS26.5で代表UI2件を独立検査する準備

## 目的と範囲

IOS-23・25・26の品質確認として、既存Native UI2件を18.5より新しい同梱runtimeで実行する[独立CI](../../../.github/workflows/ios-runtime26-smoke.yml)を用意する。ユーザーのTODO自律実装と実機確認を未完了で記録する許可を継承し、標準public CIの準備までを扱う。基準はPR #268のcommit `2e27cf58ad46e7d32e3581a9895056333cc52f6b`。所有はworkflow、本記録MD/JSON、project索引の1段落である。

exactな公開repo gate、標準macos-26 arm64、Xcode26.6/17F113、contents-read、固定Actions、署名不要を使う。simctl生JSONから利用可能なiOS26.5とiPhone17の実identifierを一意に選び、自分で作成したUUIDだけをboot・cleanupする。SDKからruntimeを推定せず、runtime download/fallbackやApple作業・有料利用は行わない。通常3記事・fixture4記事を生成・原文/consumer監査するが、専用fixture画面のUI受入を示さない。

## 根拠と検証

2026-10-26に[公式image manifest](https://github.com/actions/runner-images/blob/macos-26-arm64/20261021.0445/images/macos/macos-26-arm64-Readme.md#installed-simulators)のInstalled SimulatorsとXcode欄を確認した。[標準public runner](https://docs.github.com/en/actions/reference/runners/github-hosted-runners#standard-github-hosted-runners-for-public-repositories)と[キャンセル仕様](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-cancellation)も根拠とする。既存Archiveのtoolchain成功をruntime起動成功へ読み替えない。

workflow SHA-256は`e8c794ad3dd78ee7c885e886407d3218bc2823487843de3ba5bc05af8a41620d`。Actionlint1.7.12、YAML、Bash14・Node6構文と構造検査が成功し、run block実行は0回。詳細は同名JSONが示す私有証跡path/SHAを参照する。共通検査全体と最終Hostedは未実行で、PR番号・self headも未確定とする。

## 未確認と影響

新workflowでの実runtime schema照合、UUID作成・boot、UI2件、cleanupはすべて実行0回。未知schema・skip・欠測を成功扱いにしない。26.5は18.5より新しい範囲であり、調査時の現行iOS27や最低対応iOS17のruntime実行ではない。実機・VoiceOver・全記事・性能の受入は残す。

UI直後にcleanupし、cancel時は後続のdevice不要監査を省く。通常capは合計38分/job40分、cleanup4分・各call45秒だが、cancel後5分の強制終了やrunner喪失ではcleanup・summary・artifact完遂を保証しない。未完了は未完了として残す。既存macos15通常・全記事・Clock・SDK Archive、required checks、App/PBX、既存selector/assertion/timeoutは変更しない。署名・Provisioning・Apple Account・Store提出条件は採択していない。

## 初回Hostedの失敗と可視先頭の補正候補（追記）

上記は初版の準備時点の記録である。ここからはその後の実結果と、PR #269の公開head `2457b070afcf4793fab1a58905e1fadb59eacd30`（tree `bfc6374a9b697ba2724faab5cb68e868bdad9999`）に対する補正候補を追記する。初版の0回・未確認という記述を当時の段階として保持し、今回の結果へ読み替えない。

### 初回Hostedで観測した結果

[run 40216989944](https://github.com/pero3dev/ai-agent-library/actions/runs/40216989944) / [job 121240156462](https://github.com/pero3dev/ai-agent-library/actions/runs/40216989944/job/121240156462)は、standard public macos-26・macOS26.6.2・arm64・Xcode26.6/17F113、実inventoryのiOS26.5/23F77・iPhone17で実行された。inventory、専用UUIDの作成・boot、通常3記事/fixture4記事の原文・consumer・実Debug同梱監査、専用Simulator削除は成功した。

実UIは正確に2件で、`testThreeArticlesHaveNativeBodyText`が成功、`testContentsBookmarkAndResumeAfterRelaunch`が失敗した。後者は最初の目次から「自己注意の数式」をtapした後、NativeReaderUITests.swiftの185行で見出しの完全可視・操作可能を待つ判定が失敗し、離脱・再起動復帰の手順へは進んでいない。結果をUI2件成功や再起動復帰成功とは扱わない。実行sourceのhelper SHA-256は`1296e450ac8575244527cd58bcc8b21f4819956a7dada225f5522e954c6b46d8`で、新しい診断helperの結果ではない。

失敗時のkeepAlways添付を、xcresultのAttachments→Activities→TestCaseRuns→TestCasesとpayload IDの明示対応から回収した。本文rootはx0/y0/width402/height874、唯一の本文navigation barはy62/height54で下端y116、唯一の対象StaticText `native-heading-自己注意の数式` はy35/height24で下端y59だった。「目次」navigation barは残っておらず、画像でも見出しが上部chromeの背後にある。対象の欠落selectorだけによる失敗ではなく、失敗時に読める位置への配置ができていない症状を確認した。一方、AX添付は各controlのisEnabled/isHittableを保存しないため、最後のpollがhidden/unknownのどちらだったかは断定しない。iOS18.5の一覧行163の失敗や、最低iOS17のdestination不在とは別の証拠として扱う。

元証拠は[artifact 12609482132](https://github.com/pero3dev/ai-agent-library/actions/runs/40216989944/artifacts/12609482132)。ZIPは82,504,210 bytes、SHA-256 `20ef4ae5f4dcaeef22ce02fd9d9753aa42177e3c3eb74c7e94b3a9973d5c7130`、期限2027-01-23T17:32:48Zである。remote digest、全ZIP CRC、安全な相対pathとsymlink不在を検証した。画像SHA-256は`5c5e6693a11d39efe869247c531702603c3e0095eb7367d0853ac6176344bf39`、完全なAX UTF-8添付は`b90c68796cf90316321fa0baddbd26c35634b5776bffc54a010b621ee1dd6da8`。

### 根因の仮説と変更範囲

現行のNativeReaderScrollBoundsは、adjustedContentInset.topを見出しの整列先、UIKit offsetの下限、保存対象blockを選ぶ可視先頭へ共用する。候補は可視先頭を`max(adjusted.top, safeArea.top)`として重なるinsetを加算せず、UIKit offsetのclampは従来のadjusted top/bottomで保つ。保存形式を変えず、block選択にも同じ可視先頭を使う。

safeAreaとadjusted insetが26.5で乖離した可能性は仮説であり、実値は未観測である。[safeAreaInsets](https://developer.apple.com/documentation/uikit/uiview/safeareainsets)と[adjustedContentInset](https://developer.apple.com/documentation/uikit/uiscrollview/adjustedcontentinset)の仕様を根拠に分離するが、今回の根因や修正成功は証明していない。両方がchromeの下端を表さなければ、root座標・遅延layout・placement outcomeを追加照合する。

Debugかつ既存の隔離UI suiteだけで、requestごと最大32件の数値geometryログを追加する。content/adjusted/safe-area inset、root frame/bounds、marker content/windowY、旧目標/候補目標/実offsetを記録し、記事・query・見出しID・読書記録は出さない。Releaseの診断出力、新route、Nav注入、通信は追加しない。0.5pt判定、有限再配置、pan/scene/generation取消、弱参照marker、search/保存契約、既存UI helper・selector・assertion・timeout・全workflowは保持する。

今回の提出追加はAppのReader、NativeInlineTests、PBX、既存の本記録MD/JSONの5paths。App版はDebug/Releaseの4version fieldだけを0.2.14(16)から0.2.15(17)へ更新する。runtime当初のworkflow・記録2件・project索引の4pathsにApp2件/PBXを加えるため、承認済みの先行PR #268合成baseline tree `3ccf8e9de5db016c1aa28c5ec2e650ef012e2053`との比較は固有7pathsになる。このtreeは比較専用でcommit親には使わない。原作成元`2e27cf58ad46e7d32e3581a9895056333cc52f6b`からのraw差分は同期由来27pathsを含む34pathsであり、固有7pathsと混同しない。ios/README・計画・project索引は今回変更せず、先行依存が残る現mainとの広い差分とこの固有7pathsを区別する。

### 限定SDK型検査と残件

独立内容レビュー後、Xcode16.2/Simulator SDK18.2・arm64-apple-ios17.0-simulator・Swift5・targeted concurrency・DEBUG・enable-testingで、公開headのApp全16 Swiftに凍結Reader候補だけを差し替えてmoduleを生成し、このmoduleへ`@testable import AILibrary`するNativeInlineTestsを型検査した。両方終了0、stdout/stderr各0 bytes。Reader SHA-256は`9043dc4f7b1bcc341820571557589fdca40a5f258712d8cbaa0172561e01f505`、Unitは`b6c5f2e731435d97bdfab6860f6774988705cd99a0bd1d24711aad4d08f83de3`である。旧24 test method本文を保持し、新規4件は重なるinset・legal clamp・UIKit marker/保存block・可視先頭の変化を検査するsourceとして型を確認した。

これは実XCTest28件の実行、全target build、iOS26.5の実insetや到着成功を示さない。新しいexact headでのHosted exact2 UI、全記事を含む機能UI14件、単体・SDK/Release監査は待ちである。共有lockと所有process group、180秒・空き容量・私有cache上限を監視し、実測最低空きは4,910,505,984 bytes。検査後は生成moduleとlogを保存して所有cacheだけを解放した。証跡は`<repo>/.local/ios-autonomous-evidence/viewport26-fix-prepared/evidence/limited-sdk-proof.json`に保存し、原proof SHA-256は`54b1280a18054d0d43517dbf79b522aaff737de48d9efbf53ba1b2543e7cf8d8`である。新しい実機QAはユーザー指定により実施せず、実機・VoiceOver・現行iOS27・最低iOS17・性能の未確認を保持する。

## 補正後の実結果と次の検証（2026-10-26）

公開head `3dbdfe4512de9948074fcb74151f2422818bf214`では、[iOS26.5 run40225552342](https://github.com/pero3dev/ai-agent-library/actions/runs/40225552342)／job121266028072の既存Native2件が成功した。実toolchainはXcode26.6/SDK26.5、iPhone17/iOS26.5で、通常3記事・fixture4記事の実Debug監査と所有Simulator削除も成功した。artifact12611902287のrawを独立監査した。safe-area/adjusted insetの数値ログは回収できておらず、inset乖離という仮説の確認や、繰り返した安定性・実機の受入へ拡張しない。

同headの通常Native回帰は単体133件中131成功・2skip、Native UI2件とReleaseが成功し、SDK26 Archiveも成功した。一方、全記事run40225552378／job121266028236は単体131成功・2skip、機能UI13/14で検索Aのfirst-visible判定が失敗し、Releaseはskipだった。サイトbuildのjob121266027994も、2回目のroadmap遷移後、非表示を確かめるlocatorが2個のcanvasに一致して失敗した。これらをNative2件の成功で上書きしない。

後続のpicker head `238e5e99`では検索Aとpickerが成功した後、Bの最初の検索到着で失敗した。別のiOS26.5 run40226683838／job121269430717は、通常3記事・fixture4記事を出力した後、生成・監査工程の2分上限で停止し、実UIは0件だった。新候補はこの工程だけ4分にし、cap合計のコメントを40分へ訂正する。job40分・UI8分・全コマンドは保持する。outer上限はoverheadも含み、到達時にcleanup/exportの完了を保証しない。

サイトの検査には、同じcanvasが1個になることを既定5秒で待ってから従来の非表示判定を行う1行を加える。0個や継続的な重複を合格へ変えず、20本のedge・関係一覧・keyboardの既存検査も保持する。失敗時の`S:0`内canvasは確認したが、streaming/hydrationのどの時点に起因するかは未確定である。新しいPlaywright実行は未実施。

検索判定はPR #268の後続修正を継承する予定で、1pollのviewport・コピーしたframeを使い、完全表示・先頭ID一致・15秒を維持する。機能14件＋純粋geometry6件、新headの単体・Native2件・iOS26.5の2件・SDK26/Release・サイトbuildは改めて実行する。過去の成功を新headへ流用しない。準備時は当時未統合だったPR #268のtree `80abdee0d3a2e9148849a114bb8ffe2c8f354682`と比較した。このtreeが通常統合後のmain `656c234582bbe76b852b394eae4d6f6837f0ce04`のtreeと同一であることを照合し、旧head3dbと実main commitを親にして同期する。treeをcommit親には使わない。今回の差分は従来の固有7pathsにサイト検査1pathを加えた8pathsである。

限定SDK証跡に残るbuild表記`16C5032`は当時の記録を保持し、実環境の完全な表記は`16C5032a`として区別する。新たなローカルSDK・Simulator・実機操作は行っていない。VoiceOver・最大文字・実機・現行iOS27・全体の性能受入は未完了である。最低OSの別一時PR #271では旧baselineのiOS17.0.1で2件が成功したが、この補正版の受入へは流用しない。

## 367の上限到達とUIビルド範囲の候補

0.2.18（20）・head36786c6ac42f06a2c7bd3644e7196a7f8791cbf1、tree3fc2aa19174008d24eee5d943560b33ada75b08e の[run40383509809](https://github.com/pero3dev/ai-agent-library/actions/runs/40383509809)はUI step12分の上限に達した。Contentsは212.238sで成功したが、ThreeArticlesは3件目Transformer行をtapし本文存在を待ち始めた直後に中断した。2件の最終aggregateはなく、primaryは未完了を拒否、cleanupとDebug app監査は成功した。UI2件成功や2件のassertion失敗とは数えず、追加の同head再実行は行わない。

UI step開始19:11:09 UTC、選択suite開始19:18:08.934、終了19:23:22で、UI前に約7分を使った。実build graphはApp/UI/unitの3targetで、実行しないunit6ファイルも両archでcompile/linkされ、unit実行行は0。App/UIもx86_64とarm64をcompile/linkした。hostはarm64、実効ONLY_ACTIVE_ARCH=NO、CLI指定はなく、owned UUIDの候補はarm64→x86_64順だった。unitのDriver→Touch窓25.638sは並行処理を含み、exclusive costでも短縮保証でもなく、約7分全体をunitへ帰属させない。

新候補は元のshared schemeからunit TestableReferenceだけを除いたAILibraryUISmokeを追加し、Runtime26の参照2か所を切り替え、具体的なowned UUIDへのDebug test commandだけにONLY_ACTIVE_ARCH=YESを指定する。App/UIの選択とDebug・launch属性は保ち、元scheme・project・app/test source・通常Native/Full・Archive/Releaseを変えない。Appは0.2.18（20）のまま。実行する2caseとprimary親階層・device・stages、job40分/UI12分/create6分/boot240秒・権限を保持する。

[Appleのbuild setting](https://developer.apple.com/documentation/xcode/build-settings-reference)はactive architectureだけをbuildする設定で、generic destinationやscheme overrideでは例外がある。[TN3117](https://developer.apple.com/documentation/technotes/tn3117-resolving-build-errors-for-apple-silicon)はDebug YES/Release NOを既定として挙げる。今回の具体的なUUIDとoverrideなしを前提に、smokeだけの未実行compile範囲を狭める。実architectureのcompile coverageは当該smokeだけ変わり、他Native/FullとArchiveは保持する。新Hostedのgraph2target・actual app/UI architecture・同じUI2件と厳密監査、上限内完了は未確認で、時間短縮やアプリの読込問題の解決は主張しない。

技術2pathのmanifest SHA-256は9e33a1af3b40f5901f929c23a4c4a303d73c7b0242dcaa8b86b13a9cd86b3978、独立静的review SHA-256は000eba873171c99c2c7614fc45c6e6bf28f0c02afdb6db913b42d505287b1730。XMLが元schemeからunit参照1件だけを除くこと、parsed YAMLがscheme2文字列とCLI flag1件だけ異なることを検査した。最終8pathの結合reviewと実newhead、実SDK/UIは未確認でnullに保持する。元の実行のFullが終わる前に公開して取り消す操作は行わない。

公開前に元head367のFull終了を待ち、run40383510495のunit151成功/2skip・機能16＋geometry6全22UI・Release199記事625 hashの成功を確認した。通常Native・SDK26 Archive・SDK27代表UI/Archive・共通CIも成功しているが、当該runtime26の2件aggregateは未完了のまま保持する。新候補の実結果へ旧成功を付け替えない。

## CDCの実ビルド範囲と残る目次待機

[run40392047011](https://github.com/pero3dev/ai-agent-library/actions/runs/40392047011)/job121815237836、headCDC、tree4bed、0.2.18（20）は実App/UIの2target・unit build0、ONLY_ACTIVE_ARCH=YES・App/UI arm64のみを実証した。UI stepは539秒で終了しており、前の12分上限による中断ではない。pre-suite304.569s、xcode invocationから最後のUI Touchまで195.688s、そこからsuiteまで64.830sを記録した。異なるrunの単発観測であり、普遍的な短縮値やアプリ性能指標へ一般化しない。

Contentsは72.979sで失敗、ThreeArticlesは110.350sで成功。失敗は初回目次の自己注意の数式をtapした後のrequireHittable待機（行326）で、relaunch/resumeへは未到達。失敗後の逐次snapshotではtarget(18,122,131,24)、viewport上端116、fullyVisible/hittable/satisfied=trueだったが、先行pollの状態や原因を証明しない。primaryは1件の失敗を正しく拒否し、cleanupとDebug app監査は成功した。artifact12685878667は89,464,816 bytesでローカルの16MiB読取上限を越えるため取得せず、画像・階層を見たとは扱わない。同headを再試行しない。

独立receipt SHA-256は17d5a5afa6f684b07d66ea7f2cb2c2fed37d08b669968a77498cd32be5cc8505、timing/architecture receiptは457f84f4616619bf4febf01aea12953acb97f6513d040b958d7a32195fe0f673。通常Native・Full・SDK26/27・共通CIの成功を、このruntimeのUI2件成功へ付け替えない。

次候補はiOS27向けの明示shapeを27以降だけへ限定し、17〜26へ及ぼす範囲を減らす。これは既知の観測範囲に合わせた互換性対策の絞り込みで、26の失敗原因の確定や修復を意味しない。UISmoke・active architecture指定・40/12/6分とboot240秒・selector/strict primary・全CI設定を保持する。版0.2.19（21）の実コンパイル・UI・VoiceOverは未確認である。
