# D1 実装前インターフェース案の独立レビュー

判定: **approved / low（must 0、should 0）**。承認済み D1 計画を具体化する提案として妥当です。製品実装、本文訂正の適用、画面・操作・公開受入を承認する判定ではありません。

- reviewer_run_id: `01a0ced7-e41c-70c1-904e-2ae30ff2fa4b:/root/inference_doc_review`
- reviewed_at: `2026-09-29T17:51:55Z`
- MD: `alignment-d1-interface-proposal-20260930.md`
- MD SHA256: `3498b1b6a2b1797410e0490026da0fb1272458b8e519f7bac252f52a3c8d1b6c`
- JSON: `alignment-d1-interface-proposal-20260930.json`
- JSON SHA256: `019400d5862560f50f361474971a62a5f7f51a5b2926b95a2a29b9bddfc3f632`
- 照合した repository commit: `ca3c09eebd1b549564f874f3304d23ae25328194`
- 承認済み計画 SHA256: `1cef526de4f41aebe195360c50c526386d199f0cd511dc477911223a4a4a7319`

## 指摘表

| 対象 | 行・箇所 | must | should | 判定 |
| --- | --- | --- | --- | --- |
| 提案 MD | 3–68行 | 0 | 0 | 問題なし |
| 提案 JSON | adopted / proposed / common / dispatcher / controlMigration / reviewSeparation | 0 | 0 | 問題なし |

## 計画保持の独立検算

固定 commit の計画を git show で取得し、生バイト SHA256 を再計算しました。提案 JSON の各 adopted と承認計画 D1 の各 diagram オブジェクトを、独自の Node スクリプトで全フィールド deepEqual 比較し、3図とも完全一致しました。作者の authorValidation は独立証拠に用いていません。

| 図 | READ | manual only | 包装 H3 | body blocks |
| --- | --- | --- | --- | --- |
| alignment-preference | 7 | 0 | 3 | 14 |
| alignment-reward-risk | 3 | 0 | 1 | 3 |
| alignment-feedback | 5 | 0 | 2 | 6 |
| 合計 | 15 | 0 | 6 | 23 |

state / motion / checks、sourceHeadings、blockGroups、readingStages と全採択フィールドが保持されています。現行記事の SHA256 は `6bb4501e5fcd44323a0890d20286cc6e597ab042997df47d2cf9fa2ddabd480b`。4つの表示数式と1つの Mermaid を確認しました。sourceInventory の5ファイルはそれぞれ生バイト hash とサイズが一致しました。

提案は2操作・5選択肢に限定されています。β は S4–S6、既定1、0.5/1/2のみ。人手/AI は feedback S4、既定 human のみです。他段階の意味を変えない実効値、初期表示の両ラベル、未操作 READ での全注意点の可視契約があり、手動操作に重要点を閉じ込める変更はありません。Scene / frame / STAGES の名前、3固定 lazy map、原文 fallback、可視 hooks は採択済み構造を具体化する範囲です。

## 数式と固定値の独立検算

製品 model や作者の検算処理を import せず、確率から直接 odds を `(pw × ql / (pl × qw))^β = 4^β` と計算し、`m=ln(odds)`、`p=odds/(1+odds)`、`ell=ln(1+1/odds)` を JSON の各数値と tolerance 1e-12 で比較しました。全3行が一致しました。

| β | m | p | 1ペアの ell |
| --- | --- | --- | --- |
| 0.5 | 0.6931471805599453 | 0.6666666666666666 | 0.4054651081081644 |
| 1 | 1.3862943611198906 | 0.8 | 0.22314355131420976 |
| 2 | 2.772588722239781 | 0.9411764705882353 | 0.06062462181643484 |

明示的報酬の ln3 と0からの Bradley–Terry 確率は3/4です。後段の暗黙報酬とは別の説明例であることも明記されています。条件付き応答全体の確率、勝ち/負け、固定した参照方策が一貫しています。

same-x の2項に共通の β log Z(x) を置き、差で消す符号は正しいです。異なる x を拒否する提案と、共有する方策・参照文脈の契約は相殺の適用範囲を保ちます。Z の値は未設定で構いません。残りの応答質量だけでは元の full-response KL を決められないため、期待報酬・KL・RLHF目的値を null に保つ判断は適切です。集約3セルの KL を full-response KL と表示しません。

数値表示が1ペアの損失 ell であることと、記事 L_DPO がデータ上の期待値/経験平均であることは区別されています。固定確率下で損失が減る例を、学習による品質・安全性・更新量の予測としていません。補助検算として、同じ固定 log 比の勾配係数 β/(1+4^β) は β=0.5/1/2 で約0.166667/0.2/0.117647となり、単調な更新量保証を置かない判断とも整合しました。この補助数値を製品へ追加する要求ではありません。

## 意味の区別と実現可能性

- proxy / quality: 同一出力から別の評価へ分岐し、quality も真の良さへの直接アクセスではないと明示します。値・万能曲線・転換点を未設定にし、KLと再評価を抑制として扱うため、架空の実測や解決保証は生じません。
- source / granularity: 報酬の出所と結果/過程の粒度を別軸とし、人手のステップ評価から学習する報酬モデルを残しています。全組合せが常に利用可能という表を作らず、過程報酬をRLVRの下位型にしていません。
- feedback: 同じ段階列の最終位置と中間位置を中立的な印で比較し、架空の思考文や正答率を作りません。人手/AIの選択はラベルの出所だけを強調し、タスク・粒度・安全性を切り替えません。
- hooks / 見やすさ: hooks は実際に見える要素へ付ける契約です。未丸め値と可視丸め値の検査を分け、隠した期待値DOMを画面受入の代わりにしていません。2行/2レーンの配置と全文数式を詰め込まない方針は実装可能ですが、実画面は未検証です。

## 一次資料と確認範囲

今回の独立再確認は reviewed_at までに完了しました。

- [Direct Preference Optimization](https://arxiv.org/html/2305.18290): v3、§3–4 の式1・3・5–7と勾配表式。Bradley–Terry、KL罰則、同じxでの共通項相殺、データ全体の期待損失を確認しました。数値表は論文の実測値ではなく、提案の固定分布から reviewer 自身が導出しています。
- [Let's Verify Step by Step](https://arxiv.org/html/2305.20050v1): §2.4–2.6。人手によるステップラベルと、学習済み outcome/process reward model の区別を確認しました。

C2公開受入後に最新mainと共有APIを再読し、担当確定してからD1製品実装へ進む条件を維持します。A1–A3本文訂正と日付・根拠同期、無図対照ページの移行、最終記事・model・画像・ブラウザー・local/public受入は後続です。今回、これらを検証済み・承認済みとは扱っていません。旧kitや過去の証拠の置換も要求しません。P1全15記事の公開受入後に停止し、P2へ進まない境界を保持しています。

repo・記事・kit・Gitへの変更はありません。このレビューMDとJSONだけをTEMPへ保存しました。
