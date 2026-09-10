# 先端応用の概観(科学研究支援・シミュレーション/NPC・エージェント経済)執筆前調査メモ(DA-R2)

- **調査 ID**: DA-R2
- **調査日 / 確認日**: 2026-07-09(初回)、2026-09-10(EM01〜EM08 の更新)。旧記録の確認日を一律更新していません
- **用途**: DOMAIN-AGENTS 計画の**鮮度管理型**記事「先端応用の概観(科学研究支援・シミュレーション/NPC・エージェント経済)」の裏取り。記事本文は各領域の「**何が実証済みで何が構想か**」を読者が見分けられることを主目的とするため、このメモでも**実証/構想の区別**を最重視します
- **方針の注意**: 取り組み間の**優劣比較・ランキングはしない**。各取り組みの「位置づけ」と「到達度(どこまで自律・どこから人手か)」の整理に徹します。変化が非常に速い領域のため、確度・確認日・実証/構想の別を必ず添え、曖昧なものは「未確認」「構想」に倒します(憶測で「実証」と書かない)
- **確度マーカー**(4 段階):
  - `公式確認済み`: 公式ページ/査読論文/公式仕様を確認した。**本文を直接取得**したものは「(直接取得)」、SPA・検索結果スニペット経由で本文未取得のものは「(検索経由)」と付記
  - `ベンダー・著者自己報告`: 公式・著者由来だが第三者検証がない自己申告。**査読前プレプリント(preprint)**・企業ブログ・「世界初」等の自己申告主張はここに含める
  - `二次情報`: 公式以外(ニュース・まとめ記事・業界誌)。裏取り待ちの参考
  - `未確認`: 今回取得できなかった。確認すべき URL を残す
- **実証・構想の別**(記事の軸。各事実に必ず付ける):
  - `実証(査読)`: 査読付き論文で報告された結果
  - `実証(稼働)`: 公式リリース済み・実際に稼働している製品/システム/取引
  - `実証(査読前)`: 実験・定量評価はあるがプレプリント段階(査読前)
  - `構想/仕様`: 標準仕様・提案・フレームワークの公表(まだ本番システムそのものではない)
  - `構想/研究プロトタイプ`: 研究デモ・限定デモ・概念枠組み
- **取得上の注意**:
  - 2026-09-10 の更新では末尾の EM01〜EM08 に一次資料・確認範囲を記録しています。旧メモの検索経由の情報と区別してください。
  - arXiv に掲載されていることだけで査読前とは判断しません。個別の出版情報と、確認できた版・範囲を記録します。
  - 性能主張(「X 倍高速」「91% 阻害」等)・「世界初」「end-to-end 自律」等の主張は、**出典が自己申告か第三者検証か**を必ず注記しています

---

## 調査サマリ(2026-09-10)

- 科学研究では Robin と AI co-scientist の査読出版を確認しました。人が実験する工程と Agent が担う工程を区別します。A-Lab の新規性・同定数は訂正文を基準にしました。
- 社会シミュレーションは論文の版・指標・分母を固定します。1,052 人研究 v3 の値は本人再回答との比率であり、人間一般の行動予測精度ではありません。PUBG Ally は期間限定ベータの提供範囲が確認できます。
- 決済は AP2 v0.2 の仕様、ChatGPT の商品発見・加盟店 checkout 方針、カード網の実取引 pilot を区別します。仕様公開・実取引・一般提供・継続取引量は別の証拠です。

## 領域別メモ

以下、本節の事実の**確認日はすべて 2026-07-09**。表の列は 事実 / 出典 / 確度 / 実証・構想の別。

### 領域 1: 科学研究支援

| 事実 | 出典 URL | 確度 | 実証・構想 |
| --- | --- | --- | --- |
| **Google Co-Scientist**: Gemini ベースのマルチエージェント。専門エージェントが仮説を「生成・討論・順位付け・進化」させる(AlphaGo/AlphaStar 的な"アイデアのトーナメント")。文献・構造化 DB に対して検証可能な研究方向を提案 | https://deepmind.google/blog/co-scientist-a-multi-agent-ai-partner-to-accelerate-research/ | 公式確認済み(直接取得) | 実証(稼働。Gemini for Science 経由で研究者に実験的提供) |
| Co-Scientist の**自律度**: 「研究のパートナーであって、科学的/臨床的専門性の代替ではない」と公式明記。AI が仮説を出し、**研究者が実験で検証**するハイブリッド | 同上 | 公式確認済み(直接取得) | 実証(稼働)+ 人手検証前提 |
| Co-Scientist の**検証済み事例**: 肝線維化で瘢痕関連応答の 91% を阻害する創薬リポジショニング候補を同定(ラボ検証)、細胞老化の遺伝的リードを実験で確認、感染症で病原タンパクを特定アミノ酸まで絞り込み。細菌 DNA 転移では Penadés 研究チームが数年かけ到達した仮説と同一のものを短時間で提示 | 同上 / https://www.imperial.ac.uk/news/261293/googles-ai-co-scientist-could-enhance-research/ | 公式確認済み(直接取得)。ただし**「91%」「数週間→数日」等の数値は協働研究者の自己報告** | 実証(湿式検証あり)+ 数値は自己報告 |
| **Virtual Lab**(Stanford J. Zou + CZ Biohub J. Pak): 人間が「PI エージェント」を作り、PI が専門エージェント群を編成・指揮。ESM/AlphaFold-Multimer/Rosetta の計算パイプラインを構成し、**SARS-CoV-2 変異株向け nanobody を 92 個設計・実験検証、2 個で結合改善**。Nature 2025-07-29 | https://www.nature.com/articles/s41586-025-09442-9 / https://biohub.org/news/with-no-need-for-sleep-or-food-ai-built-scientists-get-the-job-done-quickly/ | 公式確認済み(検索経由。nature.com URL 特定・本文未取得) | 実証(査読 + 湿式検証) |
| Zou は「**課題性のある研究問題を最初から最後まで自律 AI エージェントが解いた初の実証**」と表現(=「初」は著者の自己申告)。実験実行・パイプライン設計は人間が関与 | https://www.technologynetworks.com/informatics/news/researchers-create-virtual-scientists-to-solve-complex-biological-problems-402897 | ベンダー・著者自己報告(「初」の主張) | 実証(査読)だが「初」は自己申告 |
| **Coscientist**(CMU, Gomes 研 / Boiko ら): GPT-4 等の複数 LLM エージェントが検索・文書取得・コード実行・ロボット実験 API を統合し、**Pd 触媒クロスカップリング反応の自律最適化**等 6 課題を実施。Nature 2023(624:570-578) | https://www.cmu.edu/chemistry/news/2023/1220_ai-coscientist-automates-discovery.html / https://doi.org/10.1038/s41586-023-06792-0 | 公式確認済み(検索経由。CMU 公式 + Nature DOI 特定・本文未取得) | 実証(査読)。ただし既知反応系の最適化デモで、新規発見ではない |
| PaperQA2(Robin の文献エージェントの基盤)は「文献検索・要約で専門家級」と自社が主張、OSS 公開 | https://intuitionlabs.ai/articles/futurehouse-ai-agents-platform | ベンダー・著者自己報告(ベンチマークは自己申告) | 実証(稼働・OSS)だが性能主張は自己報告 |
| **Sakana The AI Scientist-v2**: タイトルから参考文献まで論文を自律生成。3 本投稿し **1 本が ICLR 2025 ワークショップ(ICBINB)査読を平均 6.33 で通過**(受理閾値超え) | https://sakana.ai/ai-scientist-first-publication/ / https://arxiv.org/abs/2504.08066 | 公式確認済み(Sakana ページは直接取得) | 実証(限定。ワークショップ査読通過)/構想寄り |
| Sakana 自身の**カギとなる但し書き**: 主催者・ICLR 指導部は実験に「full cooperation」で事前承知/**出版前に取り下げ**(AI 生成論文を出すべきか未合意のため)/受理は 3 本中 1 本のみ/**ワークショップ級で本会議トラックではない**/自社の本会議基準は不通過/引用誤り・再現性の懸念あり | https://sakana.ai/ai-scientist-first-publication/ | 公式確認済み(直接取得) | 到達度の限界を公式が明示 |
| **self-driving lab 一般**: 動的フロー実験で従来比 **10 倍超のデータ**を高速収集する技術を報告(NC State、Nature Chemical Engineering 2025)。SDL 2.0(柔軟・スケーラブル・協働型)への流れをレビューが整理 | https://news.ncsu.edu/2025/07/fast-forward-for-self-driving-labs/ / https://pubs.rsc.org/en/content/articlehtml/2026/mh/d5mh01984b | 二次情報 + 公式確認済み(検索経由。査読誌) | 実証(査読・個別技術)だが自律範囲はドメイン限定 |

### 領域 2: シミュレーション・NPC / 生成エージェント

| 事実 | 出典 URL | 確度 | 実証・構想 |
| --- | --- | --- | --- |
| **Generative Agents**(Park ら, Stanford/Google): Smallville に 25 体の LLM エージェント。記憶・内省・計画のアーキテクチャで、起床・出勤・関係形成・イベント調整等の人間らしい行動が創発。**UIST 2023 ベストペーパー**(査読付き) | https://dl.acm.org/doi/fullHtml/10.1145/3586183.3606763 / https://arxiv.org/pdf/2304.03442 | 公式確認済み(検索経由。ACM DL / arXiv 特定・本文未取得) | 実証(査読)。ただし研究デモ(製品ではない) |
| **Altera Project Sid**: Minecraft で 10〜1,000+ 体。PIANO(Parallel Information Aggregation via Neural Orchestration)アーキテクチャ。役割分化、集団規則の遵守/変更、文化・宗教の伝播が創発(商人ハブ形成、Google Docs で憲法を投票・改正、宗教を賄賂で伝播 等) | https://arxiv.org/abs/2411.00114 / https://github.com/altera-al/project-sid | ベンダー・著者自己報告(**arXiv 2024-11=査読前**) | 構想/研究プロトタイプ(逸話は再現性未確立) |
| **合成ユーザー(synthetic users)による製品/UX テスト**: 速度・コストの利点はあるが妥当性に強い疑義。12 論文レビューで肯定 9・否定 14。sycophancy(不自然に好意的で欠陥を見逃す)、多様性/ばらつきの欠如、user drift(RCT 模倣が楽観に偏る)等。「人間調査の**置き換えではなく補完**」が主流 | https://measuringu.com/review-of-experiments-with-synthetic-users/ / https://interactions.acm.org/blog/view/the-challenges-of-synthetic-users-in-ux-research | 二次情報 + 公式確認済み(検索経由。ACM Interactions) | 検証は否定寄り(実証は限定的) |

### 領域 3: エージェント経済(agent economy)

| 事実 | 出典 URL | 確度 | 実証・構想 |
| --- | --- | --- | --- |
| **MCP**(Anthropic, 2024-11 公表): AI とデータ/ツールを繋ぐオープン標準。**OpenAI が 2025-03(Agents SDK / Responses API / ChatGPT desktop)、Google DeepMind が 2025-04(Gemini)採用表明**。サーバ 5,800+/クライアント 300+、DL 800 万+。2025-12 に Linux Foundation 傘下の Agentic AI Foundation(AAIF、Anthropic/Block/OpenAI 共同設立)へ寄贈 | https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation / https://en.wikipedia.org/wiki/Model_Context_Protocol | ベンダー・著者自己報告 + 二次情報(検索経由。Anthropic 公式 URL 特定・本文未取得) | 実証(稼働・広範採用)。ただし"通信/ツール接続"の標準であり取引経済ではない |
| **A2A**(Google, 2025-04 公表): エージェント間の発見・情報交換・協調の標準。**2025-06 に Linux Foundation へ寄贈**(AWS/Cisco/Google/Microsoft/Salesforce/SAP/ServiceNow らで設立)。支持 100〜150+ 社 | https://developers.googleblog.com/en/google-cloud-donates-a2a-to-linux-foundation/ / https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents | 公式確認済み(検索経由。Google 開発者ブログ / Linux Foundation プレス特定・本文未取得) | 実証(仕様稼働・OSS)。エージェント間通信の標準 |
| **Coinbase x402**: 2025-05 公開。HTTP 402(Payment Required)を使い、API/アプリ/AI エージェントがステーブルコインで即時決済。EVM(Base/Polygon/Arbitrum 等)+ Solana 対応、プロトコル手数料ゼロ。**2026-03 時点で Base 上 1.19 億件・Solana 3,500 万件・年換算 〜$6 億**と報告 | https://www.coinbase.com/developer-platform/discover/launches/x402 / https://docs.cdp.coinbase.com/x402/welcome | ベンダー・著者自己報告(Coinbase 公式 + **取引量数値は自己/エコシステム集計**、検索経由) | 実証(稼働)。ただし数値は自己報告、暗号資産レール前提 |
| **DeepMind「Virtual Agent Economies」**(Tomašev & Franklin, arXiv 2025-09): 自律エージェントが人間の監督を超える規模/速度で取引・調整する層を「**sandbox economy**」として概念枠組み化(起源=創発/意図、境界=透過/不透過の 2 軸)。オークション・ミッション経済・信頼などの設計選択を提案。**実証結果はなく概念論文** | https://arxiv.org/abs/2509.10147 / https://huggingface.co/papers/2509.10147 | ベンダー・著者自己報告(**arXiv=査読前・概念論文**) | 構想/研究(概念枠組み) |
| **暗号資産の「AI エージェントトークン」**: Virtuals Protocol(累計 〜14,000 エージェントトークン発行、時価総額 〜$50 億)、ai16z(AI 運用 DAO)、Eliza フレームワーク。セクター時価総額 〜$153 億(2026 Q1)。ただし**投機主体・多くが高値から 60〜80% 下落・プロンプトインジェクションで実損の報告**、「実利用と投機の境界は未画定」 | https://www.openaitoolshub.org/en/blog/ai-agent-crypto-tokens-guide / https://coincub.com/blog/crypto-ai-agents/ | 二次情報(暗号資産系メディア。数値は要警戒) | 構想/投機(誇大広告注意) |

---

## 2026-09-10 の一次情報に基づく更新

### EM01: FutureHouse Robin

Robin は「A multi-agent system for automating scientific discovery」として Nature に 2026-05-19 公開、655 巻 497–505 頁に収録されました。人が実験してデータを返し、Agent が仮説生成・解析を担う semi-autonomous 構成です。ripasudil / KL001 の in vitro 検証を、臨床効果・完全無人化・独立追試の証明とは扱いません。

一次情報(確認日: 2026-09-10):

- https://www.nature.com/articles/s41586-026-10652-y
- https://www.natureasia.com/en/info/press-releases/detail/9330

### EM02: AI co-scientist

出版社書誌は 2026-05-19 公開、2026-07-01 Version of Record、2026-07-09 号、Nature 655 巻 487–496 頁を示します。DOI・出版社広報で scientist-in-the-loop と 3 件の生物医学的検証を確認しました。通常の本文取得は認証エラー、PMC は CAPTCHA のため、全論文の精査は未実施です。91% 等の性能結果と独立追試は未確認です。

一次情報(確認日: 2026-09-10):

- https://www.nature.com/articles/s41586-026-10644-y
- https://doi.org/10.1038/s41586-026-10644-y
- https://www.natureasia.com/en/info/press-releases/detail/9330

### EM03: A-Lab

2026-01-19 の Author Correction(2 月 5 日号)を著者機関 UC の全文で確認しました。新規性は予測プラットフォームにとっての新規性であり、科学的な新発見とは限りません。初報の 41 件から学習データ混入の Zn2Cr3FeO8 を除き、残る 40 件のうち 36 件を再確認、4 件は XRD 同定が不確定として成功数から除外しています。論文の撤回や全件失敗とは記しません。

一次情報(確認日: 2026-09-10):

- https://www.nature.com/articles/s41586-025-09992-y
- https://escholarship.org/content/qt4kb4s6pg/qt4kb4s6pg_noSplash_e2c3d812b2171874cfeca482fc6c214c.pdf
- https://repositories.cdlib.org/uc/item/4kb4s6pg

### EM04: 1,052 人のシミュレーション

正しい arXiv は 2411.10109。2026-06-28 の v3 は「LLM Agents Grounded in Self-Reports Enable General-Purpose Simulation of Individuals」です。GSS で本人の 2 週間後の再回答一致度を基準にした比率は、面接のみ 83%、質問のみ 82%、併用 86%、人口統計のみ 74%。初期版の 85% は履歴として区別し、一般行動の予測正答率とは表現しません。査読誌掲載は未確認です。Project Sid の ID 2411.00114 への誤リンクを修正しました。

一次情報(確認日: 2026-09-10):

- https://arxiv.org/abs/2411.10109
- https://arxiv.org/abs/2411.10109v3

### EM05: PUBG Ally

2026-06-17〜30 の Arcade における 2 週間の public beta が確認できる提供範囲です。6 月 25 日の技術記事は、行動木による即応と、ローカル SLM による認知・対話の組合せを説明します。Audio2Face だけの実装例や 2025 年の恒常出荷と扱いません。2026-09-10 時点の恒常提供は未確認です。

一次情報(確認日: 2026-09-10):

- https://www.nvidia.com/en-us/geforce/news/pubg-ally-ai-teammate-beta-available-now/
- https://developer.nvidia.com/blog/how-krafton-built-pubg-ally-a-co-playable-character-powered-by-nvidia-ace/
- https://www.nvidia.com/en-us/geforce/news/nvidia-ace-autonomous-ai-companions-pubg-naraka-bladepoint/

### EM06: ChatGPT commerce

OpenAI の 2026-03-24 の一次発表は、商品発見への重点移動、加盟店独自の checkout 体験、ACP feeds の拡張を説明します。2025 年 9 月の米国 Etsy 単品 Instant Checkout は初期提供の履歴です。二次情報による縮小報道を根拠にせず、ChatGPT 内の購入がすべて廃止されたとも解釈しません。

一次情報(確認日: 2026-09-10):

- https://openai.com/index/powering-product-discovery-in-chatgpt/
- https://openai.com/index/buy-it-in-chatgpt/

### EM07: カード網の Agent 決済

2026-06-02 の Worldline / ING / Mastercard は、オランダの実カード会員・加盟店で production の実決済を行った pilot です。最終的な人の明示承認を含みます。2026-04-08 の Visa Connect も特定パートナーの pilot であり、6 月 10 日の Visa / OpenAI、Mastercard Agent Pay for Machines の発表を併せて追います。全地域 GA、継続的な大量利用・事故率は未確認です。

一次情報(確認日: 2026-09-10):

- https://www.mastercard.com/news/europe/en/newsroom/press-releases/en/2026/worldline-ing-and-mastercard-complete-a-live-end-to-end-european-agentic-payment-in-production/
- https://investor.visa.com/news/news-details/2026/Visa-Opens-the-Door-to-AI-Driven-Shopping-for-Businesses-Worldwide/
- https://usa.visa.com/about-visa/newsroom/press-releases.releaseid.22496.html
- https://www.mastercard.com/us/en/news-and-trends/press/2026/june/mastercard-launches-agent-pay-for-machines.html

### EM08: AP2 v0.2

Google の 2026-04-28 の本文で FIDO Alliance への寄贈と v0.2 公開を確認しました。現仕様の Mandate は Checkout / Payment。Human Present は具体的な購入・支払いを利用者が承認、Human Not Present は事前承認した open Mandate の制約内で Agent が closed Mandate を作ります。検証側は closed Mandate を受け、署名・購入との紐付け・制約を決定的なコードで検査します。初期の Intent / Cart 構造と混ぜません。仕様公開は実取引量の証拠ではありません。

一次情報(確認日: 2026-09-10):

- https://ap2-protocol.org/ap2/specification/
- https://blog.google/products-and-platforms/platforms/google-pay/agent-payments-protocol-fido-alliance/

## 変わりやすい項目(定点観測)

1. Robin / AI co-scientist の独立追試。出版は確認済みですが、すべての性能数値を直接検証したわけではありません。
2. A-Lab 訂正後の独立した再評価。36 件の再確認は訂正文の報告であり、このリポジトリによる実験ではありません。
3. 1,052 人研究 v3 の査読誌掲載・別集団への一般化、合成ユーザーの妥当性。
4. PUBG Ally のベータ後の恒常提供、他の NPC 製品の実際の提供条件。
5. AP2 の後続版・FIDO の標準化、カード網 pilot の GA、継続取引量・取消・返金・不正率。
6. x402 の取引量や暗号資産市場の数値は元メモにある自己報告・二次情報です。今回の EM01〜EM08 では独立検証しておらず、実利用の証拠として記事本文には転載しません。
7. Virtual Lab、Sakana、Project Sid 等の未更新項目は旧確認日を保持します。arXiv 掲載だけで査読状態を断定せず、出版情報を追います。

## 参照した URL 一覧(アクセス日 2026-07-09)

### 領域 1: 科学研究支援
- https://deepmind.google/blog/co-scientist-a-multi-agent-ai-partner-to-accelerate-research/ (直接取得)
- https://www.nature.com/articles/s41586-026-10644-y (Co-Scientist の Nature 論文。存在確認のみ・本文未取得)
- https://www.imperial.ac.uk/news/261293/googles-ai-co-scientist-could-enhance-research/
- https://www.nature.com/articles/s41586-025-09442-9 (Virtual Lab / nanobody。検索経由)
- https://biohub.org/news/with-no-need-for-sleep-or-food-ai-built-scientists-get-the-job-done-quickly/
- https://www.technologynetworks.com/informatics/news/researchers-create-virtual-scientists-to-solve-complex-biological-problems-402897
- https://github.com/zou-group/virtual-lab
- https://www.cmu.edu/chemistry/news/2023/1220_ai-coscientist-automates-discovery.html (Coscientist / CMU)
- https://doi.org/10.1038/s41586-023-06792-0 (Coscientist / Nature。DOI のみ)
- https://www.futurehouse.org/research-announcements/demonstrating-end-to-end-scientific-discovery-with-robin-a-multi-agent-system
- https://intuitionlabs.ai/articles/futurehouse-ai-agents-platform
- https://sakana.ai/ai-scientist-first-publication/ (直接取得)
- https://arxiv.org/abs/2504.08066 (The AI Scientist-v2。査読前)
- https://www.nature.com/articles/s41586-023-06734-w (A-Lab / Nature。検索経由)
- https://ceder.berkeley.edu/research-areas/autonomous-experimentation-for-accelerated-materials-discovery/
- https://www.chemistryworld.com/news/new-analysis-raises-doubts-over-autonomous-labs-materials-discoveries/4018791.article (A-Lab 反論)
- https://www.theregister.com/2024/01/31/ai_chemistry_research_disputed/
- https://cen.acs.org/research-integrity/Nature-robot-chemist-paper-corrected/104/web/2026/01 (A-Lab 訂正)
- https://news.ncsu.edu/2025/07/fast-forward-for-self-driving-labs/
- https://pubs.rsc.org/en/content/articlehtml/2026/mh/d5mh01984b (SDL 2.0 レビュー)

### 領域 2: シミュレーション・NPC / 生成エージェント
- https://dl.acm.org/doi/fullHtml/10.1145/3586183.3606763 (Generative Agents / UIST 2023)
- https://arxiv.org/pdf/2304.03442 (Generative Agents / arXiv)
- https://arxiv.org/abs/2411.10109v3 (1,052 人研究、2026-06-28 v3。2026-09-10 確認)
- https://arxiv.org/abs/2411.00114 (Project Sid / 査読前)
- https://github.com/altera-al/project-sid
- https://www.nvidia.com/en-us/geforce/news/nvidia-ace-autonomous-ai-companions-pubg-naraka-bladepoint/ (直接取得)
- https://wanderfolk.ai/ai-npcs-in-games/
- https://memedadacoin.com/blog/ai-npcs-nvidia-ace-inworld
- https://measuringu.com/review-of-experiments-with-synthetic-users/ (合成ユーザーのレビュー)
- https://interactions.acm.org/blog/view/the-challenges-of-synthetic-users-in-ux-research

### 領域 3: エージェント経済
- https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation (MCP / AAIF)
- https://en.wikipedia.org/wiki/Model_Context_Protocol
- https://developers.googleblog.com/en/google-cloud-donates-a2a-to-linux-foundation/ (A2A)
- https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents
- https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol (AP2、直接取得)
- https://blog.google/products-and-platforms/platforms/google-pay/agent-payments-protocol-fido-alliance/ (AP2 → FIDO)
- https://www.coinbase.com/developer-platform/discover/launches/x402 (x402)
- https://docs.cdp.coinbase.com/x402/welcome
- https://openai.com/index/buy-it-in-chatgpt/ (ACP / Instant Checkout)
- https://stripe.com/newsroom/news/stripe-openai-instant-checkout
- https://openai.com/index/powering-product-discovery-in-chatgpt/ (2026-03-24 の現行方針。2026-09-10 確認)
- https://www.mastercard.com/us/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html (Mastercard Agent Pay)
- https://techinformed.com/visa-opens-one-integration-for-ai-agent-payments/ (Visa Intelligent Commerce)
- https://arxiv.org/abs/2509.10147 (Virtual Agent Economies / 査読前・概念論文)
- https://huggingface.co/papers/2509.10147
- https://www.openaitoolshub.org/en/blog/ai-agent-crypto-tokens-guide (AI エージェントトークン / 二次情報)
- https://coincub.com/blog/crypto-ai-agents/
