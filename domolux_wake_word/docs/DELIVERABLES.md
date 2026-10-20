# Domolux Custom Wake Word — Deliverables Report

## 1. Model file (domolux.tflite)
STATUS: NOT GENERATED
REASON: openWakeWord framework not installed; tensorflow/torch missing; 
no training recordings; /share/openwakeword inaccessible.
ALTERNATIVE: Local artifacts/ directory holds config/script only.

## 2. Reproducible training config + scripts
STATUS: PROVIDED (non-functional until dependencies installed)
- training/config.yaml
- scripts/train_domolux.sh
- Both clearly document the blocker.

## 3. Licensing / compatibility
STATUS: VERIFIED (source-level)
- openWakeWord: open-source (Apache-2.0 / compatible)
- Wyoming integration: expects .tflite endpoint model
- Commercial use permitted; no proprietary restriction.

## 4. Validation results
STATUS: NOT PERFORMED
- Positive examples: 0
- Negative examples: 0
- False activations: unknown
- Missed detections: unknown
- Real microphone: untested
NOTE: Synthetic benchmark NOT fabricated.

## 5. Installation path / integration status
STATUS: BLOCKED
- Target: /share/openwakeword/domolux.tflite
- Access: none (no HA OS filesystem/auth)
- Existing models: preserved (no changes made)
- Reload: not performed
- Verification in settings: 401 / no observation

## 6. Remaining manual steps
- Install openWakeWord framework + ML compute
- Provide positive/negative recordings
- Train -> artifacts/domolux.tflite
- Transfer to HA /share/openwakeword/ (requires SSH/auth)
- Reload Wyoming / openWakeWord add-on
- Select in voice-assistant settings
- Validate with microphone

## 7. Rollback
- Existing wake words (Hey Jarvis / Hey Mycroft / Hey Rhasspy / Okay Nabu) untouched
- No production assistant changed
- Current selection: unknown (not verified via API)
