import base64
import datetime
import hashlib
import io

import fastapi
import fastapi.middleware.cors
import insightface
import numpy as np
import onnxruntime
import PIL.Image


def encode_np(array):
    bio = io.BytesIO()
    np.save(bio, array)
    return base64.standard_b64encode(bio.getvalue())


SERVICE = {
    "name": "detector-insightface",
    "version": "0.1.0",
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


@app.get("/")
async def get_root():
    return {
        "service": SERVICE,
        "time": int(datetime.datetime.now().timestamp() * 1000),
    }


@app.post("/detect")
async def post_detect(file: fastapi.UploadFile = fastapi.File(...)):
    assert file.content_type == "image/jpeg"
    image = PIL.Image.open(file.file).convert("RGB")
    image = np.array(image)
    image = image[:, :, [2, 1, 0]]  # RGB to BGR

    faces = face_analysis.get(image)

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
