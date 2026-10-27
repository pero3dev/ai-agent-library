# Dedicated UIのdestination artifact実行候補

記録日: 2026-10-28。親headとSource3の作成・観測は2026-10-27のsnapshotとして保持します。

Dedicated UI試験で、復元後のAppが現在のinstalled Appと異なる`Dead` bundleを参照する現象を観測しました。明示installしたAppとrunnerを実行対象にするDriver候補を準備しています。候補の36件のNode単体試験とDriver構文検査は成功していますが、候補を使ったSDK・install・実UI・新CIは未実施です。新PR番号・実mainとの結合・採用は未確定です。機械可読な値は[対応するJSON](ios-destination-artifacts-ui.json)で確認できます。

## 目的と準備時点

起点は親head `89a32389678d5b752f5b550553b42f32274c6fcc`、tree `a1487b7072d090ba25f8944a9b94c3234a308350`です。この親を新候補の採用先mainと扱いません。Source3の独立レビューと、記録2本の独立レビューは準備時点では未完了です。

変更候補は`.github/workflows/ios-missing-package-ui.yml`、`ios/tests/xctestrun-metadata.mjs`、`tests/unit/ios-xctestrun-metadata.test.mjs`の3本です。本作業の所有物は本記録のMarkdown・JSON2本です。共有checkout、Source3、既存の凍結証拠、他担当者の差分は変更していません。索引のwholefile複製も行っていません。

## 親89のDedicatedで確認したこと

対象は[run40519707868](https://github.com/pero3dev/ai-agent-library/actions/runs/40519707868)、job122243145160、attempt1です。復元前に欠損bundleのエラーと再試行を確認するFと、復元・upgrade後に3記事の本文を確認するRを分けます。

| 段階 | raw結果 | xcodebuild | 判定範囲 |
| --- | --- | --- | --- |
| F | 指定した1ケースがPassed。rawのleaf・親階層・実行deviceも一致 | exit0、timeoutなし | 欠損時のエラー・再試行のUI確認が成功しました |
| R | 指定した1ケースがFailed。`NativeReaderUITests.swift:349` | exit65、timeoutなし | 復元後の本文確認は成功していません |

F側4時点は各180ファイル、R側3時点は各181ファイルで、7時点すべてのApp配列をRAMで照合しています。各path・bytes・SHAと、既定で許容している12件のmode差が一致しました。mode差の受入条件を今回広げたものではありません。

Rで対応したApp診断は1件で、PIDは16161でした。FのPID13578とは異なり、RのAppのhome/Documentsはlive collectorが得た同じdata containerを指していました。一方、`Bundle.main`と検証対象Contentは`data/Library/Caches/com.apple.containermanagerd/Dead/…/AILibrary.app`を指し、`articles/01-concepts--agent-loop.json`が1件欠けていました。collectorが照合した現在のinstalled Appとはbundle rootが異なります。readerはこれらの診断内パスを開いていません。観測した相違と内部のcache・install機序は区別し、機序は未確定のままです。

固定52Bのsentinelは初期値が一致し、upgrade後・本文確認前までは保持されていました。Rの本文確認が失敗したため、本文完了後の最終sentinel記録はありません。これはsentinelの消失を実証した結果ではなく、完了後の保持が未確認という意味です。F停止の確認があっても今回の再発を防げておらず、それだけで原因解明や復旧完了とは扱いません。専用Simulatorのcleanupは成功しています。

## Driver候補の操作

従来の専用フローには、明示的なApp installと、stockのsource-artifact `.xctestrun`によるinstallの二重経路がありました。候補は、Apple同梱の`xcodebuild.xctestrun(5)`の`UseDestinationArtifacts`契約に沿って、専用runfileとinstall対象を揃えます。これはSource3作者がlocal man5の228〜257行を確認した範囲であり、本記録作成ではmanやSDKを新たに実行していません。

1. stock format1/2から既存selectorで一意のUI targetとconfigurationを選び、所有Products内のrunner・test bundle・Appの実pathを解決します。未解決path macro、所有範囲外、symlink、曖昧なtargetは拒否します。
2. 実Info.plistのAPPL/BNDLと実executableを確認し、runnerとtest bundleのIDを照合します。標準的なbundle名からIDを推測しません。所有Simulator UUIDへrunnerを事前installし、installed runnerの全path・bytes・SHAをbuild側と照合します。
3. `UseDestinationArtifacts`を有効にし、source pathの`TestBundlePath`・`TestHostPath`・`UITargetAppPath`を除きます。代わりに`TestHostBundleIdentifier`・`TestBundleDestinationRelativePath`・`UITargetAppBundleIdentifier`を与えます。選択したUI targetとconfigurationだけを専用runfileへ残し、それ以外の非path設定を保持します。
4. 専用runfileをstockと同じProducts階層へ排他的に作り、残る`__TESTROOT__`の基準を保持します。XML変換後にreadbackとSHAを確認し、F/Rそれぞれの実行前にもrunfile SHAを照合します。

候補ではAppの製品実装や通常UI試験を変更しません。F/R selector、各段階の上限・待機時間、Fの欠損化、Rの復元・upgrade、7時点のApp配列照合、固定52B sentinelのupgrade前後と本文完了後の検査、cleanupを保持しています。erase・uninstall・設定消去・production fallback・待機緩和・sentinelの迂回は追加していません。runnerのmodeは記録しますが、新しいAppのmode受入規則は加えていません。

## 実施した検証と親の成功範囲

Source3作者の凍結proofでは、trusted Node24の単体試験を1回実行し、既存28件と追加8件の合計36件が成功、失敗0・skip0、exit0、324.986167msでした。追加8件はdestination形式への変換、選択した設定・入力の保持、実ID/pathの使用、ID不一致、未解決macro・escape、Appとrunnerの混同、元selectorの厳格な拒否条件、所有path境界を扱います。抽出したDriver JavaScriptの構文検査1回もexit0でした。YAMLのDriver外はbyte同一で、actionlintは利用できていません。これらの試験を本記録作成で再実行していません。

親89の別runでは、Nativeのraw UI4件が成功し、単体は165件実行・2件skip・失敗0です。Native4件には新Recovery2件を含みます。Runtime26の既存UI2件、SDK26のunsigned archive、Fullのraw UI22件も成功しています。Fullの22件はNative2・Published14・geometry6であり、新Recovery2件を含みません。これらは新Driverを含まない親の結果です。親の正常系の成功で、DedicatedのR失敗や新Driverの未実施を置き換えません。

| 親の別run | ID | 限定した結果 |
| --- | --- | --- |
| Native | 40519707888 | UI4件成功、410.029秒。単体165件実行・2件skip・失敗0 |
| SDK26 | 40519708024 | unsigned archiveの互換性検査が成功。UI・実機・配布受入は含みません |
| Runtime26 | 40519708263 | 既存UI2件成功、258.131秒 |
| Full | 40519707922 | UI22件成功、1324.692秒。Releaseは199記事・音声1本・625ファイル・36958860B |

親FullのRelease revisionは`e3530249c3e21f9a77e79e08f93123997551d02845a8624c8d89b4d13c9bfbbd`で、TestContentの除外を確認しています。AppIconはbuilt file/CAR metadataの検査までです。過去headとのbyte同一性、独立した画面・公開・実機受入は主張しません。

## 証拠の保持と再照合

元の[artifact12741348856](https://github.com/pero3dev/ai-agent-library/actions/runs/40519707868/artifacts/12741348856)は349679Bです。圧縮全体のSHA-256 `d931bfed9cf976515ed2d400546068468cd8a1bbb970ef10332fc8d85a9c3749`を照合済みです。index196件のpath・type・重複等を検査し、追加診断を含む選択unique54件のCRC/SHAを確認しています。未選択memberのCRCは未検査です。初回の選択展開量1090439Bと、重複診断読取も含む総展開量1297940BをJSONで区別します。

本候補は小さな要約とJSONだけを持ち、raw ZIP・ログ・画像・xcresultを複製していません。再照合は取得元とSHAを使い、既存のサイズ上限・path/type/重複検査を伴う限定readerで、圧縮全体と選択memberを確認します。取得元が消えた場合、SHAだけでは内容を復元できません。本記録作成では新たなAPI/GETを実行していません。

| 凍結入力 | SHA-256 |
| --- | --- |
| Source3 manifest | `f67eb0ee0ec7b6f7e7fb4f8b29bb531e5315afec86fd8611c51d77ddf44c2f92` |
| Source3 proof | `73d4b31215f3b2570f99d4e4bf844e9b4b12a054ae85ef8f30e421dd76cf449f` |
| 親89 findings | `8b43b44ee6b63e8a719d5027c62ca1f6344888c8973d1691a51e65abe83122b7` |
| 親89 compact-read | `6c8d527b26f4c026594b8e8a54ee25fbd0ae025faf75167b9b321984caa9b324` |

JSONには親のNative・SDK26・Runtime26・Fullの小票のSHAも保持しています。private保管先は`<private-evidence>`として示し、ユーザープロファイルを含む絶対pathは公開候補へ載せていません。

## 未完了と次の統合単位

Source3と記録2本の独立レビュー後に、新PR・基準mainとの結合を確定します。新DriverのHosted SDK/build、runner install、専用runfileの実行、F/R各1ケース、7時点のApp配列と実launch root、本文完了後の52B sentinelは未確認です。新runと採用はJSONでnullにしています。親89のUI成功単位とDriver修正の統合単位は、準備時点では別に検討しています。

Core性能、実機、VoiceOver、オフライン・import・同一processの再試行等の製品受入は本候補の完了条件へ含めず、未完了のまま保持します。SDK実行や実UI、新CI、main反映が成功したと推測して完了扱いにはしません。

## 2026-10-28: Simulatorでの実行拒否

この節は、上記の準備時点の記録を保持した追記です。[PR #284](https://github.com/pero3dev/ai-agent-library/pull/284)のhead `56fef8f00946aba553a42cc2081d7df6100fb65e`に対する[専用run 40533077378](https://github.com/pero3dev/ai-agent-library/actions/runs/40533077378)では、buildとrunfileの準備を通過しましたが、F・Rの両方でXcodeが終了コード70を返しました。

選択したstderrは各695Bで、省略されていない全文を照合しました。Xcodeは `when UseDestinationArtifacts is set, the destination must be an iOS device` と報告しています。この実行環境のSimulatorでは本設定を使えず、対象UIケースの実行前に拒否されました。F/Rのxcresultにはそれぞれ `Testing Failed to Start` 配下の失敗leafがあります。意図した2ケースの実行・成功として数えません。内部のcache機序や、親89の古いbundle参照の原因が確定したという意味でもありません。

7時点の実インストール一覧は、Fの4回が各180ファイル、Rの3回が各181ファイルで、path・bytes・SHAと許可されたmode差を照合しました。52B sentinelは初期記録と更新install後・本文確認前の保持まで確認できています。本文成功後の最終記録は存在せず、本文表示後の保持は未確認です。launch診断は0行で、App自身の診断と起動rootの相関も成立していません。専用Simulatorのcleanupは成功しています。

[compact artifact 12746269208](https://github.com/pero3dev/ai-agent-library/actions/runs/40533077378/artifacts/12746269208)は357870B、圧縮全体のSHA-256は `d680bdefcb9832692bfc2d51aeaf0439f6369cdab5fefd8ee0e8b4bf88f0e1f8` です。index231件を検査し、選択memberのCRC・SHAを確認しました。重複読取を含む展開量は1453983Bで、未選択memberのCRCは未検査です。読取の小要約は49143B、SHA-256は `25e104608858530961960f0baf95973ca2c8bd2d8386cfa22efba3b56e5832fd` です。最初の通信open失敗は別の158B要約に残し、その後の読み取り専用取得1回で圧縮全体と選択内容を確認しました。raw ZIP・xcresult・画像は保存していません。

実機専用の設定をSimulator向けの修正として採用しません。次の候補ではstockのsource path契約に戻し、欠落状態と復旧状態のAppを別々の固定されたsource copyにして、各段階の明示installとUI実行元を揃える方針です。実装・独立レビュー・新headのHosted結果を確認するまでは、この代替構成の実効果も未確認として扱います。

## 2026-10-28: source pathを段階ごとに固定する候補

Simulator向けには、ビルドで得た元Appとstock runfileを変更しない構成に戻します。所有するProducts内に、欠落状態Fと完全な復旧状態Rの別々のApp copyを作ります。Fだけで検証済みの記事JSONを1個除き、Rは元Appの全ファイルを保持します。上書き・symlink・同じinodeの別名参照を拒否し、ファイルとディレクトリのmode、元Appとstock runfileが変わらないことも調べます。

各runfileはstockと同じProducts直下へ置き、UI targetとconfigurationを1件に絞ります。stockのrunner・test bundle参照と `__TESTROOT__` の基準を保ち、`UITargetAppPath` と元Appを指す `DependentProductPaths` だけを該当するphase copyへ変更します。元Appを指す参照が残る場合は拒否します。各依存pathでは既知macroを解決してからcanonical成分を検査し、未知・未解決のmacro、相対path、`.`・`..`・空成分を拒否します。その他のcanonical参照は元の表記を保持します。各段階の明示installとUI実行で同じcopyを使い、実機専用設定とrunnerの先行installは外します。Appleの `xcodebuild.xctestrun(5)` のsource path契約に従う変更であり、内部cacheの修正が保証されたという意味ではありません。

同じSimulator・App ID、F/R各1ケース、7時点のインストール一覧、52B sentinel、cleanupと全待機上限を保持します。製品側の本文・保存処理や通常のUIを変更せず、erase・uninstall・設定消去・bundle fallbackを追加しません。

trusted Node24の単体36件（既存selector28件とphase用8件）が1回の実行で全成功し、抽出Driverの構文解析も成功しました。小さな所有fixtureで、別inodeのcopy、readonly・実行可能ファイルとディレクトリのmode、Fだけの欠落、Fへの書込みが元AppやRへ伝播しないこと、元runfileの不変、再利用・symlink・元App変更の拒否を確認しています。既存selector本体と28件のbody、Driver外のYAML、7回の一覧検査、F/R選択とsentinel等の保持を照合しました。actionlintは利用できず、新候補のSDK・UI実行は未実施です。

追加するphaseとbaselineの全ファイル配列は、artifact内でpath・bytes・SHA・modeを元配列と比較できます。runfileのJSON readbackはstockからの変換と比較できます。一方、実ファイルのinode分離、ディレクトリのmode、raw XMLのSHAはproducerの検査・報告であり、配列やJSONだけから実ディスクの状態を再証明するものではありません。新headのF/R、起動root、本文成功後のsentinel、main採用は未確認です。

| 新source候補の凍結入力 | SHA-256 |
| --- | --- |
| Source3 manifest | `069aeec106444df422194ca97ed66254379ae8cf9a1937c7862f89883f0b7cd3` |
| Source3 proof | `cf4c369e66aafae056f616109917e9dacebf30d4374c0571f38b6413f77bf7e8` |
| Source v1からの限定差分 | `3bb8281c925ecfc9ccfd39e65075b7e451dcd16680d9e2cf7237f5dcdfd928ca` |
| 読取schemaの計画 | `6fb4523247ea2b689c5dd9a480a63b55412e8bd2494f7750fcd861aca55e3fc6` |
