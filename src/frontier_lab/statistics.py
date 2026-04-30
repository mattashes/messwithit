from __future__ import annotations

from collections import Counter
import math


def shannon_entropy(data: bytes) -> float:
    if not data:
        return 0.0

    counts = Counter(data)
    length = len(data)
    return -sum((count / length) * math.log2(count / length) for count in counts.values())


def printable_ratio(data: bytes) -> float:
    if not data:
        return 0.0

    printable = 0
    for byte in data:
        if byte in (9, 10, 13) or 32 <= byte <= 126:
            printable += 1
    return printable / len(data)
