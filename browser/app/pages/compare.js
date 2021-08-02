import { useState } from "react";
import Dropzone from "react-dropzone";
import Head from "next/head";

function ImageSelector({ onDrop, onLocallyLoaded }) {
  const handleFile = (acceptedFiles) => {
    onDrop(acceptedFiles);
    if ( acceptedFiles.length < 0 ) return;
    const imageFile = acceptedFiles[0];
    const fileReader = new FileReader();
    fileReader.addEventListener("load", () => {
      onLocallyLoaded({
        file: imageFile,
        dataUrl: fileReader.result,
      });
    }, false);
    fileReader.readAsDataURL(imageFile);
  };

  return (
    <Dropzone onDrop={handleFile}>
      {({getRootProps, getInputProps}) => (
        <div
            style={{
              border: "2px dotted black",
              padding: "5px",
            }}
          {...getRootProps()}>
          <div
              style={{
                height: "200px",
              }}>
            <input {...getInputProps()} />
          </div>
        </div>
      )}
    </Dropzone>
  )
}

export default function Page() {
  const [image1, setImage1] = useState({file: null, dataUrl: null});
  const [image2, setImage2] = useState({file: null, dataUrl: null});

  const backgroundStyle1 = (image1 == null ? {} :
    {
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      backgroundImage: `url(${image1.dataUrl})`,
      backgroundSize: "contain",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
    }
  );

  return (
    <>
      <Head>
        <title>face-detector | compare</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        style={{
          position: "relative"
        }}>
        <div
            style={{
              position: "absolute",
              left: "0px",
              top: "0px",
              width: "200px",
              height: "150px",
              ...backgroundStyle1
            }}>
          <ImageSelector
              onDrop={() => setImage1({file: null, dataUrl: null})}
              onLocallyLoaded={(image) => setImage1(image)} />
        </div>
        <div
            style={{
              position: "absolute",
              left: "300px",
              top: "0px",
              width: "200px",
              height: "150px",
            }}>
          <ImageSelector
              onDrop={() => setImage2({file: null, dataUrl: null})}
              onLocallyLoaded={(image) => setImage2(image)} />
        </div>
      </div>
    </>
  );
}
