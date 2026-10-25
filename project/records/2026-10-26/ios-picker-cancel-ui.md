# フォルダー選択取消のUI回帰

## 目的と範囲

IOS-25のfileImporter取消後に検索・学習タグ・件数、補助画面の再操作、再起動後のしおりと読書位置を公開UIで検査する。ユーザーの自律TODO作業と実機未確認記録の許可を継承し、UI source・記録・案内の固有6パスだけを扱う。実際に新269修正版 `3dbdfe4512de9948074fcb74151f2422818bf214`（tree `29566669e346ada6748277b45bd5984202ef3aef`）を全体基線とし、第1親は既存PR #270 `fd26f2c87ea2cbaffe9554610fbf535c31d57121`、第2親は新269修正版とする。

新269のPBX0.2.15(17)、NativeReaderView、NativeInlineTests、runtime26記録を含む非対象全blob/modeを保持する。README・計画はFDのpicker追記範囲だけを適用し、古い全文で基線を置き換えない。新headは未作成であり、実在しないSHAを記録しない。

## 初回Hostedと切り分け

旧source `c770fdc3…` / head fd26の[初回Hosted](https://github.com/pero3dev/ai-agent-library/actions/runs/40218125409)（job `121243610854`）はXcode16.4/16F6、iPhone16/iOS18.5でunit129登録・127成功・2skip、機能UI15登録・13成功・2失敗、Releaseはskipだった。

- 本文検索Aはline565の最初の完全表示段落というpollで失敗した。画像には検索語を含む目的段落があるが、最後のtarget/nav frameとvisible先頭IDは未記録。製品alignmentと列挙/AX観測の影響は未確定で、predicate・assert・timeoutは変更しない。
- Picker Bはline646の新bar識別で失敗した。実画像・AXでは前面system bar `FullDocumentManagerViewControllerNavigationBar`（0,69,393,108）と配下のキャンセルButton（8,75,90.7,44）が存在し、背景の検索Cancelも残っていた。旧helperの拒否guardは未記録のため根因を断定しない。取消・往復後のassertには到達しておらず、保存やエラー復帰の成功へ読み替えない。

## v2の変更と限定検証

現在のUI source SHA-256は `9d503be661abc1b295951acc66cf03204ccec1be0a84f9c3a5606d85b18a0c70`。変更はrequireNewFolderPickerだけで、実観測したsystem IDのqueryが一意と分かってから束縛する。baseline不在とgeometryを検査し、配下で唯一の可視・enabled・hittableなCancelだけを使う。失敗時には既存の画像/階層へreject理由を加える。global Cancel・座標・firstMatch fallback、alert自動dismissは加えない。

元14件のsource、NativeHelper1296、追加picker caseの往復・保存・再起動・no-alert・assert・timeout・gestureは保持した。独立sourceレビューは必須修正なしで、探索用Draftと正確な最終Hosted検証に限定して承認された。source上はPublished13＋Native2＝15、performance1は別である。

同じv2とNativeHelper1296の2ファイルだけをXcode16.2/SDK18.2、arm64-ios17.0-simulator、Swift5/targeted/DEBUG/XCTestで1回型検査し、6.751秒・exit0で成功した。Appmodule、全target build、実登録、UI実行ではない。availability bypassは使わず、私有cacheと自分の排他lockを除去した。旧14件や過去の実行・型検査を新combined sourceの受入へ読み替えない。各proof/reviewのpathとSHAは同名JSONに保存した。

## 残件と公開条件

v2のlive binding・取消callback・no-alertと全往復の実UI、本文検索A565、新269本文修正版のruntimeは未観測である。新269 Appとv2を合わせた正確な最終sourceのHosted compile・登録15・実UI15件と必要チェック、最終payload独立レビューまでDraftを維持する。前提のmain統合後も固有6パスを保持して同期する。

フォルダー/provider選択やimport、raw保存bytes/catalog SHA同一性をこの公開UIで証明するものではない。実機・VoiceOver・最大文字とIOS-25全体は未完了。今回のpayload準備ではSDK/実UI/Simulator/shared source/ref/remote操作を行わない。
