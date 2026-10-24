# Markdownパーサーのセキュリティ更新

## 範囲と許可

iOSのTODOを自律的に実施する依頼の前提作業として、既存の共通検査で使う`markdown-it`を14.3.1から14.3.3へ限定更新する。所有ファイルはrootの`package.json`・`package-lock.json`、この記録とJSON、`project/README.md`の索引。アプリ・記事・CI・保護設定はこの修正PRへ含めない。

既存変更を保持し、main `405e29273a7a3257adeb370c6ac3196d35693d4d`の依存定義を隔離コピーしてlockfileを準備した。更新対象はrootの指定と`node_modules/markdown-it`のentryだけで、他の解決済みpackageは変更していない。通常のPR作成までを進め、保護ルールの例外や回避は実行しない。

## 根拠と検証

2026-10-25のnpm監査で、既存14.3.1にhighを検出した。複数行のリンク参照定義による計算量増加の修正版は14.3.3であり、[公式アドバイザリ](https://github.com/advisories/GHSA-gfr2-rv44-r23c)と[公式リリース](https://github.com/markdown-it/markdown-it/releases/tag/14.3.3)を同日に確認した。既存の14系内で最小更新し、`audit fix --force`は使っていない。

修正lockfileを再監査しhighの解消を確認する。残るlow・moderateはこのhigh対策の成功と区別する。共通検査とPRのCI結果を[JSON](markdown-parser-security-update.json)へ記録する。

## main反映の条件

通常のPRでも[Harness policy](../../../.github/workflows/harness-policy.yml)は候補の検査前にbaseのlockfileを監査する。baseにhighがある場合、候補側だけを修正してもこの監査は通らない。既存の復旧workflowは確認できていない。実CIでこの阻害を確認した場合は、限定修正PRと結果を揃え、例外・復旧の判断が必要な部分だけ本人へ確認する。管理者回避・監査無効化・保護変更を自動で実施しない。
