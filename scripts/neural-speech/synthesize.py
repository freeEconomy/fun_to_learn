"""Offline neural synthesis. Does not download models or modify deployed assets."""

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import wave


ARTIFACTS = {
    "kokoro-v1.0.onnx": "beb0d1848dee9a49da392cc3df26958d46cfa35d321edf434f52949153f0df3a",
    "voices-v1.0.bin": "bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d",
}


def verify_models(directory):
    """Hashes published by the upstream model-files-v1.1 GitHub release."""
    for name, expected in ARTIFACTS.items():
        path = directory / name
        if not path.is_file():
            raise ValueError(f"Missing model: {path}. See docs/neural-speech.md.")
        digest = hashlib.sha256()
        with path.open("rb") as source:
            for chunk in iter(lambda: source.read(1024 * 1024), b""):
                digest.update(chunk)
        actual = digest.hexdigest()
        if actual != expected:
            raise ValueError(f"Model checksum mismatch: {name}; refusing synthesis.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--models", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    verify_models(args.models)

    # Import only after integrity checks; --help needs no neural dependencies.
    import numpy as np
    import onnxruntime as ort
    from kokoro_onnx import Kokoro

    manifest = json.loads(args.manifest.read_text())
    voice = manifest["voice"]
    args.output.mkdir(parents=True, exist_ok=True)
    options = ort.SessionOptions()
    options.intra_op_num_threads = 4
    options.inter_op_num_threads = 1
    session = ort.InferenceSession(
        str(args.models / "kokoro-v1.0.onnx"),
        sess_options=options,
        providers=["CPUExecutionProvider"],
    )
    model = Kokoro.from_session(session, str(args.models / "voices-v1.0.bin"))
    model.get_voice_style(voice["voice"])  # Fail early if the requested voice is absent.
    for number, item in enumerate(manifest["clips"], 1):
        text = item["text"]
        spoken = text if text.endswith((".", "!", "?")) else text + "."
        samples, rate = model.create(
            spoken, voice=voice["voice"], lang="en-us", speed=1.0
        )
        samples = np.asarray(samples, dtype=np.float32).reshape(-1)
        if rate != voice["sampleRate"]:
            raise ValueError(f"Unexpected sample rate: {rate}")
        if not np.isfinite(samples).all() or len(samples) < rate // 10:
            raise ValueError(f"Invalid neural audio: {text}")
        if float(np.max(np.abs(samples))) < 0.005:
            raise ValueError(f"Silent neural audio: {text}")
        # Guard first/last consonants from abrupt media boundaries.
        samples = np.pad(samples, (round(rate * 0.10), round(rate * 0.14)))
        pcm = (np.clip(samples, -1, 1) * 32767).astype("<i2")
        wav = args.output / "current.wav"
        with wave.open(str(wav), "wb") as output:
            output.setnchannels(1)
            output.setsampwidth(2)
            output.setframerate(rate)
            output.writeframes(pcm.tobytes())
        target = args.output / item["file"]
        subprocess.run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin",
            "-i", str(wav), "-ar", str(rate), "-ac", "1", "-c:a", "libmp3lame",
            "-b:a", voice["bitrate"], "-map_metadata", "-1", "-y", str(target),
        ], check=True)
        if target.stat().st_size < 900:
            raise ValueError(f"Incomplete encoded audio: {text}")
        if number == 1 or number % 25 == 0 or number == len(manifest["clips"]):
            print(f"Neural audio: {number}/{len(manifest['clips'])}", flush=True)
    (args.output / "current.wav").unlink(missing_ok=True)


if __name__ == "__main__":
    main()
