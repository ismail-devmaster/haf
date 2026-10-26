# Validation Report — Domolux

## What was tested

- Existing TFLite model load (LiteRT): PASS (input [1,16,96], output [1,1])
- openwakeword.Model load: FAIL (expects ONNX, file is TFLite)
- Audio analysis (domolux_real_20261020_171741.wav): **FULL SILENCE** (0 non-zero samples out of 192000, 6.0s @16kHz)
- Audio analysis (domolux_test.wav, backup/domolux_test.wav.original): **FULL SILENCE** (0 non-zero samples)
- Inference on silence: scores ~1.1e-08 (expected baseline for silent input)
- Feature extraction pipeline: VERIFIED (ONNX mel + embedding models load and produce [1,16,96] features)

## Critical blocker

**All persisted audio files are completely silent.** The file referenced as "verified mic recording" in commit messages (`/tmp/domolux_mic_test.wav`) was an ephemeral temp file that no longer exists and was never committed to git. The committed file `domolux_real_20261020_171741.wav` contains all-zero PCM samples.

## What cannot be verified

- Real microphone validation: **BLOCKED** — no non-silent audio recording available
- True positive detection: cannot confirm without actual "Domolux" utterance
- Score threshold: cannot establish without positive/negative score distributions
- False positive rate: cannot measure with silence-only input
- French/Algerian pronunciation: requires actual speech
- Model provenance: no training artifacts available to confirm weights are trained, not random

## Confirmed facts

| Item                              | Status                                       |
| --------------------------------- | -------------------------------------------- |
| Model loads via LiteRT            | ✅ PASS                                      |
| Model input shape correct         | ✅ [1,16,96] float32                         |
| Model output shape correct        | ✅ [1,1] float32                             |
| ONNX feature extractor loads      | ✅ melspectrogram.onnx, embedding_model.onnx |
| Script runs end-to-end            | ✅ No runtime errors                         |
| Features have correct shape       | ✅ [1,16,96]                                 |
| Silence produces near-zero scores | ✅ Expected baseline                         |

## What needs to happen to proceed

1. Record a fresh 3-5 second audio of someone saying "Domolux" clearly
2. Save as a WAV file (16-bit, 16kHz, mono) in the `domolux_wake_word/` directory
3. Update `scripts/test_inference.py` to use that filename or pass it as argument:
   ```bash
   python scripts/test_inference.py my_recording.wav
   ```
4. Review the measured scores in `reports/validation_report.json` to determine if detection threshold is viable
