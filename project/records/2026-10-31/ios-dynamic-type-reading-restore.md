# 文字サイズ変更後の読書位置復帰のUI回帰

## 目的と範囲

IOS-11・25の未確認部分である、文字サイズを変えて再起動した後の読書位置としおりを、専用の1ケースで検査する候補です。本文には既に文字サイズをレイアウト識別へ含める実装があり、欠陥とは断定しません。

実main `7c1ec1d7319eade2209d8a28fbcdf94661759d7c` を基底とし、App0.2.28（30）・PBX・本文・保存形式を保ちます。既存の回転試験と新しい文字サイズ試験を、それぞれ別workflowの厳密な1ケースとして実行します。

## 変更内容

DEBUGかつ正規のUUID隔離suiteでだけ、固定値 `default`（large）と `accessibility5` を指定できます。未知の値・不正suite・通常起動では上書きせず、Releaseにはこの入口を含めません。システム設定や利用者の通常の読書記録を変更する機能ではありません。

専用記事の40行表を使い、通常文字でR25付近としおりを保存し、同じ隔離suiteで最大文字へ再起動します。「続きを読む」の直後に補正スクロールをせず、R25の可視性・隣接行・先頭行・しおりを検査します。実際の行高が1.25倍を超えることを確認し、さらに通常文字へ再起動して行高と位置の復帰を検査します。

既存の回転ケース・補助処理・実行selector・strict1・全上限は保ちます。そのworkflowのsource inventoryへ新method名とAppのhashを加え、新しいworkflowは新methodだけを選びます。job43分・明示工程合計42分・UI420秒と所有領域のcleanupを維持します。

## 検証状況

- Source4の独立静的レビューはP1・P2とも0件でした。DEBUGを除いたAppのtoken構造と旧回転処理の保持を確認しました。
- Node24.22.1で2つのworkflowをYAMLとして読み、抽出したdriverの構文検査が成功しました。driver本体は実行していません。Actionlintの実行とは区別します。
- 既存のiOS18.2 Simulator SDK・iOS17 targetで、候補を含むApp17ファイルのDEBUG module生成、Releaseの型検査、UI6ファイルのDEBUG型検査が成功しました。
- 最初の単独UI型検査は、検査コマンドのXCTest Swift overlay検索パス不足で失敗しました。同じソースへ正しい検索パスを与えた再検査が成功しており、ソースを修正して解消した結果ではありません。
- ローカルの共通検査は1206件中1192成功・14skip・失敗0で、全8工程が成功しました。最終8ファイル結合の独立レビュー・Hostedの新旧strict1・通常CI・main採用は未完了です。実UIにおける行高の閾値、最大文字時の到着、420秒以内の完了は未確認です。

## Gitで区切る単位と終了条件

1. DEBUG入口・UI1ケース・既存workflowのinventory同期・専用workflowの4ファイルを1コミットにします。
2. この記録2ファイルと計画・索引の同期を別コミットにし、8ファイルを結合したレビューと共通検査を行います。
3. Draft PRで現headの新文字サイズ1ケース・旧回転1ケースと必要CIを確認します。実行数や判定を緩めて成功にはしません。
4. 最終本文・ポリシー検査を揃えて通常保護でmainへ統合し、実mainの全ファイル・squash本文と反映後CIを別に確認します。

## 残件

この試験はApp内のDEBUG文字サイズ指定と再起動の組合せです。実システム設定の変更、実行中の文字サイズ変更、VoiceOver・実機の受入には広げません。実機確認はユーザーの指定に従い未完了としてスキップします。IOS-11・25全体とTODO32行・完了14行を維持します。

## PR #320の実行履歴とサイズwitnessの訂正候補

上の検証状況と「行高」の記述は、初回Source8（head `81b3051bfbede86fca6954643cc8afc8078249cc`）を準備した時点の履歴です。初回の新文字サイズ・旧回転workflowは、いずれもinventoryのruntimes取得が `spawnSync xcrun ETIMEDOUT` となり、UIには到達しませんでした。条件を変えない各1回の再試行を元の失敗と分けて保持します。旧回転の再試行は実1ケースが成功し、raw184.094950914秒・console184.095秒と所有Simulatorのcleanupを独立照合しました。

[新文字サイズの再試行](https://github.com/pero3dev/ai-agent-library/actions/runs/41192344167/attempts/2)は、inventory・生成・所有Simulator・buildを通過しましたが、実1ケース162.295秒の `XCTAssertGreaterThan` だけで失敗しました。`accessibility5` 指定後のR25可視性・しおり・offset検査までは進み、通常文字へ戻る工程には未到達です。観測したStaticTextの高さは66.833335876で、比較した通常値の1.25倍は83.541669846でした。この値だけからfontの伝播失敗や本文の不具合とは断定しません。

`requireRowWitness` の `rowHeight` は先頭StaticTextの高さで、GridRow全体の高さではありません。文字サイズと一緒にcolumn幅も変わるため、折返しが変化するとこの高さが同じでも行間隔の増大を否定できません。今回の候補はサイズwitnessだけを、同列のR24とR25の `minY` 差へ変更します。両frameの全座標・幅高が有限で幅高が正であること、差が有限かつ正であることを要求し、画面外のzero frameを成長として採用しません。

旧回転method・既存helper・R25/R24/R01の可視性・しおり・offsetの判定、続きを読む後の補正gestureなしを保持します。1.25倍超と通常復帰の±1ptも緩めません。AppのDEBUG入口、2つのworkflow・strict1・全上限、本文・保存形式・Core4・PBXは変更しません。

このstride候補は静的な修正案で、SDK型検査・実stride・新headのUIとCI・通常main反映は未実施です。font伝播の成否は未確定で、strideも変わらない場合は別のDEBUG診断で切り分けます。production fontの修正や閾値緩和を先に行うものではありません。IOS-11・25全体とTODO32行・完了14行、実システム設定・VoiceOver・実機の未完了を維持します。

## 実base88への結合と新SDK確認

この追加候補は実Core main `88c9ac391459ead50cf5e28b25918f97ac9332cf` を基底へ取り込みます。初回Source8とstride準備時点の未実施は上の履歴に残します。新UI source SHA-256 `1bb98ec07b5da8d1bc65ad845e6a26492ef19f9527e877c9c135d0de3dc2ea3a` を含むUI6は、iOS Simulator18.2 SDK・arm64 iOS17・Swift5/targetedで別途型検査し、exit0・8.207036916秒・log0Bでした。Appのf4e9と既存App17 DEBUG module／Release型検査の成功は同bytesの先行結果であり、新しいApp実行ではありません。

新stride値・font伝播・通常文字への復帰、新headの実UIとCI・通常mainは未受入です。この準備は旧回転1件成功を新stride成功へ転用せず、コードや閾値をこれ以上変えません。提出parentと3つのcommitは未発行で、実base88だけを確定事項として記録します。

## head9eca95のUI未到達と一覧読取の限定補修

実parentは `9eca95f3fe571291999803424e724bd733583db2`（tree `16b2cbb6d714edde5ee50e92b35b2f2e5ac29421`、全2853 tuple）である。上のSource10結合前・公開前の記述は履歴として残す。Rootの発行済み3commitの全tuple・parent・全文message照合を受領し、既存公開履歴を保ったまま同じPR #320 branchへ通常追加2commitを準備する。

新文字サイズの初回job124533194196はruntimes一覧のETIMEDOUTでUI0だった。条件不変のretry2 job124534083344もUI0で、bootstatusはexit0だったが、devices-after-boot一覧が30,000msでETIMEDOUT・SIGKILL・exit nullとなった。stage上限180,000msに対し、読取開始時のremainingは106,796ms、stdout/stderrは0Bだった。build・UIは未到達で、新stride・font伝播・通常文字への復帰を受け入れない。初回raw SHA先頭b442とretry先頭952eを別履歴として保持する。

旧回転の初回job124533194157とretry2 job124534355007はいずれもruntimes一覧のETIMEDOUTでUI0（raw SHA先頭e21f／ad1b）。同headの3回目の再試行は行わない。published FullB初回job124533194276はdevices-ready一覧の90秒timeoutで、実UI・xcode8件・copy・Releaseへ未到達だった。12:51:20Zの全終端観測ではrequired11と本文後policy2が成功し、全19checkは16成功・3失敗だった。Nativeは278 executed／2skip／失敗0・UI7、FullAは278 executed／2skip・UI18・共通1214件中1199成功15skip、Runtime26は実3件が成功した。Recoveryのcontrolled F/R gateとSDK26 Archiveのmetadata成功も別範囲で保持する。FullBのUI0・copy/Release未到達と新旧専用UI0は残り、head9eca全体は未受入である。観測result SHA-256は `6b942d914fa050276d6d60398dc02494b49a9bcc8402e614bdc10c09fb0cbf66`。

補修は専用2workflow、`ios/tests/simctl-inventory-read.mjs`、`tests/unit/ios-simctl-inventory-read.test.mjs` の4入力に限定する。runtimes／device-types／devices-before-create／devices-after-bootの固定readだけで、ETIMEDOUT・SIGKILL・exit nullが一致した時に1回だけ同じreadを再実行する。初回とtimeout-retry-1のreceiptを分け、成功票のsource/read/args/name/rawSHA・success receipt・intentのcap/stageを照合する。owned監査は受入れたrawを再検証し、retryには初回timeoutの連鎖も要求して、preexisting UUIDの除外と独立UUID照合を保持する。共通run全文・各read30秒・stage90/180秒・step/job上限・source・JSON/version/UUID・cleanupを保つ。UI selector・strict1・新旧UI method・App・本文・保存形式・PBX・版とFull workflowを保持する。

Rootが固定revision2 Source4で実行したfixtureは24件成功・skip/fail0、0.4915975秒で、actual production関数とfake files/clock/spawnだけの検査だった。2YAMLは重複key拒否を含むparse、抽出driver2はNode構文exit0で、両job43分を確認した。Source4 manifest SHA-256は `76264915d989182cf70e087c62a2f53c5c76e3f0f34ec88f561d17638c2613ad`、Root検査manifestは `4dd9d3e48c3756def3a27bb0696a61736c7160522cf9082b8ea61e62532ced1d`。実driver・Simulator・SDK・actionlint/shellcheckは実行していない。新共通検査・全12入力の最終レビュー・新head strict1・通常mainは未受入である。先行Reader1bbを含むUI6のSDK型検査とAppf4の同bytes先行型検査だけを引き継ぎ、一覧retry・実stride・font伝播・default復帰の成功へ転用しない。IOS-11・25全体、実システム設定・live変更・VoiceOver・実機とTODO32行／14完了を維持する。
