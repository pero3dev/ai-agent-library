# RPA と Agent の使い分け・移行戦略 執筆前調査メモ(DA-R1)

## 2026-11-05 の部分観測

対象は [RPA と Agent](../../docs/13-domain-agents/rpa-and-agents.md)の製品別条件、[表計算エージェント](../../docs/13-domain-agents/spreadsheet-agents.md)の再計算制約、[架空の経費事例](../../docs/07-case-studies/case-study-expense-agent.md)の設計原典です。系統全体の完了や実製品の動作確認ではありません。全観測の一次資料 URL・実取得 UTC・分類は [実行記録](../freshness-runs/20261104t191109163z-4a12249e.json)に保存します。以下より後の旧確認日・旧サマリは当時の記録として保持します。

| 分類 | 確認した事実・範囲 | 一次資料・実取得 UTC |
| --- | --- | --- |
| changed | WorkHQ の Design Studio 3.20.0 / 3.21.0、Digital Worker 2.38.0 / 2.39.0 は Unsupported versions に分類され、終了日は 2026-09-30。サポート対象外の記載を実行停止とは扱いません | [版別表](https://documentation.blueprism.com/workhq/en-us/release-notes/ds-dw-version.htm)、2026-11-04T19:12:20Z |
| changed | Copilot Studio computer use は GPT-6 Sol も GA。harness 名は GitHub Copilot / Customer Conversation / standard。agent flow の容量枯渇時の新規実行制限には、実行中・対象の Microsoft 365 Copilot ライセンス利用者の対話から開始する処理・テスト実行の例外があります | [computer use](https://learn.microsoft.com/en-us/microsoft-copilot-studio/computer-use)、2026-11-04T19:12:12Z。[harnesses](https://learn.microsoft.com/en-us/microsoft-copilot-studio/harnesses-overview)・[agent flows](https://learn.microsoft.com/en-us/microsoft-copilot-studio/flows-overview)、2026-11-04T19:13:10Z |
| changed / unverifiable | WinActor AI 連携説明書はトークン数ではなく問い合わせ回数を計数すると明記。2026-10 以降の具体的な上限・追加パック価格は取得資料から確認できません | [説明書](https://winactor.biz/docs/AI_Collaboration_License_Description_Docum.pdf)、2026-11-04T19:13:04Z。[サービス条件](https://winactor.biz/rpa/winactor-license.html)、2026-11-04T19:13:10Z |
| unchanged | WorkHQ の GA 日・対象経路、UiPath Maestro の自己ホスト開始版と TaaS のクラスタ内配置、Automation Anywhere の 2026-05-19 時点の機能別 GA / preview は既存記述と一致。全機能の後続提供まで確認した意味ではありません | 各 URL・取得時刻は実行記録を参照 |
| unchanged | Excel の自動・手動再計算、依存関係ツリー・計算チェーンと、openpyxl が数式を評価しない制約を再確認。架空経費事例の固定 workflow / 動的 agent と段階的な複雑化は設計原典に一致 | [Excel](https://learn.microsoft.com/ja-jp/office/client-developer/excel/excel-recalculation)・[openpyxl](https://openpyxl.readthedocs.io/en/stable/simple_formulae.html)・[設計原典](https://www.anthropic.com/research/building-effective-agents)、2026-11-04T19:12:41Z |

未確認は WinActor の上限・価格、Copilot Studio の機能別・地域別展開完了、Automation Anywhere の各 preview 機能の GA 実施、UiPath の全機能・利用モデルの閉域対応です。予定日経過や自己ホスト対応から完了を推定せず、各社の追加告知・構成仕様・契約条件を次回確認先にします。Power Automate 変換の一方向性は今回独立再検証していません。

## 初回調査と以前の観測履歴

- **調査 ID**: DA-R1
- **調査日 / 確認日**: 2026-07-09(初回)、2026-09-10(RPA01〜RPA06)
- **用途**: DOMAIN-AGENTS 計画「RPA と Agent の使い分け・移行戦略」記事の裏取り。記事本文は類型・判断軸を主とし、期限・配置・互換性の判断に役立つ具体例を併記します。主目的は冒頭の「## 調査サマリ(類型と判断軸)」です
- **方針の注意**: 製品の**優劣比較・ランキングはしない**。各社の「打ち出し(公式ポジショニング)」の整理に徹します。機能名・価格・提供形態は変化が速いため、確度と確認日を必ず添え、曖昧なものは「未確認」にします
- **確度マーカー**(4 段階):
  - `公式確認済み`: 公式ドキュメント/公式ページ本文を直接取得して確認した
  - `ベンダー自己報告`: 公式だが第三者検証できない自己申告(製品マーケティングページ・プレスリリースの宣言等)。SPA・403 で本文を機械取得できず公式ドメインの検索結果経由で確認した場合もここに含め、その旨を注記
  - `二次情報`: 公式以外(ニュースサイト・まとめ記事等)。裏取り待ちの参考
  - `未確認`: 今回取得できなかった。確認すべき URL を残す
- **取得上の注意**: WorkHQ の documentation サイトは 2026-09-10 に本文取得済みです。過去の corporate サイトの取得失敗を GA・保守期限の確認不能の根拠には使いません。

---

## 調査サマリ(類型と判断軸)

記事本文で製品横断的に言える「類型と判断軸」。個別ベンダーの根拠は後述の「## ベンダー別メモ」にあります。

1. **どのベンダーも「RPA を置き換える」ではなく「補完・共存」を公式に打ち出している。** 決定的(deterministic)な定型タスクは既存 RPA が担い、適応・推論・非定型(unstructured / 判断を要する)タスクを AI Agent が担う分業が共通構図です。UiPath は「agents think, robots do, and people lead」、Microsoft は「keep classic RPA for deterministic scenarios ... CUAs add flexibility where RPA falls short」、Automation Anywhere は既存 RPA/BPM に「layer over」して "rip-and-replace" を避ける、SS&C は「retaining deterministic automation where control is essential」、WinActor は「定型業務は RPA・非定型業務は生成 AI」と、表現は違えど同じ役割分担を述べています。

2. **新しい主戦場は「オーケストレーション層」。** エージェント・ロボット・人・API・(さらに他社エージェント)を単一のガバナンス下で束ねる製品を各社が中核に据えています(UiPath **Maestro** / SS&C **WorkHQ** / Automation Anywhere **Mozart / APA / PRE** / Microsoft **Copilot Studio の harness 別機能**)。→ 判断軸: 「エンドツーエンドのプロセスのオーケストレーションの正本をどこに置くか(既存 RPA 製品のオーケストレータか、新設のエージェント基盤か)」。

3. **既存 RPA を「エージェントのツール/アクション」として呼ぶパターンが標準化しつつある。** 決定的な手順は既存の RPA スクリプト(desktop flow / robot / bot)としてそのまま保ち、エージェントがそれを道具として起動する構図です。Microsoft は「reliable automation ... calling desktop flows directly from Copilot Studio for tasks that require precise, step-by-step execution」、UiPath は Maestro が robots を呼ぶ、Automation Anywhere はエージェントが「orchestrate across bots, APIs, documents—and other agents」。→ 判断軸: 「決定的部分は RPA 資産として温存し、適応部分だけをエージェント化する」= 段階的移行(rip-and-replace 回避)。

4. **「決定的 RPA を使う条件 / エージェントを使う条件」の判断基準は各社でほぼ一致している。** 最も明快なのは Microsoft の公式ドキュメントの RPA vs CUA 比較表です。決定的 RPA が向くのは「UI/画面が安定・ルールが明確・高頻度で速度重視・既存 RPA チームが保守」、エージェント(CUA)が向くのは「UI が変動/複数アプリ・判断が曖昧で自己修正が要る・画面上の視覚情報に依存・RPA チームのバックログが逼迫」。→ 記事の「判断軸テーブル」にほぼそのまま流用できます(製品名は出さず一般化)。

5. **「人の承認・統制・監査」は RPA 時代の運用統制の延長として、オーケストレーション層に集約する打ち出し。** HITL(承認・例外エスカレーション)、監査ログ(audit trail)、ガードレール、RBAC、暗号化を「エージェント・ロボット・人すべてに一度定義して適用する」方向です(UiPath「Policy, audit, and human-in-the-loop controls live at the orchestration layer, expressed once and applied across every agent, bot, and step」+ Action Center への例外ルーティング + Unified Audit 2.0 + controlled agency guardrails / Microsoft の "Human in the loop" アクション + Purview + audit logs + Key Vault / Automation Anywhere の AI Guardrails + RBAC + audit trails / SS&C の "single governed environment")。→ 判断軸: 「RPA の統制資産(承認フロー・監査・認可の仕組み)を Agent 世界にどう継承するか」。

6. **実行・推論・連携の配置を分ける**。UiPath の自己ホストは対象版・クラスタ・TaaS の配置まで確認でき、WinActor の AI 連携には NTT-AT / Azure OpenAI への通信があります。製品全体のオンプレ訴求から全機能・利用モデルの閉域完結を推定せず、自社のデータフローを確認します。

7. **モデルはベンダー中立(BYO-LLM)へ向かっている。** オーケストレーターは特定 LLM に依存せず、複数プロバイダ(OpenAI / Anthropic / Google Gemini / Azure OpenAI / Bedrock / Vertex)や自社モデルを選べる設計です。UiPath は「UiPath is not your AI provider; it's the layer that governs whichever AI providers you choose」と明言。→ 判断軸: エージェント基盤選定では「LLM の選択自由度」と「ガバナンスの主体」を分けて評価する。

8. **マルチエージェント/サードパーティエージェントの取り込みが進む。** オーケストレーターが自社エージェントだけでなく他社エージェント(Claude / OpenAI / Gemini / Microsoft Copilot / カスタム)も同一の統制・監査・可観測性の下で束ねる方向です(UiPath Maestro が明言 / SS&C WorkHQ は "unified control plane")。→ 判断軸: ベンダーロックインを避けつつ統制を効かせる「エージェント相互運用のガバナンス」。

---

## ベンダー別メモ

### UiPath(Agentic Automation / Maestro / Agent Builder / Autopilot)

Maestro は Automation Suite 2.2510.2(2026-04-15)から EKS / AKS / OpenShift に自己ホストでき、2.2510.3(2026-07-23)はリソース使用を改善しています。TaaS(Temporal as a Service)は Kubernetes deployments としてクラスタ内に配置されます。名称だけで外部 SaaS と判定しません。全機能・利用モデルが閉域内で完結するかは未確認です。実行・推論・連携の通信経路を個別に確認します。

- **確認日**: 2026-09-10 (RPA03)
- **一次情報**:
  - https://docs.uipath.com/maestro/automation-suite/2.2510/release-notes/2-2510-2
  - https://docs.uipath.com/maestro/automation-suite/2.2510/release-notes/2-2510-3
  - https://docs.uipath.com/automation-suite/automation-suite/2.2510/installation-guide-eks-aks/kubernetes-cluster-and-nodes

### Microsoft(Power Automate / Copilot Studio)

computer use は 2026-05-13 に GA を告知。2026-07-03 更新の資料では OpenAI CUA / Sonnet 4.5 が GA、Sonnet 4.6 / Opus 4.6 が Experimental です。古い比較表の「GA が必要なら RPA のみ」は選定条件から除外しました。全地域への展開完了は未確認です。

2026-08-27 更新の harness 資料は GitHub Copilot / standard / Copilot chat を区別します。agent flows は standard(classic)、新 workflows は別の仕組みです。Power Automate から agent flow への変換は一方向で、新 workflows への変換はできません。容量を使い切ると新規実行がブロックされるため監視します。

決定的なフローでも外部サービス状態の変化・結果不明は残ります。同じ入力なら必ず同じ業務結果という保証として製品説明を流用せず、再試行・重複防止・結果照合を設計します。

- **確認日**: 2026-09-10 (RPA04 / RPA05)
- **一次情報**:
  - https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/agent-tools
  - https://learn.microsoft.com/en-us/microsoft-copilot-studio/computer-use
  - https://techcommunity.microsoft.com/blog/copilot-studio-blog/computer-using-agents-in-microsoft-copilot-studio-are-now-generally-available/4519427/replies/4527780
  - https://learn.microsoft.com/en-us/microsoft-copilot-studio/harnesses-overview
  - https://learn.microsoft.com/en-us/microsoft-copilot-studio/flows-overview

### Automation Anywhere(Agentic Process Automation / AI Agent Studio / Automation Co-Pilot)

Mozart Orchestrator と APA / PRE は RPA・API・Agent・人を含むプロセスの統合を打ち出しています。2026-05-19 発表時点で AI Evaluations は GA、Enterprise Claw / AAI Code は public preview、Context Intelligence Graph は preview で Q3 GA 予定です。Process Simulation は別の予定として扱います。予定経過だけで 2026-09-10 時点の GA 完了とは推定しません。30% の精度改善はベンダー内部評価で、第三者評価や自社環境の改善保証ではありません。

- **確認日**: 2026-09-10 (RPA06)
- **一次情報**:
  - https://www.automationanywhere.com/products/agentic-process-automation-system
  - https://www.automationanywhere.com/company/press-room/automation-anywhere-unveils-2026-platform-enhancements-run-ai-driven-processes
  - https://www.automationanywhere.com/company/press-room?year=2026

### SS&C Blue Prism(WorkHQ / Agentic Automation)

WorkHQ の 2026-04-29 の名称発表と、Agentic Workflows の 2026-03-27 GA は別のイベントです。GA の対象は Next Generation(現 WorkHQ)、Blue Prism Cloud、Enterprise 7.4.1 以降です。

Design Studio 3.20.0〜3.21.0 / Digital Worker 2.38.0〜2.39.0 は 2026-09-30 にサポート終了。2025.25 以前の同梱版は already unsupported と明記されています。9 月末の対象から外れることを保守継続の意味にしません。サポート終了と実行サービスの停止は別です。

SS&C AI Gateway の Qwen/Qwen3-30B-A3B は 2026-06-12 頃の廃止を通知し、サポート対象モデルへの切替を指示しています。実際の API 停止日は未検証です。公式 documentation 本文は取得済みです。

- **確認日**: 2026-09-10 (RPA01)
- **一次情報**:
  - https://documentation.blueprism.com/workhq/en-us/announcements/announcements.htm

### WinActor(NTT-AT / NTT データ)+ つなぎ AI

2025-09-04 告知の脚注は AI 支援の無制限期間を 2026-09 末までとし、10 月から利用上限・追加パックへ移ると説明しています。上限数量・価格は未確認です。V7.7 の製品ページは AI ヘルプと VBScript から Python への移行支援を案内しています。正確な版のリリース日は未確認です。

AI 連携ライセンスは NTT-AT が契約する Azure OpenAI を含み、NTT-AT サーバーと Azure OpenAI への外部通信を伴います。オンプレ RPA の実行と AI 推論の閉域完結を同一視しません。

- **確認日**: 2026-09-10 (RPA02)
- **一次情報**:
  - https://www.ntt-at.co.jp/news/2025/detail/release250904.html
  - https://winactor.biz/product/winactor_v7.html
  - https://winactor.biz/use/manual.html

## 変わりやすい項目(定点観測)

1. WorkHQ の部品別保守期限と AI Gateway のモデル切替。GA は確認済みで、実行環境の更新状況を追います。
2. Copilot Studio のモデル別 GA / Experimental、全地域展開、harness ごとのフロー互換性・容量条件。
3. UiPath の自己ホスト対象版、全機能・利用モデルの通信経路とエアギャップ可否。
4. WinActor 7.7 の正確な提供日、2026-10 以降の上限数量・追加料金。
5. Automation Anywhere の preview 機能の GA 完了と提供範囲。Q3 計画から完了を推定しません。
6. 各社の認証・契約・監査保存条件は Trust Center / 契約で別途確認します。

## 参照した URL 一覧(アクセス日 2026-07-09)

### UiPath(公式: uipath.com)
- https://www.uipath.com/platform/agentic-automation
- https://www.uipath.com/platform/agentic-automation/agentic-orchestration
- https://www.uipath.com/newsroom/uipath-launches-first-enterprise-grade-platform-for-agentic-automation
- https://www.uipath.com/newsroom/uipath-accelerates-ai-transformation-with-agentic-automation-and-orchestration
- https://www.uipath.com/newsroom/uipath-automation-suite-delivers-agentic-ai-for-public-sector
- https://www.uipath.com/community-blog/tutorials/uipath-autopilot-for-everyone

### Microsoft(公式: learn.microsoft.com / microsoft.com)
- https://learn.microsoft.com/en-us/microsoft-copilot-studio/flows-overview
- https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/agent-tools
- https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/computer-using-agents-now-deliver-more-secure-ui-automation-at-scale/
- https://learn.microsoft.com/en-us/power-platform/release-plan/2026wave1/power-automate/ (参照のみ・本文未精読)

### Automation Anywhere(公式: automationanywhere.com)
- https://www.automationanywhere.com/products/agentic-process-automation-system
- https://www.automationanywhere.com/products/ai-agent-studio
- https://www.automationanywhere.com/products/automation-co-pilot
- https://www.automationanywhere.com/company/press-room/automation-anywhere-advances-ai-native-agentic-solutions-enterprise-openai (存在確認のみ)
- https://www.automationanywhere.com/company/press-room/automation-anywhere-achieves-aws-agentic-ai-specialization (存在確認のみ)

### SS&C Blue Prism(公式: blueprism.com / investor.ssctech.com — 本文は 403/timeout で未取得、検索スニペット経由)
- https://www.blueprism.com/news/ssnc-unveils-workhq/
- https://investor.ssctech.com/news-releases/news-release-details/ssc-unveils-workhq-power-enterprise-agentic-automation
- https://www.blueprism.com/products/agentic-automation/
- https://www.blueprism.com/resources/blog/agentic-automation-roadmap-2026/

### WinActor / NTT(公式: ntt-at.co.jp / winactor.com / journal.ntt.co.jp)
- https://www.ntt-at.co.jp/news/2025/detail/release250904.html
- https://www.ntt-at.co.jp/news/2025/detail/release250710.html
- https://www.ntt-at.co.jp/news/2025/detail/release251210.html
- https://winactor.com/product/tsunagi-ai/
- https://journal.ntt.co.jp/article/34167

## 2026-10-03 第3回レビューの部分再確認

#177: WorkHQ の対象 Design Studio / Digital Worker のサポート期日経過と表の掲載を再確認。実施・延期は未確認で、実行停止とは区別します。

取得 URL・実取得バッチ完了 UTC・確認水準・残る TODO は [一次情報の修正記録](../reviews/2026-10-03-article-remediation.md) を参照してください。過去の日付の本文は上書きしていません。
