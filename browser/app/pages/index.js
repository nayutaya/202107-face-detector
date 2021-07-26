import Dropzone from "react-dropzone";
import Head from "next/head";

export default function Page() {
  // TODO: 画像ファイルを送信するフォームを追加する。
  // TODO: 顔検出サーバを呼び出す処理を実装する。
  // TODO: 結果を可視化する処理を実装する。
  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Dropzone onDrop={acceptedFiles => console.log(acceptedFiles)}>
        {({getRootProps, getInputProps}) => (
          <section>
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <p>Drag "n" drop some files here, or click to select files</p>
            </div>
          </section>
        )}
      </Dropzone>
    </div>
  );
}
