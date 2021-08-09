#!/usr/bin/env python3

import json

import click


@click.command()
@click.argument("video_file_path", type=click.Path(exists=True))
@click.argument("result_file_path", type=click.Path(exists=True))
@click.argument("output_file_path", type=click.Path(exists=False))
def main(video_file_path, result_file_path, output_file_path):
    frame_table = {}
    with open(result_file_path, "r") as file:
        video_meta = json.loads(file.readline())
        for line in file:
            if line is None:
                break
            record = json.loads(line)
            frame_index = record["frame_index"]
            frame_table[frame_index] = record

    print(video_meta)
    print(len(frame_table))


if __name__ == "__main__":
    main()
