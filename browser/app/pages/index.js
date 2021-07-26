import Dropzone from "react-dropzone";
import Head from "next/head";
import { useState } from "react";

export default function Page() {
  const [image, setImage] = useState(null);

  // TODO: 顔検出サーバを呼び出す処理を実装する。
  // TODO: 結果を可視化する処理を実装する。

  const handleFile = (acceptedFiles) => {
    if ( acceptedFiles.length < 0 ) return;
    const imageFile = acceptedFiles[0];
    const fileReader = new FileReader();
    fileReader.addEventListener("load", () => {
      setImage({
        file: imageFile,
        dataUrl: fileReader.result,
      });

      const formData = new FormData();
      formData.append("file", imageFile)
      const param = {
        method: "POST",
        body: formData,
      };
      // TODO: replace to internal API.
      fetch("http://192.168.1.204:8000/detect", param)
        .then((response) => response.json())
        .then((result) => console.log({result}));
    }, false);
    fileReader.readAsDataURL(imageFile);
  }

  const backgroundStyle = (image == null ? {} :
    {
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      backgroundImage: `url(${image.dataUrl})`,
      backgroundSize: "contain",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
    }
  );

  return (
    <div>
      <Head>
        <title>face-detector</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Dropzone onDrop={handleFile}>
        {({getRootProps, getInputProps}) => (
          <div
              style={{
                width: "400px",
                height: "300px",
                border: "1px dotted black",
                ...backgroundStyle
              }}
              {...getRootProps()}>
            <input {...getInputProps()} />
            <p>JPEG形式の画像ファイルをここにドラッグ＆ドロップするか、クリックして画像ファイルを選択してください</p>
          </div>
        )}
      </Dropzone>
    </div>
  );
}
