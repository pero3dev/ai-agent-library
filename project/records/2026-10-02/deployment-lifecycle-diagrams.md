# P3: 実行基盤・常駐個体・MLOpsの接点

## 作業契約と方針

- 既存3記事に6図34段階を置く。実行時間と外部状態、provider容量と展開、常駐個体の保守・交代・退役、共通基盤に足す差分と責任を本文と並べる。本文や具体例の増量を目的にしない。
- 専用モデル・本文対応・SVG・包装・登録・MDX許可・固有試験、本記録と索引・引き継ぎを所有する。原文の表・Mermaid・例・時点・TODOを保持する。
- 最新実マージ済みmainから通常PR、必要検査・必須CI・squash・既存Pagesまで進める許可は依頼に基づく。前単位の公開表示後にマージし、公開後は表示のみ。任意レビュー・追加台帳・大量証跡は省く。

| 記事 | 主要論点の割当 | 保持する境界 |
| --- | --- | --- |
| デプロイ | 三制約とqueue・state、四形態とtail、checkpoint・冪等契約、RPM/TPM・backpressure・優先度、fallbackと復帰・全停止、canary/shadow・追加容量、切断後の作用と費用 | HTTP切断を取消、CPU増設を外部枠の増加、事前確認を冪等保証、切替を同品質、shadowを容量ゼロにしない |
| 常駐個体 | lifecycleと単一taskの分担、四変化と急変、定期・イベントの保守、外部状態からの再構成、残す／捨てる移管、副作用なしの比較・実行権、個体差とsnapshot、事前SLI・権限回収・安全な退役 | 長期稼働を重みの劣化、週次を実測周期、全履歴移管を回復、二重実行をshadow、停止を全保存先の削除完了にしない |
| MLOps | 共通循環と正本の分担、代表例の五差分・MLにもある非決定性、部品別再利用と追加四要素、ML／app／platformの責任、特化／既存拡張・重複運用、FTで合流するdata/job/model版と評価 | 従来MLを単一指標・決定的、LLMを学習不要、版名を挙動固定、tool名を適合、借りる構成をFT必須にしない |

原文全体と本文ASTを確認した。2026-10-02に[Anthropicの長期ハーネス](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)の複数文脈と進捗・試験、[Google MLOps](https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning)のmetadata・再現と基盤、[MLflow Prompt Registry](https://mlflow.org/docs/latest/genai/prompt-registry/)のtemplate版と可変model構成、OpenAI・Anthropicのrate limit資料を確認した。長期個体の劣化周期・実provider上限を生成せず、原文の時点・未確認を保持する。

## ローカル検証

3記事6図34段階を実装した。root・websiteの`npm ci`、共通487成功・3skip、サイト単体710成功、原文AST・MDX保持と意味モデル12検査、静的223ルート・230 HTML、対象ブラウザ16検査が成功した。全段階・全選択肢の1440px明色／390px暗色、本文同期・前後・シーク・拡大、JS無効、1280×720での再生・停止・印刷を確認し、PCで6図を目視した。

最初の登録は本文以外のアンチパターン見出しを指定して失敗した。装飾を本文の見出しへ限定し、実務項目は原文と図の終段に残した。最初のブラウザ起動は存在しないproject指定で失敗したため、正本設定のEdgeチャンネルで実行し、音声最終候補を合わせた28検査が成功。目視で中央のアプリ責任も共通線へ結び、最終静的ビルド・対象16検査・変更図の目視を再確認した。

tail境界、結果不明と冪等契約、loopごとのRPM/TPM、新旧shadowの合計、fallback三条件と全停止、交代四条件と退役三条件、借りる構成と学習五条件を検査した。図は実送信・切替・削除・学習を実行しない。通常PR・必須CI・squash・Pages・公開表示は未実施。P3〜P5は未完了。

前単位でLinuxの狭幅注記がはみ出したため、常駐個体の注記を条件を保って短縮した。意味モデルと原文は変更しない。2単位合同のAST・意味24、静的223 route・230 HTML・16章、対象16を含む合同ブラウザ34検査が成功。変更した3記事のP5検査はChromium・WebKit各3件が成功し、常駐個体の最終段階をPC取得画面で確認した。共有5ファイルの凍結patchは変更せず、専用sceneだけをこの単位へ含める。

提出baseは[PR #133](https://github.com/pero3dev/ai-agent-library/pull/133)の実squash b8e126974cf1274c7d488d5d68ef4e6d05a026a8。前単位の提出headとPR CI 37020073992・必須9検査・実メッセージ・ツリーを確認。文書・リンク・Markdown・差分を提出前に検査する。公開済みは123/199記事で、公開後は表示確認のみ。
