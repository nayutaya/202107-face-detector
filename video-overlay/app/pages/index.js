import Head from "next/head";
import React, { useState, useEffect, useCallback } from "react";

import CheckBox from "../components/CheckBox";
import Video from "../components/Video";
import Overlay from "../components/Overlay";

export default function Page() {
  const [videoMeta, setVideoMeta] = useState(null);
  const [videoData, setVideoData] = useState(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [shows, setShows] = useState({
    boundingBox: true,
    attributes: true,
    score: true,
    keyPoints: true,
  });

  useEffect(() => {
    (async () => {
      const videoMetaResponse = await fetch("/pixabay_76889_960x540.mp4.meta.json");
      const videoMeta = await videoMetaResponse.json();
      setVideoMeta(videoMeta);

      const videoDataResponse = await fetch(videoMeta.dataUrl);
      const videoData = await videoDataResponse.json();
      setVideoData({meta: videoMeta, data: videoData});
    })();
  }, []);

  const onTimeChanged = useCallback((time) => {
    if ( videoMeta == null ) return;
    setFrameIndex(Math.min(Math.floor(time * videoMeta.fps), videoMeta.numberOfFrames - 1));
  }, [videoMeta]);

  return (
    <div style={{padding: "10px"}}>
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
                onTimeChanged={onTimeChanged} />
            {videoData == null ? null : (
              <Overlay
                  style={{
                    position: "absolute",
                    left: "0",
                    top: "0",
                    width: `${videoData.meta.width}px`,
                    height: `${videoData.meta.height}px`,
                    pointerEvents: "none",
                  }}
                  width={videoData.meta.width}
                  height={videoData.meta.height}
                  faces={(videoData.data[frameIndex] || [])[1]}
                  shows={shows} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
