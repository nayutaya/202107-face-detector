#!/usr/bin/env python3

import itertools

import cv2
import insightface

face_analysis = insightface.app.FaceAnalysis()
face_analysis.prepare(ctx_id=0, det_size=(640, 640))

capture = cv2.VideoCapture("pixabay_76889_960x540.mp4")
assert capture.isOpened()

# for frame_index in itertools.count():
for frame_index in range(1):
    result, frame = capture.read()
    print((frame_index, result))
    if not result:
        break

    faces = face_analysis.get(frame)
    print(faces)
