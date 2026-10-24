# 記事改訂後の読書位置の照合

## 作業契約

- 目的: IOS-11のうち、記事の改訂・見出し改名・段落挿入後に、保存した本文へ近い位置を安全に照合する。
- 許可根拠: ユーザーが優先度順の自律実施とcommit・PR・main反映を依頼し、新しい実機操作は未完了として省略できると追加指定した。
- 基準: 検索機能の[PR #242](https://github.com/pero3dev/ai-agent-library/pull/242)、head `d2596980a9ea3a8f1dcfeb54fd12567052b92d97`から開始した。実装中に独立した[CI PR #243](https://github.com/pero3dev/ai-agent-library/pull/243)、head `c16f17e93029460fba43562020fa2091ac95c043`を先に保存し、これを直接の親とする。専用branchは`codex/ios-reading-revision-restore`。
- 所有: データ担当がReadingStore・NativeDocument・LibraryCoreTests・CoreSmoke、親がArticleReaderView・LibraryStore・版・schema契約・記録・統合検証を担当する。他者の差分は戻さない。CIの別担当はworkflowとCI専用ファイルだけを所有する。
- 方針: 保存キーと旧heading・fraction・blockIDを維持し、任意のanchorを追加する。検証済み本文JSONのdigestを改訂判定とし、ID・生成画像パスに依存しない意味内容fingerprintを使う。曖昧な重複は断定せず見出しまたは割合へ戻す。未知・破損anchorだけを無視し、しおりや他記事の保存を失わない。
- 検証: 旧保存・改訂挿入・改名・削除・重複・資産再生成・改訂なしの照合と保存不変をFoundation／XCTestで検査し、SDK compileと独立レビューを行う。新しい実機・Simulator操作は未実施として残す。
- 終了条件: 読取が永続保存を変更せず、新しい位置の保存時にだけanchorを更新する。検索・fragment・目次が保存復帰より優先される。block内の文字・pixel精度は未完了として区別する。
- 適用: [共通契約](../../../AGENTS.md)、[計画](../../plans/engineering/ios-app-completion.md)、[保存API](../../../ios/renderer/native-schema.md)、[Git規約](../../../harness/git-rules.md)。

## 状態

0.2.5（7）へ実装した。旧保存キーとheading・fraction・blockIDを維持し、新しい保存時にだけoptional v1 anchorを付ける。本文JSONのdigestが同じなら有効なIDへ、変わった場合は一意な本文fingerprint、同じ本文が複数なら一意な見出し内の一意な本文、見出し、近い割合の順で復帰する。生成画像のパス・寸法や見出しslugはfingerprintへ含めず、コードの空白・数式のTeXや本文構造は区別する。

破損・未知anchorは当該項目だけを無視し、しおり・他記事・旧位置を維持する。保存のgetterは無書込で、画面では検証済み本文の読込後に一度だけ照合する。新しい検索・fragment・目次移動の優先は維持する。

通常3記事・fixture付き4記事のCoreSmokeが成功した。XCTestを8件追加し、50件を含むSDK build-for-testingとRelease buildが成功した。新しいXCTestの実行成功という意味ではない。Release監査は3記事・140ファイル・2,455,933 bytesのSHAとTestContent不在を確認した。共通検査はNode567件中552成功・15skip・失敗0（親のCI PRの新規8件を含む）。独立レビューではoptional pathの型を修正し、最終内容で修正必須事項がないことを確認した。

新しい実機操作・SimulatorでのXCTest実行、block内の文字・pixel精度は未完了。実装結果と未実施の受入は[JSON](ios-reading-revision-restore.json)で分けて追跡する。
