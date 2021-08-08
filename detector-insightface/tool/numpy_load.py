#!/usr/bin/env python3

import sys

import numpy as np

image = np.load(sys.argv[1])
print(image.dtype)
print(image.shape)
