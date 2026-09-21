# Repository identity

- This repository, `/Users/paul/Pauls kurssidor/vr-godot/`, is the canonical website for the Godot XR game.
- The corresponding game project is `/Users/paul/xr-game`.
- When the user refers to "webbplatsen" or "sajten" for the XR game, this is the repository to inspect and update.
- Author chapter content in `content/*.md`. Generated root-level HTML and `js/search-index.js` are build outputs from `tools/build.py` and must stay in sync.
- After website changes, run `python3 tools/build.py`, `python3 tools/check.py`, and `node --check js/app.js`.
- Only transfer game features that exist and have been verified in the game project or its `docs/` material.
