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
