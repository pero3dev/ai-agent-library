# D2 ローカル受入証拠

2026-09-30T12:28:37.439Z、独立レビューは approved / low / must 0 / should 0。[最終判定](final-review.json)は10記事の入力・HTML・BUILD_ID `ay8Xdd-uRIpIwdWdgy70j` と、コード・実画像・ブラウザー・性能の原本を結び付ける。実GitHub・Pages・公開受入は未完了で、この判定には含まない。

[索引](index.json)に229原本（gzip 107件、実視認PNG 122件）、保存サイズ11,222,557 bytesを記録した。索引自身のSHA256は `46fffbc5ebce78ac777024f9d5f8b981480e1997e3d61b66802de105a467aeb6`。元の絶対パス、原本と保存bytesのSHA256、相対保存先、gzip復元一致を保持する。通常のgzip展開で元bytesに戻せる。新PCでは `storedPath` をこのディレクトリから解決し、旧PCの絶対パスを実行先にしない。

## 確認した範囲

| 種類 | 結果 | 境界 |
| --- | --- | --- |
| サイト単体・build | 419件成功、223 routes・230 HTML | ローカルの静的生成 |
| root check | 489成功・既存音声1 skip | その後のproof負例追加はkitの最終35件で確認。提出前の最終全体検査は制作記録へ追記 |
| kit単体・準備 | 最終35件成功、121ケース・10 routes | 旧107ケースと本文を復元。オフライン準備は公開実行ではない |
| 最終Edge全体 | 347成功・既存音声5 skip | D2全14ケースを含む |
| 最終WebKit | D2全14件成功 | 実機Safariではない |
| 配信失敗の追加検査 | Edge・WebKit各2件成功 | 全体実行とは別。実chunk遮断時の本文保持 |
| 実視認 | 初期83枚と最終39枚、計122枚 | 初期83枚中1枚は既知failed printケースの診断画像 |
| 性能 | CLS 0、操作14.2 / 10.1 ms、停止・実画面外でrAF増分0 | Edge・1440×1000・DSF 1・loopback・throttlingなしの局所測定 |

[実視認台帳](viewed-images.json)には画像とsource resultの原SHA256がある。索引の同じ `originalAbsolutePath` から保存PNG/rawへ辿る。初期画像と最終候補、生成数と実視認数、viewportと全sceneを混同しない。DSF 2は実ブラウザー200%ズームの受入ではない。

## 保持した失敗と限界

初回EdgeのTODO引用の既存aside装飾、2回目のSVG水平線のbbox、3回目のprint時に非表示となるselectorに関する検査失敗を原本のまま保存した。後続成功に書き換えていない。kit独立レビューの初回must 3 / should 1と、対応後のapprovedも別原本である。可視意味の確認、print条件、proofとの連動改変拒否、追加ケースの連続性を修正した。

性能原本の非critical fetch中断38件は保持し、原因を断定しない。native rAFの観測間隔はGPU frame timeではない。測定用callbackを除くアプリrAFの要求・実行・pendingを、一時停止と実スクロール後の500 ms以上の区間で確認した。全端末・実スクリーンリーダー・物理印刷・本人の学習効果は未検証。

旧9記事はPR63の公開証拠、旧27登録と9割当の一致、132入力中共有5ファイル以外のraw bytes不変、共有追加レビュー、現行Edge全体回帰による限定継承である。今回のローカルレビューで旧9記事の全画像を新たに視認したとは扱わず、公開版の全121ケースと独立画像は次工程で確認する。

raw内のhelperは当時の実行内容を保存したもので、TEMP・旧PC絶対pathを含む。別PCで再実行する入口は[現行公開kit](https://github.com/pero3dev/ai-agent-library/blob/b321a0bf94aa2db6d19d6e1ceffb2f0a2cc46d2b/scripts/diagram-release/README.md)を使う。[制作記録](../reasoning-reading-diagrams.md)と[引き継ぎ](../../2026-09-24/dynamic-diagram-handoff.md)を併読する。
