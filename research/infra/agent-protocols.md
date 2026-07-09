# エージェント間連携プロトコル(agent interoperability protocols)執筆前調査メモ(IF-R1)

- **調査 ID**: IF-R1
- **調査日 / 確認日**: 2026-07-09
- **用途**: 鮮度管理型記事「エージェント間連携プロトコル」の裏取り。記事本文は**構造と判断軸に徹し**、仕様の詳細・バージョン・ガバナンスの現況はこのメモと公式リンク + 最終確認日に閉じ込める方針です。主目的は冒頭の「## 調査サマリ(構造と判断軸)」です
- **方針の注意**: **優劣比較・ランキングはしない**。標準の「位置づけ」と「成熟度」の整理に徹します。仕様バージョン・ガバナンス移管・採用状況は変化が速いため、確度と確認日を必ず添え、曖昧なものは「未確認」にします(憶測で埋めない)
- **確度マーカー**(4 段階):
  - `公式確認済み`: 公式ページ/仕様本文/標準化団体のプレスを直接取得して確認した
  - `ベンダー・団体自己報告`: 公式だが第三者検証できない自己申告(プレスの宣言・マーケ記述・自己申告の採用数値等)。SPA・403 で本文を機械取得できず公式ドメインの検索結果スニペット経由で確認した場合もここに含め、その旨を注記
  - `二次情報`: 公式以外(ニュース・まとめ記事・survey・arXiv プレプリント等)。裏取り待ちの参考
  - `未確認`: 今回取得できなかった。確認すべき URL を残す
- **重複回避の注意**: 認証・認可(組織間の信頼)の IETF/OAuth/MCP 認可仕様の深掘りは、既存メモ [research/professional/agent-identity.md](../professional/agent-identity.md) に整理済みです。本メモは**相互運用プロトコル側から見た認証・認可の要点**に絞り、詳細はそちらへ委ねます
- **取得上の注意**: `github.com/google-agentic-commerce/AP2/blob/main/docs/specification.md` は 404(パス変更の可能性)。AP2 の事実は Google Cloud 公式ブログと公式ドキュメントサイト `ap2-protocol.org` から取得しています。AGNTCY(Agent Connect Protocol)は公式一次ソースを直接取得できず、確度を下げています(後述)

---

## 調査サマリ(構造と判断軸)

記事本文で製品横断的に言える「構造と判断軸」。個別標準の根拠は後述の「## 標準別メモ」にあります。

1. **「ツール接続(MCP)」と「エージェント間連携(A2A)」は責任と会話が非対称。** MCP は**部品(tool / resource)を呼ぶ**―「well-defined, structured inputs and outputs で、多くは stateless な特定機能」。A2A は**相手エージェントに任せる**―「reason, plan, use multiple tools, maintain state over longer interactions, and engage in complex, often multi-turn dialogues」する自律主体との協働です。両者は公式に**相補的(complementary)**と位置づけられ、置き換えではありません(「an agentic application might primarily use A2A ... Each individual agent internally uses MCP to interact with its specific tools and resources」)。→ 判断軸: 呼ぶ相手を「部品」と見るか「主体」と見るかで、**渡す情報・受け取る結果の形・信頼モデル**が変わる。A2A の設計原則は明示的に「エージェントを "tool" に閉じ込めない」「内部のメモリ・ツール・コンテキストを共有しない(opaque agents)」。

2. **プロトコルが定める要素は 5 つの構造に整理できる(製品横断)。** ①**発見(discovery)** ②**能力広告(capability advertisement)** ③**委譲(task delegation)** ④**進捗/結果(progress / result)** ⑤**認証・認可(auth)**。A2A ではそれぞれ〈Agent Card(`/.well-known/agent-card.json`)〉〈`capabilities` / `skills`〉〈`SendMessage` → `Task`〉〈streaming(SSE)/ push notification / polling + `Task` 状態遷移 + `Artifact`〉〈`securitySchemes` / `security`〉に対応します。この 5 要素の枠は他提案(AGNTCY の Agent Directory / Agent Connect 等)にも概ね当てはまり、記事の「プロトコルが何を決めるか」の骨格として使えます。

3. **ガバナンスは「ベンダー中立化」と「収斂」に向かっている。** A2A は Google が Linux Foundation へ寄贈(2025-06-23、Open Source Summit NA)、MCP は Anthropic が **Agentic AI Foundation(AAIF)**(Linux Foundation 傘下、2025-12-09 発足)へ寄贈。IBM の **ACP(Agent Communication Protocol / BeeAI)は 2025-08-29 に A2A へ統合**(開発を畳んで技術を A2A に寄せる)。乱立していた提案が LF 傘下で収斂しつつあります。ただし「MCP = ツール層」「A2A = エージェント層」の役割分担は保たれ、**層が違うものは統合されず、同じ層の重複(ACP↔A2A)が統合された**、という読み方が正確です。

4. **成熟度は「骨格は固まったが周辺は流動」。** A2A は**仕様 1.0(初の安定版)**に到達(spec 表記は `1.0.0`)、MCP は日付版(現行 `2025-11-25`)で毎リビジョン認可章が大きく動いてきました。両者が依拠する土台(OAuth 2.1・CIMD 等)は**いまだ Internet-Draft**です。安定しているのは〈発見/能力広告/メッセージ・タスク構造〉、動くのは〈認可・組織間 ID・決済・レジストリ API〉。→「**まだ標準に賭けきらない**」設計判断: 中核(発見・委譲・タスク)は使いつつ、認可・ID・レジストリは実装固有 or 既存 IAM 基盤で吸収する逃げ道を残す。

5. **組織間の信頼(認証・認可)は「プロトコルに埋め込まず既存標準へ委ねる」設計。** A2A は**アイデンティティを HTTP/トランスポート層で確立**し、プロトコルペイロードにユーザー/クライアント ID を載せません(「A2A protocol payloads ... don't carry user or client identity information directly」)。`securitySchemes` は **OpenAPI 準拠**(API Key / HTTP Auth / OAuth2 / OpenID Connect / mTLS)で、認可は「エージェント実装・扱うデータ・企業ポリシー固有」。→ **エージェント固有の認可標準はまだ無い**(IETF の ID-JAG・identity-chaining・WIMSE 系の詳細は [agent-identity.md](../professional/agent-identity.md) 参照)。判断軸: 相互運用プロトコルは「認証の"広告と搬送"は決めるが、"誰に何を許すか"は自前」。

6. **決済という「最も信頼が要る委譲」に専用の上位プロトコル(AP2)が現れた。** AP2(Agent Payments Protocol、Google 主導、2025-09-17 発表、60+ 組織)は **A2A / MCP の拡張**として位置づけられ、**署名付き mandate(意図・カート/チェックアウト・支払い)+ 検証可能クレデンシャル**で「**authorization(認可)・authenticity(真正性)・accountability(説明責任)**」を担保し、非可否(non-repudiation)の監査証跡を作ります。V0.1 → V0.2 と急速に改訂中で、標準化は **FIDO の作業部会**へ移りつつあります。→「エージェントに金銭を委ねる」領域は最初から**証跡と同意の暗号的検証**を前提に設計され始めている、という論点に使えます。

7. **相手エージェントは新しい攻撃面。公式ガイダンスは「相手を信頼できない外部 HTTP アプリとして扱う」。** A2A の公式ガイダンスは、エージェントは **opaque**(内部を晒さない)、本番通信は **HTTPS/TLS 必須**、**Agent Card に静的シークレットを埋めない・機微な Agent Card は認証/認可で保護**(authenticated extended agent cards、mTLS/OAuth/ネットワーク制限)、認可は**最小権限・スキル単位**、と定めます。ただし「悪意ある応答」「過剰な情報開示」を包括的に扱う公式仕様はまだ薄く、レッドチーム的な指摘(プロンプトインジェクション等)は主に **arXiv プレプリント段階**です。→ 判断軸: 発見できた相手を無条件に信頼しない、開示する能力・データを最小化する。

8. **発見(discovery)には複数方式があり、レジストリ API は未標準。** A2A は〈well-known URI(`/.well-known/agent-card.json`、RFC 8615 準拠)〉〈キュレーテッドレジストリ〉〈プライベート設定〉の 3 方式を示しますが、**レジストリの API は「現時点で標準化されていない(no standardized API currently specified)」**。→ 「動的に未知の相手を発見して委譲する」設計はまだ時期尚早で、当面は既知の相手 or 自前カタログに閉じるのが安全、という判断材料。

---

## 標準別メモ

### A2A(Agent2Agent Protocol)

**発案・ガバナンス**

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Google が 2025-04-09 に A2A を発表。「A2A is an open protocol that **complements Anthropic's Model Context Protocol (MCP)**, which provides helpful tools and context to agents」と MCP との相補関係を明記 | https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/ | 2026-07-09 | 公式確認済み |
| 2025-06-23、Open Source Summit North America で Google が **A2A(仕様・SDK・開発者ツール)を Linux Foundation へ寄贈**。「neutral governance」「vendor neutral」の下で運営。100+ 社の支持 | https://developers.googleblog.com/en/google-cloud-donates-a2a-to-linux-foundation/ / https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents | 2026-07-09 | 公式確認済み |
| 主要参加企業として **AWS・Cisco・Google・IBM・Microsoft・Salesforce・SAP・ServiceNow** 等。IBM の ACP 統合後、A2A の **Technical Steering Committee** に IBM・Google・Microsoft・AWS・Cisco・Salesforce・ServiceNow・SAP の代表が入ると明記 | https://lfaidata.foundation/communityblog/2025/08/29/acp-joins-forces-with-a2a-under-the-linux-foundations-lf-ai-data/ | 2026-07-09 | 公式確認済み(LF AI & Data コミュニティブログ) |
| 2026-04-09(1 周年)時点で **150+ 組織**が支持、主要クラウドに組み込み、supply chain・financial services・insurance・IT operations 等で本番運用。「A2A has moved from initial release to a **production-ready open standard**」 | https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year | 2026-07-09 | 公式確認済み(採用数値は自己申告のため数値自体はベンダー・団体自己報告) |
| A2A が MCP と同じく **Agentic AI Foundation(AAIF)傘下**に入ったか | — | 2026-07-09 | 未確認(AAIF 発足プレスの anchored projects は **MCP / goose / AGENTS.md** のみで A2A は列挙されていない。「両方が AAIF 傘下」とする記述は二次情報。A2A は 2025-06 に LF 直下プロジェクトとして寄贈済みで、AAIF への正式編入は今回一次情報で確認できず) |

**仕様が定める要素(現行バージョン)**

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 現行プロトコルバージョンは **`1.0.0`**(初の安定版)。リクエストヘッダに `A2A-Version`、拡張に `A2A-Extensions` | https://a2a-protocol.org/latest/specification/ | 2026-07-09 | 公式確認済み |
| **発見**: **Agent Card**(機械可読メタデータ)を `/.well-known/agent-card.json` で公開。主要フィールドは `id` / `name` / `description` / `provider` / `capabilities` / `skills` / `interfaces` / `securitySchemes`。正規化 + 署名検証で署名可能 | https://a2a-protocol.org/latest/specification/ | 2026-07-09 | 公式確認済み |
| **能力広告**: `AgentCard.capabilities` に `streaming`(bool)・`pushNotifications`(bool)・`extendedAgentCard`(bool)。`skills` に各能力(`id`・説明・tags・`inputModes`/`outputModes`・例)を列挙し、client がタスクに最適な相手を選ぶ | https://a2a-protocol.org/latest/specification/ | 2026-07-09 | 公式確認済み |
| **委譲**: 中核操作は `SendMessage`。client は `parts`(text / bytes / url / structured data)を持つ `Message` を送り、agent は非同期作業なら `Task`(一意の `id` と `contextId`)を、即応なら `Message` を返す。`contextId` で複数タスク/メッセージを論理的にグルーピングして会話を継続 | https://a2a-protocol.org/latest/specification/ / https://a2a-protocol.org/latest/topics/life-of-a-task/ | 2026-07-09 | 公式確認済み |
| **進捗/結果(長時間タスク)**: 3 方式―①**Polling**(`GetTask`)②**Streaming**(`SendStreamingMessage`/`SubscribeToTask` が `TaskStatusUpdateEvent`・`TaskArtifactUpdateEvent` を配信)③**Push Notifications**(client 提供 URL への webhook POST)。設計原則で「quick tasks から **hours・days に及ぶ deep research** まで」を想定 | https://a2a-protocol.org/latest/specification/ / https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/ | 2026-07-09 | 公式確認済み |
| **タスク状態(`TaskState`)**: 進行中 `submitted`/`working`、中断 `input-required`/`auth-required`、終端 `completed`/`failed`/`canceled`/`rejected`。**終端状態は不変(immutable)で再開不可**。JSON-RPC 実装では `TASK_STATE_COMPLETED` 形式 | https://a2a-protocol.org/latest/topics/life-of-a-task/ / https://a2a-protocol.org/latest/specification/ | 2026-07-09 | 公式確認済み |
| **結果**: `Artifact`(`artifactId`・`name`・`description`・`parts`)がエージェント生成物(文書・画像・構造化データ)。`Message`/`Part`/`Artifact` の三層で内容を運ぶ | https://a2a-protocol.org/latest/specification/ | 2026-07-09 | 公式確認済み |
| **設計原則(5 つ)**: ①Embrace agentic capabilities(**agents don't share memory, tools and context**、相手を "tool" に閉じ込めない)②Build on existing standards(HTTP・SSE・JSON-RPC)③**Secure by default**(**parity to OpenAPI's authentication schemes**)④Support long-running tasks ⑤Modality agnostic(audio/video streaming も) | https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/ | 2026-07-09 | 公式確認済み |

**認証・認可(組織間の信頼)/ 攻撃面**

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **opaque モデル**: 「agents are typically opaque because they **don't share internal memory, tools, or direct resource access** with each other」。リモートエージェントを「trusted internal systems ではなく typical HTTP-based enterprise applications」として扱う | https://a2a-protocol.org/latest/topics/enterprise-ready/ | 2026-07-09 | 公式確認済み |
| **通信保護**: 「**All A2A communication in production environments must occur over HTTPS**」。TLS 1.2+ / 強い cipher / 証明書検証で MITM を防ぐ | https://a2a-protocol.org/latest/topics/enterprise-ready/ | 2026-07-09 | 公式確認済み |
| **アイデンティティは HTTP 層で**: 「A2A protocol payloads ... **don't carry user or client identity information directly. Identity is established at the transport/HTTP layer**」。server は `securitySchemes` で対応方式を広告し、`Authorization: Bearer <TOKEN>` 等の標準ヘッダで搬送 | https://a2a-protocol.org/latest/topics/enterprise-ready/ | 2026-07-09 | 公式確認済み |
| **認可は実装固有**: 「**Authorization logic is specific to the agent's implementation, the data it handles, and applicable enterprise policies**」。skill 単位の粒度、OAuth スコープ整合、最小権限を推奨 | https://a2a-protocol.org/latest/topics/enterprise-ready/ | 2026-07-09 | 公式確認済み |
| **発見時の攻撃面(情報開示)**: 機微な Agent Card は「authenticated extended agent cards」+ HTTP エンドポイントのアクセス制御(mTLS / ネットワーク制限 / OAuth 2.0)で保護必須。「any Agent Card containing sensitive data **must be protected**」「**against embedding static secrets within the Agent Card**」 | https://a2a-protocol.org/latest/topics/agent-discovery/ | 2026-07-09 | 公式確認済み |
| **セキュリティ分析(相手エージェントという攻撃面)**: エージェント間通信プロトコルのセキュリティ比較や、AP2 へのプロンプトインジェクションのレッドチームなどの研究がある | https://arxiv.org/pdf/2511.03841 / https://arxiv.org/pdf/2601.22569 | 2026-07-09 | 二次情報(arXiv プレプリント。公式ガイダンスではない。方向性の参考として) |

**A2A と MCP の関係(記事の主軸)**

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 公式の線引き: MCP は「defines **how an AI agent interacts with and utilizes individual tools and resources**, such as a database or an API」。A2A は「focuses on enabling **different agents to collaborate with one another** to achieve a common goal」 | https://a2a-protocol.org/latest/topics/a2a-and-mcp/ | 2026-07-09 | 公式確認済み |
| **tools vs agents**: tools/resources は「primitives with well-defined, structured inputs and outputs ... often stateless」。agents は「more autonomous ... reason, plan, use multiple tools, maintain state over longer interactions, and engage in complex, often multi-turn dialogues」 | https://a2a-protocol.org/latest/topics/a2a-and-mcp/ | 2026-07-09 | 公式確認済み |
| **相補・併用**: 「An agentic application might primarily use A2A to communicate with other agents. **Each individual agent internally uses MCP** to interact with its specific tools and resources」。自動車修理店の比喩(A2A = 客↔店長・店↔部品業者の会話 / MCP = 整備士↔診断機・整備マニュアル) | https://a2a-protocol.org/latest/topics/a2a-and-mcp/ | 2026-07-09 | 公式確認済み |

### MCP(Model Context Protocol)― 相互運用の観点から

> 認可仕様(2025-11-25 リビジョン、RS/AS 分離、CIMD、step-up 等)の詳細は [agent-identity.md](../professional/agent-identity.md) §2 に整理済み。ここでは相互運用・ガバナンスの現在地のみ。

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| MCP は「a **universal, open standard for connecting AI applications to external systems**(tools / resources)」。2026 時点で 10,000+ の active public MCP server、97M+/月の SDK ダウンロード | https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation | 2026-07-09 | 公式確認済み(採用数値は自己申告のため数値自体はベンダー・団体自己報告) |
| 2025-12-09、Anthropic が **MCP を Agentic AI Foundation(AAIF)へ寄贈**。AAIF は「a directed fund under the Linux Foundation **co-founded by Anthropic, Block and OpenAI**」。anchored projects は **MCP / goose(Block)/ AGENTS.md(OpenAI)** | https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation / https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation | 2026-07-09 | 公式確認済み |
| AAIF の Platinum メンバー: **AWS・Anthropic・Block・Bloomberg・Cloudflare・Google・Microsoft・OpenAI**。個々のプロジェクトは技術的方向性・日常運営の自律性を保持し、LF は技術方向を指図しない | https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation | 2026-07-09 | 公式確認済み |
| MCP のガバナンスモデルは寄贈後も不変。maintainer が **SEP(Specification Enhancement Proposal)** プロセスとコミュニティ入力で技術決定 | https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation | 2026-07-09 | 公式確認済み |

### AP2(Agent Payments Protocol)― 決済の委譲

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 2025-09-17、Google が **AP2** を発表。60+ 組織(Adyen・American Express・Ant International・Coinbase・Etsy・Mastercard・PayPal・Revolut・Salesforce・ServiceNow・UnionPay・Worldpay 等)と協働 | https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol | 2026-07-09 | 公式確認済み |
| **位置づけ**: 「The protocol can be used as an **extension of the Agent2Agent (A2A) protocol and Model Context Protocol (MCP)**」。crypto 決済向けに **A2A x402 extension** も言及 | https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol | 2026-07-09 | 公式確認済み |
| **3 つの担保**: **authorization**(ユーザーが特定の購入権限を与えた証明)・**authenticity**(エージェントの要求がユーザーの真意を反映)・**accountability**(不正/誤取引時の責任所在)。署名付き mandate + 検証可能クレデンシャルで **non-repudiable audit trail** を作る | https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol | 2026-07-09 | 公式確認済み |
| **mandate モデル(発表時 = V0.1)**: **Intent Mandate**(ユーザーの初期要求・監査コンテキスト)/ **Cart Mandate**(提示された選択肢をユーザー承認後の、品目と価格の改変不能な記録)/ **Payment Mandate**(支払い手段の紐づけ)。credit/debit・real-time bank transfer・crypto に payment-agnostic | https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol | 2026-07-09 | 公式確認済み(発表時点の設計) |
| **現行(V0.2)への改訂**: 公式ドキュメントサイトは「AP2 v0.2 Release」を掲示し、mandate を **Checkout Mandate**(Open/Closed の 2 段階)/ **Payment Mandate**(Open/Closed)へ再編。「**verifiable digital credentials (VDCs)**」を基本要素とし、標準化は「**FIDO の Agentic Authentication Technical / Payments Technical Working Groups**」で継続 | https://ap2-protocol.org/ | 2026-07-09 | 公式確認済み(発表時 V0.1 の mandate 名から改訂されている点に注意。mandate モデルは活発に変化中) |

### その他の関連標準・提案 と 収斂の動き

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **IBM の ACP(Agent Communication Protocol、BeeAI Platform 発)が 2025-08-29 に A2A へ統合**。「ACP is officially merging with A2A under the Linux Foundation. The ACP team will **wind down active development and contribute its technology and expertise to A2A**」。IBM Research の Kate Blair「build a **single, more powerful standard**」 | https://lfaidata.foundation/communityblog/2025/08/29/acp-joins-forces-with-a2a-under-the-linux-foundations-lf-ai-data/ | 2026-07-09 | 公式確認済み(LF AI & Data 公式コミュニティブログ) |
| **命名の混同に注意**: 「ACP」は 2 系統ある。①IBM/BeeAI の **Agent Communication Protocol**(→ A2A へ統合)②Cisco 主導 **AGNTCY** の **Agent Connect Protocol**(別物)。オンライン解説は両者を混同しがち | https://4sysops.com/archives/comparing-ai-protocols-mcp-a2a-agp-agntcy-ibm-acp-zed-acp/ / https://zuplo.com/blog/agent-protocol-stack-mcp-a2a-acp-2026 | 2026-07-09 | 二次情報(命名整理の参考。公式一次ソース未取得) |
| **AGNTCY(Internet of Agents)**: Cisco(Outshift)主導、2025-07 に Linux Foundation へ寄贈とされる。**Agent Directory Service**(能力・メタデータ・検証可能レコードで DNS 的に発見)+ Agent Connect Protocol 等の「stack」。LangChain・LlamaIndex・Galileo・Dell・Oracle・Red Hat 等が参加 | https://4sysops.com/archives/comparing-ai-protocols-mcp-a2a-agp-agntcy-ibm-acp-zed-acp/ | 2026-07-09 | 二次情報(公式 AGNTCY/LF 一次ソースは今回未取得。存在と概略のみ) |
| **survey(乱立の俯瞰)**: MCP / ACP / A2A / ANP(Agent Network Protocol)を比較する survey が存在(相互運用プロトコルの分類の参考) | https://arxiv.org/html/2505.02279v1 | 2026-07-09 | 二次情報(arXiv プレプリント) |

---

## 変わりやすい項目(定点観測)

記事改訂時・引用時に再確認する項目:

1. **A2A の AAIF 傘下入りの有無**: 2026-07 時点で AAIF 発足プレスの anchored projects は MCP / goose / AGENTS.md のみ。A2A が正式に AAIF 傘下へ編入されたかは**未確認**。次回、linuxfoundation.org / aaif.io で A2A の所属を一次情報で確認する
2. **A2A の仕様バージョン**: 現行 `1.0.0`(初の安定版)。マイナー/拡張(`A2A-Extensions`)の追加が速い。仕様参照は必ず `a2a-protocol.org/latest/specification/`(または版固定 URL)で確認し、Task 状態・discovery 方式の変更を追う
3. **A2A のレジストリ API**: discovery のうちレジストリ方式は「標準 API 未策定」。標準化されたら記事の「発見」節を更新
4. **MCP のリビジョン**: 現行 `2025-11-25`。認可章は毎リビジョンで大きく変わる実績(詳細は agent-identity.md)。AAIF 移管後の SEP プロセスの動きも追う
5. **AAIF の構成**: 発足 2025-12-09。Platinum メンバー・anchored projects・ガバナンスボードは拡張が速い(A2A・AP2・x402 等の編入可能性)
6. **AP2 の mandate モデルとバージョン**: 発表時 V0.1(Intent / Cart / Payment mandate)→ 公式ドキュメントは V0.2(Checkout / Payment mandate、VDC)。**mandate 名・段階・標準化先(FIDO 作業部会)は活発に変化中**。引用時に ap2-protocol.org の当該版を確認
7. **ACP / AGNTCY の収斂**: IBM ACP は A2A へ統合済み(2025-08)。AGNTCY(Agent Connect Protocol / Agent Directory)の位置づけ・A2A との関係は流動的。公式一次ソース(AGNTCY / LF)で再確認
8. **OpenAI 側の相互運用**: AGENTS.md が AAIF anchored project。OpenAI の Apps SDK / ChatGPT の外部エージェント連携方針は今回未精査。platform.openai.com で確認(fetch が 403 になりやすい点は agent-identity.md の注記参照)
9. **認証・認可の IETF 動向**: エージェント固有の認可(ID-JAG・identity-chaining・WIMSE 系)は agent-identity.md で管理。相互運用プロトコルが将来これらを規範参照するかを追う

---

## 参照した URL 一覧(アクセス日 2026-07-09)

### A2A(公式: developers.googleblog.com / linuxfoundation.org / a2a-protocol.org / lfaidata.foundation)
- https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/(発表・設計原則・MCP 相補)
- https://developers.googleblog.com/en/google-cloud-donates-a2a-to-linux-foundation/(LF 寄贈)
- https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents(LF プロジェクト発足)
- https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year(1 周年・150+ 組織・1.0 安定版)
- https://a2a-protocol.org/latest/specification/(仕様本文: Agent Card / capabilities / SendMessage / Task / TaskState / Artifact / securitySchemes / version 1.0.0)
- https://a2a-protocol.org/latest/topics/a2a-and-mcp/(MCP との線引き・相補・比喩)
- https://a2a-protocol.org/latest/topics/enterprise-ready/(opaque / HTTPS / HTTP 層 ID / 認可は実装固有)
- https://a2a-protocol.org/latest/topics/agent-discovery/(well-known URI / レジストリ / プライベート / Agent Card 保護)
- https://a2a-protocol.org/latest/topics/life-of-a-task/(タスク委譲・状態・contextId/taskId・Artifact)
- https://lfaidata.foundation/communityblog/2025/08/29/acp-joins-forces-with-a2a-under-the-linux-foundations-lf-ai-data/(IBM ACP → A2A 統合・TSC 構成)

### MCP / AAIF(公式: anthropic.com / linuxfoundation.org)
- https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation(MCP 寄贈・AAIF 発足・SEP)
- https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation(AAIF 発足・メンバー・anchored projects)

### AP2(公式: cloud.google.com / ap2-protocol.org)
- https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol(発表・3 担保・V0.1 mandate・A2A/MCP 拡張)
- https://ap2-protocol.org/(V0.2 mandate 再編・VDC・FIDO 標準化)

### その他・二次情報(命名整理・俯瞰。公式一次ソース未取得のため確度低)
- https://4sysops.com/archives/comparing-ai-protocols-mcp-a2a-agp-agntcy-ibm-acp-zed-acp/(ACP 2 系統・AGNTCY)
- https://zuplo.com/blog/agent-protocol-stack-mcp-a2a-acp-2026(プロトコルスタック整理)
- https://arxiv.org/html/2505.02279v1(相互運用プロトコル survey・プレプリント)
- https://arxiv.org/pdf/2511.03841(エージェント通信プロトコルのセキュリティ比較・プレプリント)
- https://arxiv.org/pdf/2601.22569(AP2 レッドチーム・プレプリント)

### 相互参照(このライブラリ内)
- [research/professional/agent-identity.md](../professional/agent-identity.md)(IETF/OAuth/MCP 認可仕様・ベンダー Agent ID の深掘り)
