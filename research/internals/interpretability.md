## 調査メモ: LLM の解釈可能性研究の現在地(IN-R1)

方針: 本メモは鮮度管理型記事「LLM の解釈可能性の基礎」の裏取り用。研究フロンティアのため変化が速い前提で、**一次情報の所在(URL)を特定**し、各手法の有効性・安全監査への貢献は**著者/ラボの自己報告**として扱い、本文で断定に使わないことを徹底する。ラボ横断で読める中立なレビュー論文を「但し書き」の根拠として優先的に押さえた。arXiv 番号は abstract ページを直接取得して実在確認したもののみ「公式確認済み」とし、未取得のものは確度欄で明示する。

---

### 回路(circuits)研究: 誘導ヘッドと回路発見の原典

- **確認先**: Olsson, Elhage, Olah ら(Anthropic、Transformer Circuits Thread)/ Olah, Cammarata ら(旧 OpenAI、Distill Circuits Thread)
- **一次情報 URL**:
  - 誘導ヘッド論文(arXiv): https://arxiv.org/abs/2209.11895 (Olsson et al., "In-context Learning and Induction Heads")
  - 同・公式ウェブ版: https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html
  - 回路研究の入口(Distill): https://distill.pub/2020/circuits/zoom-in/ (Olah et al., "Zoom In: An Introduction to Circuits")
  - Transformer Circuits Thread のトップ: https://transformer-circuits.pub/
- **扱う範囲(中立記述)**: 誘導ヘッド論文は、`[A][B] … [A] → [B]` というパターンを補完する注意ヘッド(誘導ヘッド)が in-context learning の主要なメカニズムであり得ると**主張**する。論文自身の記述では「誘導ヘッドが形成される時点と、訓練損失に現れる in-context learning 能力の急な立ち上がりが一致する」とされる(=著者の観察・自己報告)。「Zoom In」は解釈可能性の 3 つの作業仮説「特徴(features)/回路(circuits)/普遍性(universality)」を提示する立場表明であり、実証というより研究プログラムの枠組み提示。
- **確認日**: 2026-07-09
- **確度**: 公式確認済み(arXiv:2209.11895 の abstract を取得し、タイトル・著者 Olsson ほか・投稿日 2022-09-24 を確認)。transformer-circuits と distill の各ページ URL は検索結果で所在確認、本文は未取得のため内部主張は「公式ページ存在(内容未読)」扱い。

---

### 重ね合わせ(superposition)仮説とスパースオートエンコーダ(SAE)

- **確認先**: Anthropic(Transformer Circuits Thread)
- **一次情報 URL**:
  - Toy Models of Superposition(公式): https://transformer-circuits.pub/2022/toy_model/index.html
  - 同(arXiv): https://arxiv.org/abs/2209.10652 (Elhage et al., 16 著者)
  - Towards Monosemanticity(2023): https://transformer-circuits.pub/2023/monosemantic-features/index.html
  - Scaling Monosemanticity(2024, Claude 3 Sonnet): https://transformer-circuits.pub/2024/scaling-monosemanticity/
- **扱う範囲(中立記述)**:
  - **重ね合わせ仮説**: 「Toy Models of Superposition」は、ニューロンが複数の無関係な概念を同時に担う多義性(polysemanticity)を、モデルが次元数より多くのスパースな特徴を「重ね合わせ」で格納する現象として説明できると**主張**する。小さな ReLU ネットワークの玩具モデルで相転移などを観察したとする自己報告。
  - **SAE = 特徴の疎な分解**: 「Towards Monosemanticity」は 1 層 Transformer に対し、辞書学習の一種であるスパースオートエンコーダ(SAE)を用いて、ニューロンより単義的(monosemantic)な「特徴」を多数抽出したと**主張**。SAE が「表現を疎に分解して解釈可能な特徴を取り出す」手法である、という位置づけの一次情報がここにある。
  - **スケール**: 「Scaling Monosemanticity」は同手法を製品モデル Claude 3 Sonnet に適用し、「Golden Gate Bridge」のような具体的特徴から「コードのバグ」のような抽象的特徴まで抽出でき、特徴の操作(steering)で挙動が変化したと**主張**。これはラボの自己報告であり、性能・安全性への含意は断定しない。
- **確認日**: 2026-07-09
- **確度**: Toy Models は arXiv:2209.10652 の abstract を取得し公式確認済み。Towards Monosemanticity と Scaling Monosemanticity は公式 URL の所在を検索で確認したが本文は未取得(Scaling は取得サイズ超過で内容未読)=「公式ページ存在(内容未読)」。
  - **注意(番号の罠)**: 検索結果に Scaling Monosemanticity の arXiv として `2605.29358` が現れたが、`2605` は 2026-05 を意味し 2024 年公開の論文と整合しない(ミラー/誤記の疑い)。**この arXiv 番号は使わず、正本は transformer-circuits.pub の URL とする**。arXiv 版の要否は執筆時に要再確認。

---

### プロービング(probing)と表現分析

- **確認先**: Alain & Bengio(Mila)ほか。NLP 系の代表例として Hewitt & Manning(Stanford)、サーベイとして Belinkov & Glass
- **一次情報 URL**:
  - Alain & Bengio, "Understanding intermediate layers using linear classifier probes": https://arxiv.org/abs/1610.01644
  - Hewitt & Manning, "A Structural Probe for Finding Syntax in Word Representations"(NAACL 2019): https://aclanthology.org/N19-1419/ (arXiv 番号は未確認)
  - Belinkov & Glass, "Analysis Methods in Neural Language Processing: A Survey"(TACL): arXiv 番号は未確認(要確認)
- **扱う範囲(中立記述)**: 線形プローブは、中間層の表現の上に独立に訓練した線形分類器を載せ、「ある情報が表現中に線形分離可能な形で存在するか」を測る手法。Alain & Bengio が層ごとの線形分離可能性を追う枠組みを提示した原典。Hewitt & Manning は BERT の埋め込み空間に構文木距離が近似的に線形写像として符号化され得ると**報告**。重要な但し書きとして、**プローブは「情報がアクセス可能か」を測るのであって「その層が因果的にその計算を行っている」ことの証明ではない**点は分野で広く共有されている(機構的解釈可能性が因果介入を重視する動機でもある)。
- **確認日**: 2026-07-09
- **確度**: Alain & Bengio(1610.01644)は arXiv abstract ページの所在を検索で確認=公式ページ存在。Hewitt & Manning は ACL Anthology の所在を推定(N19-1419)だが直接未取得。Belinkov & Glass の arXiv 番号は未確認。プロービング系は執筆時に ID を再確認すること。

---

### 帰属と「注意は説明か」論争

- **確認先**: Jain & Wallace(Northeastern)/ Wiegreffe & Pinter(Georgia Tech)
- **一次情報 URL**:
  - "Attention is not Explanation"(Jain & Wallace, NAACL 2019): https://arxiv.org/abs/1902.10186
  - "Attention is not not Explanation"(Wiegreffe & Pinter, EMNLP 2019): https://arxiv.org/abs/1908.04626 / https://aclanthology.org/D19-1002/
- **扱う範囲(中立記述)**: Jain & Wallace は、注意重みが勾配ベースの重要度としばしば無相関で、同じ予測を与える別の注意分布を構成できることを示し、「注意重みを説明として扱うべきでない」と**主張**。Wiegreffe & Pinter は「説明」の定義次第であり、モデル全体を考慮した検証(一様重みベースライン、シード間分散、凍結重み診断、敵対的注意訓練の 4 テスト)が必要だと反論。両者は「注意重みを説明として解釈するには慎重さが要る」点ではおおむね一致。**この論争自体が、単一の帰属手法を根拠に断定してはならないことの好例**として本文で使える。
- **確認日**: 2026-07-09
- **確度**: 公式確認済み(両論文とも arXiv abstract を取得し、タイトル・著者・投稿日・採択会議を確認。前者 1902.10186 は 2019-02-26 投稿/NAACL 2019、後者 1908.04626 は 2019-08-13 投稿/EMNLP 2019)。

---

### 解釈可能性の限界・実務応用の現状(中立レビュー)

- **確認先**: Bereska & Gavves(University of Amsterdam)/ Sharkey ほか(Apollo Research 他、複数機関)/ Zhao ほか(LLM 説明可能性サーベイ)
- **一次情報 URL**:
  - Bereska & Gavves, "Mechanistic Interpretability for AI Safety — A Review": https://arxiv.org/abs/2404.14082 (2024)
  - Sharkey et al., "Open Problems in Mechanistic Interpretability": https://arxiv.org/abs/2501.16496 (2025, https://arxiv.org/html/2501.16496v1)
  - Zhao et al., "Explainability for Large Language Models: A Survey": https://arxiv.org/abs/2309.01029
- **扱う範囲(中立記述)**: これらはラボ横断の**レビュー/オープン問題集**であり、機構的解釈可能性を「計算メカニズムを人間が理解できるアルゴリズムに逆算する」試みと定義したうえで、スケーラビリティ・自動化・網羅的解釈・因果的検証の難しさを課題として挙げる。安全性(理解・制御・アライメント)への有用性が**動機**として語られる一方、能力向上や dual-use のリスクにも触れる。これらは特定ラボの成果報告ではなく、限界を中立に述べる根拠として使いやすい。デバッグ・安全監査への応用は「研究段階の期待」であり、確立した実務標準ではない、という温度感の裏取りに適する。
- **確認日**: 2026-07-09
- **確度**: 3 本とも arXiv abstract ページの所在を検索で確認=公式ページ存在(内容未読)。Bereska & Gavves は TMLR 掲載の査読レビュー、Sharkey et al. は多機関共著のオープン問題集という位置づけまでは検索で確認。細部の主張を引く場合は本文取得を推奨。

---

## 記事執筆時の注意

**断定を避けるべき点(中立・自己報告扱い):**

- SAE / 単義的特徴の**有効性・網羅性**は Anthropic 等の**自己報告**。「SAE で LLM を解釈できる/安全監査できる」と断定しない。「特徴を疎に分解しようとする研究手法で、成果は報告されているが評価・スケールに未解決問題が残る段階」と書く。
- 誘導ヘッドが in-context learning の「原因」だと**言い切らない**。「主要メカニズムの候補として提案され、著者は訓練損失の相転移との一致を観察したと報告」に留める。
- 「注意は説明か」は**未決着**。注意重みや単一の帰属手法を「モデルの説明」として断定的に提示しない(Jain & Wallace ↔ Wiegreffe & Pinter の対立をそのまま紹介するのが安全)。
- プロービングの結果は「情報のアクセス可能性」であって「因果的メカニズム」ではない、という限界を必ず併記。
- 安全監査・デバッグへの応用は「研究段階の期待」。実務で確立した標準的手法であるかのように書かない(中立レビュー Bereska & Gavves / Sharkey et al. を限界の根拠に)。
- 分野の**変化が速い**ため、具体的な特徴数・モデル名・「最新手法」を断定で書かず「2026 年時点では」と絶対時間表現+ `TODO(要確認)` を添える。

**変わりやすい項目(定点観測候補):**

- Scaling Monosemanticity 以降の**後継研究**(より大きな/新しいモデルへの SAE 適用、attribution graphs、回路追跡など Transformer Circuits Thread の新規記事)。arXiv 版の有無も含め要定点観測。
- SAE の**評価・批判**動向(「SAE が canonical な特徴単位を与えるか」への反証・代替手法の登場)。
- Transformer Circuits Thread と distill.pub の URL 構成(過去記事はほぼ不変だが、新規記事の追加を定期確認)。
- 機構的解釈可能性の**安全監査への実運用**が「期待」から「標準」へ動くか(標準機関・主要ラボの但し書きの変化)。現時点で NIST 等の標準機関による機構的解釈可能性の実務規格は本調査では未確認(要探索)。
- 各 arXiv 番号の**正誤**(特に Scaling Monosemanticity の arXiv 番号は今回のミラー誤記に注意。執筆時に公式ページから再確認)。
