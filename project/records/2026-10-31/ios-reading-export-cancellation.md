# 読書記録の書き出し取消後の保持を検査する候補

2026-10-31。自分用初版のIOS-22・25を進める独立したUI回帰候補である。採用済みmain `88c9ac3`の既存APIを照合し、書き出し取消の検査を進める。文字サイズの回帰検査PR #320は未完了の別単位として保持する。

以下の目的・検査範囲・容量事前停止は2026-10-31初稿時点の履歴である。PR321初回の実結果と検索終了の修正候補は末尾の追記で確認する。

## 目的と所有範囲

[既存の手動書き出し](../2026-10-28/ios-reading-backup-export.md)の公開操作を通し、取消後もTransformerのしおりと非先頭の読書位置を使えることを検査する。既存の復元picker取消とは別の経路である。

変更は[ReadingRecoveryUITests.swift](../../../ios/AILibraryUITests/ReadingRecoveryUITests.swift)の1ケースと専用helper、この記録・[検査範囲JSON](ios-reading-export-cancellation.json)、共有索引2本だけとする。元の4ケース・全helperは、追加部分を除けば全文が元に戻る。App、PBX、保存形式、DEBUG seed、workflow、Native基底helperと全記事は変更しない。

Rootは、main88のReadingRecoveryとNative基底APIだけで検査を構成できることを照合し、通常採用待ちだった別作業から切り離した。PR320の未公開App・ReaderReflow・workflow・helper・unit・記録を持ち込まない。main88のCore記録と既存索引本文も保持する。

## 公開UIの検査範囲

隔離suiteの部分復旧を起点に、Transformerのしおりと「自己注意の数式」の位置を用意する。「続きを読む」で現在位置を確認し、明示復旧を確定する。続いて「その他の操作」から書き出し画面を開き、取消で一覧に戻る操作を2回行う。同じsuiteでアプリを終了・再起動し、他記事や目次を挟まず「続きを読む」からしおりと見出しが完全に見えることを確認する。

保存画面は、開く前になかったnavigation barのidentifierとlabelの組、そこにある一意な保存・取消操作、一意な既定バックアップ名の編集欄を合わせて特定する。取消が有効で操作でき、各frameが有限・空でなく画面に収まることを条件にする。復元pickerの固有identifierを流用せず、不明な画面は失敗とする。保存操作・provider選択・保存先URLは実行しない。

`保存`／`Save`とファイル名による識別は、まだ実画面で受け入れていない候補である。最初の失敗時だけ写真と1 KiB以内の固定文脈を残す。文脈は理由・試行番号と判定中に得た件数に限定し、追加の階層取得は行わない。

## 検証と残件

コードはSource3の`80f822…`を保持し、その独立静的レビューはP1・P2とも0件だった。以前の9eca構成でのUI6型検査成功とSource5レビューは履歴に残し、今回のmain88構成の成功には転用しない。

今回のmain88向けSDK検査は、空き容量の事前条件で停止し、入力コピーもcompilerも開始していない。Rootが後で測った14:05 UTCの空きは552,894,464 byteで、既存の734,003,200 byte下限未満だった。これは事前条件判定そのものの瞬間の実測値ではない。ソース・型検査の失敗とは判定せず、現在構成のSDKは未確認とする。

新しいSource5の`npm run check`は未実行である。純粋な全tuple照合、追加部分の全文逆変換と既存APIの確認までを記録する。Rootは静的レビューと対象Markdown lint後にDraft checkpointを作成でき、通常mainへの反映前に正確なheadのHosted compile・Native8・完全な共通検査と必要CIを通す。現在構成のグラフ・記録の追補レビューも後続とする。

[Native CI](../../../.github/workflows/ios-native.yml)の既存クラス選択により、NativeReader3件とReadingRecovery5件の計8件を予定する。Fullの固定26件は変えない。実provider保存・外部ファイルの内容・UI越しのraw全byte同一性・最低iOS17と現行iOSでの新ケース・VoiceOver・実機・署名更新後の保持は未完了である。[完成計画](../../plans/engineering/ios-app-completion.md)の32行・完了14行とIOS-22・25未完了は維持する。

## PR321初回の実結果と検索終了の修正候補

2026-11-01追記。head `b4d5f049`の[初回Native CI](https://github.com/pero3dev/ai-agent-library/actions/runs/41210390667)では、単体278件中276成功・2skip・失敗0、UI8件中7成功・新ケース1失敗だった。新ケースは「その他の操作」を押す前の可視性待機で停止し、書き出し画面・取消・最後の再起動確認には到達していない。

保存した画面と階層では、前面の一覧navigation barに空の検索欄と「キャンセル」があり、「その他の操作」は存在しなかった。フィルターの解除はqueryを空にしても検索UI自体を終了しない。既存の復元picker試験は絞り込み中の一覧ボタンを使うため、未絞り込みのtoolbarを使う新ケースとは文脈が異なる。

修正候補は、新ケースの既存フィルター解除直後、「続きを読む」で位置を確認する前に、前面の一覧navigation barにある一意な検索欄と「キャンセル」を確認して取消を1回押す。操作は完全に見え、frameが有限・空でなくbar内に収まることを条件にする。取消が消え、既存の「その他の操作」が一意に操作できることを待って、元の復帰・明示復旧・書き出し取消の手順へ続ける。別のselectorへの代替・追加retry・App変更は行わない。

旧4ケースと全helperの元bytesを保持し、コードは`80f822…`から`5bb2f8…`への2挿入に限定する。Rootの全文照合でも、追加callと専用helper以外の既存部分が一致した。新しいhelperは既存の検索UIを終了するだけで、しおり・位置・保存画面の受入条件は変えない。

同じb4dのmacOS完全共通検査は1214件中1199成功・15skip・失敗0で、8コマンドが完走した。Full Aは18件成功したが、BはUI開始前の`simctl pbcopy`準備で停止しUI実行0件、コピー374BとReleaseは未実施だった。これらを新headの成功には読み替えない。

新コードのローカルSDK型検査・完全な共通検査・新UIは未実行である。容量下限未満で重い再実行をせず、最終独立レビュー後の新headでHosted compile・Native8・固定Full26・コピー／Releaseと必要CIを通してから通常mainへ進む。App0.2.28（30）、TODO32行・14完了、実provider保存・実機等の未完了は維持する。

## 546の再結果とメニュー待機条件の整合

2026-11-01追記。head `546dd69b`の[Native実行](https://github.com/pero3dev/ai-agent-library/actions/runs/41215473763)は単体278件中276成功・2skip・失敗0、UI8件中7成功・新ケース1失敗だった。検索「キャンセル」のtapは成功したが、その後のMore準備待機で停止し、書き出し画面には到達していない。

保存した画像には検索の取消がなく、通常の大きな一覧タイトルと右上のellipsis、復旧案内と「続きを読む」が見える。一方、保存された文脈はphaseだけで、AX frameの数値や複合判定のどの条件がfalseかは記録していない。全矩形のclipping・重なり・操作可否のいずれが原因かは確定しない。

候補は、新設したMore待機だけを既存の公開コントロール操作と同じ`isHittableOnScreen`の既定条件へ揃える。検索取消が消え、Moreが一意である条件を保ち、navigation controlへ追加したAX全矩形の包含条件を外す。保存位置の見出し完全表示・しおり・再起動復帰と厳密な保存画面条件は変更しない。

同じpredicate内で、取消件数・More件数・readyを元の短絡順にそれぞれ1回だけ読む。すでに得た値を固定文脈へ残し、実行しなかったgetterは`not-read`とする。追加のAX取得や失敗後の階層取得を行わず、既存1 KiBの文脈上限を保つ。

546のFull A18件・B8件の全26件と、コピー374Bの一致guard・Release監査は成功した。macOSの完全共通検査も1214件中1199成功・15skip・失敗0、8コマンド完走だった。外部からの再実行は行っていない。これらは546の履歴で、新しい待機条件のUI成功には転用しない。

新コードのSDK・完全共通検査・UIは未実行であり、独立した最終レビュー後、正確な新headのHosted compile・Native8・Full26と必要CIを通す。実際のfalse条件と新ケースの通過は未確認、実provider保存・実機等も未完了として残す。App0.2.28（30）とTODO32行・14完了を維持する。

## 884の再結果と検索終了の目的に絞る候補

2026-11-01追記。head `884fb38e`の[Native実行](https://github.com/pero3dev/ai-agent-library/actions/runs/41221360266)は単体278件中276成功・2skip・失敗0、UI8件中旧7成功・新ケース1失敗だった。検索「キャンセル」のtap後、早い段階のMore準備待機で停止した。直後の「続きを読む」・明示復旧・実際の書き出し導線には未到達である。保存したrawには複合判定の値やAX座標がなく、どの条件がfalseだったかは未確定とする。この追記のために大きなartifactを取得しない。

検索終了helperの目的は、保存位置を「続きを読む」で確認する前に検索を閉じることである。そこから本文へ移り、一覧へ戻って明示復旧してから書き出すため、書き出し用のMoreをこの早い段階の前提にする必要はない。`LibraryView`のtoolbar Menuは絞り込みがないときに置かれ、loadingや同梱版処理中は無効になる。復旧通知はMenuの条件に含まれず、書き出し操作そのものは保存停止中に無効になる。これらの静的条件から884の失敗原因は断定しない。

今回の候補は、前面navigation barの一意な検索欄・取消の完全表示、有限かつbar内のframe、一度だけの取消tapを保つ。その後は同じ15秒枠で、その取消が0件になることだけを待つ。predicateで得た取消件数を固定文脈へ記録し、Moreへの先回りした件数・操作可否の取得を除く。追加AX・座標操作・selectorの代替・retry・App変更は行わず、既存1 KiBの文脈上限を維持する。

直後の既存`liveResume.requireHittable`が公開一覧の操作を検証し、本文・しおり・非先頭見出しの完全表示を確認する。明示復旧後は、実際に書き出す時点の元のMore操作判定、export選択、厳密な新保存画面の識別、2回の取消と一覧復帰をそのまま実行する。同じ隔離suiteの再起動後も「続きを読む」からしおりと見出しを確認する。書き出しの受入条件は変更せず、不要だった早期の前提だけを除く。

884のNative結果は履歴であり、新候補の成功には転用しない。旧記録を保持し、今回のローカルSDK・完全共通検査・実UIは容量事情により未実施とする。最終独立レビュー後、正確な新headのHosted compile・Native8・Full26・コピー／Releaseと必要CIを通して通常mainへ進む。原因の確定、新ケースの通過、実provider保存・実機等は未完了で、App0.2.28（30）とTODO32行・14完了を維持する。

## 6dの実際の書き出し入口での停止と絞り込み画面からの検査

2026-11-01追記。head `6d32f7c8`の[Native実行](https://github.com/pero3dev/ai-agent-library/actions/runs/41225191142)は、単体278件中276成功・2skip・失敗0、UI8件中旧7成功・新ケース1失敗だった。今回は検索取消の準備と「続きを読む」によるしおり・非先頭位置の確認、一覧への戻り、明示復旧までを通過した。実際の書き出しhelperが通常一覧の「その他の操作」を操作可能と判定できず、保存画面には到達していない。

失敗後に順に得たgeometry記録では、対象は存在し、frameは画面内の`x=343, y≈58.67, 34×34`、geometryはvisibleだったが、`isHittable`はfalseだった。`fullyVisible=false`は当該helperのオプションであり、完全表示の成功結果ではない。各待機pollの値、enabled、一致件数、当該headの写真・階層はここでは未確認で、製品不具合やOS原因を確定しない。通常一覧のtoolbar Menu経路は未解決事項として残す。

`LibraryView`は、絞り込みがない通常一覧ではtoolbar Menu、絞り込み中にはリスト本文のButtonから、同じ`moreActions`の公開操作を提供する。本文Buttonは「その他の操作」sheetを開き、書き出し選択後はsheetのdismissから同じ書き出し処理へ渡る。既存のPublished試験がこのsheet経路を扱い、同じ6dの復元取消ケースも検索を残した本文Buttonを17:57:23に操作して成功した。これは通常toolbar経路の成功を意味しない。

今回の候補は、新ケースで明示復旧を確認した後に、公開検索へ`Transformer`を一度だけ入力する。記事や目次は開かない。検索値と「検索: Transformer」の表示を確認し、その表示を含む一意なcollection内の、一意・有効・画面内で操作可能な「その他の操作」Buttonだけを1回押す。正確なsheet名と一意・有効な書き出し操作を確認してから、元の厳密な新保存画面の識別へ続ける。別selector・座標操作・retryで失敗したtoolbarへ代替する方式ではなく、最初からこの正式な絞り込み画面の経路を検査する。

検索準備は2回の取消loopの前に一度だけ行う。各取消では、元の保存画面・取消・ファイル名の消失と記事数の操作可能性に加え、同じ検索値と絞り込み表示への復帰を確認する。旧4ケースと既存helper、取消前の公開「続きを読む」、新保存context・既定名・Save/Cancelの組とframe条件、2回の取消、同じ隔離suiteの再起動後のしおりと非先頭見出しの完全表示は保持する。Save・provider・保存先URLは実行しない。

6dのFull Bは本文UI前の`simctl pbcopy`がAppleの`NSPOSIXErrorDomain` code60のtimeoutで停止し、UI0件、374Bの実コピーとReleaseは未到達だった。外部の再実行要求1回は全体runの進行中を理由に403で拒否され、受理された再実行は0回である。Full Aはこの候補作成時点で継続中とし、未封印の結果を採用しない。6dの必須11検査と本文更新後のpolicy2、SDK26 Archive、Runtime26の代表3件と復旧用CIの成功は、そのheadだけの履歴であり、新候補の受入には転用しない。

作者による確認はPythonの単一差分・全文逆変換と旧4ケース／既存helper／厳密picker部分のbytes一致までで、Node・SDK・実UI・Git/API操作は実施していない。Rootは別commitの小さい失敗診断を同じPRへ組み合わせる予定で、そのCode4と37件の模擬試験・ローカル保存データでの診断確認は別の記録に分ける。両方を組み合わせた新headのHosted compile・完全共通検査・Native8・固定Full26・実コピー374B／Releaseと必要CI、最終独立レビュー・通常mainは未確認である。実provider保存・外部ファイルの内容・UI越しのraw全byte一致・実機・VoiceOver等も未完了とし、App0.2.28（30）、IOS-22・25未完了、TODO32行・14完了を維持する。

## 9310の実保存画面と、一度だけのブラウズ戻りを検査する候補

2026-11-01追記。head `9310d3f2`の[Native実行](https://github.com/pero3dev/ai-agent-library/actions/runs/41229913980)では、単体278件中276成功・2skip・失敗0、UI8件中旧7成功・新ケース1失敗だった。絞り込み本文の「その他の操作」と書き出し選択は通過し、最初の書き出し画面には到達した。失敗文脈は`attempt=1`と`usableFilenameCount=0`で、1回目の取消前に停止した。2回の取消と取消後の再起動は未到達である。

保存した画像には、タイトル「このiPhone内」、左上の「ブラウズ」、右上の「移動」と、下部の正確な`AI-Agent-Library-Reading-Backup`が見える。このフォルダー画面には「キャンセル」は見えていない。画像だけではfilenameのAX型・編集可否・操作可否や、1回戻った後のCancelの出現を確定できない。従来の「編集欄が一意でhittable」「Saveがある」という候補条件はこの実画面を受け入れておらず、成功条件に読み替えない。

今回の候補は、開く前になかった一意なnavigation contextと、そのbar内の「移動」／`Move`を実行しない識別材料にする。正確なfilenameは、同じ新barを含む一意なwindow内に限り、TextField・TextView・StaticText・Otherの正確なlabelまたは文字列valueとして確認する。検索結果は最大16件、有限で画面とwindowに収まりbarより下にある表示だけを認める。同じ物理frameの入れ子表示は明示的に重複を数え直し、異なるframeは最大8種とする。複数表示から任意の1要素を選んで実行せず、filenameの編集・tap・hittabilityは要求しない。

新contextに、一意で有効かつ操作可能な「キャンセル」／`Cancel`があり、ブラウズ戻りがなければ、その取消だけを押す。Cancelがなく、一意で有効かつ操作可能な「ブラウズ」／`Browse`の戻りだけがある場合は、一度だけ押す。これは既存の戻り操作であり、provider・フォルダー・保存先を選ばない。その後は同じ識別材料を持つ取消contextを実際に確認できるまで待ち、Cancelが現れなければ失敗する。2回目の書き出しが最初から取消を持つ画面に戻った場合も、同じ全条件を満たした場合に限る。

書き出しtap前にmonotonic clockの期限を一度だけ30秒後へ設定する。最初の表示待機、必要な一度のブラウズ戻り、取消表示待機と各tap直前の全witness再確認は、その残り時間を共有する。待ち直すために30秒を加算しない。既存の本文More15秒、正確なsheet／export10秒、取消後の一覧復帰15秒、2回取消と同じsuiteでの再起動・公開「続きを読む」・しおり・非先頭見出しの完全表示を保つ。旧4ケース・新ケース本体・検索終了・公開復帰・明示復旧と無関係なhelperは変更しない。

失敗した場合だけ、既存の画像と1 KiB以内の固定文脈に加え、`Reading-export-cancel-hierarchy`という名前で一度だけ階層を取得する。空でないUTF-8全文が131,072 byte以内のときだけ同名で保持する。上限超過や空の場合は、別名の`Reading-export-cancel-hierarchy-omitted`に短い`OMITTED`記録を残し、途中で切ったものを完全な階層と扱わない。階層取得をpredicateや通常経路へ追加しない。別担当の診断コードは、この任意添付とmetadataの上限を別差分で扱う。

9310の既存小診断は、実summaryの21,269 nodeが旧20,000上限を超え、`metadata_tree_limit`で停止した。これは制限による停止であり、小診断の成功ではない。Rootは大きなZIPを保存せず、全体SHAと選択memberのCRC・SHAを検証して画像・文脈・summaryを取得した。実画像で確認した表示と、まだ観測していないAX構造・戻り後の画面を区別する。

9310のFull Bは8件・374Bの実一致・Release監査（199記事、音声1、検証625ファイル、テストcontentなし）を成功した。一方、Full Aは単体開始前の準備がexit70で停止し、UI0件、完全共通検査は1251件を対象に完走した。Runtime26の代表3件・復旧用CI・SDK Archiveも9310で成功した。受理された外部再実行は0回であり、新しいsourceが必要なためAの再実行は行わない。これらの別区画の結果を、書き出し取消や新候補の成功に転用しない。

作者による検査はPythonの全文正逆変換、旧4ケースと新ケース本体・無関係helperのbyte一致、入力画像・文脈・summaryのhash確認までである。Node・SDK・UI・Simulator・書き出し・Git/APIは実行していない。新UIと別担当の診断コード・記録を結合した最終内容の独立レビュー、Hosted compile・Native8・固定Full26・完全共通検査・コピー／Releaseと必要CI、通常mainは未確認とする。実provider保存・外部ファイルの内容・実機・VoiceOver等も未完了で、App0.2.28（30）・IOS-22／25未完了・TODO32行14完了を維持する。

## 677の実階層を踏まえた保存先barの直接識別候補

2026-11-01追記。head `6777328b`の[Native実行](https://github.com/pero3dev/ai-agent-library/actions/runs/41240271170)は、単体278件中276成功・2skip・失敗0、UI8件中旧7成功・新しい書き出し取消ケース1失敗だった。失敗は最初の書き出し後、picker識別前で、`attempt=1`のまま停止した。2回の取消と取消後の再起動には未到達であり、旧7件の成功を新ケースの受入には転用しない。

同じheadの小診断は初めて実Hostedで`collected`、`incomplete_reason=null`となり、画像・文脈・任意階層の3添付を保存した。Rootは87,188 byteのcompact ZIPの全体SHAと選択ファイルを照合した。画像122,951 byte、文脈182 byte、階層16,510 byteをこの候補の作者もデータとして読み、画像を表示して確認した。これが取消試験の成功や、別の新候補のHosted成功を意味するわけではない。

階層には、一つのMain window内にidentifierが`FullDocumentManagerViewControllerNavigationBar`のbarがあり、有限なframeは`0,69,393,108`、左の「ブラウズ」は`0,75,94,44`、右の「移動」は`345,75,40,44`だった。背景の検索navigationには別の「キャンセル」が残っているため、アプリ全体のCancelは識別にも操作にも使わない。下部にはTextField `65,764,312,42`が見えるが、階層のvalue表示は`AI-Agent-Library-R...`に省略されていた。画像には正確な`AI-Agent-Library-Reading-Backup`が見える一方、実際のAX full valueは未観測として扱い、候補のexact label/value条件を通過済みにはしない。戻り後のCancelも未観測である。

保存した文脈は`phase=filtered-library; searchCount=1; libraryCount=1`のままだった。Rootが読んだ別のraw logでは、export tap後に一般bar列挙のindex0を通り、index1へのexistsが反復して、次のdestination guardの記録には到達していなかった。この参照方法で進行しなかった原因は仮説にとどめ、通常toolbarやOS・製品の原因を確定しない。既存の復元取消ケースが同じ固定identifierの直接queryを使って成功した事実を参考に、今回のexport専用helperも、その観測済みIDへ直接matchingする。無関係なnavigation barの`allElementsBoundByIndex`列挙を取り除き、開く前は固定IDが0件であること、開いた後は同IDが一意で存在することを要求する。window内の再確認も固定IDをselectorに使う。階層にはbarのlabel属性が表示されておらず、空labelとの一致は要求せず、読んだlabelはidentifierと合わせて直前再確認用のcontextKeyを比較するだけに使う。

barを含むwindowは一つに限定し、有限で画面内のframe、同bar内のMove、CancelとBrowse戻りの排他的な件数、有効で操作可能な実行対象、barより下の正確なfilename読取witnessを従来どおり全て確認する。Moveとfilenameは操作しない。Browse戻りは最大1回、戻った後のCancelは実際に確認できなければ停止する。識別・戻り・取消直前の全条件再確認は一つの30秒期限を共有する。旧5ケース本体、取消前のliveResume、無関係helper、本文More15秒・export10秒・一覧復帰15秒、2回取消、検索維持、同suite再起動後の公開「続きを読む」・しおり・非先頭見出しの完全表示は変更しない。

次の停止位置を区別するため、各queryやguardの直前・件数取得後に短いphaseと`directBarCount`・必要な件数だけを既存1 KiB文脈へ記録する。filenameのexact件数が0の場合も、その段階を残す。失敗時だけの階層一度・UTF-8全文131,072 byte以下・上限超過時の別名OMITTEDという制限は維持する。新しい待機、provider選択、座標、任意のfirstMatch、保存・移動・filename操作、記事や目次への追加遷移はない。

作者が実施した確認は入力SHA、Pythonによる全文逆変換、旧5ケースと無関係helperのbyte一致、2索引の一段落置換と全逆変換である。新しいNode・SDK・Git/API・Simulator・UI・書き出しは実行していない。677のFull A/Bの終端結果は別途収録中で、新sourceの成功には転用しない。独立レビュー・結合後の新headのHosted compile、Native8・固定Full26・完全共通検査・実コピー／Release・必要CIと通常mainは未受入とする。実provider保存・外部ファイル内容・実機・VoiceOver等、IOS-22／25、TODO32行14完了は引き続き未完了、App0.2.28（30）は不変である。
