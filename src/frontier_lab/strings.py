from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True)
class StringHit:
    offset: int
    text: str


def extract_ascii_strings(
    path: Path,
    *,
    min_len: int = 5,
    max_count: int | None = None,
    chunk_size: int = 64 * 1024,
) -> Iterable[StringHit]:
    if min_len < 1:
        raise ValueError("min_len must be at least 1")

    found = 0
    buffer = bytearray()
    start_offset = 0
    absolute_offset = 0

    with path.open("rb") as handle:
        while True:
            chunk = handle.read(chunk_size)
            if not chunk:
                break

            for index, byte in enumerate(chunk):
                if _is_printable_ascii(byte):
                    if not buffer:
                        start_offset = absolute_offset + index
                    buffer.append(byte)
                    continue

                hit = _flush_buffer(buffer, start_offset, min_len)
                if hit:
                    yield hit
                    found += 1
                    if max_count is not None and found >= max_count:
                        return
                buffer.clear()

            absolute_offset += len(chunk)

    hit = _flush_buffer(buffer, start_offset, min_len)
    if hit:
        yield hit


def _flush_buffer(
    buffer: bytearray,
    start_offset: int,
    min_len: int,
) -> StringHit | None:
    if len(buffer) < min_len:
        return None
    text = bytes(buffer).decode("ascii", errors="replace")
    return StringHit(offset=start_offset, text=text)


def _is_printable_ascii(byte: int) -> bool:
    return byte == 9 or 32 <= byte <= 126
