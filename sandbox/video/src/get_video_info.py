#!/usr/bin/env python3

import cv2


capture = cv2.VideoCapture("pixabay_76889_960x540.mp4")
assert capture.isOpened()
print("CAP_PROP_FRAME_WIDTH:", capture.get(cv2.CAP_PROP_FRAME_WIDTH))
print("CAP_PROP_FRAME_HEIGHT", capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
print("CAP_PROP_FPS", capture.get(cv2.CAP_PROP_FPS))
print("CAP_PROP_FRAME_COUNT", capture.get(cv2.CAP_PROP_FRAME_COUNT))
