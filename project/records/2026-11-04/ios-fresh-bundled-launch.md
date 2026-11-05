# 保存版なしの同梱起動を確認する回帰候補

2026-11-04の候補作成時点の記録。自用初版のIOS-25を対象に、既存データを消さず、空の専用保存先から同梱記事を開く経路を確認する。App候補は0.2.33（35）。実PR headと通常mainへの反映は未完了である。

## 動作と確認対象

[起動処理](../../../ios/AILibrary/Sources/AILibraryApp.swift)のDEBUG限定要求では、canonical UUID・initial/resume・同じ読書suiteを必須にする。不正な要求やsuite取得失敗で通常データへ進まない。開始前の保存先不存在と読書domain、読込後の実snapshotの同梱選択と保存先不存在を捕捉する。AXの値は捕捉済みJSONだけで、読み上げ用getter内ではファイルを読まない。

[全記事UI](../../../ios/AILibraryUITests/PublishedReaderUITests.swift)の新1件は、同じUUIDで起動・再起動し、全記事数、検索、本文、しおり、近い見出しへの復帰と公開容量画面の不存在表示を確認する。Coreの追加6件は不正入力・nil preferences・既存データやsymlinkの保持・誤ったsnapshot等を扱う。予定件数はCore326（成功324・既知skip2）、Full28（A20/B8）、Native UI8で、旧ケースを保持する。

[Release監査](../../../ios/tests/check-release-package.mts)は主実行画像とtop-level dylibを対象に、新しい試験用文字列8個を探す。最大16画像・各64MiB・合計128MiBに収め、固定FDを64KiBずつ読み、各画像に最大1byteのEOF確認を加える。画像の前後identityとchunk境界を検査する。内容の整合検査は維持し、Mach-O全般や全DEBUG動作の不存在を保証する検査には広げない。

## 検証状態と次の節目

Code6とRelease監査R2の独立静的レビューはP1/P2とも0件。R1で指摘された無上限readFileを固定FDの上限付き読取へ直した。作成時点でNode64、Swift構文・型、SDK、実UI、実Releaseバイナリと新headのCIは未実施である。静的レビューを実行成功へ読み替えない。

実装8path＋PBXと、記録4pathを2コミットへ分ける。仮親ee408はMemory PR #352の結合候補であり、通常mainの実raw OID・tree・全3289tupleを照合してから親を結び直す。新headで必要な検査と独立した全体レビューを終え、通常PR経由でmainへ反映する。

真のOS通信オフ、新規インストール、実機・VoiceOverは未確認として残す。[完成版TODO](../../plans/engineering/ios-app-completion.md)は32行16完了と全完了条件を保ち、IOS-25全体を完了にしない。

## Nodeコンポーネント検査の追補

候補作成後、同じ入力のNode2targetを固定Node24で1回実行し、64件中63成功・既知skip1、失敗0を確認した。入力・IRの前後保持、exit0と専用PGの回収・不在を確認している。コマンドは全てstub、Releaseは一時fixtureの検査であり、Swift・Core326・UI28・実Release画像や新head CIの成功ではない。

## 2026-11-06の取得済みmainへの再結合準備

11月4日の本文とNode追補は、その時点の履歴として保持する。取得済みmain0e018をMemory PR #352のee408へ通常同期する私有候補tree d49aa731に、凍結済み実装8pathとPBXの4scalarをbyte保持で重ねた。Memory8の全文、索引の既存行、TODO計画の既存prefixと全32行16完了・全criteria、およびmainから入る9pathを保持する。既存の13path／新規2pathとApp候補0.2.33（35）、Core326／Full28（A20/B8）／Native8の計画を変えない。

このtreeは将来親の構成候補であり、通常Memory mainの実commit、fresh候補head、公開操作はいずれも未成立である。実Memory mainのraw OID・tree・全ファイルtupleをRootが照合して親を結び直すまで、提出済み・merge済みとは扱わない。取得済みmainや過去headのCI状態を新候補の成功へ引き継がない。

Node64は11月4日に同じ2targetで得た63成功・既知skip1・失敗0のcomponent結果だけを保持し、今回は再実行していない。新構成の完全な共通検査・4形式検査・最終全体独立レビュー・新head CI、Swift／SDK／Core326／UI28／Native8と実Release監査は未実施である。OS通信オフ・新規インストール・実機・VoiceOverとIOS-25全体は未完了のまま残す。必要な実検証と通常PR・main受入はRootが後続する。

## 最終文書範囲へのNode事前確認の追加

2026-11-06、凍結Source13に加え、既存のNode要件・標準版への参照と依存準備前の実行ファイル／版確認を[開発手順](../../../ios/README.md)の準備節へ追加する。既に独立レビュー済みの1pathを同じ文書commitにまとめ、文書だけの別PRと別のiOS CIサイクルを増やさず、新headの必要なCIでまとめて確認する選択である。最終候補はCode9＋Docs5の14path／新規2pathで、実装・PBX4scalar・App0.2.33（35）・予定件数は変えない。project索引とTODO計画はSource13の全文をそのまま保つ。

Node要件の追記の旧レビューはP1/P2=0で、Markdownと相対2linkの確認は過去の文書scopeに限る。ここではNode・npmや例示コマンドを実行していない。作成時点ではCode9／Source13の共通検査が進行中であり、最終14pathの共通検査や新head CIの成功には数えない。最終文書へのMarkdown・link・形式の追加検査、実通常Memory mainとの結合、新head全体CIと残るiOS受入はRootの後続作業とする。TODO32行16完了・全criteriaを維持し、IOS-25・IOS-28全体、実機等は未完了のまま残す。

## Rootによる最終結合と検証範囲の確認

2026-11-06、通常のMemory PR #352のmain反映後、実main `acf82a3c456e7c060bc4b009d6f50424a717792e` のraw commit OID・単一parent `0e0181b90a7fdc6863c2a0aa9b252d60b59ec0e0`・tree `d49aa7317db9c72d43bc737cedf46f03ad605214`・全3290tupleと通常messageを照合して親を結び直した。前段のprivate候補・未実施fieldsは各作成時点の履歴として保持する。最終候補はCode9＋Docs5の14path／新規2pathで、実装9path、ios/README、project索引とTODO計画の内容は直前のSource14と同じである。

同じCode9を含むSource13 tree `c62855c72ae01878bc69f684191dbecec906026f` の共通検査は1670件中1654成功・16skip・失敗0で終端した（log SHA256 `925a9a12a1b7731e28c5d4ae0ebd3264ee15f6d995f217e0277adb92dcde3c4e`）。その後のSource14はMarkdown4文書と新規相対link3件を追加確認した。これらを最終14pathの完全な共通再検査としては報告しない。今回の追記後のMarkdown・link・形式と差分独立レビューはRootが後続する。

同じCode9の実iOS18.2 SDKでApp19fileのmodule生成、Core326／UI41method分の型検査は成功した（result SHA256 `0b517088cdce2992a083f41b46297f1fd979caf4edb72220a22d72da6b262543`）。これはtarget build・link・XCTest実行・resource／実Release監査の成功ではなく、先行xcodebuildの宛先不足exit70を成功へ変更しない。新head全体CI、Core326／Full28（A20/B8）／Native8の実行、実Releaseと実機・VoiceOver・OS通信オフ・新規installは未受入である。TODO32行16完了と全criteria、IOS-25／IOS-28全体の未完了を維持する。
