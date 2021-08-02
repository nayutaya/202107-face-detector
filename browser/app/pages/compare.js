import { useState, useEffect } from "react";
import Dropzone from "react-dropzone";
import Head from "next/head";

import CroppedFaceImage from "../components/CroppedFaceImage";

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
  const [result1, setResult1] = useState(null);
  const [result2, setResult2] = useState(null);
  const [matrix, setMatrix] = useState([]);

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
    const pairs = [];
    const base1 = 0;
    const base2 = embeddings1.length;
    for ( let i = 0; i < embeddings1.length; i++ ) {
      for ( let j = 0; j < embeddings2.length; j++ ) {
        pairs.push({
          index1: base1 + i,
          index2: base2 + j,
        });
      }
    }

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
      .then((response) => {
        const newMatrix = [];
        for ( let i = 0; i < embeddings1.length; i++ ) {
          const row = [];
          for ( let j = 0; j < embeddings2.length; j++ ) {
            row.push(null);
          }
          newMatrix.push(row);
        }
        response.pairs.forEach((pair) => {
          newMatrix[pair.index1][pair.index2 - base2] = pair.similarity;
        });
        setMatrix(newMatrix);
      });
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
            <CroppedFaceImage
              key={index}
              imageWidth={result1.response.width}
              imageHeight={result1.response.height}
              imageUrl={image1.dataUrl}
              faceWidth={100}
              faceHeight={100}
              faceBoundingBox={face.boundingBox} />
          ))}
        </div>
      )}
      {result2 == null ? null : (
        <div>
          {result2.response.faces.map((face, index) => (
            <CroppedFaceImage
              key={index}
              imageWidth={result2.response.width}
              imageHeight={result2.response.height}
              imageUrl={image2.dataUrl}
              faceWidth={100}
              faceHeight={100}
              faceBoundingBox={face.boundingBox} />
          ))}
        </div>
      )}
      {result1 == null || result2 == null || matrix == null ? null : (
        <table border={1}>
          <tr>
            <td></td>
            {result2.response.faces.map((face, index2) => (
              <td key={index2}>
                <CroppedFaceImage
                  imageWidth={result2.response.width}
                  imageHeight={result2.response.height}
                  imageUrl={image2.dataUrl}
                  faceWidth={100}
                  faceHeight={100}
                  faceBoundingBox={face.boundingBox} />
              </td>
            ))}
          </tr>
          {result1.response.faces.map((face, index1) => (
            <tr key={index1}>
              <td>
                <CroppedFaceImage
                  imageWidth={result1.response.width}
                  imageHeight={result1.response.height}
                  imageUrl={image1.dataUrl}
                  faceWidth={100}
                  faceHeight={100}
                  faceBoundingBox={face.boundingBox} />
              </td>
            {result2.response.faces.map((face, index2) => (
              <td key={index2} align="center">
                {((matrix[index1] || [])[index2] || 0).toFixed(2)}
              </td>
            ))}
            </tr>
          ))}
        </table>
      )}
    </>
  );
}
