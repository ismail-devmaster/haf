# Phase A — Initial Audit

## Project
/path: /home/ismabeast/Desktop/ponglearn/haf/domolux_wake_word

## Files present
- domolux.tflite (860300 B, 2026-10-20 15:28)
- domolux_test.wav (320044 B, 2026-10-20 16:44) — FULL SILENCE, 10s 16kHz mono
- domolux_wake_word_training.ipynb (12314 B)
- training/config.yaml
- .venv-test/ with openwakeword 0.4.0, python 3.14.7, numpy 2.5.4, onnxruntime 1.31.0

## Disk
212G total, 201G used, ~185M free — critical limitation

## Backups
- artifacts/domolux.tflite.original
- artifacts/domolux_test.wav.original

## Venv
Python 3.14.7; openwakeword 0.4.0 installed; no train.py in package (only model.py, custom_verifier_model.py, etc.)

## Key finding
Existing TFLite model loads with LiteRT (input [1,16,96] float32, output [1,1] float32) but openwakeword.Model expects ONNX, causing INVALID_PROTOBUF.
Audio recording is entirely silent — no usable test material without new recordings.
