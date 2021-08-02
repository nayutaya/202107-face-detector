import { useState, useEffect } from "react";
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
function FaceImage({ width, height, dataUrl, face }) {
  const { x1, y1, x2, y2 } = face.boundingBox;
  return (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        viewBox={`${x1} ${y1} ${x2 - x1} ${y2 - y1}`}
        width={200}
        height={200}>
      <image
          x={0}
          y={0}
          width={width}
          height={height}
          href={dataUrl} />
    </svg>
  );
}

export default function Page() {
  const [image1, setImage1] = useState({file: null, dataUrl: null});
  const [image2, setImage2] = useState({file: null, dataUrl: null});
  const [result1, setResult1] = useState(null);
  const [result2, setResult2] = useState(null);

  const backgroundStyle1 = (image1.dataUrl == null ? {} :
    {
      backgroundImage: `url(${image1.dataUrl})`,
      backgroundSize: "contain",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
    }
  );
  const backgroundStyle2 = (image2.dataUrl == null ? {} :
    {
      backgroundImage: `url(${image2.dataUrl})`,
      backgroundSize: "contain",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
    }
  );

  useEffect(() => {
    if ( result1 == null ) return;
    if ( result2 == null ) return;
    const embeddings1 = result1.response.faces.map((face) => face.embedding);
    const embeddings2 = result2.response.faces.map((face) => face.embedding);
    const embeddings = [].concat(embeddings1).concat(embeddings2);
    // console.log({embeddings});
    const pairs = [];
    for ( let i = 0; i < embeddings1.length; i++ ) {
      for ( let j = 0; j < embeddings2.length; j++ ) {
        pairs.push({
          index1: i,
          index2: embeddings1.length + j,
        });
      }
    }
    console.log({pairs});

    const param = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeddings: embeddings,
        pairs: pairs,
      }),
    };
    fetch("/api/compare", param)
      .then((response) => response.json())
      .then((result) => console.log({result}));
  }, [result1, result2]);

  const handleImage1 = (image) => {
    setImage1(image);

    const formData = new FormData();
    formData.append("file", image.file);
    const param = {
      method: "POST",
      body: formData,
    };
    setResult1(null);
    fetch("/api/detect", param)
      .then((response) => response.json())
      .then((result) => setResult1(result));
  };
  const handleImage2 = (image) => {
    setImage2(image);

    const formData = new FormData();
    formData.append("file", image.file);
    const param = {
      method: "POST",
      body: formData,
    };
    setResult2(null);
    fetch("/api/detect", param)
      .then((response) => response.json())
      .then((result) => setResult2(result));
  }

  return (
    <>
      <Head>
        <title>face-detector | compare</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h1>入力</h1>
      <div
        style={{
          position: "relative",
          height: "150px",
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
              onLocallyLoaded={handleImage1} />
        </div>
        <div
            style={{
              position: "absolute",
              left: "300px",
              top: "0px",
              width: "200px",
              height: "150px",
              ...backgroundStyle2
            }}>
          <ImageSelector
              onDrop={() => setImage2({file: null, dataUrl: null})}
              onLocallyLoaded={handleImage2} />
        </div>
      </div>
      <h1>結果</h1>
      {result1 == null ? null : (
        <div>
          {result1.response.faces.map((face, index) => (
            <FaceImage
              key={index}
              width={result1.response.width}
              height={result1.response.height}
              dataUrl={image1.dataUrl}
              face={face} />
          ))}
        </div>
      )}
      {result2 == null ? null : (
        <div>
          {result2.response.faces.map((face, index) => (
            <FaceImage
              key={index}
              width={result2.response.width}
              height={result2.response.height}
              dataUrl={image2.dataUrl}
              face={face} />
          ))}
        </div>
      )}
    </>
  );
}
