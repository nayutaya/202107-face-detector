import Head from "next/head";
import React, { useState, useEffect, useRef, useCallback } from "react";

function BoundingBox({ x1, y1, x2, y2, color, size = 0.2, strokeOpacity = 0.7, strokeWidth = 3, border = 2 }) {
  const dx = (x2 - x1) * size;
  const dy = (y2 - y1) * size;
  return (
    <g>
      <path
          d={
            `M${x1 - border},${y1 + dy} L${x1 - border},${y1 - border}  L${x1 + dx},${y1 - border}`
            + ` M${x2 + border},${y1 + dy} L${x2 + border},${y1 - border}  L${x2 - dx},${y1 - border}`
            + ` M${x1 - border},${y2 - dy} L${x1 - border},${y2 + border}  L${x1 + dx},${y2 + border}`
            + ` M${x2 + border},${y2 - dy} L${x2 + border},${y2 + border}  L${x2 - dx},${y2 + border}`
          }
          stroke="white"
          strokeOpacity={strokeOpacity}
          strokeWidth={border}
          fill="none" />
      <path
          d={
            `M${x1 + border},${y1 + dy} L${x1 + border},${y1 + border}  L${x1 + dx},${y1 + border}`
            + ` M${x2 - border},${y1 + dy} L${x2 - border},${y1 + border}  L${x2 - dx},${y1 + border}`
            + ` M${x1 + border},${y2 - dy} L${x1 + border},${y2 - border}  L${x1 + dx},${y2 - border}`
            + ` M${x2 - border},${y2 - dy} L${x2 - border},${y2 - border}  L${x2 - dx},${y2 - border}`
          }
          stroke="white"
          strokeOpacity={strokeOpacity}
          strokeWidth={border}
          fill="none" />
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
          fill="none" />
    </g>
  );
}

function ScoreBar({ score, x1, y1, x2, y2, color, height = 4, padding = 5, strokeWidth = 3, strokeOpacity = 0.7, fillOpacity = 0.8 }) {
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
          fill="white"
          fillOpacity={fillOpacity} />
      <rect
          x={x1 + padding}
          y={y1 + padding}
          width={(width - padding * 2) * score}
          height={height}
          fill={color}
          fillOpacity={fillOpacity} />
    </g>
  );
}

function KeyPoints({ points, color, radius = 2, fillOpacity = 0.5 }) {
  return (
    <g>
      {points.map(([ x, y ], index) => (
        <circle
            key={index}
            cx={x}
            cy={y}
            r={radius}
            stroke="none"
            fill={color}
            fillOpacity={fillOpacity} />
      ))}
    </g>
  );
}

function Attributes({ sex, age, x1, y1, x2, y2, color, fontSize = 16, opacity = 0.9, strokeWidth = 3 }) {
  const x = x1;
  const y = y1 - 7;
  const label = `Sex: ${sex} / Age: ${age}`;
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

function Face({ face, shows }) {
  const [
    score,
    [ x1, y1, x2, y2 ],
    keyPoints,
    [ sex, age ],
  ] = face;
  const color = {M: "#6666CC", F: "#CC6666"}[sex];
  return (
    <g>
      {!shows.boundingBox ? null :
        <BoundingBox
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            color={color} />
      }
      {!shows.score ? null :
        <ScoreBar
            score={score}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            color={color} />
      }
      {!shows.keyPoints ? null :
        <KeyPoints
            points={keyPoints}
            color={"#009900"} />
      }
      {!shows.attributes ? null :
        <Attributes
            sex={sex}
            age={age}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            color={color} />
      }
    </g>
  );
}

function Faces({ faces, shows }) {
  if ( faces == null ) return null;
  return (
    <g>
      {faces.map((face, index) => (
        <Face
            key={index}
            face={face}
            shows={shows} />
      ))}
    </g>
  );
}

function CheckBox({ id, checked, setChecked, children }) {
  return (
    <label>
      <input
          type="checkbox"
          checked={checked[id]}
          onChange={(e) => {
            const copied = {...checked};
            copied[id] = e.target.checked;
            setChecked(copied);
          }} />
      <span style={{cursor: "pointer"}}>
        {children}
      </span>
    </label>
  );
}

function Video({ style, fps, src, onFrameChanged }) {
  const refVideo = useRef(null);
  const refTimerId = useRef(null);
  const [paused, setPaused] = useState(true);

  const onChanged = useCallback((event) => {
    const videoElement = event.target;
    setPaused(videoElement.paused);
    // setCurrentFrameIndex(Math.floor(videoElement.currentTime * videoMeta.fps));
    onFrameChanged(Math.floor(videoElement.currentTime * fps));
  }, []);

  const startTimer = useCallback(() => {
    refTimerId.current = setInterval(() => {
      if ( refVideo.current != null ) {
        // setCurrentFrameIndex(Math.floor(refVideo.current.currentTime * videoMeta.fps));
        onFrameChanged(Math.floor(refVideo.current.currentTime * fps));
      }
    }, 33);
  }, [refTimerId, refVideo]);

  const stopTimer = useCallback(() => {
    if ( refTimerId.current != null ) {
      clearInterval(refTimerId.current);
      refTimerId.current = null;
    }
  }, [refTimerId]);

  useEffect((x) => {
    if ( paused ) {
      stopTimer();
    } else {
      startTimer();
    }
  }, [paused]);

  return (
    <video
        style={style}
        ref={refVideo}
        src={src}
        onLoadStart ={(e) => onChanged(e)}
        onCanPlay   ={(e) => onChanged(e)}
        onPause     ={(e) => onChanged(e)}
        onPlay      ={(e) => onChanged(e)}
        onSeeked    ={(e) => onChanged(e)}
        onTimeUpdate={(e) => onChanged(e)}
        controls={true} />
  );
}

function Overlay({ videoMeta, videoData, frameIndex, shows }) {
  const frameData = videoData[frameIndex];
  return (
    <svg
        style={{
          position: "absolute",
          left: "0",
          top: "0",
          width: `${videoMeta.width}px`,
          height: `${videoMeta.height}px`,
          pointerEvents: "none",
        }}
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        viewBox={`0 0 ${videoMeta.width} ${videoMeta.height}`}
        width={videoMeta.width}
        height={videoMeta.height}>
      {frameData == null ? null : (
        <Faces
            faces={frameData[1]}
            shows={shows}/>
      )}
    </svg>
  );
}

export default function Page() {
  const [videoMeta, setVideoMeta] = useState(null);
  const [videoData, setVideoData] = useState(null);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [shows, setShows] = useState({
    boundingBox: true,
    attributes: true,
    score: true,
    keyPoints: true,
  });

  useEffect(async () => {
    const response = await fetch("/pixabay_76889_960x540.mp4.meta.json");
    const videoMeta = await response.json();
    setVideoMeta(videoMeta);
  }, []);

  useEffect(async () => {
    if ( videoMeta == null ) return;
    const response = await fetch(videoMeta.dataUrl);
    const videoData = await response.json();
    setVideoData({meta: videoMeta, data: videoData});
  }, [videoMeta]);

  return (
    <div>
      <Head>
        <title>video-overlay</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>
        [&nbsp;
        <CheckBox id="boundingBox" checked={shows} setChecked={setShows}>Bounding Box</CheckBox> |
        <CheckBox id="score" checked={shows} setChecked={setShows}>Score</CheckBox> |
        <CheckBox id="attributes" checked={shows} setChecked={setShows}>Attributes</CheckBox> |
        <CheckBox id="keyPoints" checked={shows} setChecked={setShows}><span style={{color: "#009900"}}>●</span>Key Points</CheckBox>
        &nbsp;]
      </div>
      <div>
        {videoMeta == null ? null : (
          <div
              style={{
                position: "relative",
                width: `${videoMeta.width}px`,
                height: `${videoMeta.height}px`,
              }}>
            <Video
                style={{
                  position: "absolute",
                  left: "0",
                  top: "0",
                  width: `${videoMeta.width}px`,
                  height: `${videoMeta.height}px`,
                }}
                src={videoMeta.url}
                fps={videoMeta.fps}
                onFrameChanged={(i) => setCurrentFrameIndex(i)} />
            {videoData == null ? null : (
              <Overlay
                  videoMeta={videoData.meta}
                  videoData={videoData.data}
                  frameIndex={currentFrameIndex}
                  shows={shows} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
