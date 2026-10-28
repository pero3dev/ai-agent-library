# 検索UIのClock観測候補

記録日: 2026-10-28。基準mainは `023cfac164c96dc3d8c1afa91c24e8bf4530161f` / tree `6664903bf13088f2fe262cef1820fc987a4edfb7`。自分用の範囲とコードコピーの受入を記録したPR291の統合後に、検索の計測基盤を追加する。公開headのSDK型検査と実検索のClock値は、この記録作成時点で未確認である。

## 変更する動作と計測範囲

自動実行と手動の既定は、従来の起動から全記事一覧が使えるまでの1ケースを保つ。手動で `search-query-to-visible-witness` を選んだ場合だけ、`testSearchQueryToVisibleWitness()` を実行する。未知の選択値を拒否し、起動と検索のconcurrency・artifact名を分ける。起動method本文は変更しない。

各反復では、不一致query `AILIBRARY_UI_PERF_NO_MATCH_67404f8127` の空状態とwitness不存在を先に確認する。公開検索欄の置換開始から、正のquery「データを外部 API に出せるか」、対応するfilter summary、モデル選定記事 `03-implementation/model-selection` の可視性、空状態の消失が揃うまでをClockで測る。起動・一覧準備・検索欄の表示・不一致状態への復帰は計測外とする。

キーボード入力とAX待機を含む。検索結果が1件とは主張せず、全記事数や可視行数を検索結果総数として使わない。検索エンジン単体や各文字の応答時間でもない。Sourceはwarm-up1回と記録3回を宣言し4呼出をassertするが、実標本はまだ取得していない。

Exporterはscenario・method・contextとquery/witnessの対応、選択したexact1case、Clock識別子と秒単位、typed3標本を照合する。CSVの5列1行、元順と精度、印字小数位の半刻みだけを許す平均丸め検査を保つ。scenarioのない旧contextは起動だけに対応し、欠測の補完や起動値の検索への転用を拒否する。

## 確認済みの準備

Source4は `PublishedPerformanceUITests.swift`、`export-performance.mjs`、`ios-performance.yml`、`ios-performance-export.test.mjs`。manifest SHA-256は `44a0f31c65bf6cf4e8b833c626873759bd441e0d61f4f3c85f4875e41ad7303f`。独立コードレビュー票 `c203372793c0ce48c6ac7666967d38199e8680826bcb68b9128eb4c5b0edff12` からSource4を変更していない。

既存36件と追加8件のexporter Node44件が成功し、失敗・skip・cancelは0だった。Node24.19.0、1並列、wall23.261890375秒で、合成xcresulttool/CSVを使った検査である。既存lockのjs-yaml、Bash run13個、選択3ケース、Node構文2ファイルも確認した。初回の私有確認は引用符付きstatusを補助regexが扱えず停止し、補助だけを修正して取り直した。Source4とNode44件は反復していない。

同じSwift Source SHAで、Xcode16.2付属コンパイラの `-frontend -parse` がexit0、出力0Bだった。票のSHA-256は `74c420cbac2add2d8aef99020f23f119dbaed7561f8bc779c10279f1ed1ee117`。構文解析だけであり、SDKの型検査・import解決・link・UI・metricの成功とは区別する。

固定した旧main516の199記事で、不一致literalの不在と正のliteralを持つ原文を確認した。モデル選定原文16674BのSHAは `84bf14965deb40ae111c9d900c9a478d212a97d00be05b67f06ebc4f1c64bdb5`。今回の基準でも同じ原文bytesを照合し、runtimeの検索結果件数とは扱わない。準備の詳細と過去のbindは[JSON記録](ios-search-ui-clock.json)へ残す。

## 統合単位と未確認事項

Source4を1コミット、記録2本と索引3を次のコミットに分け、1つの小PRとする。基準mainのCode・自分用範囲・Clock・MP3索引と全TODO行を保ち、現行集計13/32を変更しない。IOS-15の完了を示すものではない。

[既存の観測基盤](../2026-10-25/ios-published-readiness-observation.md)を使い、新headのSDK/Hostedと最初の検索Clock3値・CSV・操作状態を確認する。[main49の起動値](ios-published-launch-readiness.md)は異なるsnapshotとscenarioの履歴で、新しい検索やAppの性能合格に読み替えない。

実機・VoiceOver・小型端末・最低OS、cold/Release・p95・CPU/RSS・memory/scroll・性能予算とIOS-15全体は未受入である。実測していない値をゼロや成功として補わない。

## PR292の採用と実観測の追記

2026-10-28 checkpoint。上の未確認・未受入という記述とJSONのnullは作成時点の履歴である。その後、[PR #292](https://github.com/pero3dev/ai-agent-library/pull/292)の最終head `358988e5876e4c8641b41286cccfd4ac4f7ffdeb` を通常保護squashでmain `c148d5c75b63f433f667bd8b8b3ba2555f598238` へ採用し、全2792 tupleが同じtree `9a13070e0bb567f88be5c91de4f2b3d718e39999` であることを照合した。管理者例外や保護設定の変更は使っていない。

最終headではCommon、SDK26 unsigned Archive、自動起動、明示manual検索、Native、Dedicated、Fullが記録した範囲で成功した。Runtime26の最初の見出し可視性待機失敗は保持し、Source・timeout・selectorを変えない1回の限定再実行で同じ代表2件が成功したことと分ける。これらはPR292のheadに対する結果で、後続の読書export 0.2.21（23）のSDK・UI検証へ転用しない。

Rootがscenarioごとに1回だけ圧縮artifact bodyを独立に読み、全圧縮SHA、選択したraw／Clock typed3標本／CSVのCRCとSHA、実checkoutと選択Source4を照合した。自動起動の原値は10.073117062000001、8.644345454、7.73651714秒でCSV平均8.817993219秒、明示検索は6.288212189、6.059885608、6.113109553秒でCSV平均6.153735783秒だった。producerの丸めたconsole表示だけを根拠にしていない。今回の追記では再取得・再実行していない。

測定対象はApp0.2.20（22）、Xcode16.4、iPhone16／iOS18.5のDebug Simulatorである。起動は終了処理を計測外、cache warmを含む。検索は起動・不一致状態への復帰を計測外とし、公開query置換・filter summary・可視witnessまでを測る。いずれもUI automationとAX pollingを含み、検索はkeyboard入力も含む。実機、cold／Release、p95、CPU／RSS、memory／scroll、検索engine単体と性能予算、IOS-15全体は未受入のまま。TODO32行・完了13行を変更しない。
