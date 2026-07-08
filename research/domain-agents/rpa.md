# RPA と Agent の使い分け・移行戦略 執筆前調査メモ(DA-R1)

- **調査 ID**: DA-R1
- **調査日 / 確認日**: 2026-07-09
- **用途**: DOMAIN-AGENTS 計画「RPA と Agent の使い分け・移行戦略」記事の裏取り。記事本文は**製品名を出さず「類型と判断軸」に徹する**方針のため、製品名・具体機能名はこのメモと鮮度管理型ページに閉じ込めます。主目的は冒頭の「## 調査サマリ(類型と判断軸)」です
- **方針の注意**: 製品の**優劣比較・ランキングはしない**。各社の「打ち出し(公式ポジショニング)」の整理に徹します。機能名・価格・提供形態は変化が速いため、確度と確認日を必ず添え、曖昧なものは「未確認」にします
- **確度マーカー**(4 段階):
  - `公式確認済み`: 公式ドキュメント/公式ページ本文を直接取得して確認した
  - `ベンダー自己報告`: 公式だが第三者検証できない自己申告(製品マーケティングページ・プレスリリースの宣言等)。SPA・403 で本文を機械取得できず公式ドメインの検索結果経由で確認した場合もここに含め、その旨を注記
  - `二次情報`: 公式以外(ニュースサイト・まとめ記事等)。裏取り待ちの参考
  - `未確認`: 今回取得できなかった。確認すべき URL を残す
- **取得上の注意**: `www.blueprism.com` および `investor.ssctech.com`(SS&C Blue Prism)は 403 Forbidden / タイムアウトで本文を機械取得できませんでした。SS&C の事実は公式ドメインの検索結果スニペット経由で確認しており、確度を `ベンダー自己報告` に下げて注記しています。`www.businesswire.com` も接続リセットで未取得(UiPath の同内容は uipath.com 公式ニュースルームから直接取得済み)

---

## 調査サマリ(類型と判断軸)

記事本文で製品横断的に言える「類型と判断軸」。個別ベンダーの根拠は後述の「## ベンダー別メモ」にあります。

1. **どのベンダーも「RPA を置き換える」ではなく「補完・共存」を公式に打ち出している。** 決定的(deterministic)な定型タスクは既存 RPA が担い、適応・推論・非定型(unstructured / 判断を要する)タスクを AI Agent が担う分業が共通構図です。UiPath は「agents think, robots do, and people lead」、Microsoft は「keep classic RPA for deterministic scenarios ... CUAs add flexibility where RPA falls short」、Automation Anywhere は既存 RPA/BPM に「layer over」して "rip-and-replace" を避ける、SS&C は「retaining deterministic automation where control is essential」、WinActor は「定型業務は RPA・非定型業務は生成 AI」と、表現は違えど同じ役割分担を述べています。

2. **新しい主戦場は「オーケストレーション層」。** エージェント・ロボット・人・API・(さらに他社エージェント)を単一のガバナンス下で束ねる製品を各社が中核に据えています(UiPath **Maestro** / SS&C **WorkHQ** / Automation Anywhere **APA + Process Reasoning Engine** / Microsoft **Copilot Studio の generative orchestration + agent flows**)。→ 判断軸: 「エンドツーエンド процессのオーケストレーションの正本をどこに置くか(既存 RPA 製品のオーケストレータか、新設のエージェント基盤か)」。

3. **既存 RPA を「エージェントのツール/アクション」として呼ぶパターンが標準化しつつある。** 決定的な手順は既存の RPA スクリプト(desktop flow / robot / bot)としてそのまま保ち、エージェントがそれを道具として起動する構図です。Microsoft は「reliable automation ... calling desktop flows directly from Copilot Studio for tasks that require precise, step-by-step execution」、UiPath は Maestro が robots を呼ぶ、Automation Anywhere はエージェントが「orchestrate across bots, APIs, documents—and other agents」。→ 判断軸: 「決定的部分は RPA 資産として温存し、適応部分だけをエージェント化する」= 段階的移行(rip-and-replace 回避)。

4. **「決定的 RPA を使う条件 / エージェントを使う条件」の判断基準は各社でほぼ一致している。** 最も明快なのは Microsoft の公式ドキュメントの RPA vs CUA 比較表です。決定的 RPA が向くのは「UI/画面が安定・ルールが明確・高頻度で速度重視・既存 RPA チームが保守」、エージェント(CUA)が向くのは「UI が変動/複数アプリ・判断が曖昧で自己修正が要る・画面上の視覚情報に依存・RPA チームのバックログが逼迫」。→ 記事の「判断軸テーブル」にほぼそのまま流用できます(製品名は出さず一般化)。

5. **「人の承認・統制・監査」は RPA 時代の運用統制の延長として、オーケストレーション層に集約する打ち出し。** HITL(承認・例外エスカレーション)、監査ログ(audit trail)、ガードレール、RBAC、暗号化を「エージェント・ロボット・人すべてに一度定義して適用する」方向です(UiPath「Policy, audit, and human-in-the-loop controls live at the orchestration layer, expressed once and applied across every agent, bot, and step」+ Action Center への例外ルーティング + Unified Audit 2.0 + controlled agency guardrails / Microsoft の "Human in the loop" アクション + Purview + audit logs + Key Vault / Automation Anywhere の AI Guardrails + RBAC + audit trails / SS&C の "single governed environment")。→ 判断軸: 「RPA の統制資産(承認フロー・監査・認可の仕組み)を Agent 世界にどう継承するか」。

6. **提供形態はクラウドが主流だが、規制業種・公共向けに「オンプレ/エアギャップ + 自社ホストモデル」を出す動きが明確にある。** UiPath は Automation Suite を「public cloud から air-gapped on-premises まで」導入可能とし、自社データセンター内で OSS モデルを動かしてエージェントワークフロー(Maestro / Agent Builder / GenAI Activities)を回せると公式発表(2026-05-05)。WinActor は純国産・オンプレ運用の RPA に、ベンダー(NTT-AT)が Azure OpenAI 契約ごとまとめて提供する「AI 連携ライセンス」を用意。Automation Anywhere は VPC デプロイを訴求。→ 判断軸: データ主権・閉域要件があるなら「オンプレ RPA + 自社ホスト/専有モデル」を検討軸に置く。

7. **モデルはベンダー中立(BYO-LLM)へ向かっている。** オーケストレーターは特定 LLM に依存せず、複数プロバイダ(OpenAI / Anthropic / Google Gemini / Azure OpenAI / Bedrock / Vertex)や自社モデルを選べる設計です。UiPath は「UiPath is not your AI provider; it's the layer that governs whichever AI providers you choose」と明言。→ 判断軸: エージェント基盤選定では「LLM の選択自由度」と「ガバナンスの主体」を分けて評価する。

8. **マルチエージェント/サードパーティエージェントの取り込みが進む。** オーケストレーターが自社エージェントだけでなく他社エージェント(Claude / OpenAI / Gemini / Microsoft Copilot / カスタム)も同一の統制・監査・可観測性の下で束ねる方向です(UiPath Maestro が明言 / SS&C WorkHQ は "unified control plane")。→ 判断軸: ベンダーロックインを避けつつ統制を効かせる「エージェント相互運用のガバナンス」。

---

## ベンダー別メモ

### UiPath(Agentic Automation / Maestro / Agent Builder / Autopilot)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 2025-04-30 に「the first enterprise-grade platform for agentic automation」を発表。AI エージェント・ロボット・人を単一の知的システムに統合する位置づけ | https://www.uipath.com/newsroom/uipath-launches-first-enterprise-grade-platform-for-agentic-automation | 2026-07-09 | 公式確認済み(日付・位置づけ) |
| プラットフォームの分業思想は「**where agents think, robots do, and people lead**」。AI エージェント(判断・適応)と RPA ロボット(決定的実行)と人(統率)を役割分担。RPA は独立したプラットフォーム構成要素として存続(Build に「Agentic AI / RPA / API / Intelligent document processing」を併記) | https://www.uipath.com/platform/agentic-automation | 2026-07-09 | 公式確認済み |
| **Maestro**(オーケストレーション層)が「UiPath robots, third-party agents, enterprise systems, and humans」を「one governed workflow」で協調させる。BPMN 2.0 のプロセスモデリングとネイティブな AI エージェント参加を組み合わせ、「rules-based automation and AI reasoning run together inside one governed workflow」(=決定的自動化と AI 推論の共存) | https://www.uipath.com/platform/agentic-automation/agentic-orchestration | 2026-07-09 | 公式確認済み |
| Maestro は特定ベンダーに依存せず「UiPath agents alongside **Claude, OpenAI, Gemini, Microsoft Copilot, and custom-coded agents**」を同一の governance/audit/observability 下で束ねる。「UiPath is not your AI provider; it's the layer that governs whichever AI providers you choose」 | https://www.uipath.com/platform/agentic-automation/agentic-orchestration | 2026-07-09 | 公式確認済み |
| **人の承認・統制・監査**: 「People stay in control where judgment matters. Maestro routes exceptions to humans via **Action Center**, supports **pause, resume, retry, rewind, and skip** on live process instances, and captures **every step in an audit trail**」。「Policy, audit, and human-in-the-loop controls live at the orchestration layer, expressed once and applied across every agent, bot, and step」 | https://www.uipath.com/platform/agentic-automation/agentic-orchestration | 2026-07-09 | 公式確認済み |
| **controlled agency** モデル: AI エージェントを「clearly defined guardrails」内で動かす。「robust governance, real-time vulnerability assessments, and stringent data access controls」を訴求 | https://www.uipath.com/newsroom/uipath-launches-first-enterprise-grade-platform-for-agentic-automation | 2026-07-09 | 公式確認済み(ただし「95%+ agent accuracy/reliability」の数値はベンダー自己報告) |
| 2025-09-30 に拡張発表。**Agent Builder**(visual / Conversational / Coded agents、MCP プラグイン対応)、業種別プリビルドソリューション、IXP の agentic looping/抽出・検証エージェント、統制面で「extended agent guardrails for controlled agency」と「**Unified Audit 2.0**」。「AI agent sprawl」(エージェントの乱立)をユニファイドオーケストレーションで管理する狙い | https://www.uipath.com/newsroom/uipath-accelerates-ai-transformation-with-agentic-automation-and-orchestration | 2026-07-09 | 公式確認済み |
| **提供形態**: クラウド(**Automation Cloud**)とオンプレ/セルフホスト(**Automation Suite**)の両対応 | https://www.uipath.com/platform/agentic-automation | 2026-07-09 | 公式確認済み |
| 2026-05-05 発表: **Automation Suite** で「public cloud から air-gapped on-premises まで」導入可能。政府機関・規制業種向けに、**自社データセンター内で推奨 OSS モデルを実行**し「agentic workflows using UiPath Maestro, Agent Builder, GenAI Activities, and context grounding—without external dependencies」を実現。cloud-hosted models(OpenAI / Google Gemini / Anthropic)と fully self-hosted models を選択可 | https://www.uipath.com/newsroom/uipath-automation-suite-delivers-agentic-ai-for-public-sector | 2026-07-09 | 公式確認済み |
| 上記オンプレ版の統制: 「A unified governance model spans agentic, IT, and infrastructure controls – ... within defined policies, with **full auditability**, data protection, and compliance」。準拠標準として **ISO/IEC 42001・FedRAMP・AIUC-1** を明記 | https://www.uipath.com/newsroom/uipath-automation-suite-delivers-agentic-ai-for-public-sector | 2026-07-09 | 公式確認済み(認証の第三者検証まではしていないため認証名自体はベンダー自己報告) |
| **Autopilot**(自然言語での自動化構築・実行の面)から Agents を GA として「Run Job」アクティビティで起動できる、等の統合。RPA と API を LLM/LAM と融合する「Screenplay」「API Workflows」も発表 | https://www.uipath.com/community-blog/tutorials/uipath-autopilot-for-everyone | 2026-07-09 | ベンダー自己報告(コミュニティブログ。機能名・GA 状況は変化が速いため執筆時に再確認) |

**含意(記事用)**: UiPath は「RPA を Agent のオーケストレーション下の"実行主体(robots do)"として温存しつつ、判断層に Agent を足す」典型。統制は RPA 時代の Orchestrator/Action Center 由来の資産(承認・例外処理・監査)をオーケストレーション層に集約して継承。オンプレ+自社ホストモデルまで用意しており「決定的 RPA の統制を Agent 世界に引き継ぐ」類型の代表例として使えます。

### Microsoft(Power Automate / Copilot Studio)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **agent flows は「deterministic」**と公式に明記: 「Agent flows are deterministic. They execute actions or tasks following a rule-based path. The same input always produces the same output, making them reliable and predictable」。=決定的自動化の枠 | https://learn.microsoft.com/en-us/microsoft-copilot-studio/flows-overview | 2026-07-09 | 公式確認済み |
| agent flow のアクション種別に「**Human in the loop**: Actions that require human intervention, such as approval requests or providing information」が組み込まれている(HITL は決定的フロー内のアクションとして提供) | https://learn.microsoft.com/en-us/microsoft-copilot-studio/flows-overview | 2026-07-09 | 公式確認済み |
| 既存の **Power Automate クラウドフローを agent flow に変換可能**(「convert it to an agent flow」)。変換は一方向(課金が Copilot Studio 容量へ移るため不可逆)。エージェントは「When an agent calls the flow」トリガーの agent flow を**ツールとして**追加できる | https://learn.microsoft.com/en-us/microsoft-copilot-studio/flows-overview | 2026-07-09 | 公式確認済み |
| エージェントは 3 系統のツールを持つ: AI prompts / MCP / **computer use tool(デスクトップ操作の自動化)**。RPA(desktop flow)と CUA を使い分けるガイダンスを公式に提供 | https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/agent-tools | 2026-07-09 | 公式確認済み |
| **RPA vs CUA の公式比較表**: RPA=Rule based / UI tree / Script(複雑)/ Predefined rules / 低柔軟性 / Static error handling。CUA=LLM driven / Vision / 自然言語 / Autonomous visual-based decisions / 高柔軟性 / Self-correcting。**RPA を使う条件**=「GA 機能のみ許容/UI が安定/ルールが明確/速度重視・大量処理/RPA チームが保有」。**CUA を使う条件**=「UI が変動・複数アプリ・頻繁な再設計/急ぎ(RPA バックログ逼迫)/画面上の視覚情報に依存/判断が曖昧で自己修正が必要」 | https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/agent-tools | 2026-07-09 | 公式確認済み |
| 補完(置き換えでない)ポジショニング: 「you can keep classic RPA for deterministic scenarios with stable interfaces」、CUA は「add flexibility and adaptive reasoning where RPA falls short (dynamic web apps, shifting layouts, or complex decisioning)」。「the goal isn't to start over—it's to modernize and extend what you already have」。UI が頻繁に変わるフォームでは「the RPA stays the same, while a CUA handles the variable UI portions」 | https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/computer-using-agents-now-deliver-more-secure-ui-automation-at-scale/ | 2026-07-09 | 公式確認済み |
| **computer use は GA**。ただしブログ取得時点の記載では US-based Copilot Studio 環境向け/全商用地域へ展開中。**本番は BYO(自社仮想ネットワーク内に事前プロビジョニング)マシン、ホスト型はプロトタイプ用**という運用指針 | https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/agent-tools / https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/computer-using-agents-now-deliver-more-secure-ui-automation-at-scale/ | 2026-07-09 | 公式確認済み(地域展開状況は変化が速く要再確認) |
| **統制**: 認証情報の暗号化保管、Azure Key Vault 連携、セッションリプレイと監査ログ、Microsoft Purview 連携を「enterprise governance」として提供。MCP の利点にも「Governance, monitoring, and extensibility」を明記 | https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/computer-using-agents-now-deliver-more-secure-ui-automation-at-scale/ / https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/agent-tools | 2026-07-09 | 公式確認済み |
| エージェントの応答は **orchestrator(generative orchestration)** がツール/トピック/知識を選択して構成。決定的フロー(agent flow)とツール(desktop flow / MCP / AI prompt)を組み合わせる設計 | https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/agent-tools | 2026-07-09 | 公式確認済み |
| 提供形態は Microsoft クラウド(Power Platform / Copilot Studio)前提。desktop flow の実行機は「ホスト型(Windows 365 Cloud PC のプール)」または「BYO(顧客の仮想ネットワーク内、Entra ID/Intune 対応)」 | https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/agent-tools | 2026-07-09 | 公式確認済み |

**含意(記事用)**: Microsoft は「決定的=agent flow / desktop flow(RPA)」「適応的=エージェント + computer use(CUA)」を明確に線引きし、**RPA vs CUA の判断基準を公式ドキュメントで表化**している点が記事の判断軸テーブルに直結します。RPA を「そのまま残し、可変な UI 部分だけ CUA が担う」という段階移行の言語化が最も明快。

### Automation Anywhere(Agentic Process Automation / AI Agent Studio / Automation Co-Pilot)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| プラットフォームを「**Agentic Process Automation (APA)**」と称し、「combines and orchestrates goal-based AI agents, RPA, APIs, and human expertise in one unified platform」。RPA は APA と併存する構成要素として明示 | https://www.automationanywhere.com/products/agentic-process-automation-system | 2026-07-09 | 公式確認済み(製品ページ本文) |
| **Process Reasoning Engine (PRE)** が中核。既存 RPA/BPM の上に「layer over existing RPA and BPM systems to handle exceptions and unstructured data that traditional bots cannot」= 例外・非構造データをエージェントが担い、「rip-and-replace」を避ける | https://www.automationanywhere.com/products/agentic-process-automation-system | 2026-07-09 | 公式確認済み |
| **AI Agent Studio**: 「goal-driven AI agents, powered by the Process Reasoning Engine, handle **reasoning, human-in-the-loop**, and **orchestrate across bots, APIs, documents—and other agents—in real time**」(=エージェントが既存 bot を含めてオーケストレーション) | https://www.automationanywhere.com/products/ai-agent-studio | 2026-07-09 | 公式確認済み |
| **LLM 中立(BYO-LLM)**: 「choose your LLM, connect your data, and customize easily」。Amazon Bedrock / Google Vertex AI / Azure OpenAI / OpenAI + カスタムモデルに対応 | https://www.automationanywhere.com/products/ai-agent-studio | 2026-07-09 | 公式確認済み |
| **Automation Co-Pilot**: 自然言語で既存アプリ内から multi-step の agentic workflow を起動。PRE が意図を解釈し AI エージェントを呼ぶ「human-agent collaboration」 | https://www.automationanywhere.com/products/automation-co-pilot | 2026-07-09 | ベンダー自己報告(製品ページ。検索スニペット併用) |
| **統制/ガードレール**: 「AI Guardrails」= built-in safety and governance layer が「critical safety checks in real time」(機微データの検出・マスキング、toxicity 分析、有害応答のブロック)。RBAC・暗号化・audit trails を提供。「monitor every move agents make」 | https://www.automationanywhere.com/products/ai-agent-studio / https://www.automationanywhere.com/products/agentic-process-automation-system | 2026-07-09 | 公式確認済み(製品ページの記述) |
| **提供形態/認証**: 「deploy in your VPC for complete data control, compliance, and seamless enterprise integration at cloud scale」。SOC 2 Type II / ISO 27001 / FedRAMP / GDPR 準拠を訴求 | https://www.automationanywhere.com/products/agentic-process-automation-system | 2026-07-09 | ベンダー自己報告(認証は自己申告。VPC デプロイの詳細は執筆時に要確認) |
| OpenAI と協業した「AI-native agentic solutions」、AWS Agentic AI Specialization 取得などの発表あり(詳細は未取得) | https://www.automationanywhere.com/company/press-room/automation-anywhere-advances-ai-native-agentic-solutions-enterprise-openai / https://www.automationanywhere.com/company/press-room/automation-anywhere-achieves-aws-agentic-ai-specialization | 2026-07-09 | 未確認(プレス本文は未取得。存在のみ) |

**含意(記事用)**: 「既存 RPA/BPM の上にエージェント(PRE)を"layer"して非定型・例外を足す」= rip-and-replace 回避の典型的な移行メッセージ。HITL とガードレールを PRE に内蔵する打ち出し。

### SS&C Blue Prism(WorkHQ / Agentic Automation)

> 注意: `www.blueprism.com` / `investor.ssctech.com` は 403 / タイムアウトで本文を機械取得できませんでした。以下は**公式ドメイン(blueprism.com・investor.ssctech.com)の検索結果スニペット経由**での確認であり、確度を `ベンダー自己報告` に下げています。執筆・引用時に本文を要再取得。

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 2026-04-29 に「SS&C Blue Prism **WorkHQ**」を発表(NY・Nasdaq でのライブイベント)。「agentic automation platform designed to help enterprises operationalize agentic AI safely, transparently and with full control of end-to-end workflows」 | https://www.blueprism.com/news/ssnc-unveils-workhq/ / https://investor.ssctech.com/news-releases/news-release-details/ssc-unveils-workhq-power-enterprise-agentic-automation | 2026-07-09 | ベンダー自己報告(公式ドメインの検索結果経由。本文は 403/timeout で未取得) |
| WorkHQ は「a unified **control plane** orchestrating people, AI agents, APIs and digital workers into a **single governed environment**」(digital workers=既存 RPA 資産を含む) | 同上 | 2026-07-09 | ベンダー自己報告(同上) |
| **共存/移行メッセージ**: 「WorkHQ **complements existing RPA and BPM investments**, enabling customers to introduce AI agents where they add value **while retaining deterministic automation where control is essential**」 | 同上 | 2026-07-09 | ベンダー自己報告(同上。記事の"決定的自動化を統制の要所に残す"論点の直接的裏付け) |
| ワークフローとエージェントは「modular, reusable and composable」。「move from isolated AI use cases to governed, enterprise-wide automation」で数十〜数千のエージェントを「maintaining control, transparency, and resilience」の下でスケールさせる狙い | 同上 | 2026-07-09 | ベンダー自己報告(同上) |
| 実績値として「4,000+ digital workers and more than 50 AI agents」「processing times by up to 95%」等を提示 | 同上 | 2026-07-09 | ベンダー自己報告(自己申告の実績値) |
| 「RPA から agentic automation への旅」を明示的なナラティブに据える(製品ページ・ロードマップブログ) | https://www.blueprism.com/products/agentic-automation/ / https://www.blueprism.com/resources/blog/agentic-automation-roadmap-2026/ | 2026-07-09 | 未確認(本文は 403 で未取得。存在のみ) |

**含意(記事用)**: 「control plane / single governed environment」で人・エージェント・API・デジタルワーカー(RPA)を束ね、**決定的自動化を"統制が要る所"に意図的に残す**という言い切りは、記事の判断軸「どこを決定的 RPA のまま残すか」を補強する好例。ただし本文未取得のため引用時は要再確認。

### WinActor(NTT-AT / NTT データ)+ つなぎ AI

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 2025-09-04 発表、2025-10 販売開始。WinActor に**生成 AI 連携機能を標準搭載**し、新ライセンス「**AI 連携ライセンス**」を提供。生成 AI 連携で「業務自動化の領域を非定型業務へ拡大」 | https://www.ntt-at.co.jp/news/2025/detail/release250904.html | 2026-07-09 | 公式確認済み |
| **AI 連携ライセンスは NTT-AT が契約する Azure OpenAI の利用を内包**し、ユーザーは生成 AI ベンダーと別途契約不要(ベンダーが契約・サーバー管理を代行、フローティングライセンス+インターネット接続で利用可) | https://www.ntt-at.co.jp/news/2025/detail/release250904.html | 2026-07-09 | 公式確認済み |
| 連携の形は 3 種: ①シナリオ内で生成 AI に指示(問い合わせ対応=メール回答作成、画像認識=画像内データ抽出)②対話でシナリオを生成・改善 ③可変帳票の読み取り。**定型業務は RPA(WinActor)、非定型・判断系は生成 AI**という役割分担 | https://www.ntt-at.co.jp/news/2025/detail/release250904.html | 2026-07-09 | 公式確認済み |
| 先行の Ver.7.6.0(2025-07-10)でも「生成 AI 連携機能の強化と運用支援機能の拡充」「定型業務の自動化から非定型業務の自動化に活用範囲を拡大」を打ち出し。画像認識 AI 連携も追加 | https://www.ntt-at.co.jp/news/2025/detail/release250710.html | 2026-07-09 | 公式確認済み(概要。本文詳細は一部検索スニペット経由) |
| 関連サービス「**つなぎ AI**」= 主要 LLM を一定量自由に使える SaaS。NTT は「AI エージェント基盤サービス」と位置づけ。WinActor(定型)+ つなぎ AI(文章生成等)で収集〜集計〜レポート作成の一連を自動化する構図を提示 | https://winactor.com/product/tsunagi-ai/ / https://journal.ntt.co.jp/article/34167 | 2026-07-09 | ベンダー自己報告(製品ページ+ NTT 技術ジャーナル。本文の一部は検索スニペット経由) |
| RelAi ナレッジアシスタント + WinActor を組み合わせた「AI エージェント」による旅費事務効率化の実証実験(札幌市、2025-12-10 発表)など、RPA を AI エージェント構成の"実行部品"として使う事例を公式に発信 | https://www.ntt-at.co.jp/news/2025/detail/release251210.html | 2026-07-09 | ベンダー自己報告(プレス。実証段階) |

**含意(記事用)**: 国内・純国産・オンプレ運用の RPA が「LLM をライセンスごとバンドルして提供し、定型=RPA / 非定型=生成 AI の分業を製品化」した例。海外勢の「オーケストレーション層で束ねる」構図とは粒度が違い、**まず既存 RPA に生成 AI を"部品"として足す**段階の代表として対比に使えます(データ主権・国内調達要件の文脈とも接続)。

---

## 変わりやすい項目(定点観測)

記事改訂時・引用時に再確認する項目:

1. **各社の機能名・GA 状況**: UiPath(Maestro / Agent Builder / Autopilot / Screenplay)、Microsoft(computer use の対応地域・GA 範囲、agent flow の新旧 experience 統合)、Automation Anywhere(PRE / AI Agent Studio)、SS&C(WorkHQ の GA・提供範囲)。名称・GA は四半期単位で動く
2. **RPA vs エージェントの判断基準表**: Microsoft の公式表(RPA vs CUA)は改訂されうる。引用時に learn.microsoft.com の当該ページ日付を確認(取得時 flows-overview は 2026-06-30 更新、agent-tools は 2026-01-29 更新)
3. **オンプレ/エアギャップ + 自社ホストモデル対応**: UiPath Automation Suite の on-prem agentic(2026-05-05 発表)の対象機能・対応モデル・準拠標準(ISO 42001 / FedRAMP / AIUC-1)は拡張が速い
4. **SS&C Blue Prism WorkHQ**: 本文が今回 403/timeout で未取得。次回は本文を直接取得し、共存メッセージ・提供形態・GA を確度「公式確認済み」に上げる
5. **各社の認証**(SOC 2 / ISO 27001 / ISO 42001 / FedRAMP 等): 自己申告ベースのため Trust Center 等で範囲・期間を再確認
6. **WinActor / つなぎ AI**: バージョン(Ver.7.6 系)・AI 連携ライセンスの内包モデル(Azure OpenAI)・価格は改定が速い。国内特有のオンプレ+バンドル提供形態として追う
7. **BYO-LLM の対応プロバイダ**: 各オーケストレーターが束ねられる LLM/他社エージェントの一覧は増減する(UiPath は Claude/OpenAI/Gemini/Copilot を明記)

---

## 参照した URL 一覧(アクセス日 2026-07-09)

### UiPath(公式: uipath.com)
- https://www.uipath.com/platform/agentic-automation
- https://www.uipath.com/platform/agentic-automation/agentic-orchestration
- https://www.uipath.com/newsroom/uipath-launches-first-enterprise-grade-platform-for-agentic-automation
- https://www.uipath.com/newsroom/uipath-accelerates-ai-transformation-with-agentic-automation-and-orchestration
- https://www.uipath.com/newsroom/uipath-automation-suite-delivers-agentic-ai-for-public-sector
- https://www.uipath.com/community-blog/tutorials/uipath-autopilot-for-everyone

### Microsoft(公式: learn.microsoft.com / microsoft.com)
- https://learn.microsoft.com/en-us/microsoft-copilot-studio/flows-overview
- https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/agent-tools
- https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/computer-using-agents-now-deliver-more-secure-ui-automation-at-scale/
- https://learn.microsoft.com/en-us/power-platform/release-plan/2026wave1/power-automate/ (参照のみ・本文未精読)

### Automation Anywhere(公式: automationanywhere.com)
- https://www.automationanywhere.com/products/agentic-process-automation-system
- https://www.automationanywhere.com/products/ai-agent-studio
- https://www.automationanywhere.com/products/automation-co-pilot
- https://www.automationanywhere.com/company/press-room/automation-anywhere-advances-ai-native-agentic-solutions-enterprise-openai (存在確認のみ)
- https://www.automationanywhere.com/company/press-room/automation-anywhere-achieves-aws-agentic-ai-specialization (存在確認のみ)

### SS&C Blue Prism(公式: blueprism.com / investor.ssctech.com — 本文は 403/timeout で未取得、検索スニペット経由)
- https://www.blueprism.com/news/ssnc-unveils-workhq/
- https://investor.ssctech.com/news-releases/news-release-details/ssc-unveils-workhq-power-enterprise-agentic-automation
- https://www.blueprism.com/products/agentic-automation/
- https://www.blueprism.com/resources/blog/agentic-automation-roadmap-2026/

### WinActor / NTT(公式: ntt-at.co.jp / winactor.com / journal.ntt.co.jp)
- https://www.ntt-at.co.jp/news/2025/detail/release250904.html
- https://www.ntt-at.co.jp/news/2025/detail/release250710.html
- https://www.ntt-at.co.jp/news/2025/detail/release251210.html
- https://winactor.com/product/tsunagi-ai/
- https://journal.ntt.co.jp/article/34167
