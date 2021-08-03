# 202107-face-detector

InsightFaceを使った顔検出サーバの実装例です。
詳しくは以下の記事をご覧ください。

* [InsightFaceとFastAPIで顔検出サーバを作ってみた](https://zenn.dev/yuyakato/articles/6a1d8177901381)
* [InsightFaceの顔検出結果をNext.jsで可視化してみた](https://zenn.dev/yuyakato/articles/e96b9d8ec289cc)
* [InsightFaceで顔認証（特徴量抽出、比較）してみた](https://zenn.dev/yuyakato/articles/d35b185d36a33b)

## 実行手順

実行手順は以下の通りです。

```sh
docker-compose build
docker-compose up -d

curl -X POST \
  --header "Content-Type: multipart/form-data" \
  --form "file=@pakutaso_43730.jpg;type=image/jpeg" \
  http://localhost:8000/detect

curl -X POST \
  --header "Content-Type: application/json" \
  --data-binary @embeddings.json \
  http://localhost:8000/compare

open http://localhost:8001/
```

## 動作確認用の画像ファイル

動作確認用の画像ファイルは「ぱくたそ」からダウンロードしました。

* `pakutaso_5574.jpg`: [決裁権が誰にもないの写真を無料ダウンロード（フリー素材） - ぱくたそ](https://www.pakutaso.com/20141237343post-4921.html)
* `pakutaso_43730.jpg`: [顔に手を添えカメラ目線の美白女性の写真を無料ダウンロード（フリー素材） - ぱくたそ](https://www.pakutaso.com/20210219041post-33497.html)
