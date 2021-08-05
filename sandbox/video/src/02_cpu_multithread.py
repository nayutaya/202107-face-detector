#!/usr/bin/env python3

import itertools
import logging
import queue
import threading
import time

import cv2
import insightface


def media_thread(in_queue, out_queue):
    logging.info("start")

    total_process_media = 0
    total_process_frame = 0
    total_process_time_ns = 0

    while True:
        file_path = in_queue.get()
        try:
            if file_path is None:
                break
            logging.info("file_path=%s", file_path)

            # process(object_id)

            total_process_media += 1
        finally:
            in_queue.task_done()

    logging.info("total_process_media=%d", total_process_media)
    logging.info("total_process_frame=%d", total_process_frame)
    logging.info("total_process_time_ns=%d", total_process_time_ns)
    logging.info("end")


def main():
    threading.current_thread().name = "main"
    logging.info("start")

    file_queue = queue.Queue()
    file_queue.put("pixabay_76889_960x540.mp4")

    frame_queue = queue.Queue(maxsize=100)

    media_workers = []
    number_of_media_workers = 1
    for thread_index in range(number_of_media_workers):
        media_worker = threading.Thread(
            name="media#{}".format(thread_index),
            target=media_thread,
            daemon=True,
            kwargs={"in_queue": file_queue, "out_queue": frame_queue},
        )
        media_worker.start()
        media_workers.append(media_worker)

    for _ in media_workers:
        file_queue.put(None)

    for media_worker in media_workers:
        media_worker.join()

    logging.info("end")


if __name__ == "__main__":
    logging.basicConfig(
        format="%(asctime)s %(levelname)s [%(threadName)s] %(message)s",
        level=logging.DEBUG,
    )
    main()

"""
face_analysis = insightface.app.FaceAnalysis()
face_analysis.prepare(ctx_id=0, det_size=(640, 640))

capture = cv2.VideoCapture()
assert capture.isOpened()

total_read_frame_elapsed_ns = 0
total_read_frame_count = 0
total_detection_elapsed_ns = 0
total_detection_count = 0

# for frame_index in itertools.count():
for frame_index in range(5):
    start_ns = time.perf_counter_ns()
    result, frame = capture.read()
    read_frame_elapsed_ns = time.perf_counter_ns() - start_ns
    print((frame_index, result, read_frame_elapsed_ns))
    if not result:
        break

    total_read_frame_elapsed_ns += read_frame_elapsed_ns
    total_read_frame_count += 1

    start_ns = time.perf_counter_ns()
    faces = face_analysis.get(frame)
    detection_elapsed_ns = time.perf_counter_ns() - start_ns
    # print(faces)

    total_detection_elapsed_ns += detection_elapsed_ns
    total_detection_count += 1

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
