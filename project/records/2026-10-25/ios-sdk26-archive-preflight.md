# SDK26によるiPhoneOS Archive互換性の事前検証

## 作業契約

- 目的: IOS-02のSDK条件に対し、標準Hosted環境で現行アプリのdevice Release Archiveと実資産を検査する。
- 基準: PR #262 head e8032494fb396718bbfe2218b1dfa428abfd7313。アプリ版0.2.14（16）は変更しない。
- 所有: 新規SDK26 workflow、開発手順・TODO・本記録と索引。他者の差分を戻さない。
- 許可根拠: ユーザーのiOS TODO自律実装・段階的commit/PR/通常main統合の依頼。実機は未確認でスキップできる。
- 終了条件: 内容と構文の独立レビュー後、初回Hostedの実toolchain・Archive・出力パーサーを検証する。署名済み配布の採択とは分ける。
- 規約: [AGENTS](../../../AGENTS.md)、[Git規約](../../../harness/git-rules.md)、[開発手順](../../../CONTRIBUTING.md)。

## 一次資料と実行範囲

2026-10-25に[公式runner image](https://github.com/actions/runner-images/blob/main/images/macos/macos-26-arm64-Readme.md)と[Appleの対応表](https://developer.apple.com/xcode/system-requirements/)を確認し、macos-26 arm64・Xcode26.6とSDK26.5を候補にした。実際の版・build・SDK・arm64をjob内で照合し、ドキュメントの記載だけで存在やビルド成功を確定しない。

[標準public runnerの条件](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)とlive API上のpero3dev/ai-agent-library/publicを確認した。jobはexact repo/publicをrunner割当前に確認し、large runnerや新しい有料サービスを採用しない。contents read、固定Action、checkout資格情報非保持で動き、秘密情報は渡さない。

ローカルmacOS14.6.1/Xcode16.2の更新は行わず、既存Xcode16.4・iOS18.5 Simulator回帰を維持する。最低利用OS17を変更せず、Archiveのdevice実行やStore受理を成功扱いしない。

## 実同梱物の検査

tracked原文からpublishedを独立に数え、標準全記事生成・原文監査・実Swift consumer監査を実施する。generic iOS Release Archiveのactual appを対象に、manifest/source_paths集合・全listed SHA・ライセンス・Privacy Manifestの意味的な一致を確認する。app全ファイルのinventoryも記録する。

InfoのSDK・最低OS、Mach-Oのarm64/device LC_BUILD_VERSION、dSYMとのUUID一致、Releaseのfixture不在を検査する。配布用の署名資格情報・Team・Authority・Provisioningは使わず、無署名か資格情報のないad-hocを観測する。新規証明書・profile登録、allowProvisioningUpdates、exportArchive、Store送信は含めない。

成功は全stageと実auditが通った場合だけとし、失敗もcompact summaryとraw logへ残す。初期計画ではArchive出力・空のsigning settings・otool platform表記・codesignの実形は未確認だった。初回Hostedの結果と残る後段検査は次節で分け、推測で成功値を補わない。

## 検証と残件

内容の独立レビュー、actionlint1.7.12、YAML、Bash10 blockと埋込Node4 blockの構文検査を確認した。初回共通checkは749件中733成功・15skip・1失敗となり、同一run内のauditとinstallを既存の先行step検査が認識しなかった。rootとios/toolsをそれぞれaudit→installの別stepへ揃え、順序・flag・logを保った。修正後actionlint・YAML・Bash12・Node4とharness-tooling22件は成功し、最終共通checkも749件中734成功・15skip・失敗0となった。この静的段階ではSDK26の実toolchain・生成・Archive・新parser実行はまだ行っていなかった。初回Hostedの結果は次節に示す。既存の必須検査とiOS回帰とアプリコード・PBX版・保存を変更していない。

Store向けTeam/識別子・契約・料金・署名・配布判断、実機・最低OSでの画面受入は未完了である。[JSON](ios-sdk26-archive-preflight.json)に静的段階と初回実行の残件を保存する。

## 初回実Archiveと空の署名設定の省略

head1570335のrun40190379973は、実macOS26.6.2/arm64、Xcode26.6 build17F113、SDK26.5を確認し、199記事生成・原文監査、generic iOS Release Archive、actual Contentの全625 SHA・全199本文・fixture不在まで成功した。後段はCODE_SIGN_IDENTITYのキー省略を空文字と厳密比較して失敗し、workflow全体は失敗だった。archive-audit-commandsは空で、実Info/Privacy意味同値・全appinventory・MachO/UUID/codesign等の検査は未到達である。

資格情報6項目だけはキー省略または厳密な空stringを許し、存在するundefined/null/異型/空白/非空を拒否するpure guardを追加した。署名抑止2フラグは実キーと厳密なNOを必須に保つ。Automaticやprofile-required/supportedのYESはplatform metadataであり変更しない。実raw投影とNode7件・構文検査・独立レビューで照合し、元rawbytesを保った。Archive引数・後段の署名/Provisioning拒否は変更せず、最終headを再実行する。
