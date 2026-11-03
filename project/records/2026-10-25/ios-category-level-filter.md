# 章・難易度によるネイティブ一覧の絞り込み

## 作業契約

- 目的: [IOS-14](../../plans/engineering/ios-app-completion.md)のうち、既存manifestのcategory・levelによる絞り込みを独立した実装単位にする。
- 許可根拠: ユーザーのTODO優先度順の自律実装とcommit・PR・main統合の依頼。新たな実機確認は未完了としてスキップする指示を引き継ぐ。
- 基準: 全記事の一時生成PR #249。通常の同梱3記事とfixture専用画面を維持し、全記事の既定採用は行わない。
- 所有: 実装担当はLibraryView・Models・LibraryCoreTestsの3ファイル。親は版0.2.6（8）、README・計画・記録とGit統合を担当する。他者の未提出差分を取り込まない。
- 検証・終了条件: 検索・しおり・章・難易度のAND、解除、未知値、入力順とfixture分離を確認する。SDK compileと実XCTest実行・実機の操作を区別し、独立レビュー後に専用PRへ保存する。
- 適用: [AGENTS](../../../AGENTS.md)、[Git規約](../../../harness/git-rules.md)、[iOS手順](../../../ios/README.md)。

## 実装

純粋な`LibraryArticleFilter`へquery・category・level・bookmarksOnlyを集約した。検索の正規化AND条件を引き継ぎ、全条件の一致する記事だけを元の順番で返す。選択肢は当該画面の`listedArticles`から作り、未知の難易度もmanifestの値のまま利用する。

一覧の「絞り込み」で章・難易度を選び、適用中の条件と件数を確認できる。0件でも条件をすべて解除できる。各行に章と難易度を縦に表示し、操作名と現在の選択をアクセシビリティへ渡す。条件は画面の一時状態で、しおり・読書位置・保存形式を変更しない。通常と専用テストの一覧を混ぜない。

## 検証と残件

新規XCTest3件は全条件のAND、全解除、元の順番、選択肢の重複排除と対象範囲、未知値を検査する。Xcode 16.2・iPhoneSimulator18.2のbuild-for-testingで最終UIと全test targetのcompileに成功した。Simulatorは起動していない。通常CoreSmokeは3記事・音声1本・140ファイルで成功した。新しい3ケースの同一メソッドを抽出したFoundation assertionsも成功したが、iOS XCTest本体の実行とは扱わない。

単独XCTestの私有実行準備ではCLTのmodule・Swift overlayが利用できず、Foundation assertionsへ切り替えた。製品コードの失敗と区別する。Hostedでの実XCTest、絞り込み操作・最大文字・VoiceOverの実機受入は未確認である。[JSON](ios-category-level-filter.json)へ結果を分けて保存する。

独立レビューで3ソースのSHAとcompile証拠、AND条件・解除・未知値・検索移動・保存とfixture分離の維持を照合し、修正必須事項なしと判定した。

タグ、章READMEの掲載順、学習ルート、用語集は今回の範囲に含めず、IOS-14全体は未完了のままとする。全記事生成の成功を画面の全数受入へ広げない。
