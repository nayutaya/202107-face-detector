# 202107-face-detector

InsightFaceを使った顔検出サーバの実装例です。
詳しくは以下の記事をご覧ください。

[InsightFaceとFastAPIで顔検出サーバを作ってみた](https://zenn.dev/yuyakato/articles/6a1d8177901381)

## 実行手順

実行手順は以下の通りです。

```sh
docker-compose build
docker-compose up -d

curl -X POST \
  --header "Content-Type: multipart/form-data" \
  --form "file=@43730.jpg;type=image/jpeg" \
  http://localhost:8000/detect
```

## 動作確認用の画像ファイル

動作確認用の画像ファイル`43730.jpg`は「ぱくたそ」からダウンロードしました。

[顔に手を添えカメラ目線の美白女性の写真を無料ダウンロード（フリー素材） - ぱくたそ](https://www.pakutaso.com/20210219041post-33497.html)
