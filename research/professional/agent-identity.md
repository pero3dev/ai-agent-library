# AI エージェントの認証・認可(agent identity)調査メモ

- **調査日**: 2026-07-06
- **調査目的**: `docs/06-security/agent-identity-and-auth.md` の執筆材料。エージェント ID・委任・認可に関する標準化動向と主要ベンダー機能を、公式一次情報のみで整理する
- **根拠の方針**: IETF(datatracker.ietf.org / RFC)、modelcontextprotocol.io、各社公式ドキュメント・公式プレスリリースのみを根拠とします。個人ブログ・まとめ記事は使用していません。URL はすべて実際にアクセスして内容を確認済みです
- **確度表記**: 「公式明記」= 公式ページに明文あり / 「公式から推測」= 公式記述からの合理的推測 / 「未確認」= 今回確認できず

---

## 1. 委任・トークン関連の標準(IETF)

### 1.1 基盤となる標準

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| RFC 8693「OAuth 2.0 Token Exchange」は 2020 年 1 月発行の Proposed Standard。グラントタイプ `urn:ietf:params:oauth:grant-type:token-exchange` を定義 | https://datatracker.ietf.org/doc/rfc8693/ | 2026-07-06 | 公式明記 |
| RFC 8693 は subject token(誰の代理か)と actor token(実際に行動する主体)を分離し、**impersonation(なりすまし: A は B と区別できない)と delegation(委任: A が B を代理していることが明示される)を区別**する | https://datatracker.ietf.org/doc/rfc8693/ | 2026-07-06 | 公式明記 |
| RFC 8693 の **`act`(actor)クレーム**は「委任が発生したこと」と「行動している当事者」を JWT 内で表現する。ネスト可能で委任チェーンを表せる(最外が現在のアクター)。**`may_act` クレーム**は「ある当事者が別の当事者の代理になることを認可されている」ことを表す | https://datatracker.ietf.org/doc/rfc8693/ | 2026-07-06 | 公式明記 |
| OAuth 2.1 は 2026-07 時点でまだ RFC ではなく Internet-Draft。現行は `draft-ietf-oauth-v2-1-15`(2026-03-02)。IESG 提出のマイルストーンは 2026 年 12 月 | https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/ | 2026-07-06 | 公式明記 |
| OAuth 2.1 の主な変更点: Implicit グラント削除、PKCE 必須化、RFC 6749/6750/8252/9700 等のセキュリティ BCP の統合 | https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/ | 2026-07-06 | 公式明記 |
| 「on-behalf-of(OBO)フロー」という名称は IETF 標準ではなく Microsoft identity platform の実装(`jwt-bearer` グラントによる中間 API の代理アクセス)。IETF 側の一般化は RFC 8693 | https://learn.microsoft.com/en-us/entra/agent-id/agent-oauth-protocols | 2026-07-06 | 公式明記(Microsoft ドキュメントが OBO を自社プロトコルドキュメントとして案内) |

### 1.2 クロスドメイン委任・エージェント向け OAuth 拡張のドラフト

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| `draft-ietf-oauth-identity-chaining-16`「OAuth Identity and Authorization Chaining Across Domains」(2026-06-26)は OAuth WG 文書で、**IESG 提出済み・RFC Editor Queue** まで進行。RFC 8693(Token Exchange)+ RFC 7523(JWT bearer)を組み合わせ、複数トラストドメインをまたいでユーザー ID と認可を伝搬する | https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-chaining/ | 2026-07-06 | 公式明記 |
| `draft-ietf-oauth-identity-assertion-authz-grant-04`「Identity Assertion JWT Authorization Grant(ID-JAG)」(2026-05-21)は OAuth WG 採択済み・Standards Track。著者は Aaron Parecki(Okta)、Karl McGuinness、Brian Campbell(Ping Identity)。企業 IdP の ID トークン/SAML アサーションを subject token として Token Exchange(トークンタイプ `urn:ietf:params:oauth:token-type:id-jag`)し、別アプリの認可サーバーからアクセストークンを得る。**Appendix A.4 に「AI Agent using External Tools」のユースケースが明記** | https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/ | 2026-07-06 | 公式明記 |
| `draft-oauth-ai-agents-on-behalf-of-user-02`「OAuth 2.0 Extension: On-Behalf-Of User Authorization for AI Agents」(2025-08-25)は **WG 未採択の個人ドラフトで、2026-07 時点では expired**。認可リクエストに `requested_actor`、トークン交換に `actor_token` を導入し、user → client → agent の監査可能な委任チェーンをアクセストークンのクレームで表現する提案 | https://datatracker.ietf.org/doc/draft-oauth-ai-agents-on-behalf-of-user/ | 2026-07-06 | 公式明記 |
| `draft-ietf-oauth-client-id-metadata-document-01`「OAuth Client ID Metadata Document(CIMD)」(2026-03-02)は OAuth WG 採択済み。HTTPS URL 自体を `client_id` として使い、その URL にクライアントメタデータ JSON を置くことで事前登録なしのクライアント識別を可能にする(MCP が採用。後述) | https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document/ | 2026-07-06 | 公式明記 |

### 1.3 WIMSE ワーキンググループの動向

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| WIMSE(Workload Identity in Multi System Environments)WG はワークロード ID の伝搬・表現・処理を標準化する IETF WG。憲章は OAuth・JWT・SPIFFE 間の相互運用ギャップを課題として明記。憲章段階では AI エージェントへの言及なし | https://datatracker.ietf.org/wg/wimse/about/ | 2026-07-06 | 公式明記 |
| WG 文書(2026-07 時点): `draft-ietf-wimse-arch-07`(アーキテクチャ、2026-03-02)、`draft-ietf-wimse-http-signature-03`、`draft-ietf-wimse-identifier-02`、`draft-ietf-wimse-mutual-tls-01`、`draft-ietf-wimse-workload-creds-02`(2026-07-02)、`draft-ietf-wimse-wpt-01`(Workload Proof Token)。`draft-ietf-wimse-workload-identity-practices-05` は IESG 審査中 | https://datatracker.ietf.org/wg/wimse/documents/ | 2026-07-06 | 公式明記 |
| AI エージェント関連は**すべて WG 未採択の個人ドラフト**: `draft-ni-wimse-ai-agent-identity-02`(WIMSE Applicability for AI Agents)、`draft-munoz-wimse-authorization-evidence-00`(AI エージェント行為の署名付き認可証跡)、`draft-nennemann-wimse-ect-00`(分散エージェントワークフロー向け Execution Context Token)、`draft-reece-wimse-cross-org-delegation-00`(組織間委任の問題定義)、`draft-jiang-wimse-heterogeneous-credential-01` | https://datatracker.ietf.org/wg/wimse/documents/ | 2026-07-06 | 公式明記 |
| `draft-ni-wimse-ai-agent-identity-02`(2026-02-28、個人ドラフト)は、エージェントにユーザー・デバイスから独立した ID と短寿命クレデンシャルを与え、エージェント ID と所有者 ID を暗号学的に束ねる「dual-identity credential」を提案。OAuth スコープの継承は対象外と明記 | https://datatracker.ietf.org/doc/draft-ni-wimse-ai-agent-identity/ | 2026-07-06 | 公式明記 |

**小括**: 「AI エージェント専用の OAuth 標準」はまだ存在しません。実務で参照すべきは (1) RFC 8693(`act`/`may_act` による委任表現)、(2) WG 採択済みでエージェントユースケースを含む ID-JAG、(3) RFC 目前の identity-chaining の 3 つで、エージェント固有の提案(WIMSE 系・on-behalf-of-user 系)はすべて個人ドラフト段階です。

---

## 2. MCP の認可仕様(2026-07 時点)

### 2.1 現行リビジョンと準拠標準

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| MCP 仕様の現行(Current)プロトコルバージョンは **2025-11-25**(バージョンは `YYYY-MM-DD` 形式で、後方互換性を壊す変更があった日付を示す) | https://modelcontextprotocol.io/specification/versioning | 2026-07-06 | 公式明記 |
| Authorization は MCP 実装にとって **OPTIONAL**。HTTP ベーストランスポートは本仕様に準拠すべき(SHOULD)、**STDIO トランスポートは本仕様に従わず環境から資格情報を取得すべき(SHOULD NOT / 環境変数等)** | https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization | 2026-07-06 | 公式明記 |
| 準拠標準: OAuth 2.1(`draft-ietf-oauth-v2-1-13` を参照)、RFC 8414(AS メタデータ)、RFC 7591(動的クライアント登録)、RFC 9728(Protected Resource Metadata)、CIMD(`draft-ietf-oauth-client-id-metadata-document-00` を参照) | https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization | 2026-07-06 | 公式明記 |

### 2.2 リソースサーバー/認可サーバーの分離

- MCP サーバーは **OAuth 2.1 のリソースサーバー**、MCP クライアントは OAuth 2.1 クライアントとして振る舞います。認可サーバーの実装は仕様のスコープ外で、リソースサーバーと同居しても別エンティティでもよい、と明記されています(公式明記)。
- MCP サーバーは **RFC 9728 Protected Resource Metadata の実装が MUST** で、`authorization_servers` フィールドで自分の認可サーバーの場所を広告します。クライアントは 401 応答の `WWW-Authenticate` ヘッダー(`resource_metadata`)または well-known URI からこれを発見します(公式明記)。
- 認可サーバーのメタデータ発見は RFC 8414 **または OpenID Connect Discovery 1.0** のいずれか(AS 側は少なくとも一方が MUST、クライアントは両対応 MUST)。OIDC Discovery 対応は 2025-11-25 リビジョンでの追加です(公式明記、changelog PR #797)。

### 2.3 クライアント登録(3 方式)

2025-11-25 リビジョンは登録方式を 3 つ定め、優先順位を示しています(公式明記):

1. **事前登録**(既存の関係がある場合)
2. **Client ID Metadata Documents(CIMD)** — HTTPS URL を `client_id` に使う方式。クライアント・AS ともに **SHOULD**。「クライアントとサーバーに事前関係がない」という MCP 最頻出シナリオへの回答で、2025-11-25 で追加(SEP-991)
3. **動的クライアント登録(RFC 7591)** — **MAY** に格下げされ「旧仕様との後方互換のため」と明記

### 2.4 トークン束縛・セキュリティ要件(執筆時に強調すべき点)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| クライアントは RFC 8707 Resource Indicators の `resource` パラメータを認可リクエスト・トークンリクエスト双方に含めることが **MUST**(対象 MCP サーバーの正準 URI を指定) | https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization | 2026-07-06 | 公式明記 |
| MCP サーバーは「自分宛てに発行されたトークンのみ」受理することが MUST。**トークンのパススルー(受け取ったトークンを上流 API へ転送)は明示的に禁止**(confused deputy 対策) | https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization | 2026-07-06 | 公式明記 |
| PKCE は MUST。AS メタデータに `code_challenge_methods_supported` がなければクライアントは処理を中止(MUST) | https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization | 2026-07-06 | 公式明記 |
| 2025-11-25 で `WWW-Authenticate` による**段階的スコープ同意(step-up authorization / insufficient_scope チャレンジ)**が追加(SEP-835)。最小権限のスコープ選択戦略も規定 | https://modelcontextprotocol.io/specification/2025-11-25/changelog | 2026-07-06 | 公式明記 |
| 認可拡張は本体と別リポジトリ `modelcontextprotocol/ext-auth` で管理。2026-07 時点で **Enterprise-Managed Authorization(stable)** と **Client Credentials(draft)** の 2 つ | https://github.com/modelcontextprotocol/ext-auth | 2026-07-06 | 公式明記 |

### 2.5 成熟度の評価

- 認可仕様は 2025-03-26 → 2025-06-18(RS/AS 分離、RFC 9728・RFC 8707 導入)→ 2025-11-25(CIMD、OIDC Discovery、step-up)と**毎リビジョンで大きく変わっています**(公式明記、各版 changelog)。
- 依拠する OAuth 2.1 と CIMD が**どちらもまだ Internet-Draft**(しかも MCP が参照するのは OAuth 2.1 draft-13・CIMD draft-00 と、IETF 側の最新版より古いピン留め)である点は、実装の互換性リスクとして書く価値があります(公式明記の参照バージョンからの整理)。

---

## 3. 主要ベンダーのエージェント ID 機能(2026-07 時点)

### 3.1 Microsoft Entra Agent ID

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **GA(一般提供)**。What's new ページに「Microsoft Entra Agent ID is now generally available」と明記。「Agent ID is available for all Microsoft Entra customers」 | https://learn.microsoft.com/en-us/entra/agent-id/whats-new-agent-id / https://learn.microsoft.com/en-us/entra/agent-id/what-is-microsoft-entra-agent-id | 2026-07-06 | 公式明記 |
| エージェント専用の ID 構造: **agent identity blueprint(テンプレート、親子関係)→ agent identity**。エージェントの実体は agent service principal と、専用メールボックス等を持たせる場合の **agent user account** で表現 | https://learn.microsoft.com/en-us/entra/agent-id/ | 2026-07-06 | 公式明記 |
| 認証は **OAuth 2.0 + Federated Identity Credentials(FIC)による多段トークン交換**。全エージェントは confidential client で、**対話型(/authorize)フローとパブリッククライアントは非サポート**。サポートグラントは `client_credentials` / `jwt-bearer`(OBO)/ `refresh_token`。資格情報は managed identity が推奨で、本番でのクライアントシークレット使用は非推奨と警告 | https://learn.microsoft.com/en-us/entra/agent-id/agent-oauth-protocols | 2026-07-06 | 公式明記 |
| 3 つの動作モード: (1) ユーザー代理(OBO)の対話型エージェント、(2) 自律(app-only)、(3) エージェント専用ユーザーアカウントでの自己動作 | https://learn.microsoft.com/en-us/entra/agent-id/agent-oauth-protocols | 2026-07-06 | 公式明記 |
| 保護・ガバナンス: エージェント向け条件付きアクセス(自律型/OBO 型/高リスクブロックのテンプレート)、ID Protection(risky agents)、ID Governance(アクセスパッケージ、スポンサーのライフサイクルワークフロー)、ネットワーク制御、**サインイン/監査ログ**。「すべてのエージェント認証とアクティビティはコンプライアンスと監査のためログされる」 | https://learn.microsoft.com/en-us/entra/agent-id/what-is-microsoft-entra-agent-id | 2026-07-06 | 公式明記 |
| プラットフォームは OAuth 2.0、**MCP、A2A** をサポートと明記。**非 Microsoft エージェント(AWS Bedrock、n8n 等)も Auth SDK(sidecar)または workload identity federation で統合可能** | https://learn.microsoft.com/en-us/entra/agent-id/what-is-microsoft-entra-agent-id | 2026-07-06 | 公式明記 |
| 課金: Agent ID 自体は全 Entra 顧客が利用可。セキュリティ機能の拡張には Microsoft 365 E7 または E5 + Microsoft Agent 365 ライセンス等が必要。エージェント登録の管理画面は Microsoft Agent 365 に統合されつつある | https://learn.microsoft.com/en-us/entra/agent-id/what-is-microsoft-entra-agent-id | 2026-07-06 | 公式明記 |

補足: 管理センターの作成ウィザードなど一部機能は Preview 表記(公式明記、whats-new)。

### 3.2 AWS(Amazon Bedrock AgentCore Identity)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Amazon Bedrock AgentCore は **2025-10-13 に GA**。GA 発表に AgentCore Identity が含まれ、「identity-aware authorization、リフレッシュトークンのセキュアな vault 保存、OAuth 対応サービスとのネイティブ統合」と明記 | https://aws.amazon.com/about-aws/whats-new/2025/10/amazon-bedrock-agentcore-available/ | 2026-07-06 | 公式明記 |
| AgentCore Identity は AI エージェント向けの ID・資格情報管理サービス。**エージェント ID は「エージェント固有属性を持つ特化型ワークロード ID」として実装**され、「業界標準のワークロード ID パターンとの互換性を維持」と明記。各エージェントに一意の ARN(`workload-identity/...`)を付与 | https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/identity.html / https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/key-features-and-benefits.html | 2026-07-06 | 公式明記 |
| **インバウンド認証**(エージェント自身への呼び出し): IAM SigV4 または JWT オーソライザー(開発者ガイドに「Configure inbound JWT authorizer」の章)。**アウトバウンド認証**(エージェントから外部サービス): OAuth 2.0 client credentials(2LO)/ authorization code(3LO、ユーザー委任)/ API キー | https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/identity.html / https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/key-features-and-benefits.html | 2026-07-06 | 公式明記 |
| **Token vault**: OAuth トークン・クライアントクレデンシャル・API キーを KMS 暗号化で保管。同一トラストドメイン内の呼び出しでも毎回検証し、「悪意ある/誤動作するエージェントコードからエンドユーザーデータを守るため」と明記 | https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/key-features-and-benefits.html | 2026-07-06 | 公式明記 |
| 組み込み OAuth プロバイダー(Google、GitHub、Slack、Salesforce、Atlassian)+ 任意の OAuth 2.0 準拠サーバー向けカスタムプロバイダー。SDK は `@requires_access_token` / `@requires_api_key` の宣言的デコレーターを提供。全操作はセキュリティ監視・コンプライアンス向けにログされる | https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/key-features-and-benefits.html | 2026-07-06 | 公式明記 |

### 3.3 Google Cloud(Agent Identity)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Google Cloud IAM の **Agent Identity** は 2026-07 時点で **Preview**(Pre-GA Offerings Terms 適用と明記) | https://docs.cloud.google.com/iam/docs/agent-identity-overview | 2026-07-06 | 公式明記 |
| エージェントごとに **SPIFFE 標準に基づく一意の SPIFFE ID** と X.509 証明書(有効期間 24 時間、自動更新)を割り当て。「強く証明(attest)され、エージェントのライフサイクルに紐づき、ホストされるリソース URI に直接マップされる」 | https://docs.cloud.google.com/iam/docs/agent-identity-overview | 2026-07-06 | 公式明記 |
| エージェントは `principal://TRUST_DOMAIN/...` 形式の **IAM プリンシパル**になり、直接権限を付与できる。サービスアカウントよりも安全なプリンシパルと位置づけ。アクセストークンはエージェントの X.509 証明書に**暗号学的に束縛(certificate-bound tokens、mTLS バインディング)**され、Google 管理の Context-Aware Access ポリシーで意図されたランタイム外からの利用を防ぐ | https://docs.cloud.google.com/iam/docs/agent-identity-overview | 2026-07-06 | 公式明記 |
| **Auth manager**(Preview): アウトバウンドのツール認証向け中央資格情報 vault 兼ブローカー。API キー、OAuth クライアント ID/シークレット、またはエンドユーザーのアクセストークンによる OAuth 委任(ユーザー代理)を設定できる | https://docs.cloud.google.com/iam/docs/agent-identity-overview | 2026-07-06 | 公式明記 |
| IAM の allow/deny ポリシー、Principal Access Boundary、VPC Service Controls(Preview)に対応。対応ランタイムは Gemini Enterprise Agent Platform Runtime と Gemini Enterprise | https://docs.cloud.google.com/iam/docs/agent-identity-overview | 2026-07-06 | 公式明記 |
| 旧 Vertex AI Agent Engine のドキュメント URL は Gemini Enterprise Agent Platform のドキュメントへリダイレクトされる(製品名の再編) | https://docs.cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/agent-identities | 2026-07-06 | 公式から推測(リダイレクトと新ページの表記から) |
| Agentspace 固有のエージェント認証機能 | — | 2026-07-06 | 未確認(2025 年に Gemini Enterprise へのブランド再編があった模様だが、公式一次情報での確認は今回できず) |

### 3.4 Okta / Auth0

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Okta は 2025-06-23 に **Cross App Access(XAA)** を発表。「AI エージェントを保護するための新しいプロトコル」「OAuth の拡張」と明記。MCP はエージェント間の透明性を高めるが「アクセス管理はしてくれない」ことを課題として提示 | https://www.okta.com/newsroom/press-releases/okta-introduces-cross-app-access-to-help-secure-ai-agents-in-the/ | 2026-07-06 | 公式明記 |
| 2025-09-25 の発表時点で XAA は「Okta Platform 内で EA(Early Access)として提供中」。「Okta for AI Agents」は Phase 1 が FY27 Q1 に EA、Phase 2 が FY27 に GA 予定 | https://www.okta.com/newsroom/press-releases/new-okta-innovations-secure-the-ai-driven-enterprise-and-combat-/ | 2026-07-06 | 公式明記 |
| 2026-06-23 の発表: XAA エコシステムに **25 社以上**(Anthropic、Slack、Zoom、Atlassian、Cursor、VS Code 等)。**XAA は「オープンでベンダー中立なプロトコル」として MCP の公式認可拡張(Enterprise-Managed Authorization)に正式採用**され、MCP 公式 SDK(TypeScript / Java)がネイティブ対応。Okta Workforce 顧客は 2026 年 8 月から Okta Integration Network 経由で、Auth0 B2B SaaS 顧客は 2026 年 7 月末に early access | https://www.okta.com/newsroom/press-releases/okta-announces-cross-app-access-partners/ | 2026-07-06 | 公式明記 |
| XAA の標準面の実体は OAuth WG の **ID-JAG ドラフト**(著者に Okta の Aaron Parecki。1.2 節参照) | https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/ | 2026-07-06 | 公式明記(著者所属から。「XAA = ID-JAG」の対応付け自体は公式から推測) |
| Auth0 の AI エージェント向け製品(ドキュメント上の名称は「Auth0 for AI Agents」、旧称 Auth for GenAI): (1) ユーザー認証(OAuth 2.0 / OIDC、対話型・ヘッドレス両対応)、(2) **Token Vault**(サードパーティ API トークンの取得・保管・リフレッシュを代行)、(3) **非同期認可**(CIBA 等の標準による human-in-the-loop 承認)、(4) RAG 向け細粒度認可(Auth0 FGA によるドキュメント単位のアクセス制御)。LangChain / LlamaIndex / Vercel AI / Google Genkit 等と統合 | https://auth0.com/ai/docs | 2026-07-06 | 公式明記 |
| Auth0「Auth for GenAI」の GA / preview の別 | — | 2026-07-06 | 未確認(auth0.com/ai と docs に availability の明記を発見できず。Okta の 2025-09-25 リリースでは XAA の Auth0 対応が「soon available」との表現) |

### 3.5 Anthropic

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Claude API の認証は API キーと **Workload Identity Federation(WIF)** の 2 方式を公式ドキュメント化。WIF は「本番ワークロード(AWS、Google Cloud、Azure、CI/CD、Kubernetes)で静的シークレットを排除したい場合」に推奨され、IdP 発行の JWT を `POST /v1/oauth/token` で短寿命トークンに交換する。**対応 IdP の例に SPIFFE、Microsoft Entra ID、Okta、GitHub Actions、Kubernetes を明記** | https://platform.claude.com/docs/en/manage-claude/authentication | 2026-07-06 | 公式明記 |
| 同ページは「フェデレーションは長寿命 API キーを環境から排除し、漏えい時の影響範囲を縮小する。ただし信頼チェーンは IdP の設定の強さまで」と注意も明記。API キーには「シークレットマネージャで保管・定期ローテーション」を推奨 | https://platform.claude.com/docs/en/manage-claude/authentication | 2026-07-06 | 公式明記 |
| Managed Agents の **Vaults**: エージェントが使うサードパーティ資格情報(MCP OAuth / static bearer / 環境変数シークレット)を Anthropic 側で保管。シークレット値は**書き込み専用で API 応答に返らない**。MCP OAuth はリフレッシュトークンで自動更新。環境変数型はサンドボックス内では**不透明なプレースホルダ**のみ見え、実値は**エグレス時に差し替え**られる(「エージェントはシークレット値を見ない」)。`allowed_hosts` で差し替え先ホストを制限し、「エージェントが必要とする権限だけに API キーをスコープせよ(blast radius の限定)」と明記 | https://platform.claude.com/docs/en/managed-agents/vaults | 2026-07-06 | 公式明記 |
| MCP の認可仕様(2 節)は Anthropic が主導する MCP プロジェクトの公式仕様であり、Anthropic のエージェント資格情報に関する推奨の一部とみなせる | https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization | 2026-07-06 | 公式から推測 |

### 3.6 OpenAI

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 公式 Agents SDK(Python)ドキュメントは、資格情報の既定を **`OPENAI_API_KEY` 環境変数**とし、起動前に環境変数を設定できない場合のみ `set_default_openai_key()` を使う、という環境変数ベースの構成を案内(コードへの埋め込みは示していない) | https://openai.github.io/openai-agents-python/config/ | 2026-07-06 | 公式明記 |
| OpenAI のエージェント資格情報に関するより包括的な推奨(API キー安全ベストプラクティス記事、Connectors/MCP の認可ガイド等) | https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety | 2026-07-06 | 未確認(help.openai.com / platform.openai.com は fetch が 403 で内容確認不可) |

---

## 4. 監査・帰属(エージェントの行為を人間に帰属させる仕組み)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 標準側の基本語彙は RFC 8693 の **`act` クレーム**(ネストで委任チェーン全体を表現、最外が現在のアクター)と **`may_act` クレーム**(代理権限の事前表明)。「委任が発生したこと」と「誰が誰の代理で行動しているか」をトークン自体に刻む | https://datatracker.ietf.org/doc/rfc8693/ | 2026-07-06 | 公式明記 |
| ID-JAG(WG 採択ドラフト)はクロスドメインでもユーザーのアイデンティティコンテキストを保持したままエージェントにツールアクセスさせる設計で、リソース側 AS が audience・クライアント束縛・subject を検証してローカルポリシーを適用する | https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/ | 2026-07-06 | 公式明記 |
| expired の個人ドラフト `draft-oauth-ai-agents-on-behalf-of-user` は「user → client app → agent の監査可能な委任チェーン」をアクセストークンのクレームで文書化することを目的に掲げていた(方向性の参考) | https://datatracker.ietf.org/doc/draft-oauth-ai-agents-on-behalf-of-user/ | 2026-07-06 | 公式明記 |
| WIMSE 系個人ドラフト `draft-munoz-wimse-authorization-evidence-00` は「WIMSE 認可済み AI エージェント行為の署名付き認可証跡レコード」を提案(ごく初期段階) | https://datatracker.ietf.org/wg/wimse/documents/ | 2026-07-06 | 公式明記(存在とタイトル) |
| ベンダー実装: Entra Agent ID は全エージェント認証・活動をサインイン/監査ログに記録し、所有者(owner)・スポンサー(sponsor)という**人間側の責任者をエージェント ID に紐づける管理関係**を持つ。OBO 型/自律型で別々の条件付きアクセステンプレートを提供 | https://learn.microsoft.com/en-us/entra/agent-id/ / https://learn.microsoft.com/en-us/entra/agent-id/whats-new-agent-id | 2026-07-06 | 公式明記 |
| AWS AgentCore Identity は「ユーザーに代わって行動しつつ監査証跡とアクセス制御を維持する」ことを明記し、全操作を詳細コンテキスト付きでログする。3LO(authorization code)でユーザーの明示同意を取る | https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/identity.html / https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/key-features-and-benefits.html | 2026-07-06 | 公式明記 |
| Auth0 は「エージェントを識別し、誰を代理しているかを定義し、行為を検証済みユーザー ID にアンカーして監査証跡を作る」ことを Agent Identity 機能として提示。センシティブ操作は CIBA 等による非同期のユーザー承認(human-in-the-loop)を推奨 | https://auth0.com/ai / https://auth0.com/ai/docs | 2026-07-06 | 公式明記 |

---

## 5. SPIFFE/SVID などワークロード ID のエージェント適用

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| IETF WIMSE WG は OAuth・JWT・**SPIFFE** の相互運用ギャップを埋めることを憲章に掲げる。ワークロード ID をエージェントに適用する議論の受け皿になっており、AI エージェント適用の個人ドラフトが複数提出されている(1.3 節) | https://datatracker.ietf.org/wg/wimse/about/ / https://datatracker.ietf.org/wg/wimse/documents/ | 2026-07-06 | 公式明記 |
| **Google Cloud Agent Identity はエージェントに SPIFFE ID を直接割り当てる**(X.509 証明書 + 証明書束縛トークン。3.3 節)。ワークロード ID 標準のエージェント適用としては 2026-07 時点で最も明示的な商用実装 | https://docs.cloud.google.com/iam/docs/agent-identity-overview | 2026-07-06 | 公式明記(「最も明示的」の評価は公式から推測) |
| AWS AgentCore Identity はエージェント ID を「業界標準のワークロード ID パターンと互換な特化型ワークロード ID」と位置づける(SPIFFE の名指しはなし) | https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/identity.html | 2026-07-06 | 公式明記 |
| Microsoft は非 Microsoft プラットフォーム上のエージェントを **workload identity federation** で Entra Agent ID に統合する経路を公式に案内 | https://learn.microsoft.com/en-us/entra/agent-id/what-is-microsoft-entra-agent-id | 2026-07-06 | 公式明記 |
| Anthropic は Claude API の Workload Identity Federation の対応 IdP に **SPIFFE** を明記(エージェントワークロードがキーレスで API 認証できる) | https://platform.claude.com/docs/en/manage-claude/authentication | 2026-07-06 | 公式明記 |
| SPIFFE プロジェクト(spiffe.io / CNCF)自身による AI エージェント向けの公式声明・仕様拡張 | — | 2026-07-06 | 未確認(今回の調査では一次情報を確認できず) |

---

## 執筆時の注意(変わりやすい項目)

執筆する `docs/06-security/agent-identity-and-auth.md` では、以下は断定を避けるか `TODO(要確認)` を付けてください。

1. **OAuth 2.1 の RFC 化**: 2026-07 時点で draft-15、IESG 提出マイルストーンは 2026 年 12 月。RFC 番号が付いたら本文・MCP 関連の記述を更新する必要があります。
2. **MCP 仕様のリビジョン**: 現行 2025-11-25。認可章は毎リビジョンで大きく変わってきた実績があり(DCR 中心 → RFC 9728 分離 → CIMD 中心)、次期リビジョンで CIMD の参照版更新や拡張(ext-auth)の本体取り込みがあり得ます。仕様参照は必ずバージョン付き URL で書くこと。
3. **IETF のエージェント系ドラフト**: ID-JAG(draft-ietf-oauth-identity-assertion-authz-grant)と identity-chaining は改版・RFC 化が近い可能性が高い一方、WIMSE の AI エージェント系・on-behalf-of-user 系はすべて個人ドラフトで、消滅(expired)・改名・WG 採択のいずれもあり得ます。ドラフト名とリビジョンを固定して書かない。
4. **ベンダーの提供状況(GA / Preview / EA)**:
   - Google Cloud Agent Identity は Preview(Pre-GA)。GA 時に仕様・課金が変わる可能性を明記。
   - Okta XAA は 2026-08 に Okta Integration Network での提供開始予定、Auth0 B2B は 2026-07 末 early access 予定という「予定」ベースの情報を含む。
   - Auth0「Auth for GenAI」の GA/preview は未確認のまま。
   - Microsoft Entra Agent ID は GA だが、作成ウィザードなど一部 Preview 機能が混在し、管理面は Microsoft Agent 365 への統合が進行中(構成が動く)。
5. **製品名の変動**: Google は Vertex AI Agent Engine → Gemini Enterprise Agent Platform への再編が進行中で、Agentspace 系の名称も変わっている可能性が高い(未確認)。Auth0 も「Auth for GenAI」→「Auth0 for AI Agents」と表記が揺れている。名称は「2026-07 時点では」の限定付きで書く。
6. **ライセンス・料金**(Microsoft Agent 365 ライセンス要件等)は特に変わりやすく、本文には書かず公式ページへのリンクに留めるのが安全。
7. **OpenAI の推奨**: 今回 help.openai.com / platform.openai.com が fetch 不可(403)で、Agents SDK ドキュメント以外は未確認。執筆前に `TODO(要確認): OpenAI のエージェント資格情報に関する公式推奨(API キー安全ベストプラクティス、Connectors の OAuth)を platform.openai.com で確認する(最終確認: 2026-07)` を残すこと。
