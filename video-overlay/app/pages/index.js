import Head from "next/head";
import React, { useState, useEffect, useRef } from "react";

export default function Page() {
  // const [videoState, setVideoState] = useState({paused: true, currentTime: null});
  const [paused, setPaused] = useState(true);
  const refTimerId = useRef(null);
  const videoRef = React.createRef();

  const onChanged = (event) => {
    // console.log(e);
    const videoElement = event.target;
    // setVideoState({
    //   paused: videoElement.paused,
    //   currentTime: videoElement.currentTime,
    // })
    setPaused(videoElement.paused);
    // console.log("onChanged:", videoRef.current);
  };

  const onTimer = () => {
    console.log("timer");
    console.log("onTimer:", videoRef.current);
  };

  useEffect(() => {
    // console.log({paused});
    if ( paused ) {
      console.log("stop timer");
      if ( refTimerId.current != null ) {
        clearInterval(refTimerId.current);
        refTimerId.current = null;
      }
    } else {
      console.log("start timer");
      refTimerId.current = setInterval(onTimer, 500);
    }
  }, [paused]);

  return (
    <div>
      <Head>
        <title>video-overlay</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>video-overlay</div>
      <div>
        <video
            ref={videoRef}
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
