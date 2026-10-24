# ネイティブ記事パッケージの互換性契約

## 作業契約

- 目的: IOS-19の既存実装を照合し、manifest schema 2・document schema 1・native renderer v1の対応と拒否条件を明文化する。旧HTML生成による通常packageの上書きを防ぐ。
- 許可根拠: TODO順の自律実施・作業単位別のcommit・PR・main反映の依頼。配信署名・独立更新・公開申請・有料契約はこの作業へ含めない。
- 基準: [復帰PR #244](https://github.com/pero3dev/ai-agent-library/pull/244)、head `2ad2cff29c86a25185e197ff5171be11efcc67d9`。専用branchは`codex/ios-native-package-contract`。
- 所有: 生成担当は旧HTML CLIとそのNode回帰、shared生成処理の音声時間境界とnative生成処理のmanifest込み容量上限・そのNode回帰、LibraryCoreTests・CoreSmokeのfuture schema拒否・保存済みfuture版fallback試験。親はnative-schema・手順・TODO・記録・統合検証とGitHub反映。他者の差分を戻さない。
- 方針: app・rendererの対応を静的な契約として定義する。未採択の配信元・真正性はIOS-20以降で扱い、新しいmin_app_versionフィールドやversion交渉は追加しない。未対応版の導入・再起動で正常版と読書記録を保持する。
- 検証: NodeのCLI出力先ガード、future manifest・documentの拒否、保存済みfuture版からのfallback、旧形式の既存回帰、共通検査・SDK compile・独立レビュー。実機操作は未完了として省略する。
- 終了条件: 現行形式と変更時のversion規則が一意に読め、旧CLIが通常・fixtureの出力先を既定で置換しない。試験で未対応版からの回復を確認し、配信全体や旧経路全削除の完了と区別する。
- 適用: [共通契約](../../../AGENTS.md)、[保存・形式契約](../../../ios/renderer/native-schema.md)、[完成版TODO](../../plans/engineering/ios-app-completion.md)、[Git規約](../../../harness/git-rules.md)。

## 状態

manifest schema 2・document schema 1・native renderer v1と現行appの対応、非互換変更時のversion規則を定義した。旧HTML CLIは必須の`--output`と一時ディレクトリに限定し、通常・fixtureの出力先とその親子を拒否する。import時には実行しない。旧HTMLのライブラリ全削除や配信の真正性は別工程へ残す。

producerの音声時間をconsumerと同じ24時間以下に揃えた。最終manifestのUTF-8 byte列を含む4,096ファイル・256 MiB、manifest 8 MiB、各PNG 32 MiBを出力置換前に検査する。独立レビューで残っていたPNGのbyte上限を指摘され、上限超過でも旧出力のsentinelを保持する回帰を加えて再レビューで解消した。

Nodeの形式関連31件が成功した。future manifest 3・document 2の拒否、保存済みfuture版のfallback・pointer・しおり・読書位置維持をCoreSmoke通常・fixtureで確認した。XCTestを2件追加し、52件のtargetがSDK compile成功。新しい2件のHosted実行成功を意味しない。先行する[PR #244の50件](https://github.com/pero3dev/ai-agent-library/actions/runs/40135742109)は実行成功済みとして別に保持する。

実際にChromeで通常3記事・fixture付き4記事を再生成し、revision `c10353c1…`と`15df0e08…`を維持した。IOS-19の形式定義と拒否回帰は完了とし、main反映は前提の復旧待ちとして区別する。実機操作・未採択の独立配信・旧経路全削除の完了とはしない。[JSON](ios-native-package-contract.json)へ検証面を分けて記録する。
