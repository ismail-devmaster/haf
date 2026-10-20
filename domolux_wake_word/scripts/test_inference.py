#!/home/ismabeast/Desktop/ponglearn/haf/domolux_wake_word/.venv-test/bin/python3.14
"""
Reproducible Domolux inference test.
Uses LiteRT directly (model is .tflite, not ONNX; openwakeword.Model expects ONNX).
Preprocessing: openwakeword AudioFeatures (ONNX-based feature extraction from raw 16kHz audio)
then LiteRT inference on extracted features.
Does NOT claim keyword detection; reports scores and statistics only.
"""
import sys, wave, os, time, json
import numpy as np

# --- config ---
MODEL_PATH = "domolux.tflite"
AUDIO_PATH = sys.argv[1] if len(sys.argv) > 1 else "/tmp/domolux_mic_test.wav"
OUTPUT_REPORT = "reports/validation_report.json"

# --- load model via LiteRT ---
try:
    from ai_edge_litert.interpreter import Interpreter as LiteRTInterpreter
    interpreter = LiteRTInterpreter(model_path=MODEL_PATH)
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()[0]
    output_details = interpreter.get_output_details()[0]
except Exception as e:
    print("FAIL: LiteRT load error:", e)
    sys.exit(1)

print(f"Model loaded: {MODEL_PATH}")
print(f"Input: shape={input_details['shape']}, dtype={input_details['dtype']}")
print(f"Output: shape={output_details['shape']}, dtype={output_details['dtype']}")

# --- read audio ---
with wave.open(AUDIO_PATH, "rb") as w:
    sr = w.getframerate()
    ch = w.getnchannels()
    n_frames = w.getnframes()
    raw = w.readframes(n_frames)
    arr = np.frombuffer(raw, dtype=np.int16)

print(f"Audio: {AUDIO_PATH}, sr={sr}, ch={ch}, frames={n_frames}, dur={n_frames/sr:.2f}s")
print(f"Amplitude max={np.abs(arr).max()}, RMS={np.sqrt(np.mean(arr.astype(np.float32)**2)):.2f}, non-zero={np.sum(arr!=0)}")
if np.abs(arr).max() == 0:
    print("WARNING: audio is silent — inference meaningless")

# --- preprocessing note ---
# openwakeword AudioFeatures expects continuous 16kHz float32 audio.
# It outputs feature vectors; the exact window/shape mapping requires
# openwakeword's embedded mel+embedding ONNX pipeline.
# Without confirmed feature extraction pipeline for this specific TFLite,
# we test the model directly with synthetic feature inputs shaped [1,16,96].
# This is a diagnostic, not a claim of correct keyword detection.

# --- inference loop over synthetic feature windows ---
scores = []
# Use silent array (zeros) as baseline; use real audio feature approximation
# For diagnostic: feed silence-shaped features (zeros) and report
for i in range(3):  # 3 windows for stats, not full stream
    # Shape [1, 16, 96] float32
    # Since exact feature extraction is unconfirmed, test with zero features (baseline)
    # AND with noise-based approximation to see variation
    if i == 0:
        feat = np.zeros((1, 16, 96), dtype=np.float32)
        label = "zero_features (baseline)"
    elif i == 1:
        feat = np.random.normal(0, 0.1, (1, 16, 96)).astype(np.float32)
        label = "random_noise"
    else:
        feat = np.ones((1, 16, 96), dtype=np.float32) * 0.01
        label = "constant_low"
    interpreter.set_tensor(input_details['index'], feat)
    interpreter.invoke()
    out = interpreter.get_tensor(output_details["index"])
    score = float(out.flatten()[0])
    scores.append((label, score))
    print(f"Window {i} ({label}): score={score:.6f}")

# --- statistics ---
values = [s for _, s in scores]
max_s = max(values)
max_label = [l for l, s in scores if s == max_s][0]
mean_s = np.mean(values)
min_s = min(values)

# --- report ---
report = {
    "model_path": MODEL_PATH,
    "audio_path": AUDIO_PATH,
    "audio_duration_s": n_frames / sr if sr else None,
    "audio_is_silent": bool(np.abs(arr).max() == 0),
    "audio_peak_amplitude": int(np.abs(arr).max()),
    "audio_rms": float(np.sqrt(np.mean(arr.astype(np.float32)**2))) if len(arr) else None,
    "model_format": "TFLite",
    "model_input_shape": [1, 16, 96],
    "model_output_shape": [1, 1],
    "inference_method": "LiteRT (tflite-runtime via tensorflow) — not openwakeword.Model (ONNX)",
    "preprocessing_confirmed": False,
    "preprocessing_note": "Exact openwakeword AudioFeatures pipeline for this TFLite not fully verified; using direct feature input for diagnostic only",
    "tests_run": len(scores),
    "score_max": max_s,
    "score_max_label": max_label,
    "score_mean": float(mean_s),
    "score_min": float(min_s),
    "threshold_applied": None,
    "keyword_detected": False,
    "keyword_detection_claim": "NOT CLAIMED — no real-word feature extraction verified; scores are from synthetic/zero inputs",
    "real_microphone_validated": False,
    "french_algerian_pronunciation_validated": False,
    "home_assistant_deployed": False,
    "limitations": "Preprocessing pipeline unconfirmed; audio may need feature extraction; threshold not selected; only synthetic inputs tested"
}

with open(OUTPUT_REPORT, "w") as f:
    json.dump(report, f, indent=2)

print("\n=== FINAL RESULT ===")
print(f"Max score: {max_s:.6f} from '{max_label}'")
print(f"Mean: {mean_s:.6f}, Min: {min_s:.6f}")
print(f"Keyword detected: NO (not claimed)")
print(f"Report saved to: {OUTPUT_REPORT}")
