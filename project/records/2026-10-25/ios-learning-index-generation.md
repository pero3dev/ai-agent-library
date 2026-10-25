# 全記事候補の学習案内JSON生成

## 作業契約

- 目的: IOS-14の章掲載順・タグ・既存学習ルート・用語集を、Markdown正本からnative向けの任意補助JSONへ変換する。
- 許可根拠: TODOの優先順で自律実装し、commit・PR・main統合を作業単位に分ける依頼。新たな実機操作は未実施として先へ進む。
- 基準: 全記事候補と画面回帰のPR #254。manifest 2・document 1・代表3記事・fixture4記事を維持し、`--published-library`だけへ追加する。
- 所有: 生成module・接続・新旧Node試験は生成担当、契約・手順・計画・記録・Gitは親が担当する。原文の独立監査と反例試験は監査担当が所有し、Swift consumerと学習UIは別の工程。他者の変更を戻さない。
- 検証・終了条件: 正本参照と境界を検査し、旧profileの厳密な出力不変・全数生成・旧reader互換を区別して記録する。全体のIOS-14受入を完了扱いにしない。
- 適用: [共通契約](../../../AGENTS.md)、[形式契約](../../../ios/renderer/learning-index-schema.md)、[完成版TODO](../../plans/engineering/ios-app-completion.md)。

## 生成する情報

固定パス`assets/learning/index.json`を既存の`manifest.files`へSHA付きで載せる。補助JSONは独自のschema 1を使い、記事・本文・リンクkindの形式を変えない。端末側にHTML・JavaScriptや実行コードを追加しない。

実際の正本から199記事・260タグ・16章・A〜Hの8ルート37手順・164用語を抽出した。記事front matter、章READMEの掲載順、学習ロードマップの読者別表、GLOSSARYのコードフェンス外の実H3を用いる。旧見出し集計の165語を期待値として固定しない。

ルートの「上から順に」「全部」や条件文、Cの外部サンプル、F・Hの前提見出しを保持した。用語は最初の定義段落と全関連リンクを持ち、複数の記事リンクがある5語も削らない。Webの手動ルート配列・最初の詳細リンクだけの用語カードを正本にはしない。

source SHAは選定199記事・章README16本・GLOSSARYの計216件。内部の記事・見出し・章を解決し、外部先は資格情報のないHTTPSとして明示する。正本SHAは真正性の署名ではない。Webカードのアンカーや、外部サンプルのオフライン閲覧も保証しない。

## 実施した検証

生成の新旧Node38件に加え、学習意味監査の130件が成功した。共通checkは722件中707成功・15skip・失敗0だった。独立レビューも同38件を再実行し、実データを読み取りだけで再抽出して197,051 bytes・SHA `24861281…`の補助JSONと完全一致することを確認した。4 MiBの総量、個々の文字列・件数・path・SHA・参照の拒否回帰を含む。

PNGを保存済みの同一資産へ固定した私有生成では、通常3記事の`c10353c1…`、fixture4記事の`15df0e08…`、一時全199記事の`d9d32b9d…`がmanifestと全ファイルSHAまで一致した。全記事の同梱候補は既存624 listed filesを維持し、新補助JSONとmanifestだけが変わった。候補は626ファイル・37,744,906 bytes、revision `f4d732ea…`。これは実Mermaid再描画のビット単位の再現性を新たに証明した結果ではない。

現在のapp ContentValidatorと全199本文の読み込み、既存source auditも成功した。さらにmain `81b5da90…`の0.2.5（7）のModels・NativeDocument・ContentValidator・ReadingStoreを固定してMac向けにcompileし、旧3記事・4記事と新補助JSON付き199記事の全本文を読めた。[学習意味の独立監査](../../../ios/tests/learning-content-audit.mjs)をpublished-libraryのsource auditへ接続し、実候補でも全数照合に成功した。通常・fixture・一時全記事profileへ補助JSONが混入した場合は拒否する。

この旧reader確認はFoundation CLIであり、旧アプリbinary・Simulator画面・iPhoneの成功ではない。共通・単体・生成・consumerの結果とsource SHAは[JSON](ios-learning-index-generation.json)へ記録する。

## 残件

監査レビューでJSONの重複キーをlast-winsで受け入れる不一致を発見した。raw JSONの重複・Unicode escapeによる同名キー・12段超過をconsumerと同じ境界で拒否し、SHAとrevisionを再計算した反例でも拒否する回帰を追加した。独立再レビューと同130件の再実行も成功した。

新Swift consumerのappへの接続、Storeと章順・タグ・ルート・用語集のUI接続は後続で扱う。通常の同梱カタログは3記事のままで、全記事の既定採用・保存済み取り込み版からの切替はしていない。Hostedの最終head検査、実画面・VoiceOver・実機の受入とIOS-14全体も未完了として保持する。
