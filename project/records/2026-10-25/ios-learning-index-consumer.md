# 学習案内JSONのSwift検証とXcode登録

## 作業契約

- 目的: IOS-14の学習案内をSwiftで安全に読み、後続のStore・学習UIへ渡せる検証済みモデルを用意する。
- 許可根拠: 完成版TODOの自律実装・段階的commit/PR/main統合、新しい実機検証を未完了として継続する依頼。
- 基準・所有: [生成と原文監査のPR #255](https://github.com/pero3dev/ai-agent-library/pull/255)を前提とする。consumer担当は新Swiftモデル・XCTest・Xcode登録、親は契約・手順・計画・記録・Gitを担当。他者の変更を戻さない。
- 検証・終了条件: 任意資産の不在互換、型・上限・参照・パス・SHAの拒否、既存データ非更新を検査し、SDK compileとHosted・UI・実機の実行を区別する。
- 適用: [共通契約](../../../AGENTS.md)、[補助形式契約](../../../ios/renderer/learning-index-schema.md)、[生成記録](ios-learning-index-generation.md)。

## 追加した処理

`NativeLearningIndex.decode(data:manifest:)`と`load(from:)`を追加し、章・タグ・ルート・用語と型付き参照を保持する。manifest 2・document 1や既存の`ContentValidator`は変更しない。新2ファイルをappとunit targetへ登録し、版0.2.8（10）を維持する。

`assets/learning/index.json`が列挙も実在もしない既存packageは`nil`として扱う。存在する場合は固定パス・regular file・祖先のsymlink・SHA・4 MiBの読み取り上限を確認する。UTF-8・重複キーとescape alias・深さ12を解析前に検査し、schema、各型・件数・一意性、記事のcoverage、見出し/章/HTTPS参照、source SHAを照合する。不正や未対応versionは明示的にthrowし、黙って学習データとして使わない。

ファイルやUserDefaultsを書き換えず、通信・再生も行わない。本文の正常版を選ぶ既存Repository、Storeや学習UIはこの単位では接続しない。呼び出し側は補助情報の失敗と本文の失敗を区別して扱う必要がある。

## レビューと実行した検証

独立レビューで、空白だけの学習stepを受理する点と、ロードマップを記事・タグ・source集合から同時に外しても受理する点を見つけた。step全体の意味のある文字/リンクと、ロードマップ記事の存在を必須化した。途中の空白は維持し、参照先を別の有効記事へ置き換えた反例も拒否する。元の私有CLIの反例を再実行して解消を確認し、独立再レビューも承認された。

MacでXCTest suiteを直接実行し、23件中22成功・1skip・失敗0だった。skipはCLIにapp bundleがないため、同梱resourceを検査する1件である。私有の実packageでは旧3記事・fixture4記事の索引不在と、199記事・16章・8ルート・164用語の候補読込を別途確認した。tracked試験には現在の199/164や私有絶対パスを固定せず、manifestと実bundleへ照合する。

Xcode16.2・iPhoneSimulator18.2のgeneric build-for-testingでapp・unit・UI全targetのcompileが成功した。登録時点は単体86件・UI5件。その後の親PR #254の保存位置回帰1件を含むworkingでもSDK compileが成功し、最新親を基準とした登録数は単体87件・UI5件となる。どちらもSimulator起動やテスト実行の成功を意味しない。

最初のSDK compileはnested sandboxで止まり、同一のコマンドをツール権限付きで実行して成功した。projectのuser script sandboxは有効のまま。pbx検査・差分検査も成功し、共有Content3記事・TestContent4記事の全ファイルSHAと一覧は不変だった。証拠の要約と凍結SHAは[JSON](ios-learning-index-consumer.json)へ記録する。

## 残件

最終feature headのHosted XCTest、Storeの任意読込・エラー案内、章順・タグ・ルート・用語集のSwiftUI接続とリンク操作は後続で扱う。新しいUI・VoiceOver・実機・性能・全記事の既定採用とIOS-14全体は未完了であり、この読み取りAPIの追加で受入を完了とはしない。
