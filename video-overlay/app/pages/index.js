import Head from "next/head";
import React, { useState, useEffect, useRef, useCallback } from "react";

export default function Page() {
  const refVideo = useRef(null);
  const refTimerId = useRef(null);
  const [paused, setPaused] = useState(true);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  const fps = 29.97;

  const onChanged = useCallback((event) => {
    const videoElement = event.target;
    setPaused(videoElement.paused);
    setCurrentFrameIndex(Math.floor(videoElement.currentTime * fps));
  }, []);

  const startTimer = useCallback(() => {
    refTimerId.current = setInterval(() => {
      if ( refVideo.current != null ) {
        setCurrentFrameIndex(Math.floor(refVideo.current.currentTime * fps));
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
    <div>
      <Head>
        <title>video-overlay</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>video-overlay</div>
      <div>currentFrameIndex: {currentFrameIndex}</div>
      <div>
        <video
            ref={refVideo}
            src="/pixabay_76889_960x540.mp4"
            onLoadStart ={(e) => onChanged(e)}
            onCanPlay   ={(e) => onChanged(e)}
            onPause     ={(e) => onChanged(e)}
            onPlay      ={(e) => onChanged(e)}
            onSeeked    ={(e) => onChanged(e)}
            onTimeUpdate={(e) => onChanged(e)}
            controls={true} />
      </div>
    </div>
  );
}
