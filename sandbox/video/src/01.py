#!/usr/bin/env python3

import itertools
import time

import cv2
import insightface

face_analysis = insightface.app.FaceAnalysis()
face_analysis.prepare(ctx_id=0, det_size=(640, 640))

capture = cv2.VideoCapture("pixabay_76889_960x540.mp4")
assert capture.isOpened()

total_detection_elapsed_ns = 0
total_detection_count = 0

# for frame_index in itertools.count():
for frame_index in range(5):
    result, frame = capture.read()
    print((frame_index, result))
    if not result:
        break

    start_ns = time.perf_counter_ns()
    faces = face_analysis.get(frame)
    detection_elapsed_ns = time.perf_counter_ns() - start_ns
    # print(faces)

    total_detection_elapsed_ns += detection_elapsed_ns
    total_detection_count += 1

print("total_detection_elapsed_ns:", total_detection_elapsed_ns)
print("total_detection_count:", total_detection_count)
mean_detection_elapsed_ns = total_detection_elapsed_ns / total_detection_count
print("mean_detection_elapsed_ms:", mean_detection_elapsed_ns / 1000 / 1000)
detection_throughput_in_sec = 1_000_000_000 / mean_detection_elapsed_ns
print("detection_throughput_in_sec:", detection_throughput_in_sec)
