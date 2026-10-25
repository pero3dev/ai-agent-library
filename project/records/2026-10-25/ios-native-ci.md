# ネイティブ本文のHosted Simulator CI

## 作業契約

- 目的: IOS-25・26のうち、ローカルで起動できていないSimulatorの代わりに、生成・監査・Foundation回帰・XCTest・Release同梱内容をGitHub Actionsで継続確認する。
- 許可根拠: 自律実施・PR・main反映の依頼に含まれる検証基盤の実装。既存11必須チェック・保護設定、署名、Apple Account、公開配布は変更しない。
- 所有: CI担当は新規workflowとRelease package検査のみ。親は配置契約が必要なら更新し、記録・手順・TODO・独立レビュー・GitHub反映を担当する。他者のSwift編集は戻さない。
- 方針: 公開repoの標準macOS runnerで、固定XcodeとSimulatorを使う。rootとios/toolsを監査後にlockfileから導入し、Chromiumで正本から通常・fixtureを生成する。XCTest実行とcompileを区別し、失敗を許容して成功へ変えない。UI試験2件は最初の対象へ含めず未実施を残す。
- 検証・終了条件: workflowの静的規約・専用検査の拒否条件・独立レビュー後にPRへ保存する。hosted実行の結果が得られるまでは実行成功を記載しない。証跡はログ・xcresultに限定し、DerivedData全体をアップロードしない。
- 適用: [共通契約](../../../AGENTS.md)、[ハーネス検証](../../../CONTRIBUTING.md)、[計画](../../plans/engineering/ios-app-completion.md)。

## 環境の根拠

2026-10-25にGitHub公式の[macOS 15 arm64イメージ一覧](https://github.com/actions/runner-images/blob/main/images/macos/macos-15-arm64-Readme.md)でXcode 16.4・iOS 18.5・iPhone 16を確認した。[macOS 14](https://github.com/actions/runner-images/blob/main/images/macos/macos-14-arm64-Readme.md)は近いサポート終了が案内されているため、新規workflowではmacOS 15を選ぶ。標準runnerの公開repoでの条件は[GitHub公式](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)、ブラウザーの要件は[Playwright公式](https://playwright.dev/docs/intro#system-requirements)を確認した。

## 状態

検索機能の[PR #242](https://github.com/pero3dev/ai-agent-library/pull/242)、head `d2596980a9ea3a8f1dcfeb54fd12567052b92d97`を基準に、`codex/ios-native-ci`へ独立して保存する。実装は新規workflow・Release package監査・その拒否条件のNode回帰の3ファイルと、この記録に限定する。

新規Node回帰8件、既存harness-tooling22件、YAML解析、9 shell stepの`bash -n`が成功した。新規8件は独立レビュー側でも再実行して成功し、修正必須事項はなかった。既存のRelease成果物に監査scriptを実行し、3記事・140ファイル・2,455,933 bytesのSHA、通常manifestとの一致、TestContent不在を確認した。これを新たなhostedビルド成功とは扱わない。

実機とUI試験は未実施のままとし、hostedのXCTest・Release実行結果はPRを作成してから取得する。既存11必須チェックとmain保護設定は変更しない。[JSON](ios-native-ci.json)へ検証面を分けて記録する。
