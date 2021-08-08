import base64
import datetime
import hashlib
import io
import time

import cv2
import fastapi
import fastapi.middleware.cors
import insightface
import numpy as np
import onnxruntime

import mytypes


def encode_np(array):
    bio = io.BytesIO()
    np.save(bio, array)
    return base64.standard_b64encode(bio.getvalue())


def decode_np(text):
    bio = io.BytesIO(base64.standard_b64decode(text))
    return np.load(bio)


def compute_similarity(embedding1, embedding2):
    return np.dot(embedding1, embedding2) / (
        np.linalg.norm(embedding1) * np.linalg.norm(embedding2)
    )


def round(value, factor):
    return int(value.astype(float) * factor) / factor


SERVICE = {
    "name": "detector-insightface",
    "version": "0.4.0",
    "computingDevice": onnxruntime.get_device(),
    "libraries": {
        "cv2": cv2.__version__,
        "insightface": insightface.__version__,
        "onnxruntime": onnxruntime.__version__,
    },
}

app = fastapi.FastAPI()
app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

face_analysis = insightface.app.FaceAnalysis()
face_analysis.prepare(ctx_id=0, det_size=(640, 640))


@app.get("/", response_model=mytypes.RootResponse)
async def get_root():
    return {
        "service": SERVICE,
        "time": int(datetime.datetime.now().timestamp() * 1000),
    }


@app.post("/detect", response_model=mytypes.DetectResponse)
async def post_detect(file: fastapi.UploadFile = fastapi.File(...)):
    # TODO: PNG形式に対応する。
    # TODO: NumPy形式に対応する。
    assert file.content_type == "image/jpeg"

    image_bin = file.file.read()
    sha1_hash = hashlib.sha1(image_bin).hexdigest()
    file_size = len(image_bin)
    image_array = np.asarray(bytearray(image_bin), dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    start_time_ns = time.perf_counter_ns()
    faces = face_analysis.get(image)
    process_time_ns = time.perf_counter_ns() - start_time_ns

    return {
        "service": SERVICE,
        "time": int(datetime.datetime.now().timestamp() * 1000),
        "request": {
            "file": {"name": file.filename, "size": file_size, "sha1": sha1_hash}
        },
        "response": {
            "detectionTimeInNanoseconds": process_time_ns,
            "width": image.shape[1],
            "height": image.shape[0],
            "numberOfFaces": len(faces),
            "faces": [
                {
                    "score": round(face.det_score, 1000),
                    "boundingBox": {
                        "x1": round(face.bbox[0], 100),
                        "y1": round(face.bbox[1], 100),
                        "x2": round(face.bbox[2], 100),
                        "y2": round(face.bbox[3], 100),
                    },
                    "keyPoints": [
                        {"x": round(xy[0], 100), "y": round(xy[1], 100)}
                        for xy in face.kps
                    ],
                    "landmarks3d68": [
                        {
                            "x": round(xyz[0], 100),
                            "y": round(xyz[1], 100),
                            "z": round(xyz[2], 100),
                        }
                        for xyz in face.landmark_3d_68
                    ],
                    "landmarks2d106": [
                        {"x": round(xy[0], 100), "y": round(xy[1], 100),}
                        for xy in face.landmark_2d_106
                    ],
                    "attributes": {"sex": face.sex, "age": face.age},
                    "embedding": encode_np(face.embedding),
                }
                for face in faces
            ],
        },
    }


@app.post("/compare", response_model=mytypes.CompareResponse)
async def post_compare(request: mytypes.CompareRequest):
    start_time_ns = time.perf_counter_ns()
    decoded_embeddings = [decode_np(text) for text in request.embeddings]
    similarities = [
        compute_similarity(
            decoded_embeddings[pair.index1], decoded_embeddings[pair.index2]
        )
        for pair in request.pairs
    ]
    process_time_ns = time.perf_counter_ns() - start_time_ns

    return {
        "service": SERVICE,
        "time": int(datetime.datetime.now().timestamp() * 1000),
        "request": {"embeddings": request.embeddings, "pairs": request.pairs,},
        "response": {
            "comparisonTimeInNanoseconds": process_time_ns,
            "pairs": [
                {
                    "index1": pair.index1,
                    "index2": pair.index2,
                    "similarity": round(similarity, 1000),
                }
                for pair, similarity in zip(request.pairs, similarities)
            ],
        },
    }
