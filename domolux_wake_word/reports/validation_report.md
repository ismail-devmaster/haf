# Validation Report — Domolux

## What was tested
- Existing TFLite model load (LiteRT): PASS (input [1,16,96], output [1,1])
- openwakeword.Model load: FAIL (expects ONNX, file is TFLite)
- Audio analysis (domolux_test.wav): FULL SILENCE (all zero amplitude, 10s @16kHz)
- Inference on silence: expected near-zero scores; no false claim of detection
- Synthetic positive: 0 (not generated — disk too full for full dataset)
- Real microphone: 0 (requires user to speak)
- False positive rate per hour: NOT CALCULABLE (only silence; not enough data)

## Separated clearly
- Synthetic: not performed (blocked by disk / no recordings)
- Real microphone: not performed (requires user's physical action — prepare and give one instruction)
- Home Assistant integration: NOT TESTED (no /share access, no deployment)

## What remains unverified
- French pronunciation improvement over English TTS
- Algerian accent robustness
- True positive rate on real "Domolux" utterance
- False activation in household noise
- Integration with Home Assistant Assist pipeline

## Recommended single next action from user
Record a 3-5 second audio of yourself saying "Domolux" clearly, save as `domolux_real.wav`, and run `scripts/test_inference.py domolux_real.wav`.
