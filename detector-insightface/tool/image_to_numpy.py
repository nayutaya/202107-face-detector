#!/usr/bin/env python3

import sys

import cv2
import numpy as np

image = cv2.imread(sys.argv[1], cv2.IMREAD_COLOR)
print(image.dtype)
print(image.shape)

np.save(sys.argv[2], image)
