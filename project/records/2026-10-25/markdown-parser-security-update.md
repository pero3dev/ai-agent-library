# 検証・サイト描画依存のセキュリティ更新

## 範囲と許可

iOSのTODOを自律的に実施する依頼の前提作業として、既存の共通検査で使う`markdown-it`を14.3.1から14.3.3へ限定更新する。初回PRの実CIで既存サイトの依存監査も失敗したため、Next・DOMPurify・Zodと必要な互換処理を同じ前提修正へ追加する。所有はrootとwebsiteの依存定義、websiteのLayout・sync・生成helperと回帰試験・README、この記録とJSON、`project/README.md`の索引。iOSアプリ・学習記事・CI・保護設定はこの修正PRへ含めない。

既存変更を保持し、main `405e29273a7a3257adeb370c6ac3196d35693d4d`の依存定義を隔離コピーしてlockfileを準備した。更新対象はrootの指定と`node_modules/markdown-it`のentryだけで、他の解決済みpackageは変更していない。通常のPR作成までを進め、保護ルールの例外や回避は実行しない。

## 根拠と検証

2026-10-25のnpm監査で、既存14.3.1にhighを検出した。複数行のリンク参照定義による計算量増加の修正版は14.3.3であり、[公式アドバイザリ](https://github.com/advisories/GHSA-gfr2-rv44-r23c)と[公式リリース](https://github.com/markdown-it/markdown-it/releases/tag/14.3.3)を同日に確認した。既存の14系内で最小更新し、`audit fix --force`は使っていない。

rootはhigh・critical 0、残存low 3・moderate 2だった。iOS作業中のroot共通検査559件中544成功・15skip・0失敗。これをPR固有の実CIや、全依存の脆弱性解消とは区別する。

サイトはNextを既存16系の範囲内の16.4.3、DOMPurifyのoverrideを3.4.17、Zodのoverrideを4.6.6へ更新した。[Nextの公式リリース](https://github.com/vercel/next.js/releases/tag/v16.4.3)、[DOMPurifyのアドバイザリ](https://github.com/advisories/GHSA-cg2g-xh64-v4q7)、[Zodのアドバイザリ](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)を確認した。lockは14entry変更、他の不要な更新は避け、既存のローカルglob adapterを維持した。

新しいZodではNextra 4.6.1のLayoutがchildrenを検証対象から先に除いてしまう問題が顕在化した。[上流修正 #4990](https://github.com/shuding/nextra/pull/4990)に沿って生成コピーのみに2点の互換処理を加え、全propsの検証を維持し、childrenのテーマ設定への混入を防ぐ。installed依存は書き換えず、対象版・置換箇所のガードで想定外の更新時は停止する。独立レビューで修正必須事項はなく、追加4試験も独立に成功した。

サイトのnpm ciと監査は成功し、残る8件はlowのみ。単体91/91、公開相当のclean buildで235ページ生成・230/230経路・232 HTML索引を確認した。ブラウザー操作はPRのCIで別途確認する。共通検査とPRの実CI結果は[JSON](markdown-parser-security-update.json)へ記録する。

## main反映の条件

通常のPRでも[Harness policy](../../../.github/workflows/harness-policy.yml)は候補の検査前にbaseのlockfileを監査する。[初回PR #240](https://github.com/pero3dev/ai-agent-library/pull/240)のhead `10f38e7…`で、このbase監査の失敗を実CIログで確認した。候補側だけを修正してもこの監査は通らず、既存の復旧workflowは確認できていない。修正PRと他の検証結果を揃え、main反映に必要な例外・復旧の判断だけ本人へ確認する。管理者回避・監査無効化・保護変更を自動で実施しない。
