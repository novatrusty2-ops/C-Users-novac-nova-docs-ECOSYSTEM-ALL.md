from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
from pathlib import Path
from typing import Any


def sha256_file(path: str | Path, chunk_size: int = 1024 * 1024) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as fh:
        while True:
            chunk = fh.read(chunk_size)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def probe_media(path: str | Path) -> dict[str, Any]:
    """Extract technical metadata via ffprobe (JSON). Falls back to mediainfo if needed."""
    path = str(path)
    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v",
                "quiet",
                "-print_format",
                "json",
                "-show_format",
                "-show_streams",
                path,
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        data = json.loads(result.stdout or "{}")
        format_info = data.get("format") or {}
        streams = data.get("streams") or []
        video = next((s for s in streams if s.get("codec_type") == "video"), None)
        audio = next((s for s in streams if s.get("codec_type") == "audio"), None)
        width = int(video["width"]) if video and video.get("width") else None
        height = int(video["height"]) if video and video.get("height") else None
        duration = float(format_info.get("duration") or 0) or None
        return {
            "container": format_info.get("format_name"),
            "duration_seconds": duration,
            "size_bytes": int(format_info.get("size") or 0) or None,
            "bitrate": int(format_info.get("bit_rate") or 0) or None,
            "video_codec": video.get("codec_name") if video else None,
            "audio_codec": audio.get("codec_name") if audio else None,
            "width": width,
            "height": height,
            "resolution": f"{width}x{height}" if width and height else None,
            "frame_rate": video.get("r_frame_rate") if video else None,
            "audio_channels": audio.get("channels") if audio else None,
            "raw": data,
            "probe_tool": "ffprobe",
        }
    except (subprocess.CalledProcessError, FileNotFoundError, json.JSONDecodeError):
        if shutil.which("mediainfo"):
            result = subprocess.run(
                ["mediainfo", "--Output=JSON", path],
                check=True,
                capture_output=True,
                text=True,
            )
            data = json.loads(result.stdout or "{}")
            return {"raw": data, "probe_tool": "mediainfo"}
        raise


def generate_proxy(source: str | Path, dest: str | Path) -> None:
    dest = Path(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(source),
            "-vf",
            "scale='min(1280,iw)':-2",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "28",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-movflags",
            "+faststart",
            str(dest),
        ],
        check=True,
        capture_output=True,
    )


def generate_thumbnail(source: str | Path, dest: str | Path, at_seconds: float = 1.0) -> None:
    dest = Path(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            str(at_seconds),
            "-i",
            str(source),
            "-frames:v",
            "1",
            "-vf",
            "scale='min(640,iw)':-2",
            str(dest),
        ],
        check=True,
        capture_output=True,
    )
