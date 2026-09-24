# 公開検証キットの試験配置変更

状態: 候補作成・オフライン検証完了、独立限定レビュー待ち。repoのroot記録・handoff・website・ハーネス契約、workflow、package.jsonは変更していない。公開・browser・network・Git操作は実施していない。

## 変更範囲と来歴

`CONTRIBUTING.md` の配置契約と `scripts/check-structure.mjs` のscripts内test禁止に従い、試験を `scripts/diagram-release/portable-validation.test.mjs` から `tests/unit/diagram-release-portable.test.mjs` へ移動した。移動前に承認済channel候補の全11ファイルをTEMPの `ai-agent-library-channel-approved-kit` へバイトコピーし、旧manifest `e9cf22cf7edd16443a6cd4d38c6aec9fac92bd09f4ad442f04270ef352ddac03` と全10掲載ファイルのhashを照合した。元BとLF原本は既存TEMPコピーを保持した。

移動した試験ファイルはhelper importの1行だけを変更した。その行を元へ戻すと承認済channel候補の試験全文へ一致する。18件の試験内容とskip条件を変更していない。現在の配置はrootの `npm test` とUbuntu CI docsの既存 `node --test tests/unit/*.test.mjs` に自動参加する。

最小の追随変更は `scripts/diagram-release/check-preparation.mjs`、`source-mapping.json`、`README.md`。source mapping schema 4の `layoutRevision` がchannel版を前身として記録し、既存channel sourceEdits・元B生バイト/LFhashを維持する。新しい `location: repository` のkit外参照は `tests/unit/diagram-release-portable.test.mjs` だけを許可し、insideExistingで通常ファイル・境界・全祖先のsymlink/junctionを確認する。kit内の参照はplain filenameだけに限定した。

公開runner、collector、extractor、3検査module、path helperは承認済channel版からバイト不変。公開58ケース、fixture、CI同一性assertion、保護区間を減らしていない。現kitはscripts内10ファイルとrepo所有の試験1ファイルから成る。

## 検証結果

- 移動先を直接実行して18/18成功、失敗・skip 0。Windows、Node v24.16.0。実ブラウザー起動なし。
- 移動先試験と変更した準備スクリプトのNode構文検査成功。
- 準備検査成功。repo所有の試験hash、全LF、元source保護、全58ケースと数値fixtureを確認。
- 実際の準備コードのpath解決部分をオフラインで実行し、固定repo testを許可し、親逸脱・別test・kit逸脱・未対応locationの4件とjunction経由1件を拒否した。
- 現行checkStructureへ全必須パス＋所有候補パスの明示inventoryを渡した限定静的検査は成功。Gitを使った全stage対象の構造検査はこのタスクで実施せず、rootがstage後に行う。
- root npm testのglobへ新パスが一致することを確認。root全試験そのものはこのタスクで再実行していない。

## CI前提と実行の区別

Node22は既存workflowで明示される。rootは実main CI 36004074138のdocs setup logからubuntu-24.04 / 20260907.300.1を特定し、[公式Included Software一覧](https://github.com/actions/runner-images/blob/ubuntu24/20260907.300/images/ubuntu/Ubuntu2404-Readme.md)を実取得してPowerShell7.6.5とtar1.35+dfsg-3ubuntu0.4を確認済みと連絡した。この部分はroot取得の一次資料に基づく前提確認であり、私がWebへ接続した結果や、新18件のLinux実行成功ではない。Linux実動作は次C1のCI docsで確認する。workflow変更やskip追加は行っていない。

harness-windowsはpackage.jsonの明示的な10本リストを使用するので、新試験が同CIジョブへ自動参加したとは扱わない。Windowsは本タスクと今後の独立担当によるローカル実行の証拠を使う。

`harness/verification.json` のunit prerequisiteは現在root npm ciだけである。今回root全試験へ加わる実行にはtarとPowerShell7も必要となるため、正本の前提表記の同期はrootの所有作業として報告した。このタスクではハーネス契約を変更していない。

## root側で参照更新が必要な箇所

- `project/records/2026-09-24/diagram-release-portability.md` の末尾にある「専用18件はroot npm testに含まれない」と旧scripts内コマンドを、後継配置と自動参加の説明へ更新する。現在の45行目。
- 同記録の11ファイル移管の経緯と、過去のportability/channel review・validation JSON/MDにある旧パス/hashは、その承認時点の履歴として保持する。現在の構成10＋1と新manifestは後継節・新記録へ追記する。過去の生証拠を新パスへ書き換えない。
- 別PC handoffの実行例やcopy対象が旧scripts単一ディレクトリだけを示す場合は、repo所有の `tests/unit/diagram-release-portable.test.mjs` も同じ版で必要であることを追記する。repository checkoutなら両方が含まれる。
- 旧channel/LF承認を本配置候補の独立承認に流用せず、この候補hashに限定したレビューを記録する。

候補source-mapping.json SHA-256: `bbbb935cd4a81212fc5c703624625659e2d708e6ffa0e378dcafaf10b35a6da8`。

変更4ファイルの完全なhashと検証区分は同名JSONに保持した。旧scripts内試験は移動により存在しない。前身snapshot・元B/LF原本は削除していない。
