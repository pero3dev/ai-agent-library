# 時計由来APIの利用理由を保守的に記載する実装候補

## 作業契約

- 目的: IOS-27の技術的な実装候補として、読書位置の有限な待機に使う時計とPrivacy Manifestの対応を明示する。
- 基準: Icon先行の私有tree `26cc183f23f4d04d6161d619721fa0b902916843`。実mainのIcon・Core等への最終結合は未実施であり、treeをcommitの親には使わない。
- 所有: Privacy Manifest、開発手順・計画・索引、本記録MD/JSONの6paths。他者の変更、App Swift、PBX、版`0.2.17 (19)`、Runtime、CIとIconのsource18は保持する。
- 許可根拠: ユーザーのTODO優先順による自律作業と、rootによる時計利用を保守的に記載する技術案の継続判断。App Storeの回答・事業者のdata-use・法的適合・公開の採択は含めない。
- 終了条件: 一次資料と現コードの用途を分け、最小差分・plist構造・基線外blobとTODO状態の保全を確認する。私有previewは`publishable:false`・`preview_only:true`・`parent_sha:null`を保つ。[AGENTS](../../../AGENTS.md)と[Git規約](../../../harness/git-rules.md)を適用する。

## 事実と実装候補の判断を分ける

2026-10-26の先行tree照合でもApp targetは16 Swiftファイルで、Reader内の`CACurrentMediaTime`は7箇所である。用途はアプリ内の経過時間・位置決めのdeadline・frame待機・Timer計算である。この差分は時計呼出や通信を変更せず、raw clock値の保存・送信も追加しない。ホスト計測・テスト専用のboot APIはAppの利用へ数えない。

[AppleのAPI説明](https://developer.apple.com/documentation/quartzcore/cacurrentmediatime())は、この値が`mach_absolute_time`の結果を秒へ換算したものと説明する。[required reason一覧](https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitype)のSystemBootTimeには`systemUptime`と`mach_absolute_time`が明示され、`CACurrentMediaTime`自体は列挙されていない。wrapperの実装関係は一次資料の事実であり、そのwrapperにも宣言を適用する判断は保守的な推論として記録する。確認した資料だけで、公式に明記された必須宣言の不足とは断定しない。

rootは現elapsed/timer用途へ`NSPrivacyAccessedAPICategorySystemBootTime`・`35F9.1`を記載する実装候補を進める判断をした。この理由はアプリ内イベント間の経過時間とtimer計算を対象とし、取得情報・派生情報の端末外送信を制限する。アプリ内イベント間の経過時間には例外がある。ここで進めたのはsource Manifestの技術候補であり、最終shippingでの適用・Store回答・法的適合・公開の採択とは分ける。

既存のUserDefaults理由`CA92.1`、trackingなし・tracking domain空・collected data空を保持する。`LearningIndex`は`attributesOfItem`から種別とサイズだけを選ぶ。公式のFileTimestamp列挙にこのmethod・`.type`・`.size`はなく、現用途で宣言追加必須という根拠も確認できなかったため、そのcodeや宣言を変更しない。

## 検証と残件

先行treeの`ios/`・`tests/`・`.github/workflows/`を限定検索しても、UserDefaults1件のreason配列へexact-pinするvalidatorはなかった。SDK26 Archive検査は実アプリとsourceのPrivacy plistの意味的一致、およびtracking・domain・collected dataの従来条件を検査する。新しい宣言もその既存検査の対象になるため、consumer・Release・CI・Node unitを追加変更せず、Archive auditorを緩めない。

私有候補ではXML/plist読取、既存属性とUserDefaults辞書の保全、新category/reason1件だけの追加、Markdown・JSON読取、6path差分と非対象mode/type/blobの保全を確認する。実main656を基準にした旧候補の独立レビューは技術内容の履歴として保持し、新しいtreeとの結合レビューに読み替えない。

Icon・Core等の実mainへの再結合、最終内容の独立レビュー、正確なheadでの共通CIとArchive同梱・source一致監査は未実施である。新しいSDK・compiler・Simulator・実機・通信captureは実行しない。Apple Privacy Report・Store scanner・審査の成功も主張しない。

配信基盤のログ、依存SDK・通信の最終棚卸し、公開ポリシーとApp Privacy回答、その採択は別に残す。既存TODO状態とIOS-27の未完了を維持し、[JSON](ios-privacy-clock-reason-candidate.json)へ現基準、一次比較と旧独立レビューのhashを記録する。

## 2026-10-28: main142と新しい公式取得票による私有候補の更新

この追記は上のIcon先行previewの経緯・版・未確認値を保持したものです。固定した実main `142041adf3a6ff353555fba78e73f19dd1d977ff`（tree `2ab281bb467db29646f5b1a5b564b6a764d008a5`、App0.2.20（22））で棚卸ししました。古い0.2.17（19）やprivate treeを最新mainと扱いません。Copy・Audio後の実mainへの結合と採用はまだ行っていません。

現mainのPrivacy ManifestはUserDefaults/CA92.1だけの591Bで、旧候補の親XMLと全bytes一致します。私有候補802Bは従来と同じで、SystemBootTime/35F9.1辞書211Bだけを除くと591Bへ戻ります。trackingなし・domain空・collected-data空と既存UserDefaults値を保持します。これは提案するsource値の保全であり、第三者配信の最終collection分類やStore回答の正しさを確定しません。

実mainのApp targetは16 Swiftのままです。`NativeReaderView.swift` の時計は312・315・323・616・668・682・708行の7箇所で、有限な配置期限、frame待ち、Timer計算、policyの経過判定に使います。raw clockの保存・送信経路はこのsource棚卸しでは見つかりませんでした。LearningIndexのattributesOfItemはtype/size、resourceValuesは通常種別・symlink・容量を確認します。DEBUG限定の診断にはDarwin.fstat/fstatatがあるため、productionの用途と区別しています。新しいFileTimestamp理由は追加しません。

Rootは2026-10-28（日本時間）にApple公式資料を再取得しました。[CACurrentMediaTimeのMarkdown](https://developer.apple.com/documentation/quartzcore/cacurrentmediatime%28%29.md)は979Bで、mach_absolute_timeから秒へ換算する説明と旧保存SHAの一致を確認しました。一方、[カテゴリのMarkdown](https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitype.md)は1212Bでpossible valuesの内容が欠けています。最初のliteral検査は不成立で、これをカテゴリの削除や規約変更、照合成功とは扱いません。

別に取得した[公式DocC JSON](https://developer.apple.com/tutorials/data/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitype.json)は49889Bで、旧保存JSONと全SHAが一致しました。新しい取得票でSystemBootTime・35F9.1・mach_absolute_timeの所在を確認し、attributesOfItemのliteralはありませんでした。構造化JSONの照合と、不完全なMarkdownでの不成立を区別します。wrapper由来の事実と、35F9.1をこのアプリ内elapsed/timer用途へ保守的に適用する推論の区別は維持します。必須宣言不足やFileTimestamp理由の必要性を新たに断定しません。

| 更新に使った凍結入力 | bytes・SHA-256 |
| --- | --- |
| main142棚卸しJSON | 51366B・`32ae7b921978d438b04ec5bc561d6c8076d10ad5a3f566a70e3ed3ef2e6f46cd` |
| 新しいMarkdown取得要約 | 1953B・`802e53eaebda2cd5195a37a6df2b7ab1a9fd65676c8d81b87cda30de309b1c05` |
| 新しいDocC JSON取得要約 | 1102B・`871a67833d61157e7a00dfebc9493c1b536fa98d69628f6cf4ec1704223eaa60` |
| 公式DocC JSON本体（新旧一致） | 49889B・`0d7433b45081771a4d1d886e1b753746d678e158f8705a159db6979bc46ecae9` |
| 公式時計APIのMarkdown（新旧一致） | 979B・`18911890cbc50cba36bf325cfbec433e926708f81fa162f96b914e2d4b5393c0` |
| 旧Icon結合previewの独立レビュー | `9b2aaaa9ec64b253643d0db45ee75be7eb855f96f6bbdb89081919b4b3cbf3e1` |

main142の通信は明示再生の固定GitHub音声、利用者による外部リンク、選択フォルダーの読取を境界として記録しました。ローカルには通常の読書記録に加え、復旧前の固定backup、音声の速度・章、import済みの旧コンテンツ版が残ります。コピー2入口、DEBUGの限定診断とOS側の挙動も棚卸しに含めました。この記録作成ではSourceの振る舞い・About表示・Store回答を変更せず、新しいテスト・SDK・API・媒体取得も実行していません。

次はCopy・Audioを採用した後の実mainで最小6pathを再結合し、最終payloadの独立レビュー、共通CI、正確なheadのunsigned Archiveとactual/source Privacy一致を確認します。今回の固定main142票や過去のArchiveをその成功へ転用しません。配信先のログ・利用目的・保持、ownerの公開policy URL・問い合わせ先、App PrivacyとStore formsは未確定です。IOS-27を完了にせず、既存TODO32項目・完了12項目を維持します。
