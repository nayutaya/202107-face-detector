#!/usr/bin/env python3

import hashlib
import io
import json
import logging
import pathlib
import queue
import sys
import threading
import time

import click
import cv2
import numpy as np
import requests


def calc_sha1_hash(path):
    with path.open("rb") as file:
        return hashlib.sha1(file.read()).hexdigest()


def make_video_meta(video_file_path, video_capture):
    return {
        "sha1": calc_sha1_hash(video_file_path),
        "size": video_file_path.stat().st_size,
        "width": int(video_capture.get(cv2.CAP_PROP_FRAME_WIDTH)),
        "height": int(video_capture.get(cv2.CAP_PROP_FRAME_HEIGHT)),
        "fps": video_capture.get(cv2.CAP_PROP_FPS),
        "numberOfFrames": int(video_capture.get(cv2.CAP_PROP_FRAME_COUNT)),
    }


def dump_json_compact(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def dump_numpy(ary):
    bio = io.BytesIO()
    np.save(bio, ary)
    return bio.getvalue()


def read_thread(video_file_path, video_capture, output_queue):
    logging.info("start")

    total_frame_count = 0
    total_time_ns = 0

    # for frame_index in itertools.count():
    for frame_index in range(10):
        start_ns = time.perf_counter_ns()
        result, frame = video_capture.read()
        time_ns = time.perf_counter_ns() - start_ns
        if not result:
            break

        output_queue.put(
            {
                "video_file_path": video_file_path,
                "frame_index": frame_index,
                "frame": frame,
            }
        )

        total_frame_count += 1
        total_time_ns += time_ns

    logging.info("total_frame_count=%d", total_frame_count)
    logging.info("total_time[ms]=%d", total_time_ns / 1000 / 1000)
    logging.info("mean_time[ms]=%f", total_time_ns / total_frame_count / 1000 / 1000)
    logging.info(
        "throughput/sec=%f", 1_000_000_000 / (total_time_ns / total_frame_count)
    )
    logging.info("end")


def detection_thread(input_queue, output_queue, detector_base_url):
    logging.info("start")
    logging.info("detector_base_url=%s", detector_base_url)

    url = detector_base_url + "/detect"
    total_count = 0
    total_time_ns = 0

    while True:
        frame_info = input_queue.get()
        try:
            if frame_info is None:
                break
            logging.info("frame_index=%d", frame_info["frame_index"])

            start_ns = time.perf_counter_ns()

            frame_bin = dump_numpy(frame_info["frame"])
            files = {
                "file": (
                    frame_info["video_file_path"].name,
                    frame_bin,
                    "application/octet-stream",
                ),
            }
            response = requests.post(url, files=files)
            assert response.status_code == 200
            result = response.json()

            time_ns = time.perf_counter_ns() - start_ns

            output_queue.put(
                {
                    "video_file_path": frame_info["video_file_path"],
                    "frame_index": frame_info["frame_index"],
                    "frame": frame_info["frame"],
                    "result": result,
                }
            )

            total_count += 1
            total_time_ns += time_ns
        finally:
            input_queue.task_done()

    logging.info("total_count=%d", total_count)
    logging.info("total_time[ms]=%d", total_time_ns / 1000 / 1000)
    logging.info("mean_time[ms]=%f", total_time_ns / total_count / 1000 / 1000)
    logging.info("throughput/sec=%f", 1_000_000_000 / (total_time_ns / total_count))
    logging.info("end")


def start_detection_workers(detector_base_urls, input_queue, output_queue):
    workers = []

    for thread_index, detector_base_url in enumerate(detector_base_urls):
        worker = threading.Thread(
            name="detection#{}".format(thread_index),
            target=detection_thread,
            daemon=True,
            kwargs={
                "input_queue": input_queue,
                "output_queue": output_queue,
                "detector_base_url": detector_base_url,
            },
        )
        worker.start()
        workers.append(worker)

    return workers


@click.command()
@click.argument("video_file_path", type=click.Path(exists=True))
@click.argument("output_file_path", type=click.Path(exists=False))
def main(video_file_path, output_file_path):
    threading.current_thread().name = "main"
    logging.info("start")

    video_file_path = pathlib.Path(video_file_path)
    output_file_path = pathlib.Path(output_file_path)
    detector_base_urls = ["http://detector-insightface:8000"]

    video_capture = cv2.VideoCapture(str(video_file_path))
    assert video_capture.isOpened()
    meta = make_video_meta(video_file_path, video_capture)
    print(meta)

    frame_queue = queue.Queue(maxsize=100)

    read_worker = threading.Thread(
        name="read",
        target=read_thread,
        daemon=True,
        kwargs={
            "video_file_path": video_file_path,
            "video_capture": video_capture,
            "output_queue": frame_queue,
        },
    )
    read_worker.start()

    detection_queue = queue.Queue()
    detection_workers = start_detection_workers(
        detector_base_urls, input_queue=frame_queue, output_queue=detection_queue
    )

    output_file = output_file_path.open("w")
    output_file.write(dump_json_compact(meta) + "\n")

    read_worker.join()

    for _ in detection_workers:
        frame_queue.put(None)
    for worker in detection_workers:
        worker.join()

    output_file.close()

    logging.info("end")


if __name__ == "__main__":
    logging.basicConfig(
        format="%(asctime)s %(levelname)s [%(threadName)s] %(message)s",
        level=logging.INFO,
    )
    main()


"""
detector_base_url = detector_base_urls[0]


frame_index = 0
record = {
    "frame_index": frame_index,
    "result": result,
}

    file.write(dump_json_compact(record) + "\n")
"""
