#!/usr/bin/env python3

import hashlib
import io
import json
import pathlib
import sys

import cv2
import numpy as np
import requests


def calc_sha1_hash(path):
    with path.open("rb") as file:
        return hashlib.sha1(file.read()).hexdigest()


def dump_json_compact(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


video_file_path = pathlib.Path(sys.argv[1])
output_file_path = pathlib.Path(sys.argv[2])

sha1_hash = calc_sha1_hash(video_file_path)

capture = cv2.VideoCapture(str(video_file_path))
assert capture.isOpened()
meta = {
    "sha1": sha1_hash,
    "size": video_file_path.stat().st_size,
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

detector_base_urls = ["http://detector-insightface:8000"]

detector_base_url = detector_base_urls[0]
url = detector_base_url + "/detect"

files = {
    "file": (video_file_path.name, frame_bin, "application/octet-stream"),
}
response = requests.post(url, files=files)
print(response)
assert response.status_code == 200
result = response.json()

frame_index = 0
record = {
    "frame_index": frame_index,
    "result": result,
}

with output_file_path.open("w") as file:
    file.write(dump_json_compact(meta) + "\n")
    file.write(dump_json_compact(record) + "\n")
