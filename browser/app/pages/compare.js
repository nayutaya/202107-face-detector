import { useState, useEffect } from "react";
import Dropzone from "react-dropzone";
import Head from "next/head";

import CroppedFaceImage from "../components/CroppedFaceImage";

function getDataUrl(file) {
  return new Promise((resolve, reject) => {
    if ( file == null ) {
      resolve(null);
    } else {
      const fileReader = new FileReader();
      fileReader.onloadend = () => {
        resolve(fileReader.result);
      };
      fileReader.readAsDataURL(file);
    }
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

async function compare(body) {
  const param = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
  const response = await fetch("/api/compare", param);
  return await response.json();
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

  const response = await compare({embeddings, pairs});
  response.response.pairs.forEach((pair) => {
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

// REF: https://stackoverflow.com/a/27263918
function makeHeatMapColor(value) {
  const clamped = Math.max(0.0, Math.min(1.0, value));
  const hue = (1.0 - clamped) * 240;
  return "hsl(" + hue.toString() + ", 50%, 75%)";
}

function Matrix({ imageUrl1, imageUrl2, result1, result2, matrix }) {
  const faces1 = (result1 == null ? [] : result1.response.faces);
  const faces2 = (result2 == null ? [] : result2.response.faces);
  return (
    <table border={1}>
      <tbody>
        <tr>
          <td colSpan={2} rowSpan={2}></td>
          <th
              colSpan={result2 == null ? 1 : Math.max(1, faces2.length)}>
            画像2
          </th>
        </tr>
        <tr>
          {result2 == null ? (
            <td>{imageUrl2 == null ? "未選択" : "解析中..."}</td>
          ) : (
            faces2.length < 1 ? (
              <td>未検出</td>
            ) : (
              faces2.map((face, index2) => (
                <td key={index2}>
                  <CroppedFaceImage
                    imageWidth={result2.response.width}
                    imageHeight={result2.response.height}
                    imageUrl={imageUrl2}
                    faceWidth={100}
                    faceHeight={100}
                    faceBoundingBox={face.boundingBox} />
                </td>
              )
            )
          ))}
        </tr>
        {result1 == null ? (
          <tr>
            <th>画像1</th>
            <td>{imageUrl1 == null ? "未選択" : "解析中..."}</td>
          </tr>
        ) : (
          faces1.length < 1 ? (
            <tr>
              <th>画像1</th>
              <td>未検出</td>
            </tr>
          ) : (
            faces1.map((face, index1) => (
              <tr key={index1}>
                {index1 != 0 ? null : (
                  <th rowSpan={faces1.length}>画像1</th>
                )}
                <td>
                  <CroppedFaceImage
                    imageWidth={result1.response.width}
                    imageHeight={result1.response.height}
                    imageUrl={imageUrl1}
                    faceWidth={100}
                    faceHeight={100}
                    faceBoundingBox={face.boundingBox} />
                </td>
                {matrix == null ? (
                  index1 != 0 ? null : (
                    <td
                        colSpan={result2 == null ? 1 : faces2.length}
                        rowSpan={result1.response.faces.length}
                        align="center"
                        valign="middle">
                    </td>
                  )
                ) : (
                  faces2.map((face, index2) => (
                    <td
                        key={index2}
                        align="center"
                        style={{
                          backgroundColor: makeHeatMapColor(matrix[index1][index2]),
                        }}>
                      {matrix[index1][index2].toFixed(2)}
                    </td>
                  ))
                )}
              </tr>
            )
          )
        ))}
      </tbody>
    </table>
  );
}

function ImageSelector({ onDrop, imageUrl }) {
  return (
    <Dropzone onDrop={onDrop}>
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
                ...makeBackgroundImageStyle(imageUrl),
              }}>
            <input {...getInputProps()} />
          </div>
        </div>
      )}
    </Dropzone>
  );
}

export default function Page() {
  const [imageFile1, setImageFile1] = useState(null);
  const [imageFile2, setImageFile2] = useState(null);
  const [imageUrl1, setImageUrl1] = useState(null);
  const [imageUrl2, setImageUrl2] = useState(null);
  const [result1, setResult1] = useState(null);
  const [result2, setResult2] = useState(null);
  const [matrix, setMatrix] = useState(null);

  useEffect(async () => {
    const imageUrl = await getDataUrl(imageFile1);
    setImageUrl1(imageUrl);
  }, [imageFile1]);

  useEffect(async () => {
    const imageUrl = await getDataUrl(imageFile2);
    setImageUrl2(imageUrl);
  }, [imageFile2]);

  useEffect(async () => {
    setMatrix(null);
    setResult1(null);
    if ( imageFile1 == null ) return;
    const result = await detect(imageFile1);
    setResult1(result);
  }, [imageFile1]);

  useEffect(async () => {
    setMatrix(null);
    setResult2(null);
    if ( imageFile2 == null ) return;
    const result = await detect(imageFile2);
    setResult2(result);
  }, [imageFile2]);

  useEffect(async () => {
    if ( result1 == null ) return;
    if ( result2 == null ) return;
    const embeddings1 = result1.response.faces.map((face) => face.embedding);
    const embeddings2 = result2.response.faces.map((face) => face.embedding);
    const matrix = await makeMatrix(embeddings1, embeddings2);
    setMatrix(matrix);
  }, [result1, result2]);

  return (
    <>
      <Head>
        <title>face-detector | compare</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h1>入力</h1>
      <h2>画像1</h2>
      <ImageSelector
          onDrop={(acceptedFiles) => setImageFile1(acceptedFiles[0])}
          imageUrl={imageUrl1} />
      <h2>画像2</h2>
      <ImageSelector
          onDrop={(acceptedFiles) => setImageFile2(acceptedFiles[0])}
          imageUrl={imageUrl2} />
      <h1>結果</h1>
      <Matrix
          imageUrl1={imageUrl1}
          imageUrl2={imageUrl2}
          result1={result1}
          result2={result2}
          matrix={matrix} />
    </>
  );
}
