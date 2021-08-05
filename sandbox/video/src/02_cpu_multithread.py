#!/usr/bin/env python3

import itertools
import logging
import queue
import threading
import time

import cv2
import insightface


def media_thread(input_queue, output_queue):
    logging.info("start")

    total_process_media = 0
    total_process_frame = 0
    total_process_time_ns = 0

    while True:
        file_path = input_queue.get()
        try:
            if file_path is None:
                break
            logging.info("file_path=%s", file_path)

            capture = cv2.VideoCapture(file_path)
            assert capture.isOpened()

            # for frame_index in itertools.count():
            for frame_index in range(5):
                start_ns = time.perf_counter_ns()
                result, frame = capture.read()
                process_time_ns = time.perf_counter_ns() - start_ns
                if not result:
                    break

                output_queue.put(
                    {
                        "file_path": file_path,
                        "frame_index": frame_index,
                        "frame": frame,
                    }
                )

                total_process_frame += 1
                total_process_time_ns += process_time_ns

            total_process_media += 1
        finally:
            input_queue.task_done()

    logging.info("total_process_media=%d", total_process_media)
    logging.info("total_process_frame=%d", total_process_frame)
    logging.info("total_process_time_ns=%d", total_process_time_ns)
    logging.info("end")


def detection_thread(input_queue, output_queue, face_analysis):
    logging.info("start")

    total_detection_elapsed_ns = 0
    total_detection_count = 0

    while True:
        frame_info = input_queue.get()
        try:
            if frame_info is None:
                break
            logging.info("frame_index=%d", frame_info["frame_index"])

            start_ns = time.perf_counter_ns()
            faces = face_analysis.get(frame_info["frame"])
            detection_elapsed_ns = time.perf_counter_ns() - start_ns

            output_queue.put(
                {
                    "file_path": frame_info["file_path"],
                    "frame_index": frame_info["frame_index"],
                    "frame": frame_info["frame"],
                    "faces": faces,
                }
            )

            total_detection_elapsed_ns += detection_elapsed_ns
            total_detection_count += 1

        finally:
            input_queue.task_done()

    logging.info("total_detection_elapsed_ns=%d", total_detection_elapsed_ns)
    logging.info("total_detection_count=%d", total_detection_count)

    logging.info("end")


def start_media_workers(number_of_workers, input_queue, output_queue):
    workers = []

    for thread_index in range(number_of_workers):
        worker = threading.Thread(
            name="media#{}".format(thread_index),
            target=media_thread,
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
    media_workers = start_media_workers(
        number_of_workers=1, input_queue=file_queue, output_queue=frame_queue
    )

    detection_queue = queue.Queue()
    detection_workers = start_detection_workers(
        number_of_workers=1, input_queue=frame_queue, output_queue=detection_queue
    )

    for _ in media_workers:
        file_queue.put(None)
    for worker in media_workers:
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

"""

print("total_read_frame_elapsed_ns:", total_read_frame_elapsed_ns)
print("total_read_frame_count:", total_read_frame_count)
mean_read_frame_elapsed_ns = total_read_frame_elapsed_ns / total_read_frame_count
print("mean_read_frame_elapsed_ms:", mean_read_frame_elapsed_ns / 1000 / 1000)
read_frame_throughput_in_sec = 1_000_000_000 / mean_read_frame_elapsed_ns
print("read_frame_throughput_in_sec:", read_frame_throughput_in_sec)

print("total_detection_elapsed_ns:", total_detection_elapsed_ns)
print("total_detection_count:", total_detection_count)
mean_detection_elapsed_ns = total_detection_elapsed_ns / total_detection_count
print("mean_detection_elapsed_ms:", mean_detection_elapsed_ns / 1000 / 1000)
detection_throughput_in_sec = 1_000_000_000 / mean_detection_elapsed_ns
print("detection_throughput_in_sec:", detection_throughput_in_sec)
"""
