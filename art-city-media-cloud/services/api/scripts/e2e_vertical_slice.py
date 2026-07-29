#!/usr/bin/env python3
"""End-to-end vertical slice: login → upload → process → search."""

from __future__ import annotations

import hashlib
import math
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import httpx

API = "http://127.0.0.1:8000"


def main() -> int:
    with tempfile.TemporaryDirectory() as tmp:
        sample = Path(tmp) / "e2e.mp4"
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-f",
                "lavfi",
                "-i",
                "testsrc=size=640x360:rate=25",
                "-f",
                "lavfi",
                "-i",
                "sine=frequency=440:sample_rate=44100",
                "-t",
                "2",
                "-c:v",
                "libx264",
                "-pix_fmt",
                "yuv420p",
                "-c:a",
                "aac",
                str(sample),
            ],
            check=True,
            capture_output=True,
        )
        data = sample.read_bytes()
        checksum = hashlib.sha256(data).hexdigest()

        with httpx.Client(base_url=API, timeout=60.0) as client:
            login = client.post(
                "/api/v1/auth/login",
                json={
                    "email": "admin@artcity.example",
                    "password": "ChangeMeNow!",
                    "tenant_slug": "art-city",
                },
            )
            login.raise_for_status()
            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            asset = client.post(
                "/api/v1/assets",
                headers=headers,
                json={"title": "E2E Newroz sample", "description": "vertical slice fixture", "asset_type": "video"},
            )
            asset.raise_for_status()
            asset_id = asset.json()["id"]
            print("asset", asset_id)

            upload = client.post(
                "/api/v1/uploads",
                headers=headers,
                json={
                    "asset_id": asset_id,
                    "filename": sample.name,
                    "size_bytes": len(data),
                    "mime_type": "video/mp4",
                    "idempotency_key": f"e2e-{asset_id}",
                },
            )
            upload.raise_for_status()
            session = upload.json()
            print("upload", session["id"], "parts", session["part_count"])

            parts = []
            part_size = session["part_size_bytes"]
            for part in session["parts"]:
                start = (part["part_number"] - 1) * part_size
                end = min(start + part_size, len(data))
                chunk = data[start:end]
                put = httpx.put(part["url"], content=chunk, timeout=60.0)
                put.raise_for_status()
                etag = put.headers.get("ETag") or put.headers.get("etag")
                assert etag, "missing etag"
                parts.append({"part_number": part["part_number"], "etag": etag.strip('"')})

            complete = client.post(
                f"/api/v1/uploads/{session['id']}/complete",
                headers=headers,
                json={"parts": parts, "checksum_sha256": checksum},
            )
            complete.raise_for_status()
            job = complete.json()
            print("job", job["id"], job["status"])

            for _ in range(80):
                job = client.get(f"/api/v1/jobs/{job['id']}", headers=headers).json()
                print("job status", job["status"], job["progress"], job.get("error_message"))
                if job["status"] in {"succeeded", "failed"}:
                    break
                time.sleep(1.5)

            assert job["status"] == "succeeded", job
            detail = client.get(f"/api/v1/assets/{asset_id}", headers=headers)
            detail.raise_for_status()
            body = detail.json()
            assert body["status"] == "Ready", body["status"]
            profiles = {r["profile"] for r in body["renditions"]}
            assert "proxy" in profiles and "thumbnail" in profiles, profiles
            assert body["files"][0]["checksum_sha256"] == checksum

            search = client.get("/api/v1/search/assets", headers=headers, params={"q": "newroz"})
            search.raise_for_status()
            ids = {i["id"] for i in search.json()["items"]}
            assert asset_id in ids, "search miss"
            print("VERTICAL SLICE OK")
            return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print("VERTICAL SLICE FAILED:", exc, file=sys.stderr)
        raise
