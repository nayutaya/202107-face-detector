#!/usr/bin/env python3

import itertools
import logging
import queue
import threading
import time

import cv2
import insightface


def read_thread(input_queue, output_queue):
    logging.info("start")

    total_file_count = 0
    total_frame_count = 0
    total_time_ns = 0

    while True:
        file_path = input_queue.get()
        try:
            if file_path is None:
                break
            logging.info("file_path=%s", file_path)

            capture = cv2.VideoCapture(file_path)
            assert capture.isOpened()

            # for frame_index in itertools.count():
            for frame_index in range(20):
                start_ns = time.perf_counter_ns()
                result, frame = capture.read()
                time_ns = time.perf_counter_ns() - start_ns
                if not result:
                    break

                output_queue.put(
                    {
                        "file_path": file_path,
                        "frame_index": frame_index,
                        "frame": frame,
                    }
                )

                total_frame_count += 1
                total_time_ns += time_ns

            total_file_count += 1
        finally:
            input_queue.task_done()

    logging.info("total_file_count=%d", total_file_count)
    logging.info("total_frame_count=%d", total_frame_count)
    logging.info("total_time[ms]=%d", total_time_ns / 1000 / 1000)
    logging.info("mean_time[ms]=%f", total_time_ns / total_frame_count / 1000 / 1000)
    logging.info(
        "throughput/sec=%f", 1_000_000_000 / (total_time_ns / total_frame_count)
    )
    logging.info("end")


def detection_thread(input_queue, output_queue, face_analysis):
    logging.info("start")

    total_count = 0
    total_time_ns = 0

    while True:
        frame_info = input_queue.get()
        try:
            if frame_info is None:
                break
            logging.info("frame_index=%d", frame_info["frame_index"])

            start_ns = time.perf_counter_ns()
            faces = face_analysis.get(frame_info["frame"])
            time_ns = time.perf_counter_ns() - start_ns

            output_queue.put(
                {
                    "file_path": frame_info["file_path"],
                    "frame_index": frame_info["frame_index"],
                    "frame": frame_info["frame"],
                    "faces": faces,
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


def start_read_workers(number_of_workers, input_queue, output_queue):
    workers = []

    for thread_index in range(number_of_workers):
        worker = threading.Thread(
            name="read#{}".format(thread_index),
            target=read_thread,
            daemon=True,
            kwargs={"input_queue": input_queue, "output_queue": output_queue},
        )
        worker.start()
        workers.append(worker)

    return workers


def start_detection_workers(number_of_workers, input_queue, output_queue):
    workers = []

    face_analysis = insightface.app.FaceAnalysis()
    face_analysis.prepare(ctx_id=0, det_size=(640, 640))

    for thread_index in range(number_of_workers):
        worker = threading.Thread(
            name="detection#{}".format(thread_index),
            target=detection_thread,
            daemon=True,
            kwargs={
                "input_queue": input_queue,
                "output_queue": output_queue,
                "face_analysis": face_analysis,
            },
        )
        worker.start()
        workers.append(worker)

    return workers


def main():
    threading.current_thread().name = "main"
    logging.info("start")

    file_queue = queue.Queue()
    file_queue.put("pixabay_76889_960x540.mp4")

    frame_queue = queue.Queue(maxsize=100)
    read_workers = start_read_workers(
        number_of_workers=1, input_queue=file_queue, output_queue=frame_queue
    )

    detection_queue = queue.Queue()
    detection_workers = start_detection_workers(
        number_of_workers=1, input_queue=frame_queue, output_queue=detection_queue
    )

    for _ in read_workers:
        file_queue.put(None)
    for worker in read_workers:
        worker.join()

    for _ in detection_workers:
        frame_queue.put(None)
    for worker in detection_workers:
        worker.join()

    logging.info("end")


if __name__ == "__main__":
    logging.basicConfig(
        format="%(asctime)s %(levelname)s [%(threadName)s] %(message)s",
        level=logging.DEBUG,
    )
    main()
