#!/bin/bash

framerate=30

if [[ -z $1 ]]; then 
  echo "Supply result directory!"
  exit
fi

if [[ -z $2 ]]; then 
  framerate=30
else
  framerate=$2
fi

pushd "$1"
ffmpeg -hide_banner -loglevel warning -framerate $framerate -i "result_%05d.png" -vcodec libx264 -pix_fmt yuv420p -tune animation -preset veryslow -y video.mp4
popd