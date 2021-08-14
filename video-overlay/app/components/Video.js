import React, { useState, useEffect, useRef, useCallback } from "react";

export default function Video({ style, src, onTimeChanged }) {
  const refVideo = useRef(null);
  const refTimerId = useRef(null);
  const [paused, setPaused] = useState(true);

  const onChanged = useCallback((event) => {
    const videoElement = event.target;
    setPaused(videoElement.paused);
    onTimeChanged(videoElement.currentTime);
  }, []);

  const startTimer = useCallback(() => {
    refTimerId.current = setInterval(() => {
      if ( refVideo.current != null ) {
        onTimeChanged(refVideo.current.currentTime);
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
