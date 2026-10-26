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

## Updated — Script repaired, inference executed on persisted audio (2026-10-21)

### Script status

- `scripts/test_inference.py` repaired: float32 cast fixed for mel ONNX input (was int16 → ONNX runtime error)
- Loads LiteRT TFLite model + openwakeword ONNX feature extractors (melspectrogram.onnx + embedding_model.onnx)
- Feature pipeline verified: mel → 76-frame sliding window (step 8) → 96-dim embeddings → [1,16,96] tensor
- Runs correctly on both silent and non-silent audio

### Critical finding: all persisted audio is silent

- `domolux_real_20261020_171741.wav`: 192000 audio bytes, **0 non-zero** (full silence)
- `domolux_test.wav`: 320000 audio bytes, **0 non-zero** (full silence)
- `backup/domolux_test.wav.original`: 320000 audio bytes, **0 non-zero** (full silence)
- `/tmp/domolux_mic_test.wav` referenced in commit 0fa7b73165: **no longer exists** (ephemeral temp file)
- Git history confirms the recording was never committed — blob content is text, not WAV data

### Inference results on silent input

- 75 windows processed over 6.0s of silence
- Scores: max=1.12e-08, mean=1.12e-08, min=1.12e-08 (consistent with silent-input baseline)
- Expected: silence produces near-zero scores; no false claim of detection

### What is blocked

- **No non-silent audio recording exists.** Without a real "Domolux" utterance, cannot:
  - Verify that the model produces elevated scores on the target word
  - Establish a detection threshold from positive/negative score distributions
  - Confirm the preprocessing pipeline produces features that the TFLite model responds to

### What is confirmed

- Model loads via LiteRT; input [1,16,96] float32; output [1,1] float32
- Feature pipeline is architecturally correct (ONNX mel + embedding models from openwakeword 0.4.0)
- Script runs end-to-end without errors on available audio

### What is NOT confirmed

- Whether the TFLite model was trained from the intended Domolux classifier (no training provenance)
- Whether the model responds to real speech (no non-silent audio available)
- Whether scores saturate at 1.0 on valid input (previous observation was on synthetic random input, not real features)
- French/Algerian pronunciation robustness
- Detection threshold

## Streaming Inference & Provenance Audit (2026-10-21)

### 1. Feature Reuse Bug Fix & Results

- **Bug Fixed**: Previously, `scripts/test_inference.py` reused the same precomputed feature tensor across all time windows, resulting in flat scores (`1.84e-08`).
- **Fix Applied**: Implemented chronological streaming feature extraction via `openwakeword.utils.AudioFeatures` processing 80ms chunks (1280 samples) per window.
- **Real Audio (`domolux_real_20261021_120647.wav`, 6s)**:
  - Total windows: 75
  - Score Range: `3.94e-11` to `1.11e-08`
  - Mean: `5.82e-10`, Std: `1.40e-09`
  - Peak score: `1.11e-08` at `720ms`
- **Silence Control**:
  - Score Range: `3.75e-10` to `2.59e-09`
  - Mean: `6.75e-10`
- **Separation Analysis**: Real audio scores and silence scores completely overlap within the same tight range (`~1e-10` to `~1e-8`). There is no discriminative activation spike indicating keyword detection.

### 2. Provenance & Training Feasibility

- **Model Provenance**: `docs/DELIVERABLES.md` explicitly states `STATUS: NOT GENERATED` for `domolux.tflite`. There are no training logs, dataset checkpoints, or conversion records. The model loads successfully via LiteRT with correct input shape `[1,16,96]`, but has **no verifiable training provenance**.
- **Resource Constraints**: Disk free space is critically low at **141 MB** (`/dev/sda1` 100% full).
- **Dependency Limitations**: Training requires PyTorch, TensorFlow, Piper TTS, and large dataset downloads (MIT RIRs, ACAV100M features) which exceed available disk space and environment capabilities.
- **Conclusion**: Retraining or recovering a validated Domolux model is unfeasible in this environment. The existing `domolux.tflite` is unverified and exhibits no separation from silence.
