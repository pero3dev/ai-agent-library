# iOS読書記録の手動復元：実装と検証範囲

2026-10-28。通常ライブラリの手動バックアップをpreviewし、別の明示確認後にしおり・読書位置・「続きを読む」を戻す候補を準備した。[手動書き出し](ios-reading-backup-export.md)と共通の厳格codecを使い、本文表示テストの記録は通常側から分離する。

[export PR #293](https://github.com/pero3dev/ai-agent-library/pull/293)の採用main `a18a47c2911a51c47b714a589a4067d970602279`、tree `4f69f5687bdeab03657863a6da3a48d6344bdbd0`を起点に、対象tupleを照合して結び直した。export最終headは `f6561b17e0a6b7b50435e7c26878e2eccadb626f`。Readyの必須検査とexportのSDK観測は受領した証跡へ結び、復元のApp71・SDK・provider等の未実施と分ける。復元PR・CI・main反映は未実施で、未来のmerge SHAは記録しない。

## 復元と保全

通常一覧の「その他の操作」から復元センターを開く。日時・対象件数・現在の件数をpreviewし、しおり・読書位置が0件なら警告する。previewを閉じるだけでは保存せず、別の明示確認で置き換える。MainActor wrapperは各APIでfixtureを拒否し、失敗する経路も単一の`readingSaveSuspended`へ同期する。

入力envelopeは2MiB、内部rawは1MiBが上限である。readerはsecurity scopeとcoordinationを使い、regular fileのdescriptorから実際に2MiB＋1byteまで読んで超過を拒否する。metadataだけで容量を判断しない。取消・閉じる・新しい選択の後の旧読取結果は採用しない。ただし2MiBはbyte上限であり、provider待機時間の上限や、blocked coordinationの即時中断は保証しない。SHAは照合用であり、出所を認証しない。

Coreはstore token・世代・主記録とslotの全bytesをconfirmationへ結び付ける。復元直前のrawを固定1slotへ保全し、全量readback後に主記録を書き込む。主記録がtarget rawと完全一致した場合だけ公開状態と所有raw identityを同期する。成功復元後の通常操作を外部変更と誤判定しない。

slotは黙って上書き・巡回しない。正常な復元前rawは書き出し、exporterの完了に加えて本人が保存先のファイルを確認し、別の明示確認で端末内の保全を解除する。provider完了は永続保存の保証ではない。復元前が未作成なら書き出せるrawがないと説明し、その保全状態を明示解除する。未知・破損slotの削除や上書きは拒否する。

観測した外部差分や不確かなwrite/readbackの後は通常保存を止め、成否不明の書込を「元記録は不変」と表示しない。未知writerを自動rollbackしない。currentは未作成または厳格に正常なrawに限り、破損currentの直接復元は未対応である。[既存の破損保全と明示復旧](../2026-10-27/ios-reading-state-recovery.md)または別の対応が先となる。旧`.recovery.v1`は復元処理で書換え・削除しない。readbackはCAS・複数keyの原子性・耐電断を保証しない。

## 固定したSourceとレビュー

engine v3 Source2はReadingStore・CoreTests、UI v2 Source3はLibraryStore・LibraryView・ReadingRecoveryUITestsである。Rootはactor seamと5ケースをCoreへexact挿入し、PBXとworkflowを含む旧Source7を合成した。現行Source8は旧7の全bytesを保ち、Privacy Manifestだけを追加訂正する。snippetを除去するとCore全文がengine v3へ戻り、ReadingStoreとUI3は凍結版のままである。engine Source2と、UI v2／旧Source7の追加結合の独立レビューはいずれもP1・P2が0件だった。Source8の宣言・callsite・固定guardの独立監査はP1・P2が0件だった。Source8 manifest SHA256は `8553cb9cb6796df39adec65e67bf359d93cf805bcfe194c1f5d55d5ef2821b08`、監査manifestは `b7d2d2d983e47b55b83cf0953bc34f8959697f24f13ab320de2f2a910efe4f29`。これはSDK・App・providerの受入ではない。

PBXは0.2.21（23）から0.2.22（24）への版上げだけである。`ios-native.yml`は旧「Two recovery tests」のコメントだけを更新する。機能的なselectorやguardは維持し、Nativeの対象は2＋3＝5件、Fullの厳密23件は変えない。これらはこの候補の実行成功件数ではない。

## Privacy Manifestの追記

Rootは2026-10-28にApple公式の[APIカテゴリ](https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitype)と[承認理由](https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitypereasons)を照合し、直接の`lstat`・`fstat`・`fstatat`をFileTimestamp対象として整理した。新readerのDebug／Releaseでは、本人がJSON file pickerで許可したファイルの`st_mode`確認に3B52.1を宣言する。C617.1は既存の`#if DEBUG`かつ`UI_TEST_SUITE`でguardされた、自アプリDocuments診断の`fstat`／`fstatat`を対象にする。Releaseでこの診断経路が含まれる、または実行されるとは主張しない。

共通の`PrivacyInfo.xcprivacy`へFileTimestamp辞書を追加し、既存UserDefaultsのCA92.1・SystemBootTimeの35F9.1、tracking=false、空のdomains／collected-dataを保持した。追加辞書の逆除去は元bytesと完全一致し、plist parseとplutilが成功した。OS呼出やSwift／Script本体の変更はなく、権限・追跡の追加でもない。2つの構成を扱うsource上の理由選択であり、実SDKのPrivacy resource・実report、App Store Connect申告や審査の受入を示さない。

## 検証と未実施

| 対象 | 証拠と範囲 |
| --- | --- |
| engine v3 Source2 | grammar2成功。実ReadingStore／codecを使うMac Foundation・CryptoKitの独立assertionでCore62件を1回実行して全成功（export20＋engine39＋結合3）。App XCTestではない |
| Foundationの補助型 | `ContentValidator.isDigest`は実bodyとliteral一致する複製を実際に呼ぶ。無関係なdocument／anchor resolverはsignature shimで対象経路では未呼出し |
| UI v2 | Source3とactor仮classのgrammar4成功。import解決・iOS型検査・XCTest実行は含まない |
| bounded reader | v1の実抽出readerでMac Foundation9件成功。v2のreader body SHA完全一致を確認して継承し、反復していない。実picker／providerの成功ではない |
| 旧Root Source7（現行8でも同じ本文） | 最終Coreの新しい構文parseとPBX plutil成功。Core逆除去・UI3 exactを照合。既存62件・reader9件は反復していない |
| Source8のPrivacy追記 | 新辞書のexact inverse、parse、plutil成功。旧7全bytesを保持。62件・reader9件・grammarは反復せず、実SDKのPrivacy reportは未確認 |
| 独立レビュー | engine v3とUI v2／旧Source7追加結合の各reviewはP1・P2が0件。reviewerのruntime再実行は0回。Source8宣言の独立監査もP1・P2が0件 |

関連App XCTestの定義は66＋actor5＝71メソッドのsubsetである。全単体試験総数を推測しない。71件のApp実行、iOS／SwiftUI型検査、追加picker取消UI1件、実providerの選択・読取・書出し・復元・取消、停止表示、Hosted、実機・VoiceOver、実SDKのPrivacy resource／report・Store申告の受入、署名更新時の記録維持、耐電断は未実施である。Native対象5件／Full23件も新しい成功結果へ転用しない。

reader初回のsandboxによるfilecoordinationd初期化失敗と、その後のMac IPC可能環境での9件成功も、実provider試験と区別する。

## コミットと残件

export実採用mainを起点に、1つの復元PRを3コミットで進める。

1. engine Source2とPBXを反映する（3path）。
2. UI Source3・Coreのactor追加・workflowコメント・Privacy Manifestを反映する（6path、Coreは前コミットと重複）。
3. この記録2ファイル・索引3と既存export記録2への採用追記を反映する（7path）。

parent・commit・PR・merge SHAは実際の作成結果から得る。最終Source・metadata・通常CIを再照合し、実機操作はユーザー指定どおり未完了で記録して依存しない作業を進める。TODOは32行・完了13行とIOS-22未完了を維持する。この単位だけで破損移行全体や自分用アプリの完成を示さない。
