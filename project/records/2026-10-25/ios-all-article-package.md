# 全published記事の棚卸し・一時生成とconsumer監査

## 作業契約

- 目的: IOS-13・15へ進むため、published学習記事199本の形式・参照・生成要求を棚卸しし、明示した一時出力で全記事の実生成とconsumer検証を行う。
- 許可根拠: 完成版TODOの優先度順の自律実施と通常commit・PRの依頼。今回の範囲はローカル生成検証であり、初版の対象・配布・権利・独立配信の採択や実機導入の完了とはしない。
- 開始基準: 検証済みnativeのPR #245〜247に相当する作業tree。通常3記事・fixture4記事の入口を維持し、`--all-published`は明示した一時出力だけに制限する。main統合と並行して準備し、公開済みの各PRの固有差分へ混ぜない。
- 所有: 生成担当はnative CLI・native生成処理・関連Node試験。読み上げ文は2担当が図の前後半を別の一時JSONへ作成し、相互レビューする。文書担当はios/README.mdとこの記録・同名JSONだけを更新する。親は完全mapの統合・schema・実生成・consumer監査・CI・GitHub保存を担当する。他者の差分やprimary index/refを変更しない。
- 方針: publishedだけを決定的順序で選び、代表図の既存説明を継承し、全74図の説明mapを必須にする。fixtureとの混在や通常出力の上書きを拒否する。音声は既存の選定1本を維持し、全音声の権利と接続はIOS-16へ分ける。
- 検証・終了条件: 選定・引数・出力先・説明の欠落/不整合をNode回帰で検査する。全記事を実生成し、manifestと全SHA・PNG・内部リンク・形式上限をconsumerでも確認する。推計だけで容量・性能・全体受入を成功としない。実機は未確認のまま残す。
- 適用: [共通契約](../../../AGENTS.md)、[完成版TODO](../../plans/engineering/ios-app-completion.md)、[形式契約](../../../ios/renderer/native-schema.md)。

## 生成前の結果

既存parserで199記事を各1回解析し、199/199成功、未対応token・metadata失敗0。全記事の見出しmapで記事間リンク3,525本（見出し付き10）を照合し、不整合0だった。図74 unique・数式137 uniqueの計211要求から、light/dark計422 PNGが必要になる。README等へのリンクは外部fallbackなので、これをすべてのリンクのオフライン化とは呼ばない。

生成前の計画見積りでは、固定幅SHA placeholderを使ったmanifestは3,120,071 bytes（上限8,388,608）、本文JSONのasset未付与時の合計は11,735,339 bytes、最大129,569 bytesだった。想定は199 JSON・422 PNG・3 license TXT・manifest 1の625ファイル。この見積りの時点ではPNGと最終総量・consumerの実受入は未確認であり、後述の実生成・監査で確認した。

生成CLIの明示オプションを実装し、通常・fixtureの出力と併用を拒否する境界を追加した。対象Node37件と別担当の独立再実行が成功し、既定3/4の記事・模擬revisionを維持した。74図の読み上げ文はA/Bの相互レビューで各1件の意味訂正を行い、既存3件を完全に保った74件mapへ統合した。実際のVoiceOver受入は未実施である。

## 実生成とconsumer監査

明示した一時Contentへ実生成し、199記事・音声1本・照合対象624ファイル、manifest込み625ファイルを得た。revisionは`d9d32b9d20f61413fdeab06c795fee15477efb337cb7a29023b8f13943dde7c3`。manifestは3,120,071 bytes、PNG422本を含む全体は37,547,753 bytesで、既存の上限を維持して受け入れられた。

appと同じModels・NativeDocument・ContentValidator・ReadingStoreをFoundationでcompileした汎用監査を実行し、SHA・PNG・全199本文の検証と読み込みに成功した。本文のtop-level blockは8,389個。このMacでの検証と全本文読み込みは約2.28秒で、アプリ初回起動・スクロール・実機性能の測定とは区別する。通常アプリのカタログ切替やiPhoneへの追加導入は行っていない。[JSON](ios-all-article-package.json)へ実測と未確認を分けて記録する。

再現手順は[iOS READMEの一時生成](../../../ios/README.md#全published記事の一時生成)に記載した。生成先は明示したシステム一時ディレクトリ内の`ailibrary-ios-*/Content`だけとし、通常3記事・fixture4記事の出力は維持する。監査には`bash ios/tests/check-package.sh <一時Content> 199`を使う。

## Hosted検証の初回と修正

PR #249の初回run `40159700162`では通常3記事・fixture4記事の生成・監査・CoreSmokeが成功した。全記事stepは`/private/tmp`へ出力しようとしたが、runnerの`TMPDIR`が別の場所を指すため、生成側の許可範囲検査で停止した。出力制限を維持し、当該stepだけ`TMPDIR=/private/tmp`と明示して出力先を揃えた。READMEの実行例にも同じ環境指定を加え、修正後のHosted実行を確認する。

## CIと残件

[iOS CI](../../../.github/workflows/ios-native.yml)へ全published記事の一時生成と同じconsumer監査を行うstepを追加した。対象記事数は追跡済み原文のpublishedから算出し、通常・fixture・unit・UI・Releaseの既存検査と分ける。初回の出力先検査での失敗を修正し、全記事生成のHosted成功は再実行で確認する。過去の3記事版CIの成功を引き継がない。

IOS-13・15は未完了のまま維持する。全記事の生成とFoundation CLIでの受入は確認したが、アプリでの全記事カタログへの切替、画面とVoiceOverの受入、長文・大きな表・最大文字での初回起動・検索・スクロール・メモリ等の性能測定は残る。初版の対象・権利・配布の採択、全音声対応、実機受入やmainへの統合も、この一時生成の成功とは区別する。

文書更新ではMarkdown lint、相対リンク（495ファイル・6,348リンク）、追加したshell例の構文、JSONと最終consumer証拠の一致、差分の空白検査を確認した。文書担当による実生成・consumer監査の再実行は行わず、上記の実行済み証拠を照合した。
