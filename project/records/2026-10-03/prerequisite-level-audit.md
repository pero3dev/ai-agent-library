# 前提知識の level 逆転 55 件の処置

基準 tree `f3af9b0` と同じ 55 件を修正前のパーサ集計で確認しました。任意の参考は「関連トピック」に移し、必須前提とは区別します。level と既存リンクの移動は編集上の学習順・索引整備として last_updated を保持しました。本文の技術主張・実装条件は書き換えていません。他の Issue で技術内容も訂正した記事は substantive として 2026-10-04 に更新しました。一次資料がこのライブラリの難易度区分を直接証明したとは扱いません。

| 記事 | 元の前提 | 処置 | 判断の根拠 |
| --- | --- | --- | --- |
| `docs/01-concepts/physical-ai-overview.md` | `docs/01-concepts/computer-use-and-multimodal-agents.md` | 任意化 (関連トピックへ移動) | 本文は基本概念と設計判断から読める。専門的な実装・運用・評価の詳細は関連資料として保持 |
| `docs/02-architecture/agent-api-design.md` | `docs/02-architecture/async-and-durable-agents.md` | 任意化 (関連トピックへ移動) | 本文は基本概念と設計判断から読める。専門的な実装・運用・評価の詳細は関連資料として保持 |
| `docs/03-implementation/claude-prompting.md` | `docs/03-implementation/prompt-engineering-patterns.md` | 任意化 (関連トピックへ移動) | モデル固有の基本設定は基礎技法から読める。上級の設計・検証パターンは発展資料 |
| `docs/03-implementation/data-preprocessing-for-llm.md` | `docs/03-implementation/rag-implementation-patterns.md` | level 修正 (intermediate→advanced; 前提 advanced→advanced) | RAG 実装と埋め込みの設計を合わせて取り込みパイプラインを具体化する |
| `docs/03-implementation/data-preprocessing-for-llm.md` | `docs/03-implementation/embeddings.md` | level 修正 (intermediate→advanced; 前提 advanced→advanced) | RAG 実装と埋め込みの設計を合わせて取り込みパイプラインを具体化する |
| `docs/03-implementation/gemini-prompting.md` | `docs/03-implementation/prompt-engineering-patterns.md` | 任意化 (関連トピックへ移動) | モデル固有の基本設定は基礎技法から読める。上級の設計・検証パターンは発展資料 |
| `docs/03-implementation/llm-landscape.md` | `docs/03-implementation/model-selection.md` | 任意化 (関連トピックへ移動) | ハードウェア/モデルの概観を読んでから選定へ進める |
| `docs/03-implementation/open-source-ai-ecosystem.md` | `docs/06-security/ai-supply-chain-security.md` | 任意化 (関連トピックへ移動) | 本文は基本概念と設計判断から読める。専門的な実装・運用・評価の詳細は関連資料として保持 |
| `docs/03-implementation/openai-prompting.md` | `docs/03-implementation/prompt-engineering-patterns.md` | 任意化 (関連トピックへ移動) | モデル固有の基本設定は基礎技法から読める。上級の設計・検証パターンは発展資料 |
| `docs/03-implementation/vector-databases.md` | `docs/03-implementation/rag-implementation-patterns.md` | level 修正 (intermediate→advanced; 前提 advanced→advanced) | RAG 実装と埋め込みを前提に索引・更新・評価の実装を判断する |
| `docs/03-implementation/vector-databases.md` | `docs/03-implementation/embeddings.md` | level 修正 (intermediate→advanced; 前提 advanced→advanced) | RAG 実装と埋め込みを前提に索引・更新・評価の実装を判断する |
| `docs/04-evaluation/agent-benchmarks-landscape.md` | `docs/04-evaluation/agent-evaluation-basics.md` | level 修正 (basic→intermediate; 前提 intermediate→intermediate) | 評価とモデル選定の基本を使い、測定範囲と候補の適合性を判断する |
| `docs/04-evaluation/agent-benchmarks-landscape.md` | `docs/03-implementation/model-selection.md` | level 修正 (basic→intermediate; 前提 intermediate→intermediate) | 評価とモデル選定の基本を使い、測定範囲と候補の適合性を判断する |
| `docs/04-evaluation/fairness-and-bias-evaluation.md` | `docs/04-evaluation/online-evaluation-and-ab-testing.md` | 任意化 (関連トピックへ移動) | 本文は基本概念と設計判断から読める。専門的な実装・運用・評価の詳細は関連資料として保持 |
| `docs/05-operations/batch-processing.md` | `docs/02-architecture/async-and-durable-agents.md` | 任意化 (関連トピックへ移動) | 本文は基本概念と設計判断から読める。専門的な実装・運用・評価の詳細は関連資料として保持 |
| `docs/05-operations/feedback-loops.md` | `docs/04-evaluation/evaluation-datasets.md` | 任意化 (関連トピックへ移動) | 本文は基本概念と設計判断から読める。専門的な実装・運用・評価の詳細は関連資料として保持 |
| `docs/05-operations/gpu-and-hardware-basics.md` | `docs/03-implementation/model-selection.md` | 任意化 (関連トピックへ移動) | ハードウェア/モデルの概観を読んでから選定へ進める |
| `docs/05-operations/llm-gateway.md` | `docs/05-operations/deployment-and-scaling.md` | 任意化 (関連トピックへ移動) | 本文は基本概念と設計判断から読める。専門的な実装・運用・評価の詳細は関連資料として保持 |
| `docs/05-operations/semantic-caching.md` | `docs/03-implementation/embeddings.md` | level 修正 (intermediate→advanced; 前提 advanced→advanced) | 埋め込み選定とキャッシュ運用を合わせて類似度閾値と誤返却を設計する |
| `docs/06-security/content-provenance-and-detection.md` | `docs/10-llm-foundations/multimodal-models.md` | level 修正 (intermediate→intermediate; 前提 advanced→intermediate) | 数式なしの直感と basic の概念を使う内部説明であり、数式・実装詳解の advanced ではない |
| `docs/06-security/privacy-enhancing-technologies.md` | `docs/05-operations/conversation-data-management.md` | 任意化 (関連トピックへ移動) | 本文は基本概念と設計判断から読める。専門的な実装・運用・評価の詳細は関連資料として保持 |
| `docs/07-case-studies/case-study-data-analysis-agent.md` | `docs/13-domain-agents/data-analysis-agents.md` | 任意化 (関連トピックへ移動) | 事例は構成と判断の説明で理解できる。専門的な実装・認証の詳細は実装段階の発展資料 |
| `docs/07-case-studies/case-study-data-analysis-agent.md` | `docs/03-implementation/loop-feedback-and-verification.md` | 任意化 (関連トピックへ移動) | 事例は構成と判断の説明で理解できる。専門的な実装・認証の詳細は実装段階の発展資料 |
| `docs/07-case-studies/case-study-it-helpdesk-agent.md` | `docs/06-security/agent-identity-and-auth.md` | 任意化 (関連トピックへ移動) | 事例は構成と判断の説明で理解できる。専門的な実装・認証の詳細は実装段階の発展資料 |
| `docs/07-case-studies/case-study-knowledge-agent.md` | `docs/03-implementation/rag-implementation-patterns.md` | 任意化 (関連トピックへ移動) | 事例は構成と判断の説明で理解できる。専門的な実装・認証の詳細は実装段階の発展資料 |
| `docs/08-coding-agents/claude-code.md` | `docs/08-coding-agents/coding-agent-selection.md` | 任意化 (関連トピックへ移動) | 製品の概要を理解してから横断の導入判断へ進む。選定記事の先読は不要 |
| `docs/08-coding-agents/coding-agent-prompting.md` | `docs/08-coding-agents/coding-agent-rules-and-config.md` | 任意化 (関連トピックへ移動) | 本文は基本概念と設計判断から読める。専門的な実装・運用・評価の詳細は関連資料として保持 |
| `docs/08-coding-agents/cursor.md` | `docs/08-coding-agents/coding-agent-selection.md` | 任意化 (関連トピックへ移動) | 製品の概要を理解してから横断の導入判断へ進む。選定記事の先読は不要 |
| `docs/08-coding-agents/devin.md` | `docs/08-coding-agents/coding-agent-selection.md` | 任意化 (関連トピックへ移動) | 製品の概要を理解してから横断の導入判断へ進む。選定記事の先読は不要 |
| `docs/08-coding-agents/devin.md` | `docs/02-architecture/human-in-the-loop.md` | 任意化 (関連トピックへ移動) | 本文は基本概念と設計判断から読める。専門的な実装・運用・評価の詳細は関連資料として保持 |
| `docs/08-coding-agents/gemini-cli-and-code-assist.md` | `docs/08-coding-agents/coding-agent-selection.md` | 任意化 (関連トピックへ移動) | 製品の概要を理解してから横断の導入判断へ進む。選定記事の先読は不要 |
| `docs/08-coding-agents/github-copilot.md` | `docs/08-coding-agents/coding-agent-selection.md` | 任意化 (関連トピックへ移動) | 製品の概要を理解してから横断の導入判断へ進む。選定記事の先読は不要 |
| `docs/08-coding-agents/openai-codex.md` | `docs/08-coding-agents/coding-agent-selection.md` | 任意化 (関連トピックへ移動) | 製品の概要を理解してから横断の導入判断へ進む。選定記事の先読は不要 |
| `docs/08-coding-agents/windsurf.md` | `docs/08-coding-agents/coding-agent-selection.md` | 任意化 (関連トピックへ移動) | 製品の概要を理解してから横断の導入判断へ進む。選定記事の先読は不要 |
| `docs/12-multimodal/document-ai.md` | `docs/10-llm-foundations/multimodal-models.md` | level 修正 (intermediate→intermediate; 前提 advanced→intermediate) | 数式なしの直感と basic の概念を使う内部説明であり、数式・実装詳解の advanced ではない |
| `docs/12-multimodal/speech-synthesis-and-voice-design.md` | `docs/03-implementation/voice-agents.md` | 任意化 (関連トピックへ移動) | 本文は基本概念と設計判断から読める。専門的な実装・運用・評価の詳細は関連資料として保持 |
| `docs/12-multimodal/video-ai-overview.md` | `docs/10-llm-foundations/multimodal-models.md` | level 修正 (basic→intermediate; 前提 advanced→intermediate) | マルチモーダルの基礎と画像理解の設計を前提に提供経路・移行を判断する |
| `docs/12-multimodal/video-ai-overview.md` | `docs/12-multimodal/vision-understanding-patterns.md` | level 修正 (basic→intermediate; 前提 intermediate→intermediate) | マルチモーダルの基礎と画像理解の設計を前提に提供経路・移行を判断する |
| `docs/12-multimodal/vision-understanding-patterns.md` | `docs/10-llm-foundations/multimodal-models.md` | level 修正 (intermediate→intermediate; 前提 advanced→intermediate) | 数式なしの直感と basic の概念を使う内部説明であり、数式・実装詳解の advanced ではない |
| `docs/13-domain-agents/education-agents.md` | `docs/04-evaluation/confidence-and-calibration.md` | 任意化 (関連トピックへ移動) | 業務の分担・品質・人への引継ぎを設計する記事。内部実装・測定理論の詳細は発展資料 |
| `docs/13-domain-agents/education-agents.md` | `docs/03-implementation/long-term-memory-implementation.md` | 任意化 (関連トピックへ移動) | 業務の分担・品質・人への引継ぎを設計する記事。内部実装・測定理論の詳細は発展資料 |
| `docs/13-domain-agents/emerging-agent-domains.md` | `docs/01-concepts/single-vs-multi-agent.md` | 任意化 (関連トピックへ移動) | 業務の分担・品質・人への引継ぎを設計する記事。内部実装・測定理論の詳細は発展資料 |
| `docs/13-domain-agents/emerging-agent-domains.md` | `docs/03-implementation/mcp-and-tool-protocols.md` | 任意化 (関連トピックへ移動) | 業務の分担・品質・人への引継ぎを設計する記事。内部実装・測定理論の詳細は発展資料 |
| `docs/13-domain-agents/legal-review-agents.md` | `docs/13-domain-agents/deep-research-agents.md` | 任意化 (関連トピックへ移動) | 業務の分担・品質・人への引継ぎを設計する記事。内部実装・測定理論の詳細は発展資料 |
| `docs/13-domain-agents/personal-assistant-design.md` | `docs/03-implementation/long-term-memory-implementation.md` | 任意化 (関連トピックへ移動) | 業務の分担・品質・人への引継ぎを設計する記事。内部実装・測定理論の詳細は発展資料 |
| `docs/13-domain-agents/rpa-and-agents.md` | `docs/03-implementation/computer-use-implementation.md` | 任意化 (関連トピックへ移動) | 業務の分担・品質・人への引継ぎを設計する記事。内部実装・測定理論の詳細は発展資料 |
| `docs/13-domain-agents/search-experience-redesign.md` | `docs/03-implementation/rag-implementation-patterns.md` | 任意化 (関連トピックへ移動) | 業務の分担・品質・人への引継ぎを設計する記事。内部実装・測定理論の詳細は発展資料 |
| `docs/13-domain-agents/search-experience-redesign.md` | `docs/04-evaluation/evaluation-datasets.md` | 任意化 (関連トピックへ移動) | 業務の分担・品質・人への引継ぎを設計する記事。内部実装・測定理論の詳細は発展資料 |
| `docs/13-domain-agents/spreadsheet-agents.md` | `docs/13-domain-agents/data-analysis-agents.md` | 任意化 (関連トピックへ移動) | 業務の分担・品質・人への引継ぎを設計する記事。内部実装・測定理論の詳細は発展資料 |
| `docs/13-domain-agents/spreadsheet-agents.md` | `docs/03-implementation/loop-feedback-and-verification.md` | 任意化 (関連トピックへ移動) | 業務の分担・品質・人への引継ぎを設計する記事。内部実装・測定理論の詳細は発展資料 |
| `docs/13-domain-agents/time-series-and-forecasting.md` | `docs/13-domain-agents/data-analysis-agents.md` | 任意化 (関連トピックへ移動) | 業務の分担・品質・人への引継ぎを設計する記事。内部実装・測定理論の詳細は発展資料 |
| `docs/13-domain-agents/time-series-and-forecasting.md` | `docs/04-evaluation/confidence-and-calibration.md` | 任意化 (関連トピックへ移動) | 業務の分担・品質・人への引継ぎを設計する記事。内部実装・測定理論の詳細は発展資料 |
| `docs/14-ux-and-product/ai-ux-patterns.md` | `docs/04-evaluation/confidence-and-calibration.md` | 任意化 (関連トピックへ移動) | UX の設計判断に、確信度の定式化・較正実装の先読は不要 |
| `docs/14-ux-and-product/proactive-agent-ux.md` | `docs/04-evaluation/confidence-and-calibration.md` | 任意化 (関連トピックへ移動) | UX の設計判断に、確信度の定式化・較正実装の先読は不要 |
| `docs/15-human-ai/verifying-ai-outputs.md` | `docs/10-llm-foundations/capabilities-and-limits.md` | 任意化 (関連トピックへ移動) | 全職種向け検証習慣の入口。失敗の由来の詳解は後から読む |

入口の動画概観は中級、数式なしのマルチモーダル解説は中級、RAG/埋め込みを合わせる前処理・DB/semantic cache は上級へ再判定しました。概観と製品の横断選定、業務・UX 設計と詳細実装は学習順で区別します。

再判定に伴って追加で生じた `data-governance-for-ai.md` → `data-preprocessing-for-llm.md` の 1 件も、組織のデータ管理を読むための必須条件ではないため、既存の関連トピックへ統一しました。最終集計は 0 件を要求します。
