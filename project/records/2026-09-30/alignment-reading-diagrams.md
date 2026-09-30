# アラインメント理論の読書連動図解（D1）

状態: D1の3図・15段階をPR #63で公開受入した。main CI・Pages・独立公開レビューを完了し、既存8記事も現行入力で再受入。P1の公開完了は9/15記事。

## 作業契約

- 目的: 既存のアラインメント理論を読みながら、選好学習の数式、報酬の代理性、フィードバックの出所と粒度を3図・15段階で確認できるようにする。本文の増量や例の追加は行わない。
- base: `5940334a6fd3aab8178cfeb8746a58c8b937d390`、branch: `feat/alignment-reading-diagrams`。
- 所有: `docs/11-llm-internals/alignment-theory.md`の採択済みA1〜A3訂正、D1モデル・場面・CSS・テスト、図解の登録・記事装飾・受入台帳、公開検証キット、対象の通常記事変更manifest、公開証拠と計画・実施記録。生成物は直接編集しない。
- 許可: ユーザーの自律的な実装・公開反映。P1全15記事を公開受入した時点で停止し、P2は開始しない。別PC用にリポジトリ内の再開資料と貼り付け用プロンプトを整備する。
- 必要な検証: 採択済み計画と最終本文の整合、式の独立検算、原文AST・数式・既存Mermaid保持、すべてのREAD経路、停止・手動操作・巻戻し、明暗・低画面・狭幅・拡大・キーボード・reduced motion・JavaScriptなし・印刷、独立した実画像レビュー。機械チェックと最終固定treeの記事独立レビュー、PR/main CI/Pages、同じartifactに対する公開Edge/WebKit全件と独立公開確認を区別する。
- 終了条件: D1と既存8記事が新しい入力版で公開受入され、証拠をリポジトリへ保管できたらD2へ進む。他者の変更を巻き戻さない。

## 準備

[採択済みのP1残件設計](../2026-09-24/p1-remaining-storyboards.md)を実装の基準にする。[具体案と独立レビューの保存先](p1-interface-preparation/README.md)から、別PCでも残り7記事の設計を参照できる。計画レビューは実装・画像・公開の承認を兼ねない。

### 一次資料の再照合

2026-09-29T19:19:58Zに以下の版の本文を取得し、続けて該当節を確認した。既存の[訂正根拠](../../../research/internals/p1-remaining-diagram-sources-2026-09-24.md)を置き換えず、D1実装時の再照合として残す。論文の逐語転載は行わない。

- [Lightman et al., v1](https://arxiv.org/html/2305.20050v1) §2・§2.4–2.6: 人手のステップラベルを学習するプロセス報酬モデルと、最終結果を予測する結果報酬モデルを区別する。評価粒度と報酬の出所は同一の分類ではない。本文A1〜A3の訂正を支える。対象論文は固定した生成器の候補を報酬モデルで選ぶ評価であり、生成器をRLで改善する実験として図示しない。
- [Rafailov et al., v2](https://arxiv.org/html/2305.18290v2) §3–4・式4〜7: 同じ入力の応答間では正規化項が差で消え、参照方策との対数比から選好損失を構成できる。図の説明用1ペアの損失と、論文・記事のデータ全体に対する期待値を区別する。固定分布でβを変えた数値を学習後の品質予測にしない。
- [DeepSeek-R1, v1](https://arxiv.org/html/2501.12948v1) §2.2.2: 数学の解答確認やコードのテストによる規則ベースの報酬を説明する構成例。すべての結果評価・過程評価がこの構成になるとは一般化しない。

## 検証・公開

C2と既存7記事は[PR #62の公開受入](inference-score-spacing-fix.md)を完了し、[固定した8記事の結果](diagram-acceptance-pr62.json)を保存した。その後にD1製品の実装を開始した。共有登録・装飾・受入コードを変更したため、現行9記事のゲートは最終候補で再確認する。

承認されたA1〜A3の3置換を適用し、本文を増量せず更新日と実取得した2参考資料のアクセス日を同期した。3図の登録、dispatcher、MDX安全性、6 H3・23 body blocksの包装、42論点（動的27・静的15）の割当を追加した。既存8記事の割当は値と書式の両方を維持した。

原文保持の4試験は成功。全8通りの図の有効/無効組合せでASTが復元され、4数式・元Mermaid・15 READと原文順を保持する。staleなレビュー・見出し変更・本文ブロック種変更・不正なMDXを拒否する。最初の見出し変異試験は、同じ文言が先に現れる本文参照を変更していたため想定した拒否が起きず、見出し行を明示した変異へ訂正して再検証した。製品の誤動作とこの検査入力の不備を分ける。

既存と新規を含む記事受入の39試験も成功。3種類のゲート、42論点の不足/重複、図固有10入力の隔離、ファイル欠落、上書き本文と図の外にあるチェックリストの変更を検査した。モデル・描画・実画像・正式記事レビュー・ビルド・GitHub/公開の検証は続けて実施する。

共有装飾・MDX安全性の既存記事を含む98試験も成功した。本文規約は215ファイルで成功。これらは原文保持と安全な装飾の機械検査であり、実画像や公開の受入ではない。

代理報酬・フィードバックの担当8ファイルでは、モデル9試験、JSX変換2本、整数・中点・逆順・両選択のSSR 86状態（614属性）が成功した。出力や段階のIDを保ち、品質値・性能値を未測定のまま扱う。作り手の選択はフィードバック図の最終段階だけに作用する。これは製作者の検証であり、独立した意味・実画像レビューは別途行う。

選好学習の担当4ファイルでは16試験が成功し、共通clockに従う7段階、Bradley–Terryの説明例、3通りのβによるDPO損失、同じ入力での正規化項の相殺、不正な確率質量・ゼロ・極端な比を確認した。全応答のKL・期待報酬・学習後の品質は値を作らず未知のまま示す。

統合後のサイト単体試験は392/392成功。公開と同じbase pathで静的ビルドし、223/223 routeと230 HTMLの検査が成功した。Edge/WebKitの補助捕捉は各48 scene（全15段階×3画面条件、βの2追加値、AI選択）で、原寸の範囲・横幅・画像寸法・前後の入力とbuildの一致を確認した。画像を生成した件数は実視認の件数と別に記録する。

初回の補助捕捉では各3件のconsole 404を記録した。専用の診断で、補助serverが末尾スラッシュなしのbase pathを拒否していたと判明した。製品serverは元から対応している。補助serverだけを訂正し、同じbuildの診断で404なしを確認した。初回結果とhelperを保存し、製品のネットワーク受入は正式なローカルadapterと公開検査で別途行う。

ルートの `npm run check` は成功。単体試験485件中484成功・失敗0・1件skipで、skipはFFmpeg/FFprobeを指定していない実音声変換試験だった。本文規約215ファイル、リンク377ファイル・5809件、Markdown lint、静的ハーネス・配置・Git設定の検査も成功した。新しい記録をstageした後には配置と文書の最終チェックを取り直す。

独立した初期レビューでは、閉形式によるDPO検算、A1〜A3の限定差分、全論点と原文保持、旧8記事の入力差分、取得した96枚の全sceneの実視認でmust 0・should 0となった。これはコードと全sceneの限定判定であり、本文併読・拡大・全体回帰・性能・公開の判定はまだ含まない。

正式なローカルEdge全体回帰は333成功・失敗0・5 skip（計338件）。skipは通常のproduction buildに含まれない音声専用fixtureの5件で、図解の省略はない。D1全16ケースが成功した。この実行はβを実際のアクセシブル名で操作する初期kit版であり、後から追加したselectorと全段階の交差検査は最終版のEdge 3/3で成功した。最終版WebKitはD1の16件と数式の26件、計42/42が成功した。βの21状態とラベル作成者の10状態も確認した。いずれも同じ製品入力・静的buildを使い、kitの検査追加前後を混同しない。

独立したローカル性能計測では、1440×1000のEdge・帯域制限なしで、記事固有JavaScriptのgzip合計26,805 B、共通部分21,892 B、CLS 0、3図の初回操作反映12.8〜13.5 ms、描画間隔p95 7.1〜7.2 msだった。入力9記事・HTML9本・BUILD_IDの前後一致を確認した。script/style/fontの失敗、console error、page errorは0。既存のHTML/Nextテキストに対するfetch中断30件は別記録に保持し、原因や終了タイミングを断定しない。これは当該PCのローカル計測であり、公開性能や物理端末の受入ではない。

中断後の2026-09-30にGitHubを再照合し、`origin/main`は基点の`5940334a6fd3aab8178cfeb8746a58c8b937d390`のまま、対象branchのPRは未作成だった。製品ソースの追加変更は行っていない。生ログ・helper・初回404・kit版の違い・実視認の対象は[ローカル証拠](alignment-local-evidence/README.md)と[別PC向け実装記録](alignment-portable-implementation.md)へ保存する。

2026-09-30T09:15:22.545Zに[独立総合レビュー](alignment-local-evidence/final-independent-review.json)がapproved / low・must 0・should 0となった。実視認は168枚（Edge84・WebKit84、全scene140・viewport28）。生成した画像総数と区別して全対象を保存する。9記事の現行入力・HTML・build一致を確認し、review/localゲートを同版へ更新した。旧8記事は本文と固有入力の不変、共有5ファイルの追加差分、PR #62独立公開承認、今回のEdge全体回帰を組み合わせた限定継承であり、新たな全WebKit・全画像レビューとは扱わない。公開ゲートは更新せず、実際のCI/Pagesと公開両engine・独立公開レビューを待つ。

## PRと依存パッチ

固定tree `0e13b57f4ec4d3b956b6d7a28d60f90ebe1c6eaa`、digest `40cc21197f9e144cb13356da00120c664309afbf022124b6f559ecddfbeaac03` に対し、T-1の両記事の正式独立レビューは2026-09-30T09:25:15Zにapproved / low・must 0・should 2となった。shouldは既存チェックリストを設計記録の確認へ結び付ける後続案で、今回の本文非増量方針に従って見送る。レビューと初回CIログは[CI証拠](alignment-ci-evidence/README.md)に保存した。manifestのレビュー欄を反映した最終tree `9176283f6adafa943d16fda6dce28534b433de9c` でharness policyを通過し、head `e00d6ee700d27816a94e151c4d0d2bfdc0b9a1a4` の[PR #63](https://github.com/pero3dev/ai-agent-library/pull/63)を作成した。

[初回CI](https://github.com/pero3dev/ai-agent-library/actions/runs/36696416442)は、lintとbuildの依存監査で`brace-expansion`のhigh脆弱性を検出して失敗した。サイト単体392件は成功したが、監査後の静的buildには進んでいない。rootとwebsiteのlockfile内の同パッケージを互換パッチへ更新し、検証し直す。ローカルの外部監査は最初に自動承認レビューで拒否されたが、両lockfileが公開mainと完全一致する実取得証拠を追加した後に承認され、実行できた。元の失敗ログ・旧ローカル承認を上書きせず、新しい入力版の判定を別に残す。

更新は両lockfileの`brace-expansion` 5.0.9→5.0.12のversion・resolved・integrityだけで、package.json・他依存・記事・図解・公開kitは不変。両環境の`npm ci`、high監査、`npm ls`は成功した。rootの対象外moderate 3件は不変、websiteは検出0件。root `npm run check`も再度成功（485件中484成功・実音声変換1 skip、本文215、リンク380ファイル5848件）。公開条件のclean buildは223 routes・230 HTMLで成功し、BUILD_IDは`1kDzaUHLTh2VduCcoTkhj`となった。[依存更新の証拠](alignment-dependency-evidence/README.md)へ初回監査・公開mainとの照合・パッチ・再検証を保存する。

2026-09-30T09:55:15.572Zの[独立補足レビュー](alignment-dependency-evidence/final-review.json)はapproved / low・must 0・should 0。比較対象419ファイルでは、230 HTMLがBUILD_IDの文字列を除いて一致し、186資産は同じパス・バイト、3 manifestはBUILD_IDを含むディレクトリ名だけが変わった。出力全2551ファイルの残り2132ファイルを旧版と比較したとは扱わない。実際のリンクによるSPA遷移をEdge/WebKitそれぞれ9記事で確認し、図解の停止・次段階・読書連動への復帰、各engineの83 RSC応答と8 WOFF2も照合した。

WebKitの最終補助検査は成功。Edgeは既存ページへのfetch中断を拒否したfailed原本を保持する。独立レビューが39件の中断先すべての実在HTMLとhashを確認し、失敗後に未実行だった3検査を生データから補完して承認した。中断の原因やタイミングは断定しない。critical resourceの失敗、console/page errorはない。旧168画像・性能値は出力同一性と今回の動作確認による限定継承で、新しい実視認・性能再実行は0件。9記事のreview/localゲートを新入力へ更新し、publicゲートは実公開の検証まで更新しない。

### PR #63の最終提出とマージ

固定tree `ac7e30d48f46754893688afac7cb8aebbcf98b38`、digest `700ee5d2fdd47618af83efe03afcd04327718f7d36654c5b2c5cae22c0187b43`は2026-09-30T10:03:36Zに正式記事の限定再レビューを通過（approved / low、新規must 0・should 0）。T-1の2記事・一次根拠は前回候補から不変で、前回should 2は後続候補として保持する。[最終提出の原本](alignment-submission-evidence/README.md)に、最終レビュー、旧headを返したpush直後の応答と再取得した正しい応答を区別して保存した。

manifestの記録欄を反映したtree `d4f6f0c5abd70b3f37a91f088d9c2cd453b8e93c`でpolicyを通過し、追加head `b7b6ac034716fc38b351266b87bb8b38f02dd2aa`を提出した。[PR CI](https://github.com/pero3dev/ai-agent-library/actions/runs/36700305122)を含む全11チェックが成功（PRのdeployは既定skip）。2026-09-30T10:23:04Zにactual merge `b6686c92dbb678ea8b94eb12df37a33207c4c84b`へsquashマージされ、実merge treeと最終tree、指定した件名・本文・名義の完全一致を確認した。公開受入はmain CI・Pagesと独立公開確認の後に別途記録する。

[main CI](https://github.com/pero3dev/ai-agent-library/actions/runs/36702086701)と[Pages deploy](https://github.com/pero3dev/ai-agent-library/actions/runs/36702086701/job/109848894912)の実successを確認した。独立担当はactual mergeの137 Git blobと現行ファイルの完全一致、actual mergeから再計算した9 inputDigestとローカル承認値の一致を確認した。公開HTML・ブラウザー・画像の受入は、この入力照合とは別に進める。

mainの実ログでもsite単体392/392、browser 333成功・規定5 skip（13.2分）、Linux root 485件中476成功・条件付き9 skip・失敗0を確認した。同runのPages artifact `11090349965`、BUILD_ID `Iytr-Mx-iwwzxrZ8pUUHR`から9記事HTMLを取得し、collectorの取得前後照合と独立したtar member・HTML hashの照合に成功した。

### PR #63の公開受入

2026-09-30T11:18:33.154Zの[独立公開レビュー](alignment-public-evidence/final-review.json)はapproved / low・must 0・should 0。Edgeは107/107成功。WebKit初回は106/107で、事前学習の1440×1000明のPPLボタンに15秒の操作待ちtimeoutを記録した。このfailed原本は保持し、両全件実行の終了後、callback・assertion・通常click・timeoutを変えない独立承認済みhelperで対象23段階と資源確認の2ケースだけを1回再実行し、2/2成功を確認した。これは合成受入であり、WebKit全107件の再走や初回の具体原因の解明を主張しない。

実視認は137枚（Edge 66・WebKit 71、scene 92・viewport 45）。D1の両engine全15段階、β両端、AI選好、6画面条件の代表、拡大・noJS・print、旧8記事の代表、失敗直前2枚と限定repeat4枚を含む。全生成1777枚とは区別する。公開HTMLと全75/75/52配信資産、観測resource4650/4658/52を同CI artifactへ照合した。新しい実機iPhone・screen reader・物理印刷・学習効果の受入は行っていない。

[移管可能な公開証拠](alignment-public-evidence/README.md)に266原本・137実視認PNG・相対索引を保存し、旧絶対パスやpending/failedも原byteで保持した。[保存物の独立検査](alignment-public-archive-review.md)もapproved / low・must 0・should 0となった。9記事の現行publicゲート、9個のPR #63記事別snapshot、[9 completeの固定結果](diagram-acceptance-pr63.json)を保存した。次は[D2推論モデル](reasoning-reading-diagrams.md)。P1全15記事の公開受入で止め、P2へ進まない。
