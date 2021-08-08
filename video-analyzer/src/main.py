#!/usr/bin/env python3

import hashlib
import io
import pathlib
import sys

import cv2
import numpy as np

def calc_sha1_hash(path):
  with path.open("rb") as file:
      return hashlib.sha1(file.read()).hexdigest()

video_path = pathlib.Path(sys.argv[1])

sha1_hash = calc_sha1_hash(video_path)

capture = cv2.VideoCapture(str(video_path))
assert capture.isOpened()
meta = {
  "sha1": sha1_hash,
  "size": video_path.stat().st_size,
  "width": int(capture.get(cv2.CAP_PROP_FRAME_WIDTH)),
  "height": int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT)),
  "fps": capture.get(cv2.CAP_PROP_FPS),
  "numberOfFrames": int(capture.get(cv2.CAP_PROP_FRAME_COUNT)),
}
print(meta)

result, image = capture.read()
print(result)
print(image.dtype)
print(image.shape)

bio = io.BytesIO()
np.save(bio, image)
frame_bin = bio.getvalue()
