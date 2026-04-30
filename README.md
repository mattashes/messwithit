# Frontier Lab

Frontier Lab is a beginner-friendly toolkit for exploring old game installs without
redistributing the game itself. It starts with safe, concrete work: inventory the
files, identify media and archives, extract readable strings, and build notes that
can later guide mod tools or a clean-room reimplementation.

This repo intentionally does not contain original game assets, executable patches,
cracks, keys, or downloaded ISOs.

## The Practical Roadmap

1. Get the game running from a copy you are allowed to use.
   Use a retro PC emulator or VM, install the game, install the version of
   QuickTime that ships with the disc, and take screenshots/notes about what works.

2. Copy the installed game folder to your modern machine.
   Keep an untouched backup. Do all analysis on a copy.

3. Run the scanner in this repo.
   The output tells you what file types exist, which files look like videos,
   sound, executables, plain text, high-entropy archives, or unknown formats.

4. Pick one tiny target.
   Good first targets are text strings, config files, WAV/AVI/MOV files, or any
   archive with an obvious four-byte magic header. Do not begin with the whole EXE.

5. Build a viewer or extractor for that target.
   If a file format is understood, write Python code to read it and export normal
   files. If it is not understood, write notes and tests until the structure makes
   sense.

6. Only then open the executable in a reverse-engineering tool.
   Use the EXE to answer specific questions like "which files are loaded?" or
   "what does this table mean?" The goal is understanding behavior, not magically
   recovering the original source code.

7. Ship tools and patches, not copyrighted assets.
   A good fan-mod workflow is: users provide their own game install, your tool
   reads it, then writes new files or reversible patches.

## Install

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e .
```

## Scan A Game Folder

```bash
frontier-lab scan "/path/to/installed/game" --out reports
```

This creates:

- `reports/inventory.json`
- `reports/inventory.csv`

## Pull Readable Strings From One File

```bash
frontier-lab strings "/path/to/game/PROGRAM.EXE" --min-len 6 --limit 200
```

This is useful for finding filenames, debug messages, menu text, registry keys,
and library names.

## Inspect RIFF Chunks

```bash
frontier-lab chunks "/path/to/game/video.avi"
```

RIFF covers common old Windows formats like WAV, AVI, and RMID. Seeing chunks is a
gentle first lesson in binary formats.

## Beginner Coding Missions

- Add a new file signature in `src/frontier_lab/signatures.py`.
- Add UTF-16 string extraction in `src/frontier_lab/strings.py`.
- Add a command that groups files by type and prints a summary table.
- Pick one unknown archive format and write a tiny extractor for it.
- Build a patcher that changes a copied data file and writes a backup.

## Web Game Prototype

There is also a playable ecosystem prototype in `web/`.

Open `web/index.html` in a browser. It is a static canvas game, so it does not
need a server or package install.

The prototype has a top-down world, minimap, bio-score, fauna count, bottom
control console, terrain brushes, and a wide plant palette. Plants consume local
resources, support nearby species, compete when crowded, spread when healthy, and
attract creatures when the habitat gets richer.

## Project Boundary

This is for preservation, learning, interoperability, and personal modding. Keep
the project clean: no game downloads, no original assets in git, no copy
protection bypass instructions, and no patched copyrighted executables.
