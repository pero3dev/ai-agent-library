# Hosted SimulatorでのネイティブUI回帰

## 作業契約

- 目的: IOS-25・26のうち、既存のネイティブUI試験2件をHosted Simulatorで厳格に実行する。
- 許可根拠: 自律実施・検証基盤・作業単位別PRの依頼。新たな実機操作は行わない。
- 開始基準: [復帰PR #244](https://github.com/pero3dev/ai-agent-library/pull/244)、head `2ad2cff29c86a25185e197ff5171be11efcc67d9`。IOS-19と並行して実装し、契約のPRを保存後に別branch・PRへ分離する。
- 所有: UI担当は追加CIのworkflowだけを所有し、親が手順・TODO・記録・PR・hostedの結果取得を担当する。既存UI試験や他者のSwift・生成処理を戻さない。
- 方針: unit試験後に同じXcode・SimulatorでUITests targetを実行する。専用suiteで読書記録を分離し、ログとxcresultを保存する。失敗を許容する設定を使わない。
- 検証・終了条件: YAML・shell・既存規約、独立レビュー、実際のhosted結果を区別する。2件が確認するのは通常3記事の非空本文、Transformerの1見出しへの目次移動・しおり・終了再起動後の復帰まで。オフライン・コピー・内部リンク・旧保存移行のUI全体受入を成功扱いにしない。
- 適用: [共通契約](../../../AGENTS.md)、[完成版TODO](../../plans/engineering/ios-app-completion.md)、[CIの基準記録](ios-native-ci.md)。

## 状態

形式契約の[PR #245](https://github.com/pero3dev/ai-agent-library/pull/245)、head `f9c8cf39141f7a8bb49e4d5dac57c11f503e9d75`を直接の親とし、`codex/ios-native-ui-regression`へ分離する。unit後に同じSimulatorで`AILibraryUITests` targetを実行し、`ui.xcresult`と`xctest-ui.log`を既存evidenceへ保存する。既存unitとRelease検査、read-only権限・署名不要・固定Actionsは維持する。

Node 24でYAML解析、10 shell stepの構文、harness-tooling22件とdiff検査が成功した。実装とstatic確認を、UIの実行成功とは扱わない。UIの成功はhosted結果を取得してから[JSON](ios-native-ui-ci.json)へ記載する。

UI側はjaのlocaleをapp起動引数で指定し、各testの専用suiteを使う。文字サイズ・明暗・向きはSimulator既定であり、全端末・アクセシビリティ受入ではない。行のスクロール回数と記事タイトルに依存する既存試験なので、失敗時はログ・xcresultで実際の不足を確認する。

[PR #246](https://github.com/pero3dev/ai-agent-library/pull/246)、head `d4d982ce8850cd3ae71710c6eb205815edc7af73`の[Hosted実行](https://github.com/pero3dev/ai-agent-library/actions/runs/40137064755)が成功した。単体52件（Core29・Audio6・Inline17、失敗0）、UI2件（しおり・目次・再起動復帰、3記事の非空本文、失敗0・skip0）、正本からの通常・fixture生成と監査、Release build・全140ファイルの監査とTestContent不在を確認した。

新規checkoutからの生成・SDK・XCTest・UI検査を再現できたためIOS-26を完了とする。署名不要のSimulator回帰基盤であり、App Store提出環境・配布署名・実機・IOS-25全体の操作網羅を完了とするものではない。初回の結果保存時点はmain復旧判断待ちだった。その後、通常同期head `d50586ad…`の単体52件・UI2件・Releaseも成功し、PR #246はmain `81b5da90…`へ通常統合された。この記録の追記はPR #247として別に扱う。
