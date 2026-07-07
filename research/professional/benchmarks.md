# P-R4 調査メモ — 公開エージェントベンチマークの全体像

- 調査日: 2026-07-07
- 本メモは執筆用の一次情報整理であり、公開ドキュメントではありません(対象記事: `docs/04-evaluation/agent-benchmarks-landscape.md`)
- 調査方法: 4 系統(コーディング / Web・コンピュータ操作 / 汎用・ツール使用・安全性 / リーダーボード・方法論)の並行調査を統合。公式ページ・arXiv 原論文の WebFetch 直接確認を最優先
- 確度凡例: **公式確認済み** = 公式ページ/arXiv を直接確認 / **ベンダー自己報告** / **二次情報** = 検索スニペット・ミラー・第三者トラッカー経由 / **未確認**

## 1. コーディング系

### SWE-bench ファミリー

| 項目 | 事実 | 出典 / 確認日 / 確度 |
| --- | --- | --- |
| 無印 | 実 GitHub issue に対する修正パッチ生成。2,294 問・Python 12 リポジトリ。fail-to-pass テスト + 回帰確認の自動判定。発表時は Claude 2 で解決率 1.96% | https://arxiv.org/abs/2310.06770 / 2026-07-07 / 公式確認済み |
| Lite | 300 問。評価コスト削減のため「自己完結的なバグ修正」に絞ったサブセット | https://www.swebench.com/lite.html / 2026-07-07 / 公式確認済み |
| Verified | OpenAI が著者らと協力した人手検証済み 500 問(2024-08)。93 名のエンジニアが 1,699 問を各 3 名でレビューし、38.3% が問題文不明瞭・61.1% が不当に落とすテストとフラグ、計 68.3% を除外。GPT-4o(Agentless)は無印 16% → Verified 33.2% | swebench.com/verified.html(500 問・OpenAI 協力は公式確認済み)。数値詳細は openai.com が 403 のためミラー + https://epoch.ai/benchmarks/swe-bench-verified で裏取り / 2026-07-07 / 二次情報(93 名の点は Epoch ページで確認) |
| Verified の残存問題 | Epoch AI 推定で検証後もエラー率 5〜10%。500 問中 django が 231 問(46%)という偏り | https://epoch.ai/benchmarks/swe-bench-verified(公式確認済み)/ 偏りは https://simonwillison.net/2026/Feb/19/swe-bench/(二次情報)/ 2026-07-07 |
| Multimodal | 視覚要素を持つ JS ソフトウェアのバグ修正 617 問(2024-10) | https://arxiv.org/abs/2410.03859 / 2026-07-07 / 公式確認済み |
| Multilingual | 300 問・9 言語・42 リポジトリ。専用リーダーボードあり | https://www.swebench.com/multilingual-leaderboard.html / 2026-07-07 / 公式確認済み |
| Pro(Scale AI) | エンタープライズ級の長期タスク。全 1,865 問 = public 731(GPL リポジトリ)+ commercial 276(非公開スタートアップコード)+ held-out 858(結果非公開)。汚染耐性を明示的に設計。2026-07 時点の公式トップ帯は **5 割台** | https://labs.scale.com/leaderboard/swe_bench_pro_public / 2026-07-07 / 公式確認済み(論文 arXiv 2509.16941 は二次情報) |
| 公式リーダーボードの運用 | 公式評価は mini-SWE-agent(bash のみの統一ハーネス)で統一実行する方式へ移行。verified チェックマーク(運営がサブセット再実行)制度あり | https://www.swebench.com/ ほか / 2026-07-07 / 公式確認済み(bash-only 区分の表示は取得できず一部未確認) |
| スコア帯の乖離 | 公式統一条件(bash-only)では上位 **7 割台半ば〜後半**(2026-02 時点)。ベンダー自己報告の集約サイトでは **9 割台半ば** — 同一ベンチで実行条件により大差 | https://simonwillison.net/2026/Feb/19/swe-bench/(公式ボード転記)・llm-stats.com / 2026-07-07 / 二次情報 |
| 批判・汚染 | SWE-bench+: 成功パッチの 32.67% は issue 本文に解法が記載(solution leakage)、31.08% は弱いテストで不正解でも通過(arXiv 2410.06992、直接確認)。「SWE-Bench Illusion」: issue 文のみからファイルパスを最大 76% 特定 = 記憶・汚染の証拠(arXiv 2506.12286、二次)。UTBoost: テスト不備による誤判定(arXiv 2506.09289、二次) | 各 arXiv / 2026-07-07 |
| OpenAI の「引退」宣言 | 2026-02、OpenAI が汚染と壊れたテスト(監査した失敗の約 59% がテスト起因)を理由に Verified の報告を停止し Pro を推奨、と公表 | 原文 https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/ は 403。ミラー(dev.to 等)で確認 / 2026-07-07 / 二次情報 |

### Terminal-Bench(Stanford × Laude Institute)

- ターミナル環境での実世界エンドツーエンドタスク(コード編集・ビルド・サーバ構築・データ処理等)。2.0 = 89 タスクに厳選、2.1 が並存。新フレームワーク Harbor 上で動作。**運営チームが再実行・検証**する方式。2026-07 時点トップ帯は 2.0 / 2.1 とも **8 割前後〜8 割台前半**、2026-06 提出まで更新継続中|https://www.tbench.ai/ ・ https://github.com/laude-institute/terminal-bench / 2026-07-07 / 公式確認済み

### その他コーディング系

- **SWE-Lancer**(OpenAI): Upwork 実案件 1,400 件超・実支払総額 $1M 分を「獲得金額」で評価。3 重検証済み E2E テスト。公開リーダーボードは 2025-07 更新で事実上停滞|https://arxiv.org/abs/2502.12115 ・ https://swelancer.github.io/leaderboard/ / 2026-07-07 / 公式確認済み
- **Aider polyglot**: Exercism 演習 225 問・6 言語。コミット・コスト付きの実測型だが、最終更新 2025-11 で約 7 か月停滞|https://aider.chat/docs/leaderboards/ / 2026-07-07 / 公式確認済み
- **SWE-bench-Live**(Microsoft): 自動更新パイプラインで test スプリットを月次更新する汚染フリー型。多言語 + Windows/Linux|https://swe-bench-live.github.io/ / 2026-07-07 / 公式確認済み(タスク数は未確認)
- **Multi-SWE-bench**(ByteDance): 7 言語 1,632 問(arXiv 2504.02605、二次)。**LiveCodeBench / LiveCodeBench Pro**: コンテスト問題を継続収集し日付フィルタで汚染回避(競技プログラミング系。arXiv 2403.07974 / 2506.11928、公式サイトは確認済み)。**Commit0**: 仕様とテストからライブラリをゼロから生成(arXiv 2412.01769、二次)。**METR RE-Bench**: ML 研究エンジニアリング 7 環境 + 人間専門家実測比較。2 時間予算ではエージェント優位、32 時間予算では人間優位(arXiv 2411.15114、二次)

## 2. Web 操作・コンピュータ操作系

| ベンチ | 事実 | 出典 / 確認日 / 確度 |
| --- | --- | --- |
| WebArena | 自己ホスト型の複製 Web サイト群(EC・フォーラム・GitLab 等)812 タスク。実行ベース自動判定。人間 78.24% に対しトップ 74.3%(2026-02 掲載)= **ほぼ飽和**。リーダーボードは Google Sheets の自己申告 | https://github.com/web-arena-x/webarena ・公式シート / 2026-07-07 / 公式確認済み(エントリは自己申告) |
| WebArena の評価問題 | 812 中 335 タスクが部分文字列一致採点でゲーミング可能、config 内に参照解が含まれる構造(BenchJack、arXiv 2605.12673)。fuzzy_match の誤判定(WebChoreArena、arXiv 2506.01952) | 各 arXiv / 2026-07-07 / 二次情報 |
| VisualWebArena | WebArena のマルチモーダル拡張。910 タスク。人間ベースライン約 89% | https://github.com/web-arena-x/visualwebarena / 2026-07-07 / 公式確認済み |
| Mind2Web 系 | 初代(2,350 タスク)は**オフライン評価**で実環境成功率と乖離。Online-Mind2Web(300 タスク・ライブ + WebJudge 自動判定、論文題「An Illusion of Progress?」)が既報の過大評価を指摘。Mind2Web 2(130 タスク)は Agentic Search を木構造ルーブリック(Agent-as-a-Judge)で評価 | https://osu-nlp-group.github.io/Mind2Web/ ・ https://arxiv.org/abs/2504.01382 ・ https://osu-nlp-group.github.io/Mind2Web-2/ / 2026-07-07 / 公式確認済み |
| OSWorld | 実 OS 上のコンピュータ操作 369 タスク・実行ベース評価。人間 72.36%。**OSWorld-Verified**(2025-07): 約 300 件の問題報告を 10 人 × 2 か月で修正。リーダーボード掲載はメンテナーがコードを実行する第三者実測枠あり。トップは 80% 台(二次)で人間超え → **OSWorld 2.0**(2026-06): 108 の長時間ワークフロー(平均 318 ツール呼び出し)、ベスト 20.6% | https://osworld-v1.xlang.ai/ ・ https://xlang.ai/blog/osworld-verified ・ https://osworld-v2.xlang.ai/ / 2026-07-07 / 公式確認済み(2.0 スコアも公式) |
| AndroidWorld(Google) | Android 実アプリ 20 個・116 タスク。パラメータのランダム化で動的生成。トップ 97.4% > 人間 80.0% = **事実上飽和** | https://github.com/google-research/android_world ・公式シート / 2026-07-07 / 公式確認済み |
| BrowseComp(OpenAI) | 見つけにくい情報の持続的ブラウジング探索 1,266 問。人間トレーナーは 29.2% しか解けない設計。発表時 Deep Research 51.5%(自己報告)。公式リーダーボードなし | https://arxiv.org/abs/2504.12516 / 2026-07-07 / 公式確認済み(スコアはベンダー自己報告) |
| Computer Agent Arena | コンピュータ操作エージェント 2 体を人間投票で比較する ELO 型。「静的ベンチマークと順位が大きく入れ替わる」と報告 | https://github.com/xlang-ai/computer-agent-arena / 2026-07-07 / 二次情報(本体サイト 522) |

## 3. 汎用アシスタント・対話ツール・安全性系

| ベンチ | 事実 | 出典 / 確認日 / 確度 |
| --- | --- | --- |
| GAIA | ツール活用を要する実世界アシスタント質問 466 問(公開 300 + 非公開 166)。exact match 自動判定。人間 92% に対しトップ 92% 台 = **飽和**。HF リーダーボードは運用不安定(ダウン・提出エラー報告) | https://arxiv.org/abs/2311.12983 ・ HF discussions / 2026-07-07 / 公式確認済み(トップ帯は二次) |
| GAIA2(Meta ARE) | 2025-09 公開。スマートフォン風の**動的・非同期環境** 800 シナリオ(コア 5 + 拡張 2 能力 × 160)。曖昧性・ノイズ・時間制約・Agent2Agent を測る | https://arxiv.org/abs/2509.17158 ・ facebookresearch.github.io の公式ドキュメント / 2026-07-07 / 公式確認済み |
| HLE(Humanity's Last Exam) | 2,500 問・100 超科目・約 1,000 名の専門家作問(CAIS + Scale AI、Nature 掲載)。**非公開ホールドアウトセット**を保持。公式サイト表示トップ 38.3%(最新モデルへの追随遅れの可能性)、第三者計測は評価条件により 45〜65% 帯。ツール・検索併用で +6〜12pt 上振れ | https://lastexam.ai/ ・ https://arxiv.org/abs/2501.14249 / 2026-07-07 / 公式確認済み(第三者帯・ツール上振れは二次/ベンダー自己報告) |
| HLE の正解疑義 | FutureHouse 検証(2025-07): 化学・生物サブセットの 29±3.7% の正解が査読文献と矛盾。HLE チーム自身の追跡でも約 18% に問題。原因はレビュー時間制限 + 「モデルが誤答した問題を採用」というプロトコル | https://www.futurehouse.org/research-announcements/hle-exam / 2026-07-07 / 公式確認済み(指摘者の公式ブログ) |
| τ-bench(Sierra) | ユーザーシミュレータとの対話 + ドメイン API + ポリシー遵守。会話終了時の DB 状態比較で自動判定。**pass^k**(k 回全試行成功)で信頼性を測定 — retail の pass^8 < 25%。airline 中心にタスク不備があり、**τ³-bench**(2026-03、banking 追加・音声評価対応)で airline 27 + retail 26 タスクを修正。修正で airline pass^1 が +14〜20pt 変動 = 旧スコアは過小評価だった | https://arxiv.org/abs/2406.12045 ・ https://github.com/sierra-research/tau2-bench ・ https://taubench.com/blog/tau3-task-fixes.html / 2026-07-07 / 公式確認済み |
| τ²-bench | dual-control(ユーザー側もツールを持つ)環境。「ユーザーに操作を案内する」能力で性能が大幅低下することを示した | https://arxiv.org/abs/2506.07982 / 2026-07-07 / 公式確認済み |
| BFCL(Berkeley) | 関数呼び出し評価の定番。V4 でエージェント評価(Web 検索・メモリ・フォーマット頑健性)に拡張。ライブ更新継続中(2026-04 更新表示)。トップ 70〜75% 帯(二次) | https://gorilla.cs.berkeley.edu/leaderboard.html / 2026-07-07 / 公式確認済み(スコア帯は二次) |
| MCP-Bench(Accenture) | 実 MCP サーバ 28 個・250 ツールに接続し、曖昧指示からのツール発見・クロスドメイン連携を評価 | arXiv 2508.20453 / 2026-07-07 / 二次情報 |
| AgentBench(THUDM) | 8 環境の初期包括ベンチ。2025-10 の FC 版(function calling)でメンテ継続 | https://github.com/THUDM/AgentBench / 2026-07-07 / 公式確認済み |
| MLE-bench(OpenAI) | Kaggle 75 コンペで ML 実務を測定(メダル獲得率)。論文時 16.9% → 2026-07 トップ 64% 台。2026-04 から新規提出を一時停止中 | https://github.com/openai/mle-bench / 2026-07-07 / 公式確認済み |
| PaperBench(OpenAI) | ICML 2024 論文 20 本の再現。8,316 ノードの階層ルーブリック + LLM judge(judge 自体を JudgeEval で検証)。人間(ML PhD)未超え | https://arxiv.org/abs/2504.01848 / 2026-07-07 / 公式確認済み |
| AgentHarm(UK AISI + Gray Swan) | 悪意あるエージェントタスク 110(拡張 440 プロンプト)・11 カテゴリ。(1) 拒否率と (2) jailbreak 後の能力保持の 2 軸 | https://arxiv.org/abs/2410.09024 / 2026-07-07 / 公式確認済み |
| Agent-SafetyBench(清華) | 349 環境・2,000 ケース・8 リスクカテゴリ。評価した 16 エージェントすべてが安全スコア 60% 未満 | arXiv 2412.14470 / 2026-07-07 / 二次情報 |
| 横断的指摘 | UC Berkeley RDI(2026-04): 主要エージェントベンチ 8 種が reward hacking で「タスクを解かずにほぼ満点」を取れると報告 | 検索スニペット / 2026-07-07 / 二次情報(原文未確認) |

## 4. リーダーボード・集約サイト

| サイト | 性格 | 出典 / 確認日 / 確度 |
| --- | --- | --- |
| HAL(Holistic Agent Leaderboard、Princeton) | **第三者による標準化実測**。統一ハーネスで全エージェントを再実行しログ全公開。**コスト × スコアのパレート表示**が中核("Agents can be 100x more expensive while only being 1% better")。9 ベンチ × 9 モデル・21,730 実行の論文(arXiv 2510.11977)では「推論努力を上げると過半の実行で精度が低下」も報告 | https://hal.cs.princeton.edu/ / 2026-07-07 / 公式確認済み |
| Arena(旧 LMArena、2026-01 リブランド) | 人間のペアワイズ投票による**選好ランキング**(能力の実測ではない)。WebDev Arena 等のエージェント的区分あり。コスト軸なし | https://arena.ai/blog/webdev-arena/ / 2026-07-07 / 公式確認済み(リブランド詳細は二次) |
| Artificial Analysis | 独立系の**自社実測**。Intelligence Index v4.1 はエージェント系が 34%(GDPval-AA v2 20% + τ³-Banking 14%)+ Terminal-Bench v2.1 16% 等で構成。知能 × 価格 × 速度の比較が主要機能 | https://artificialanalysis.ai/methodology/intelligence-benchmarking / 2026-07-07 / 公式確認済み |
| Epoch AI | **混合型**(独自実測 + 外部データ集約)。ベンチ単位で方法論を明記(SWE-bench Verified は独自 minimal scaffold で実測) | https://epoch.ai/benchmarks / 2026-07-07 / 公式確認済み |
| SWE-rebench(Nebius) | 固定 scaffold の第三者実測。**各モデル 5 回実行の平均 ± SEM** を報告。issue 作成日 × モデルリリース日で汚染疑いを明示マーク | https://swe-rebench.com/about / 2026-07-07 / 公式確認済み |
| Vals AI | ドメイン特化(法務・金融・医療)の独立評価。非公開データセット併用。コスト軸なし | https://www.vals.ai/benchmarks / 2026-07-07 / 公式確認済み |
| LiveBench | 月次更新 + ground truth 自動採点(LLM judge 不使用)の汚染抑制型 | https://arxiv.org/abs/2406.19314 / 2026-07-07 / 公式確認済み(サイト本体は JS で取得不可) |

## 5. ベンチマークの読み方に関わる事実

### スキャフォールド(ハーネス)依存性

- SWE-bench 公式リーダーボードは「モデル × scaffold」の組で提出される設計(公式確認済み)
- Anthropic 公式脚注: Claude 3.7 Sonnet の SWE-bench Verified は minimal scaffold(bash + ファイル編集のみ)63.7% → 並列複数試行 + スコアリングモデル選択の custom scaffold で 70.3%。**同一モデルで約 7pt 差**|https://www.anthropic.com/news/claude-3-7-sonnet / 2026-07-07 / 公式確認済み(ベンダー自己報告)
- METR: 同一 scaffold でポスト学習・エリシテーションにより成功率 5±2% → 30±6%(GPT-4 系)。「単純な scaffold でのみ試験しており、エリシテーション努力で性能は上がる」と各評価レポートで繰り返し記載|https://metr.org/blog/2024-03-15-measuring-post-impact-enhancements/ / 2026-07-07 / 公式確認済み
- CORE-Bench ケーススタディ: 同一モデルが 2 つの scaffold で**同じ精度 82.1% でもタスク単位では 31% で成否が食い違う**|arXiv 2606.26158 / 2026-07-07 / 二次情報
- 公式統一条件(bash-only 7 割台)とベンダー自己報告(9 割台)の乖離(§1)も同根

### pass@k と pass^k

- pass@k の不偏推定量の定義は HumanEval 論文(arXiv 2107.03374)。素朴な計算は過小推定になる(公式確認済み)
- τ-bench の pass^k は「k 回**すべて**成功する確率」で信頼性を測る逆向きの指標。エージェントは試行間ばらつきが大きく、pass@1 の 1 回実行報告が実勢。ばらつきを報告するのは SWE-rebench(5 回平均 ± SEM)、HAL(全ログ公開)など少数

### コスト軸

- "AI Agents That Matter"(arXiv 2407.01502、Princeton): (1) 精度のみの報告が高コストエージェントを過大評価、(2) 精度 × コストのパレート最適化を提案、(3) 多くのベンチにホールドアウトがなく過学習が起きている、(4) 標準化・再現性不足|2026-07-07 / 公式確認済み
- コスト軸を持つのは HAL・Artificial Analysis。LMArena/Arena・Vals・SWE-rebench にはなし

### 汚染(contamination)と対策

- 対策の型: **非公開ホールドアウト**(HLE、SWE-bench Pro の commercial/held-out — commercial では全モデルがスコアを落とし順位も入れ替わる)/ **定期更新・ライブ型**(LiveCodeBench の日付フィルタ、SWE-bench-Live 月次、LiveBench 月次、SWE-rebench の汚染疑いマーク)
- 汚染の実証例: LiveCodeBench で DeepSeek 系が 2023-09 以降の問題で急落。GSM1k(GSM8K の新規同等版)で最大 8% 低下 = 系統的過学習の証拠(arXiv 2405.00332、公式確認済み)

### ベンチマーク自体の品質問題(スコア差の解釈限界)

- Verified の経緯(§1): 元 SWE-bench の 68.3% に問題 → 人手検証でスコアが約 2 倍変動
- τ³ のタスク修正で airline pass^1 が +14〜20pt 変動(§3)
- HLE の正解疑義: 化学・生物の約 3 割(§3)
- OSWorld 原版の約 300 件の不具合を運営が自認・修正(§2)
- → 数 pt のスコア差はベンチ品質ノイズに埋もれうる、が定量的に裏付けられている

## 6. WebFetch 失敗・取得不能の記録(2026-07-07)

- openai.com の各記事(Verified 発表・評価停止告知・BrowseComp): **HTTP 403**。ミラー + Epoch AI + 検索スニペットで裏取り
- x.ai(Grok のツール併用スコア): 403
- HF Spaces(GAIA / GAIA2 リーダーボード)・taubench.com・livebench.ai・arena.ai・swe-rebench.com トップ: JS レンダリング・サイズ超過で数値取得不可
- swebench.com トップのスコア表: ページ途中切断で数値取得不可(区分名のみ確認)

## 7. 執筆への示唆(agent-benchmarks-landscape.md)

1. 具体スコアは本文に持ち込まず、帯・傾向(飽和/人間超え/大幅な余地)のみ記載。数値はこのメモに閉じ込める
2. 本文の中心メッセージ: (a) 自己報告と第三者実測の区別、(b) ハーネス依存性、(c) 汚染・飽和と後継への移行パターン(SWE-bench→Pro、OSWorld→2.0、Mind2Web→2、GAIA→GAIA2、τ→τ³)、(d) コスト軸、(e) 最終判断は自社評価
3. OpenAI の Verified 評価停止など一次ページ未確認の事実は本文で断定しない(このメモの確度表記を参照)
4. 定点観測(四半期): SWE-bench Pro / Terminal-Bench 2.x / HAL / τ³ / OSWorld 2.0 / GAIA2 のスコア推移とリーダーボード運用状態
