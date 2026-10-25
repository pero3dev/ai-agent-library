# 全publishedを標準の開発生成へ接続

## 作業契約

- 目的: [IOS-13・14](../../plans/engineering/ios-app-completion.md)の実装を開発用の通常手順へ接続し、全publishedと学習索引を生成・監査できる入口にそろえる。
- 許可根拠: ユーザーの全iOS化TODOの自律実装・commit・PR・main統合の依頼に基づく、可逆な開発手順の整備。
- 基準: 章リンクPR #260、操作行のタップ範囲修正済みhead 5174cf51。版は0.2.13（15）。公開先・有料登録・Store申請・音声範囲の採択とは分ける。
- 所有: workerはpackage.jsonと通常/native全記事CIの3ファイル、現行手順4文書。親はXcode版番号・記録・独立レビュー・Git統合。他者の変更を戻さない。
- 終了条件: 標準npmの実生成・原文監査・実consumerと回帰入口を確認し、共有生成物・既存記録を保ったまま最終headのCIへ進む。
- 適用: [共通契約](../../../AGENTS.md)、[Git規約](../../../harness/git-rules.md)、[開発手順](../../../CONTRIBUTING.md)。

## 開発の入口と回帰

`npm run ios:prepare`を既存の`--published-library`へつなぎ、`ios:test:content`は全publishedの原文監査、`ios:test:package`は実Swift consumerのパッケージ監査へそろえた。現在の全publishedは199記事で、学習索引とライセンス類を含む。原文件数は固定せず、CIで独立に数える。

代表3記事は`ios:prepare:representative`と`ios:test:content:representative`、CoreSmokeは`ios:test:core:representative`を明示して維持する。直接生成CLIの無flagの既定3記事と既存`ios:test:core`/reader回帰も互換を保つ。fixtureは3記事と専用1記事のままで、標準カタログへ混ぜない。

通常CIは代表3/fixture4の回帰、全記事CIは実際の標準npm入口による生成と独立件数・原文・実Debug・全UI・Release全SHA監査を行う。検査を省いて同じ名前を成功にする変更はない。

## 実生成の検証

freshな私有copy rootで、修正していない標準npm prepare→content監査→package監査と独立原文件数199を実行し、全て成功した。199記事・626ファイル・422PNG・37,744,971bytes、学習索引197,051bytesを生成した。全625 listed SHAを再計算し、原本の全記事set/SHA、16章・8ルート37step・164語・260タグ・216原本、NOTICE・KaTeX・Mermaid全文と既存音声1本のURL/SHA/credit/license/全章を照合した。

共有Content3/fixture4のmanifestと全SHA、過去の学習付き候補は変更していない。新候補と過去候補の差はPNG23件のSHAで、本文JSONと索引は同じだった。全画素一致や再描画のbit再現性を主張しない。

共通check722件中707成功・15skip・失敗0、3/4/199原文監査、代表CoreSmoke、package aliasの代表版と私有全記事版、YAML/Bash/CI inventoryの検査が成功した。CI同版のactionlint1.7.12も公式配布SHAを照合後に成功した。Xcode projectは版番号だけを変えた。

## 保持と残件

正常な取り込み版はアプリ更新後も優先され、同梱版を確認・選択するまで自動置換しない。しおり・読書位置と旧版を保持する。今回の作業は共有生成物を再生成せず、iPhone・通常UserDefaults・Apple/Storeを操作していない。

音声は既存1本のstreaming metadataを維持し、MP3・台本・README紹介画像等を追加同梱しない。記事・変換とKaTeX/Mermaidの既存表示・LICENSE/NOTICEを保持する。新しいネットワーク更新、公開申請や料金の採択、未確認の配布権利を承認済みとは扱わない。

最終headのSDK/Hosted通常・全記事UI・Release、全199記事の視覚・VoiceOver・最大文字・実機・性能目標と容量管理は未完了である。IOS-13/14全体のcheckboxは完了にしない。[JSON](ios-published-development-default.json)にコードSHA、実行面と私有生成物の証跡を残す。
