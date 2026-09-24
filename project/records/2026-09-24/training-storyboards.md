# 次単位C 詳細候補 — 学習2図 → 事前学習5図

> 移管記録: 別PCで再開するため、独立承認済みのTEMP計画をここへ保存した。計画時点の内容を保ち、JSONリンクを相対化し、改行・URLの体裁をMarkdown規約へ整えた。機械可読JSONは元のバイトを保持している。[計画レビュー](training-storyboards-review.md)はGitの改行契約に合わせCRLFをLFへ正規化しただけで、内容は同じ。製品実装・表示・公開の受入ではない。

レビューMDの元生バイトSHA-256は `a6e683505cac5c3cbeda6d533924f915d7008ae9bc24c07aa424ef724185273a`、LF版は `987ff768a56f9ee7bad31da115f5a3511c2ff0662426b8c6567d466bc9fa8d7f`。新PCのcheckoutでもLF版hashが維持されるようにした。

計画MDの旧名・元hashと移管後hash、JSON・レビューの対応は[移管対応表](training-storyboards-transfer.json)に保存する。計画本文の意味変更は含まない。

2026-09-24。独立レビュー用の候補1案。所有・変更範囲はこのMDと同名JSONのTEMPファイルだけ。B（推論内部）の公開受入前にC製品実装を開始しない。計画合格、ローカル実装検査、公開受入は別の判定である。

## 採択候補と制作順序

C1として学習パイプラインの2図・10段階を制作し、独立レビュー・公開受入を完了する。その後、C2として事前学習の5図・23段階を制作し公開受入する。7図を一度に公開する別案は併記しない。本文への新しい説明段落・具体例は追加せず、下記6か所の事実関係の最小訂正と原ASTの包装だけを予定する。数値例は図内だけの短い固定説明例である。

7図は33段階、本文に結び付くREAD停止は28段階。手動のみの5段階は補助比較に限定する。動的50論点は全て最低1つREAD停止面に表示する。実務適用・アンチパターン・チェックリスト29項目は原文リストで保持し、各項目にstaticReasonと対応READ面を付けた。完全な79論点台帳・図契約・観測digestは [training-storyboards.json](training-storyboards.json) が機械可読の補助正本である。

|単位|図ID / export|段階数|READ停止|手動のみ|
|---|---|---:|---|---|
|C1|training-stages / TrainingStages|6|0, 1, 2, 3, 4, 5|なし|
|C1|training-runtime-boundary / TrainingRuntimeBoundary|4|0, 2, 3|1|
|C2|pretraining-loss-perplexity / PretrainingLoss|5|0, 1, 2, 3, 4|なし|
|C2|pretraining-scaling / PretrainingScaling|6|0, 1, 3, 4, 5|2|
|C2|pretraining-data / PretrainingData|4|0, 2, 3|1|
|C2|pretraining-metrics / PretrainingMetrics|4|0, 2, 3|1|
|C2|pretraining-compute / PretrainingCompute|4|0, 1, 3|2|

5図へ圧縮する案を採らない理由は、スケーリング節と計算量節の間にデータ・創発の2節があり、原文順のまま一つの連続包装にはできないためである。またデータの4観点と、同じ出力を指標で比べる創発論争は、保持する対象も操作も異なる。独立した図にして、一つの停止面へ文字や操作を詰め込まない。

## 原文とASTの固定入力

現行正本を全読し、remark-parse / remark-gfm / remark-math / remark-frontmatterで原ASTを抽出した。body blockはH3直後から次のdepth≤3見出し直前までのトップレベル要素。箇条書き1個・数式1個・Mermaidコード1個をそれぞれ1 blockとし、リスト項目は分割しない。位置は元ASTの0-index半開区間である。

|記事|route|H3|body|display math|Mermaid|
|---|---|---:|---:|---:|---:|
|docs/10-llm-foundations/llm-training-pipeline.md|/docs/llm-foundations/llm-training-pipeline|8|13|0|1|
|docs/11-llm-internals/pretraining-and-scaling-laws.md|/docs/llm-internals/pretraining-and-scaling-laws|9|25|4|1|

計17 H3 / 38 body / 4 display math / 2 Mermaid。包装は11 H3 / 32 body、図外に残るのは6 H3 / 6 body（29リスト項目）。H2・関連トピック・参考資料・TODOも保持する。

### docs/10-llm-foundations/llm-training-pipeline.md

SHA256: `993147125244a6bfc7b3e64ca5d9f4f2142dd944b7a1fa7d43d33a79b7242e62`。訂正後は原文SHAと意味依存digestを再計算する。

|H3|行|範囲|body数・型|対応|
|---|---:|---|---|---|
|概要: 3 つの工程と、それぞれが残す「癖」|27|[9,12)|2: paragraph, code|training-stages|
|事前学習: 次トークン予測で知識を得る|40|[12,15)|2: paragraph, list|training-stages|
|指示チューニング(SFT): 指示に従う形式を学ぶ|48|[15,18)|2: paragraph, paragraph|training-stages|
|選好調整: 「良い応答」の基準を最適化する|54|[18,20)|1: paragraph|training-stages|
|この工程から生まれる性質: 幻覚・迎合・拒否|58|[20,24)|3: paragraph, list, paragraph|training-runtime-boundary|
|この理解が効く場面|68|[24,26)|1: list|原文リスト保持・項目ごとstaticReason|
|アンチパターン|77|[27,29)|1: list|原文リスト保持・項目ごとstaticReason|
|チェックリスト|84|[29,31)|1: list|原文リスト保持・項目ごとstaticReason|

### docs/11-llm-internals/pretraining-and-scaling-laws.md

SHA256: `55c2af5771a48c676eea173ab912429c8c7ba94c3ccd49f27858e6f5c4050deb`。訂正後は原文SHAと意味依存digestを再計算する。

|H3|行|範囲|body数・型|対応|
|---|---:|---|---|---|
|概要: 事前学習は「次トークン予測」の一点|31|[10,12)|1: paragraph|pretraining-loss-perplexity|
|次トークン予測の目的関数|35|[12,19)|6: paragraph, math, paragraph, paragraph, math, paragraph|pretraining-loss-perplexity|
|スケーリング則の系譜|53|[19,26)|6: paragraph, math, paragraph, list, code, paragraph|pretraining-scaling|
|データ側: 量・品質・混合・繰り返し|75|[26,30)|3: paragraph, list, paragraph|pretraining-data|
|創発的能力の論争|86|[30,34)|3: paragraph, list, paragraph|pretraining-metrics|
|学習の計算量の目安|95|[34,38)|3: paragraph, math, paragraph|pretraining-compute|
|この理解が効く場面|105|[38,40)|1: list|原文リスト保持・項目ごとstaticReason|
|アンチパターン|114|[41,43)|1: list|原文リスト保持・項目ごとstaticReason|
|チェックリスト|122|[43,45)|1: list|原文リスト保持・項目ごとstaticReason|

包装は既存grouped-blocksを使用し、H3は最初のReadingStepにだけ含める。Math、Mermaid、list、link、注記は元ノードをそのまま渡す。手で原文を再構成・要約・HTML化しない。headingsは包装する連続範囲、sourceHeadingsは意味に必要な非連続節も含む。training-runtime-boundaryは中立な問い/基準の根拠として後方の『この理解が効く場面』までdigestに含めるが、包装範囲は変えない。

## 各図の表示契約

以下のvisible文は絵コンテの意味要件であり、文章全部をそのままSVGへ貼る指示ではない。短ラベル・図形・対応線で表し、段階説明は既存ReadingFigureのHTML説明へ置く。READ停止の要点は、再生・selector・拡大を操作しなくても見えること。

### 1. training-stages（TrainingStages、6段階）

包装: 概要: 3 つの工程と、それぞれが残す「癖」 / 事前学習: 次トークン予測で知識を得る / 指示チューニング(SFT): 指示に従う形式を学ぶ / 選好調整: 「良い応答」の基準を最適化する。元範囲 [9,20)。

blockGroups（heading順、stage×body count）: [0×2] / [1×1, 2×1] / [3×1, 4×1] / [5×1]。

意味依存: 概要: 3 つの工程と、それぞれが残す「癖」 / 事前学習: 次トークン予測で知識を得る / 指示チューニング(SFT): 指示に従う形式を学ぶ / 選好調整: 「良い応答」の基準を最適化する。

|段階|到達|停止面に見える内容|
|---|---|---|
|S0 工程|READ|事前学習→SFT→選好調整の代表経路。各工程の入力（テキスト/模範例/候補の比較）と同じ位置のモデル重み。 『代表構成・順序や反復は一律ではない』。他手法を新しく解説しない。|
|S1 予測|READ|条件prefix→次の正解トークン→学習で重みを更新。重み更新先とデータ入力を分ける。 次トークン予測から言語・知識のパターンを学ぶ。|
|S2 知識|READ|3カードを同時表示: 収録範囲/頻度≠正確さ/ベースの課題能力≠安定した指示追従。 追加学習は重みへ、検索の情報は実行時文脈へ。未収録の社内情報や最新性を自動保証しない。|
|S3 模範例|READ|指示＋模範応答→SFT→形式・振る舞いを調整。『新しい事実も学びうる』を静止表示。 効率・誤答への影響はデータと手法に依存。|
|S4 使い分け|READ|学習で重みを更新 / 検索で文脈へ情報、の2経路を同時表示。 形式・振る舞いと事実再現性は別に評価。最新性/出典/削除/権限の要件を確認。 『新知識の学習と幻覚の報告は対象QAでの結果』。全FTの不可能性にしない。|
|S5 選好|READ|人間/AIの候補比較→選好データ→モデル更新。RLHF・DPOは手法名の違いを保持。 有用さ/無害さ/トーン/拒否を調整。出力の安全・正確さを保証するゲージを置かない。|

操作:

- 確認する性質（S2）: coverage / accuracy / instruction。既定 coverage。強調のみ。比較対象・前提・結論は消さず、段階の意味は変えない
- 評価の観点（S4）: behavior / facts。既定 behavior。強調のみ。比較対象・前提・結論は消さず、段階の意味は変えない

短ラベル候補: 代表構成・反復あり、テキスト / 模範例 / 選好、学習で重みを更新、追加学習 / 文脈へ情報、収録範囲 / 正確さ / 指示追従、形式と事実を別に評価。

固定条件・不変条件:

- 重みの箱のIDと座標を固定し、学習の更新と検索の入力経路を混同しない。
- 架空の学習済み行列、改善率、正確性スコア、普遍的順序を作らない。
- S2/S4は強調を変えても全カードと比較経路が見える。
- 構造oracle: modelId=training-model。学習の更新先はweights、検索の入力先はruntime-context。入力種はtext/demonstration/preference。数値の性能値はnull。

観測sourceDigest（訂正前、reviewedDigestではない）: `sha256:c8089bf5049399415931e94c31103863808cc45d0e27912d376c5d63cfa78f91`。

### 2. training-runtime-boundary（TrainingRuntimeBoundary、4段階）

包装: この工程から生まれる性質: 幻覚・迎合・拒否。元範囲 [20,24)。

blockGroups（heading順、stage×body count）: [0×1, 2×1, 3×1]。

意味依存: 概要: 3 つの工程と、それぞれが残す「癖」 / 事前学習: 次トークン予測で知識を得る / 指示チューニング(SFT): 指示に従う形式を学ぶ / 選好調整: 「良い応答」の基準を最適化する / この工程から生まれる性質: 幻覚・迎合・拒否 / この理解が効く場面。

|段階|到達|停止面に見える内容|
|---|---|---|
|S0 関係|READ|事前学習/SFT/選好調整と、幻覚/迎合/拒否の評価観点を点線で結ぶ。 『関連を示す。単独の原因ではない』。後段には異なる学習目的もある。|
|S1 根拠|手動補助|手動補助: 根拠を渡す→出典を照合→結果を検証。因果効果や削減率は表示しない。|
|S2 評価|READ|3行を同時表示: 幻覚=根拠/出典/結果、迎合=中立な問い/明文化した基準、拒否=過剰と過小/外側の権限確認。 『研究の対象条件を越えて一律に断定しない』。幻覚対策の3要素は手動S1だけに隠さない。|
|S3 実行境界|READ|プロンプト→学習された傾向→操作候補、の先にコード側の権限確認と結果検証を配置。 『指示は実行を強制する仕組みではない』『モデルの拒否≠権限境界』を静止表示。|

操作:

- 確認する性質（S2）: hallucination / sycophancy / refusal。既定 hallucination。強調のみ。比較対象・前提・結論は消さず、段階の意味は変えない
- 確認する場所（S3）: instruction / permission / verification。既定 permission。強調のみ。比較対象・前提・結論は消さず、段階の意味は変えない

短ラベル候補: 関連≠単独の原因、根拠 / 出典 / 結果、中立な問い / 評価基準、過剰・過小な拒否、指示は学習された傾向、権限確認はモデル外。

固定条件・不変条件:

- 点線の関連を単一工程の決定的因果に置き換えない。
- 権限確認はモデル外。モデル出力から副作用へ無確認の直通線を描かない。
- 実サービスの実行許可/拒否を判定するデモや効果採点を作らない。
- 構造oracle: model-candidate → permission-check → operation → result-verification。permission-checkはモデル外。判断結果はnull。実際の操作を実行するデモにしない。

観測sourceDigest（訂正前、reviewedDigestではない）: `sha256:7a4b3b9fb4f091dd38c9215033f6b6c224011bb916885fbe552bcf64ef1bdd85`。

### 3. pretraining-loss-perplexity（PretrainingLoss、5段階）

包装: 概要: 事前学習は「次トークン予測」の一点 / 次トークン予測の目的関数。元範囲 [10,19)。

blockGroups（heading順、stage×body count）: [0×1] / [1×1, 2×2, 3×2, 4×1]。

意味依存: 概要: 事前学習は「次トークン予測」の一点 / 次トークン予測の目的関数。

|段階|到達|停止面に見える内容|
|---|---|---|
|S0 予測|READ|固定列A B Cと各位置の条件prefixを表示。学習では重み更新、通常の推論では重み固定。 NTPの予測誤差を下げる課題であり、下流能力の総合得点ではない。|
|S1 正解確率|READ|位置1/2/3の正解A/B/Cに割り当てた条件付き確率を表示。同じprefix/トークナイザ/評価列を固定。|
|S2 損失|READ|各位置の−ln pを平均しLを得る。『自然対数・位置ごとの平均』。 モデル重みを更新する学習矢印は概念表示。例A/Bを学習途中の実測変化と呼ばない。|
|S3 PPL|READ|Lとexp(L)=PPLを同じ画面で表示。損失を指数へ移すので、確率の算術平均の逆数にはしない。|
|S4 比較条件|READ|同一条件なら説明例A/Bを比較できる。トークナイザまたは評価データが異なれば比較不可の境界を表示。 『PPLは下流能力の判定ではない』。条件違いで別の架空PPLを生成しない。|

操作:

- 説明用の確率（S1/S2/S3）: A / B。既定 A。固定表を切替。列/位置/prefixを保持。S4は常にA/B両方を表示し、この操作を引き継がない。
- 比較する条件（S4）: same / different-tokenizer / different-data。既定 same。同一条件のみ比較を許す。異条件はcomparisonAllowed=false; PPLは元の説明例の値と明記したまま勝敗/順位を出さない。

短ラベル候補: 直前までが条件、正解に与えた確率、−ln p → 平均、平均損失 → exp、同じトークナイザ・評価列、異なる条件は比較しない。

固定条件・不変条件:

- 位置IDとprefixはA/B切替・中点・逆シークで不変。各確率行の和は1。
- L=−平均ln正解確率、PPL=exp(L)。p=0は∞、p=1は0/1。empty/sparse/nonfinite/範囲外を拒否。
- 比較可否は条件一致によるもので、能力/品質の判定器にしない。
- 固定評価列A B C、出現ID eval-0/1/2、prefixは[] / [A] / [A,B]。同じ語彙A/B/C/D・同じ評価列に対する二つの確率表をJSONへ固定。
- 例Aの正解確率 [1/2,1/4,1/8] → −ln p=[ln2,ln4,ln8] → L=ln4=1.3862943611198906 → PPL=4。例B [1/2,1/2,1/2] → L=ln2=0.6931471805599453 → PPL=2。
- 例Aの確率の算術平均は7/24、逆数24/7はPPL4と異なる。確率0はL/PPLとも∞、確率1だけなら0/1。UIは正の固定例だけを使う。

観測sourceDigest（訂正前、reviewedDigestではない）: `sha256:01a7a0849784fe4909dbdccf5f6c3c63e083b1569dcb124f0f0c2a4d3ec79ee3`。

### 4. pretraining-scaling（PretrainingScaling、6段階）

包装: スケーリング則の系譜。元範囲 [19,26)。

blockGroups（heading順、stage×body count）: [0×1, 1×2, 3×1, 4×1, 5×1]。

意味依存: スケーリング則の系譜 / 学習の計算量の目安。

|段階|到達|停止面に見える内容|
|---|---|---|
|S0 軸|READ|N=パラメータ数、D=学習トークン数、C_train=学習計算量を別の軸に置く。経験則であり能力採点ではない。|
|S1 残差|READ|L=L∞+R、R=(Nc/N)^α。Nをr倍→残差比r^(−α)。L全体の比と区別。 L∞/α/Ncは未設定の記号。測定曲線・数値目盛・未知係数を仮造しない。|
|S2 固定予算|手動補助|手動補助: 同じCでN/D配分の3組を比較。N比×D比=1、最適組のラベルなし。|
|S3 系譜|READ|Kaplan→Chinchilla→推論時計算の3位置を同時表示。 同じCでは配分を選ぶ / Cを増やすならN・Dを近い率で拡大、の両枠を同時に表示。 基準比(1,1,1)→(2,2,4)または(4,4,16)。式からの説明例であり最適値の実測ではない。|
|S4 推論時|READ|学習時計算C_trainと推論時計算C_inferを別レーンに表示。推論の重みは固定。 『推論時も計算を使う』『増やせば必ず改善、ではない』。最新手法/指数は追加しない。|
|S5 条件依存|READ|データ/アーキテクチャ/トークナイザの3条件と係数依存を全て表示。 経験係数も最適N/Dも未知。『普遍定数ではない』。|

操作:

- 同じ予算の配分（S2）: data-heavy / reference / parameter-heavy。既定 reference。固定Cの3組のみ。S3は3組の要点を独立に表示し選択を持ち越さない。
- 予算を増やす説明例（S3）: 1 / 2 / 4。既定 2。NとDの基準比を同率r、C比をr²へ。固定C枠は変えない。
- 係数に関わる条件（S5）: data / architecture / tokenizer。既定 data。強調のみ。比較対象・前提・結論は消さず、段階の意味は変えない

短ラベル候補: N / D / 学習C、下限L∞ + 残差R、同じ予算: 配分を選ぶ、予算を増やす: 両方を拡大、学習時計算 / 推論時計算、係数は条件に依存。

固定条件・不変条件:

- 固定Cの配分とC増加の拡大を独立状態にする。N=DやN/D=1の推奨値にしない。
- α・Nc・L∞・損失曲線の数値を生成しない。最適判定はnull。
- S3は全系譜と2種類の予算条件が一画面で読める。
- 係数α/Nc/L∞は記号のまま。R(rN)/R(N)=r^(−α)と、L全体の比 (L∞+Rr^(−α))/(L∞+R) を区別。模式曲線を置くなら『模式・目盛なし』。未設定係数で正確な曲率や棒の倍率を作らず、式と対応線を優先する。
- 固定C例 (N/N0,D/D0,C/C0)=(1/2,2,1),(1,1,1),(2,1/2,1)。予算増加例=(1,1,1),(2,2,4),(4,4,16)。基準N0/D0は別の単位で、N0=D0やこの配分の最適性を意味しない。
- S3は上に系譜の3ノード、下に『同じ予算』『予算増』の2枠を置く。固定Cの全3例を大きな表にせず、代表積と要点を表示する。S2だけに固定Cの意味を隠さない。

観測sourceDigest（訂正前、reviewedDigestではない）: `sha256:bf4d31f682a397f5ac9ba8d0063d1a25d260e97ad58590db6d06cee6f10e5c52`。

### 5. pretraining-data（PretrainingData、4段階）

包装: データ側: 量・品質・混合・繰り返し。元範囲 [26,30)。

blockGroups（heading順、stage×body count）: [0×1, 2×1, 3×1]。

意味依存: スケーリング則の系譜 / データ側: 量・品質・混合・繰り返し。

|段階|到達|停止面に見える内容|
|---|---|---|
|S0 量と中身|READ|Dは学習で処理したトークン数。資料の中身や独立な情報量を同じ数とみなさない。|
|S1 再利用|手動補助|手動補助: A/B/C/D各2説明用トークン、読み順A B C D A B。6回読み/4資料/12処理トークン/元資料内8トークン位置。 同じ資料の再使用でも出現IDは別。語彙の種類数と混同しない。|
|S2 設計観点|READ|4カードを同時表示: 品質・重複、Web/書籍/コード/多言語の配合、繰り返し、評価データ混入。 再利用は処理量を増やすが追加価値は一定ではない。過学習の可能性/評価との分離を静止表示。|
|S3 データ制約|READ|規模に見合う良質なデータの有無が制約。Nだけ増やしても足りない。 データ投資の可否や能力改善量を図が判定しない。|

操作:

- 確認するデータ観点（S2）: quality / mixture / reuse / contamination。既定 quality。強調のみ。比較対象・前提・結論は消さず、段階の意味は変えない

短ラベル候補: 処理した量 / 資料の中身、品質・重複、配合を設計、再利用の価値は一定でない、評価用は混ぜない、見合う良質データが必要。

固定条件・不変条件:

- 資料ID・資料内トークン位置・処理出現IDを区別。再利用で処理数は増すが資料は増殖しない。
- 混合比の最適値・品質点・繰り返し損失曲線・具体的過学習開始回数を作らない。
- S2に4観点と繰り返しの意味を残し、手動S1だけに要点を隠さない。
- 固定資料A/B/C/Dは各2個の資料内トークン位置を持つ。処理順A B C D A Bなので6回読み、4資料、処理トークン出現12、元資料内トークン位置8。語彙の種類数は不明であり8とは呼ばない。
- S2は品質/配合/再利用/評価混入の2×2カード。品質スコア・混合の最適比・反復ごとの損失を作らず、全4観点を見せたまま選択は強調のみ。

観測sourceDigest（訂正前、reviewedDigestではない）: `sha256:00d8301c20fe4dbb8e655fc3b272efd49f6cc558ebfdeb48a650910b0e384408`。

### 6. pretraining-metrics（PretrainingMetrics、4段階）

包装: 創発的能力の論争。元範囲 [30,34)。

blockGroups（heading順、stage×body count）: [0×1, 2×1, 3×1]。

意味依存: 創発的能力の論争。

|段階|到達|停止面に見える内容|
|---|---|---|
|S0 論争|READ|創発の報告と指標依存の反論を並べる。『論争は決着していない』。|
|S1 同じ出力|手動補助|手動補助: 条件A〜Fに同じ6個の説明用スコアを固定。実モデル/規模の測定値ではない。|
|S2 測り方|READ|同じ入力を連続値と閾値以上=1/未満=0の2段に並べる。全6IDと横位置は固定。 『測り方だけで見え方が変わる説明例』『完全一致やBrierの実装ではない』。両グラフを常に表示。|
|S3 併用|READ|連続指標と閾値指標を併用し、能力の有無を一つの値で断じない。 全ての創発が偽物と証明する図にしない。|

操作:

- 二値化の閾値（S2）: 50 / 60 / 70。既定 60。6入力を固定したまま>=閾値で二値化。S0/S1/S3は選択に依存しない。

短ラベル候補: 同じ出力、異なる測り方、連続値 / 閾値で二値化、説明用。実験値ではない、単一の閾値で断じない、連続指標も併用。

固定条件・不変条件:

- 同じ出力を測るので、操作で元スコア/ID/横位置を変えない。
- 境界は>=。整数スコアで比較し表示のみ100で割る。
- 実際のNや性能測定であるかのような軸/凡例を付けない。結論判定はnull。
- 6条件A〜F、固定入力30/40/50/60/70/80を100で割って0.3〜0.8と表示。実モデル規模/性能の測定ではない。閾値50/60/70に対し >= で二値化。
- 閾値50 → [0,0,1,1,1,1]、60 → [0,0,0,1,1,1]、70 → [0,0,0,0,1,1]。同じ6入力を常に上下2段へ対応させる。完全一致・Brier・部分点の実データを再現したとは呼ばず、閾値で見え方が変わる説明例とする。

観測sourceDigest（訂正前、reviewedDigestではない）: `sha256:4ab6047fb2622bc062565cbe9942f258278634c2ef2e785d78f5d7d7ffe66116`。

### 7. pretraining-compute（PretrainingCompute、4段階）

包装: 学習の計算量の目安。元範囲 [34,38)。

blockGroups（heading順、stage×body count）: [0×1, 1×1, 3×1]。

意味依存: スケーリング則の系譜 / 学習の計算量の目安。

|段階|到達|停止面に見える内容|
|---|---|---|
|S0 概算|READ|C≈6NDは学習FLOPsの概算。N/D/係数6を区別。正確な課金・時間・電力の式ではない。|
|S1 積|READ|基準C0=6N0D0に対し、N比×D比=C比。N×2/D一定でC×2、両方×2ならC×4。|
|S2 配分|手動補助|手動補助: 固定Cの配分3組。Nを増やしたらDを減らす。損失最適は判定しない。|
|S3 実コスト|READ|固定Cの配分と予算増加の両枠を静止表示。前者はC1、両方2倍の後者はC4。 ハードウェア/並列化効率は実時間・費用・消費エネルギーに関わり、6NDだけでは決まらない。 『FLOPs概算→実測・提供条件で確認』。実測値は未入力・未知。|

操作:

- Nの基準比（S1）: 1 / 2。既定 1。この段階だけN比を変更。D比との積を表示。
- Dの基準比（S1）: 1 / 2。既定 1。この段階だけD比を変更。N比との積を表示。
- 同じ予算の配分（S2）: data-heavy / reference / parameter-heavy。既定 reference。固定Cのみ。S3の要点は固定表示でこの選択と無関係。
- 実測が必要な項目（S3）: duration / price / energy。既定 duration。強調のみ。比較対象・前提・結論は消さず、段階の意味は変えない

短ラベル候補: FLOPsの概算、N比 × D比 = C比、固定Cでは積が一定、両方2倍ならCは4倍、実時間・費用は別に確認。

固定条件・不変条件:

- CはFLOPs、価格・時間・電力/エネルギーとは単位が異なる。
- N/D比は正の有限数。固定Cでは積一定、予算増加では積が増す。
- 未知の実時間/価格/エネルギーを0や推定値で埋めない。
- C0=6N0D0、(N比,D比,C比)=(1,1,1),(2,1,2),(1,2,2),(2,2,4)。固定C例はscalingと同じ3組。係数6は概算の前提で、実時間/価格/エネルギーはnull。
- scalingモデルから必要ならこの図の純粋な比率計算だけを共有。経験的な損失曲線・最適化器へ広げない。

観測sourceDigest（訂正前、reviewedDigestではない）: `sha256:bf4d31f682a397f5ac9ba8d0063d1a25d260e97ad58590db6d06cee6f10e5c52`。

## 全論点のREAD対応

動的論点は下記50件。static29件はJSONに原文の各項目をそのまま収録し、理由と関連READ面を付けた。静的指定を「未対応」の代用にしない。

|論点ID|意味|図|READ stage|
|---|---|---|---|
|training-representative-order|代表3工程・順序/反復は一律ではない|training-stages|0|
|training-different-data|テキスト/模範例/選好比較という入力の違い|training-stages|0|
|training-association-not-cause|点線は関連であり工程単独の原因ではない|training-runtime-boundary|0|
|training-next-token-patterns|次トークン予測で言語・知識のパターンを学ぶ|training-stages|1|
|training-knowledge-range|収録範囲・期限、追加学習と検索の違い|training-stages|2|
|training-frequency-accuracy|頻度と正確性の非同一、未収録社内情報、情報源で照合|training-stages|2|
|training-base-instruction|ベースの課題能力と安定した指示追従の区別|training-stages|2|
|training-sft-demonstrations|入出力の模範例で形式と振る舞いを調整|training-stages|3|
|training-sft-facts|新事実も学べるが効率・誤答への影響は条件依存|training-stages|3|
|training-closed-book-limits|新知識/幻覚の報告は対象closed-book QA。全FT不可能へ一般化しない|training-stages|4|
|training-retrieval-requirements|最新性・出典・削除・権限管理を検索/FT判断に含める|training-stages|4|
|training-separate-evaluation|形式/振る舞いと事実再現性を別に評価|training-stages|4|
|training-preference-data|人間/AIによる候補の比較から好みを集める|training-stages|5|
|training-preference-methods|RLHFとDPOの手法名・経路を同一手法にしない|training-stages|5|
|training-preference-targets|有用さ/無害さ/トーン/拒否を調整する|training-stages|5|
|training-multiple-objectives|癖は工程と関連し、全工程の目的関数が同じではない|training-runtime-boundary|0, 2|
|training-hallucination-checks|NTPは事実検証器ではなく調整後も誤答。根拠/出典/結果の確認|training-runtime-boundary|2|
|training-sycophancy-conditions|対象研究の範囲、誤前提への同調を中立な問い/基準で評価|training-runtime-boundary|2|
|training-refusal-limits|過剰・過小拒否、SFT/選好/実行時の複数要因|training-runtime-boundary|2|
|training-prompt-tendency|プロンプトは学習された傾向に働き、命令インタープリタではない|training-runtime-boundary|3|
|training-external-boundary|モデル拒否や禁止文を実行権限の境界にせずコードで検査|training-runtime-boundary|3|
|pretraining-pretraining-purpose|NTPという課題から知識・能力を学ぶ|pretraining-loss-perplexity|0|
|pretraining-loss-not-ability|損失を測る記事であり下流能力と同じ量ではない|pretraining-loss-perplexity|0, 4|
|pretraining-conditional-prefix|各位置で直前までを条件に正解確率を与える|pretraining-loss-perplexity|1|
|pretraining-average-negative-log|交差エントロピー=位置ごとの平均負対数尤度|pretraining-loss-perplexity|2|
|pretraining-training-update|損失を下げる学習はパラメータ更新、推論は固定|pretraining-loss-perplexity|0, 2|
|pretraining-exp-loss|PPL=exp平均損失、有効な選択肢数の直感|pretraining-loss-perplexity|3|
|pretraining-same-tokenizer-data|PPLの比較はトークナイザと評価データが同じ条件|pretraining-loss-perplexity|4|
|pretraining-scaling-axes|N/D/Cと経験的べき乗則|pretraining-scaling|0|
|pretraining-residual-not-total|L∞と残差Rを分け、倍率が掛かるのはR|pretraining-scaling|1|
|pretraining-kaplan-history|初期のパラメータ重視という系譜|pretraining-scaling|3|
|pretraining-fixed-compute-allocation|固定C内でN/Dの配分を選ぶ|pretraining-scaling|3|
|pretraining-budget-growth|予算増加に対しN/Dを近い率で増やすというChinchillaの含意|pretraining-scaling|3|
|pretraining-not-equal-units|同率成長はN=Dや固定C内の両増加ではない|pretraining-scaling|3|
|pretraining-inference-compute|推論時にも計算を割く別軸がある|pretraining-scaling|3, 4|
|pretraining-empirical-coefficients|データ/構造/トークナイザ依存で係数は普遍定数ではない|pretraining-scaling|5|
|pretraining-quantity-content|Dの量だけでなく中身が効く|pretraining-data|0, 2|
|pretraining-quality-dedup|品質・重複除去・フィルタリングの確認|pretraining-data|2|
|pretraining-mixture|Web/書籍/コード/多言語の配合は設計判断|pretraining-data|2|
|pretraining-reuse-returns|再利用で処理量は増すが追加価値は一定でなく過学習もありうる|pretraining-data|2|
|pretraining-contamination|評価用データの学習混入で評価が歪む|pretraining-data|2|
|pretraining-data-bottleneck|パラメータ規模に見合う良質データの有無|pretraining-data|3|
|pretraining-emergence-debate|創発の報告と測定方法に由来する反論、未決着|pretraining-metrics|0, 3|
|pretraining-discontinuous-metric|同じ出力でも閾値で急変して見える|pretraining-metrics|2|
|pretraining-continuous-metric|同じ出力の連続指標も確認する|pretraining-metrics|2|
|pretraining-not-single-verdict|単一閾値で能力を断じず併用して評価|pretraining-metrics|3|
|pretraining-compute-units|CのFLOPs、N/D/係数6と概算の意味|pretraining-compute|0, 1|
|pretraining-compute-product|NかDの片方を増やす比例、両方増加時は積|pretraining-compute|1|
|pretraining-allocation-vs-growth|固定Cの配分と予算増加時の両拡大を区別|pretraining-compute|3|
|pretraining-actual-cost-limits|ハードウェア/並列化効率による実時間・費用・エネルギー、桁の当たり|pretraining-compute|3|

静的項目の方針: 『この理解が効く場面』は実案件への判断とリンク、『アンチパターン』は既出の機構の誤用、『チェックリスト』は読者自身の確認。固定例から案件の合否・投資判断・理解済み状態を自動生成しない。これらの各項目の意味が変わった場合も記事受入の入力で検知する。

## 原文の最小訂正案（この作業では未適用）

追加の段落・例・式は作らない。6か所の短い差替えのみ。訂正対象は事前学習記事で、学習パイプライン記事本文は保持する。各beforeが現行原文に1回だけ一致することを確認済み。

### 訂正1: スケーリング則の系譜 / 式の読み下し

変更前: $N$ を 10 倍しても損失は一定の割合でしか下がらない(収穫逓減)

変更後: $N$ を 10 倍すると、下限からの差 $L-L_\infty$ が一定の割合で小さくなる(収穫逓減)

式の倍率は残差項に掛かり、下限を含むL全体の比ではない。 根拠: [一次本文](https://arxiv.org/html/2203.15556)（§3.3 Eq.(2); 元記事の式からの代数的帰結）。

### 訂正2: スケーリング則の系譜 / Chinchilla箇条書き

変更前: 固定の計算予算 $C$ の下で損失を最小化するには、**$N$ と $D$ をほぼ同じ割合で一緒に増やすべき**、という修正。

変更後: 固定の計算予算 $C$ の下で損失を最小化する $N$ と $D$ の配分を調べ、**計算予算を増やすときには $N$ と $D$ をほぼ同じ割合で一緒に増やすべき**、とした修正。

固定C内の配分探索と、C増加に伴う最適構成の成長を分ける。 根拠: [一次本文](https://arxiv.org/html/2203.15556)（§3、§3.4 Table2）。

### 訂正3: スケーリング則の系譜 / Mermaidラベル

変更前: 計算最適(N と D を均等に)

変更後: 計算最適(N と D の配分)

同率成長を固定Cの均等配分やN=Dと誤読させない。ノード/矢印/位置/コードブロック数は維持。 根拠: [一次本文](https://arxiv.org/html/2203.15556)（§3、§3.4）。

### 訂正4: 学習の計算量の目安 / 読み下し

変更前: 計算量(= コスト・時間・電力)が比例して増える

変更後: 計算量(FLOPs)が比例して増える

FLOPsと価格・経過時間・電力は同じ量ではない。後続の既存実コスト依存文で補う。 根拠: [一次本文](https://arxiv.org/html/2001.08361)（§2.1; <https://arxiv.org/html/2203.15556> Appendix F）。

### 訂正5: 学習の計算量の目安 / 計算最適の文

変更前: 計算最適の含意「$N$ と $D$ を均等に」は、この $C$ を固定したうえで損失を最小化する配分の話です。

変更後: 固定した $C$ の下では、損失を最小化する $N$ と $D$ の配分を選びます。$N$ と $D$ をほぼ同じ割合で増やすという含意は、計算予算を増やす場合の話です。

固定CはN×D一定。同率で両方増やせばCも増える。 根拠: [一次本文](https://arxiv.org/html/2203.15556)（§3.3–§3.4）。

### 訂正6: 参考資料 / Chinchilla説明

変更前: 計算最適(Chinchilla)。$N$ と $D$ を均等に

変更後: 計算最適(Chinchilla)。計算予算に応じた $N$ と $D$ の配分

本文最小訂正と関連ラベルの整合。 根拠: [一次本文](https://arxiv.org/html/2203.15556)（§3–§3.4）。

採用時は記事のlast_updatedと参照アクセス日を実際の訂正確認日に同期し、AST・sourceDigest・受入入力を再計算する。H3数/body型/数式数/Mermaidノード数は変わらないが、MermaidラベルとsourceDigestは変わる。修正後本文と最終図を独立レビューし直す。

## 一次本文の確認範囲

抽象ページだけでなく下記本文の該当節を確認した。研究条件の外へ主張を広げず、図に論文の実測係数・能力値を移植しない。

- [instructgpt](https://arxiv.org/html/2203.02155) — §3.1。模範例SFT、比較による報酬学習、PPOという代表工程と反復。全モデル共通順序とは扱わない。（確認2026-09-24）
- [dpo](https://arxiv.org/html/2305.18290) — §3–§4。選好ペアからの直接最適化。RLHFと同一の実装手順にしない。（確認2026-09-24）
- [new-knowledge](https://arxiv.org/html/2405.05904) — §1、§4、§11 Limitations。対象closed-book QAでの新知識学習と幻覚の報告。新事実を全く学べないとはしない。（確認2026-09-24）
- [sycophancy](https://arxiv.org/html/2310.13548) — §4.1–§4.3。対象モデル/選好判断での迎合との関係。全人間・全手法の普遍的因果にしない。（確認2026-09-24）
- [kaplan](https://arxiv.org/html/2001.08361) — §1.3、§2、§2.1。トークン平均のcross entropy/nats、言語モデル目的とFLOPs概算。係数の普遍化をしない。（確認2026-09-24）
- [chinchilla](https://arxiv.org/html/2203.15556) — §3、§3.3 Eq.(2)/(4)、§3.4 Table2、Appendix F。固定C内の配分と、増えるCに対するN/Dの近い成長率を分離。論文の実測係数を図の普遍値に採用しない。（確認2026-09-24）
- [data-constrained](https://arxiv.org/html/2305.16264) — §5–§6、Appendix H。再利用の価値は一定でなく、訓練損失だけでは判断できない。固定の過学習開始回数を置かない。（確認2026-09-24）
- [emergence](https://arxiv.org/html/2206.07682) — §2。規模による能力の出現という報告の定義を確認。図は実験曲線の再現ではない。（確認2026-09-24）
- [mirage](https://arxiv.org/html/2304.15004) — §2–§4、§6。同じ出力でも非線形/不連続な測定が形を変える。図の閾値例は説明用で、論争全体の決着ではない。（確認2026-09-24）

残差倍率とN×Dの相対値、NLL/PPL、固定閾値の結果は、上記記事の式/定義から計算した説明用oracleであり一次論文の実測値ではない。6NDは密なモデルの典型的な概算として扱い、MoEや全アーキテクチャへ機械的に適用する費用計算機にはしない。

## 実装時の分担・受入契約

製品候補の所有は図ごとにmodel/scene/CSS/unitの4ファイルを基本とする。正確な候補名はJSON.candidateFilesにある。C1 dispatcherはTrainingWalkthrough、C2はPretrainingWalkthroughを候補とし、既存ReadingFigure/SceneBase/Wire/Selectを使う。dispatcher、共通CSS、registry、MDX safety、記事受入は統合担当が所有する。まだこれらのコードは作成しない。

- binding: grouped-blocks
- sourcePolicy: 原ASTの参照をReadingStepで包装。数式・Mermaid・リンク・箇条書き・H3を再記述しない。正本訂正はcorrectionsだけ別レビューし、sourceDigestを再生成。
- phase: stageForPhaseの共通丸め。phaseはWire等の動きにのみ使用し、表示内容/制御の有効性はstageで決定。中点前/一致/後と逆シークを検査。
- identity: 図・資料・トークン・スコア点の安定ID。selectorの影響は指定stageに限定。シークの履歴で結果が変わらない。
- layout: 640×430前後を起点に短ラベルで配置。PC1280/1440の読書ペインで拡大せず読めることを画像で独立判定。SVG上のfont値だけを合格基準としない。実寸・主要/補助の字サイズを記録。狭幅は内部図の可読幅と図内スクロールを保ちページ横溢れなし。
- accessibility: title/desc、HTMLの段階説明、明暗、reduce/noJS/print、keyboard/modal/focus/readsync、実時間再生は既存frameworkを使用。操作なしのREAD停止面に全主要論点を置く。
- heavyChunks: 記事dispatcher単位のlazy load。C1/2や既存6記事・対照alignment-theoryに他記事sceneを配信しない。純粋共有モデル依存は固定入力へ明示。
- sharedModel: pretraining-scalingがpretraining-compute-model.mjsの純粋な比率計算を参照可能。経験損失モデルへ拡張しない。
- acceptance: registry/sourceHeadings/digest、article topic ledger/optionalInputs、MDX固定IDと許可props、全関連ゲート失効を製品段階で反映。TEMP JSONはregistryとして投入しない。

モデルunitは実装をそのままなぞらず、独立固定表と意味不変条件を検査する。NLL/PPLは解析値と比較し、確率行の正規化・prefix不変・0/1・空/疎/NaN/∞/負/1超を検査。スケーリングは未知係数/最適値を出さないことと積の一致を検査。データは出現IDと元資料IDの計数、指標は同じ点の>=境界を検査。全図で整数stage・各中点±0.01/一致・逆シーク・stageに関係のないselector状態の無影響を検査する。

実画面では1280/1440の読書ペインの実寸と字サイズを観測し、短ラベルと対比の意味を別作者が画像で確認する。数値だけで『読める』を承認しない。停止画面・全selector・本文READ・末端到達・モーダルfocus・実時間再生・明暗・390px・低画面・noJS・印刷・WebKitを対象とする。物理iPhone Safariはエミュレーションと分ける。

article fixed inputsには各scene/model/CSSと純粋共有依存、dispatcher、registry/decoration/mdx-safety/mdx-components等の共通入力を役割別に登録する。意味依存をoptionalInputsで実装依存の代用にしない。共通入力を変えれば既存6記事の受入も失効し、公開前に回帰とゲート更新が必要。C1公開受入後はC2でC1も回帰対象へ加える。

## この計画で実施した検査と残件

- 現行正本SHA256一致（2記事）
- remark原AST抽出: 17 H3 / 38 body blocks / 4 display math / 2 Mermaid
- 既存selectDiagramSections/diagramSourceDigestで7図範囲・意味依存を読取確認
- 7図33段階・28 READ停止・32包装body・範囲非重複を検査
- 79論点: dynamic50すべてREAD到達 / static29すべて理由・関連READあり
- 6か所の最小訂正beforeが現行本文で各1件に一致
- 固定例の確率正規化/NLL/PPL、N×D比、再利用計数、閾値等号を独立計算

未実施: 製品変更、実学習、性能計測、ビルド、Git操作、公開検証。

- 独立内容・数値・AST割当レビュー
- B公開受入後の製品実装
- 意味あるモデルunit、元AST同一性/全段階/topic/MDX安全性unit
- PC1280/1440・390・低画面・明暗の実寸画像/操作・WebKit・noJS/印刷
- 共通check・site unit/build/browserと既存記事全回帰
- 別作者の最終内容/実画像レビュー
- PR/CI/Pages同一版と独立CI artifact BUILD_ID/HTML hashの公開確認

計画の機械検査結果は製品のbuild/browser成功ではない。B公開受入、本計画の独立レビュー、C1→C2各単位の製品・公開検証を順に完了させる。
