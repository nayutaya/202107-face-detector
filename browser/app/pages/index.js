import Dropzone from "react-dropzone";
import Head from "next/head";
import { useState } from "react";

function BoundingBox({ face, color, size = 0.2, strokeOpacity = 0.7, strokeWidth = 3 }) {
  const { x1, y1, x2, y2 } = face.boundingBox;
  if ( false ) {
    return (
      <rect
          x={x1}
          y={y1}
          width={x2 - x1}
          height={y2 - y1}
          stroke={color}
          fill="none" />
    );
  } else {
    const dx = (x2 - x1) * size;
    const dy = (y2 - y1) * size;
    return (
      <path
          d={
            `M${x1},${y1 + dy} L${x1},${y1}  L${x1 + dx},${y1}`
            + ` M${x2},${y1 + dy} L${x2},${y1}  L${x2 - dx},${y1}`
            + ` M${x1},${y2 - dy} L${x1},${y2}  L${x1 + dx},${y2}`
            + ` M${x2},${y2 - dy} L${x2},${y2}  L${x2 - dx},${y2}`
          }
          stroke={color}
          strokeOpacity={strokeOpacity}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="none" />
    );
  }
}

function ScoreBar({ face, color, height = 4, padding = 3, strokeWidth = 1, strokeOpacity = 0.7, fillOpacity = 0.7 }) {
  const { x1, y1, x2, y2 } = face.boundingBox;
  const width = x2 - x1;
  return (
    <g>
      <rect
          x={x1 + padding}
          y={y1 + padding}
          width={width - padding * 2}
          height={height}
          stroke="white"
          strokeWidth={strokeWidth}
          strokeOpacity={strokeOpacity}
          fill="none" />
      <rect
          x={x1 + padding}
          y={y1 + padding}
          width={(width - padding * 2) * face.score}
          height={height}
          fill={color}
          fillOpacity={fillOpacity} />
    </g>
  );
}

function KeyPoints({ points, color, radius = 2, fillOpacity = 0.5 }) {
  return (
    <g>
      {points.map((p, index) => (
        <circle
            key={index}
            cx={p.x}
            cy={p.y}
            r={radius}
            stroke="none"
            fill={color}
            fillOpacity={fillOpacity} />
      ))}
    </g>
  );
}

function Attributes({ face, color, fontSize = 16, opacity = 0.8, strokeWidth = 3 }) {
  const { x1, y1, x2, y2 } = face.boundingBox;
  const x = x1;
  const y = y1 - 6;
  const label = `Sex: ${face.attributes.sex} / Age: ${face.attributes.age}`;
  return (
    <g>
      <text
          x={x}
          y={y}
          fontSize={fontSize}
          stroke="white"
          strokeWidth={strokeWidth}
          strokeOpacity={opacity}
          fill="none">
        {label}
      </text>
      <text
          x={x}
          y={y}
          fontSize={fontSize}
          stroke="none"
          fill={color}
          fillOpacity={opacity} >
        {label}
      </text>
    </g>
  );
}

function Face({ face, color, showsBoundingBox = true, showsScore = true, showsLandmarks2d106 = true, showsLandmarks3d68 = true, showsKeyPoints = true, showsAttributes = true }) {
  return (
    <g>
      {!showsBoundingBox ? null :
        <BoundingBox
            face={face}
            color={color} />
      }
      {!showsScore ? null :
        <ScoreBar
            face={face}
            color={color} />
      }
      {!showsLandmarks2d106 ? null :
        <KeyPoints
            points={face.landmarks["2d_106"]}
            color={"#CC0000"} />
      }
      {!showsLandmarks3d68 ? null :
        <KeyPoints
            points={face.landmarks["3d_68"]}
            color={"#0000CC"} />
      }
      {!showsKeyPoints ? null :
        <KeyPoints
            points={face.keyPoints}
            color={"#009900"} />
      }
      {!showsAttributes ? null :
        <Attributes
            face={face}
            color={color} />
      }
    </g>
  );
}

function Faces({ faces }) {
  const colors = {M: "#6666CC", F: "#CC6666"};
  return (
    <g>
      {faces.map((face, index) => (
        <Face
            key={index}
            face={face}
            color={colors[face.attributes.sex]}/>
      ))}
    </g>
  );
}

function Result({ image, result }) {
  const response = result.response;
  return (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        viewBox={`0 0 ${response.width} ${response.height}`}
        width={response.width}
        height={response.height}>
      <image
          x={0}
          y={0}
          width={response.width}
          height={response.height}
          href={image.dataUrl} />
      <Faces
          faces={response.faces} />
    </svg>
  );
}

export default function Page() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);

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
      <h1>入力</h1>
      <p>JPEG形式の画像ファイルを枠内にドラッグ＆ドロップするか、枠内をクリックして画像ファイルを選択してください。</p>
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
                  width: "400px",
                  height: "300px",
                  ...backgroundStyle
                }}>
              <input {...getInputProps()} />
            </div>
          </div>
        )}
      </Dropzone>
      {image === null ? null : (
        <>
          <h1>認識結果</h1>
          {result === null ? (
            <p>解析中...</p>
          ) : (
            <Result
                image={image}
                result={result} />
          )}
        </>
      )}
    </div>
  );
}
