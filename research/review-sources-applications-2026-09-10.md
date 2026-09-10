# レビュー参考資料棚卸し: 事業・応用・UX・人と AI

確認日: 2026-09-10

## 対象と判断方法

[レビュー報告書](../project/records/2026-09-10/review.md)の S02 のうち、参考資料に外部 URL のなかった 29 記事を対象に、本文の実証・安全性・心理特性・仕様に関する主張を読み直しました。一次資料を実際に開き、記事が使う範囲を資料の確認範囲に合わせています。参考資料に置かれていた執筆テンプレートは内容の根拠に使わず、該当 13 記事すべてで置き換えました。本文で自リポジトリの工程例を説明することは維持しています。

結果は **29 記事に一次資料を追加、29 記事で断定や設計境界を調整、外部資料なしでの維持は 0 記事**です。チェックリスト・工程・組織・UI の分類は資料の逐語的解説ではなく独自の設計整理として維持し、効果や適用を保証するものとは区別しました。「外部資料が存在しない」とは判断していません。全 29 記事で既存の `status: published` を維持し、実質編集により `last_updated: 2026-09-10` に更新しています。

以下の分類は重複します。「独自整理維持」は記事全体が無出典という意味ではなく、資料を参照してもなお著者の提案として残る判断枠組みを指します。

## 記事別対応表

資料番号は次節の実アクセス記録に対応します。

| 記事 | 分類 | 資料 | 修正内容・根拠の適用範囲 |
| --- | --- | --- | --- |
| [agent-liability-and-accountability](../docs/09-business/agent-liability-and-accountability.md) | 資料追加・断定/境界修正・独自整理維持 | 01 | 自律度と説明難度の関係を条件付きにし、記録粒度・再現性を判断軸に変更。法的責任の断定をしない範囲は維持。 |
| [ai-asset-sharing](../docs/09-business/ai-asset-sharing.md) | 資料追加・断定/境界修正・独自整理維持 | 01・02 | テンプレート出典を解消。再利用で必ず供給・動機づけが増えるという断定をやめ、需要・保守負担を測る提案に変更。 |
| [ai-native-development-process](../docs/09-business/ai-native-development-process.md) | 資料追加・断定/境界修正・独自整理維持 | 03・04 | テンプレート出典を解消。生成速度の向上やボトルネック移動を一律に断定せず、既存コードや担当者による差と工程全体の測定を追加。 |
| [ai-pricing-and-packaging](../docs/09-business/ai-pricing-and-packaging.md) | 資料追加・断定/境界修正・独自整理維持 | 05 | テンプレート出典を解消。従来 SaaS の限界費用ゼロという対比を修正。API 従量費と自社運用費を分け、予算通知と停止保証を区別。 |
| [ai-procurement](../docs/09-business/ai-procurement.md) | 資料追加・断定/境界修正・独自整理維持 | 01 | 従来調達の仕様・検収が無効になるという対比を修正。確定できる制約と評価する品質を分け、契約・社内規程の個別判断を維持。 |
| [ai-team-topologies](../docs/09-business/ai-team-topologies.md) | 資料追加・断定/境界修正・独自整理維持 | 02 | テンプレート出典を解消。CoE→分散→プラットフォームを普遍的な成熟段階とせず、組織規模・需要に応じた選択肢として整理。 |
| [ai-usage-policy](../docs/09-business/ai-usage-policy.md) | 資料追加・断定/境界修正・独自整理維持 | 01 | 正規経路があればシャドー利用の理由がなくなる、原因の多くは正規経路欠如という断定を修正。自組織で原因を調べる方針に変更。 |
| [own-model-strategy](../docs/09-business/own-model-strategy.md) | 資料追加・断定/境界修正・独自整理維持 | 06 | 投資の正当化に関する費用比較の向きを修正し、追加便益と増分費用を比較。API 退役と保有重みの継続運用を区別し、投資段階は独自判断案と明示。 |
| [skill-shift-and-change-management](../docs/09-business/skill-shift-and-change-management.md) | 資料追加・断定/境界修正・独自整理維持 | 07 | テンプレート出典を解消。技能移行・抵抗・離職・研修効果を必然とせず、職務と受講者に応じた計画・測定に変更。 |
| [document-ai](../docs/12-multimodal/document-ai.md) | 資料追加・断定/境界修正・独自整理維持 | 08・09 | 内部文字層があれば常に最も正確という断定を修正。表示照合と OCR/VLM 比較、自動確定結果の抜き取りを追加。 |
| [multimodal-rag](../docs/12-multimodal/multimodal-rag.md) | 資料追加・断定/境界修正・独自整理維持 | 10 | ①②の索引方式と③の取得後読解を分離し、排他的三択を解消。単一ベクトルに限定せず、大規模コーパスと候補読解費用を区別。 |
| [vision-understanding-patterns](../docs/12-multimodal/vision-understanding-patterns.md) | 資料追加・断定/境界修正・独自整理維持 | 09 | 小文字等をモデル横断の一律能力表とせず評価候補へ変更。解像度と課金の単純な等式、属性指定による精度改善保証、構造化出力の無条件保証を修正。 |
| [data-analysis-agents](../docs/13-domain-agents/data-analysis-agents.md) | 資料追加・断定/境界修正・独自整理維持 | 11 | テンプレート出典を解消。精度がほぼ文脈で決まる断定を修正。SELECT という文字列と権限制御を区別、集計下限と k-匿名性を分離、単一 DB での結果一致の限界を追加。 |
| [deep-research-agents](../docs/13-domain-agents/deep-research-agents.md) | 資料追加・断定/境界修正・独自整理維持 | 12・13 | テンプレート出典を解消。RAG を単一検索に限定しない。社内資料を無条件に信頼する階層をやめ、主張への適合性と独立性を評価。根拠ラベルと較正済み確率を区別。 |
| [education-agents](../docs/13-domain-agents/education-agents.md) | 資料追加・断定/境界修正・独自整理維持 | 14・15 | 解答提示では学べない、支援を減らすほど学習効果が上がるという断定を修正。解答例と練習を併用し、内容判定の見逃しと人への引き継ぎを明記。 |
| [emerging-agent-domains](../docs/13-domain-agents/emerging-agent-domains.md) | 資料追加・断定/境界修正・独自整理維持 | 16・17・18 | 市場全体の成熟度・出荷・投機・未査読状況の裏付けない総論を整理し、研究2例と決済仕様1例に再構成。実験・仕様・運用・追試を区別。 |
| [legal-review-agents](../docs/13-domain-agents/legal-review-agents.md) | 資料追加・断定/境界修正・独自整理維持 | 19 | 公式規制入口を追加。最終業務判断の担当と法的責任を区別。過検出を無害とせず、重要条項の見落としと確認負荷を併せて評価。 |
| [personal-assistant-design](../docs/13-domain-agents/personal-assistant-design.md) | 資料追加・断定/境界修正・独自整理維持 | 13・20 | 読み取り専用・下書き・人の承認による無害性保証を解消。外部取得・検索クエリの持ち出し、確定内容の承認、ツール側認可を追加。 |
| [rpa-and-agents](../docs/13-domain-agents/rpa-and-agents.md) | 資料追加・断定/境界修正・独自整理維持 | 21 | RPA の固定フローと実行成功保証を区別し、費用構造・変化耐性の一律比較を修正。ベンダー全般の動向を一社の確認例と選定項目へ変更。 |
| [search-experience-redesign](../docs/13-domain-agents/search-experience-redesign.md) | 資料追加・断定/境界修正・独自整理維持 | 12・20 | 検索 UX の品質設計を法的責任の移動と区別。要約追加による改善保証、ゼロ結果の原因は知識不足という断定を修正し、索引・認可・生成も診断。 |
| [spreadsheet-agents](../docs/13-domain-agents/spreadsheet-agents.md) | 資料追加・断定/境界修正・独自整理維持 | 22・25 | テンプレート出典を解消。数式書き込み・再計算・保存済み計算値を区別。計算モードと対応エンジンの確認を追加。 |
| [writing-and-translation-workflows](../docs/13-domain-agents/writing-and-translation-workflows.md) | 資料追加・断定/境界修正・独自整理維持 | 23 | テンプレート出典を解消。全数人手確認では量産できない断定を修正。品質要件に応じた全数確認、judge の高確度箇所も含む抜き取り、既存成果物への改訂適用手順を追加。 |
| [accessibility-and-ai](../docs/14-ux-and-product/accessibility-and-ai.md) | 資料追加・断定/境界修正・独自整理維持 | 24 | テンプレート出典を解消。AI UI にも WCAG が適用されることを明示。トークンごとの通知、完了状態、フォーカスと実機確認の設計を具体化。 |
| [beyond-chat-ui](../docs/14-ux-and-product/beyond-chat-ui.md) | 資料追加・断定/境界修正・独自整理維持 | 20 | テンプレート出典を解消。白紙入力で利用者が離脱する等の心理・効果の一律断定を、対象利用者とタスクで比較する設計案へ変更。 |
| [conversation-design](../docs/14-ux-and-product/conversation-design.md) | 資料追加・断定/境界修正・独自整理維持 | 20 | テンプレート出典を解消。汎用 LLM は何でも答えるとの断定を修正。文化・言語だけで好みを決めつけず、利用者と場面で検証。 |
| [proactive-agent-ux](../docs/14-ux-and-product/proactive-agent-ux.md) | 資料追加・断定/境界修正・独自整理維持 | 20 | テンプレート出典を解消。利用者が採否を選べば安全という保証を修正。確信度×重要度の式を独自設計案に限定し、無反応を否定と決めつけない。 |
| [ai-career-strategy](../docs/15-human-ai/ai-career-strategy.md) | 資料追加・断定/境界修正・独自整理維持 | 07 | 市場価値の重心移動、誰でもデモを作れる、最も減価しない投資等の断定を修正。個人向けの学習投資案と業務観測の手順として明示。 |
| [ai-literacy-training-design](../docs/15-human-ai/ai-literacy-training-design.md) | 資料追加・断定/境界修正・独自整理維持 | 01・07・14 | 3 類型必須、座学では定着しない、数か月で戻るという断定を修正。知識と行動の双方を測り、学習設計の企業研修への転用効果を別途確認。 |
| [verifying-ai-outputs](../docs/15-human-ai/verifying-ai-outputs.md) | 資料追加・断定/境界修正・独自整理維持 | 15 | ゼロコストで多くの誤りを発見という断定を修正。再質問・自己申告確信度と独立した検証を区別。図を確認通過時のみ利用する分岐へ修正。 |

## 一次資料の確認記録

すべて 2026-09-10 にアクセスしました。abstract のみ確認した論文はその範囲を明記し、本文・付録を精読したことにはしていません。製品仕様の例を、製品横断の普及率・性能の証拠には使っていません。

| 番号 | 一次資料 | 実際に確認した範囲と限界 |
| --- | --- | --- |
| 01 | [NIST AI RMF Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/) | GOVERN 1–4・6、MAP、MEASURE の本文。方針・役割・研修・第三者リスクの枠組みであり、法的責任や特定の運用方式を確定するものではありません。 |
| 02 | [CNCF Platforms White Paper](https://tag-app-delivery.cncf.io/whitepapers/platforms/) | 本文の内部利用者の需要、共通能力、プラットフォームと利用チームの分担。AI 組織の普遍的な成熟順序や報酬制度の効果を示す資料ではありません。 |
| 03 | [DORA 2025 report 公式紹介](https://dora.dev/research/2025/dora-report/) | 報告の紹介ページで、AI と組織システムを一体で扱う位置づけを確認。調査全体の数値や因果効果は引用していません。 |
| 04 | [Becker ほか 2025](https://arxiv.org/abs/2507.09089) | 原論文の abstract。経験豊富な開発者が既知の OSS リポジトリで行うタスクの無作為化比較であり、すべての開発者・案件への効果を一般化しません。 |
| 05 | [Stripe Usage-based billing](https://docs.stripe.com/billing/subscriptions/usage-based) | 公式ガイド本文の使用量計測・従量課金の流れ。特定課金モデルの収益性や予算上限の保証は導いていません。 |
| 06 | [Sculley ほか 2015](https://papers.nips.cc/paper_files/paper/2015/hash/86df7dcfd896fcaf2674f757a2463eba-Abstract.html) | NeurIPS の原論文 abstract。データ依存・設定・システム境界などの継続保守負担を確認。独自モデル投資の採算や段階順序は本記事の判断案です。 |
| 07 | [OECD Employment Outlook 2023 技能章](https://www.oecd.org/en/publications/oecd-employment-outlook-2023_08785bba-en/full-report/skill-needs-and-policies-in-the-age-of-artificial-intelligence_fe530fbf.html) | 公式章本文。仕事の変化と技能・研修の論点を確認。個人の賃金・雇用・市場価値の将来予測には用いていません。 |
| 08 | [pypdf Extract Text](https://pypdf.readthedocs.io/en/stable/user/extract-text.html) | 公式本文の文字層、OCR、読み順・表・レイアウト抽出の制約。内部文字層の存在だけで正確性を保証しません。 |
| 09 | [OpenAI Images and vision](https://developers.openai.com/api/docs/guides/images-vision) | 公式 Limitations と入力サイズ・詳細度・トークン計算の説明。全 VLM の性能や他社製品の課金仕様には一般化しません。 |
| 10 | [ColPali](https://arxiv.org/abs/2407.01449) | 原論文 abstract。画像ページの複数ベクトル表現による検索の具体例を確認。全方式での優位性や自社環境の費用は未評価です。 |
| 11 | [BIRD](https://arxiv.org/abs/2305.03111) | 原論文 abstract。データ内容・外部知識・効率を含む Text-to-SQL の評価課題。モデルと文脈の寄与率を断定する根拠にはしません。 |
| 12 | [STORM](https://arxiv.org/abs/2402.14207) | 原論文 abstract。調査・アウトライン・出典付き記事生成を分ける研究構成。社内検索全般の原因割合や固定パイプラインの必須性は導きません。 |
| 13 | [Indirect Prompt Injection](https://arxiv.org/abs/2302.12173) | 原論文 abstract。取得コンテンツを通じた操作誘導・データ流出の攻撃面。人の承認や社内文書の所在だけで安全を保証しません。 |
| 14 | [IES Organizing Instruction and Study](https://ies.ed.gov/ncee/wwc/PracticeGuide/1) | 公式実践ガイドの推奨事項と根拠の強さ。解答例と問題演習、分散学習、説明を促す質問。教育 Agent や企業の AI 研修への転用効果は別途評価が必要です。 |
| 15 | [NIST AI 600-1](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf) | 公式 PDF の Confabulation、Human-AI Configuration 等のリスク整理。個人向け検証階層や教材の効果量を実証する資料ではありません。 |
| 16 | [Boiko ほか 2023](https://arxiv.org/abs/2304.05332) | 原論文 abstract。科学実験の設計・計画・実行を組み合わせた研究プロトタイプを確認。新発見全般の自律性や市場普及は推論しません。 |
| 17 | [Park ほか 2023](https://arxiv.org/abs/2304.03442) | 原論文 abstract。記憶・内省・計画、仮想環境、行動のもっともらしさの評価。実社会を予測できるという根拠とは分けます。 |
| 18 | [AP2 specification](https://ap2-protocol.org/ap2/specification/) | 公式仕様本文。委任情報・関係者の役割・決定的なコードによる検証の責務を確認。対応事業者・地域・取引量の根拠にはしません。 |
| 19 | [法務省 AI 等法務業務支援サービスの案内](https://www.moj.go.jp/housei/shihouseido/housei10_00134.html) | 公式 HTML を PowerShell Invoke-WebRequest で取得して掲載本文を確認。2023 年指針と 2026-08-21 の補完・拡充ガイドラインの所在を確認。web ツールでの取得エラー後に HTTP で取得しました。ガイドライン本文の法的解釈・適法性の判断はしていません。 |
| 20 | [Guidelines for Human-AI Interaction](https://www.microsoft.com/en-us/research/wp-content/uploads/2019/01/Guidelines-for-Human-AI-Interaction-camera-ready.pdf) | 著者所属先の原論文 PDF、ガイドライン表(G1/G2 能力と品質、G3/G4 文脈、G8 却下、G9 訂正、G17 設定等)。UI 分類や閾値式、利用者全員の心理を実証するものとは扱いません。 |
| 21 | [UiPath Maestro Overview](https://docs.uipath.com/maestro/automation-cloud/latest/user-guide/overview) | 公式製品ガイド本文。ロボット・Agent・人を含むオーケストレーションの一例。RPA 製品全体の普及・機能・性能の根拠にはしません。 |
| 22 | [Microsoft Excel の再計算](https://learn.microsoft.com/ja-jp/office/client-developer/excel/excel-recalculation) | 公式本文の依存関係・計算連鎖・自動/手動計算。任意のファイル編集ライブラリが計算できるとは扱いません。 |
| 23 | [ISO 18587:2017 公開概要](https://www.iso.org/standard/62970.html) | ISO の公開 scope/abstract で完全な人手後編集と担当者の能力を対象にすることを確認。規格本文は取得せず、規格適合や詳細な要求事項は説明していません。 |
| 24 | [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | W3C 勧告本文の 1.1.1、2.1.1、2.4.1、4.1.3。支援技術・ブラウザーの組み合わせでの実機確認を置き換える資料ではありません。 |
| 25 | [openpyxl Using formulae](https://openpyxl.readthedocs.io/en/stable/simple_formulae.html) | 公式本文で数式を書き込めることと、数式を評価しない制約を確認。再計算エンジンを別に用意する必要を具体化しました。 |

法務省ページは通常の Web 取得が失敗したため公式 HTML を直接取得しました。Nature の Boiko 論文ページは本文取得できなかったため、内容を確認できた著者論文の arXiv abstract を引用しています。ISO は公開概要までで、有料規格本文を確認したとは扱いません。

## 検証と残る範囲

- `node scripts/validate-docs.mjs --all`: 215 記事で成功
- `node scripts/check-links.mjs`: 225 ファイル・4,000 リンクで成功
- 対象 29 記事と本記録の markdownlint: 成功
- 29 記事の旧参考資料を Git の基準版と照合し、テンプレート出典 13 件の置換を確認
- 参考資料は本文主張に対応する外部 URL とアクセス日を付与。独自整理に効果を裏付ける実験があるとは記述していません
- モデルの自社画像・SQL・研修・UX に対する効果や、契約の法的判断は今回実施していません。記事は対象条件での評価または専門家による確認につなぐ範囲です
- 新規 docs、status の変更、GLOSSARY への新語追加はありません

意味的な独立レビューと、全変更を統合した公開ビルド・CI の最終確認は親タスクで行います。
