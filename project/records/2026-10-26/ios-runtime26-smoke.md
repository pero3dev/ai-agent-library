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
