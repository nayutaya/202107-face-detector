#!/usr/bin/env python3

import hashlib
import pathlib
import sys

import cv2

video_path = pathlib.Path(sys.argv[1])

with video_path.open("rb") as file:
    sha1_hash = hashlib.sha1(file.read()).hexdigest()
    print(sha1_hash)

capture = cv2.VideoCapture(str(video_path))
assert capture.isOpened()
print("CAP_PROP_FRAME_WIDTH:", capture.get(cv2.CAP_PROP_FRAME_WIDTH))
print("CAP_PROP_FRAME_HEIGHT", capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
print("CAP_PROP_FPS", capture.get(cv2.CAP_PROP_FPS))
print("CAP_PROP_FRAME_COUNT", capture.get(cv2.CAP_PROP_FRAME_COUNT))
