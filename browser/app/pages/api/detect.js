import http from "http";

export const config = {
  api: {
    bodyParser: false,
  },
};

// REF: https://github.com/rchipka/node-osmosis/blob/1d432e6c6b190a1a7bf415c62bb8ab0d7ce04e56/test/proxy.js#L8
export default async function handler(req, res) {
  const backend_req = http.request("http://detector-insightface:8000/detect", {
    method: req.method,
    headers: {
      "content-length": req.headers["content-length"],
      "content-type": req.headers["content-type"],
    },
  });
  console.log({backend_req})

  // console.log({req});
  // console.log(req.method);
  // console.log(req.headers);
  // console.log(req.body);
  /*
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
  backend_req.addListener("response", function (backend_res) {
    console.log("backend_req.response");
    backend_res.addListener("data", function (chunk) {
      console.log("backend_res.data");
      console.log({chunk});
      res.write(chunk, "binary");
    });
    backend_res.addListener("end", function () {
      console.log("backend_res.end");
      res.end();
    });
    res.writeHead(backend_res.statusCode, backend_res.headers);
  });
  req.addListener("data", function (chunk) {
    console.log("req.data");
    console.log({chunk});
    backend_req.write(chunk, "binary");
  });
  req.addListener("end", function () {
    // res.status(200).json({});
    console.log("req.end");
    backend_req.end();
  });
  // const body = req.read();
  // console.log(body.length);
  // res.status(200).json({});
}
