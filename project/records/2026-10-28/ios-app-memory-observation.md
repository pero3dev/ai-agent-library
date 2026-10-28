# iOS App本文表示時のメモリ観測

2026-10-28。IOS-15の次の小単位として、指定iOS Appの本文表示区間を観測する候補を準備する。自分用初版の実装・検証を優先度順に自律実施し、commit・PR・通常main統合へ分ける本人の依頼を根拠とする。新しい課金・契約・外部配布・署名更新・OS更新は対象にしない。

## 目的と対象

基準はmain `e0c3031f3d62adab017c72949ffa3376e77b18bf`、App 0.2.22（24）。既存のMac Core CLIのRSSをAppのメモリと扱わず、UIテストから対象Appを指定する。App・PBX・版・本文の実装を変えず、既存Clockの2ケースとexport契約を保持する。

[Appleのinitializer](https://developer.apple.com/documentation/xctest/xctmemorymetric/init(application:))とローカルXcode16.2のXCTest SDK headerにより、`XCTMemoryMetric(application: app)`が指定Appを対象とし、引数なしが現在のprocessを対象とすることを確認した。APIは確認したが、iOS18.5での実標本はまだ得ていない。

[Appleの説明](https://developer.apple.com/documentation/xcode/preventing-memory-use-regressions)は計測区間のピークと開始・終了間の増加を扱う。1つのmetric objectから出るrow数・identifier・wire unitを決め付けず、増分を正値と仮定しない。[Simulatorの制約](https://developer.apple.com/documentation/xcode/gathering-information-about-memory-use)と[代表的な計測環境の推奨](https://developer.apple.com/documentation/xcode/writing-and-running-performance-tests)を踏まえ、今回をDebug Simulatorの参考観測とする。

## 旧実験の参照

[閉じた一時PR #274](https://github.com/pero3dev/ai-agent-library/pull/274)には、0.2.14（16）の検索区間でmemory 3行・各5値を記録した履歴がある。UIは成功したがcollectorは読取前のseal不一致で停止し、元のbefore filelistがないためSQLite更新が原因とは確定していない。旧記録の承認範囲と、後続再読取の独立確認待ちを区別する。

今回は0.2.22のTransformer本文シナリオで初回rawを採取する別の観測で、旧5値・指標の意味・換算・性能基準を転用しない。旧branchは変更・統合しない。新exporterはcontextの安定した読取とxcresultのroot同一性を検査するが、公式reader前後のbundle内部全byte不変を検証済みとは主張しない。

## 測定の境界

全記事一覧と学習ガイドの準備後にmetricを構築する。最初の明示launchは1回。各invocationで一覧・検索・一意なTransformer行を準備した後、行tapの直前に開始し、前面のTransformer文脈、reader、その内部の非空で完全表示されたnative textを確認して停止する。戻り・検索・行の準備・添付・終了は区間外。UI／AX同期と画面遷移を含む。

[iterationCount](https://developer.apple.com/documentation/xctest/xctmeasureoptions/iterationcount)のwarm-up1回と記録3回を採用し、sourceでは4回の呼出しと本文witnessを確認する。[開始](https://developer.apple.com/documentation/xctest/xctmeasureoptions/invocationoptions-swift.struct/manuallystart)・[停止](https://developer.apple.com/documentation/xctest/xctmeasureoptions/invocationoptions-swift.struct/manuallystop)を手動指定する。明示launch1回とforeground状態の確認は、PID不変を独立観測した証拠ではない。

対象は `11-llm-internals/transformer-architecture`、scenarioは `published-article-app-memory`、caseは `PublishedPerformanceUITests/testPublishedArticleAppMemory`。起動時間、cold起動、lifetime peak、全画像decode、scroll、Release、実機の安全限界、製品SLOを測ったとはしない。

## 実装と初回の採択手順

Swiftの専用case・新memory workflow・別exporter・独立Node試験をSource commitへまとめ、記録と索引を別commitにする。既存Clockの単一指標・CSV契約をmemoryへ拡張しない。

初回のtrusted memory契約は未採択とする。exact1 case・型付き3値・出所の対応と、上限付きraw／CSVを保存しても、契約が未確定なら `metric-contract-unconfirmed`、`accepted_measurements: null`、非ゼロ終了を保つ。Draftのまま実metric集合・単位・row数・CSVとsource／checkoutを独立に確認し、別commitで固定契約を採択して新headの検証を行う。初回の未採択結果を削除・同条件retryで置き換えず、製品不具合や性能合格とも扱わない。

job40分とビルド・UI実行の別上限はCI資源の制限で、製品の性能予算ではない。専用Simulatorだけを作成・片付け、compactは全体2MiB・JSON各512KiB・CSV各64KiBを上限に90日保持する。上限超過時に指標を切り落として成功にしない。source／checkoutとGitHub event／run／attemptは別に照合する。

## 確認状況と残件

候補のSwift構文と、Xcode16.2／iOS18.2 Simulator SDKを使う単一UIファイルの型検査が成功した。Appのlink・実UI・実メモリ実行ではない。workflowのactionlint・YAML・Bash・埋込Nodeの静的検査、新memory Node20件と既存Clock44件が成功した。exporterの初回レビューで見つかった別case混入・open直前のサイズ増加・最終child後の期限確認の3件を修正し、負例を追加した。3件の修正版の独立差分レビューでも新しいP1・P2は0件だった。lockfileから依存を隔離準備した `npm run check` も成功し、Node1130件中1115成功・15skip・失敗0を確認した。Macの一時path・Git設定は専用配置で隔離し、既存sourceをこのために変更していない。独立レビューと実SDK型検査、実UIと3標本、identifier・unit・cardinality・CSVの採択、必要CIと通常main統合を区別して記録する。実protocol payloadを取得していなければ、sourceのassertとcase成功をpayload検証済みへ広げない。

IOS-15全体と受入目標、他のTODOは未完了を維持する。実機確認は本人の許可により未完了のままスキップできる。TODO32行・完了13行を保持し、旧0.2.20のClock値を今回の実メモリや現行版の値として転用しない。
