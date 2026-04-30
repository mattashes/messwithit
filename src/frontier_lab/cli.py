from __future__ import annotations

import argparse
import csv
from pathlib import Path
from typing import Sequence

from frontier_lab.chunks import parse_riff_chunks
from frontier_lab.scan import scan_tree, write_inventory
from frontier_lab.strings import extract_ascii_strings


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="frontier-lab",
        description="Explore old game folders without modifying them.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    scan_parser = subparsers.add_parser(
        "scan",
        help="Inventory a game folder and classify files.",
    )
    scan_parser.add_argument("root", type=Path, help="Game install folder to scan.")
    scan_parser.add_argument(
        "--out",
        type=Path,
        default=Path("reports"),
        help="Report output directory. Defaults to ./reports.",
    )
    scan_parser.add_argument(
        "--no-hash",
        action="store_true",
        help="Skip SHA-256 hashing for faster scans.",
    )
    scan_parser.add_argument(
        "--string-preview-count",
        type=int,
        default=6,
        help="Readable strings to preview per file. Defaults to 6.",
    )
    scan_parser.set_defaults(func=cmd_scan)

    strings_parser = subparsers.add_parser(
        "strings",
        help="Extract readable ASCII strings from one file.",
    )
    strings_parser.add_argument("file", type=Path, help="File to inspect.")
    strings_parser.add_argument(
        "--min-len",
        type=int,
        default=5,
        help="Minimum string length. Defaults to 5.",
    )
    strings_parser.add_argument(
        "--limit",
        type=int,
        default=100,
        help="Maximum strings to print. Use 0 for no limit.",
    )
    strings_parser.add_argument(
        "--out",
        type=Path,
        help="Optional tab-separated output file.",
    )
    strings_parser.set_defaults(func=cmd_strings)

    chunks_parser = subparsers.add_parser(
        "chunks",
        help="List top-level RIFF chunks from WAV/AVI/RMID files.",
    )
    chunks_parser.add_argument("file", type=Path, help="RIFF file to inspect.")
    chunks_parser.add_argument(
        "--out",
        type=Path,
        help="Optional CSV output file.",
    )
    chunks_parser.set_defaults(func=cmd_chunks)

    return parser


def cmd_scan(args: argparse.Namespace) -> int:
    records = scan_tree(
        args.root,
        include_hash=not args.no_hash,
        string_preview_count=args.string_preview_count,
    )
    json_path, csv_path = write_inventory(records, args.out)

    print(f"Scanned {len(records)} files")
    print(f"Wrote {json_path}")
    print(f"Wrote {csv_path}")
    return 0


def cmd_strings(args: argparse.Namespace) -> int:
    limit = None if args.limit == 0 else args.limit
    hits = list(
        extract_ascii_strings(args.file, min_len=args.min_len, max_count=limit)
    )
    lines = [f"0x{hit.offset:08x}\t{hit.text}" for hit in hits]

    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")
        print(f"Wrote {len(lines)} strings to {args.out}")
    else:
        for line in lines:
            print(line)
        print(f"{len(lines)} strings")

    return 0


def cmd_chunks(args: argparse.Namespace) -> int:
    chunks = list(parse_riff_chunks(args.file))
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        with args.out.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(
                handle,
                fieldnames=["chunk_id", "offset", "data_offset", "size"],
            )
            writer.writeheader()
            writer.writerows(chunk.to_dict() for chunk in chunks)
        print(f"Wrote {len(chunks)} chunks to {args.out}")
    else:
        for chunk in chunks:
            print(
                f"{chunk.chunk_id}\toffset=0x{chunk.offset:08x}\t"
                f"data=0x{chunk.data_offset:08x}\tsize={chunk.size}"
            )
        print(f"{len(chunks)} chunks")

    if not chunks:
        print("No RIFF chunks found. This may not be a RIFF file.")

    return 0


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)
