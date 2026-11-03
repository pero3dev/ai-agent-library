# 自用の読書位置・復旧機能の受入

2026-11-04 JST。自用初版の「実装と主要な自動確認」を対象としてIOS-11・IOS-18を完了とする。[PR #331](https://github.com/pero3dev/ai-agent-library/pull/331)を通常保護squashした実main [0885ae0](https://github.com/pero3dev/ai-agent-library/commit/0885ae04f11445874738a0cc769bdf86e6d57355)、App0.2.30（32）へ結合し、TODOを14/32から16/32へ更新する。実機受入や全障害経路の網羅を完了した判定ではない。

## 受入範囲

| 条項 | 実装と確認した範囲 | 残る確認 |
| --- | --- | --- |
| IOS-11 読書位置の移行・復帰 | revision・block ID・semantic anchorと有限なblock内位置を保存し、旧heading＋fractionのfallbackとしおりを保つ。単体検査、旧heading・しおり・終了再起動のUI、文字サイズ・回転・有効な記事改訂の専用UIが成功した。 | 専用3ケースは制御した記事と操作の検査。全記事の全改訂、OS設定の自然な変更、実機・VoiceOverへ一般化しない。 |
| IOS-18 読み込み・描画失敗の復旧 | 未対応・破損入力を拒否し、説明・再試行・一覧へ戻る操作、最後の正常snapshot、previous版の再検証とbundle fallbackを提供する。単体検査と欠損bundleの失敗画面、正常版再インストール後の本文UIを確認した。 | 失敗と復旧は別stage。全error画面、同一process内で修復した後の成功UI、全学習記録・電断耐性の保証ではない。 |

読書位置と復旧の実装はmainへ反映され、対象の主要な自動確認も揃ったため、この2条項の実装受入を採択する。実機と追加回帰はIOS-23・IOS-25へ残し、未実施の範囲を成功として補わない。

## 確認した実行

採択元はSource [cd22b07](https://github.com/pero3dev/ai-agent-library/commit/cd22b07cf0b1637567fff8d5de5dc0e831f7c53f)。関連9workflow・必須11検査とReady後のpolicy2件が成功し、実mainのtree・3033ファイル・正規commit文面を照合した。mainへのpush後の別CIでは、Full BがSimulator準備で停止し、UI・Debug・Releaseは未実施だった。他のmainpush検査もこの記録の作成時点では未完了で、PRの成功を代入しない。準備失敗のOS原因や実timeout回数は未確定である。

- [Native](https://github.com/pero3dev/ai-agent-library/actions/runs/41702593895): 単体297件中295成功・既知2skip、容量集計10件はその内数。通常UI8件が成功した。
- [全記事](https://github.com/pero3dev/ai-agent-library/actions/runs/41702593878): 前半18件と後半8件は重複しない計26件。374バイトのコードコピー検証とReleaseの199記事・manifest以外625ファイルの監査が成功した。Native UI8とFull26は別実行として扱う。
- [文字サイズ](https://github.com/pero3dev/ai-agent-library/actions/runs/41702594030)、[回転](https://github.com/pero3dev/ai-agent-library/actions/runs/41702593866)、[記事改訂](https://github.com/pero3dev/ai-agent-library/actions/runs/41702593861): 実child JSONで各1件Passedと、同じ所有Simulatorのcleanupを照合した。文字サイズはapp-local再起動の3 phase、改訂は正常A→Bとlive縦横・再起動の5 phaseを確認した。回転は独立geometry JSONを出力しないため、実caseとsourceのassert経路までの判定とする。
- [欠損と正常版への復旧](https://github.com/pero3dev/ai-agent-library/actions/runs/41702593867): F1件・R1件の実childがPassed。同じ所有Simulatorで52バイトの検証用Documentsファイルが残ることを確認した。実しおり・全学習記録の保持とは区別する。
- [SDK26 Archive](https://github.com/pero3dev/ai-agent-library/actions/runs/41702593884)と[iOS26画面3件](https://github.com/pero3dev/ai-agent-library/actions/runs/41702593921)も成功した。署名なしArchiveは配布・実機確認の証拠ではない。

readerの実leaf・phaseと復旧artifactは独立したデータレビューでP1/P2=0。取得元・SHA-256・限定した判定範囲は同名JSONにまとめる。過去の候補・未受領時点の記録は履歴として保持する。

## 残件と次の節目

IOS-23のApp30実機・VoiceOver・小型端末・最低/現行OS、自然な最大文字やlive設定変更、署名更新後の保持、音声の着信・provider等は未完了としてスキップする。IOS-25では個別のfailure画面、同一process内修復後の成功UI、追加の操作網羅を残す。実ENOSPC・部分書込・電源断や全学習記録の保持は保証しない。旧版での本人確認をApp30の実機受入へ転用しない。

性能・容量のIOS-15、音声の権利確認とカタログ対応、容量表示に続く旧版・staging整理のIOS-21等は別単位で進める。今回の4ファイルは記録2・索引・計画だけで、製品・PBX・App版や他の30条項の状態・全完了条件を保つ。

この文書単位は1つのdocs commitとPRへまとめ、新しい共通検査・独立レビュー・必須CI・Ready後の検査を経て通常mainへ反映する。PR331の採用証明と、このDoc単位の新commit/CI/main、実機受入をそれぞれ別に追跡する。
