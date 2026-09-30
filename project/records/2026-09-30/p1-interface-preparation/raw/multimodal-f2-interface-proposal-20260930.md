# F2 マルチモーダル図解インターフェース案

状態: 採択済み絵コンテの具体化案。独立レビュー・実装・公開受入は未実施。F1公開受入後にF2を開始し、P1全15記事の公開受入で停止する。リポジトリには変更していない。

本文SHA256 151625bf1c3c744cbb5ed04b4de827e4dea9810e6d45844d6cc54d974da28033、13置換後（日付変更前）27956431766343cd1c4b910ce9d7b703e655365856c3e10484de315684688ced。全置換の一意一致と2図の訂正前後sourceDigestをメモリ上で検証した。数: {"rootNodes":43,"contentH3":9,"contentBodyBlocks":18,"wrappedH3":6,"wrappedBody":14,"displayMath":0,"mermaid":0,"tables":1,"dynamicTopics":27,"staticTopics":15,"stages":9,"readStops":9,"corrections":13}。一次資料の実取得日は既存記録のままであり、今回の新しい取得と主張しない。

## 入力から表現へ

MultimodalRepresentation / multimodalRepresentationFrame / MULTIMODAL_REPRESENTATION_STAGES、5段階すべてREAD、追加操作なし。画像は説明用2×3格子の6IDを列への移動中も保持する。テキスト由来表現とこの構成例の系列へ接続し、音声は別変換経路のまま扱う。格子数・表現数を実エンコーダや課金数へ換算しない。注意の線は模式的関係で、実測重みや架空の出力文を置かない。構成例という限定は最初から保持する。

## 入力の粒度と能力の境界

MultimodalInputTradeoffs / multimodalInputTradeoffsFrame / MULTIMODAL_INPUT_TRADEOFFS_STAGES、4段階すべてREAD。S1の粗い/細かい粒度、S2の画像/関心領域/OCR/構造化だけ操作可。他段階は不変で、操作を精度・価格の改善判定にはしない。4種の細部、原入力の来歴、情報保持と検証の必要性を保つ。入力理解とメディア生成を別能力として示し、特定モデルの対応を発明しない。

## 訂正と検証の境界

M1–M5と8関連同期の計13置換を本文に適用してから2図を有効化する。実適用日、タスク全成果物、最終候補tree/digestの独立記事レビューは制作時に行う。計画JSONのadopted/correctionsは元記録をそのまま収録し、proposedだけを今回の提案とする。

純粋モデル・全4AST組合せ・9READ・全設定・安定ID・音声と画像の分離・未計測値・構成限定、明暗/狭幅/拡大/キーボード/静止/印刷/JS無効を確認し、独立実画像と同CI公開受入まで完了させる。元の本文や数式を図で再複製しない。
