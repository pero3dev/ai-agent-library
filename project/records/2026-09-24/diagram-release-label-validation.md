# ポータブルラベル移植の検証

状態: オフライン候補。C1後継版とまとめた独立レビュー待ち。manifest: `c68b2b87452f374be0da9d8a6a488655db1989e3425e3074895a4aa8d16c05ff`。

配置承認版を先にsnapshot保存し、既存sampling caseへPR58承認済みラベル2条件だけを追加した。既存58ケース、23段階、54 sampling設定、数値fixture、runner/collector/extractorとCI同一性条件は保持。

旧B生バイト: `90808bc9fb9dcf9c1e0f06e3b1ddc4e243bd0a0460f1d8d30c8997bb7415f80e`。旧LF正規化: `d0f83f658e4f4ff286a7262f2a06a16faeee59f10adebfd88e56d7dbef820133`。

承認済みラベル元生バイト: `25533c15df80ed989d920dd87a918f6ba6425489ca3da9f74fd3012b7771c280`。LF正規化後の現モジュール: `ea20b87f890832d5c82f9c7f3674f8bda4c04d4f0819faa16d5818bf0022b3d5`。CRLF→LF以外の正規化なし。

ファイル単位sourceEditsを逆適用し、旧LF正規化hashへ戻ることを準備検査で照合。source元と承認済みラベル元は変更していない。

検証: Windowsの既存18/18試験成功、skip 0。構文2/2、preparation成功。実assertion行をstubで実行し正常draw/logitと誤った値/棒ラベルの5条件を確認。候補hashを更新しても、ラベル欠落・重複・数値fixture改変の3変異を旧hash照合で拒否。

Git・network・browser・公開実行なし。Linux実行は未実施。公開run、採用記録、最終独立レビューはroot担当。

変更ファイル:

- `scripts/diagram-release/check-preparation.mjs`: `76dca6d301fe8a9a756dfc5c04a9a77bc97dfc01fbef359e021d719627749943`
- `scripts/diagram-release/inference-checks.mjs`: `ea20b87f890832d5c82f9c7f3674f8bda4c04d4f0819faa16d5818bf0022b3d5`
- `scripts/diagram-release/README.md`: `74cb929637c79bd37fa4274840dd13d217cff24e630dd9ea8069f9bb9fcdfc95`
- `scripts/diagram-release/source-mapping.json`: `c68b2b87452f374be0da9d8a6a488655db1989e3425e3074895a4aa8d16c05ff`

中間snapshot: `TEMP/ai-agent-library-label-portable-snapshot`。配置承認snapshot: `TEMP/ai-agent-library-layout-approved-snapshot`。詳細は隣接JSONとdiff。
