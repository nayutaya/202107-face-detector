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


@click.command()
@click.argument("result_file_path", type=click.Path(exists=True))
@click.argument("output_file_path", type=click.Path(exists=False))
def main(result_file_path, output_file_path):
    video_meta, video_frame_table = read_result_file(result_file_path)

    result = [
        [
            frame_index,
            [
                [
                    face["score"],
                    [
                        face["boundingBox"]["x1"],
                        face["boundingBox"]["y1"],
                        face["boundingBox"]["x2"],
                        face["boundingBox"]["y2"],
                    ],
                    [
                        [
                            point["x"],
                            point["y"],
                        ]
                        for point in face["keyPoints"]
                    ],
                    [
                        face["attributes"]["sex"],
                        face["attributes"]["age"],
                    ],
                ]
                for face in video_frame_table[frame_index]["result"]["response"][
                    "faces"
                ]
            ],
        ]
        for frame_index in range(len(video_frame_table))
    ]

    with open(output_file_path, "w") as file:
        json.dump(
            result, file, sort_keys=True, separators=(",", ":"), ensure_ascii=False
        )


if __name__ == "__main__":
    main()
