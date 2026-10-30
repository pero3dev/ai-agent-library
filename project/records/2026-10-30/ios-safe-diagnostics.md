# Aboutの版情報・診断・通信と保存説明

作成日: 2026-10-30。更新案: 2026-10-31。状態: **提出候補、実parent `8a0efdb62a9a1e9c7605e40de3fc552ff5a77344`へ結合済み**。先行する参照保持と本文UIを通常統合したmainへ所有差分を結ぶ。PBXへApp0.2.26（28）と4object・4membershipを反映し、他の設定を保った。実Bundle確認・新署名buildは未確認である。IOS-27/28は未完了、TODO32行・完了14行を維持する。

## 目的と範囲

AboutにApp版/buildと明示的な診断コピーを用意し、端末内の本文・保存、音声・外部リンクの通信、個人の読書backupの範囲を説明する。IOS-27はこのAbout文言の限定整理、IOS-28は自己利用の版確認・障害対応を準備する範囲であり、Store申告や公開supportの完成を意味しない。

予定所有はhelper、新6件のtest、LibraryView、PBXのSource4、この記録とJSON、project/計画の索引2本、ios READMEの計9パス。[共通契約](../../../AGENTS.md)、[運用文書規約](../../../harness/writing-rules.md#調査記録と運用文書)、[Git共通規約](../../../harness/git-rules.md)を適用する。ユーザーの残りTODOの自律実施と通常commit/PR/main統合の継続依頼の範囲で準備し、本人操作が必要な実機受入は未完了のまま区別する。私有docs作成後、Rootが実parentへ最終9パスを結合した。共通検査・CIと通常統合は後続で確認する。

## 診断の形式と限界

formatterは短いApp版/buildと任意の型付きmanifestだけを受け取り、format番号、App版、build、manifest状態、schema、記事数、掲載ファイル数、semantic SHAを固定8行・最大512Bへ整形する。metadataの型/件数/文字budgetと8MiB encode上限を確認し、不正・取得不能・範囲外は固定unknownにする。

semantic SHAはmanifest全体を`JSONEncoder(.sortedKeys)`で表現したSHA256。manifest内の文字列はhash入力だが、raw revision（64hexの場合も含む）、タイトル、記事ID、URL、path、error/logを直接出力しない。読書raw・しおり・位置・実行時の検索語、OS/端末・アカウント・環境・現在日時は診断入力にしない。ファイルそのもののSHA、発行者認証、匿名化の保証、読書backupではない。別監査で受け入れたContent snapshotが呼出側の前提であり、formatterのbudgetはContentValidatorやSwift consumer監査を置き換えない。診断のbyte/作業量上限はCore観測production CLIの資源上限とも、未採択の性能予算とも別である。

About表示だけではclipboardへ書かず、「診断情報をコピー」の明示操作時にだけ生成してコピーする構成。コピー済み表示、accessibility値とannouncementを用意する。自動送信は追加しない。実About操作・clipboard・VoiceOverの確認はまだ行っていない。

## 通信と保存の説明

Aboutではnative本文・図・数式を端末内で表示し、しおり・読書位置・音声位置/設定を端末内へ保存すると説明する。音声再生はGitHub配信先へ、外部リンクはリンク先への通信を起こし、リンクはiOSが選ぶbrowser/対応appへ渡す。配信先の接続情報の扱いを断定せず、Safari固定の説明を除いた。記事の取り込み時に選択folderを読む説明は手動importだけを指し、通常の同梱再build更新と分ける。

読書backupはしおり/位置等を復元できる**暗号化されていないJSON**。別キーの音声位置/設定は含まない。診断copyとの混同を避け、保存先/providerや共有先、OS backupの挙動まで端末内だけと保証しない。

PrivacyInfoは既存1035B、SHA `29da7723de101f74115e6b6af6ad3a7afecbaaf6cc101c86ad0a50edae587f5e`を保持する。UserDefaults/CA92.1、SystemBootTime/35F9.1、FileTimestamp/3B52.1・C617.1の3分類・4理由は既にある。時計理由やmanifestを追加する作業ではない。2026-10-30に照合した[AppleのAPI分類](https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitype)と[App Privacy定義](https://developer.apple.com/app-store/app-privacy-details/)、[GitHubの一般privacy説明](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)を背景とするが、配信先の実logs/保持/用途は未確認。独自解析SDKなしだけでNo data collectedやtracking分類を確定せず、Store回答・公開policy/連絡先・契約判断は未完了のまま。

## 確認した候補と実行範囲

旧診断Source4は基準184の静的レビューでP1/P2が0件。helperは元のSHAを保持する。testの人工パス2件の修正は後述の別検査へ結び、LibraryViewのprivacy文言差分は別の独立レビューでP1/P2が0件となった。PBXは旧候補の4object・4membership追加を実parentのbuild27へ結び直して0.2.26（28）にした。App17の各SHAは最終文言のSDK17-source入力へ一致する。旧HostのCore4/helperは同じ入力を保つが、旧testと新testの受入は分ける。

2026-10-31の将来compositeでは、記録されたPR312参照保持候補f1c47のbaseline16へhealthy DEBUG Appと当時のLibraryViewを重ね、helperを加えたApp17を凍結した。**iPhoneOS18.2 SDK・arm64 iOS17 target**のmodule emitは14.395s/exit0、新test typecheckは3.411s/exit0、SDK phase計18.462s。linked ReleaseやiOS上の実行結果ではない。

前段のSDK値は表示文言2箇所の変更前の構成に限る。最終の文言を含むApp17ソースでは、SDK18.2／iOS17ターゲットのmodule生成20.85秒・新6件のtest型検査2.918秒が各exit0、全工程23.775秒で、全18入力を保持した。実UI・実Bundleの検査とは区別する。「オフライン試作」を「オフライン閲覧」、「iOS試作」を「iOS版」へ整理し、機能完成や一般配布済みとは表示しない。

新Modelsを含むCore4+helperをmacOSで再buildし、別Darwin harnessで実6件・一意6名・skip0/failure0を確認した。既存manifestは3,120,173B、SHA `08a15cc89043a6c4610fd3348b5a3c90f7ec786f9bbd49fbb0e4a33f9ddb7831`。host formatterは199記事/掲載625ファイルをpresentとし、固定8行/231B、semantic SHA `9f9c7766dfa6c7929a518ca404fa059d3edcf605102a8ae54ba426f2bb4a3482`を出した。**0.2.26/build28はharnessのliteralであり、実Bundle版を観測していない。** Content再生成やpackage/Swift consumer再監査でもない。

保存された元runner/spec/env/input manifestと全21入力、argv/intent/spawn/exit/raw logの整合を独立に限定照合し、P1/P2は0件。SDK90s/Host60s等の設定と観測を分け、実行真正性・全filesystemアクセス隔離・普遍的cleanupを保証しない。preferencesは空だったがcompiler実行後のTMP2項目とbuild成果物は保持される。

## 自用手順と残件

[iosの版確認と障害対応](../../../ios/README.md#自分用の版確認と障害対応)へ、採用commit・App版/build・同梱/保存content識別と検証範囲を対応付ける表を準備する。操作主体は本人。App上書き、明示同梱切替、読書JSON復元は別の操作で、アプリ削除やdowngradeで互換性を保証しない。参照保持ledgerも容量整理/GCを安全にする根拠ではなく、手動folder削除を勧めない。

旧0.2.23候補で確認したprofile期限2026-10-31 14:32 JSTは履歴であり、新候補の署名build・profile更新/延長を実施した結果ではない。新課金、Program契約、外部配布、公開support、automationの方針を追加しない。

最終parentへのSource4/9パス結合後の共通検査・必要CI・通常main統合、予定単体264件/Native7件/Full26件、実About copy・VoiceOver・新署名build・実機上書き保持・実Files provider・期限前後の操作は未確認。IOS-27の申告/policyとIOS-28の手動/運用受入も残る。旧13/32は方針採択時点の履歴へ明示し、現況は[完成版TODO](../../plans/engineering/ios-app-completion.md)で追跡する。

## 公開配置検査に合わせた人工testデータの修正

初回共通はNode1206件中1191成功・15skip・失敗0だったが、後続の配置検査が人工パス2件をユーザープロファイル形式と判定し、全体はexit1となった。人工データを別の機微なパス形式へ変え、6ケースのassertionとproductionのApp17全バイトを保つ。旧SDKのtest型検査と旧Host6成功は変更前のtestに限り、修正後の型検査・Host6と新9パスの共通検査を別に確認する。初回の失敗票を成功へ置き換えない。

修正後のtestは別の120秒枠で新しくbuildし、実Host6件・一意6件・skip0/fail0を確認した。Host test build59.607秒・runtime0.967秒、iPhoneOS18.2／iOS17の新test型検査12.721秒が各exit0、全phase73.395秒だった。productionのApp17 moduleとHost Core4＋helper moduleは入力SHAと保存成果物を照合して再利用し、再buildしていない。runtime specの一意入力54本と、独立レビューで確認した70項目は別集計である。先行の生成cache lock linkによるmonitor停止は旧票へ残し、生成領域のleaf linkをfollowしない計上と、例外時の自分のprocess groupの終了記録だけを直した。120秒・2MiBログ・300MiB生成物・700MiB空き容量の設定を保持し、sample最小空き1,901,502,464B・最大owned195,504,374Bを観測した。全filesystemアクセス隔離・硬いpeak制御や、実App・iOS UI成功の証明ではない。
