#!/bin/bash
# Reproducible openWakeWord training script for Domolux
# BLOCKED until: pip install openwakeword + tensorflow/torch + audio recordings
set -euo pipefail
MODEL_NAME="domolux"
OUTPUT="artifacts/${MODEL_NAME}.tflite"
echo "[BLOCKED] openWakeWord framework missing. Would run:"
echo "  openwakeword-train --model ${MODEL_NAME} --positive training/positive/ --negative training/negative/ --output ${OUTPUT}"
echo "Requires: openwakeword package, tflite runtime, microphone recordings, compute."
