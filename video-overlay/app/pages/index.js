import Head from "next/head";
import React, { useState, useEffect, useRef, useCallback } from "react";

export default function Page() {
  console.log("Page");
  // const refVideo = React.createRef();
  const refVideo = useRef(null);
  const refTimerId = useRef(null);
  const [paused, setPaused] = useState(true);
  const [currentTime, setCurrentTime] = useState(0.0);

  const onChanged = useCallback((event) => {
    const videoElement = event.target;
    setPaused(videoElement.paused);
    // setCurrentTime(videoElement.currentTime);
  }, []);

  /*
  const onTimer = useCallback(() => {
    console.log("onTimer:", refVideo.current);
    if ( refVideo.current != null ) {
      // setCurrentTime(refVideo.current.currentTime);
    }
  }, []);
  */

  const startTimer = useCallback(() => {
    console.log("start timer");
    // refTimerId.current = setInterval(onTimer, 500);
    refTimerId.current = setInterval(() => {
      console.log("onTimer:", refVideo.current);
      if ( refVideo.current != null ) {
        setCurrentTime(refVideo.current.currentTime);
      }
    }, 500);
  }, [refTimerId, refVideo]);

  const stopTimer = useCallback(() => {
    console.log("stop timer");
    if ( refTimerId.current != null ) {
      clearInterval(refTimerId.current);
      refTimerId.current = null;
    }
  }, [refTimerId]);

  useEffect((x) => {
    // console.log({paused});
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
      <div>currentTime: {currentTime}</div>
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
