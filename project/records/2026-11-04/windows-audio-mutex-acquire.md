# Windowsの音声ロック取得に対する限定再試行

2026-11-04時点の復旧候補。通常統合したmain e617で、Windowsの音声namespace並行試験1件が失敗した。実273件は271成功・1失敗・既知skip1で、同じcodeのPR成功をmain成功には転用しない。

## 事実と方針

実ログは、子がREADYを出してGOを受けた後の排他的mkdir(lock-mutex)でEPERMを記録する。「READY前終了」という初期の読み方は累積stdoutを含むエラー文の誤読であり訂正した。Windowsのdelete-pending等は仮説で、実OS原因やactorは未確定である。

共有helperはWindows・EPERM・syscall mkdir・対象mutex path完全一致を、排他的mkdirのcatch内だけでprivateなerrorとして識別し、元errorをcauseに保つ。audio側はその識別結果だけを既存の競合再試行へ加える。獲得は最大51回、10ms待機は最大50回のまま。Nodeのerror.code/path/syscall/causeの意味は[Node22の公式Errors](https://nodejs.org/docs/latest-v22.x/api/errors.html)を2026-11-04に確認した。pathの一般的な正規化を仮定せず、完全一致しないerrorは即失敗する。

処理本体やfinallyの解放errorは新分類に入らず、side effect後の処理を繰り返さない。恒久的拒否を成功や削除許可にはしない。既存のpath・PID・attempt token・ESRCHだけの旧owner回復・namespace・symlink判定、EEXISTの扱いは保持する。

## 確認と残件

3pathの前後byte・Git blob・全3266tuple・正逆patchを静的照合した。獲得の一時/恒久拒否、action/cleanup非再実行、別platform/syscall/path、guard準備、namespace/symlinkを検査する7定義とmatrix5件を追加した。元の実2子process競合とtoken/namespace回帰はbyte保持する。Code3独立静的レビューはP1/P2=0であり、新しい提出6path全体の受入とは分ける。

ローカルは空き約1.1GBのため、Node単体・strict TypeScript・npm ci/checkは未実施。新PR headのLinux/Windows CIで全検査と実2子process試験を確認する。新しいWindows成功と通常main再反映、main側の再検査は未完了で、旧失敗を再試行で消さない。

これはCIのロック取得修正であり、iOS App・PBX・記事・TODOの状態を変えない。自用iOSの現在の実装と、このmainのWindows復旧を区別する。
