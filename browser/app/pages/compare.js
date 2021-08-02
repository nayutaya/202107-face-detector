import { useState, useEffect } from "react";
import Dropzone from "react-dropzone";
import Head from "next/head";

import CroppedFaceImage from "../components/CroppedFaceImage";

function readFile(file) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onloadend = () => {
      resolve({file, dataUrl: fileReader.result});
    };
    fileReader.readAsDataURL(file);
  });
};

async function detect(file) {
  const formData = new FormData();
  formData.append("file", file);
  const param = {
    method: "POST",
    body: formData,
  };
  const response = await fetch("/api/detect", param);
  return await response.json();
}

function compare(body) {
  const param = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
  return fetch("/api/compare", param);
}

async function makeMatrix(embeddings1, embeddings2) {
  const embeddings = [].concat(embeddings1).concat(embeddings2);
  const pairs = [];
  const matrix = [];
  for ( let i = 0; i < embeddings1.length; i++ ) {
    const row = [];
    for ( let j = 0; j < embeddings2.length; j++ ) {
      pairs.push({
        index1: i,
        index2: j + embeddings1.length,
      });
      row.push(null);
    }
    matrix.push(row);
  }

  const response1 = await compare({embeddings, pairs});
  const response2 = await response1.json();
  response2.pairs.forEach((pair) => {
    matrix[pair.index1][pair.index2 - embeddings1.length] = pair.similarity;
  });

  return matrix;
}

function makeBackgroundImageStyle(imageUrl) {
  if ( imageUrl == null ) return {};
  return {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
  };
}

function ImageSelector({ onDrop, onLocallyLoaded }) {
  const handleFile = (acceptedFiles) => {
    onDrop(acceptedFiles);
    if ( acceptedFiles.length < 0 ) return;
    readFile(acceptedFiles[0]).then(({ file, dataUrl }) => {
      onLocallyLoaded({
        file,
        dataUrl,
      });
    })
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

  const backgroundStyle1 = makeBackgroundImageStyle(image1.dataUrl);
  const backgroundStyle2 = makeBackgroundImageStyle(image2.dataUrl);

  useEffect(async () => {
    if ( result1 == null ) return;
    if ( result2 == null ) return;
    const embeddings1 = result1.response.faces.map((face) => face.embedding);
    const embeddings2 = result2.response.faces.map((face) => face.embedding);
    const matrix = await makeMatrix(embeddings1, embeddings2);
    setMatrix(matrix);
  }, [result1, result2]);

  const handleImage1 = async (image) => {
    setImage1(image);
    setResult1(null);
    const result = await detect(image.file);
    setResult1(result);
  };
  const handleImage2 = async (image) => {
    setImage2(image);
    setResult2(null);
    const result = await detect(image.file);
    setResult2(result);
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
