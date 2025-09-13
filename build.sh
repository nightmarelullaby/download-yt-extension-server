#!/bin/bash
apt-get update && apt-get install -y python3-pip
pip3 install yt-dlp
pnpm install --frozen-lockfile
