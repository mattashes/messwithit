from __future__ import annotations

import csv
from dataclasses import asdict, dataclass
import hashlib
import json
from pathlib import Path

from frontier_lab.signatures import detect_file_type
from frontier_lab.statistics import printable_ratio, shannon_entropy
from frontier_lab.strings import extract_ascii_strings


@dataclass(frozen=True)
class FileRecord:
    relative_path: str
    extension: str
    size: int
    sha256: str
    kind: str
    category: str
    confidence: str
    entropy: float
    printable_ratio: float
    magic_hex: str
    strings_preview: list[str]
    notes: list[str]

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


def scan_tree(
    root: Path,
    *,
    include_hash: bool = True,
    string_preview_count: int = 6,
) -> list[FileRecord]:
    root = root.expanduser().resolve()
    if not root.exists():
        raise FileNotFoundError(root)
    if not root.is_dir():
        raise NotADirectoryError(root)

    records: list[FileRecord] = []
    for path in sorted(root.rglob("*")):
        if not path.is_file() or path.is_symlink():
            continue
        records.append(
            inspect_file(
                path,
                root,
                include_hash=include_hash,
                string_preview_count=string_preview_count,
            )
        )
    return records


def inspect_file(
    path: Path,
    root: Path,
    *,
    include_hash: bool,
    string_preview_count: int,
) -> FileRecord:
    size = path.stat().st_size
    sample = _read_prefix(path, byte_count=65536)
    detected = detect_file_type(sample, path.suffix)
    notes = list(detected.notes)

    entropy = shannon_entropy(sample)
    ratio = printable_ratio(sample)
    if size > 0 and entropy >= 7.5:
        notes.append("high entropy: may be compressed, encrypted, or media data")
    if ratio >= 0.85 and detected.category == "unknown":
        notes.append("mostly printable: may be text or script data")

    string_hits = list(
        extract_ascii_strings(
            path,
            min_len=5,
            max_count=max(0, string_preview_count),
        )
    )

    return FileRecord(
        relative_path=path.relative_to(root).as_posix(),
        extension=path.suffix.lower(),
        size=size,
        sha256=_sha256(path) if include_hash else "",
        kind=detected.kind,
        category=detected.category,
        confidence=detected.confidence,
        entropy=round(entropy, 3),
        printable_ratio=round(ratio, 3),
        magic_hex=sample[:16].hex(" "),
        strings_preview=[hit.text for hit in string_hits],
        notes=notes,
    )


def write_inventory(records: list[FileRecord], out_dir: Path) -> tuple[Path, Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    json_path = out_dir / "inventory.json"
    csv_path = out_dir / "inventory.csv"

    json_path.write_text(
        json.dumps([record.to_dict() for record in records], indent=2),
        encoding="utf-8",
    )

    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        fieldnames = list(FileRecord.__dataclass_fields__.keys())
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for record in records:
            row = record.to_dict()
            row["strings_preview"] = " | ".join(record.strings_preview)
            row["notes"] = " | ".join(record.notes)
            writer.writerow(row)

    return json_path, csv_path


def _read_prefix(path: Path, *, byte_count: int) -> bytes:
    with path.open("rb") as handle:
        return handle.read(byte_count)


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()
