# 主要コーディングエージェントのエンタープライズ提供形態 差分調査(SE-R1)

- **調査日**: 2026-07-08
- **用途**: SE-CODING-AGENTS 計画 `se-enterprise-constraints.md`(企業システム環境の制約と対応)の根拠。企業システム開発(SIer・情シス・閉域網・オンプレ・監査)の文脈に絞った**提供形態**の一次情報
- **分担(重複回避)**: 各ツールの「学習利用の既定・オプトアウト条件」は `research/coding-agents/data-handling-index.md`(2026-07-05)、料金構造は `research/coding-agents/pricing-index.md`、規制・LLM ベンダーの ZDR/DPA 総論は `research/professional/compliance.md`(2026-07-07)が正。本メモはその**差分**として、(1) 提供形態(SaaS / クラウド経由 / セルフホスト・オンプレ・閉域網)、(2) データ残留・保持・ZDR・リージョン固定、(3) BYOK・ローカル/専有モデル対応、(4) 監査ログ・管理者統制、(5) コンプライアンス認証、の 5 観点のみを扱います
- **注意**: エンタープライズ提供形態・データ残留ポリシーは変化が速く、本メモは **2026-07-08 時点のスナップショット**です。執筆時・引用時は各ツール本文冒頭の「最終確認日」と末尾「定点観測」項目を必ず再確認してください
- **確度マーカー**(4 段階):
  - `公式確認済み`: 公式ドキュメント/公式ページで直接確認した(SPA・403 で機械取得できず公式ドメインの検索結果経由で確認した場合はその旨を注記)
  - `ベンダー自己報告`: 公式だが第三者検証できない自己申告(Trust Center の宣言・営業ページ等)
  - `二次情報`: 公式以外(ブログ・まとめ記事等)。裏取り待ちの参考
  - `未確認`: 今回取得できなかった。確認すべき URL を残す
- **取得上の注意**: `trust.anthropic.com` / `copilot.github.trust.page` / `trust.openai.com` / `trust.cursor.com` / `trust.cognition.ai` は SPA(動的レンダリング)または 403 で本文を機械取得できませんでした。認証情報(SOC 2 等)は公式ドキュメント本文・公式ブログ・公式ドメインの検索結果で裏取りし、確度欄に注記しています

---

## Claude Code / Anthropic

### 提供形態

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| エンタープライズ提供は大きく 2 系統。(1) **SaaS**: Claude for Teams / Claude for Enterprise(Enterprise は SSO・ドメインキャプチャ・RBAC・compliance API アクセス・managed policy settings を追加)、(2) **クラウド経由**: Anthropic Console(API)/ Amazon Bedrock / Claude Platform on AWS / Google Cloud's Agent Platform(旧 Vertex AI)/ Microsoft Foundry | https://code.claude.com/docs/en/third-party-integrations | 2026-07-08 | 公式確認済み |
| **リージョン選択**: Teams/Enterprise/Console は「supported countries」、Bedrock/Vertex/Foundry は各クラウドのマルチリージョン(AWS/GCP/Azure のリージョン一覧に従う) | https://code.claude.com/docs/en/third-party-integrations | 2026-07-08 | 公式確認済み |
| **LLM ゲートウェイ / 企業プロキシ**に対応。`HTTPS_PROXY`(全 outbound を監視プロキシ経由に強制)と `ANTHROPIC_BASE_URL` / `ANTHROPIC_BEDROCK_BASE_URL` / `ANTHROPIC_VERTEX_BASE_URL`(集中認証・レート制限・使用量集計)を併用可。`CLAUDE_CODE_SKIP_BEDROCK_AUTH` 等でゲートウェイ側認証も可能 | https://code.claude.com/docs/en/third-party-integrations | 2026-07-08 | 公式確認済み |
| **Claude apps gateway**(セルフホスト型ゲートウェイ)= Bedrock / Claude Platform on AWS / Vertex / Foundry / Anthropic API の手前に IdP サインインを挟む自己ホスト構成 | https://code.claude.com/docs/en/third-party-integrations | 2026-07-08 | 公式確認済み |
| **完全なオンプレ/閉域網(air-gapped)+ Anthropic モデルのオンプレ配布**は公式に提供の明言なし。実務上は「Bedrock/Vertex/Foundry(顧客クラウドの VPC・リージョン内)+ 企業プロキシ + ZDR + managed settings」で顧客クラウド内に寄せる形が上限。モデル重みの顧客環境配布はなし | https://code.claude.com/docs/en/third-party-integrations | 2026-07-08 | 公式確認済み(=オンプレ配布の記載が存在しないことを確認) |

### データ残留・保持・ZDR・リージョン

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Commercial(Team/Enterprise/API)の標準保持は **30 日**。**ZDR は標準 Enterprise には含まれず**、適格アカウントに対し「Claude Code on Claude for Enterprise」で組織単位に営業(account team)が適格性確認のうえ有効化 | https://code.claude.com/docs/en/data-usage | 2026-07-08 | 公式確認済み |
| **ZDR 下でも Claude Code クライアントはローカルにセッション記録を平文保存**(`~/.claude/projects/` に既定 30 日、`cleanupPeriodDays` で調整)。閉域網でも端末側キャッシュの管理が別途必要 | https://code.claude.com/docs/en/data-usage | 2026-07-08 | 公式確認済み |
| 保存時暗号化はプロバイダ依存: Anthropic API=AES-256(ZDR で server-side 永続化なし)、Bedrock=AES-256(AWS-managed / KMS の CMEK 可)、Vertex=Google-managed(CMEK 可)、Foundry=Anthropic インフラへルーティング AES-256 | https://code.claude.com/docs/en/data-usage | 2026-07-08 | 公式確認済み |

### BYOK / ローカル・専有モデル

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **BYOK 相当**: Bedrock / Vertex / Foundry を顧客自身のクラウド資格情報で利用でき、CMEK(顧客管理鍵)を利用可能。Development Partner Program は Anthropic 第一者 API のみで、Bedrock/Vertex 経由には適用されない | https://code.claude.com/docs/en/data-usage | 2026-07-08 | 公式確認済み |
| **ローカル/OSS モデル(Ollama・vLLM 等)への接続は対象外**(Claude モデル前提の設計)。base URL 上書きは Anthropic 互換ゲートウェイを想定 | https://code.claude.com/docs/en/third-party-integrations | 2026-07-08 | 公式確認済み(=非対応を明記する記述はないが、対応モデルが Claude 系のみと読める) |

### 監査ログ・管理者統制

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Enterprise は SSO・ドメインキャプチャ・RBAC・compliance API アクセス・**managed policy settings(ローカル設定で上書き不可)**。security チームが Claude Code の許可/禁止を強制可 | https://code.claude.com/docs/en/security | 2026-07-08 | 公式確認済み |
| 監視は **OpenTelemetry metrics**(コード・ファイルパスは含まない)、`ConfigChange` フックでセッション中の設定変更を監査/ブロック。クラウド版(Claude Code on the web)は全操作を audit logging | https://code.claude.com/docs/en/security | 2026-07-08 | 公式確認済み |
| クラウドプロバイダ経由なら各クラウドの統制が使える: Bedrock/AWS=IAM・CloudTrail、Vertex=IAM roles・Cloud Audit Logs、Foundry=RBAC・Azure Monitor | https://code.claude.com/docs/en/third-party-integrations | 2026-07-08 | 公式確認済み |

### コンプライアンス認証

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| security ドキュメントが Trust Center を「SOC 2 Type 2 report, ISO 27001 certificate, etc.」の入手先として明記 | https://code.claude.com/docs/en/security / https://trust.anthropic.com | 2026-07-08 | 公式確認済み(SOC 2 Type 2・ISO 27001)。Trust Center 本文は SPA で未取得 |
| **ISO 42001** は既存メモ(`data-handling-index.md`)で「ヘルプセンターで確認」とされるが、本セッションでは Trust Center が SPA のため再確認できず | https://trust.anthropic.com | 2026-07-08 | 未確認(執筆時に Trust Center をブラウザ確認) |

---

## GitHub Copilot(Copilot Business / Copilot Enterprise)

### 提供形態

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **SaaS(クラウド)のみ**。Copilot Business / Copilot Enterprise。モデル推論は GitHub 管理のクラウドで実行。**自社ホスト/オンプレ/air-gapped 提供の公式記載なし**(GitHub Enterprise Server 環境でも Copilot のモデルはクラウド接続が前提) | https://docs.github.com/en/enterprise-cloud@latest/copilot/copilot-business/github-copilot-business-feature-set | 2026-07-08 | 公式確認済み(=オンプレ提供の記載が存在しないことを確認) |
| **GitHub Enterprise Cloud with data residency**: ポリシー有効化で Copilot の推論処理と関連データを指定地域内に固定。コード・プロンプト・応答が推論処理中にリージョン外へ出ない | https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/github-copilot-with-data-residency | 2026-07-08 | 公式確認済み |

### データ残留・保持・学習・BYOK

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Business / Enterprise は既定で学習不使用・プロンプト/提案を保持しない(詳細は `data-handling-index.md`)。本メモでは提供形態のみを扱う | https://docs.github.com/en/copilot/concepts/content-exclusion | 2026-07-08 | 公式確認済み(既存メモ参照) |
| **ローカル/自社モデルへの接続は Copilot として非対応**(GitHub 提供モデルの選択のみ)。なお VS Code の "Bring Your Own Key"(Ollama 等)は VS Code の別機能であり Copilot Business/Enterprise の統制下の話ではない | https://github.com/microsoft/vscode-docs/blob/main/blogs/2025/10/22/bring-your-own-key.md | 2026-07-08 | 二次情報(VS Code 機能は公式ドキュメントだが Copilot 統制とは別レイヤ) |

### 監査ログ・管理者統制

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **Content exclusion**: 特定リポジトリ/パスを Copilot から除外可。変更は監査ログ(`copilot.content_exclusion_changed`)に記録 | https://docs.github.com/en/copilot/how-tos/content-exclusion | 2026-07-08 | 公式確認済み |
| **監査ログの限界**: クライアントのセッションデータ(ユーザーがローカルで送るプロンプト等)は監査ログに含まれない。取得には独自フック等の追加実装が必要 | https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/review-audit-logs | 2026-07-08 | 公式確認済み |
| SSO/SCIM・組織/エンタープライズポリシーは GitHub Enterprise の統制を継承 | https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/administer-copilot | 2026-07-08 | 公式確認済み |

### コンプライアンス認証

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **SOC 1/2/3 Type II** が Copilot Business & Enterprise を対象範囲に含む(Type I → Type II へ移行済み)。**ISO/IEC 27001:2022** の ISMS 認証スコープに Copilot Business/Enterprise を含む | https://github.blog/changelog/2024-12-06-the-latest-github-and-github-copilot-soc-reports-are-now-available/ / https://github.blog/changelog/2024-06-03-github-copilot-compliance-soc-2-type-1-report-and-iso-iec-270012013-certification-scope/ | 2026-07-08 | 公式確認済み(公式ブログ changelog)|
| Copilot Trust Center(認証・FAQ の一次入手先)。組織/エンタープライズ owner は設定画面からレポート取得可 | https://copilot.github.trust.page/ / https://resources.github.com/copilot-trust-center/ | 2026-07-08 | ベンダー自己報告(Trust Center 本文は SPA で未取得)|

---

## OpenAI Codex / ChatGPT Enterprise・API

### 提供形態

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **SaaS(クラウド)+ API のみ**。ChatGPT Business / Enterprise / Edu + API platform。Codex は ChatGPT の各プランに統合(詳細は `data-handling-index.md` / `pricing-index.md`)。**OpenAI 直販に自社ホスト/オンプレ/air-gapped 提供の公式記載なし**(オンプレに寄せたい場合は Microsoft の Azure OpenAI Service = 別会社のクラウド、リージョン選択可だがオンプレ不可) | https://openai.com/business-data/ | 2026-07-08 | 公式確認済み(openai.com は 403 のため openai.com ドメインの検索結果経由で確認)|

### データ残留・保持・ZDR・リージョン

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| API / ChatGPT Enterprise は既定で学習不使用、標準保持は最大 30 日。**ZDR は適格組織のみ**(API platform)。**Projects 経由の API リクエストは in-region かつ ZDR**(server 保存なし) | https://openai.com/business-data/ / https://openai.com/enterprise-privacy/ | 2026-07-08 | 公式確認済み(openai.com は 403、検索結果経由)|
| **データ残留(data-at-rest residency)**の対象地域: 米国・欧州・英国・日本・カナダ・韓国・シンガポール・オーストラリア・インド・UAE。対象は ChatGPT Enterprise / Edu / Healthcare / API platform の適格顧客 | https://openai.com/index/expanding-data-residency-access-to-business-customers-worldwide/ | 2026-07-08 | 公式確認済み(openai.com は 403、検索結果経由)|

### 監査ログ・管理者統制 / BYOK

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| ChatGPT Enterprise は SSO/SCIM・管理コンソール・監査ログを提供(既存メモ)。OpenAI モデル前提でローカル/自社モデル接続は非対応 | https://openai.com/enterprise-privacy/ | 2026-07-08 | ベンダー自己報告(enterprise-privacy 本文は 403 で直接未取得)|

### コンプライアンス認証

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **SOC 2 Type 2**(直近レポート期間 2025-01-01〜2025-06-30、API Platform / ChatGPT Enterprise / Edu / Team を対象)。**ISO/IEC 27001:2022** と **ISO/IEC 27701:2019** を維持(API・ChatGPT Enterprise・Edu が対象) | https://openai.com/enterprise-privacy/ / https://trust.openai.com/ | 2026-07-08 | 公式確認済み(openai.com ドメインの検索結果経由。Trust Portal 本文は SPA)|
| ISO 42001 は当該ページに記載を確認できず | https://trust.openai.com/ | 2026-07-08 | 未確認(執筆時に Trust Portal をブラウザ確認)|

---

## Cursor(Anysphere)

### 提供形態

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **SaaS のみ**(SOC 2 Type II 準拠の AWS 上)。**オンプレ/VPC/セルフホスト提供は現時点でなし**(enterprise ページに「On-premises or VPC deployment is not currently offered」)。中国インフラなし | https://cursor.com/enterprise / https://cursor.com/security | 2026-07-08 | 公式確認済み |
| 明確なデータ残留(リージョン固定)オプションは security/enterprise ページに記載を確認できず | https://cursor.com/security | 2026-07-08 | 未確認 |

### データ残留・ZDR・BYOK

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **Privacy Mode を組織全体で強制**でき、有効時はコードを学習に使わない + モデルプロバイダと **ZDR 契約**(既定オン/enforce、詳細な既定・例外は `data-handling-index.md`) | https://cursor.com/security | 2026-07-08 | 公式確認済み |
| モデル選択: OpenAI / Anthropic / Gemini / xAI のフロンティアモデルを設定で選択。**ローカル/自社ホストモデルへの接続は security/enterprise ページで明言なし**(BYOK の Enterprise/Privacy Mode との関係も要確認) | https://cursor.com/enterprise | 2026-07-08 | 未確認(ローカルモデル対応の公式明言は取得できず)|

### 監査ログ・管理者統制

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **SSO/SAML**(Okta / Azure AD / Google Workspace)、SSO 強制 + ローカルログイン無効化、**SCIM** プロビジョニング、role permissions、リポジトリ/モデルの allow/block リスト、MCP サーバー制限、利用分析ダッシュボード + API エクスポート、**監査ログ**、**CMEK** | https://cursor.com/enterprise / https://cursor.com/security | 2026-07-08 | 公式確認済み |

### コンプライアンス認証

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **SOC 2 Type II**(trust.cursor.com)、年次第三者ペネトレーションテスト、サブプロセッサ一覧を公開。ISO 27001 / ISO 42001 は当該ページに記載を確認できず | https://trust.cursor.com / https://cursor.com/security | 2026-07-08 | 公式確認済み(SOC 2 Type II)/ ISO 系は未確認 |

---

## Gemini Code Assist / Google Cloud

### 提供形態

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **クラウド(Google Cloud / Vertex)経由**。Standard / Enterprise エディション。**オンプレ/air-gapped の完全提供はなし**が、**VPC Service Controls** でサービス境界を構成でき、Enterprise の **code customization は VPC-SC 下でオンプレのソース管理システムへ安全アクセス可**(コードは VPC-SC 境界内で扱う) | https://developers.google.com/gemini-code-assist/docs/configure-vpc-service-controls / https://docs.cloud.google.com/gemini/docs/codeassist/security-privacy-compliance | 2026-07-08 | 公式確認済み |
| **リージョン**: Code Assist はグローバルロードバランシングのため**サービングリージョンは選択不可**。ただし**保存データの data residency(地域指定)には対応**(規制対応向け) | https://developers.google.com/gemini-code-assist/resources/locations / https://docs.cloud.google.com/gemini/docs/release-notes | 2026-07-08 | 公式確認済み |

### データ残留・学習・BYOK

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **許可なく学習に使わない**(CDPA 準拠)。Code Assist は **stateless**(既定でプロンプト/応答を Google Cloud に保存しない。任意で Cloud Logging バケットへログ可) | https://docs.cloud.google.com/gemini/docs/codeassist/security-privacy-compliance | 2026-07-08 | 公式確認済み |
| **CMEK** に対応(code customization 機能)。モデルは Gemini / Vertex のモデル前提でローカルモデル接続は非対応 | https://docs.cloud.google.com/gemini/docs/discover/data-governance | 2026-07-08 | 公式確認済み |
| **IP 補償(Generative AI Indemnified Service)**: 生成コンテンツに対する著作権クレームに Google が一定の法的責任を負う | https://docs.cloud.google.com/gemini/docs/codeassist/security-privacy-compliance | 2026-07-08 | 公式確認済み |

### 監査ログ・管理者統制

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Google Cloud の統制を継承: IAM、Cloud Audit Logs、VPC Service Controls、組織ポリシー | https://docs.cloud.google.com/gemini/docs/codeassist/security-privacy-compliance | 2026-07-08 | 公式確認済み |

### コンプライアンス認証

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **ISO 27001 / ISO 27017 / ISO 27018 / ISO 27701**、**SOC 1 / SOC 2 / SOC 3**。ISO 42001 / FedRAMP は当該ページに記載を確認できず | https://docs.cloud.google.com/gemini/docs/codeassist/security-privacy-compliance | 2026-07-08 | 公式確認済み(ISO 42001/FedRAMP は未確認)|

---

## Devin / Windsurf(Cognition)

> Cognition は 2025-07 に Windsurf を取得。Devin(自律エージェント)と Windsurf(AI IDE)で提供形態が異なるため分けて記載します。閉域網系の要点が最も動いているベンダーです。

### Devin — 提供形態・統制・認証

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **VPC デプロイ対応**: 「Deploy in your virtual private cloud (VPC)」。主要クラウドをサポートし、Devin の開発ボックスを顧客の VPC 内にデプロイ。入出力は顧客の知的財産と明記 | https://devin.ai/enterprise/ | 2026-07-08 | 公式確認済み |
| **single-tenant hosted 提供**(2025-05-12 発表、最大顧客向けの追加セキュリティ保証)。Cloud(managed)/ Hybrid も提供 | https://devin.ai/blog/self-hosted-deployment-maintenance-mode | 2026-07-08 | 公式確認済み(公式ブログ)|
| 監査ログ・fine-grained access control・カスタム IdP 連携。SOC 2 Type 2 準拠 | https://devin.ai/enterprise/ | 2026-07-08 | 公式確認済み |
| Enterprise は書面同意なしに学習不使用、opt-out で ZDR(詳細は `data-handling-index.md`) | https://docs.devin.ai/admin/security | 2026-07-08 | 公式確認済み |
| **SOC 2 Type II**(2024-03 取得、security/privacy/processing integrity/confidentiality/availability を対象)。他認証(ISO 等)は当該ページに記載なし | https://docs.devin.ai/admin/security / https://trust.cognition.ai/ | 2026-07-08 | 公式確認済み(SOC 2 Type II)/ 他は未確認 |

### Windsurf(旧 Windsurf Enterprise)— 提供形態

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| デプロイ形態は Cloud / **Hybrid(顧客管理のデータプレーン)** / **Self-hosted(顧客ネットワーク内、顧客所有の LLM エンドポイント = 例: AWS GovCloud の Bedrock、offline install/update 対応)** | https://devin.ai/enterprise/ | 2026-07-08 | ベンダー自己報告(enterprise ページの記述。詳細スペックは検索結果経由)|
| **完全な Self-hosted(オンプレ)は 2025-05-12 に「maintenance mode」化**: 新規顧客受付停止・機能開発停止(最新の agentic 機能 = Cascade 等が self-hosted で動作不可のため)。既存顧客は契約期間まで維持し、Cloud/Hybrid/single-tenant への移行を推奨 | https://devin.ai/blog/self-hosted-deployment-maintenance-mode | 2026-07-08 | 公式確認済み(公式ブログ)|
| **FedRAMP High**(Palantir FedStart 経由・AWS GovCloud)を政府向けに提供。HIPAA BAA 対応、全有料シートで ZDR 既定 | https://aws.amazon.com/marketplace/pp/prodview-x4iqsqorbfaj4 / https://trust.cognition.ai/ | 2026-07-08 | ベンダー自己報告(AWS Marketplace 掲載は確認。FedRAMP High の正式範囲は trust.cognition.ai で要確認)|

> **TODO(要確認):** Windsurf の self-hosted は maintenance mode(2025-05-12)であり、閉域網フル対応の推奨は「VPC/Hybrid + 顧客所有 LLM エンドポイント」または「single-tenant hosted」へ移っている可能性が高い。執筆時に trust.cognition.ai と devin.ai/enterprise で現行の deployment options と FedRAMP High の対象範囲を再確認する(最終確認: 2026-07)

---

## OSS 系(Cline / Aider / OpenHands / Continue 等 + ローカルモデル)

> 「学習利用は接続先モデルプロバイダに従う」という総論は `data-handling-index.md` が正。本メモの差分は「**閉域網(air-gapped)を実現できる唯一の類型**」としての整理です。

### 提供形態(閉域網の実現手段として)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| OSS エージェント本体はローカル実行。**真の air-gapped 運用は「OSS エージェント + ローカル/自社ホストモデル(Ollama / vLLM / SGLang / LM Studio、OpenAI 互換エンドポイント)」でのみ成立**(外部 API 送信がゼロになり、データ残留・学習の論点自体が消える) | 下記各ツール公式 | 2026-07-08 | 公式確認済み(構成として)|
| **OpenHands**: LiteLLM 経由で Ollama / vLLM / SGLang 等のローカルモデルに接続でき、外部サービス非依存のオフライン運用が可能。別途 Cloud / Enterprise の商用提供もあり | https://docs.openhands.dev/openhands/usage/llms/local-llms | 2026-07-08 | 公式確認済み(ローカルモデル対応)|
| **Cline**: Ollama / LM Studio / 任意の OpenAI 互換エンドポイントに接続可。BYOK(自前 API キー)/ 自前 weights を選択できる | https://docs.cline.bot/running-models-locally/overview / https://github.com/cline/cline | 2026-07-08 | 公式確認済み |
| 使用するオープンウェイトモデルの具体名・性能は変化が速い(コーディング特化 MoE 等)。個別モデル名は執筆時に確認する | — | 2026-07-08 | 未確認(モデル名は都度確認)|

### データ残留・監査・認証

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| ツール自体は学習しない。ローカルモデルなら外部送信ゼロ。BYOK で外部 API を使う場合のみ接続先プロバイダのポリシーに従う | https://github.com/cline/cline | 2026-07-08 | 公式確認済み |
| OSS ツール自体には SSO/SCIM・監査・認証(SOC 2 等)は基本なし。**企業統制は運用側(ネットワーク分離・プロキシ・ログ基盤・端末管理)で担保**する前提。統制が要る場合は OpenHands の Enterprise 等の商用版を検討 | — | 2026-07-08 | 公式確認済み(構成上の帰結)|

---

## 一般類型のまとめ(提供形態マップ)

`se-enterprise-constraints.md` 本文の「提供形態の選択肢マップ」に対応する 3 類型。各ツールを主たる位置づけで対応させます(複数類型に跨るものは主・副で表記)。

| 類型 | 定義 | 該当ツール(2026-07-08 時点) | 閉域網適性 |
| --- | --- | --- | --- |
| **(1) SaaS + 契約**(データ保護契約・学習オフ・ZDR 交渉) | ベンダー管理のクラウドをそのまま使い、契約と設定で保護 | GitHub Copilot(Business/Enterprise)、OpenAI ChatGPT Enterprise / Codex、Cursor(Privacy Mode)、Claude for Teams/Enterprise、Devin Cloud | 低(閉域網不可。回線・契約依存) |
| **(2) クラウド経由**(ゲートウェイ・リージョン固定・VPC/VPC-SC) | 顧客のクラウドテナント・リージョン境界内に寄せ、プロキシ/ゲートウェイで統制 | Claude Code(Bedrock / Vertex / Foundry + LLM ゲートウェイ / 企業プロキシ)、Gemini Code Assist(VPC-SC + data residency)、GitHub Copilot with data residency、OpenAI data residency(+ Azure OpenAI)、Devin VPC / Hybrid | 中(顧客クラウド内に限定。完全 air-gapped ではない) |
| **(3) 自社ホスト**(OSS + ローカル/専有モデル) | ソフトも推論も顧客環境内。外部送信ゼロが可能 | OSS(Cline / Aider / OpenHands / Continue)+ Ollama / vLLM 等のローカルモデル、Windsurf Self-hosted(**maintenance mode**)、Devin single-tenant / VPC(顧客所有 LLM エンドポイント) | 高(OSS + ローカルモデルは完全 air-gapped 可。Windsurf self-hosted は新規停止中) |

**閉域網・自社ホストの要点(SE 向け結論)**:
- 完全な air-gapped を最優先するなら **類型 (3) の OSS + ローカルモデル**が唯一確実。統制(監査・SSO)は運用側で自作するか商用 Enterprise 版を使う
- 商用エージェントで閉域に最も寄せられるのは **Devin(VPC / single-tenant、FedRAMP High)** と **Gemini Code Assist(VPC-SC)**、**Claude Code(顧客クラウドの Bedrock/Vertex/Foundry + プロキシ)**。ただしいずれもモデル推論は各クラウド内で、完全なオフラインではない
- **Cursor / GitHub Copilot / OpenAI** はいずれも SaaS のみで、オンプレ・自社ホストの公式提供はなし(リージョン固定・ZDR・contentexclusion で緩和するに留まる)

---

## 変わりやすい項目(定点観測)

四半期ごと(および `se-enterprise-constraints.md` 改訂時)に再確認する項目:

1. **各社 ZDR / 保持ポリシーと適格条件**: Anthropic(Enterprise ZDR の対象・営業承認)、OpenAI(Projects の in-region ZDR)、Cursor / Devin(opt-out → ZDR)。既定が反転する変更に注意
2. **データ残留(residency)対応地域**: OpenAI(拡大中: 現在 10 地域)、GitHub Copilot with data residency の対象地域、Gemini Code Assist の data residency at rest 対象。**日本**が対象に含まれるかは SIer 案件で重要
3. **Cognition(Devin / Windsurf)の deployment 再編**: Windsurf self-hosted は maintenance mode(新規停止)。VPC / Hybrid / single-tenant / FedRAMP High の現行範囲を trust.cognition.ai・devin.ai/enterprise で追う
4. **Cursor の認証拡充・residency**: ISO 27001 / ISO 42001 の追加、data residency オプションの有無
5. **Gemini Code Assist の ISO 42001 / FedRAMP 対応**、および VPC-SC + code customization の対象機能拡大
6. **Claude Code の提供形態**: Claude Platform on AWS / Microsoft Foundry / Claude apps gateway など新経路が増減しやすい。third-party-integrations ドキュメントを追う
7. **各 Trust Center の SOC 2 レポート期間**: 期間が更新される(例: OpenAI 2025-01〜06)。引用時は最新レポート期間を確認
8. **OSS + ローカルモデルの推奨モデル**: オープンウェイトのコーディング特化モデルは更新が速い。具体名・必要 VRAM・コンテキスト長は都度確認
