# MoE記事全体の動的図解

開始日: 2026-09-24。状態: PR #55・main CI・Pages・公開受入完了。P1の3番目の制作単位（1記事）。

## 作業契約

- 目的: 本文を増やさず、ルーティングと負荷、保持・使用する重みと通信の2図でMoEを追えるようにする。
- 根拠: [採択計画](../../plans/engineering/dynamic-diagrams.md)、[展開状況](dynamic-diagram-rollout.md)、[絵コンテ](llm-diagram-storyboards.md)。本文正本は[MoEの内部構造](../../../docs/11-llm-internals/mixture-of-experts-internals.md)。既存執筆タスクの再開ではない。
- 元HEAD: 注意変種のPR #54・main CI・Pages・公開15件成功後の `a0dc1ff67b40d7e35af87b07f34dc643f95f57dc`。所有branchは `feat/moe-reading-diagrams`。
- 所有: rootはM1 scene/model/test、dispatcher・共通CSS、ブラウザー検証、記録。scene担当はM2 scene/model/固有CSS/test。integration担当はregistry・AST・MDX安全性・記事割当/受入と対応unit。担当外の変更を戻さず調整する。
- 範囲: websiteの表示とprojectの記録。docs原文、lockfile、生成物は直接編集しない。
- 検証: 既存lockfileで準備済み依存を使用し、root check・サイト単体・公開相当export・内容/数理/AST保持・操作/表示/障害/性能・独立レビュー・実GitHub/Pages/公開を確認する。共有入力の変更後は旧2記事も再受入する。
- 終了条件: 全9 H3・33論点の割当、2図の各受入、旧2記事の退行なし、当該版の公開確認。図の本数だけで記事完了を判定しない。
- 外部操作: ユーザーの「順に作業を自律的に進めてください」に基づき、既存PUBLICリポジトリへ通常PR・CI・squashマージ・Pages・公開確認まで進める。有料API・外部登録を加えない。

## 採択した段階と本文対応

独立した事前設計を採択した。原ASTは49 root nodes、全9 H3・23本文ブロック（paragraph 11、list 7、math 4、Mermaid 1）。本文7 H3・21ブロック、注意点2 H3・2ブロックである。Mermaid・list・数式を分割せず、元ノードを一度だけ包装する。

| 図 | 段階 | H3内の段階/ブロック数 |
| --- | --- | --- |
| M1 `moe-routing-load` | 0全体、1ゲート、2top-k、3合算、4選ぶ向き、5集中、6容量、7学習 | 概要0/3、ルーティング1/2→2/1→3/2→4/1、負荷5/2→7/2 |
| M2 `moe-parameters-communication` | 0保持、1使用、2配置、3送出、4返送、5確認 | 計数0/2→1/2→2/1、運用5/1 |

M1は連続3 H3・13 body、M2は連続2 H3・6 body。間の専門化は包装外に保持する。M1容量6とM2送出3/返送4は手動・再生・静的一覧で到達する。全9 H3の33論点を動的19・本文14へ割り当て、専門化の紹介や既存の実務チェックを架空の採点へ変えない。

M1でもN=8・k=2を使用するため、sourceHeadingsに計数節を含める。M2はルーティング・負荷・専門化を意味上の依存元へ含める。非連続な依存元と実際の包装範囲を区別する。既存grouped-blocksで対応でき、新しいlist分割機能は設けない。

## 一次情報と独立した制作前レビュー

8/6段階案は作者以外が本文・絵コンテ・一次資料と照合し、approved / low、mustfixなし。これは設計の判定であり、実装・数理・画像・公開の最終承認ではない。TEMPの `p1-moe-integration-plan.md` と `p1-moe-final-plan-review.md` に設計・レビューを保存した。レビュー対象の設計SHA-256は `09c5a7c570d360818845489674ea718c3ecec2a800597246603d5f04052bde25`。

- 全専門家のsoftmax後にtop-kを選び、元のgを再正規化せず合算する。本文の式と[Switch §2.1](https://arxiv.org/html/2101.03961v3#S2.SS1)に合わせ、[Mixtral](https://arxiv.org/html/2401.04088v1#S2.SS1)の選択後softmaxと混ぜない。
- [Expert Choice](https://arxiv.org/html/2202.09368v2)はバッチで各専門家が一定quotaを選ぶ。tokenごとの選択数は可変。固定するのは入力スコア・識別子・座標で、方式によって選択maskが変わる。一般的な逐次生成への無条件な置換として示さない。
- 容量/dropの模式図は経路単位で判定し、片側をdropしても受理側の寄与を残す。残差はtokenごとに一度だけ。両経路受理・片側drop・両側dropは同一バッチから選ぶ。[GShard §2.2](https://arxiv.org/html/2006.16668v1#S2.SS2)、[Switch](https://arxiv.org/html/2101.03961v3#S2.SS2)
- 補助損失の表示だけで現在の割当てを瞬時に均等化しない。訓練の目的と一回のbatch結果を分ける。
- 総=共有部分+8専門家、active=共有部分+2専門家。共有部分を共有専門家と同一視せず、全モデル25%や速度/価格/VRAMの保証を作らない。[Mixtral §2](https://arxiv.org/html/2401.04088v1#S2)
- 全8重みはモデル全体で常駐し、各deviceに複製したように描かない。選択した表現と結果だけを送り返し、token IDとゲート合算一回を保つ。単一deviceではdevice間通信を示さない。[GShard §5.2](https://arxiv.org/html/2006.16668v1#S5.SS2)

## 受入状況

M1は独立した読み取り担当が本文・採択設計・モデル・sceneを照合し、内容/数理の範囲でapproved / low、必須修正なし。全8成分のsoftmax、元の重み、列選択の可変個数、経路ごとの容量と残差一回、補助損失で割当てを即時変更しないことを確認した。M1単体4件は成功。

M2はrootが別作者のモデル・scene・単体内容・SSR8場面の画像をレビューし、内容の必須修正なし。全8重みの保持、共有部分と共有専門家の区別、4/4配置、E2/E6への表現と結果の往復、合算一回、全モデルの25%や速度保証を示さないことを確認した。M2単体6件と作者によるSSR8場面の範囲外/console検査が成功。captionから制作IDを除き、図中文字の下限を16pxに調整した。

統合担当のサイト単体は214/214成功（skip 0）。原AST保持、無効化4組合せ、意味依存元の変更検知、3記事の受入分離を含む。上記は実サイトのブラウザー・性能・当該版の公開受入ではない。旧2記事の公開版は[注意変種PR #54](attention-variants-article-acceptance-pr54.json)・[Transformer PR #54](transformer-article-acceptance-pr54.json)へ保存した。新しい共有コード版に旧承認を自動流用しない。

## 統合とローカル検証

registry・AST包装・MDX許可props・記事受入・関連unitは、作者とは別のscene担当が独立にレビューし、approved / low、必須修正なし。固定8/6段階、全9 H3・33論点（動的19/本文14）、元ASTの保持、意味依存元、3記事の承認が新入力版へ自動継承されないことを確認した。TEMP `moe-integration-independent-review.md` に範囲と制約を記録した。

最終有効化後のサイト単体は214/214成功、skip 0（273秒）。rootの `npm run check` は成功し、単体455件中454成功・1 skip、Markdown lint・記事検証・リンク・TODO集計・harness/構造/Git形式を確認した。WindowsのGit fixtureを含む単体部分は854秒かかり、サイトビルド・ブラウザー監査と並行実行した。失敗を省略して成功扱いにしたものではない。依存は同日の既存lockfileに対する `npm ci` 済み環境を再利用した。

公開相当の `build:clean` は `STATIC_EXPORT=1`、`NEXT_PUBLIC_BASE_PATH=/ai-agent-library`、`NEXT_PUBLIC_SITE_URL=https://pero3dev.github.io/ai-agent-library` で成功。BUILD_IDは `lV-Nyn5Cfhj3n7BiXR1rX`、223/223 routes、230 HTMLのskip target、16章の索引を確認した。既存の複数lockfile検知・生成MDXのGit更新日時・日本語stemmerに関する警告は保持した。

MoEとchunk障害の重点Chromium検証は23/23成功（1.8分）。全14段階を1440明暗・1280×720・390明暗で確認し、数値/選択/容量/残差/往復ID/本文同期/拡大とfocus/小数シーク/元の見出し・4数式・Mermaid・noJS/印刷、全11sceneと共通frameの読み込み失敗時の本文保持を含む。本文・lockfileに差分はない。

TEMPの `ai-agent-library-moe-root-check.log`、`ai-agent-library-moe-website-unit.log`、`ai-agent-library-moe-build.log`、`ai-agent-library-moe-targeted.log` に実行記録を保存した。全体ブラウザーと独立した最終監査の結果は以下に記載する。

## 独立した最終監査

2026-09-24T05:57:20.530Zに、BUILD_ID `lV-Nyn5Cfhj3n7BiXR1rX` の最終exportについて3記事ともapproved / low、必須修正なしの判定を得た。内容・モデルの相互レビューに加え、画像と操作を別担当が確認した。本文統合の作者による表示監査だけで統合コードも独立レビュー済みとはせず、前節の別担当によるコード判定と組み合わせた。

| 記事 | この監査の入力digest（SHA-256） | 再受入範囲 |
| --- | --- | --- |
| Transformer | `3f7426207efb97229837fbd68e10c2f1b3246bfe77ef76c1053e1eed4e48d863` | 4図23段階・主要選択・追跡位置・本文同期・最終4画像 |
| 注意変種 | `f945ebfe8e47360aa8f26ff2a24488f47807dc3899fba3202e5cc6fc82d268a2` | 3図15段階・主要選択・本文同期・最終3画像 |
| MoE | `ea350c7677733404f545061ef021da72795c8303a8d34738c59ed8c180c31408` | 2図14段階・14中点境界・方式/容量/配置/確認対象・本文同期・noJS/印刷 |

新52枚と旧7枚、計59 PNGを監査担当が開いて目視した。rootも容量B・バッチ選択・低いPC画面の返送を確認した。図・式・本文の欠落、重なり、範囲外の文字、条件を超えた性能保証は認められなかった。容量段階の専門家箱の色はバッチ全体の使用先を示し、現在のトークンについては行の帯、停止記号、合算線、式で受理経路を区別している。

旧2記事の本文・固有renderer/model/CSS・選択されたregistryはPR #54版から差分なし。共有統合後の同じexportで、全38段階・主要selector・独立した本文同期、見出し・数式・一意ID・目次を再確認した。MoE・旧2記事・対照記事の4 HTMLとBUILD_IDは、監査前後と最終レビュー時に一致した。

最終の実時間再生・停止・画面外停止・終端再開は2図とも成功。初回監査では終端でも「図解を再生」を探して2件失敗したが、実装は「図解を最初から再生」へ名称を切り替えていた。初回記録を保持し、監査側のselectorだけを修正して該当2件を再確認した。製品は変更していない。

| 観測 | 結果と限界 |
| --- | --- |
| 操作応答 | 最終再確認24.5ms / 16.4ms、200ms以内 |
| 再生中のrAF間隔p95 | 両図14ms、32ms以内。GPU処理時間ではない |
| cold page CLS | MoE・図なし対照とも0。field CWVではない |
| gzip再圧縮 | scene+core 20,723B、shared entry 21,402B、合計42,125B。実HTTP圧縮転送量ではない |
| 図なし対照 | alignment-theoryへheavy scene/core chunk 0 |
| エラー | 予期しないconsole/HTTPエラー0。route/RSC fetchのERR_ABORTED 185件と意図したnoJS script CSP拒否1件は別に保存 |

計測はHeadless Microsoft Edge / Chromium 153.0.4234.48、rootの並行検査中のローカル観測。1440では二列と操作の到達性、1280×720では通常スクロール、390明暗では一列での本文・操作保持を確認した。390の図中文字は実表示で最小約8.9pxであり、細部の可読性をPCと同等とはしていない。物理iPhone/Safari・実スクリーンリーダー・学習効果の本人評価は未実施。

詳細はTEMP `codex-moe-audit-20260924/independent-review.md` / `independent-review.json`、初回 `audit-chromium.json`、再確認 `runtime-recheck-chromium.json`、59 PNG・印刷PDFに保存した。監査サーバー4205の停止と接続拒否を確認した。

全体Chromiumは204件中199成功・音声fixture専用5 skip（11.2分）。TEMP `ai-agent-library-moe-chromium.log` に記録した。これらのローカル結果だけでは公開完了にしない。

WebKitの主要8 specは108/108成功、skip 0（7.5分）。自己注意・注意変種・Transformer・MoE・共通図解・chunk障害・IntersectionObserverの同一通知バッチ・数式を対象にした。TEMP `ai-agent-library-moe-webkit.log` に記録した。Chromium終了を回収してから同じ4183 portで実行し、検査サーバーは終了した。

2026-09-24T06:04:29Zに、上記3入力版のreview/localゲートを記録する。publicは未確認のためnullとし、offline CLIでも3記事ともcomplete=falseであることを確認する。PR/CI/Pages/公開確認はこの後に行う。

## PR・Pages・公開受入の完了

[PR #55](https://github.com/pero3dev/ai-agent-library/pull/55)は2026-09-24 15:16:12 JSTにsquashマージされた。候補headは `01c8b16a0b52a66598ef1df6fceb889c7983da68`、公開SHAは `11ab1664fc9864b3f68c4d0eef278f629d9861b1`。必須11チェックが成功し、実マージの本文・名義・ファイルが検証済み候補と一致した。PR CIは `35963050756`。PRのdeployはmain専用条件でskipした。

[main CI](https://github.com/pero3dev/ai-agent-library/actions/runs/35963689699)と[Pagesジョブ](https://github.com/pero3dev/ai-agent-library/actions/runs/35963689699/job/107519104802)は同じSHAで成功した。GitHub APIを再取得し、deployment `6631585774` の最新successと同じdeploy job・公開URLの対応を確認した。artifact `10793283604` を独立に取得し、MoE・注意変種・Transformerの3 HTMLだけをtarから読み取った。BUILD_IDは `RFzDFlMmNV-ILc3wYCE_k`、tar SHA-256は `939c0b1a5994a379275cacee0ea1d1aabbe50119ed6d9c468c1317806fc4d121`。

| 公開HTML | CI artifactと一致したSHA-256 |
| --- | --- |
| MoE | `1f10017f31dd38bb3dd6d5a5bef802adc1f59180c9acb6b2ffc10723e1e6284c` |
| 注意変種 | `43797a4e6ad3b28ef2e16b37b8bc5ceee7f551258767a09f0be34cbb6956eb93` |
| Transformer | `361bb6016f33ef4beebf353447759236286e270b4adeefd68f10a5ab667e2e66` |

2026-09-24T06:25:58.782Zから06:28:21まで、公開HTTPと実ブラウザーの25ケースがすべて成功。52アセットのHTTP 200・MIME・非空body、3 HTMLのBUILD_IDと生バイトhash一致を確認した。MoEの14段階・全選択肢・途中境界・本文同期・手動状態の分離・キーボード・拡大とfocus復帰・実時間再生/停止/終端再開・noJS/印刷を検査した。旧注意変種の15段階・主要操作とTransformer4図、図なし記事へheavy chunkを送らないことも再確認した。

65 PNGを保存し、rootは容量B、重みの暗色、低いPC画面、狭幅の4代表画像を開いて確認した。全65枚を目視したという意味ではない。低い画面と狭幅では図全体が常に1画面へ収まるとはせず、通常スクロールで本文・操作へ到達する。物理iPhone Safari・実スクリーンリーダー・学習効果の本人評価は未実施。

詳細証拠はTEMP `ai-agent-library-moe-public/artifact-evidence.latest.json` と `public-chromium-2026-09-24T06-25-58-782Z/result.json` に保存した。3記事の公開受入を当該入力版で記録し、次の共有変更に備えて `*-article-acceptance-pr55.json` へ固定した。公開図解は5記事11図、記事全体の完成基準では3/199記事。次は生成基礎とトークン化の2記事を制作する。
