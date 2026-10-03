# アラインメント図解 PR #63 の公開証拠

[独立公開レビュー](final-review.json)は2026-09-30T11:18:33.154Zにapproved・must 0。初回の機械検査と限定再実行を区別した合成受入であり、失敗した原本を書き換えない。公開受入の対象は同じ入力版の9記事。P1全15記事の完了ではない。

| 実行 | 成功/実行 | 原status | 保存先 |
| --- | --- | --- | --- |
| Edge 初回107件 | 107/107 | passed | [原本](raw/full-edge/result.json.gz) |
| WebKit 初回107件 | 106/107 | failed | [原本](raw/full-webkit/result.json.gz) |
| WebKit 限定再実行2件 | 2/2 | passed | [原本](raw/focused-webkit/result.json.gz) |

実視認は[台帳](viewed-images.json)の137枚（重複なし）。生成画像総数、既存承認からの限定継承、今回の実視認を区別する。原本内の旧絶対パス・failed・pendingは保持し、[索引](index.json)で相対保存先へ対応付ける。初回の操作待ちtimeoutの具体原因を、再実行の成功だけで確定しない。

実mergeは`b6686c92dbb678ea8b94eb12df37a33207c4c84b`、main runは`36702086701`、Pages artifactは`11090349965`、BUILD_IDは`Iytr-Mx-iwwzxrZ8pUUHR`。9 HTMLのartifact同一性とactual mergeの入力照合を含む。巨大tarは保存せず、tar hash・member一覧・9原本HTMLと取得手順を保持する。

[最終提出原本](../alignment-submission-evidence/README.md)、[ローカル補足](../alignment-dependency-evidence/final-review.json)、[制作・公開記録](../alignment-reading-diagrams.md)、[公開検証kit](https://github.com/pero3dev/ai-agent-library/blob/b321a0bf94aa2db6d19d6e1ceffb2f0a2cc46d2b/scripts/diagram-release/README.md)へ接続する。保存helperは当時の保存作業専用で、新PCの再実行入口は公開kit。WebKitや画面幅の確認を物理iPhone Safariの受入と扱わない。
