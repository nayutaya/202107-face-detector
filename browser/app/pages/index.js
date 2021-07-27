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

function Face({ face, color, shows }) {
  return (
    <g>
      {!shows.boundingBox ? null :
        <BoundingBox
            face={face}
            color={color} />
      }
      {!shows.score ? null :
        <ScoreBar
            face={face}
            color={color} />
      }
      {!shows.landmarks2d106 ? null :
        <KeyPoints
            points={face.landmarks["2d_106"]}
            color={"#CC0000"} />
      }
      {!shows.landmarks3d68 ? null :
        <KeyPoints
            points={face.landmarks["3d_68"]}
            color={"#0000CC"} />
      }
      {!shows.keyPoints ? null :
        <KeyPoints
            points={face.keyPoints}
            color={"#009900"} />
      }
      {!shows.attributes ? null :
        <Attributes
            face={face}
            color={color} />
      }
    </g>
  );
}

function Faces({ faces, shows }) {
  const colors = {M: "#6666CC", F: "#CC6666"};
  return (
    <g>
      {faces.map((face, index) => (
        <Face
            key={index}
            face={face}
            color={colors[face.attributes.sex]}
            shows={shows} />
      ))}
    </g>
  );
}

function CheckBox({ id, label, shows, setShows }) {
  return (
    <>
      <input id={id} type="checkbox" checked={shows[id]} onChange={(e) => {
        const copied = {...shows}
        copied[id] = e.target.checked;
        setShows(copied);
      }} />
      <label for={id}>{label}</label>
    </>
  );
}

function OverlayImage({ image, result }) {
  const [shows, setShows] = useState({
    boundingBox: true,
    attributes: true,
    score: true,
    keyPoints: true,
    landmarks2d106: true,
    landmarks3d68: true,
  });
  const response = result.response;
  return (
    <>
      <div>
        <CheckBox id="boundingBox" label="Bounding Box" shows={shows} setShows={setShows} />
        <CheckBox id="score" label="Score" shows={shows} setShows={setShows} />
        <CheckBox id="attributes" label="Attributes" shows={shows} setShows={setShows} />
        <CheckBox id="keyPoints" label="Key Points" shows={shows} setShows={setShows} />
        <CheckBox id="landmarks2d106" label="Landmarks (2D 106)" shows={shows} setShows={setShows} />
        <CheckBox id="landmarks3d68" label="Landmarks (3D 68)" shows={shows} setShows={setShows} />
      </div>
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
            faces={response.faces}
            shows={shows} />
      </svg>
    </>
  );
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

function ResultTable({ image, result }) {
  const response = result.response;
  return (
    <table border="1">
      <thead>
        <tr>
          <th rowSpan="2">No</th>
          <th rowSpan="2">Image</th>
          <th rowSpan="2">Score</th>
          <th colSpan="2">Attributes</th>
          <th colSpan="6">Bounding Box</th>
        </tr>
        <tr>
          <th>Sex</th>
          <th>Age</th>
          <th>x1</th>
          <th>y1</th>
          <th>x2</th>
          <th>y2</th>
          <th>w</th>
          <th>h</th>
        </tr>
      </thead>
      <tbody>
        {response.faces.map((face, index) => (
          <tr key={index}>
            <td className="num">{index + 1}</td>
            <td>
              <FaceImage
                width={response.width}
                height={response.height}
                dataUrl={image.dataUrl}
                face={face} />
            </td>
            <td>{face.score.toFixed(3)}</td>
            <td>{face.attributes.sex}</td>
            <td className="num">{face.attributes.age}</td>
            <td className="num">{face.boundingBox.x1.toFixed(2)}</td>
            <td className="num">{face.boundingBox.y1.toFixed(2)}</td>
            <td className="num">{face.boundingBox.x2.toFixed(2)}</td>
            <td className="num">{face.boundingBox.y2.toFixed(2)}</td>
            <td className="num">{(face.boundingBox.x2 - face.boundingBox.x1).toFixed(2)}</td>
            <td className="num">{(face.boundingBox.y2 - face.boundingBox.y1).toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Result({ image, result }) {
  return (
    <>
      <OverlayImage
          image={image}
          result={result} />
      <ResultTable
          image={image}
          result={result} />
    </>
  )
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
            <div>解析中...</div>
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
