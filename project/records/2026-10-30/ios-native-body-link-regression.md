# 本文リンクと健全な旧読書記録のUI回帰

作成日: 2026-10-30。状態: **追加3ケースの提出候補**。先行の参照管理を通常統合した実parentは `467902e4301ecc7a3aa4918ef9fbc87eb0841fe3`。本文リンク案の静的基準はmain `cb66343ddc18f28f780b8f240c07910839e7cc6a`、健全な旧記録案はmain `1c7e10cb1bff81bcc5251a58c820e3de3a7ed6a7`。Source4の元mode/blobが実parentと一致することを確認した。新しい実UI・Hostedの成功は未確認で、IOS-25未完了・TODO14/32を維持する。

## 目的と作業契約

専用記事の本文リンクと、健全な旧`heading`／`fraction`記録からの復帰を、公開UIで検査する。所有範囲は`PublishedReaderUITests.swift`、`AILibraryApp.swift`、`NativeReaderUITests.swift`、`.github/workflows/ios-published-candidate.yml`のSource4、この記録と同名JSON、`project/README.md`、[完成版TODO](../../plans/engineering/ios-app-completion.md)の計8パスとする。[共通契約](../../../AGENTS.md)と[運用文書の規約](../../../harness/writing-rules.md#調査記録と運用文書)に従う。

ユーザーによる残りTODOの自律実施、小単位のcommit・通常PR/main統合の依頼を許可根拠とする。実機確認は未完了と記録してスキップできる。先行単位の実mainへ所有差分を採用し、別PRで共通検査・独立レビュー・実Hostedを確認する。

## 追加する3ケース

同記事リンクのケースは、fragment、同じファイル名付きfragment、遠い末尾、二つ目の同名見出しへの本文リンクを押し、到着先の見出しと固有本文が表示されるか確認する。各リンクを押す前に目次で元位置へ戻すが、tap後の到着判定まで目次やスクロールで補正しない。

別記事リンクのケースは、初期検索と目次移動の後、1回の実測dragで元位置を決める。本文からTransformerの自己注意へ進み、通常のBack後に元段落が表示され、Y差が保存した段落高さ以内で、しおりも残るか確認する。古い検索や目次の到着先へ戻る誤動作も検出対象にする。

健全な旧記録のケースは、新UUIDの専用suiteへTransformerのしおり、見出しA「自己注意の数式」、`fraction: 0`、最後の記事IDだけを用意する。nativeの`blockID`や`anchor`は含めない。公開の「続きを読む」の最初の到着がAで、しおりもあることを確認する。次に通常の目次でB「FFN と残差ストリーム」へ移り、一覧へ戻って保存をflushする。アプリを終了し、旧記録のseed要求を外した同じsuiteへ再起動して、「続きを読む」の最初の到着がBで、しおりが残るか確認する。両方の「続きを読む」の後に検索・目次・gestureで到着を補正しない。

旧記録のseedは既存のDEBUG分岐だけに追加する。suiteのprefix・長さ、正規UUID、空のpersistent domain、正確なhealthy mode、recovery要求の不在をすべて満たす場合だけ固定JSONを保存する。未知mode・無効UUID・既存domain・recovery要求ではこのseedを書かない。既存`partial-v1`と、DEBUG分岐を除いたRelease側のAppソースは元バイトを保持する。これは静的確認であり、App初期化の実行matrixやReleaseバイナリの受入ではない。

## 保持する契約と検証

既存Nativeの2ケース、Publishedの15ケース、geometryの6ケースと全helperを保ち、FullをNative3＋Published17＋geometry6の**26件**へ増やす。既存のNative workflowはclass選択を保ち、Native3＋Recovery4の予定7件になる。Fullの3selectors、assert、失敗・再試行の扱い、全時間・容量上限、job50分、独立374Bコピーとpbpaste照合経路は保持する。workflowの追加は3識別子と23→26件のassertだけである。

| 対象 | 確認した範囲 |
| --- | --- |
| 本文リンク2ケース | source契約、既存パーサーによる5つの1リンク段落と到着先、YAML・inline Node3本の構文、Swift構文を確認。Node16.17.0／Swift6.0.3による静的確認で、CI成功ではない |
| 健全な旧記録1ケース | exactなlegacy key、DEBUG guard、Release側ソース同値、既存ケース・helperの逆適用一致、Full26識別子を静的照合した |
| Native単独SDK | SDK18.2／iOS17ターゲットの型検査。初回版はexit0・6.450秒。再起動後のqueryを新たに構築した最終版もexit0・1.121秒で、App＋NativeのSwift構文解析はexit0・0.110秒。App moduleやUIの実行成功とは分ける |
| Published SDK | 以前の型検査は60秒上限、60.043秒で診断なしtimeout。成功は未確認として保持し、再実行していない。最終Source4を合わせたSDK受入には使わない |
| 独立静的レビュー | 本文リンクSource2と、健全な旧記録Source3を別にレビューし、それぞれP1/P2指摘0。最終8パスのレビューと実行受入は後続 |

このDEBUG/UI単位ではPBX・版番号を変更せず、先行parentの値を保持する。実parentが採用したApp0.2.25（27）を引き継ぐ。

## 判定の限界と次の境界

同名見出しは末尾に近く、下端clampにより誤った最初のanchorでも同じviewportになる場合がある。UIで二つ目の見出しとDUPLICATE-SECONDが見えても、正しいanchor選択を一意に保証しない。二つ目のtargetは既存パーサーの静的結果で別に照合する。

A／Bの正の到着判定は見出しの厳密な完全表示を要求する。反対の見出しの負判定はunknownを失敗とし、同時の完全表示を除外するが、部分的な交差が一切ないことまでは示さない。両見出しは本文の別位置にあることを静的に確認しただけで、実viewportでの分離は新UIの実行で確認する。`fraction: 0`は見出し優先と記事先頭へのfallbackを区別するための値で、旧fraction全体の数値精度を検証しない。

Rootは先行単位の実mainへSource4を結合し、記録・索引を含む8パスを1つの小commit／PRとして確認する。最終内容の独立レビュー、共通検査、App全体のmodule確認、必要CI、Hostedの新Full26とNative7、実copy374B・Releaseの確認を経て、保護されたmainへ通常統合する。以前のFull23や準備案の25件を新26件の成功へ転用しない。新しいNodeのsource同値検査は追加しない。

現時点ではApp全体のmodule、最終8パスの共通検査・レビュー・実UI／Hosted・通常main統合は未完了である。実機、VoiceOver、実機の機内モードからの起動、最低OSの受入も未完了として残し、ユーザーの許可に従いスキップできる。既存fixture、通常利用の読書記録、公開配布条件を変更せず、IOS-25全体や他のTODOを完了扱いにしない。
