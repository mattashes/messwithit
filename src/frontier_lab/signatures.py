from __future__ import annotations

from dataclasses import dataclass
import struct


@dataclass(frozen=True)
class FileType:
    kind: str
    category: str
    confidence: str
    notes: tuple[str, ...] = ()


def detect_file_type(header: bytes, extension: str = "") -> FileType:
    extension = extension.lower()

    if header.startswith(b"MZ"):
        pe_offset = _read_u32(header, 0x3C)
        if pe_offset is not None and header[pe_offset : pe_offset + 4] == b"PE\0\0":
            return FileType(
                kind="Win32 PE executable/library",
                category="executable",
                confidence="high",
                notes=("open in Ghidra only to answer specific questions",),
            )
        return FileType(
            kind="DOS/Win16 executable or installer",
            category="executable",
            confidence="medium",
            notes=("MZ header found",),
        )

    if header.startswith(b"RIFF") and len(header) >= 12:
        form_type = header[8:12]
        riff_types = {
            b"WAVE": ("WAV audio", "audio"),
            b"AVI ": ("AVI video", "video"),
            b"RMID": ("RIFF MIDI", "audio"),
            b"PAL ": ("RIFF palette", "image"),
        }
        kind, category = riff_types.get(form_type, ("RIFF container", "container"))
        return FileType(
            kind=kind,
            category=category,
            confidence="high",
            notes=(f"RIFF form {form_type.decode('latin1', errors='replace')}",),
        )

    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return FileType("PNG image", "image", "high")
    if header.startswith(b"BM"):
        return FileType("BMP image", "image", "high")
    if header.startswith((b"GIF87a", b"GIF89a")):
        return FileType("GIF image", "image", "high")
    if header.startswith(b"\xff\xd8\xff"):
        return FileType("JPEG image", "image", "high")
    if header.startswith(b"MThd"):
        return FileType("MIDI sequence", "audio", "high")
    if header.startswith((b"SMK2", b"SMK4")):
        return FileType("Smacker video", "video", "high")
    if header.startswith(b"BIKi"):
        return FileType("Bink video", "video", "high")
    if header.startswith(b"MSCF"):
        return FileType("Microsoft Cabinet archive", "archive", "high")

    if len(header) >= 12 and header[4:8] in {b"ftyp", b"moov", b"mdat"}:
        return FileType(
            "QuickTime/MPEG-4 movie",
            "video",
            "medium",
            ("QuickTime-era game media candidate",),
        )

    extension_type = _detect_by_extension(extension)
    if extension_type:
        return extension_type

    return FileType("unknown", "unknown", "low")


def _read_u32(data: bytes, offset: int) -> int | None:
    if offset < 0 or offset + 4 > len(data):
        return None
    return struct.unpack_from("<I", data, offset)[0]


def _detect_by_extension(extension: str) -> FileType | None:
    text_extensions = {
        ".cfg",
        ".csv",
        ".ini",
        ".log",
        ".lst",
        ".txt",
        ".xml",
    }
    if extension in text_extensions:
        return FileType("text/config by extension", "text", "medium")

    video_extensions = {
        ".mov",
        ".qt",
        ".qtm",
        ".avi",
    }
    if extension in video_extensions:
        return FileType(
            "video by extension",
            "video",
            "low",
            ("verify header; extension-only guess",),
        )

    audio_extensions = {
        ".mid",
        ".midi",
        ".wav",
    }
    if extension in audio_extensions:
        return FileType(
            "audio by extension",
            "audio",
            "low",
            ("verify header; extension-only guess",),
        )

    image_extensions = {
        ".bmp",
        ".gif",
        ".jpg",
        ".jpeg",
        ".png",
        ".tga",
    }
    if extension in image_extensions:
        return FileType(
            "image by extension",
            "image",
            "low",
            ("verify header; extension-only guess",),
        )

    archive_extensions = {
        ".cab",
        ".dat",
        ".pak",
        ".res",
    }
    if extension in archive_extensions:
        return FileType(
            "possible archive/resource by extension",
            "archive",
            "low",
            ("needs format investigation",),
        )

    return None
