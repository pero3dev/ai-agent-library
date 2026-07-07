# フィジカル AI / VLA モデルの現在地(2026-07 時点) 調査メモ

- **調査日**: 2026-07-07
- **調査目的**: `docs/01-concepts/physical-ai-overview.md`(フィジカル AI 概観)の執筆材料。記事は概観 1 本のため、本メモも**概観レベルの粒度**に絞る(実装詳細・ロボット制御アルゴリズムは対象外)。本メモは執筆用の一次情報整理であり、公開ドキュメントではない
- **根拠の方針**: 各社公式一次情報(deepmind.google / pi.website / nvidianews.nvidia.com / developer.nvidia.com / figure.ai / 1x.tech(公式プレスリリース)/ bostondynamics.com / tri.global / agilityrobotics.com / khi.co.jp)を最優先。公式が取得できないもの(Tesla)は二次情報と明記
- **確度凡例**:
  - **公式確認済み** = 公式一次情報の本文を WebFetch で直接確認(検索スニペット経由で公式ページの記載を確認したものは「公式確認済み(検索経由)」と注記)
  - **ベンダー自己報告** = 公式発表だが第三者検証のない性能・数値・計画の主張
  - **二次情報** = 報道・まとめ記事経由でしか確認できていない
  - **未確認** = 今回確認できず
- **取得上の注意**:
  - **Tesla の公式 IR 資料(assets-ir.tesla.com の PDF)と SEC 提出書類(sec.gov)は WebFetch が 403** で取得できず、Optimus の状況は二次情報(報道された Musk 発言・決算説明)に依存している。執筆時に断定を避けること
  - ヒューマノイド・ロボティクスは**変化が非常に速い**(本調査でも 2026 年 1〜6 月の発表が多数)。すべての事実に確認日を付した。記事では「2026 年 7 月時点では」の絶対表現を徹底すること
  - 性能数値はすべて**ベンダー自己報告**であり、業界共通ベンチマークによる横並び比較は 2026-07 時点で存在しない(LLM のリーダーボードに相当するものがない)。数値は「帯」でのみ記録した

---

## 1. VLA(Vision-Language-Action)モデルの概念と系譜

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **VLA モデル**とは、インターネット規模の視覚・言語データで事前学習した基盤モデル(VLM)を、ロボットの実演データでさらに学習させ、**視覚入力と言語指示から直接ロボットの行動(モータコマンド)を出力**する単一モデルのこと。Google DeepMind の **RT-2**(2023-07-28 発表)がこのパラダイムを確立した。「ロボットの行動をもう一つの言語(テキストトークン)として表現し、インターネット規模の視覚言語データと一緒に学習する」方式で、Web 知識(「恐竜はおもちゃ」「健康的なスナックはりんご」等)がロボット制御に転移することを示した | https://deepmind.google/blog/rt-2-new-model-translates-vision-and-language-into-action/ / https://arxiv.org/abs/2307.15818 | 2026-07-07 | 公式確認済み(検索経由) |
| 従来のロボティクスは知覚・推論・制御を**別モジュール**で構成していたのに対し、VLA は**単一の大規模モデルでエンドツーエンド**に扱う点が転換点。VLM の汎化・意味理解・推論がロボット制御に引き継がれる | 同上(RT-2 論文の主張) | 2026-07-07 | 公式確認済み(検索経由) |
| 2025〜2026 年の VLA で支配的なのは**デュアルシステム構成**(「遅い思考」の VLM + 「速い制御」のアクションデコーダ)。Figure Helix(System 2 / System 1)、NVIDIA GR00T(VLM + diffusion transformer)、Google の Gemini Robotics(ER = 計画層 + VLA = 実行層)がいずれもこの構造を採る(§2 の各項参照) | 各社公式(§2 の出典) | 2026-07-07 | 公式確認済み |
| オープンな VLA の先行例として Stanford 等の **OpenVLA**(2024 年、7B、オープンソース)がある。オープンウェイト VLA のエコシステムは Hugging Face の **LeRobot** に集約されつつあり、2026-01 に NVIDIA が Isaac / GR00T 技術を LeRobot に統合すると発表 | https://nvidianews.nvidia.com/news/nvidia-releases-new-physical-ai-models-as-global-partners-unveil-next-generation-robots(LeRobot 統合)/ OpenVLA は https://openvla.github.io/ | 2026-07-07 | LeRobot 統合は公式確認済み / OpenVLA の詳細は未確認(今回は本文未取得) |

**執筆上の含意**: 「VLA = VLM を行動出力に拡張したもの」「RT-2(2023)が起点」「2025〜2026 年は『遅い計画層 + 速い制御層』のデュアルシステムが共通パターン」という 3 点が、概観記事の骨格として各社公式資料で裏が取れる。

---

## 2. 代表的な VLA モデル(2026-07 時点)

### 2.1 Google DeepMind(Gemini Robotics ファミリー)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **Gemini Robotics 1.5**(VLA)と **Gemini Robotics-ER 1.5**(embodied reasoning = 具身推論モデル)を 2025-09-25 に発表。ER が「orchestrates a robot's activities, like a high-level brain」として計画を立て、VLA に「natural language instructions for each step」を渡す**二層の agentic framework** | https://deepmind.google/blog/gemini-robotics-15-brings-ai-agents-into-the-physical-world/ | 2026-07-07 | 公式確認済み |
| Gemini Robotics 1.5 は「think before taking action」(行動前に思考過程を生成)と**具身間学習**(あるロボットで学んだ動作を別のロボットへ転移: 「transfer motions learned from one robot to another」)を公式に主張 | 同上 | 2026-07-07 | 公式確認済み(能力主張自体はベンダー自己報告) |
| 提供形態: **ER 1.5 は Gemini API / Google AI Studio で開発者に公開**。**VLA(Gemini Robotics 1.5)は「currently available to select partners」**(一般公開されていない) | 同上 | 2026-07-07 | 公式確認済み |
| **Gemini Robotics On-Device**(2025-06-24 発表): ロボット実機上でローカル実行できる最適化 VLA。クラウド接続なしで動作し、**50〜100 デモ程度の少数データで新タスクに適応**できると主張。ALOHA・Franka・Apollo(Apptronik のヒューマノイド)等で動作。SDK は trusted tester プログラム経由の限定提供 | https://deepmind.google/blog/gemini-robotics-on-device-brings-ai-to-local-robotic-devices/ | 2026-07-07 | 公式確認済み(適応データ量はベンダー自己報告) |
| **Gemini Robotics-ER 1.6**(2026 年 6 月発表): 空間推論・マルチビュー理解を強化。Boston Dynamics との協業で「複雑なゲージ・サイトグラスの読み取り」機能を追加。「our safest robotics model to date」と主張。Gemini API / AI Studio で提供 | https://blog.google/innovation-and-ai/models-and-research/google-deepmind/gemini-robotics-er-1-6/ | 2026-07-07 | 公式確認済み |
| モデルファミリーページ(2026-07 時点)のラインナップは **Gemini Robotics 1.5(VLA)/ Gemini Robotics-ER 1.6(推論)/ Gemini Robotics On-Device** の 3 系統。ER は「Google Search などのデジタルツールを自律的に呼び出せる」。パートナーとして Apptronik・Boston Dynamics・Universal Robots 等、60 以上の trusted testers に言及 | https://deepmind.google/models/gemini-robotics/ | 2026-07-07 | 公式確認済み |

### 2.2 Physical Intelligence(π シリーズ)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 会社ミッションは「汎用 AI を物理世界へ」。「learning algorithms to create a model that will control any robot to do any task」(単一モデルであらゆるロボット・あらゆるタスクを制御)を掲げる研究企業 | https://www.pi.website/ | 2026-07-07 | 公式確認済み |
| **π0**(2024-10-31 発表): 初の汎用ポリシー(generalist policy)。マルチタスク・マルチロボットのデータで学習した VLA(flow matching ベース)。**2025-02-04 に重みとコードをオープンソース化**(openpi リポジトリ) | https://www.pi.website/ / https://github.com/Physical-Intelligence/openpi | 2026-07-07 | 公式確認済み |
| **π0.5**(2025-04-22 発表): オープンワールド汎化を主張。「見たことのない家(キッチン・寝室)を移動式マニピュレータで片付ける」デモ | https://www.pi.website/(π0.5 記事) | 2026-07-07 | 公式確認済み(能力はベンダー自己報告) |
| **π\*0.6**(2025-11-17 発表): **RECAP**(RL with Experience & Corrections via Advantage-conditioned Policies)により、実演 → 専門家の即時修正 → 自律試行からの強化学習、という 3 段階で**実世界経験から自己改善する VLA**。「難しいタスクでスループット約 2 倍・失敗率半分以下」の帯の改善を自己報告。実タスク例: 家庭での洗濯物折りたたみ、箱の組み立て、業務用マシンでのエスプレッソ抽出 | https://www.pi.website/download/pistar06.pdf / https://arxiv.org/abs/2511.14759 | 2026-07-07 | 公式確認済み(数値はベンダー自己報告) |
| **π0.7**(2026-04-16 発表): 「steerable な汎用モデル」。言語・メタデータ・視覚サブゴール等の多様なプロンプト形式に対応し、**既存スキルの組み合わせで未知タスクを解く構成的汎化**を主張。ファインチューニングなしで π\*0.6 のスペシャリストモデル相当の性能と自己報告。**π0.7 のオープンソース化への言及はページ上になし**(2026-07-07 時点) | https://www.pi.website/blog/pi07 | 2026-07-07 | 公式確認済み(性能はベンダー自己報告) |

### 2.3 NVIDIA(Isaac GR00T シリーズ)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **Isaac GR00T N1**(2025-03、GTC 2025 で発表): 「世界初のオープンな、カスタマイズ可能なヒューマノイド基盤モデル」と主張。VLM(環境解釈)+ diffusion transformer(リアルタイム動作生成)の**デュアルシステム VLA**。実ロボット軌跡・人間動画・合成データの混合で学習。**オープンウェイト・寛容ライセンス**で公開 | https://nvidianews.nvidia.com/news/nvidia-isaac-gr00t-n1-open-humanoid-robot-foundation-model-simulation-frameworks / https://arxiv.org/abs/2503.14734 | 2026-07-07 | 公式確認済み(検索経由) |
| **Isaac GR00T N1.6**(2026-01-05、CES 2026 で発表): 推論型 VLA。**Cosmos Reason(2B VLM)を「脳」として統合**し、高レベル指示をシーン理解に基づく段階的計画に分解。32 層 diffusion transformer(前世代の 2 倍)で全身制御(loco-manipulation)。**Hugging Face で公開** | https://nvidianews.nvidia.com/news/nvidia-releases-new-physical-ai-models-as-global-partners-unveil-next-generation-robots | 2026-07-07 | 公式確認済み |
| 採用パートナー(公式言及): Boston Dynamics、Caterpillar、Franka Robotics、Humanoid、LG Electronics、NEURA Robotics 等 | 同上 | 2026-07-07 | 公式確認済み |

### 2.4 Figure(Helix)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **Helix**(2025-02-20 発表): ヒューマノイド上半身(手首・胴体・頭部・指を含む **35 自由度**)を高レートで連続制御する初の汎用 VLA と主張。**System 2(7B パラメータ VLM、7〜9 Hz、シーン理解・言語理解)+ System 1(80M パラメータ transformer、200 Hz、連続制御)**のデュアルシステム。単一のネットワーク重みで全挙動を実現(タスク別ファインチューニングなし) | https://www.figure.ai/news/helix | 2026-07-07 | 公式確認済み(能力はベンダー自己報告) |
| 「数千種の初見の家庭用品を自然言語プロンプトだけで拾える」「2 台のロボットが協調して長時間タスクを解く初の VLA」と主張。**組込み低消費電力 GPU 上で完全オンボード動作**(「Commercial-ready」と自称) | 同上 | 2026-07-07 | ベンダー自己報告 |
| 物流応用(2025-02-26 の公式レポート): 実演データ約 8 時間からパッケージ仕分けポリシーを構築。ステレオ視覚の導入で「スループット約 60% 向上」等の帯の改善を自己報告。データ量より品質が効くとの主張 | https://www.figure.ai/news/helix-logistics | 2026-07-07 | ベンダー自己報告 |
| **Project Go-Big**: インターネット規模のヒューマノイド事前学習と「人間の動画からロボットへの直接転移」を掲げる取り組み(Helix の学習データ拡大戦略) | https://www.figure.ai/news/project-go-big | 2026-07-07 | 公式確認済み(検索経由。発表日は未確認) |
| 提供形態: Helix は**自社ロボット(Figure 02/03)専用**であり、モデル自体の外部提供・オープンソース化はしていない | https://www.figure.ai/news/helix(記載からの判断) | 2026-07-07 | 公式から推測(外部提供の言及がないことの確認) |

### 2.5 その他の注目発表(2025〜2026)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **Boston Dynamics + Toyota Research Institute(TRI)**: **Large Behavior Model(LBM)**で Atlas を駆動するデモを 2025-08 に公開。「画像・固有受容感覚・言語プロンプトを入力に、30 Hz で Atlas 全身を制御する」言語条件付きエンドツーエンドポリシー。歩行・しゃがみ・重心移動・自己衝突回避を含む全身操作をポリシーが自律的に発揮。データは VR テレオペで収集。手書きプログラミングなしで新規動作を追加できると主張 | https://bostondynamics.com/blog/large-behavior-models-atlas-find-new-footing/ / https://www.tri.global/news/ai-powered-robot-boston-dynamics-and-toyota-research-institute-takes-key-step-towards-general | 2026-07-07 | 公式確認済み |
| **1X(NEO 用 AI)**: 家庭用ヒューマノイド NEO は **NVIDIA Jetson Thor をオンボード「脳」**として搭載し、クラウド非依存でリアルタイム推論(安全クリティカルな機能)を実行と公式発表。1X 自社の AI モデル(Redwood と呼ばれるもの)の詳細は今回未確認 | https://www.globenewswire.com/news-release/2026/04/30/3285118/0/en/1x-opens-neo-factory-in-hayward-ca-america-s-first-vertically-integrated-humanoid-robot-factory-with-consumer-shipments-planned-for-2026.html(1X 発のプレスリリース) | 2026-07-07 | 公式確認済み / Redwood の詳細は未確認 |

---

## 3. 主要プレイヤーの現在地(2026-07 時点)

### 3.1 NVIDIA(フィジカル AI プラットフォーム戦略)

NVIDIA は自社でロボットを作らず、**モデル(GR00T / Cosmos)+ シミュレーション(Omniverse / Isaac)+ エッジ計算(Jetson)** の 3 層をエコシステムに供給する戦略。TechCrunch は「ロボティクスの Android になろうとしている」と評した(二次情報: https://techcrunch.com/2026/01/05/nvidia-wants-to-be-the-android-of-generalist-robotics/ 確認日 2026-07-07)。

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **Cosmos**(world foundation model プラットフォーム、2025-01 の CES 2025 で発表)→ **Cosmos 3**(2026-05-31、GTC Taipei で発表): 「世界初の完全オープンなオムニモデル」と主張。mixture-of-transformers 構成で視覚推論・世界生成・行動予測を単一システムに統合。テキスト・画像・動画・音・行動軌跡を扱い、合成データ生成とロボットポリシー学習の基盤(World Action Model のバックボーン)になる。Hugging Face / GitHub / build.nvidia.com で公開 | https://nvidianews.nvidia.com/news/nvidia-launches-cosmos-3-the-open-frontier-foundation-model-for-physical-ai | 2026-07-07 | 公式確認済み |
| **Cosmos Coalition**(オープン世界モデル推進の企業連合): 創設メンバーは Agile Robots・Black Forest Labs・Generalist・LTX・Runway・Skild AI | 同上 | 2026-07-07 | 公式確認済み |
| **Jetson Thor**(Blackwell 世代のロボット用計算機): 2025-08-25 に一般提供開始。開発キット 3,499 ドル、最大 2,070 FP4 TFLOPS / 128GB / 130W。早期採用: Agility Robotics・Amazon Robotics・Boston Dynamics・Figure・Meta 等。CES 2026 では下位モジュール **Jetson T4000**(70W)も発表 | https://nvidianews.nvidia.com/news/nvidia-blackwell-powered-jetson-thor-now-available-accelerating-the-age-of-general-robotics(検索経由)/ T4000 は https://nvidianews.nvidia.com/news/nvidia-releases-new-physical-ai-models-as-global-partners-unveil-next-generation-robots | 2026-07-07 | 公式確認済み(Thor 本体は検索経由) |
| CES 2026(2026-01-05)で **Cosmos Transfer 2.5 / Predict 2.5(世界モデル)、Cosmos Reason 2(物理理解 VLM)、GR00T N1.6(VLA)** を一括発表。すべて Hugging Face で公開。あわせて **Isaac Lab-Arena**(評価・ベンチマーク用 OSS シミュレーションフレームワーク)、**OSMO**(合成データ生成〜学習〜テストを統合するオーケストレーション)を発表 | https://nvidianews.nvidia.com/news/nvidia-releases-new-physical-ai-models-as-global-partners-unveil-next-generation-robots | 2026-07-07 | 公式確認済み |
| **Isaac GR00T Reference Humanoid Robot**: Jetson Thor + Isaac GR00T 上に構築した初のオープンなヒューマノイド参照設計。**Unitree から 2026 年後半に提供予定**(学術研究向け) | https://nvidianews.nvidia.com/news/nvidia-open-humanoid-robot-reference-design | 2026-07-07 | 公式確認済み(提供時期はベンダー自己報告) |

### 3.2 Google DeepMind

- 位置づけ: **モデル提供者**(ロボットは作らない)。Gemini Robotics ファミリー(§2.1)を Apptronik・Boston Dynamics 等のパートナーと 60 以上の trusted testers に供給。推論層(ER)は Gemini API で一般開発者に開放済み、行動層(VLA)は限定パートナーのみ(確認日 2026-07-07、公式確認済み)
- 世界モデル: **Genie 3**(2025-08-05 発表)は「初のリアルタイム対話型の汎用世界モデル」(720p / 24fps で数分の一貫性)。2026-01-29 に消費者向け「Project Genie」を米国の Google AI Ultra 加入者へ提供開始。出典: https://deepmind.google/blog/genie-3-a-new-frontier-for-world-models/ / https://blog.google/innovation-and-ai/models-and-research/google-deepmind/project-genie/(確認日 2026-07-07、公式確認済み(検索経由))
- 安全性: 「Swiss cheese model」による 3 層安全(semantic / physical / operational)、**ASIMOV ベンチマーク**(robot constitutions)、predictive red teaming を公表。出典: https://deepmind.google/models/gemini-robotics/responsibly-advancing-ai-and-robotics/(確認日 2026-07-07、公式確認済み)

### 3.3 Tesla(Optimus)— 二次情報のみ

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 2026-01 時点で **1,000 台超の Optimus Gen 3(社内呼称 Optimus 3)が Fremont 工場の生産フロアで稼働中**と Musk が発言(と報道) | https://www.teslarati.com/elon-musk-outlines-tesla-optimus-production-expectations/ ほか報道 | 2026-07-07 | 二次情報 |
| **Optimus 3 の量産開始は 2026 年夏(7 月末〜8 月、Fremont)**、初期は極めて低量。まず社内工場用途で、一般消費者販売は早くて 2027 年以降(と報道) | 同上 + Q1 2026 決算説明の報道 | 2026-07-07 | 二次情報 |
| Tesla 公式 IR 資料(株主向けアップデート PDF)・SEC 提出書類は存在するが、今回 403 で本文を直接確認できず | https://ir.tesla.com/press(公式入口) | 2026-07-07 | 未確認(一次資料の本文) |

**執筆上の含意**: Optimus は記事で扱うなら「Musk 発言・決算説明の報道ベースで、2026 年夏に量産開始・まず社内利用、と伝えられている」と伝聞形で書くこと。台数・時期の断定は不可。

### 3.4 Figure

- **Figure 03**(2025 年 10 月発表): Helix 前提で再設計した第 3 世代ヒューマノイド。家庭向けを明示。出典: https://www.figure.ai/news/introducing-figure-03(確認日 2026-07-07、公式確認済み(検索経由))
- **BotQ**(専用工場): 第 1 世代ラインで**年 1.2 万台**、4 年で累計 10 万台の生産目標を公表。2026-05 の報道では「1 日 1 台 → 1 時間 1 台」への増産を自己報告。出典: https://www.figure.ai/news/botq(確認日 2026-07-07、目標値はベンダー自己報告)
- 現在地の評価: **量産立ち上げ期**。商用顧客(BMW 工場でのパイロット等)は過去に公表されているが、2026-07 時点の顧客別展開規模は未確認

### 3.5 1X

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 家庭用ヒューマノイド **NEO** を 2025-10-28 に予約開始し、**5 日で初年度生産能力(1 万台超)が完売**と自己報告。価格は Early Access 2 万ドル(2026 年優先出荷)または月額 499 ドルのサブスクリプション | https://www.globenewswire.com/news-release/2026/04/30/3285118/0/en/1x-opens-neo-factory-in-hayward-ca-america-s-first-vertically-integrated-humanoid-robot-factory-with-consumer-shipments-planned-for-2026.html | 2026-07-07 | 公式確認済み(完売はベンダー自己報告) |
| 2026-04-30、**Hayward(カリフォルニア)の NEO Factory で量産開始**を発表(58,000 平方フィート、年 1 万台 → 2027 年末までに年 10 万台超へ拡張計画)。**初の消費者向け出荷は 2026 年内**の計画 | 同上 | 2026-07-07 | 公式確認済み(能力・時期はベンダー自己報告) |

### 3.6 Boston Dynamics(+ Toyota / TRI)

- 商用製品: 四足の Spot と物流用 Stretch は商用販売中(確度: 二次情報。公式サイトで確認可能だが今回本文未取得)
- 研究の主軸: **電動 Atlas × LBM**(§2.5)。TRI との正式協業で「汎用ヒューマノイド化」を推進(2025-08 のデモが最新の大きな節目。確認日 2026-07-07、公式確認済み)
- 2026-06 には Google DeepMind の Gemini Robotics-ER 1.6 開発に協力(ゲージ読み取り機能)しており、**自社 LBM と外部基盤モデルの併用**という立ち位置(公式確認済み)

### 3.7 Physical Intelligence

- 位置づけ: **ロボットを作らないモデル専業**。π0 のオープンソース化(openpi)でオープンエコシステムにも寄与しつつ、最新モデル(π\*0.6 / π0.7)は論文発表のみで提供形態は未公表(§2.2。確認日 2026-07-07)
- 2026-02-24 に「The Physical Intelligence Layer」と題する発表があり、モデルの提供戦略に関わる可能性があるが、内容は今回未確認(出典: https://www.pi.website/ の記事一覧。確度: 未確認)

### 3.8 Agility Robotics(商用先行の事例として)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 二足ロボット **Digit** は GXO Logistics と 2024-06 に複数年契約を締結(「業界初のヒューマノイド正式商用展開・初の RaaS」と自称)。GXO の施設(SPANX、ジョージア州)で 2024-06 から常時稼働し、2025-10 に**フルタイム稼働 1 周年**・10 万トート超を処理と発表 | https://www.agilityrobotics.com/content/gxo-signs-industry-first-multi-year-agreement-with-agility-robotics | 2026-07-07 | 公式確認済み(検索経由。数値はベンダー自己報告) |
| Schaeffler・GXO・Toyota Motor Manufacturing Canada 等の商用環境で稼働中、9 顧客施設で累計 6.5 万時間超の稼働と自己報告。Mercado Libre とも商用契約を発表 | https://www.agilityrobotics.com/content/mercado-libre-and-agility-robotics-announce-commercial-agreement ほか | 2026-07-07 | ベンダー自己報告(検索経由) |
| 2026 年中頃時点の設置台数は世界で約 75 台との推定(帯: 数十台規模) | https://research.contrary.com/company/agility-robotics ほか | 2026-07-07 | 二次情報 |

### 3.9 日本勢

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **川崎重工**: 2026-05-22、シリコンバレーに「**Kawasaki Physical AI Center San Jose**」開設を発表(開所式 5/21)。NVIDIA・Analog Devices・Microsoft・富士通と協業し、医療・ヘルスケア(病院ワンストップソリューション)を軸にフィジカル AI の社会実装を推進。既存製品(サービスロボット Nyokkey、配送ロボット FORRO、手術支援 hinotori、多脚ビークル CORLEO)との組み合わせを想定 | https://www.khi.co.jp/pressrelease/detail/20260522_1.html | 2026-07-07 | 公式確認済み |
| **トヨタ**: 研究子会社 **TRI(米国)が Large Behavior Model の中核**を担い、Boston Dynamics との協業で Atlas を駆動(§2.5)。トヨタ本体の未来創生センターも「フィジカル AI により、ロボットが人の動きを模倣・学習する可能性が広がった」として生産現場向けロボット(ELEY 等)を研究と公表 | https://www.tri.global/news/ai-powered-robot-boston-dynamics-and-toyota-research-institute-takes-key-step-towards-general / https://global.toyota/jp/mobility/frontier-research/44105139.html | 2026-07-07 | 公式確認済み(TRI)/ 公式確認済み(検索経由)(トヨタ本体) |

---

## 4. 成熟度の全体観(2026-07 時点)

### 4.1 商用に到達している領域と研究段階の領域

| 領域 | 2026-07 時点の状態 | 根拠(§ 参照) | 確度 |
| --- | --- | --- | --- |
| 産業用ロボット・AMR(従来型) | 成熟した商用市場(本調査の対象外だが前提として) | — | 一般知識 |
| **ヒューマノイド × 物流の限定タスク** | **商用初期**。Agility Digit が RaaS で常時稼働(顧客施設 9 か所・約 75 台の帯)。「限定されたタスク(トート移載等)を、構造化された倉庫環境で」が現実の姿 | §3.8 | 公式+二次情報 |
| **ヒューマノイドの量産立ち上げ** | Figure(BotQ)・1X(Hayward)・Tesla(Fremont)がいずれも 2026 年に量産開始(またはその計画)を主張。ただし出荷実績の第三者検証はない | §3.3〜3.5 | ベンダー自己報告 |
| **家庭用ヒューマノイド** | アーリーアクセス期(1X NEO の 2026 年内出荷計画、Figure 03 の家庭向け設計)。「汎用的に家事をこなす」は依然デモ・限定環境の域 | §3.4〜3.5 | ベンダー自己報告 |
| **汎用ヒューマノイド(任意環境・任意タスク)** | 研究段階。π0.7 の「構成的汎化」、Gemini Robotics の「具身間転移」、Atlas LBM はいずれも研究発表・限定デモであり、商用 SLA を伴う汎用性の実証はない | §2 | 公式確認済み(段階の判断は本メモの整理) |

### 4.2 シミュレーション学習(sim-to-real)の位置づけ

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| NVIDIA の公式ワークフローでは、**Isaac Lab での全身強化学習 + 合成データ生成 + 実機転移**が標準構成。「層状の抽象化(全身制御がバランス・接触を担い、上位ポリシーが経路を担う)により、追加のタスク固有データ収集なしの zero-shot sim-to-real transfer」を主張 | https://developer.nvidia.com/blog/building-generalist-humanoid-capabilities-with-nvidia-isaac-gr00t-n1-6-using-a-sim-to-real-workflow/(2026-01-08) | 2026-07-07 | 公式確認済み(zero-shot 主張はベンダー自己報告) |
| GR00T N1 は「実ロボット軌跡 + 人間動画 + 合成データの混合」で学習しており、**実データの不足を合成データで補う**のが業界の共通戦略。GR00T Blueprint(合成運動データ生成)や、Google DeepMind・Disney Research と共同開発の物理エンジン **Newton** も同時発表されている | https://nvidianews.nvidia.com/news/nvidia-isaac-gr00t-n1-open-humanoid-robot-foundation-model-simulation-frameworks | 2026-07-07 | 公式確認済み(検索経由) |
| 一方、Figure(実演テレオペデータ 8 時間で物流ポリシー)、Boston Dynamics/TRI(VR テレオペ)、Physical Intelligence(実演 + 実世界 RL)は**実機データ中心**の路線。「シミュレーション中心(NVIDIA)か実機データ中心(Figure/PI/BD)か」は 2026-07 時点で並立している | §2 の各出典 | 2026-07-07 | 公式確認済み(対比は本メモの整理) |

### 4.3 世界モデル(world model)の公式発表

- **NVIDIA Cosmos**(2025-01 プラットフォーム発表 → 2026-05-31 Cosmos 3): 世界モデルを「合成データ生成 + ポリシー評価 + 行動予測のバックボーン」と位置づけ。「physical AI training and evaluation cycles from months to days」と主張(§3.1。ベンダー自己報告)
- **Google DeepMind Genie 3**(2025-08-05): リアルタイム対話型世界モデル。DeepMind は AGI への stepping stone・エージェント訓練環境としての位置づけを語る(§3.2。公式確認済み(検索経由))
- 執筆上の整理: 世界モデルは 2026-07 時点では「ロボットを直接動かすモデル」ではなく、**VLA の学習・評価を支えるインフラ(データ工場・シミュレータ)**として実用化が先行している

---

## 5. ソフトウェア Agent との接続点

### 5.1 LLM/VLM が計画・推論層に使われている公式事例

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **Gemini Robotics-ER**(1.5/1.6)は「high-level brain」としてタスクを計画し、**Google Search 等のデジタルツールをネイティブに呼び出し**、各ステップを自然言語指示として VLA に渡す。これはソフトウェア Agent の「LLM がツールを呼び出すオーケストレータ」構造と同型で、ツールの一つが「ロボットの身体(VLA)」になっている | https://deepmind.google/blog/gemini-robotics-15-brings-ai-agents-into-the-physical-world/ / https://deepmind.google/models/gemini-robotics/ | 2026-07-07 | 公式確認済み |
| DeepMind 自身がこの構成を「**agentic framework**」「bringing AI agents into the physical world」と表現しており、ソフトウェア Agent の語彙で説明している | 同上(ブログタイトル・本文) | 2026-07-07 | 公式確認済み |
| NVIDIA GR00T N1.6 も「world models such as NVIDIA Cosmos Reason を使って高レベル指示を段階的行動計画に分解する」と説明され、**VLM = 計画層 / diffusion transformer = 実行層**の分離を明示 | https://nvidianews.nvidia.com/news/nvidia-releases-new-physical-ai-models-as-global-partners-unveil-next-generation-robots | 2026-07-07 | 公式確認済み |
| Figure Helix の System 2(7B VLM)/ System 1(80M 制御ポリシー)も同じ分離。S2 が「潜在的な意味表現」を S1 に渡す | https://www.figure.ai/news/helix | 2026-07-07 | 公式確認済み |

### 5.2 「観測 → 思考 → 行動」ループとの構造的な共通性

- **共通性(公式資料で確認できるもの)**:
  - Gemini Robotics 1.5 の「think before taking action」(行動前に思考過程を生成し、透明性を高める)は、ソフトウェア Agent の reasoning ステップと同じ発想(公式確認済み)
  - π\*0.6 の RECAP(実演 → 修正 → 自律試行からの RL)は、ソフトウェア Agent の「実行ログからの評価・自己改善」に相当する学習ループを物理世界で回すもの(公式確認済み)
  - 「計画層(遅い・大きい)と実行層(速い・小さい)の分離」は、ソフトウェア Agent のオーケストレータ/サブエージェント分離と同型(§5.1)
- **相違(公式資料で語られているもの)**:
  - **リアルタイム制約**: Helix S1 は 200 Hz、Atlas LBM は 30 Hz で全身を制御。LLM の推論レイテンシでは間に合わないため、制御層の分離とオンボード実行(Gemini Robotics On-Device、Jetson Thor 搭載の 1X NEO)が必須になっている(§2、§3。公式確認済み)
  - **失敗の不可逆性・物理的安全**: DeepMind は semantic safety(「熱い飲み物を子どもに渡さない」等の常識的制約)と physical safety(下位安全コントローラとの合成)を明確に区別し、「Swiss cheese model」の多層防御・ASIMOV ベンチマーク・predictive red teaming を公表。ソフトウェア Agent の「sandbox で再試行できる」前提が成り立たないことへの対処が体系化されつつある | https://deepmind.google/models/gemini-robotics/responsibly-advancing-ai-and-robotics/(確認日 2026-07-07、公式確認済み)
  - **データ制約**: Web テキストに相当する大規模行動データが存在しないため、テレオペ実演・人間動画・合成データ(世界モデル)の組み合わせでデータを「製造」する必要がある(§4.2。公式確認済み)

**執筆上の含意**: 概観記事の「ソフトウェア Agent との接続点」は、(1) オーケストレータ+ツールの同型性(ER → VLA)、(2) デュアルシステム(遅い思考/速い制御)、(3) 相違点 3 つ(リアルタイム・不可逆性・データ製造)で構成すると、すべて公式一次情報で裏が取れる。

---

## 執筆時の注意(変わりやすい項目)

1. **モデルのバージョン番号は数か月で更新される**(本調査中だけでも Gemini Robotics-ER は 1.5 → 1.6、GR00T は N1 → N1.6、π は π0.5 → π\*0.6 → π0.7、Cosmos は → 3)。記事本文ではバージョン番号を列挙しすぎず、「2026 年 7 月時点では」と付した上で系統名(Gemini Robotics 系、GR00T 系、π 系)で書くのが安全。→ `TODO(要確認)` を付けて公開時に再確認。確認先: https://deepmind.google/models/gemini-robotics/ / https://developer.nvidia.com/isaac/gr00t / https://www.pi.website/
2. **量産・出荷の数値はすべてベンダー自己報告**(Figure の「1 時間 1 台」、1X の「1 万台完売」、Tesla の「1,000 台稼働」)。第三者検証がないことを本文で明示し、数値は帯で書く
3. **Tesla は一次資料が取得できていない**(IR PDF / SEC とも 403)。記事で触れる場合は伝聞形が必須。確認先: https://ir.tesla.com/press
4. **提供形態の区別が変わりやすい**: 2026-07 時点で「一般開発者が API で触れる」のは Gemini Robotics-ER(推論層)のみ。VLA 本体はオープンウェイト(GR00T、π0(旧版)、OpenVLA)か限定パートナー(Gemini Robotics 1.5、Helix)に分かれる。この区分は記事の実用情報として価値が高いが、変化も速い
5. **Physical Intelligence の「The Physical Intelligence Layer」(2026-02-24)は内容未確認**。同社の商用提供形態が変わっている可能性があるため、執筆時に https://www.pi.website/ で要確認
6. **π0.7・π\*0.6 のオープンソース化状況**は 2026-07-07 時点で公表なし(openpi は π0/π0.5 系まで)。GitHub の openpi リポジトリで要確認: https://github.com/Physical-Intelligence/openpi
7. **性能の横並び比較は不可能**と書くこと。VLA には LLM のような共通ベンチマーク・リーダーボードが 2026-07 時点で確立しておらず(NVIDIA が Isaac Lab-Arena を評価基盤として発表した段階)、各社数値は条件の異なる自己報告
