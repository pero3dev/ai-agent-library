# 以前選択した保存記事版への限定fallback

現在の状態: 実parent `a1022fbf0d2d67b651d08930a3bef88b6b8a886d`のbeforeと7所有パスを結合した提出候補で、PBX設定だけApp0.2.28（30）へ進める。実Bundle・署名は未確認である。 保存済みHost8の8unique/skip0/fail0と、型検査済みApp17＋全文CoreTests＋Diagnosticsの19入力を現在の候補へ照合した。新検証の再実行ではない。

## 初版draft時点の履歴

以下の各節はSource2静的レビューまでの当初記録である。Host/SDK未確認等の段階記述を当時の履歴としてそのまま保持し、現在の判定は末尾の実parent結合節に記す。

作成日: 2026-10-31。状態: **Source2の私有実装候補と独立静的レビューまで**。正常な現在版を優先し、現在の保存記事版が使えない場合、pointerに記録された以前の保存版を1件だけ再検証して使う。実parentへの結合・App版・実Swift/Host/SDK・CI・mainは未確認である。IOS-18・21・22全体は未完了、完成版TODO32行・完了14行を保つ。

## 目的・所有・採択した範囲

Rootは、自用初版の非破壊の回復経路としてこの限定設計を採択した。共通契約・[計画と記録](../../README.md)・[Git共通規約](../../../harness/git-rules.md)を適用する。ユーザーの残TODOの自律実施と通常commit/PR/保護されたmain統合が権限の根拠で、実機の本人操作は未完了としてスキップする。実装の所有はContentRepositoryとLibraryCoreTestsのSource2である。後続で版だけのPBX、記録2本と索引2本を合わせる計7パスを予定するが、実parentと版はまだ固定していない。

以前選択した保存版は、importした版とbundleの明示選択による保存コピーの両方を含み得る。来歴・署名・発行者の真正性の証明ではなく、「直前にimportした版」とは呼ばない。新しい通信・配布・GCや削除、schema自動移行、原記事の改名対応、UIの回復通知は加えない。

## 選択と単一pointerの更新

既存のatomicなcurrent.jsonへoptional previousDirectoryを加える。loadは現在のUUIDが有効なpointerだけを読み、現在版を完全検証し、失敗時は同じpointerに記録した別UUIDの以前版を完全検証し、最後にbundleへ進む。各候補には通常のfixture拒否と資産・schema検証を適用する。壊れたpointerや不正な現在UUIDはbundleだけへ進む。全保存先の走査、時刻順、孤立版・stagingからの推測、連鎖した過去版の探索はしない。以前版のoptional metadataが不正でも健全な現在版を無効にしない。

loadはpointerを書き換えず、旧版や読書raw・backupを削除しない。戻す保存版だけが既存の世代leaseを取得し、検証中の候補はleaseを持たない。leaseの件数は従来どおりprocess内の参照保持の目安で、自動削除の許可には使わない。

通常importはsource・staging・destinationを全検証した後、その時点で選択され再検証に成功した保存版を1件だけ以前版として選ぶ。現在版が壊れていて記録された以前版が使える場合は、その以前版を次の回復候補へ引き継ぐ。新currentとpreviousを既存writerの1回へまとめ、別のmarkerや2回目のpointer更新は加えない。新しく導入する保存先の排他、compare-and-swap、実電源断・fsync耐久性の保証はない。

bundleの明示選択が実際に別版へ切り替わる場合、新pointerにはpreviousを付けずにcommitする。旧ファイル自体は保持する。完全なmanifestが同じという既存no-op判定では、pointer・以前版の適格性も含めて全bytesを変更しない。旧directoryだけのpointerは引き続き読めるが、壊れたpointer自身から以前版を探し出す機能はない。

## 保存した静的検証

元Repository5,442BとCoreTests294,311Bを固定し、候補Repository7,678B・CoreTests322,585Bを準備した。旧CoreTests全文をprefixとして保ち、新28,274Bと一意8testメソッドを末尾へ追加した。独立静的レビューはP1/P2=0、別実装のin-memory forward/inverse各6hunkがSource2全文へ一致した。対応するHashはJSONに保存する。これはSwiftの構文・型検査やtest実行の成功ではない。

新8件は、健全current優先と不正optional metadata、現在の本文・manifest・画像・保存先の破損/欠落、previousの不正UUID・self・path・fixture・future形式、旧pointerと孤立版非選択、A→B→Cの1枠更新とfallback引継ぎ、各検証失敗とpointer writer呼出回数、明示bundle/no-op、正しい世代leaseと後読資産、読書raw・backupの保持を検査する構造である。ENOSPCはcommit前にwriterへ注入する故障で、実ディスク枯渇や部分書込・電源断の検証ではない。

## 次の検証とcommitの区切り

実parentにSource2のbeforeを照合し、選んだApp版と7所有パスを結合する。新8件の限定Host、App17と全文CoreTests・DiagnosticsのSDK検証、共通検査と最終7パス独立レビューを経て、通常の小さなcommit/PRを作る。iOS単体は前段270＋8＝278件を予定するが、現時点の実績ではない。Native UI7・Full26とcopy374B・Release199記事、必要CIを正確なheadへ結び、保護された通常main統合を確認する。

新たな実データの破損注入、既存アプリやユーザーの読書記録の変更は行わない。実機・VoiceOver・Files provider、最低OS、旧アプリからの上書き・復帰、実容量不足は未完了として残す。この単位だけでIOS-18・21・22や性能・プライバシー・運用の受入を完了にしない。

## 今回の実parent・版設定との結合

実parent `a1022fbf0d2d67b651d08930a3bef88b6b8a886d`のbeforeと7所有パスを結合した提出候補で、PBX設定だけApp0.2.28（30）へ進める。実Bundle・署名は未確認である。 保存済みHost8の8unique/skip0/fail0と、型検査済みApp17＋全文CoreTests＋Diagnosticsの19入力を現在の候補へ照合した。新検証の再実行ではない。 新共通・最終7パス独立レビュー・currenthead CI/通常main・実機/VO/providerは未確認で、TODO32/14を保つ。2837→2839は新規record2本を含む投影treeの件数で、commit/main結果ではない。

Host8はMac Core7と新8件だけの実XCTestで、unique Started/Finished/Passed8・skip0/fail0、4コマンドexit0、全工程30.16986秒。module 15.369231秒、test build 6.708779秒、runtime 1.638355秒で、private12入力のbefore/after保持を保存票へ照合した。120秒・log2MiB・所有512MiB・空き700MiBのsample制約を保つ。Hostは4既知子のwait/cleanup requestの記録であり、SDK同様の全group noRemaining観測とは呼ばない。result SHA `1cbd63c560124eccab637c18b6c6db0c7a4f6af70d096db5678e9727f3a0b8c4`。

SDKはiPhoneOS18.2・arm64 iOS17・Swift5・DEBUGでApp17 emit 14.254225秒、全文CoreTests型検査 5.85916秒、Diagnostics型検査 0.582438秒、全工程21.793887秒。3exit0、67固定＋実generated4＝後段71の保存入力、raw6本0B・3group reaped/noRemainingを照合した。90秒・log1MiB・所有300MiB・空き700MiBを保つ。result SHA `2d03d89820cd049ecc7849cc3dad89959698bec25c21d57c92ce805df1b92e13`。

保持137ファイルのSHA/modeと保存実行レビュー `2923b0a09b14f25b002cb7c64063675f160fc9ab9419d556991a31130da42fe3`を結び、明示除外されたcompiler cache2系統・203,263,226Bの実体は要求しない。cacheはIR後にRootが整理したもので、証拠137件の欠損を許可する例外ではない。資源値はsample観測でhard peak/全filesystem隔離ではなく、実ディスク枯渇・電源断、全iOS XCTest278やUI/Bundle/署名/実機の受入ではない。

保存証拠の入力保持は実行時のbefore/afterで確認する。再利用時には実際に型検査した19ソースだけを照合し、当時のPBX29やbefore CoreTests等の文脈67入力が版30反映後も同じだとは要求しない。SourceSDKの成功はApp/PBXビルドや実Bundleの成功を意味しない。
