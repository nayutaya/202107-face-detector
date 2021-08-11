import Head from "next/head";
import React, { useState, useEffect, useRef, useCallback } from "react";

function BoundingBox({ face, color, size = 0.2, strokeOpacity = 0.7, strokeWidth = 3, border = 2 }) {
  const [ x1, y1, x2, y2 ] = face[1];
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
}

function ScoreBar({ face, color, height = 4, padding = 5, strokeWidth = 3, strokeOpacity = 0.7, fillOpacity = 0.8 }) {
  const score = face[0];
  const [ x1, y1, x2, y2 ] = face[1];
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

function Face({ face, color, shows }) {
/*
      {!shows.attributes ? null :
        <Attributes
            face={face}
            color={color} />
      }
*/
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
      {!shows.keyPoints ? null :
        <KeyPoints
            points={face[2]}
            color={"#009900"} />
      }
    </g>
  );
}

function Faces({ faces, shows }) {
  if ( faces == null ) return null;
  const colors = {M: "#6666CC", F: "#CC6666"};
  return (
    <g>
      {faces.map((face, index) => (
        <Face
            key={index}
            face={face}
            color={colors[face[3][0]]}
            shows={shows} />
      ))}
    </g>
  );
}

export default function Page() {
  const refVideo = useRef(null);
  const refTimerId = useRef(null);
  const [videoMeta, setVideoMeta] = useState(null);
  const [videoData, setVideoData] = useState(null);
  const [paused, setPaused] = useState(true);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  const onChanged = useCallback((event) => {
    const videoElement = event.target;
    setPaused(videoElement.paused);
    setCurrentFrameIndex(Math.floor(videoElement.currentTime * videoMeta.fps));
  }, [videoMeta]);

  const startTimer = useCallback(() => {
    refTimerId.current = setInterval(() => {
      if ( refVideo.current != null ) {
        setCurrentFrameIndex(Math.floor(refVideo.current.currentTime * videoMeta.fps));
      }
    }, 33);
  }, [refTimerId, refVideo, videoMeta]);

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

  useEffect(async () => {
    const response = await fetch("/pixabay_76889_960x540.mp4.meta.json");
    const videoMeta = await response.json();
    setVideoMeta(videoMeta);
  }, []);

  useEffect(async () => {
    if ( videoMeta == null ) return;
    console.log("loding...");
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
      <div>video-overlay</div>
      <div>currentFrameIndex: {currentFrameIndex}</div>
      <div>
        {videoMeta == null ? null : (
          <div
              style={{
                position: "relative",
                width: `${videoMeta.width}px`,
                height: `${videoMeta.height}px`,
              }}>
            <video
                style={{
                  position: "absolute",
                  left: "0",
                  top: "0",
                  width: `${videoMeta.width}px`,
                  height: `${videoMeta.height}px`,
                }}
                ref={refVideo}
                src={videoMeta.url}
                onLoadStart ={(e) => onChanged(e)}
                onCanPlay   ={(e) => onChanged(e)}
                onPause     ={(e) => onChanged(e)}
                onPlay      ={(e) => onChanged(e)}
                onSeeked    ={(e) => onChanged(e)}
                onTimeUpdate={(e) => onChanged(e)}
                controls={true} />
            {videoData == null ? null : (
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
                <Faces
                    faces={(videoData.data[currentFrameIndex] || [])[1]}
                    shows={{
                      boundingBox: true,
                      score: true,
                      keyPoints: true,
                    }}/>
              </svg>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
