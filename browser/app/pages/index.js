import Head from "next/head";
import Link from "next/link";

export default function Page() {
  return (
    <>
      <Head>
        <title>face-detector</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ul>
        <li><Link href="/detect"><a>detect</a></Link></li>
        <li><Link href="/compare"><a>compare</a></Link></li>
      </ul>
    </>
  );
}
