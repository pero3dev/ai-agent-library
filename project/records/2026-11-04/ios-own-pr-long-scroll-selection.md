# 自分のPRで長文スクロールClockを選ぶCI候補

2026-11-04、共通検査前の作成時点を保存する準備記録。IOS-15の既存長文ケースを、自リポジトリのPRで観測する選択規則を追加する。ユーザーのTODO優先順での自律作業・通常CIの許可を受け、Rootが今回の計画として採用した。旧[長文スクロールClock記録](../2026-10-30/ios-long-scroll-clock.md)にある「自動は起動だけ」の制限は、その提出時点の範囲として残す。旧記録の本文・観測値は変更しない。

## 選択するケース

| 既存イベント | 選択 |
| --- | --- |
| PRのheadリポジトリが現在のリポジトリと同じ | `long-article-bounded-scroll` |
| forkからのPR | `launch-to-published-readiness` |
| mainへのpush | `launch-to-published-readiness` |
| 手動 | 既存の起動・検索・長文の3選択肢 |

既存の選択stepにevent名、現在とheadのリポジトリ名、手動入力を環境変数として渡す。シェルは許可済みeventとリポジトリ名の形式を確認し、固定文字列からケースを決める。未知event・未知の手動選択・必要なメタデータの欠落は、`GITHUB_ENV`へ追記する前に失敗する。自動イベントでは手動入力を使わない。concurrencyの末尾と説明文も同じ選択へ合わせる。

変更はworkflowと既存Node単体試験の2ファイル。既存event・3つのpath filter・権限・macOS 15・Xcode 16.4・40分上限を保つ。Clockのwarm-up 1回＋記録3回、完全protocol内の4 invocations、typed Clock3値とCSV、固定Swift／記事のhash結合・最大16回の縦drag・全assertもそのままとする。workflowを含まない文書変更だけでは、既存filterを満たさない。

## 確認した範囲

実main`0885ae04f11445874738a0cc769bdf86e6d57355`／tree`98e9b49efd85f26ea91ff41599205ab553a0dad5`の3033ファイルから作った私有コピーで、固定Node 24.22.1による既存試験1ファイルを1回実行し、**62件すべて成功**・失敗／skip／cancelled 0、14.475秒・exit 0だった。追加の4試験は本番YAMLから実際の選択シェルを取り出し、自分のPR／fork／push／手動3選択・未知値・改行／コマンド置換文字列と、失敗時に既存の出力を変えないことを検査する。選択規則のJavaScript複製は作っていない。

この試験は既存exporterの合成データと所有mockを含む。実Xcode・Simulator・GitHub API・通信・インストール・dispatchは実行していない。3033入力とmanaged main、Originalの110変更、Content626の保全検査は前後一致し、所有process groupは回収・不在を確認した。workflowは5箇所の置換以外が一致し、既存単体試験52786バイトをprefixとして保持する。識別hashと上限は[JSON](ios-own-pr-long-scroll-selection.json)に残す。

## 未完了と次の区切り

この記録の作成時点では、最新mainへの結合、最終成果物の独立レビュー・共通検査、通常PR・必要CI・main統合は後続である。新headのHosted長文測定・実4 invocations・Clock3値／CSVは未実施。既存の名前付きSimulator destinationを使うだけで、専用UUIDの作成・所有・cleanupは実装していない。

ClockはUI操作・待機・AX確認を含む観測で、FPS・フレーム時間や純粋な描画性能ではない。性能予算・合格閾値・改善効果・安定性を採択せず、IOS-15全体と実機確認は未完了のまま残す。SDK／実機や他のTODOへ単体試験結果を転用しない。
