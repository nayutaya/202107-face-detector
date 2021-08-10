import Head from "next/head";

export default function Page() {
  return (
    <div>
      <Head>
        <title>video-overlay</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>video-overlay</div>
      <div>
        <video controls>
          <source src="/pixabay_76889_960x540.mp4" />
        </video>
      </div>
    </div>
  );
}
