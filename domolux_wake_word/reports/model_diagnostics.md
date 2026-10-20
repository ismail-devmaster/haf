# Phase C — Model & Pipeline Diagnostics

## Existing model: domolux.tflite (860300 B)
- Format: TFLite (not ONNX)
- Load test via LiteRT: input [1,16,96] float32; output [1,1] float32 — architecture consistent with openwakeword feature processing
- Load via openwakeword.Model (ONNX runtime): FAILED — INVALID_PROTOBUF (expected ONNX, got TFLite)

## Diagnosis of low scores (~1e-10, last zero)
- User observed scores near zero on 10s recording
- Audio analysis of domolux_test.wav: 160000 frames @16kHz = 10.00s; mono; amplitude all zero (full silence)
- Conclusion: low scores likely caused by silent input + possibly incorrect feature extraction or wrong input format, not necessarily bad weights
- Cannot determine if weights are correct without real audio + correct preprocessing pipeline

## Audio pipeline
- Recording is silent — useless for validation
- Need new recording of target phrase "Domolux" (three syllables: do-mo-lux) with real microphone
- Preprocessing expected: openwakeword feature extraction (not raw audio directly into TFLite in typical pipeline)

## Distinction
- Confirmed: model loads with LiteRT; dimensions match
- Hypothesis: scores near zero on silence = expected; true detection on real audio unverified
- Not confirmed: whether model is trained classifier vs. random/init weights
