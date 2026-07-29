from pathlib import Path

from app.media import generate_proxy, generate_thumbnail, probe_media, sha256_file


def test_sha256_and_probe_fixture(tmp_path: Path):
    source = tmp_path / "sample.mp4"
    # Generate a tiny test clip with ffmpeg
    import subprocess

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "lavfi",
            "-i",
            "testsrc=size=320x240:rate=15",
            "-f",
            "lavfi",
            "-i",
            "sine=frequency=880:sample_rate=44100",
            "-t",
            "1",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            str(source),
        ],
        check=True,
        capture_output=True,
    )
    digest = sha256_file(source)
    assert len(digest) == 64
    meta = probe_media(source)
    assert meta.get("width") == 320
    assert meta.get("height") == 240

    proxy = tmp_path / "proxy.mp4"
    thumb = tmp_path / "thumb.jpg"
    generate_proxy(source, proxy)
    generate_thumbnail(source, thumb, at_seconds=0.2)
    assert proxy.exists() and proxy.stat().st_size > 0
    assert thumb.exists() and thumb.stat().st_size > 0
