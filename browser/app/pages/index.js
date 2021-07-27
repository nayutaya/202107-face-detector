import Dropzone from "react-dropzone";
import Head from "next/head";
import { useState } from "react";

function BoundingBox({ face, color }) {
  const bbox = face.boundingBox;
  const width = bbox.x2 - bbox.x1;
  const height = bbox.y2 - bbox.y1;
  return (
    <rect
        x={bbox.x1}
        y={bbox.y1}
        width={width}
        height={height}
        stroke={color}
        fill="none" />
  );
}

function ScoreBar({ face, color }) {
  const bbox = face.boundingBox;
  const width = bbox.x2 - bbox.x1;
  return (
    <rect
        x={bbox.x1}
        y={bbox.y1}
        width={width * face.score}
        height={3}
        stroke="none"
        fill={color} />
  );
}

function Landmarks({ points, color }) {
  return (
    <g>
      {points.map((p, index) => (
        <circle
            key={index}
            cx={p.x}
            cy={p.y}
            r={2}
            stroke="none"
            fill={color} />
      ))}
    </g>
  );
}

function KeyPoints({ keyPoints, color }) {
  return (
    <g>
      {keyPoints.map((p, index) => (
        <circle
            key={index}
            cx={p.x}
            cy={p.y}
            r={2}
            stroke="none"
            fill={color} />
      ))}
    </g>
  );
}

function Attributes({ face, color }) {
  const bbox = face.boundingBox;
  const x = bbox.x1 + 2
  const y = bbox.y1 - 8;
  const fontSize = 16;
  const label = `Sex: ${face.attributes.sex} / Age: ${face.attributes.age}`;
  return (
    <g>
      <text
          x={x}
          y={y}
          fontSize={fontSize}
          stroke="white" strokeWidth={3}>
        {label}
      </text>
      <text
          x={x}
          y={y}
          fontSize={fontSize}
          fill={color}>
        {label}
      </text>
    </g>
  );
}

function Face({ face, showsScore = true, showsLandmarks2d106 = true, showsLandmarks3d68 = true, showsKeyPoints = true, showsAttributes = true }) {
  const color = {M: "#6666CC", F: "#CC6666"}[face.attributes.sex];
  return (
    <g>
      <BoundingBox face={face} color={color} />
      {!showsScore ? null :
        <ScoreBar face={face} color={color} />
      }
      {!showsLandmarks2d106 ? null :
        <Landmarks points={face.landmarks["2d_106"]} color={"red"}/>
      }
      {!showsLandmarks3d68 ? null :
        <Landmarks points={face.landmarks["3d_68"]} color={"blue"}/>
      }
      {!showsKeyPoints ? null :
        <KeyPoints keyPoints={face.keyPoints} color={"green"} />
      }
      {!showsAttributes ? null :
        <Attributes face={face} color={color} />
      }
    </g>
  );
}

function Faces({ faces }) {
  return (
    <g>
      {faces.map((face) => (
        <Face face={face} />
      ))}
    </g>
  );
}

function Result({ image, result }) {
  const response = result.response;
  return (
    <div>
      <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          viewBox={`0 0 ${response.width} ${response.height}`}>
        <image
            x={0}
            y={0}
            width={response.width}
            height={response.height}
            href={image.dataUrl} />
        <Faces faces={response.faces} />
      </svg>
    </div>
  );
}

export default function Page() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);

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
      setResult(null);
      // TODO: replace to internal API.
      fetch("http://192.168.1.204:8000/detect", param)
        .then((response) => response.json())
        .then((result) => {
          console.log({result});
          setResult(result);
        });
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
      {image === null || result === null ? null :
        <Result image={image} result={result} />
      }
    </div>
  );
}
