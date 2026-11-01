# タグ検索の前面readinessと公開reveal

2026-11-02 JST、freeze UTC `2026-11-01T16:49:01Z`。実main `36bec68537d741492f942c076469bb06d177f69a` から、既存folder-cancelケースの準備だけを変更する私有候補である。製品修正や原因解決とは扱わず、新SDK・Hosted・通常mainでの効果は未受入である。

## 目的と所有範囲

ユーザーの自律TODO実施依頼とRootの限定指示に基づき、[Published UI](../../../ios/AILibraryUITests/PublishedReaderUITests.swift)の1ファイル、新しい本記録2と索引2を所有する。既存 `testCancelContentFolderPickerPreservesFiltersAndReadingAndAllowsMoreActions` の1 callだけを明示opt-inし、既存setterのdefaultはfalseにする。他ケースの経路・製品Swift17本・共有geometry・workflowを変更しない。Code1→Docs4の通常2commitを予定し、Doc323は未採用のためその記録／索引変更を混ぜない。

## 実際に停止した範囲

[新main36のFull A初回](https://github.com/pero3dev/ai-agent-library/actions/runs/41322296116/job/124894887634)は実18件中17成功・1失敗だった。該当caseは105.428秒で、call994から `setLearningTagAndArticleQuery` の372行へ入り、「タグを検索」がexistsを返した後の15秒hittable待機で停止した。記事query設定・More Actions・folder picker提示・Cancelには未到達である。raw2,187,498バイトのSHA256は `6b4bdc2dcf94fbf0ccf8aaa2c70a0f7d10314b33132633d22f21457806ca8b03`。Root observerの保存済み分類SHA256 `7389b0a26fc5d9a95cf12c56c5a5af00a1638f14b5b6e99e6c43f673bb27a7d6` と実rawをデータとして照合し、実traceの一次解析は再実行していない。

timeout後のsequential geometryではhittable=trueが記録されたが、それは期限内成立や原因の証明ではない。OS・製品・animation・検索placement等の因果は未確定で、assertionや外部jobのretryは0である。PR322 source ad0とmain36の全2861tuple、製品Swift17本と主要UI入力は同じであり、同じsourceが同じ実行時状態を保証するとは扱わない。以前のPR成功を新helperの成功へ代用しない。

## 準備だけに加える変更

[TagPicker](../../../ios/AILibrary/Sources/NativeLearningViews.swift)はsheet内のNavigationStack／List、title「タグ」、prompt「タグを検索」、Close「閉じる」を持ち、検索placementを明示していない。既存tag helperはタグボタンのreveal後、検索のexists10秒と受動hittable15秒だけを待っていた。同じPublished fileのarticle-search helperは非hittable時に最大8回の公開revealを持つ。

新helperはタグボタンtap直後に25秒の一つの単調期限を作り、最初のcontext／existenceは10秒以内、その後の最大8 swipeDown・positive wait・tap直前のTag contextとtyping前の同window検索の再確認も残時間を共有する。既存10＋15秒の総枠、caseやstep/jobの上限は増やさない。OSやAX getterの厳密な強制壁時計上限を保証する設計ではない。r2で見つかったP2へ追随し、context／usableのgetterが時間を消費した場合も、初期positive返却・swipe直前・最終positive返却の3箇所で期限を再確認する。r2の封印票は未採用の履歴へ保持し、上限やcase条件は変更しない。

exact「タグ」のNavBarが1つ、同bar内のexact「閉じる」が1つでenabled／hittable・有限frame内、当該barを持つ有限app内windowが1つであることを確認する。同一window内のexact identifierまたはlabel「タグを検索」が1つだけであることを確認し、操作する検索はfinite／nonemptyでapp/window内・enabled／hittableとする。root `learning-tag-picker` のAX kindやListのcollection型は未観測なので仮定しない。

検索が使える場合はrevealしない。使えない場合だけ、前面Tag／Close／windowを再確認してpublic `app.swipeDown(.slow)` を最大8回行い、直後にも同じcontextと残時間を確認する。predicate内では操作せず、最後のpositive waitとtap直前には同じ一意Tag contextを確認する。search tap後はNavBar／Closeが変わる可能性を未観測のまま残し、typing前は自身がtapした同一window内のexact唯一searchのexists／enabled／finite／onscreen／hittableと残時間だけを再確認する。曖昧・Close非hittable・context変更・期限切れはthrowで停止し、別画面・座標・global firstMatch・失敗assertionの再試行へfallbackしない。

失敗時だけphase／count等の小contextをUTF-8最大1024バイトで添付し、既存screenshot captureを1回行う。wait predicate内でdebugDescriptionやhierarchyを取得せず、後の画面を期限内成功へ読み替えない。

## 保持する検証と未完了

元の保存baseline、tag transformer／query Transformer、filter summary／count／value、folder Cancel、2回目More Actions／About、filter解除後の同suite再起動・公開Resume、しおりと非先頭「自己注意の数式」の完全表示を保つ。元26件のSourceCaseInventoryはNative3／Published17／Geometry6のclass単位で一致し、固定workflowの宣言26と照合した。新helper除去・default flag／legacy branch／1 callの逆変換で元UI全文へ一致し、他ケースと無関係helperを保持した。

作者はread-only GitとPythonデータ照合だけを実行した。新SDK／Node／Simulator／UI／API／download／Git書込は0。Rootの新構文・SDK・形式・独立レビュー、新headの必要CIと実readiness／reveal、通常main採用は後続である。実機はユーザー指定により未完了としてスキップでき、VoiceOver・provider・性能とIOS-22/25全体は未完了のまま、App0.2.28（30）・TODO32行14完了を維持する。
