# C1 共通統合 独立コードレビュー（初回）

判定: **changes_requested / medium**。must 1、should 0。対象hashは同名JSONに固定しています。rootのREAD検査修正前に対する判定です。

- レビュアー: 01a0ced7-e41c-70c1-904e-2ae30ff2fa4b:/root/pretraining_source_evidence
- 記録時刻: 2026-09-24T14:09:00.982Z
- 基点: 67b1309fcea8267749be6e52881f3d6a4049ae2b
- 範囲: 実装記録の13ファイルとtraining.spec.mjs、diagram-loading.spec.mjsのC1追加。記事本文・製品・Gitは変更していません。

## must C1-READ-01

validateAssignmentは段階番号の有効範囲だけを検査し、本文READ到達との交差を要求していません。隔離fixtureでtraining-association-not-causeをruntimeの[0]から手動専用[1]へ移すとassignmentCurrent=trueとなりました。動的論点は最低1つREAD停止面へ表示するという承認済みC1契約に反します。現在の既定割当は正しく、公開ゲートはnullなので、この再現を現在の誤公開と解釈しません。

C1のREAD契約を明示し、登録blockGroupsから得たREAD集合との交差を検査してください。[1]拒否、[1,2]受入を含むunitも必要です。古い記事の手動補助割当を無根拠に書き換える要求ではありません。再現はtraining-integration-read-repro.jsonに保存しました。

## 確認結果

- 2 diagrams / 10 stages / 9 READ groups; original 5 headings + 10 body nodes wrapped by reference, 8 headings / 13 body / 1 Mermaid / 0 math retained.
- Four enabled combinations retain original AST and article order. MDX fixed IDs/literal props/parent stage limits/nesting rejection are tested.
- 34 topics =21 dynamic+13 static equal approved map. Existing defaults all intersect READ, but validator did not enforce the condition.
- Lazy dispatcher uses two fixed imports, original prose fallback and article navigation. Actual payload isolation belongs to later browser acceptance.
- Current C1 review/local/public null. Previous six gates stale on changed shared inputs; PR56 five and PR58 six fixture sets fixed, real PR58 snapshot hashes unchanged.

独立unitは116/116成功、失敗0・skip0、163615.3383ms、exit0でした。元AST・MDX85ケースと記事受入31ケースです。成功しても上記の負例欠落は解消しません。

追加browser仕様は20ケースとloading追加2件をコードとして確認しました。元MermaidのS0保持、8H3/0math、9 READ/10全段階、固定oracle、逆seek、境界、keyboard/modal、再生、7viewport、noJS/printを確認し、追加指摘はありません。ブラウザーでは未実行です。

## 限界・後続

- No product changes, Git changes, build, generated-file editing or browser execution.
- Scenes/models/CSS, visual quality, screen reader, device/print acceptance and public identity are outside this review.
- 116 unit cases describe the initial target hashes, not the later READ enforcement fix. Root is addressing C1-READ-01; a separate addendum must review the final hashes.
