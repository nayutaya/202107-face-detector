# 202107-face-detector

TODO: 説明文を書く。

TODO: 記事へのURLを書く。

```sh
docker-compose build
docker-compose up -d

curl -X POST \
  --header "Content-Type: multipart/form-data" \
  --form "file=@43730.jpg;type=image/jpeg" \
  http://localhost:8000/detect
```

`43730.jpg`は「ぱくたそ」からダウンロードしました。

[顔に手を添えカメラ目線の美白女性の写真を無料ダウンロード（フリー素材） - ぱくたそ](https://www.pakutaso.com/20210219041post-33497.html)
