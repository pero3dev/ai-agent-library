# 本文図の表示サイズに応じたプレビュー

2026-10-29。本文の図を表示サイズに合わせて読み込み、拡大時には元画像を使う0.2.23（25）の候補を作成した。[対応JSON](ios-figure-preview-images.json)にSourceのSHA256・検証範囲・残件を記録する。実機・VoiceOver・性能比較は未完了として残す。

## 作業単位と基準

本人の自律実施・通常commit／PR／main統合の依頼に基づく、実装2・回帰テスト1・版設定1・実施記録2・索引と計画2の計8ファイルである。著者元のApp SourceはE0、提出候補の親はPR #297を通常統合したmain `9a2d7cc6bc9c57bc4ac160efb83428e0e1f84c5e`とする。実Gitで全2803ファイルのtupleが承認済み80ccと同じこと、変更前のSource4と索引2が元のbyteと同じこと、新規記録2が未存在であることを確認した。既存の作業中ファイル・個人用handoff・端末へは変更を加えていない。

PR #297はMemory・Native・Commonの3系統とReady後の必須11検査を確認し、2026-10-29に通常統合済みである。Memoryの[実行40772249621](https://github.com/pero3dev/ai-agent-library/actions/runs/40772249621)は専用case122.158秒・export exit 0・3指標各3標本とCSV668Bを独立照合した。生成監査工程は約214.887秒で旧230秒以内だったため、その成功だけを上限延長の必要性の証明とはしない。初回postboot inventoryのtimeoutから限定1回の追加読取が成功したことと、旧main4a6のAX停止原因が未解決であることを分ける。統合後main9a2では4系統を別に観測中である。Fullの初回はiPhone16／iOS18.5のdestinationが120秒で見つからず、テスト開始前にexit 70となった。初回の生ログhashと工程抜粋を保持し、条件不変のjob再実行1回だけを発行した。Memoryは初回の全工程がAPI成功したが、新たな数値metricは取得していない。Fullの根本原因・再実行結果、Native・Commonの最終結果は未確認で、PR成功を転用しない。

## 実装と保持する経路

[NativeInlineText.swift](../../../ios/AILibrary/Sources/NativeInlineText.swift)に本文図専用のImageIOプレビューを追加し、[NativeReaderView.swift](../../../ios/AILibrary/Sources/NativeReaderView.swift)から表示幅・高さとdisplay scaleを渡す。64px単位のrequestを作り、cache keyにpurpose・root・digest・path・寸法・requestを含める。拡大は従来の元画像、数式・行内画像も従来の経路を使う。利用者向けの設定や操作は増やさない。

入力PNGは各軸8192px・3200万pixel・encoded 32MiB以内、返却previewは800万pixel・bytesPerRow×heightが64MiB以内かを確認する。元画像より拡大せず、不正入力や上限超過を元画像読込で埋め合わせない。これらは入力と返却値の検査であり、ImageIO内部の一時割当やAppの総メモリ・RSSの上限ではない。NSCacheのcost limitも強制的な保持量の上限とは扱わない。

[NativeInlineTests.swift](../../../ios/AILibraryTests/NativeInlineTests.swift)へ実production APIを呼ぶ9メソッドを追加する。requestと上限、実PNG decode、metadata許容差、不正入力、元画像とpreview・サイズ・明暗・root・digest・metadataの分離、unsafe pathを扱う。既存37メソッドは逆差分でbyteを保持した。cacheのobject identityや実行時間、性能改善をassertする試験ではない。

[PBX](../../../ios/AILibrary.xcodeproj/project.pbxproj)はApp Debug／Releaseの版を0.2.22（24）から0.2.23（25）へ変える4値だけで、逆置換とOpenStep構造比較で元のPBXへ一致する。Team・最低iOS17・SDK・sandbox YES・target構成を保持する。

## 検証

- Source2を含むApp16ファイルのDebug／Release SDK型検査と、追加後のNativeInlineTests全46メソッドのiOS18.2 SDK型検査が成功した。Mac ImageIOの実PNG6本・3条件・18出力／3636assertionとorientation例も確認した。UIKitでの実テスト実行とは区別する。
- Source3の実装・テスト意味と、旧0.2.22（24）の私有unsigned Release証拠の独立レビューは新P1・P2が0件である。旧buildはXcode16.2／iphoneos18.2・generic arm64で成功し、199記事・422PNG・音声1本・Content626ファイルを監査した。
- 共通検査は1157件中1142成功・15skip・失敗0、約40.21秒で成功した。lockfileが一致する準備済み依存を使い、実main9a2の全2803blobを検証した隔離コピーへ凍結8ファイルを重ねた。最終記録4の追記は後続の限定検査で確認する。初回はsandboxの数値host表記が起動前に拒否され、localhost表記だけ直した後に実行した。Sourceを変えて通したものではない。
- 新0.2.23（25）の署名なしReleaseはXcode16.2／iphoneos18.2・generic arm64でexit 0、約39.404秒。実Info.plistの25、AppIcon・Privacy・Release package・実Core consumerを監査し、199記事・422PNG・音声1本・Content626ファイルを確認した。旧Content revision `5be64a00f783a1df3a2159dcb64b84551e36853c7fe7d0b0d300c80ccd7fd852`を再利用した確認であり、再生成や最新Markdownとの照合ではない。Appの632ファイル・41,474,970Bはdisk量で、RSSではない。

新版build／auditはallowlist環境でHOMEを保ち、外部IPを拒否した。CLIだけscript sandboxをNOにして正本PBXのYESを保持し、署名・profile・CodeSignature・Release fixtureがないことを確認した。App16・Source4・元704入力の後照合後、所有するApp・workspace・compiler cacheを整理した。SwiftFileListはApp16とXcode生成asset symbols1件の計17件で、初回の16件というharness期待だけを訂正し、buildやテストを再実行していない。

旧buildの初回はcompile前のgeneric destination bindingでexit 70、SDKが存在していた。追加Cocoa home隔離を外した後に成功したが、環境変更を制御した原因比較ではない。追加テストの初回型検査はXCTest overlayの検索path不足で失敗し、commandだけを直した後に成功した。これらの票を保持し、Source変更による修復とは主張しない。

## 終了条件と残件

最終8ファイルの独立レビューと形式検査後に別PRとし、正確なheadのXCTest・SDK／platform・UIと共通必須検査を確認して通常のmain統合へ進める。追加9件を含むNative単体245件・NativeInlineTests46メソッドは期待数であり、この記録作成時点では実行成功数ではない。全記事・fixtureの原文生成監査は必要なCIで改めて確認する。

Retinaでの見え方、最大文字・明暗、元画像の拡大とsheetでの読込時刻、保存復帰、VoiceOver、実機、RSSや一時割当・性能比較は未確認である。本人の許可に従い実機・VoiceOverを未完了のままスキップでき、CI成功に置き換えない。TODO32行・完了13行とIOS-15全体の未完了を保持する。追加契約・課金・実配布・新たな署名や端末操作は行わない。
