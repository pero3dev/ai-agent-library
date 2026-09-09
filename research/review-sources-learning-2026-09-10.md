# レビュー S02 対応: 基礎・SE 実践・事例の出典確認

確認日: 2026-09-10。対象は、参考資料に外部 URL がなかった追加担当 13 記事です。参考資料の数を埋めるためではなく、実証・仕様・安全性の主張と、教材としての独自設計案を区別しました。各記事の実質変更に伴い `last_updated` を 2026-09-10 に更新し、`published` は維持しています。

11 記事に一次資料を追加し、2 記事は架空事例という性質を明確化して内部の設計ガイドへの参照を維持しました。「外部資料が存在しない」という判定はしていません。

## 記事別の対応

| 記事 | 分類 | 主張と対応 | 確認した一次資料 |
| --- | --- | --- | --- |
| [case-study-data-analysis-agent](../docs/07-case-studies/case-study-data-analysis-agent.md) | 架空事例維持・断定修正 | 架空の結果を実案件で観察した事実や設計の実証と読める注記を変更。別 SQL の一致だけでは共通の誤定義を検出できないことを補足 | 外部実証の引用は追加せず、内部設計ガイドを教材の題材として明示 |
| [case-study-failed-poc](../docs/07-case-studies/case-study-failed-poc.md) | 架空事例維持・断定修正 | 組織・数値・経緯が設定であることを明示。「デモは実力の上限」を、選別したデモでは代表的な成功率を測れないという説明へ変更 | 外部実証の引用は追加せず、内部設計ガイドを教材の題材として明示 |
| [se-client-adoption](../docs/08-coding-agents/se-client-adoption.md) | 資料追加・責任の断定修正 | 成果物責任の一律な断定を契約・適用法・合意条項の確認へ変更。データ利用範囲・生成物利用条件・リスク分担の確認先を追加 | [経済産業省: AI の利用・開発に関する契約チェックリスト](https://www.meti.go.jp/press/2024/02/20250218003/20250218003.html) |
| [se-maintenance-and-operations](../docs/08-coding-agents/se-maintenance-and-operations.md) | 資料追加・独自設計案の明示 | 活動への割り当ては効果保証ではなく検証する提案と明示。誤り・検証・原因分析を一次資料へ接続 | [GitHub Copilot Chat application card](https://docs.github.com/en/copilot/responsible-use/chat)、[NIST SSDF](https://csrc.nist.gov/pubs/sp/800/218/final) |
| [se-process-map](../docs/08-coding-agents/se-process-map.md) | 資料追加・断定修正 | V 字を費用・検出率の根拠にしない。現行挙動と要求の正しさを区別。責任は担当者の運用と法的分担を区別。作成済みの詳細記事へリンク | [NIST SSDF](https://csrc.nist.gov/pubs/sp/800/218/final)、[GitHub application card](https://docs.github.com/en/copilot/responsible-use/chat) |
| [se-requirements-and-design](../docs/08-coding-agents/se-requirements-and-design.md) | 資料追加・効果の断定修正 | ドラフト作成が速いと一般化せず、修正・レビュー時間を含めて比較。図生成の仕様と生成物の検証を資料へ接続 | [Mermaid 公式](https://mermaid.js.org/intro/)、[GitHub application card](https://docs.github.com/en/copilot/responsible-use/chat) |
| [se-test-process](../docs/08-coding-agents/se-test-process.md) | 資料追加・保証の限定 | テストは証拠を集める活動で、欠陥なしの保証ではないと明示。生成量ではなく検証を含む工数を測定 | [NIST SSDF PW.8](https://csrc.nist.gov/pubs/sp/800/218/final)、[GitHub application card](https://docs.github.com/en/copilot/responsible-use/chat) |
| [attention-and-context](../docs/10-llm-foundations/attention-and-context.md) | 原論文追加・原理と観測の区別 | 因果マスクを補足し、密な注意の計算量をモデル全体の時間と区別。長文品質の位置依存を対象研究の観測とし、全モデルへの一律保証を除去 | [Transformer](https://arxiv.org/abs/1706.03762)、[PagedAttention](https://arxiv.org/abs/2309.06180)、[Lost in the Middle](https://arxiv.org/abs/2307.03172) |
| [capabilities-and-limits](../docs/10-llm-foundations/capabilities-and-limits.md) | 原論文追加・能力断定の限定 | 流暢さの恒常性、構造から得手不得手を完全に導けるという読み方を修正。ツールの成功も引数・解釈の検証が必要 | [Toolformer](https://arxiv.org/abs/2302.04761)、[DeepSeek-R1](https://arxiv.org/abs/2501.12948) |
| [how-llms-generate-text](../docs/10-llm-foundations/how-llms-generate-text.md) | 原論文・公式仕様追加 | 自己回帰型を対象と明示。top-p を安全性保証と区別。上限による構文破壊・意味上の欠落を分け、停止理由の解釈を Agent ループへ接続 | [Transformer](https://arxiv.org/abs/1706.03762)、[Nucleus sampling](https://arxiv.org/abs/1904.09751)、[Anthropic stop reasons](https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons) |
| [llm-training-pipeline](../docs/10-llm-foundations/llm-training-pipeline.md) | 原論文追加・学習の断定修正 | 3 段は代表的構成。SFT で新知識は入らないという断定と全工程同一目的関数という説明を修正。迎合を選好判断の条件付き観測へ接続 | [InstructGPT](https://arxiv.org/abs/2203.02155)、[DPO](https://arxiv.org/abs/2305.18290)、[Sycophancy](https://arxiv.org/abs/2310.13548)、[新知識の SFT と幻覚](https://arxiv.org/abs/2405.05904) |
| [reasoning-models](../docs/10-llm-foundations/reasoning-models.md) | 原論文・公式仕様追加・選定基準修正 | 単純な問いで品質が上がらないという一律断定を比較評価へ変更。推論学習と CoT プロンプトを区別し、モデルの裁量にも承認等の必須手順を残す | [DeepSeek-R1](https://arxiv.org/abs/2501.12948)、[Overthinking](https://arxiv.org/abs/2412.21187)、[Anthropic extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking) |
| [tokenization](../docs/10-llm-foundations/tokenization.md) | 原論文追加・言語差の断定修正 | サブワードを代表方式と明示し、日本語と英語の費用差を固定的な文字比率で説明せず実測に接続 | [BPE](https://aclanthology.org/P16-1162/)、[SentencePiece](https://aclanthology.org/D18-2012/) |

## 確認方法と限界

原論文の公開ページ・要旨、公式ドキュメントの対応箇所を実際に開いて照合しました。NIST SSDF は PW.8 のテスト設計・実行・記録と回帰検査の本文も確認しています。経産省ページは Web ツールがエラーを返したため、同じ公式 URL を PowerShell `Invoke-WebRequest` で取得し、公表本文の目的・データ利用範囲・生成物利用条件・利益とリスクの分担を確認しました。

研究の実験を再現したわけではなく、各モデルの全世代・全タスクへ結果を外挿していません。契約チェックリストは論点の確認先であり、個別契約の法的結論を判定したものではありません。SDK 固定値を含むサンプル検証の範囲は [examples/tests](../examples/tests/README.md) に分離しています。
