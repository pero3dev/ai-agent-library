# D1 実装前インターフェース案（2026-09-30）

作成者 `/root/pretraining_numeric`。C2 公開受入を待つ間の提案で、製品・記事・Git・既存公開 kit は変更していません。新しい exports / hooks / 操作 / 固定 fixture は未実装・未独立レビューです。採択済みの state / motion / checks と全 15 READ は JSON の `adopted` にそのまま保持し、新規案は `proposed` に分離しました。

承認計画 SHA256: `1cef526de4f41aebe195360c50c526386d199f0cd511dc477911223a4a4a7319`。既存 readonly preparation の MD / JSON と現行本文の一致を再確認しました。元 JSON の historical status は原文保持で、計画承認が実装承認を意味することはありません。

## 固定するインターフェース案

| 図 | Scene / frame / STAGES | 可視 marker / stage 属性 |
| --- | --- | --- |
| alignment-preference | `AlignmentPreference` / `alignmentPreferenceFrame` / `ALIGNMENT_PREFERENCE_STAGES` | `ALIGNMENT / PREFERENCE` / `data-alignment-preference-stage` |
| alignment-reward-risk | `AlignmentRewardRisk` / `alignmentRewardRiskFrame` / `ALIGNMENT_REWARD_RISK_STAGES` | `ALIGNMENT / REWARD RISK` / `data-alignment-reward-risk-stage` |
| alignment-feedback | `AlignmentFeedback` / `alignmentFeedbackFrame` / `ALIGNMENT_FEEDBACK_STAGES` | `ALIGNMENT / FEEDBACK` / `data-alignment-feedback-stage` |

各図は既存の `<id>-model.mjs` / `<id>-walkthrough.jsx` / `<id>.css` / `<id>-model.test.mjs` の 4 ファイル、合計 12 ファイル。Scene は `{children}`。root 統合の dispatcher は `alignment-walkthrough.jsx` の named export `AlignmentWalkthrough({diagramId, children})`、固定 3 lazy map と原文 fallback を使う案です。正確な全パス・モデル schema・hooks は同名 JSON に記載しています。

段階は preference 7（全体→選好ペア→報酬差→報酬とKL→正則化→暗黙の報酬→DPO損失）、reward-risk 3（代理と目的→過剰最適化→正則化と再評価）、feedback 5（検証器→結果と過程→適用範囲→調整の副作用→フィードバックの作り方）。手動専用段階は 0、23 body blocks / 6 H3 の包装と 4 原式・元 Mermaid の保持を変えません。

## 操作は 2 種だけ

- preference S4–S6: `式中の β（説明用）`、DOM value / label は `0.5`, `1`, `2`、model は number、既定 1。同じ 1 selector を該当段階で使い、固定した分布での式の重みだけ比較します。`固定した分布で式を比較` と `更新量・品質の予測ではない` を可視表示します。S0–S3 の意味フレームは β 選択に影響されません。
- feedback S4: `選好ラベルの作り手`、`human` → `人手` / `ai` → `AI`、既定 human。同じ入力位置の出所だけ強調し、両ラベルを初期表示にも残します。粒度・タスク・安全性は切り替えません。
- reward-risk は追加操作なし。全注意点は未操作の READ で見えます。共通の再生・停止・段階・読書再開・拡大・キーボード操作を再利用します。

## preference の固定説明値と独立 oracle

入力 `x-0`、勝ち `y-w`、負け `y-l`、方策 `pi-theta`、固定参照 `pi-ref`。S2 の明示的報酬は `r_phi(w)=ln3`, `r_phi(l)=0` で選好確率 `3/4`。これは S5 以降の暗黙報酬と数値が同じという主張ではありません。

| 応答 | πθ(y|x) | πref(y|x) | 比 | log 比 |
| --- | --- | --- | --- | --- |
| y-w | 0.5 | 0.25 | 2 | ln2 |
| y-l | 0.125 | 0.25 | 0.5 | −ln2 |

応答全体の条件付き確率です。他応答の残りの質量は πθ=0.375、πref=0.5 ですが、個々の分布は未指定。この集合を一つの応答に見立てた 3 セル KL を元の full-response KL として計算しません。S3 の報酬期待値・KL・目的値は記号表示（model では null）に保ちます。

両応答の暗黙報酬は `β log(πθ/πref) + β log Z(x-0)`。Z の数値は null、同一の term ID `z-x-0` を二つ表示します。同じ入力・同じ参照文脈の共通項だから差で消えることを S6 で可視化します。異なる inputId を渡した helper は相殺を返さず RangeError とします。

| β | margin m | σ(m) | この 1 ペアの損失 ℓ |
| --- | --- | --- | --- |
| 0.5 | ln(2) ≈ 0.693147 | 2/3 ≈ 0.666667 | ln(3/2) ≈ 0.405465 |
| 1 | ln(4) ≈ 1.386294 | 4/5 ≈ 0.800000 | ln(5/4) ≈ 0.223144 |
| 2 | ln(16) ≈ 2.772589 | 16/17 ≈ 0.941176 | ln(17/16) ≈ 0.060625 |

`m=β[(ln pw−ln qw)−(ln pl−ln ql)]`, `ℓ=−ln σ(m)`。図には「この選好ペアの損失 ℓ」を表示し、記事の `L_DPO` はペア全体の期待値 / 平均だと添えます。β を変えてこの固定 m と ℓ が変わっても、学習後の更新量・品質・安全性や最適 β の予測にはしません。

モデル exports は `ALIGNMENT_PREFERENCE_FIXTURE`, `PREFERENCE_BETA_VALUES`, `bradleyTerryTerms`, `dpoPairTerms` を追加する案です。正の有限 β、確率 (0,1]、各分布の pair mass ≤ 1、同じ非空 inputId を検証。確率 0 の黙った丸めは禁止。log 差・stable sigmoid・softplus を使い、固定 UI fixture の数値は十分小さく保ちます。

独立 browser / portable fixture は上表の閉形式と分数を自分の固定期待値として保持し、製品 model を期待値生成に import しません。data 属性は未丸め値、見える数値は ≈ と 3 桁を基本とし、内部 tolerance 1e-12 / 表示 tolerance 0.0005 を分離します。

## reward-risk と feedback の意味と構造 oracle

報酬リスク図は同じ `answer-0` から `proxy` と `quality` に分岐します。後者の表示は「別の品質評価（真の良さそのものではない）」、いずれも値は null。S1 で代理への最適化と冗長 / 体裁を併置し、S2 で KL と報酬モデル再評価の戻りを接続します。軸・万能曲線・転換点・最適値を作らず、「抑制であり保証ではない」を可視表示します。検証は ID・接続・注意書き・数値未設定を対象にします。

フィードバック図は `step-1/2/3` と `final` の同じ解答列です。S1 の印は正誤のチェックではなく評価位置で、結果は final 1 箇所、過程は中間 3 箇所を同時に示します。架空の思考文や解答例は置きません。

S2 の報酬源 `verifier` / `learned-reward-model` と粒度 `outcome` / `process` は別軸です。人手等のステップ評価から学習する報酬モデルを残し、過程評価を RLVR の下位区分や常に機械検証できるものとして描きません。直交は分類の区別であり、全 4 組合せが常に実装可能という表は作りません。S3 の迎合 / アラインメント税には架空の低下率・全モデル必然を付けず、S4 の AI ラベルにも無害性を保証させません。

## 可視 hooks と検証境界

JSON の hooks は `attribute` と `values` の列挙です。複数 value を CSS の疑似 OR 記法にせず、figure 内で `[attribute="value"]` ごとに照合します。hook は実際に見える scene 要素に付き、数式の数字・Z の打消し・評価レーン・ラベルの意味をテキストと同時に検査します。隠した期待値専用 DOM を画像受入の代わりにしません。

可読性は固定した 2 行や 2 レーンを優先し、全文数式を小さく詰めません。marker は各 lazy scene の可視 eyebrow のみに配置します。純粋 frame、整数段階と .49/.5/.51、逆送り、全選択値、失敗入力と変異耐性を確認します。共有 reading-clock の段階丸め規則を再利用し、別の時間軸は導入しません。

C2 公開受入と最新 main / 共有 API の再読後、担当を確定してから実装します。A1–A3 の exact 置換と日付・根拠の同期、alignment-theory から embeddings への無図対照移行はそれぞれ明示的にレビューします。旧 kit や旧証拠を置き換えず、新しい受入で原文・モデル・画像・local/public を別々に確認します。

本案の作者が後で実装担当になる場合、作者 unit は独立レビューではありません。今回実行したのは 3 図 adopted データの完全一致、15 READ / 0 manual、2 操作 / 5 option、固定 3 行の式と Bradley–Terry 3/4 の作者検算だけです。実装・browser・公開承認は行っていません。

JSON SHA256: `019400d5862560f50f361474971a62a5f7f51a5b2926b95a2a29b9bddfc3f632`。終了境界は P1 全 15 記事の公開受入完了、P2 は開始しません。
