# PR58 修正版の公開独立レビュー

判定: **approved / low**。必須修正 0 件。元指摘 INFERENCE-PUBLIC-01 は、今回の公開実画像で解消を確認した。

レビュー: 2026-09-24T13:28:08Z — 2026-09-24T13:46:54.818Z (UTC)。担当 /root/inference_public_review。

対象: merge 67b1309fcea8267749be6e52881f3d6a4049ae2b、main CI 36004074138、Pages job 107651395952、artifact 10809149180、BUILD_ID iRnRpU4WRuIJMMLwqJ3Cb。GitHub APIを独立照合し、成功状態と同一SHAを確認。

## 証拠と判定

- root実行の今回公開原本: 58/58 passed、失敗0、64 assets、157 PNG。2026-09-24T13:26:38.551Z — 2026-09-24T13:32:04.283Z。このレビューで58件を再実行したとは扱わない。
- CI artifactから抽出した6記事のHTMLを再ハッシュし、今回公開応答のSHA256、BUILD_ID、HTTP 200、text/htmlと一致。
- 独立公開補助検証: stage 6 draw/logitを5条件10状態で実行し10/10 passed。20 PNGを実表示。2026-09-24T13:30:13.096Z — 2026-09-24T13:30:25.904Z。
- rootの公開PNGは推論52枚すべてと旧5記事の11枚を実表示。合計83枚の画像名・SHA256を以下に保存。
- root57 network contextsでconsole/page error/不正resource/予期しないrequest failureは0。noJSで意図して遮断したscriptは5件として原本に残る。独立補助の5contextsは全error類0。

- 独立公開ブラウザーで stage 6 draw/logit を1440x1000明暗、1280x720明、390x844明暗の10状態・20枚で確認。ラベル、数値、候補A-D、選択A/B、結論を読み分けられる。棒はT=1のsoftmax確率、表示値はlogit六桁またはdraw確率二桁として一致する。
- rootの新公開58runから推論図解52枚を実表示した。23全段階、各図のPC明暗・低高さ・390幅明暗、semantic-final、expanded-selector、記録された全交差候補、noJS/printサンプルを含む。
- サンプリングはlogitから確率、top-k/top-p、残す質量での再正規化、固定uによる選択、drawとスコア差の区別を保つ。KV図は要求ごとのKVと共通重みを分け、論理反復を同じ実時間と扱わない。投機的デコードは候補/確定、貪欲と確率的受理、棄却後の補正、保証条件を分ける。量子化図は対象/bit幅/混合精度/実タスク評価を区別し、実圧縮率や品質の合否を算出しない。短い段階名とREAD結論に矛盾を認めない。
- 文字BBoxの正の交差は全件保存し、公開PNGの実字形で判断した。I1 stage6の選択A/Bと値ラベルは1440で約0.609px、1280で約0.924pxのBBox交差があるが、実際の文字は分離している。I3 stage1の確率行とprefix行4組も1280で約0.924pxのBBox交差があるが、検証ラベル、p行、prefix行の字形は接触しない。これは当該画像の判定であり一般閾値の容認ではない。
- 旧5記事は今回runの11枚をサンプル確認した。generation、tokenization、MoE、attention variants、Transformerの文字・線・数式と図の意味に今回の修正による表示回帰を認めない。
- 低高さや本文スクロール位置により一部PNGでは図の上端/下端がviewport外にある。全パネルが一画面に収まるという主張はしない。SVG内部の文字欠け、意味を混同する字形接触、横方向の欠落は確認した画像で認めない。

## 文字領域候補

rootの候補は5観測・12組。全組のSVG座標・画面px交差と判定をJSONに保持した。独立補助も全ての正のBBox交差を保持し、閾値で捨てていない。画像で実字形の分離を確認したもので、任意の許容閾値は追加していない。

## 原本保持と範囲

- 公開58件はrootが実行した今回の原本を独立査読した。独立レビュワーが58件を再実行したとは主張しない。独立に実行した公開補助検証は10状態である。
- 157枚全体のうちroot原本の63枚と、独立補助20枚を実表示した。旧記事の全画像・全段階を視覚レビューしたとは主張しない。
- Playwright Chromiumによる公開URLでの確認。実機iPhone/Safari、公開WebKit、実LLM品質・速度・GPU性能はこのレビューの対象外。
- 元PR57の公開changes_requested、修正版のローカルapproved、最初のsandbox network deniedの0ケース失敗は保持。新しい公開判定で旧記録を書き換えない。
- 旧PR57レビュー4ファイル（公開md/json、修正版ローカルmd/json）は既記録SHA256と再照合し変更なし。公開58原本のpending visualフィールドも変更せず、独立判定は本書に記録。
- 書き込みは専用TEMP証拠のみ。製品、Git、既存runner、旧結果は編集していない。

## 証拠ファイル SHA256

- C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\result.json: d6f4346386cb0cac64bd01918732a711345591c835af50c939bf164a13b88f42
- C:\Users\81906\AppData\Local\Temp\inference-label-public-review-2026-09-24T13-30-13-095Z\result.json: 08426482b9a48bd9acb0a9588601aa2998e452deaef72e88954586aa4d3e9dd9
- C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\artifact-evidence.latest.json: c7f4c5990d1d8098576c51442bb6d84446023beb11b953570e57efd9a46fe0ce
- C:\Users\81906\AppData\Local\Temp\inference-label-public-review-browser.mjs: bfe8a715efb85c7dc4d2e8f62c0c59d4a793e400c5b41f3c6b826f463f90b0f9
- C:\Users\81906\AppData\Local\Temp\inference-label-public-review-2026-09-24T13-29-12-882Z\result.json: a88ebb92070f03bf41fb43bdee43c4b950a84f2286dc9f9cee7226e7aa3c9b65

詳細JSON: C:\Users\81906\AppData\Local\Temp\inference-label-public-final-review.json (SHA256 a0d609dd9b5e663212f4f820b10af34173652e12fa9152ce60a3b6eb7b92563e)

## 実表示した画像（83枚）

1. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-sampling-stage-0.png — 8bc0c57f85dec53f019c30c0e31885e8569d4d87227d049b779f36f3c2b6288e
2. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-sampling-stage-1.png — 3724c33af34948cea8e36f2a0f95439ac2a39910bc95efae9432c5078a752987
3. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-sampling-stage-2.png — af316e890023fe6f959ca257a4177c70ad5cfa844a9548edde3bf1c8b3d3347c
4. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-sampling-stage-3.png — f47b8d1ac8ad81a35b1ba44969ea6afeecaad67dbac6c9739c2e10c5f495d7ca
5. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-sampling-stage-4.png — 2583a97d552600091594fee65e18af9bafc90325be1e2b363bdc161fe238e8eb
6. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-sampling-stage-5.png — 4198af71ed0dda0ef4f7a01dce8052b27a9979fd46f4098beceadbce84fa173b
7. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-sampling-stage-6.png — 3b868b41b17baeeaa87f00fdfa85dfd6ed88bd24bbd39f5f7b6b989101a8f9d7
8. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-sampling-semantic-final.png — 5c95cc9f97cc221298e69293a02027ab4d0628091c898005b866c0e84849348c
9. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-cache-batching-stage-0.png — 92376f647cefd5ffd615f7ddbf42342dd81bcf7044950a68d47b43321664b986
10. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-cache-batching-stage-1.png — debb00d7248f8e6eb90f6f78b8a87a73d686110f5c69486f8c78272218deebd6
11. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-cache-batching-stage-2.png — 4fba28c6204203980cf7b447fc12d47a670b78e736b2bcd70171f9546ff67a5a
12. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-cache-batching-stage-3.png — 4a2af13a2c309ec244ac4329a81dc8c6c45bdb8880a798cdef2ec270e7f34dd9
13. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-cache-batching-stage-4.png — 26e48b6386e97b7d202fbb653b500327d8f1ebbc8a0b43ad689b61989e62d3d6
14. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-cache-batching-stage-5.png — b0368a51a54bf1ba4c48a379837e9aeee383131a97bde985ebe289bab9434961
15. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-cache-batching-semantic-final.png — 419381c51c205d47650e1d18ccb915139fcb83ecd246848e8d0a34eda551bf6b
16. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-cache-batching-expanded-selector.png — 68439bcb681018c805c6853a6bb0df21469d858b0ecfc4449b40a088b43cba52
17. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-speculative-stage-0.png — c04a2963c70635f81a9fdc9a6c3863667279a15b47cd191eb3ee58d59b175ce0
18. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-speculative-stage-1.png — 6992fd283163338397ba084614a9e8a29a9d49ad3510cb200f620ddedced7b0c
19. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-speculative-stage-2.png — e58f9fa864f214125273e05a5014710bf1ea3f8e7334a75426f4e49e790fd4b4
20. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-speculative-stage-3.png — 5b0b2992b490ac9a207707855bae6f691a60ce1ec43afc4f53e51445763f95c0
21. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-speculative-stage-4.png — df65f26d6d4f473e4bae00d80c52bdd65765a3b902b87bb4b2262f3fd385273d
22. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-speculative-stage-5.png — abec3439b2136983c173643694b6f0204c38f8becd4c96cc9297e620bdc35f3b
23. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-speculative-semantic-final.png — e0bfe0d27a1d11712d88f0f42fb1f0994ee1d591a9f91cbc392d9d5e8fb74887
24. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-speculative-expanded-selector.png — 96766b2a921bf7607513b91ed8cc38e0f7026bc2554d0dea28aacdc2095f183c
25. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-quantization-stage-0.png — a2e3aa53f4373016196760e54b8c588a419330e22a891102710648aef0875efe
26. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-quantization-stage-1.png — c7cf8f611607a61194f4327518ad874854e9b1bea8b8aa667538f1fbef5c5745
27. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-quantization-stage-2.png — 519a9bf1b871d09bf56db0245c969bb420840f8a27736ca30071a5bd756f144a
28. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-quantization-stage-3.png — 8314232575bf15c4f138ef83ebff03c03852d8e124dbe9f50e83a8d72bd83477
29. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-quantization-semantic-final.png — 91d294ed204a8d283de6f773e2944eafbccdd72c23a42f76a8aabbdc41474693
30. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-quantization-expanded-selector.png — 9927e6548fd366cf32c943e41feb8732c50e4601c1f0947a4994c9ae2321a6b6
31. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-sampling-expanded-selector.png — d7f709926e1ba10529ef3bdfaa6ed39001a3a22f8a5ac933bed30c464d64e8b0
32. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-sampling-stage-6-1440x1000-dark-review-candidate.png — d3836f9caac5c668ff17bb03c606d029fab14f3d38c10468150bc31dedd2a342
33. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-speculative-stage-1-1280x720-light-review-candidate.png — 7c44a4e8b68fe9996334d5996153136705bf4c4d98bee47271bad4772bb35d84
34. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-sampling-stage-6-1280x720-light-review-candidate.png — 2654d31419c98def16e2482b59cb7133870bb35aadc7113d41c7f080da0fe41d
35. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-sampling-1280x720-light.png — 2654d31419c98def16e2482b59cb7133870bb35aadc7113d41c7f080da0fe41d
36. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-cache-batching-1280x720-light.png — 385fead43cbe2a56983bccc330127bb8ba568a501a264f6c3f467ff4dbede23c
37. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-speculative-1280x720-light.png — 1d8f8fb4737f36897c01e994f8c4e72656fca02e8ea77d8a84c7848e58145b3e
38. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-quantization-1280x720-light.png — fb8f9e2251d8ef5bd0423a6d35c3050320a6fbf38c5e2669dae5a9f629e0d4df
39. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-sampling-1440x1000-dark.png — d3836f9caac5c668ff17bb03c606d029fab14f3d38c10468150bc31dedd2a342
40. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-cache-batching-1440x1000-dark.png — 564246ca7d4d98ff34f78289a9472de5ac77fe21bc5fed129ec1cd782901d35f
41. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-speculative-1440x1000-dark.png — 81fa9af31ac66b67ecacdbb59929d554cc732998dfeff844d24bd75d2972bbb8
42. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-quantization-1440x1000-dark.png — 01fa23e7967fa49e5de494397952861a21b9c8abebbe08de489cb6874dc2eac6
43. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-no-javascript.png — b389eb8fad9b375fafe1ba0903008ceab68edd656279c1061116aef4e3996d7e
44. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-print.png — 72cc04d2862f58d3ff2cb43d49209f5ab1dad8f2cbcb8f74eb36cb51207bbc5f
45. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-sampling-390x844-light.png — 3a8a5ae4f91adb67a77b550892c4d2adba963c8c76d0b0348b518ff487ff451a
46. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-cache-batching-390x844-light.png — 15dd60df1835616096ba7edaad231ec1e6cfb879baace5404904f1455f32ddbd
47. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-speculative-390x844-light.png — 5b53d07a0040c16b27392074cca49b16185832b907d84b874e1a64599c39c824
48. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-quantization-390x844-light.png — 6b9c6a4052f4f0dd4c76784d34fe05c2245e8830325a4355c0898bbaf8560643
49. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-sampling-390x844-dark.png — 6c38a1363071861394c565d66b5d0c7ca45d03c4d5ba0e6b7f7d7dda3117183c
50. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-cache-batching-390x844-dark.png — 3bb622be1b614edb234f24b0d27cb5784681edea0af1e997f5d5edb1c8b918d4
51. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-speculative-390x844-dark.png — bb97973a337109acca3dda8785ad7340686e7e07d73a116fa0f2ecade8495549
52. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\inference-quantization-390x844-dark.png — fc8722fd253e6a5b1e652d78e9522031c04c20921907cda5f88f6e2c5dfca3cc
53. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\generation-token-loop-comparison-logit.png — 842b35df8f5baf3179f629684b77d2528fc514abe703e19a392b09daeff618db
54. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\generation-token-loop-1280x720-light.png — df4d82d1b3671731355ad01fec9c84f05eae76b94f415e121a0ac151c16dbb1f
55. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\moe-routing-load-1440x1000-dark.png — d33680d5aa1d2a1f3b4a1ab0b7e5e6dfde0a758eb38ebd45bbac4a10dc1d331f
56. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\moe-parameters-communication-1440x1000-dark.png — 8870fbbf05205c6c8e53e26b1f801e0f9c98fd7d7b8f5795bc8cc2ecf9fad467
57. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\moe-parameters-communication-1280x720-light.png — 3dd5006c319960dbb5cc84d2aa8cca33a7b170eba0b1af18b209746a83b3d331
58. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\attention-kv-sharing-4-1440-light.png — ff5125ad4cba482b9284f01b806302b285747fa7f9f124c9ff68ec7eafc05ca4
59. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\attention-compute-memory-1440x1000-dark.png — a5d962b0445a9cc62675234362372c663da91057c1d78c851212ea4165283dbb
60. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\transformer-regression-1440-light.png — 338acd2545ab396efb2f7dd7ecd612cda80498beeefaf492e2d455fb7900fc99
61. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\tokenization-counting-390x844-dark.png — 66383acc24c3c9fd3c8dd1442e5ce3597bfb966a55994cf3e33fda4f5617332c
62. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\attention-context-range-390x844-dark.png — ffaa8b4b6b7a843a0cf7f4cc64bffd80bb6c5e8990b3cc36dda4d20be7d09795
63. C:\Users\81906\AppData\Local\Temp\ai-agent-library-inference-label-public\public-chromium-2026-09-24T13-26-38-550Z\transformer-regression-390-dark.png — f1f0b3c7fed76ffd6f44933a38e9e0494a6e406d2c80b2f6b40d30307df521ba
64. C:\Users\81906\AppData\Local\Temp\inference-label-public-review-2026-09-24T13-30-13-095Z\1440x1000-light-draw-viewport.png — c2ba7a60b04ac8d1eaba2431108fbf041b37021582e6a0544894954b81c88a7e
65. C:\Users\81906\AppData\Local\Temp\inference-label-public-review-2026-09-24T13-30-13-095Z\1440x1000-light-logit-viewport.png — 4059733f6a0c526950746d47ef6ee3781a0f560e515fc329ce8578d9d0e1b6be
66. C:\Users\81906\AppData\Local\Temp\inference-label-public-review-2026-09-24T13-30-13-095Z\1440x1000-dark-draw-viewport.png — 1af3c03923e9ed9d7937167698059b27af9b9add02d3210d94dd97ec23dfb7b4
67. C:\Users\81906\AppData\Local\Temp\inference-label-public-review-2026-09-24T13-30-13-095Z\1440x1000-dark-logit-viewport.png — 775529b723cdd9eabede87d26eb30c6ac7e27090aca841627ca05568e94c28b6
68. C:\Users\81906\AppData\Local\Temp\inference-label-public-review-2026-09-24T13-30-13-095Z\1280x720-light-draw-viewport.png — 87e41955436f821c0d18147f7883f39d0c174eef534904243fedbbf460403d52
69. C:\Users\81906\AppData\Local\Temp\inference-label-public-review-2026-09-24T13-30-13-095Z\1280x720-light-logit-viewport.png — 4276695afc89e8da5e91046db82fbfd58c0e19b7ad202849acdb097573acae00
70. C:\Users\81906\AppData\Local\Temp\inference-label-public-review-2026-09-24T13-30-13-095Z\390x844-light-draw-viewport.png — 1bd5f37da44103b431295e28d6751e5827aee13b880e4e091b33ff7b4edcc143
71. C:\Users\81906\AppData\Local\Temp\inference-label-public-review-2026-09-24T13-30-13-095Z\390x844-light-logit-viewport.png — 12ea29d467f9b5506db118546f76262061caae206de50afd6323dd69c376561f
72. C:\Users\81906\AppData\Local\Temp\inference-label-public-review-2026-09-24T13-30-13-095Z\390x844-dark-draw-viewport.png — cfef73b4a6c4277ca8eeda5b6fe1a2d6d520c4c68b4fdea94c08028a95ce31c0
73. C:\Users\81906\AppData\Local\Temp\inference-label-public-review-2026-09-24T13-30-13-095Z\390x844-dark-logit-viewport.png — 3fa56f0d69e311e40932910d656c80612105cbe00a48e44f0227a3b85615b009
74. C:\Users\81906\AppData\Local\Temp\inference-label-public-review-2026-09-24T13-30-13-095Z\1440x1000-light-draw-scene.png — ac9249472856297f70b4ffce844c365f24e1c455489c903a6b590a091ab2ffdc
75. C:\Users\81906\AppData\Local\Temp\inference-label-public-review-2026-09-24T13-30-13-095Z\1440x1000-light-logit-scene.png — faf4e018d54185dc496bb4b1c9771ff2afaf88df6d95a89862bf1ab5d1f21a31
76. C:\Users\81906\AppData\Local\Temp\inference-label-public-review-2026-09-24T13-30-13-095Z\1440x1000-dark-draw-scene.png — ac9249472856297f70b4ffce844c365f24e1c455489c903a6b590a091ab2ffdc
77. C:\Users\81906\AppData\Local\Temp\inference-label-public-review-2026-09-24T13-30-13-095Z\1440x1000-dark-logit-scene.png — faf4e018d54185dc496bb4b1c9771ff2afaf88df6d95a89862bf1ab5d1f21a31
78. C:\Users\81906\AppData\Local\Temp\inference-label-public-review-2026-09-24T13-30-13-095Z\1280x720-light-draw-scene.png — 6bc852eefbb46c81341a50ce95b0d028076c7a1c3f7e3f40ccf8f65bc351a685
79. C:\Users\81906\AppData\Local\Temp\inference-label-public-review-2026-09-24T13-30-13-095Z\1280x720-light-logit-scene.png — 1f99ae9f98945f735aa7e546c155ac9d07874428dc95192c53c9515f871662b3
80. C:\Users\81906\AppData\Local\Temp\inference-label-public-review-2026-09-24T13-30-13-095Z\390x844-light-draw-scene.png — edf667059cb0d4bc164c272ac5c32d821634052404908b861fc3d4d2ede0818a
81. C:\Users\81906\AppData\Local\Temp\inference-label-public-review-2026-09-24T13-30-13-095Z\390x844-light-logit-scene.png — ace581d263124094e0f2a6851b55636c58764b44a23a976615ee56fee7dc1971
82. C:\Users\81906\AppData\Local\Temp\inference-label-public-review-2026-09-24T13-30-13-095Z\390x844-dark-draw-scene.png — edf667059cb0d4bc164c272ac5c32d821634052404908b861fc3d4d2ede0818a
83. C:\Users\81906\AppData\Local\Temp\inference-label-public-review-2026-09-24T13-30-13-095Z\390x844-dark-logit-scene.png — ace581d263124094e0f2a6851b55636c58764b44a23a976615ee56fee7dc1971
