# iOS17試行の最初の資源違反を記録する候補

2026-10-29。自分用iOSアプリを優先度順に自律実装し、通常のcommit・PR・main統合へ進める依頼に基づく観測改善である。実機操作は未完了として進めてよいという許可を引き継ぐ。所有範囲はdriverとNode検査、本記録2本、索引と完成計画の6ファイル。新しい契約・課金・配布やローカルOS導入は含めない。[取得進捗の記録](ios17-download-progress-capture.md)を準備時点の履歴として保持し、全体の未完了は[完成計画](../../plans/engineering/ios-app-completion.md)で追跡する。

## 実行で確認した停止

PR #301の作者head `a03216f5e7328fface25176d81a30943d10e5277`に対応する[初回run 40882113542](https://github.com/pero3dev/ai-agent-library/actions/runs/40882113542/attempts/1)／job `123476063965`では、downloadがexit 0となった。受信3,721,934 byteから既知の連続進捗47,094本／3,197,350 byteを除き、524,584 byteを保持した。間引きがあるため`captured_output_complete=false`である。rawは旧4MiB未満で、このrunからraw64MiBの必要性・十分性や旧収集方式なら失敗したことを証明しない。

取得後に利用可能なexact17.0が見つかり、明示importのplanはfalse・実行receiptは0本だった。pretestの17.0／21A328は一意で、Bootedとcase-contractの期待集合47件まで進んだ。これは以前のruntime曖昧さの原因を確定する証拠ではない。

続くfunctional buildは開始14.110秒で、monitorの最初の停止理由`resource-floor-or-cap`によりSIGKILLとなった。exit codeとspawn errorはnull、resource failureはtrue、機能受入はfalse、所有deviceは削除済みである。保存済みstdout 3,696 byteとstderr 401 byteの全captured prefixを独立に復元・hash照合した範囲で、Test Caseの開始／成功は見えない。絶対にcaseが動かなかったと断定せず、実47件の成功は未受入とする。

停止時のfree／owned値は保存されておらず、空き容量2GiB未満と所有領域14GiB超のどちらだったかは不明である。初期free46,482,849,792 byteを停止時の値へ読み替えない。FS例外は別の`resource-observation-failed`となるため今回の最初の理由ではなく、後続例外までなかったとは断定しない。既存owned走査はsymlinkを0としてskipし、非atomicな論理サイズを数える。symlink拒否、初回待機、DerivedDataの変化等を原因として確定しない。

初回実行証跡の独立レビューはP1／P2なしだったが、判定対象は証跡の解釈だけである。実装候補の承認・47件・Ready・統合の受入へは転用しない。取得元・digestと復元の手掛かりは[機械可読記録](ios17-resource-threshold-observation.json)に残す。

## 追加する観測

対象は既存2秒間隔のmonitorだけである。freeを1回読み、厳密な`free < 2GiB`ならownedを測らず停止する。そうでなければ既存owned走査を1回行い、厳密な`owned > 14GiB`で停止する。比較順・短絡と等号境界を保ち、違反後のstatfsや再走査を追加しない。pre-spawnとpost-commandの資源判定は全byte保持し、このreceiptの対象に広げない。

元のkill requestを先に行い、その後に最初のmonitor失敗だけをcommand exitのnullable `resource_observation`へ載せる。command・stage・phase・同commandの経過時間、観測済みfreeと下限、ownedと上限、違反側を記録する。probe例外は元の分類と停止名を保ったまま、失敗probeと短いerror codeを記録する。値が未実行ならnull／not-completed、非finiteならnull／not-finite-numberとし、0を不明値に流用しない。elapsedはkill request後に読む経過時間である。

resourceの最初の観測を後の違反で置き換えず、記録構築が利用不能でも後の値を最初と偽らない。通常時の欄はnullで、nullはmonitorの最初の観測が保持されていないことだけを表す。健康だったことやresource_failure=falseの証拠にはならず、pre/postの失敗値も対象外である。固定schema・短いlabelにより、新しいresource_observation部分だけを2KiB以内に収める。独立レビューの保守的な算定はnested indent込み1,753 byteであり、既存exit receipt全体の上限を2KiBとする意味ではない。error message・個別path・per-tick履歴・ファイル一覧は保存しない。値は非atomicな論理容量であり、物理割当や同時点の全容量を保証しない。

resource failure Boolean・最初のstop・cancelとsignalの優先・所有process group kill・cleanup bypassと削除を保つ。free2GiB／owned14GiB、download10分・work19分・cleanup最大2分、download raw64MiB／他command raw4MiB・合計保持4MiB、証拠1file512KiB／全体2MiB／最終reserve64KiBを変えない。OS選択・runtime重複拒否・条件付きimport・限定postboot回復・47件の判定・NativeUI／providerにも変更を加えない。DerivedDataを所有領域から除外しない。

## 確認した範囲と残件

凍結Source2は旧37検査の全文をprefixとして保持し、12件を追加した。production evaluatorと所有Node subprocess fixtureを使う49件がすべて成功（exit 0、wall2.675秒）、構文2fileもexit 0である。閾値の境界・短絡、probe例外の同一性、未計測null、最初の観測の固定、観測部分の2KiB上限、cleanup、kill-before-latchとcancel優先を確認した。helper・monitor接続・poll callback・receipt欄の4箇所を逆変換すると作者baseのdriver全byteへ一致する。本記録の準備では成功済みNodeを再実行していない。

Source2の独立レビューは準備中にP1／P2なしで受入れられた。共通検査と最終6ファイルのレビュー、新headでの実監視値・機能47件と必要CIは後続である。新receiptが次のCIで原因を特定できたことや、容量上限が十分だったことを先取りしない。

既存A032の凍結checkpointはSource7系統がAPI成功5・失敗2（Pilot／Runtime26）、既知required11が成功11だった。Draftと機能受入保留を維持し、この11成功だけでは採用しない。Runtime26の失敗した待機は1 pollでfalseとなり、期限後の逐次geometryがpositiveでも待機成功へ置き換えない。これは別の未完了事項であり、本候補はそのSource・timeout・predicateに触れない。

App0.2.23（25）、TODO32行／完了13行と全row、既存のNative復旧記録を保持する。最低OS全体・実機上書き／保存維持・VoiceOver・性能等は未完了で、過去版の実機成功を転用しない。別作業のFull単体失敗時inventory診断は本候補へ含めない。

## コミットと通常統合の区切り

作者base A032／tree `146a7687dd2374fb6adcb6a53dc3ef84a45fc6ef`の2,814パスへ、既存4ファイルの変更と新記録2本を重ねる準備である。A032をmain採用済みとは扱わず、既に採用したmainの履歴やNative復旧の記録は全byte保持する。最終のmain・対象blob・全treeはRootが提出前に再照合する。

Source2と記録を1作業単位として凍結し、共通検査・独立レビュー後に追加commitを作る。既存[Draft PR #301](https://github.com/pero3dev/ai-agent-library/pull/301)（`codex/ios17-functional-pilot` → `main`）を継続し、正確な新headの7系統と必要な実行証跡を確認する。Ready後の最新必須11検査・最終metadataと通常保護によるmain統合、反映後のCIは別の到達点として記録する。既知の旧成功を新headへ転用せず、検査を迂回しない。この私有準備ではGit・GitHub・CI・SDK・runtime・実機の操作を行っていない。
