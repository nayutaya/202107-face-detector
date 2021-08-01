#!/usr/bin/env python3

import insightface
import numpy as np
import PIL.Image


def read_image(file_path):
    image = PIL.Image.open(file_path).convert("RGB")
    image = np.array(image)
    image = image[:, :, [2, 1, 0]]  # RGB to BGR
    return image


# REF: https://github.com/deepinsight/insightface/blob/f474870cc5b124749d482cf175818413a9fe12cd/python-package/insightface/model_zoo/arcface_onnx.py#L70
def compute_sim(feat1, feat2):
    return np.dot(feat1, feat2) / (np.linalg.norm(feat1) * np.linalg.norm(feat2))


face_analysis = insightface.app.FaceAnalysis()
face_analysis.prepare(ctx_id=0, det_size=(640, 640))

image1 = read_image("pakutaso_43730.jpg")
faces1 = face_analysis.get(image1)
embedding1 = faces1[0].embedding
print(compute_sim(embedding1, embedding1))

# image2 = read_image("43732.jpg")
# image2 = read_image("23644.jpg")
# image2 = read_image("26822.jpg")
image2 = read_image("skincareIMGL7744_TP_V4.jpg")
faces2 = face_analysis.get(image2)
embedding2 = faces2[0].embedding
print(compute_sim(embedding1, embedding2))
