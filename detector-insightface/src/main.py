import base64
import datetime
import hashlib
import io
import time

from pydantic import BaseModel
from typing import List, Dict, Any
import fastapi
import fastapi.middleware.cors
import insightface
import numpy as np
import onnxruntime
import PIL.Image


class ServiceResponse(BaseModel):
    name: str
    version: str
    computingDevice: str
    libraries: Dict[str, str]


class RootResponse(BaseModel):
    service: ServiceResponse
    time: int


class DetectResponse(BaseModel):
    class RequestResponse(BaseModel):
        class FileResponse(BaseModel):
            name: str
            size: int
            sha1: str

        file: FileResponse

    class ResponseResponse(BaseModel):
        class FaceResponse(BaseModel):
            score: float
            boundingBox: Dict[str, float]
            keyPoints: List[Dict[str, float]]
            landmarks: Dict[str, List[Dict[str, float]]]
            attributes: Dict[str, Any]
            embedding: str

        detectionTimeInNanoseconds: int
        width: int
        height: int
        numberOfFaces: int
        faces: List[FaceResponse]

    service: ServiceResponse
    time: int
    request: RequestResponse
    response: ResponseResponse


class PairRequest(BaseModel):
    index1: int
    index2: int


class CompareRequest(BaseModel):
    embeddings: List[str]
    pairs: List[PairRequest]


class PairResponse(BaseModel):
    index1: int
    index2: int
    similarity: float


class CompareResponse(BaseModel):
    comparisonTimeInNanoseconds: int
    embeddings: List[str]
    pairs: List[PairResponse]


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


SERVICE = {
    "name": "detector-insightface",
    "version": "0.3.0",
    "computingDevice": onnxruntime.get_device(),
    "libraries": {
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


@app.get("/", response_model=RootResponse)
async def get_root():
    return {
        "service": SERVICE,
        "time": int(datetime.datetime.now().timestamp() * 1000),
    }


@app.post("/detect", response_model=DetectResponse)
async def post_detect(file: fastapi.UploadFile = fastapi.File(...)):
    assert file.content_type == "image/jpeg"
    image = PIL.Image.open(file.file).convert("RGB")
    image = np.array(image)
    image = image[:, :, [2, 1, 0]]  # RGB to BGR

    start_time_ns = time.perf_counter_ns()
    faces = face_analysis.get(image)
    process_time_ns = time.perf_counter_ns() - start_time_ns

    file.file.seek(0)
    sha1_hash = hashlib.sha1(file.file.read()).hexdigest()
    file_size = file.file.tell()

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
                    "score": face.det_score.astype(float),
                    "boundingBox": {
                        "x1": face.bbox[0].astype(float),
                        "y1": face.bbox[1].astype(float),
                        "x2": face.bbox[2].astype(float),
                        "y2": face.bbox[3].astype(float),
                    },
                    "keyPoints": [
                        {"x": xy[0].astype(float), "y": xy[1].astype(float)}
                        for xy in face.kps
                    ],
                    "landmarks": {
                        "3d_68": [
                            {
                                "x": xyz[0].astype(float),
                                "y": xyz[1].astype(float),
                                "z": xyz[2].astype(float),
                            }
                            for xyz in face.landmark_3d_68
                        ],
                        "2d_106": [
                            {"x": xy[0].astype(float), "y": xy[1].astype(float)}
                            for xy in face.landmark_2d_106
                        ],
                    },
                    "attributes": {"sex": face.sex, "age": face.age},
                    "embedding": encode_np(face.embedding),
                }
                for face in faces
            ],
        },
    }


@app.post("/compare", response_model=CompareResponse)
async def post_compare(request: CompareRequest):
    embeddings = request.embeddings

    start_time_ns = time.perf_counter_ns()
    decoded_embeddings = [decode_np(text) for text in embeddings]
    similarities = [
        compute_similarity(
            decoded_embeddings[pair.index1], decoded_embeddings[pair.index2]
        ).astype(float)
        for pair in request.pairs
    ]
    process_time_ns = time.perf_counter_ns() - start_time_ns

    return {
        "comparisonTimeInNanoseconds": process_time_ns,
        "embeddings": embeddings,
        "pairs": [
            {"index1": pair.index1, "index2": pair.index2, "similarity": similarity,}
            for pair, similarity in zip(request.pairs, similarities)
        ],
    }
