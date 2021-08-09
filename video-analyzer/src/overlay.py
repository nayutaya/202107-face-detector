#!/usr/bin/env python3

import itertools
import json

import click
import cv2


def read_result_file(file_path):
    video_frame_table = {}
    with open(file_path, "r") as file:
        video_meta = json.loads(file.readline())
        for line in file:
            if line is None:
                break
            record = json.loads(line)
            frame_index = record["frame_index"]
            video_frame_table[frame_index] = record
    return (video_meta, video_frame_table)


def draw_detection_result(frame, result):
    color = (255, 255, 255)
    faces = result["result"]["response"]["faces"]
    for face in faces:
        bbox = face["boundingBox"]
        x1, y1, x2, y2 = bbox["x1"], bbox["y1"], bbox["x2"], bbox["y2"]
        cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), color, thickness=2)


@click.command()
@click.argument("video_file_path", type=click.Path(exists=True))
@click.argument("result_file_path", type=click.Path(exists=True))
@click.argument("output_file_path", type=click.Path(exists=False))
def main(video_file_path, result_file_path, output_file_path):
    video_meta, video_frame_table = read_result_file(result_file_path)

    video_capture = cv2.VideoCapture(video_file_path)
    video_writer = cv2.VideoWriter(
        output_file_path,
        cv2.VideoWriter_fourcc("m", "p", "4", "v"),
        video_meta["fps"],
        (video_meta["width"], video_meta["height"]),
    )

    for frame_index in itertools.count():
        result, frame = video_capture.read()
        if not result:
            break

        draw_detection_result(frame, video_frame_table[frame_index])
        video_writer.write(frame)

    video_writer.release()


if __name__ == "__main__":
    main()
