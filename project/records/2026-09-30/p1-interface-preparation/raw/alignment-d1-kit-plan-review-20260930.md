# D1 公開検査 kit 計画の独立レビュー

**判定: approved / low、must 0・should 0。** 対象は他担当 `/root/inference_change_evidence` の kit 拡張計画のみです。実装・記事訂正・画像・公開受入を承認していません。

レビュー担当 `/root/pretraining_numeric` は interface proposal の作者なので、その自己承認を除外しました。interface は別担当の独立 approved/low レビューの対象 hash を照合し、kit がその契約をどう検査するかだけを確認しています。作者の計画検算や相談 agent の報告を独立実行証拠に使っていません。

## 対象固定

| 対象 | SHA256 |
| --- | --- |
| alignment-d1-kit-plan.md | `1c18d96025931e208c0fdd76d1be8115b79addc7195eacbf5c182d29f092d7aa` |
| alignment-d1-kit-plan.json | `c003f801f6443662522bf0433bbd45546f7cd7bf86e93960ff5c5704accd5e21` |

計画の入力 27 ファイルの現物 hash・bytes と、現行 manifest の 14 ファイル hash がすべて一致しました。現行 manifest SHA256 は `caa2a618c84e6277b9fd6d60698765787a4667f4b73253fe26f86f6ec147544b` です。

## 独立して実行した確認

- 現行 runner の登録文を読み、callback を実行しない名前収集で 91 件を列挙。順序込み SHA256 は `afcdab45db9d16af442aaeb284add5d6e952724e912e6f2b8eb6b46255550972` と一致しました。
- 新 16 名は重複なし、予定 107 名も重複なし。追加列は pretraining の直後・favicon の直前で、旧 90 名は不変です。新 16 を除いた列の index 89 に embeddings 対照が 1 件だけあり、alignment の旧名はありません。そこだけ逆 rename すると旧 91 名、さらに C2/C1 の固定追加名を除くと旧 71/58 名が完全一致しました。
- 現行 C2→C1 の 3 入口全文復元を実行し、保護 5 区間と既存 C1/capture の追加 6 比較も成功しました。将来の D1→C2 復元は未実装なので、成功と記載していません。
- runner / extractor / collector の現行 8 route は同一。alignment を加える予定集合は unique 9、embeddings 対照はその集合外です。embeddings の H1 は計画と一致し、現 registry に登録はありません。実際の runtime/network 対照は未確認です。
- kit の期待値構成を製品 import なしで検算。各 β の odds=4^β から確率・margin・負 log を独自に再計算し、3 行が 1e-12 以内で一致。明示的報酬の 3/4 も別に確認しました。3 図 15 READ、12 境界 × .49/.5/.51 × 往復 = 72、6 profile の計数も整合します。

## 計画の妥当性

無図対照の移行は名称だけでなく route と H1 の変更を宣言し、HTTP 200 / MIME / BUILD_ID・reading-figure 0・toc 0・全 scene/shared-frame heavy chunk 0 とネットワーク検査を維持しています。旧対照だった alignment は独立 artifact HTML hash 必須の第 9 記事へ移り、embeddings は BUILD_ID のみの対照という証拠強度の差も明記されています。既存 390px DPO 原式の region/focus-visible/左右到達/分数高さ/ページ overflow を残す契約です。

新 sidecar は C2 の旧 manifest・名前・固定ファイル hash と 3 入口の before/after を保持し、旧 manifest 本文や自己 hash・現 manifest hash を含めません。既存 C2 sidecar は不変、旧 helper は exact prefix を保護する案です。現 inventory → D1 逆適用で C2 全文 → 既存 C2 逆適用で C1 全文 → 保護区間という順序は現行構成に適用できます。ソース/試験 → 旧だけを参照する proof → proof hash を含む current inventory の順に確定するため、計画上の hash 循環はありません。

旧 91/71/58 の名前一致を検査本文の保護と混同していません。既存 6 module のバイト不変と全入口の逆適用を併用し、旧負例を保持して復元 C2 に適用します。新 D1 の未宣言 assert 変更・rename 2 回・順序変更・未知 path・proof 改変・不足/重複/リンク/混合 build を拒否する追加試験も計画されています。

新 fixture は製品 model・DOM・local build を期待値の出所にしません。同じ x の Z 相殺、応答確率比、固定分布の β、1 ペア損失と期待値を分け、full KL / 真の品質 / 安全率を未知のまま扱います。risk は代理と別評価、feedback は出所と粒度・評価位置を可視ラベル/線/画像でも検査し、隠した data 属性だけで成功にしない契約です。

6 profile の viewport と全 scene の画像、実時間再生・停止・再開、15 READ と独立状態、keyboard/modal/noJS/print の構成は 16 ケースに収まっています。画像生成や幾何検査を実際の文字・線・重なりの独立確認と混同していません。

## 留保と次のゲート

この判定は計画の実現可能性と検証範囲に限定します。C2 公開受入が終わってから baseline を再固定し、D1 実装の hash・逆適用・負例を独立レビューしてください。D1 用チェック関数、synthetic tar、browser、画像、107 ケースの公開実行はまだ行っていません。C2 の GitHub/CI/公開状況も親の連絡としてのみ扱い、このレビューでは外部確認していません。

今回は読み取りとメモリ内の登録列挙・復元・検算のみで、出力はこの MD と同名 JSON の 2 ファイルだけです。製品・記事・kit・Git は変更していません。P1 全 15 記事の公開受入で停止し、P2 は対象外です。
