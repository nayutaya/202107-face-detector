import http from "http";

export const config = {
  api: {
    bodyParser: false,
  },
};

const BACKEND_BASE_URL = "http://detector-insightface:8000";

// REF: https://github.com/rchipka/node-osmosis/blob/1d432e6c6b190a1a7bf415c62bb8ab0d7ce04e56/test/proxy.js#L8
export default async function handler(frontend_req, frontend_res) {
  return new Promise((resolve, reject) => {
    const backend_req = http.request(BACKEND_BASE_URL + "/detect", {
      method: frontend_req.method,
      headers: frontend_req.headers,
    });

    backend_req.addListener("response", (backend_res) => {
      frontend_res.writeHead(backend_res.statusCode, backend_res.headers);
      backend_res.addListener("data", (chunk) => {
        frontend_res.write(chunk, "binary");
      });
      backend_res.addListener("end", () => {
        frontend_res.end();
        resolve();
      });
    });

    frontend_req.addListener("data", (chunk) => {
      backend_req.write(chunk, "binary");
    });

    frontend_req.addListener("end", () => {
      backend_req.end();
    });
  });
}
