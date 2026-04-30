from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path
import struct
from typing import Iterable


@dataclass(frozen=True)
class RiffChunk:
    chunk_id: str
    offset: int
    data_offset: int
    size: int

    def to_dict(self) -> dict[str, int | str]:
        return asdict(self)


def _fourcc(raw: bytes) -> str:
    return "".join(chr(byte) if 32 <= byte <= 126 else "." for byte in raw)


def parse_riff_chunks(path: Path) -> Iterable[RiffChunk]:
    """Yield top-level RIFF chunks from a WAV/AVI/RMID-style file."""
    with path.open("rb") as handle:
        header = handle.read(12)
        if len(header) < 12 or header[:4] != b"RIFF":
            return

        offset = 12
        while True:
            handle.seek(offset)
            chunk_header = handle.read(8)
            if len(chunk_header) < 8:
                return

            chunk_id = _fourcc(chunk_header[:4])
            size = struct.unpack("<I", chunk_header[4:8])[0]
            data_offset = offset + 8
            yield RiffChunk(
                chunk_id=chunk_id,
                offset=offset,
                data_offset=data_offset,
                size=size,
            )

            offset = data_offset + size + (size % 2)
