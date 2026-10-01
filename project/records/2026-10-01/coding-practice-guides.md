# P2: Claude・Codex・Copilotの実践ガイド

## 作業契約と方針

- Claude Code・OpenAI Codex・GitHub Copilotの実践ガイド3記事を選ぶ。機構の選び方、コンテキストと消費、自動化の境界と検証手段を原文と並べて追える形にする。本文・具体例の増量を目的にしない。
- 所有は専用モデル・本文対応・SVG・遅延包装・登録・MDX許可・固有試験、本記録とproject索引・引き継ぎ。原文の表・コマンド・確認日・数値条件・TODOを保持する。
- 最新の前単位マージ後mainから通常PRを提出し、前単位の公開表示後にマージする。通常PR・必須CI・squash・既存Pagesは許可済み。任意の独立図解レビュー・追加台帳・大量証跡を省き、公開後は表示確認のみ。

| 記事 | 主要論点の割当 | 保持する境界 |
| --- | --- | --- |
| Claude実践 | 9機構の使いどき・起動と継続読込、文脈管理・compactとrewind・規約とスキル・CLIとMCP・前処理・モデルと思考・teams、モデル別単価と主会話／補助のTTL・優先順位・effort例外と失効・計測、headless・小さなfanout・CIの3上限・認証・GitLab・Routinesとself-host・green、検証手段・4工程・早い修正・仕様と実装の分離・Writer／Reviewer・5失敗 | 元記事時点の倍率・TTLと接続先・版の条件を現在の一般値へ固定しない。CIの例10を既定上限としない。Routinesのgreenをタスク成功としない。rewindをbash・外部作用の完全取消としない |
| Codex実践 | 4面とLocal／worktree／cloud・双方向ハンドオフ、5機構と委任条件・導入順・失敗駆動規約・description・hook、共有枠と週次・tokenとcache・cwdからの規約範囲・MCP・軽量と認証別退役・推論・スレッド・FastとAPI Priority・残量、execのstdout／stderr・read-only・認証とキー分離・Action制御・レビューの観点と別枠・チャット委任・定期実行と稼働／場所／課金・CIとの分担、4要素と計画・検証・よくある間違い | 経路外規約が自動注入されるとはしない。worktreeをOS隔離とせず、cloudからPCフォルダーを扱わない。ChatGPT枠とAPI課金を混ぜない。Fast速度と消費を同倍率とせず、終了コード未確認を残す |
| Copilot実践 | 6タスクと制御の強さ・cloud適性4条件・planとdelegate、機能別指示・base側レビュー指示・prompt／skills／agents・Spaces添付・Memory、Creditsと旧乗数・無料機能・Actions分・モデルとセッション・cacheと文脈・依存事前設定・tool、base／flexとpool・月初と繰越なし・予算4階層とULB・最小残枠・測定API差、Issue定義・修正依頼集約・API条件・automationの帰属と権限・ruleset／draft／effort・assessmentとpreview承認・Agentic Workflows | 未確認のpreview上限とモデル指定等を補完しない。個人予算と組織poolを混ぜない。申請やassessmentを承認とせず、safe-outputsとread-onlyを全自動化の保証としない。元記事の割引率・cache比率は採用時に再確認 |

9図46段階を制作。3記事の全原文を読み、2026-10-01に公式prompt caching・costs・AGENTS読込・non-interactive・Copilot budgets／instructionsを参照。古い数値の再計算や全製品の鮮度更新は目的にしない。

rootとwebsiteのnpm ci、共通487成功・3skip、サイト単体524成功。原文AST保持・MDX、cache例外、定期場所と稼働・認証、予算の最少残枠・同値・ULBの6検査が成功。docs差分なし。

静的223ルート・230 HTML、最終対象ブラウザ11検査が成功。全46段階・全選択肢の1440px明色／390px暗色、同期・前後・シーク・拡大、3記事JS無効、1280×720再生停止・印刷を確認。初回の予算状態の検査属性を整え、最終ビルドと11検査を再実行。9図をPCで目視し、Claudeの説明文末の孤立した折返しを短く整えた。再ビルド・11検査・修正図の再目視が成功。

文書・リンク・Markdown・差分、通常PR・必須CI・squash・main CIとPages・公開表示は提出時に進める。次はレガシー理解・保守運用・企業環境の3記事。P2残りとP3〜P5は未完了。

提出baseはPR #83の実squash bc1a88bb6fa5425d56ab8f115e5441d67ec88249。Copilotの承認評価注記を短くし、対象と実践ガイドを合わせた最終ブラウザ22検査が成功（実践11）。SE表示修正は静的ビルド・SEブラウザ11・2図PC目視が成功。文書215件・リンク・Markdown・差分を提出前に確認する。後続のレガシー・保守・企業環境3記事6図30段階は保留変更で、このPRへ含めない。

承認の未有効・条件一致・新commitで失効の3表示を短く整え、最終静的223ルート・230 HTML、実践ブラウザ11検査、PCで3状態の目視が成功した。文字サイズと原文の条件を保持する。
