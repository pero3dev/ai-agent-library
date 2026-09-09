# レビュー S02: 参考資料の対応索引

対象は `ae86cc3` の `docs/` で「参考資料」節に外部 URL がなかった 66 記事です。記事ごとに根拠と独自の設計提案を区別し、63 記事へ一次資料を追加しました。独自のスキルマップ 1 記事と架空事例 2 記事は、外部の実証結果でないことを明示して内部参照を維持しました。URL の追加自体を、記事全体の実証や最新仕様の全面確認とは扱いません。

| 記事群 | 件数 | 記録 |
| --- | --- | --- |
| 基礎・実装・運用・安全性 | 21 | [記事別対応](review-sources-foundations-2026-09-10.md) |
| 学習・SE・架空事例 | 13 | [記事別対応](review-sources-learning-2026-09-10.md) |
| ビジネス・マルチモーダル・応用・UX | 29 | [記事別対応](review-sources-applications-2026-09-10.md) |
| ROI・時系列・人事 | 3 | 下表 |

## ROI・時系列・人事の根拠

| 記事 | 分類と対応 | 確認した一次資料 |
| --- | --- | --- |
| [ROI とビジネスケース](../docs/09-business/roi-and-business-case.md) | ROI と純便益額を区別。期間・便益・費用・分母を明示した試算は、本ライブラリの架空の計算例。人件費の二重控除を防ぎ、人の工数と無人処理の経過時間を分離 | [豪州政府の財務用語](https://business.gov.au/finance/financial-tools-and-templates/key-financial-terms) |
| [時系列と予測](../docs/13-domain-agents/time-series-and-forecasting.md) | LLM が必ず劣るという断定を修正。論文の限定条件を、任意の業務での優位性へ一般化しない。時間順の評価と予測時点の情報制約で手法を比較 | [LLMTime 原論文](https://arxiv.org/abs/2310.07820)、[FPP3 著者公開版の時系列 CV](https://otexts.com/fpp3/tscv.html) |
| [人事・採用 AI](../docs/13-domain-agents/hr-and-recruitment-ai.md) | 他業界の記事を採用規制の所在と誤案内していた箇所を修正。日本・EU・米国・NYC の確認先を配置。人の最終判断は記事の設計方針で、全地域共通の法的義務や適合保証とは扱わない | [厚労省](https://kouseisaiyou.mhlw.go.jp/basic.html)、[個人情報保護委員会](https://www.ppc.go.jp/personalinfo/legal/guidelines_tsusoku/)、[欧州委員会](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)、[EEOC](https://www.eeoc.gov/eeoc-disability-related-resources/artificial-intelligence-and-ada)、[NYC DCWP](https://home4.nyc.gov/site/dca/about/automated-employment-decision-tools.page) |

アクセス日: 2026-09-10。各記事の参考資料にも確認先とアクセス日を記載しています。

## 関連記事への同期

推論の温度 0 と全体の再現性、投機的デコーディングの受理・補正条件、FT の新知識学習と更新費用の区別を、関連章と GLOSSARY に反映しました。OpenAI カタログ・Codex の部分的な鮮度確認は [モデル調査記録](models/openai.md) と [Codex 調査記録](coding-agents/openai-codex.md) に分離しています。他社・他製品の全仕様の確認日を一括で進めてはいません。

執筆テンプレートを技術的な根拠としていた 15 記事は、記事固有の一次資料へ置き換えました。テンプレートは執筆規約の正本として引き続き使います。
