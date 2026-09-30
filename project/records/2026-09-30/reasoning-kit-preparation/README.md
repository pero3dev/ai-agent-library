# D2 公開 kit 計画の準備記録

[採択済み D2 interface](../p1-interface-preparation/raw/reasoning-d2-interface-proposal-20260930.md)と[その独立レビュー](../p1-interface-preparation/raw/reasoning-d2-interface-review-20260930.md)を前提とする。

D2 kit の計画案は 2026-09-30T10:18:42Z に approved / low / must 0 / should 0 と独立承認された。承認範囲は計画の十分性・整合性だけで、実装や検査成功、公開受入の承認ではない。保存時点では D1 公開受入前、D2 の製品・kit は未着手。D1 公開受入と root の開始通知を待って実装へ進む。

## 原本と対応

[索引](index.json)に元の絶対パスから相対保存先への対応と、元 bytes・gzip の SHA256 を記録した。4 原本は文字・状態・hash を変えず gzip 保存し、通常の展開で元 bytes へ戻せる。本 README は閲覧用の要約で、提案・レビュー原文ではない。

| 原本 | 保存先 |
| --- | --- |
| 計画 MD | [gzip](raw/reasoning-d2-kit-plan-20260930.md.gz) |
| 計画 JSON | [gzip](raw/reasoning-d2-kit-plan-20260930.json.gz) |
| 独立計画レビュー MD | [gzip](raw/reasoning-d2-kit-plan-review-20260930.md.gz) |
| 独立計画レビュー JSON | [gzip](raw/reasoning-d2-kit-plan-review-20260930.json.gz) |

提案原本の pending 表示を残し、後続の独立判定へ索引で結合した。表示 marker 2 件（REASONING / SEQUENCE、REASONING / EVALUATION）は、レビュー原本が root の統合選択として妥当と確認している。固定した製品・kit との一致は実装後に検査する。

## 承認した計画

旧 107 ケースと 9 routes を保護し、新規 14 ケースを追加して 121 ケース・10 routes とする。2 図・9 段階・8 READ・手動段階 1、6 profiles の 54 状態、2 controls / 5 options の段階限定と対象外 null、30 設定段階観測を含む。手動段階を操作しなくても READ 2 で必要な意味が残ることを検査する。

意味 oracle は承認済み本文と interface の literal を使い、製品 model を期待値の計算に使わない。中点・逆 seek、native clock、keyboard/modal、noJS/print、原文保持、scene 分離を検査する。生成画像と独立した実視認を区別する。

flat predecessor proof で変更した 4 ファイルの元 bytes と、121 → 107 → 91 → 71 → 58 の名称・順序を復元する。既存 assertion・helper prefix・network 条件を弱めない。ローカル adapter は既定動作を保持する追加オプションと薄い wrapper で共用し、公開 SHA/artifact の偽装や TEMP の実行依存を持ち込まない。

## 保存作業の境界

書込み対象はこの新規ディレクトリのみ。既存 artifact・製品・kit・Git は変更していない。4 原本の hash・gzip 復元、review 対象 hash、採択 interface hash、相対リンクと Markdown を検証して凍結する。

P1 の採択済み 15/199 記事の公開受入後に停止する。P0 部分対応 2 記事を混ぜず、P2 は未着手。今回の記録は D2 の build・browser・CI・Pages・公開試験を実行した証拠ではない。
