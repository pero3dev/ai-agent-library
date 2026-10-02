# P3: GPU容量・推論提供・環境負荷の境界

## 作業契約と方針

- 既存3記事に7図38段階を置く。重みと実行容量、帯域と計算、提供基盤の連続batching・更新、環境負荷の作用と算定境界を本文と並べる。本文や具体例の増量を目的にしない。
- 専用モデル・本文対応・SVG・包装・登録・MDX許可・固有試験、本記録と索引・引き継ぎを所有する。原文の表・Mermaid・例・時点・TODOを保持する。
- 最新実マージ済みmainから通常PR、必要検査・必須CI・squash・既存Pagesまで進める許可は依頼に基づく。前単位の公開表示後にマージし、公開後は表示のみ。任意レビュー・追加台帳・大量証跡は省く。

| 記事 | 主要論点の割当 | 保持する境界 |
| --- | --- | --- |
| GPU | API・自ホスト・端末の分担、並列行列積と条件、7Bの精度別重み、KV・作業領域・metadata、分割／退避と速度、処理段階別律速、三hardware・三調達とTCO、保有の運用・稼働率 | 重みだけを搭載保証、低精度を品質合格、FLOPSを速度、購入を安価、製品の旧時点を現価格にしない |
| 推論提供 | 主権・閉域・customと稼働率、二engine類型・代表時点と保守・hardware・許諾、連続batchingとKVのengine利用、同時×文脈容量、量子化品質、GPU/VRAM/queue/tail監視、配布・load・旧新・切戻し、評価・cache・版の連動 | 互換を全機能、slot図を実速度、載るを同時容量保証、モデル配布を更新完了にしない |
| 環境 | 効率化と報告、計算／稼働効率／炭素強度と八施策、学習／推論・PUE/WUE・scope・立地／市場とrange、品質と総使用量、推計とSCI/AI拡張・保証、AWS後継と旧画面・対象境界・再計算、版と実績年・配賦、義務／自主・照会と専門担当、実削減／相殺／証書／目標・年間／瞬間 | 割引を電力削減、低PUEを低排出、月次推計を要求実測、告知を実画面停止、GSF拡張をISO済み、図を自社法適用・green claimにしない |

原文全体と本文ASTを確認した。2026-10-02に[NVIDIA行列積ガイド](https://docs.nvidia.com/deeplearning/performance/dl-performance-matrix-multiplication/index.html)の演算／byte、[Accelerate](https://huggingface.co/docs/accelerate/usage_guides/big_modeling)の退避と転送、[vLLM](https://github.com/vllm-project/vllm)のbatching・KV管理、[GSF SCI for AI](https://greensoftware.foundation/standards/sci-ai/)のlifecycleと機能単位、[AWS方法論](https://docs.aws.amazon.com/sustainability/latest/userguide/methodology.html)の算定対象と過去再計算を確認した。製品・制度・市場価格・実アカウントは原文の時点・未確認を保持する。

## ローカル検査

rootとwebsiteで`npm ci`を行い、`npm run check`はroot487件成功・3件skip、全サイトのunit722件成功。本文AST同一性・段階時計・8つの意味モデルの12件を含む。静的exportは223 route・230 HTML、対象ブラウザ18件が成功した。

1440px lightと390px darkの全段階・全選択肢を検査し、同期・seek・手動段階・拡大・JavaScript無効・低PCの停止と状態保持・印刷を確認した。7図をPC画面で目視し、数値内訳と本文の対応、文字と接続、色と幅を確認した。原文の数値・engine表・時点・TODOも保持する。

ローカル準備は完了。公開集計へはまだ加えない。P3〜P5は未完了。

前単位のLinux狭幅の注記はみ出しに備え、GPUと自ホストの3注記を条件を保って短縮した。意味モデルと原文は変更しない。2単位合同のAST・意味24、静的223 route・230 HTML・16章、対象18を含む合同ブラウザ34検査が成功。変更した3記事のP5検査はChromium・WebKit各3件が成功し、GPUと自ホストの最終段階をPC取得画面で確認した。共有5ファイルの凍結patchは変更せず、専用sceneだけをこの単位へ含める。

提出baseは[PR #134](https://github.com/pero3dev/ai-agent-library/pull/134)の実squash 2d6aaeb74c6d0ed3460754906981166822a8041b。前単位の提出headとPR CI 37028010783・必須9検査・実メッセージ・ツリーを確認。文書・リンク・Markdown・差分を提出前に検査する。公開済みは126/199記事で、公開後は表示確認のみ。
