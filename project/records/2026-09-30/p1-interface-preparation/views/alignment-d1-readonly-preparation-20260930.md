# D1 読み取り準備（2026-09-30）

作成者 /root/pretraining_numeric。C2 公開受入前の準備に限定し、製品・本文・Git は変更していません。承認済み計画 JSON `project/records/2026-09-24/p1-remaining-storyboards.json`（SHA256 `1cef526de4f41aebe195360c50c526386d199f0cd511dc477911223a4a4a7319`）と plan-only approved/low レビューに基づきます。JSON 内の historical status は移管時の原文保持です。全 P1 15 記事公開受入後に停止し、P2 は開始しません。

## 3 図・15 段階の契約

| ID | 段階 | 包装本文 block | 全段階 READ |
| --- | --- | --- | --- |
| alignment-preference | 7 | 14 | 0 全体 → 1 選好ペア → 2 報酬差 → 3 報酬とKL → 4 正則化 → 5 暗黙の報酬 → 6 DPO損失 |
| alignment-reward-risk | 3 | 3 | 0 代理と目的 → 1 過剰最適化 → 2 正則化と再評価 |
| alignment-feedback | 5 | 6 | 0 検証器 → 1 結果と過程 → 2 適用範囲 → 3 調整の副作用 → 4 フィードバックの作り方 |

9 H3 / 42 原子論点（動的27・静的15）、6 H3 / 23 body blocks を連続範囲で包装します。4 数式と元 Mermaid は AST を保持し、list/table/math を分割しません。図固有の所有 12 ファイル、全 stage の state/motion/checks、headings/sourceHeadings/blockGroups/blockTypes、前後 digest、全論点対応は JSON に原計画の情報を抽出しています。今回の AST 読取でも count/types/digest を全件再計算して一致しました。

- preference: 固定した x・勝ち/負け ID を RLHF 2 段と DPO 直接学習で追う。同じ x の Z だけを相殺。beta 操作から実更新量・安全性の単調保証を作らない。
- reward-risk: 代理と品質を別の評価経路にし、架空の数値曲線や必然的な転換点を置かない。KL と再評価は抑制であり保証にしない。
- feedback: 報酬の出所と評価粒度を直交させ、結果/過程と RLVR を同じ階層にしない。迎合・能力低下を全モデルの必然にしない。

## A1–A3 の exact 置換

現行本文 SHA256 `6bb4501e5fcd44323a0890d20286cc6e597ab042997df47d2cf9fa2ddabd480b` は計画時と一致。各 old は一意（1 件）で、3 置換をメモリ内で適用した候補 SHA256 `7883fc8764b0a2d7c5df6fa61a4c752696e99ddd579fd44d913db825d865965e` は承認計画と一致しました。日付を変えない訂正のみの候補です。実編集時には実施日・必要な参照根拠を別途同期し最終 SHA と digest を計算します。

### A1: 検証可能報酬(RLVR)とプロセス報酬

置換前:

**結果報酬**: 最終答えが正しいか(テストが通るか)だけを報酬にする。報酬モデルの誤差・ハッキングを避けられる一方、途中の誤った推論を咎められない

置換後:

**結果報酬**: 最終答えが正しいか(テストが通るか)を評価する。機械的に検証する構成も、結果を評価する報酬モデルを学習する構成もあり、途中の誤った推論は直接評価しない

理由: 結果/過程は評価粒度、機械検証/学習報酬は出所の区分。結果報酬一般を学習報酬不使用・ハッキング回避と同一視しない。

### A2: 検証可能報酬(RLVR)とプロセス報酬

置換前:

RLVR は、**推論モデル(考える時間を使う LLM)の学習**を支える枠組みで、[推論モデル](../../../../../docs/10-llm-foundations/reasoning-models.md)が検証可能な問題で強い理由の 1 つです。検証器が用意できるタスクに限られる点が本質的な制約です。

置換後:

RLVR は、**推論モデル(考える時間を使う LLM)の学習**を支える枠組みの一つです([推論モデル](../../../../../docs/10-llm-foundations/reasoning-models.md))。報酬を検証できる範囲が制約となります。結果/プロセス報酬は評価する粒度の区分で、プロセス報酬には人手のステップ評価から学習する構成もあります。

理由: Lightmanらは人手ステップラベルでPRMを学習。RLVRの下位方式としてのみ過程評価を描かない。

### A3: チェックリスト

置換前:

RLVR・プロセス報酬が検証可能タスクに限られると理解している

置換後:

RLVR の検証器と、プロセス報酬の各ステップへの評価を区別できる

理由: 本文の区分訂正と理解確認項目を同期する。

## 次の図なし対照

推奨候補は `/docs/implementation/embeddings`。P3 の公開記事で、P1 停止まで対象外です。現行 registry/記事台帳登録なし、現行ローカル export の reading-figure と rf-article-toc は各 0。代替は model-selection（P3、静的 Mermaid あり）。どちらも runtime/network の heavy chunk 未配信を検証したわけではなく、候補選定だけです。

現在の portable runner は alignment-theory を図なし対照にしているため、D1 の 3 図追加と同時に route・case名・H1・scope・mapping の明示的移行が必要です。旧 C1/C2 predecessor proof は歴史証拠として保持し、新しい移行を独立レビューしてください。旧 case を skip して受入を成立させないでください。alignment-theory の math.spec にある 390px DPO 式の keyboard/overflow 回帰は本記事で維持します。

## 実装開始時に決めること

named exports、scene marker/data hook、selector の正確なラベルと値は原計画では未指定です。実装前に固定して独立 fixture と同期してください。C2 の公開受入後に最新 main と共有 API を再読し、本文・図の意味・全状態画像・local/public を別ゲートで検証します。今回、本文訂正の適用、外部一次情報の再取得、製品・ブラウザ・公開承認は行っていません。
