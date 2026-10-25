# 全記事一覧が使えるまでの性能観測基盤

## 作業契約

- 目的: IOS-15の起動性能を実アプリで測る入口を整え、測定方法と実測値を照合できる証拠を残す。
- 基準: PR #261 head bc353013ec84b202e78beeeae7396395aaac1ae0。版0.2.14（16）。
- 所有: 専用Swift UIケース・性能workflow・exporter・Node回帰、PBX登録と全記事機能workflow、開発手順・TODO・本記録。分担する他者の変更を戻さない。
- 許可根拠: ユーザーのiOS TODO自律実装と段階的commit・PR・通常main統合の依頼。実機の未確認はスキップして残す。
- 終了条件: 静的・SDK検証と独立レビューを経て初回Hostedを実行し、実出力のClock識別子・単位と標本数を照合する。今回の目標値は未採択。
- 規約: [AGENTS](../../../AGENTS.md)、[Git規約](../../../harness/git-rules.md)、[開発手順](../../../CONTRIBUTING.md)。

## 測定する操作

専用のfresh Hosted runnerで標準全記事生成・独立原文件数・実Debug同梱版の全SHAを監査し、専用performanceケースだけを実行する。起動要求の直前から、正確な全記事件数と学習ガイドの存在確認までをXCTClockMetricで測る。終了処理は範囲外とし、warm-up1回を破棄して3回を記録する。実行blockが計4回あることも検査する。

本文と検索索引・学習索引の非同期読込が完了した画面を確認するため、first frameだけの起動metricとは別である。UI自動操作・AX同期を含み、事前のパッケージ監査でファイルcacheも温まる。disk cold・初回インストール・Release・実機・CPU・メモリ・入力遅延・スクロール・画像decodeは測らず、参考値と製品SLOを混同しない。

## 出力と拒否

専用jobはcontents read、固定actions、新規runner、無署名で動く。機能UIはNativeReaderUITestsとPublishedReaderUITestsの10件を別jobで維持する。専用runner設定や独立件数が欠けたperformanceケースは失敗する。

exporterは実際の唯一のtest ID、一覧と詳細の実行結果、legacyの同じIDと型付きmeasurementを照合する。生CSVはtyped解釈より先に保存し、列や値を検証済みとは扱わない。型付きの3標本・unitを別根拠として保持し、欠測・非数・異なるIDをゼロで補わない。

最初のXcode16.4出力でClockの識別子・単位を確認して採択するまでは、標本を取得してもpendingと非ゼロ終了を使う。初回の実値を確定するには生出力の独立レビューと追加commitが必要である。未確認のmetricを実測成功へ変える定数は導入しない。

## 検証と残件

Swift単独型検査、workflowのactionlint・YAML・Bash・埋込Node、全target SDK compileを確認した。単体119件・機能UI10件・performance1件はコンパイル対象であり、ローカルで実行していない。独立レビューで見つかったexporterの出力ファイルsymlinkと入力衝突は、専用の新規出力directoryと排他的な一度だけの書込へ統一して修正した。catchでも再準備・上書きしない。確認済みのmodern Passedとlegacy Successの一致だけを受理する。旧版の破壊と修正版の入力bytes保持を私有fixtureで照合し、追加27件を含む共通check749件中734成功・15skip・失敗0を確認した。修正後の独立再レビューでも元の破壊条件で入力保持と27件成功を確認し、この2点を解消した。最終treeとHostedの確認は別に追跡する。

前提PR #258の検索中の操作メニューは、head a03901c0の全記事run40186338703でUI8成功・1失敗となり、別途画面の診断を続けている。今回の測定ケースを追加する前の失敗であり、機能UIの成功とは扱わない。既存のselector/assertionを削らず修正後に再検査する。

初回Hosted・実Clock型・単位・標本の採択、性能目標、実機等は未完了。通常UserDefaults・既存取り込み版・共有3/4記事の資産とユーザーのiPhoneは変更していない。新たな権限・秘密情報・有料サービス・契約や公開申請は含めない。[JSON](ios-published-readiness-observation.json)にsourceと検証の段階を保存する。
