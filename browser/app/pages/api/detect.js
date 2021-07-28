export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // console.log({req});
  /*
  console.log(req.method);
  console.log(req.headers);
  console.log(req.body);
  if ( req.method == "POST" ) {
    const param = {
      method: "POST",
      body: req.body,
      headers: {
        "content-length": req.headers["content-length"],
        "content-type": req.headers["content-type"],
      },
    };
    // console.log({param});
    const response = await fetch("http://detector-insightface:8000/detect", param);
    const data = await response.json();
    res.status(200).json(data);
  } else {
    res.status(405).json({});
  }
  */
  /*
  req.addListener('data', function (chunk) {
    // req.write(chunk, 'binary');
    // console.log({chunk});
    console.log("data");
  });
  req.addListener('end', function () {
    // res.status(200).json({});
    console.log("end");
    // req.end();
  });
  console.log("complete:", req.complete);
  req.setEncoding('binary');
  // console.log(req.body);

  // res.status(200).json({});
  res.setTimeout(1000, () => {
    res.status(200).json({});
  });
  */
  console.log(req.read());
  res.status(200).json({});
}
