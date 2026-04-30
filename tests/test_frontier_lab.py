from __future__ import annotations

import struct
import sys
import tempfile
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from frontier_lab.chunks import parse_riff_chunks
from frontier_lab.scan import scan_tree
from frontier_lab.signatures import detect_file_type
from frontier_lab.strings import extract_ascii_strings


class FrontierLabTests(unittest.TestCase):
    def test_detects_riff_wave(self) -> None:
        detected = detect_file_type(b"RIFF\x24\x00\x00\x00WAVEfmt ")
        self.assertEqual(detected.kind, "WAV audio")
        self.assertEqual(detected.category, "audio")

    def test_extracts_ascii_strings_with_offsets(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "sample.bin"
            path.write_bytes(b"\x00\x01HELLO_WORLD\x00BYE")

            hits = list(extract_ascii_strings(path, min_len=5))

        self.assertEqual(hits[0].offset, 2)
        self.assertEqual(hits[0].text, "HELLO_WORLD")

    def test_parses_riff_chunks(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "sample.wav"
            payload = b"abc"
            riff_size = 4 + 8 + len(payload) + 1
            path.write_bytes(
                b"RIFF"
                + struct.pack("<I", riff_size)
                + b"WAVE"
                + b"data"
                + struct.pack("<I", len(payload))
                + payload
                + b"\x00"
            )

            chunks = list(parse_riff_chunks(path))

        self.assertEqual(len(chunks), 1)
        self.assertEqual(chunks[0].chunk_id, "data")
        self.assertEqual(chunks[0].size, 3)

    def test_scans_tree(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "readme.txt").write_text("hello frontier", encoding="utf-8")

            records = scan_tree(root, include_hash=False, string_preview_count=1)

        self.assertEqual(len(records), 1)
        self.assertEqual(records[0].category, "text")


if __name__ == "__main__":
    unittest.main()
