# 先端応用の概観(科学研究支援・シミュレーション/NPC・エージェント経済)執筆前調査メモ(DA-R2)

- **調査 ID**: DA-R2
- **調査日 / 確認日**: 2026-07-09
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
  - **本文を直接取得できたのは 4 件**: Google DeepMind Co-Scientist ブログ、Sakana AI 公表ページ、Google Cloud AP2 ブログ、NVIDIA ACE ニュースページ。それ以外(Nature/arXiv 論文本文、Stanford HAI、各社プレス等)は **WebSearch の要約経由**で確認しており、一次情報(nature.com 等の公式 URL)が特定できても「本文は直接取得していない」ため確度に「(検索経由)」を付し、必要に応じ 1 段下げています
  - arXiv 等の**プレプリントは「査読前」**であることを確度・実証区分の双方に反映しています
  - 性能主張(「X 倍高速」「91% 阻害」等)・「世界初」「end-to-end 自律」等の主張は、**出典が自己申告か第三者検証か**を必ず注記しています

---

## 調査サマリ(3 領域の現在地)

記事本文で使える要点。個別の根拠は後述「## 領域別メモ」にあります。各要点冒頭の【】が実証/構想ラベルです。

### 領域 1: 科学研究支援

1. **【実証(査読)】仮説生成・文献統合・データ解析を担う「マルチエージェント科学 AI」は査読論文レベルで複数実証済み。** 代表例: Stanford/CZ Biohub の **Virtual Lab**(AI の PI エージェントが専門エージェントを束ね、SARS-CoV-2 向け nanobody を 92 個設計、うち一部が湿式実験で結合改善を確認。Nature 2025-07)、CMU の **Coscientist**(GPT-4 で Pd 触媒クロスカップリング反応を自律最適化。Nature 2023)。ただし**主語に注意**——実験の実行・パイプライン構築・最終判断は人間で、「AI が自律で発見」ではない。

2. **【実証(査読)+ 自己報告の数値】Google の Co-Scientist は「仮説生成の共同研究者」として公式に位置づけられ、2026-05 に査読付き Nature 論文化したと DeepMind が表明。** 肝疾患の創薬リポジショニング・細胞老化・細菌 DNA 転移(Penadés の研究と同一仮説を短時間で提示)など**湿式実験で確認された事例**がある一方、「数週間→数日」「91% 阻害」等の**数値は協働研究者の自己報告**。位置づけは「発見の代替ではなく研究のパートナー」と公式に明記(=完全自律ではない)。

3. **【構想寄り/自己報告】「エンドツーエンドの完全自律な科学発見」を掲げる系は、査読前プレプリント+企業発表が中心。** FutureHouse **Robin**(ripasudil を加齢黄斑変性の候補として同定、と自社発表・プレプリント)、Sakana **The AI Scientist-v2**(AI 生成論文が ICLR 2025 ワークショップ査読を平均 6.33 で通過)。ただし Sakana 自身が「主催者合意済みの実験」「本会議基準は不通過」「出版前に取り下げ」「引用誤り・再現性の懸念」を明記。**「世界初」「end-to-end 自律」系の主張は自己申告が多い**。

4. **【実証だが要・第三者検証の教訓】ラボ自動化(self-driving lab / autonomous lab)は稼働実証があるが、成果の正しさは第三者検証が要る。** Berkeley **A-Lab** の「17 日で 41 個の新物質を自律合成」(Nature 2023)は、外部研究者(UCL の Palgrave)が同定手法(Rietveld 解析)の不備を指摘し「新規発見は無かった可能性」と反論、Nature 論文は 2026 に訂正。**自動化 = 正しい発見ではない**の好例。

### 領域 2: シミュレーション・NPC / 生成エージェント

1. **【実証(査読)】生成エージェント(generative agents)の学術的基盤は確立済み。** Park ら「Generative Agents: Interactive Simulacra of Human Behavior」(Smallville に 25 体、UIST 2023 ベストペーパー、査読付き)。人間行動を LLM+記憶/計画/内省アーキテクチャで近似できることを示した原典。

2. **【実証(査読前)】人間の意見・行動の近似は定量評価が出てきたが査読前。** Park らの続報「Generative Agent Simulations of 1,000 People」(1,052 人に面接し AI 化、General Social Survey で本人の 2 週間後の再現度の **85%** を再現、arXiv 2024-11=**査読前**)。合成人格での社会科学シミュレーションに定量的な手応え。

3. **【構想/研究プロトタイプ】大規模社会シミュレーションは査読前の研究デモ段階。** Altera **Project Sid**(Minecraft で 10〜1,000+ 体、PIANO アーキテクチャ、役割分化・規則変更・文化/宗教の伝播が創発、arXiv 2024-11)。示された逸話(憲法の投票制定・宗教伝播)は**再現性・一般化が未確立**。

4. **【実証(稼働)だが限定的】ゲーム NPC は 2025〜2026 に実出荷が始まったが、多くは「贅沢機能」。** NVIDIA **ACE** が inZOI・PUBG「Ally」・NARAKA 等でオンデバイス稼働。ただし出荷済みの多くは **Audio2Face(表情アニメ生成)や限定的な AI 補助**で、**完全な LLM 対話 NPC はコスト・技術面から「既定ではなく贅沢機能」**(二次情報)。

5. **【検証は否定寄り】合成ユーザー(synthetic users)による製品/UX テストは、速度・コストの利点はあるが妥当性への疑義が強い。** レビュー(MeasuringU)では肯定 9・否定 14。sycophancy(過度に好意的)、多様性/ばらつきの欠如、user drift 等が指摘され、「**人間調査の置き換えではなく補完**」が主流の評価。

### 領域 3: エージェント経済(agent economy)

1. **【実証(稼働・広範採用)】エージェント間の"通信/相互運用"の標準は現実に稼働している。** Anthropic **MCP**(2024-11 公表→ OpenAI が 2025-03、Google が 2025-04 に採用表明、サーバ 5,800+、2025-12 に Linux Foundation 傘下 Agentic AI Foundation へ寄贈)と Google **A2A**(2025-04 →2025-06 に Linux Foundation へ寄贈、支持 100〜150+ 社)。ただしこれらは"**ツール接続/エージェント間通信の標準化**"であって、"自律取引経済"そのものではない。

2. **【実証(稼働・限定)】エージェント"決済"は一部が実稼働。** Coinbase **x402**(2025-05、HTTP 402 でステーブルコイン決済、オンチェーンで実取引量ありと報告——**数値は自己報告/エコシステム集計**)、OpenAI×Stripe の **ACP / ChatGPT Instant Checkout**(2025-09、ChatGPT 内で米 Etsy 出品を実購入可、ただし**単品・米国限定**、後に縮小報道あり)。カード網も **Mastercard Agent Pay**(2025-04、2025-11 に全米カード会員へ展開)、**Visa Intelligent Commerce** が"有効化"を提供。

3. **【構想/仕様】エージェント"決済プロトコル"の多くは、仕様の公表であって稼働システムそのものではない。** Google **AP2**(2025-09、60+ 社、Mandate=署名付きの「意図/カート」証跡、FIDO Alliance へ寄贈)は Google 自身が「**技術仕様・参照実装の公開であり、本番決済システムそのものではない**(GitHub でブループリント提供)」と明記。実際に"今動いている"のは A2A の x402 拡張(暗号資産レール)側。

4. **【構想/投機・誇大広告注意】エージェント同士が自律で取引・交渉する"経済"はまだ概念段階で、投機との混同に注意。** DeepMind「Virtual Agent Economies」(2025-09、arXiv)は "sandbox economy" の枠組みを提案する**概念論文(実証なし)**。暗号資産の「AI エージェントトークン」(Virtuals 〜$5B、ai16z、Eliza フレームワーク、累計 〜14,000 トークン)は市場規模は大きい(セクター 〜$15.3B)が、**投機主体・多くが高値から 60〜80% 下落・プロンプトインジェクションで実損**の報告もあり、「実利用と投機の境界は未画定」というのが実態(二次情報)。

---

## 領域別メモ

以下、本節の事実の**確認日はすべて 2026-07-09**。表の列は 事実 / 出典 / 確度 / 実証・構想の別。

### 領域 1: 科学研究支援

| 事実 | 出典 URL | 確度 | 実証・構想 |
| --- | --- | --- | --- |
| **Google Co-Scientist**: Gemini ベースのマルチエージェント。専門エージェントが仮説を「生成・討論・順位付け・進化」させる(AlphaGo/AlphaStar 的な"アイデアのトーナメント")。文献・構造化 DB に対して検証可能な研究方向を提案 | https://deepmind.google/blog/co-scientist-a-multi-agent-ai-partner-to-accelerate-research/ | 公式確認済み(直接取得) | 実証(稼働。Gemini for Science 経由で研究者に実験的提供) |
| Co-Scientist の**自律度**: 「研究のパートナーであって、科学的/臨床的専門性の代替ではない」と公式明記。AI が仮説を出し、**研究者が実験で検証**するハイブリッド | 同上 | 公式確認済み(直接取得) | 実証(稼働)+ 人手検証前提 |
| Co-Scientist の**検証済み事例**: 肝線維化で瘢痕関連応答の 91% を阻害する創薬リポジショニング候補を同定(ラボ検証)、細胞老化の遺伝的リードを実験で確認、感染症で病原タンパクを特定アミノ酸まで絞り込み。細菌 DNA 転移では Penadés 研究チームが数年かけ到達した仮説と同一のものを短時間で提示 | 同上 / https://www.imperial.ac.uk/news/261293/googles-ai-co-scientist-could-enhance-research/ | 公式確認済み(直接取得)。ただし**「91%」「数週間→数日」等の数値は協働研究者の自己報告** | 実証(湿式検証あり)+ 数値は自己報告 |
| Co-Scientist は 2026-05 に**査読付き Nature 論文化**したと DeepMind が表明(2026-05-19 ブログ)。CBRN 誤用評価・安全分類器も実施 | https://deepmind.google/blog/co-scientist-a-multi-agent-ai-partner-to-accelerate-research/ / https://www.nature.com/articles/s41586-026-10644-y | 公式確認済み(ブログは直接取得。**Nature 論文本文は未取得=検索経由**) | 実証(査読)と DeepMind が主張 |
| **Virtual Lab**(Stanford J. Zou + CZ Biohub J. Pak): 人間が「PI エージェント」を作り、PI が専門エージェント群を編成・指揮。ESM/AlphaFold-Multimer/Rosetta の計算パイプラインを構成し、**SARS-CoV-2 変異株向け nanobody を 92 個設計・実験検証、2 個で結合改善**。Nature 2025-07-29 | https://www.nature.com/articles/s41586-025-09442-9 / https://biohub.org/news/with-no-need-for-sleep-or-food-ai-built-scientists-get-the-job-done-quickly/ | 公式確認済み(検索経由。nature.com URL 特定・本文未取得) | 実証(査読 + 湿式検証) |
| Zou は「**課題性のある研究問題を最初から最後まで自律 AI エージェントが解いた初の実証**」と表現(=「初」は著者の自己申告)。実験実行・パイプライン設計は人間が関与 | https://www.technologynetworks.com/informatics/news/researchers-create-virtual-scientists-to-solve-complex-biological-problems-402897 | ベンダー・著者自己報告(「初」の主張) | 実証(査読)だが「初」は自己申告 |
| **Coscientist**(CMU, Gomes 研 / Boiko ら): GPT-4 等の複数 LLM エージェントが検索・文書取得・コード実行・ロボット実験 API を統合し、**Pd 触媒クロスカップリング反応の自律最適化**等 6 課題を実施。Nature 2023(624:570-578) | https://www.cmu.edu/chemistry/news/2023/1220_ai-coscientist-automates-discovery.html / https://doi.org/10.1038/s41586-023-06792-0 | 公式確認済み(検索経由。CMU 公式 + Nature DOI 特定・本文未取得) | 実証(査読)。ただし既知反応系の最適化デモで、新規発見ではない |
| **FutureHouse Robin**: マルチエージェント(Crow/Falcon=PaperQA2 ベースの文献エージェント、Finch=データ解析)。**ripasudil(ROCK 阻害薬)を乾燥型加齢黄斑変性(dAMD)の候補として同定**、と自社が発表。「初の end-to-end AI 駆動の科学発見」と表現 | https://www.futurehouse.org/research-announcements/demonstrating-end-to-end-scientific-discovery-with-robin-a-multi-agent-system / https://www.researchgate.net/publication/391910986_Robin_A_multi-agent_system_for_automating_scientific_discovery | ベンダー・著者自己報告(企業発表 + プレプリント=**査読前**) | 実証(査読前)/構想寄り。「初/end-to-end」は自己申告 |
| PaperQA2(Robin の文献エージェントの基盤)は「文献検索・要約で専門家級」と自社が主張、OSS 公開 | https://intuitionlabs.ai/articles/futurehouse-ai-agents-platform | ベンダー・著者自己報告(ベンチマークは自己申告) | 実証(稼働・OSS)だが性能主張は自己報告 |
| **Sakana The AI Scientist-v2**: タイトルから参考文献まで論文を自律生成。3 本投稿し **1 本が ICLR 2025 ワークショップ(ICBINB)査読を平均 6.33 で通過**(受理閾値超え) | https://sakana.ai/ai-scientist-first-publication/ / https://arxiv.org/abs/2504.08066 | 公式確認済み(Sakana ページは直接取得) | 実証(限定。ワークショップ査読通過)/構想寄り |
| Sakana 自身の**カギとなる但し書き**: 主催者・ICLR 指導部は実験に「full cooperation」で事前承知/**出版前に取り下げ**(AI 生成論文を出すべきか未合意のため)/受理は 3 本中 1 本のみ/**ワークショップ級で本会議トラックではない**/自社の本会議基準は不通過/引用誤り・再現性の懸念あり | https://sakana.ai/ai-scientist-first-publication/ | 公式確認済み(直接取得) | 到達度の限界を公式が明示 |
| **A-Lab**(Berkeley/LBL, Ceder 研): ab initio 標的選定 + ML 合成レシピ + ロボット固相合成 + ML 相同定 + 能動学習。**17 日で 58 試行中 41 個の新規化合物を自律合成**と報告。Nature 2023-11 | https://www.nature.com/articles/s41586-023-06734-w / https://ceder.berkeley.edu/research-areas/autonomous-experimentation-for-accelerated-materials-discovery/ | 公式確認済み(検索経由。nature.com URL 特定・本文未取得) | 実証(稼働=ロボット自律合成) |
| **A-Lab への第三者反論(重要)**: UCL の R. Palgrave らが Rietveld 精密化解析を「初学者レベルで、化合物の誤同定につながった」「新規発見は無かった可能性が高い」と指摘。合成物の多くは既に ICSD に存在。Nature 論文は 2026 に訂正 | https://www.chemistryworld.com/news/new-analysis-raises-doubts-over-autonomous-labs-materials-discoveries/4018791.article / https://www.theregister.com/2024/01/31/ai_chemistry_research_disputed/ / https://cen.acs.org/research-integrity/Nature-robot-chemist-paper-corrected/104/web/2026/01 | 二次情報(業界誌 Chemistry World / C&EN / The Register) | 「自動化 ≠ 正しい発見」の第三者検証事例 |
| **self-driving lab 一般**: 動的フロー実験で従来比 **10 倍超のデータ**を高速収集する技術を報告(NC State、Nature Chemical Engineering 2025)。SDL 2.0(柔軟・スケーラブル・協働型)への流れをレビューが整理 | https://news.ncsu.edu/2025/07/fast-forward-for-self-driving-labs/ / https://pubs.rsc.org/en/content/articlehtml/2026/mh/d5mh01984b | 二次情報 + 公式確認済み(検索経由。査読誌) | 実証(査読・個別技術)だが自律範囲はドメイン限定 |

### 領域 2: シミュレーション・NPC / 生成エージェント

| 事実 | 出典 URL | 確度 | 実証・構想 |
| --- | --- | --- | --- |
| **Generative Agents**(Park ら, Stanford/Google): Smallville に 25 体の LLM エージェント。記憶・内省・計画のアーキテクチャで、起床・出勤・関係形成・イベント調整等の人間らしい行動が創発。**UIST 2023 ベストペーパー**(査読付き) | https://dl.acm.org/doi/fullHtml/10.1145/3586183.3606763 / https://arxiv.org/pdf/2304.03442 | 公式確認済み(検索経由。ACM DL / arXiv 特定・本文未取得) | 実証(査読)。ただし研究デモ(製品ではない) |
| **Generative Agent Simulations of 1,000 People**(Park ら, Stanford/DeepMind/Northwestern/UW): 米国人口を代表する **1,052 人に約 2 時間面接**し LLM エージェント化。General Social Survey で「本人が 2 週間後に自答を再現する精度の **85%**」を再現、人格特性・実験再現でも同等。人口統計記述のみの手法より人種・思想間のバイアスが減少 | https://hai.stanford.edu/news/ai-agents-simulate-1052-individuals-personalities-impressive-accuracy / https://arxiv.org/abs/2411.00114(注: 本文 arXiv は下記 Project Sid と別 ID) | ベンダー・著者自己報告(**arXiv 2024-11=査読前**。Stanford HAI 経由) | 実証(査読前。定量評価あり) |
| **Altera Project Sid**: Minecraft で 10〜1,000+ 体。PIANO(Parallel Information Aggregation via Neural Orchestration)アーキテクチャ。役割分化、集団規則の遵守/変更、文化・宗教の伝播が創発(商人ハブ形成、Google Docs で憲法を投票・改正、宗教を賄賂で伝播 等) | https://arxiv.org/abs/2411.00114 / https://github.com/altera-al/project-sid | ベンダー・著者自己報告(**arXiv 2024-11=査読前**) | 構想/研究プロトタイプ(逸話は再現性未確立) |
| **NVIDIA ACE**(ゲーム NPC): **稼働/出荷済み**の例——PUBG「Ally」(Co-Playable Character、オンデバイス、2025)、NARAKA: BLADEPOINT の AI Teammate(オンデバイス、2025-03)、inZOI の「Smart Zoi」CPC(オンデバイス、2025)。Audio2Face(表情アニメ)は Alien: Rogue Incursion / World of Jade Dynasty で稼働 | https://www.nvidia.com/en-us/geforce/news/nvidia-ace-autonomous-ai-companions-pubg-naraka-bladepoint/ | 公式確認済み(直接取得) | 実証(稼働)。ただし多くは AI 補助/アニメ生成で完全対話 NPC ではない |
| ACE の**到達度の実態**: 2025〜2026 に実出荷が始まったが、AI NPC はコスト・技術制約から「既定ではなく贅沢機能」。Inworld は純キャラエンジンからリアルタイム AI 基盤へ軸足を移し、一部ゲーム/MOD で採用 | https://wanderfolk.ai/ai-npcs-in-games/ / https://memedadacoin.com/blog/ai-npcs-nvidia-ace-inworld | 二次情報 | 実証(稼働)だが普及は限定 |
| **合成ユーザー(synthetic users)による製品/UX テスト**: 速度・コストの利点はあるが妥当性に強い疑義。12 論文レビューで肯定 9・否定 14。sycophancy(不自然に好意的で欠陥を見逃す)、多様性/ばらつきの欠如、user drift(RCT 模倣が楽観に偏る)等。「人間調査の**置き換えではなく補完**」が主流 | https://measuringu.com/review-of-experiments-with-synthetic-users/ / https://interactions.acm.org/blog/view/the-challenges-of-synthetic-users-in-ux-research | 二次情報 + 公式確認済み(検索経由。ACM Interactions) | 検証は否定寄り(実証は限定的) |

### 領域 3: エージェント経済(agent economy)

| 事実 | 出典 URL | 確度 | 実証・構想 |
| --- | --- | --- | --- |
| **MCP**(Anthropic, 2024-11 公表): AI とデータ/ツールを繋ぐオープン標準。**OpenAI が 2025-03(Agents SDK / Responses API / ChatGPT desktop)、Google DeepMind が 2025-04(Gemini)採用表明**。サーバ 5,800+/クライアント 300+、DL 800 万+。2025-12 に Linux Foundation 傘下の Agentic AI Foundation(AAIF、Anthropic/Block/OpenAI 共同設立)へ寄贈 | https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation / https://en.wikipedia.org/wiki/Model_Context_Protocol | ベンダー・著者自己報告 + 二次情報(検索経由。Anthropic 公式 URL 特定・本文未取得) | 実証(稼働・広範採用)。ただし"通信/ツール接続"の標準であり取引経済ではない |
| **A2A**(Google, 2025-04 公表): エージェント間の発見・情報交換・協調の標準。**2025-06 に Linux Foundation へ寄贈**(AWS/Cisco/Google/Microsoft/Salesforce/SAP/ServiceNow らで設立)。支持 100〜150+ 社 | https://developers.googleblog.com/en/google-cloud-donates-a2a-to-linux-foundation/ / https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents | 公式確認済み(検索経由。Google 開発者ブログ / Linux Foundation プレス特定・本文未取得) | 実証(仕様稼働・OSS)。エージェント間通信の標準 |
| **Google AP2(Agent Payments Protocol)**: 2025-09-17 公表、60+ パートナー。**署名付き Mandate**(Intent Mandate=事前承認の意図、Cart Mandate=改竄不可のカート内容)で「認可・真正性・説明責任」を担保。A2A の拡張/ MCP の拡張として使える | https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol | 公式確認済み(直接取得) | 構想/仕様 |
| AP2 の**現状(重要)**: Google 自身が「**技術仕様・参照実装・ブループリントの公開であり、本番の稼働決済システムそのものではない**」と位置づけ(GitHub で仕様/参照実装を提供)。"今動いている"のは Coinbase/Ethereum Foundation/MetaMask と組んだ **A2A x402 拡張**(暗号資産/ステーブルコイン)側。後に **FIDO Alliance へ寄贈** | https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol / https://blog.google/products-and-platforms/platforms/google-pay/agent-payments-protocol-fido-alliance/ | 公式確認済み(直接取得。寄贈は検索経由) | 構想/仕様(x402 拡張のみ実証寄り) |
| **Coinbase x402**: 2025-05 公開。HTTP 402(Payment Required)を使い、API/アプリ/AI エージェントがステーブルコインで即時決済。EVM(Base/Polygon/Arbitrum 等)+ Solana 対応、プロトコル手数料ゼロ。**2026-03 時点で Base 上 1.19 億件・Solana 3,500 万件・年換算 〜$6 億**と報告 | https://www.coinbase.com/developer-platform/discover/launches/x402 / https://docs.cdp.coinbase.com/x402/welcome | ベンダー・著者自己報告(Coinbase 公式 + **取引量数値は自己/エコシステム集計**、検索経由) | 実証(稼働)。ただし数値は自己報告、暗号資産レール前提 |
| **OpenAI × Stripe: Agentic Commerce Protocol(ACP)/ Instant Checkout**: 2025-09 公表。ChatGPT 内で**米国の Etsy 出品を直接購入可能**(Plus/Pro/Free)。Shopify 100 万+ 出店は順次。Stripe の Shared Payment Token(SPT)で決済情報を露出せず委任。ACP は OSS 化。**当初は単品購入・米国限定**(カート/地域は拡張予定) | https://openai.com/index/buy-it-in-chatgpt/ / https://stripe.com/newsroom/news/stripe-openai-instant-checkout | ベンダー・著者自己報告(OpenAI/Stripe 公式、検索経由) | 実証(稼働・限定) |
| ACP の**縮小報道**: OpenAI が ChatGPT のチェックアウトを一部縮小したとの二次情報あり(裏取り要) | https://rye.com/blog/openai-chatgpt-checkout-agentic-commerce | 二次情報(要裏取り) | 実証(稼働)だが範囲は流動的 |
| **カード網の動き**: Mastercard **Agent Pay**(2025-04-29 公表、Microsoft/IBM/Salesforce/Checkout.com と、"Agentic Tokens" 基盤。2025-11 に全米 Mastercard カード会員へ展開)。Visa **Intelligent Commerce / Intelligent Commerce Connect**(単一統合で複数プロトコル=Trusted Agent Protocol / Machine Payments Protocol / ACP / Universal Commerce Protocol に対応) | https://www.mastercard.com/us/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html / https://techinformed.com/visa-opens-one-integration-for-ai-agent-payments/ | ベンダー・著者自己報告(Mastercard 公式プレス、検索経由)+ 二次情報(Visa) | 実証(有効化は稼働・展開中)。実購買量は不明 |
| **DeepMind「Virtual Agent Economies」**(Tomašev & Franklin, arXiv 2025-09): 自律エージェントが人間の監督を超える規模/速度で取引・調整する層を「**sandbox economy**」として概念枠組み化(起源=創発/意図、境界=透過/不透過の 2 軸)。オークション・ミッション経済・信頼などの設計選択を提案。**実証結果はなく概念論文** | https://arxiv.org/abs/2509.10147 / https://huggingface.co/papers/2509.10147 | ベンダー・著者自己報告(**arXiv=査読前・概念論文**) | 構想/研究(概念枠組み) |
| **暗号資産の「AI エージェントトークン」**: Virtuals Protocol(累計 〜14,000 エージェントトークン発行、時価総額 〜$50 億)、ai16z(AI 運用 DAO)、Eliza フレームワーク。セクター時価総額 〜$153 億(2026 Q1)。ただし**投機主体・多くが高値から 60〜80% 下落・プロンプトインジェクションで実損の報告**、「実利用と投機の境界は未画定」 | https://www.openaitoolshub.org/en/blog/ai-agent-crypto-tokens-guide / https://coincub.com/blog/crypto-ai-agents/ | 二次情報(暗号資産系メディア。数値は要警戒) | 構想/投機(誇大広告注意) |

---

## 変わりやすい項目(定点観測)

記事改訂時・引用時に再確認する項目:

1. **Co-Scientist の論文ステータス**: DeepMind が表明する「2026-05 の査読付き Nature 論文」本文(s41586-026-10644-y)を次回は直接取得し、確度を上げる。検証事例・数値の第三者検証の有無も追う
2. **A-Lab の訂正の顛末**: Nature 論文の訂正(2026)後、どの主張が撤回/維持されたかを C&EN・Nature 訂正本文で確認。「自動化 ≠ 正しい発見」の記事内論拠として最新化
3. **「end-to-end 自律科学発見」系のプレプリントの査読・追試**: FutureHouse Robin、Sakana、Virtual Lab の後続の**査読通過・独立追試**の有無。自己申告の「初」「完全自律」がどこまで第三者検証されたか
4. **ゲーム NPC の実出荷リスト**: NVIDIA ACE / Inworld の**対話 LLM NPC が既定搭載された商用タイトル**の増減。Audio2Face(アニメ)と LLM 対話 NPC を混同しない
5. **決済プロトコルの"仕様→稼働"の移行**: AP2 が仕様から実稼働へ進んだか、x402/ACP の**実取引量**(自己報告値の裏取り)、Mastercard Agent Pay / Visa の**実購買**の可視化。ACP の縮小報道の続報
6. **標準の統治主体**: MCP(Agentic AI Foundation)、A2A(Linux Foundation)、AP2(FIDO Alliance)の統治移管後のガバナンス・仕様バージョン。「通信標準」と「決済標準」と「経済(取引・交渉)」を段階として混同しない
7. **暗号資産 AI エージェント市場**: Virtuals/ai16z 等の時価総額・稼働実態・詐欺/損失事例。誇大広告と実利用の乖離を定点で追い、記事では「投機/構想」に倒す
8. **合成ユーザー/生成エージェントの妥当性研究**: 「1,000 人」続報の査読、合成ユーザーの妥当性を巡る肯定/否定の実証の更新(ACM 等)

---

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
- https://hai.stanford.edu/news/ai-agents-simulate-1052-individuals-personalities-impressive-accuracy (1,000 人シミュレーション)
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
- https://rye.com/blog/openai-chatgpt-checkout-agentic-commerce (ACP 縮小報道・要裏取り)
- https://www.mastercard.com/us/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html (Mastercard Agent Pay)
- https://techinformed.com/visa-opens-one-integration-for-ai-agent-payments/ (Visa Intelligent Commerce)
- https://arxiv.org/abs/2509.10147 (Virtual Agent Economies / 査読前・概念論文)
- https://huggingface.co/papers/2509.10147
- https://www.openaitoolshub.org/en/blog/ai-agent-crypto-tokens-guide (AI エージェントトークン / 二次情報)
- https://coincub.com/blog/crypto-ai-agents/
