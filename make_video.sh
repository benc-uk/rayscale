#!/bin/bash

pushd "$1"
ffmpeg -framerate 30 -i "result_%05d.png" -vcodec libx264 -pix_fmt yuv420p -y output.mp4
popd