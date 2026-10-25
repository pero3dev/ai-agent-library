# アプリターゲットの旧WebKit経路の照合

## 作業契約

- 目的: IOS-24の完了条件に沿い、現行app targetが旧WebView・HTML/JS bridge・blockerへ依存していないか照合する。
- 許可根拠: 完成版TODOを自律的に進め、実装済み条件と残件を検証・記録する依頼。新しい実機操作・配布・保護変更は行わない。
- 基準: [UI CI PR #246](https://github.com/pero3dev/ai-agent-library/pull/246)、head `d4d982ce8850cd3ae71710c6eb205815edc7af73`。今回の範囲は読み取り照合と計画・記録の更新であり、実装削除は不要だった。
- 所有: 読取担当はXcodeのSources・resources・runtime参照を確認し、親が結果・TODO・commit・PRを担当する。他者の差分は戻さない。
- 終了条件: target・本文の入口・許可資産に旧runtime経路がない根拠を残し、比較用生成ツールの保持と全UI受入を区別する。
- 適用: [共通契約](../../../AGENTS.md)、[完成版TODO](../../plans/engineering/ios-app-completion.md)、[形式契約](../../../ios/renderer/native-schema.md)。

## 結果

IOS-24の条件は現targetで既に満たされていた。Xcodeのapp SourcesはnativeのSwift13ファイルで、ReaderWebView・HTML/JS bridge・blocker・WebKit framework・本文用Swift Packageの登録はない。resourcesは通常のContentとPrivacyInfo、Debugで追加コピーするのはTestContentだけである。

本文の入口はArticleReaderViewからNativeReaderViewへ進み、数式リンクもUITextViewのネイティブ添付画像で表示する。HTML読込・JavaScript実行・WebView生成のruntime参照はない。ContentValidatorはschema 2とJSON・PNG・TXTだけを許可し、html_pathを拒否する。PR #244から#246でapp SourcesとXcode構成に差分がないことも照合した。先行する[50件のHosted実行とRelease監査](https://github.com/pero3dev/ai-agent-library/actions/runs/40135742109)を履歴として保持し、新たな実機受入とは扱わない。

比較用には旧HTML CLI、reader.js・reader.css、reader-check.mjsと旧生成試験を残す。これらは現app targetと通常のios:prepareから呼ばれない。ios-content.mjsのparser・リンク処理・SHA・KaTeX準備はnative生成でも使うため、一括削除しない。Modelsのhtml_pathも旧形式を検出・拒否する互換用metadataとして残す。

IOS-24を完了とし、IOS-25のUI全体回帰・新たな実機受入は別に追跡する。初期監査時点はmain統合待ちだったが、現在はPR #241〜#246が通常統合され、main `81b5da90…`に対象のruntime条件がある。この監査記録自身のPR #247は別に扱う。[JSON](ios-native-runtime-audit.json)は静的な照合と実行済み履歴を区別する。
