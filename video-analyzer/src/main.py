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

    total_count = 0
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

        total_count += 1
        total_time_ns += time_ns

    logging.info("total_count=%d", total_count)
    logging.info("total_time[ms]=%d", total_time_ns / 1000 / 1000)
    logging.info("mean_time[ms]=%f", total_time_ns / total_count / 1000 / 1000)
    logging.info("throughput/sec=%f", 1_000_000_000 / (total_time_ns / total_count))
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


def write_thread(input_queue, output_file_path, video_meta):
    logging.info("start")
    logging.info("output_file_path=%s", str(output_file_path))

    total_count = 0
    total_time_ns = 0

    with output_file_path.open("w") as output_file:
        output_file.write(dump_json_compact(video_meta) + "\n")
        while True:
            frame_info = input_queue.get()
            try:
                if frame_info is None:
                    break

                start_ns = time.perf_counter_ns()

                record = {
                    "frame_index": frame_info["frame_index"],
                    "result": frame_info["result"],
                }
                output_file.write(dump_json_compact(record) + "\n")

                time_ns = time.perf_counter_ns() - start_ns

                total_count += 1
                total_time_ns += time_ns
            finally:
                input_queue.task_done()

    logging.info("total_count=%d", total_count)
    logging.info("total_time[ms]=%d", total_time_ns / 1000 / 1000)
    logging.info("mean_time[ms]=%f", total_time_ns / total_count / 1000 / 1000)
    logging.info("throughput/sec=%f", 1_000_000_000 / (total_time_ns / total_count))
    logging.info("end")


def start_read_worker(video_file_path, video_capture, output_queue):
    worker = threading.Thread(
        name="read",
        target=read_thread,
        daemon=True,
        kwargs={
            "video_file_path": video_file_path,
            "video_capture": video_capture,
            "output_queue": output_queue,
        },
    )
    worker.start()
    return worker


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


def start_write_worker(input_queue, output_file_path, video_meta):
    worker = threading.Thread(
        name="write",
        target=write_thread,
        daemon=True,
        kwargs={
            "input_queue": input_queue,
            "output_file_path": output_file_path,
            "video_meta": video_meta,
        },
    )
    worker.start()
    return worker


def join_all_workers(workers, input_queue):
    for _ in workers:
        input_queue.put(None)
    for worker in workers:
        worker.join()


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
    video_meta = make_video_meta(video_file_path, video_capture)

    frame_queue = queue.Queue(maxsize=10)
    read_worker = start_read_worker(
        video_file_path=video_file_path,
        video_capture=video_capture,
        output_queue=frame_queue,
    )

    detection_queue = queue.Queue()
    detection_workers = start_detection_workers(
        detector_base_urls, input_queue=frame_queue, output_queue=detection_queue
    )

    write_worker = start_write_worker(
        input_queue=detection_queue,
        output_file_path=output_file_path,
        video_meta=video_meta,
    )

    read_worker.join()
    join_all_workers(detection_workers, frame_queue)
    join_all_workers([write_worker], detection_queue)

    logging.info("end")


if __name__ == "__main__":
    logging.basicConfig(
        format="%(asctime)s %(levelname)s [%(threadName)s] %(message)s",
        level=logging.INFO,
    )
    main()
