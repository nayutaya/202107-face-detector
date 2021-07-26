import Dropzone from "react-dropzone";
import Head from "next/head";
import { useState } from "react";

export default function Page() {
  const [image, setImage] = useState(null);

  // TODO: 顔検出サーバを呼び出す処理を実装する。
  // TODO: 結果を可視化する処理を実装する。

  const handleFile = (acceptedFiles) => {
    if ( acceptedFiles.length >= 1 ) {
      const imageFile = acceptedFiles[0];
      const fileReader = new FileReader();
      fileReader.addEventListener("load", () => {
        // preview.src = fileReader.result;
        setImage({
          file: imageFile,
          dataUrl: fileReader.result,
        })
      }, false);
      fileReader.readAsDataURL(imageFile);
    }
  }

  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Dropzone onDrop={handleFile}>
        {({getRootProps, getInputProps}) => (
          <div
              style={{
                width: "200px",
                height: "200px",
                border: "1px dotted black",
              }}
              {...getRootProps()}>
            <input {...getInputProps()} />
            <p>JPEG形式の画像ファイルをここにドラッグ＆ドロップするか、クリックして画像ファイルを選択してください</p>
          </div>
        )}
      </Dropzone>
      {image == null ? null :
        <div>
          <img src={image.dataUrl} />
        </div>
      }
    </div>
  );
}
