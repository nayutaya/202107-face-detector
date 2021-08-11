import Head from "next/head";
import React, { useState, useEffect, useRef, useCallback } from "react";

export default function Page() {
  const refVideo = useRef(null);
  const refTimerId = useRef(null);
  const [videoMeta, setVideoMeta] = useState(null);
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
          <video
              ref={refVideo}
              src={videoMeta.url}
              onLoadStart ={(e) => onChanged(e)}
              onCanPlay   ={(e) => onChanged(e)}
              onPause     ={(e) => onChanged(e)}
              onPlay      ={(e) => onChanged(e)}
              onSeeked    ={(e) => onChanged(e)}
              onTimeUpdate={(e) => onChanged(e)}
              controls={true} />
        )}
      </div>
    </div>
  );
}
