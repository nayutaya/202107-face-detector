import { useState, useEffect } from "react";
import Dropzone from "react-dropzone";
import Head from "next/head";

import CroppedFaceImage from "../components/CroppedFaceImage";

function readFile(file) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onloadend = () => {
      resolve(fileReader.result);
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

function Matrix({ imageUrl1, imageUrl2, result1, result2, matrix }) {
  return (
    <table border={1}>
      <tbody>
        <tr>
          <td colSpan={2} rowSpan={2}></td>
          <th
              colSpan={result2 == null ? 1 : result2.response.faces.length}>
            画像2
          </th>
        </tr>
        <tr>
          {result2 == null ? (
            <td>{imageUrl2 == null ? "未選択" : "解析中..."}</td>
          ) : (
            result2.response.faces.map((face, index2) => (
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
          ))}
        </tr>
        {result1 == null ? (
          <tr>
            <th>画像1</th>
            <td>{imageUrl1 == null ? "未選択" : "解析中..."}</td>
          </tr>
        ) : (
          result1.response.faces.map((face, index1) => (
            <tr key={index1}>
              {index1 != 0 ? null : (
                <th rowSpan={result1.response.faces.length}>画像1</th>
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
                      colSpan={result2 == null ? 1 : result2.response.faces.length}
                      rowSpan={result1.response.faces.length}
                      align="center"
                      valign="middle">
                  </td>
                )
              ) : (
                result2.response.faces.map((face, index2) => (
                  <td key={index2} align="center">
                    {matrix[index1][index2].toFixed(2)}
                  </td>
                ))
              )}
            </tr>
          )
        ))}
      </tbody>
    </table>
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
    if ( imageFile1 == null ) return;
    setMatrix(null);
    setResult1(null);
    const imageUrl = await readFile(imageFile1);
    setImageUrl1(imageUrl);
    const result = await detect(imageFile1);
    setResult1(result);
  }, [imageFile1]);

  useEffect(async () => {
    if ( imageFile2 == null ) return;
    setMatrix(null);
    setResult2(null);
    const imageUrl = await readFile(imageFile2);
    setImageUrl2(imageUrl);
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
      <Dropzone onDrop={(acceptedFiles) => setImageFile1(acceptedFiles[0])}>
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
                  ...makeBackgroundImageStyle(imageUrl1),
                }}>
              <input {...getInputProps()} />
            </div>
          </div>
        )}
      </Dropzone>
      <h2>画像2</h2>
      <Dropzone onDrop={(acceptedFiles) => setImageFile2(acceptedFiles[0])}>
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
                  ...makeBackgroundImageStyle(imageUrl2),
                }}>
              <input {...getInputProps()} />
            </div>
          </div>
        )}
      </Dropzone>
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
