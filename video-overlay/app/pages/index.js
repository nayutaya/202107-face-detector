import Head from "next/head";

export default function Page() {
  const onChanged = (event) => {
    // console.log(e);
    const videoElement = event.target;
    console.log([videoElement.paused, videoElement.currentTime]);
  };

  return (
    <div>
      <Head>
        <title>video-overlay</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>video-overlay</div>
      <div>
        <video
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
