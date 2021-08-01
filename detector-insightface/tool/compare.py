#!/usr/bin/env python3

import insightface
import numpy as np
import PIL.Image

def read_image(file_path):
  image = PIL.Image.open(file_path).convert("RGB")
  image = np.array(image)
  image = image[:, :, [2, 1, 0]]  # RGB to BGR
  return image

face_analysis = insightface.app.FaceAnalysis()
face_analysis.prepare(ctx_id=0, det_size=(640, 640))

image1 = read_image("pakutaso_43730.jpg")
# print(image1)

faces1 = face_analysis.get(image1)
# print(faces1)
face1_1 = faces1[0]
# print(face1_1)
embedding1 = face1_1.embedding
print(embedding1)
