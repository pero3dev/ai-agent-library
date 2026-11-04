# AppMemory観測の手動起動候補

PR #339は通常main e617へ統合済みである。今回はWindows修正PR #350の仮head `45441584…`（tree `ff8b266f…`、3268files）を親とする静的な再結合だけを準備する。actual main親・commits・公開は未確定で、以下のc2提出準備は作成時点の履歴として保持する。Code4の全文とNode54の同10入力componentを保ち、Windows記録と索引prefixを残す。旧Source8のIR・Markdown3／公式4形式成功は旧封印scopeに限り、今回の記録更新や新CI・strict TS・実dispatch Hosted・通常main・IOS-15全体の受入へ移さない。PR #350の通常squash後に同tree／全tupleをRootが確認して親を結び直す。

2026-11-04時点の別future PR提出準備。既存の3指標・各3標本を同じworkflowから採るため、`workflow_dispatch`入口だけを追加する。今のPR #339へは載せず、通常main反映後に親を結び直す。元Code4のauthor baseは`fb442c31…`のまま保ち、今回の準備baseは`c2dc6da4…`（tree`2ac6ada6…`、3266files）と区別する。4pathのbeforeは双方で一致し、afterは全byte保持する。c2のCoreTestsのtry2箇所も含め、非所有の変更は保つ。

## 起動と出所の条件

workflow、driver prepare、exporter provenanceの3実装と対象unit1本だけを変更する。dispatchはevent SHAとworkflow SHAが両方expected sourceに一致する場合だけ受け入れ、prepareではbudget作成前に拒否する。既存PRのsynthetic SHAとpush規則、固定workflow_ref prefix、run/attempt、source hash固定7path、read-only権限を保持する。新しいCLI optionやevent overrideは加えない。

2026-11-04に[GitHub events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_dispatch)と[contexts](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#github-context)の一次情報を確認した。workflow_dispatchのGITHUB_SHAは選択refのlast commit、workflow_shaはworkflowfileのcommitという各定義である。双方=expected headは今回採択した厳格なadmission policyであり、GitHubが常に等値を返すとの主張ではない。旧manual0eの受領rawには両変数が印字されず、実値は未確認。新条件の実dispatch Hosted通過は通常main反映後に確認する。

## 検証したcomponent

RootのNode24実行は49定義＋子5件の54成功・失敗0・skip0、exit0、18.093秒だった。同じ10入力・195,329Bを保持し、synthetic JSON/CSV、Node子、一時生成のfake xcrunとprepareだけを使う。実SDK・Git・App・計測・Hostedの成功ではなく、TypeScriptのstrict型検査でもない。

最初のwrapperは容量walkとtmp cleanupの競合によるFileNotFoundError、およびsandboxのPG probe EPERMで未受入として残す。R2の最初のverdictも、TAP期待と実spec reporterの差でFAILEDだった記録を変更しない。同じ出力の54成功・exit0とguard保持を別のRoot補足で受け入れ、再実行は行っていない。小さな[JSON記録](ios-app-memory-manual-dispatch.json)で各範囲を結ぶ。

計画のD1はjs-yaml実requireの段階名だけの訂正である。実際はcontent段階で、prepareではrequireしない。既存Source4と10file閉包は変更していない。旧IRのD1記述も履歴へ残す。

## 変更しない範囲と残件

AppSwift、PBX0.2.32（34）、全TODO32行16完了とcriteria、計測method/protocol、1warm-up＋3records、既存3指標、raw/typed/CSV、全resource capsと専用UUID cleanupを保持する。job40分はCI資源上限であり、製品budgetやthresholdは採択しない。計測の境界は[既存AppMemory記録](../2026-10-28/ios-app-memory-observation.md)を継承する。

提出候補はCode4→Records4の2責務、8files（新規2）、3268filesの静的準備である。strict TS・新common・新head CI、Source8最終IRと公式形式、339main後のretarget、実manual Hostedと通常main、IOS-15全体は未完了。過去のNode/計測成功を新条件へ移さず、実機・製品性能受入も行っていない。

## 2026-11-04のmain同期

PR352のhead44cdでは、必須11と自動9workflowが初回成功した。PRイベントのMemory専用caseと3指標×3標本、CSVの整合を確認した範囲であり、実manual・性能目標・実機の受入とは分ける。

並行するmain496の61pathを保持して通常merge commitで同期する。Code4のbefore/after全byteを保ち、索引は新しいiOS区分への1項目に合わせる。旧headの成功を同期後headの成功には数えず、新しい共通検査・必要CI・独立レビューを確認してからmainへ進める。App0.2.32（34）・TODO16/32と全完了条件を維持する。
