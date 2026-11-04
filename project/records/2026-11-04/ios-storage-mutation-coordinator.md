# 保存処理のプロセス内協調を追加する候補

2026-11-04、共通検査前の作成時点を保存する準備記録。IOS-21の非破壊な整理に先行して、同じ保存rootを使う複数の`ContentRepository`へ共通のpermitと処理中のstaging attempt ID登録を加える。Rootが採択したCode3を、長文CI候補の後に続く単位として私有合成する。実親SHAは未結合で、通常mainへの採用を表さない。

## 処理が保持するもの

`install`と明示的な同梱切替は、入力検証前に保存root単位のpermitを取得する。同じrootで別の処理が進行中なら待機せずエラーを返し、完了後の再試行を案内する。同梱切替から内部installへは同じpermitを渡す。別rootは独立して進められる。

rootのキーにはローカルの絶対file URLを検証し、既存symlinkを解決・標準化したpathを使う。辞書のlockは取得・登録・解放の短い区間だけで保持し、ファイル操作や呼出元のclosure中には保持しない。owner UUIDが一致するpermitだけが登録・解放でき、古いpermitは後続の所有者を解除できない。

copy前に作業UUIDを登録し、既存のcopy・検証・rename・pointer書込みと、成功／失敗時に自分の作業領域を片付けるdeferの間もpermitと登録を保持する。closureを抜けてから両方を解放し、失敗・early return・no-opにも同じ解放を適用する。active IDは処理が予約しているIDであり、実ディレクトリの存在確認ではない。

load・preview・lease・validator、既存rollbackとpointer、保存済みgeneration・前版・読書記録の保持方針を保つ。既存のproductionのremove呼出2箇所を増やさず、孤立staging・旧版の整理APIや画面は追加しない。

## 採択済みコードと既存の確認

`ContentRepository.swift`と`LibraryCoreTests.swift`のCode2、修正版`CoreSmoke.swift`の3payloadをbyte保持する。新しいXCTestは9メソッドの定義追加で、旧テストは全byteをprefix保持する。CoreSmokeの最後の再試行だけは、aliasのreceiverから既存のcanonical readerへ変更済みの採択版を使う。aliasでのbusy拒否・登録寿命・別root・ENOSPC rollback・cleanupと残るassertは保持する。

初回のFoundation実行はSIGTRAPで停止した履歴があり、ログから失敗したsiteは確定できていない。alias経由の成功importを要求した箇所を静的な有力候補として切り分けた修正で、製品やvalidatorの原因解消を証明しない。修正版の固定Foundation compile＋合成fixture実行は、計**10.532秒・exit 0、14 PASS**だった。旧失敗を成功で上書きしない。

別の既存iOS SDK検査ではCode2の両ファイルを含むunsigned Debug build-for-testingが**44.381秒・exit 0**で成功し、arm64／x86_64それぞれApp19＋generated1・Unit8・UI6の入力を確認した。これは型検査だけで、CoreSmokeはSDK target外、新9 XCTestも未実行である。Runtime306やSource8の実行成功へ転用しない。識別hashと検証範囲は[JSON](ios-storage-mutation-coordinator.json)に残す。

## 今回の8パスと残件

将来のPerf tree`6b3be98f4edcb13eebc18aa67212a4026422a4a1`の3037ファイルへ、Code3・PBX・記録2件・索引2件を重ねる。PBXは既存のDebug／Releaseで版の2値だけを0.2.30（32）から候補0.2.31（33）へ更新する。新規記録2件を加えた全体は3039ファイルとなる。Doc4／Perfの本文、TODO32行16完了・全criteriaは保持し、IOS-21のcheckboxを変えない。

この記録の作成時点で、新Source8の共通検査・最終独立レビュー・必要CI・通常main・実機は未完了。依存と共通検査1回の計画を用意するだけで、追加のNode・Foundation・SDK・Git・通信・公開を実行しない。

レジストリはprocess終了で失われる。cross-processの排他、inode同一性・すべてのalias・case差・取得後のroot差替えの安全性を保証しない。active IDが空でも削除の許可にはならない。整理の実装にはfreshなfilesystem検査、所有／孤立の証明、上限・中断・部分結果と明示操作の別契約が必要で、IOS-21全体の完了や空き容量の改善は採択しない。
