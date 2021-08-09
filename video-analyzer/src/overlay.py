#!/usr/bin/env python3

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


@click.command()
@click.argument("video_file_path", type=click.Path(exists=True))
@click.argument("result_file_path", type=click.Path(exists=True))
@click.argument("output_file_path", type=click.Path(exists=False))
def main(video_file_path, result_file_path, output_file_path):
    video_meta, video_frame_table = read_result_file(result_file_path)
    print(video_meta)
    print(len(video_frame_table))

    video_capture = cv2.VideoCapture(video_file_path)
    video_writer = cv2.VideoWriter(
        output_file_path,
        cv2.VideoWriter_fourcc("m", "p", "4", "v"),
        video_meta["fps"],
        (video_meta["width"], video_meta["height"]),
    )

    # while True:
    for _ in range(10):
        result, frame = video_capture.read()
        if not result:
            break
        video_writer.write(frame)

    video_writer.release()


if __name__ == "__main__":
    main()
