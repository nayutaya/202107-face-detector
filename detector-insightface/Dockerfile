# FROM ubuntu:20.04
FROM nvidia/cuda:11.0.3-cudnn8-devel-ubuntu20.04
RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install --yes --no-install-recommends \
    build-essential \
    ca-certificates \
    libopenblas-base \
    libopencv-dev \
    pandoc \
    python3-dev \
    python3-pip \
    python3-setuptools \
  && rm --recursive --force /var/lib/apt/lists/*
RUN python3 -m pip install --upgrade pip setuptools
WORKDIR /opt/app
COPY requirements1_gpu.txt ./
RUN python3 -m pip install --requirement requirements1_gpu.txt
COPY requirements2.txt ./
RUN python3 -m pip install --requirement requirements2.txt
COPY src/get_model.py ./src/
RUN ./src/get_model.py
COPY requirements3.txt ./
RUN python3 -m pip install --requirement requirements3.txt
COPY src/ ./src/
CMD ["uvicorn", "--host=0.0.0.0", "--app-dir=src", "main:app"]
