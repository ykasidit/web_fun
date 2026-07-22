# clearevo fun tools

Seven small in-browser tools, one directory each under `public/`, deployed on [www.clearevo.com](https://www.clearevo.com/tools/) - live link on each tool below:

- **[/doctor](public/doctor)** - 'almost' Emacs `M-x doctor` (ELIZA psychotherapist, RET-twice submit) - [live](https://www.clearevo.com/doctor/)
- **[/calc](public/calc)** - 'almost' Emacs `M-x calc` (RPN stack, *Calc Trail* pane, RET dup / TAB swap / n / & / Q / U undo) - [live](https://www.clearevo.com/calc/)
- **[/isearch](public/isearch)** - 'almost' Emacs isearch over pasted/opened text (C-s / C-r, smart case, authentic Failing/Wrapped messages) - [live](https://www.clearevo.com/isearch/)
- **[/hex](public/hex)** - ClearEvo hex viewer/editor: edit bytes, search hex/text/numbers (u8..i64, LE/BE)/**bit sequences at any bit offset** (bless-style), save edited file - [live](https://www.clearevo.com/hex/)
- **[/geo](public/geo)** - GIS vector format converter: GDAL `ogr2ogr` via [gdal3.js](https://github.com/bugra9/gdal3.js) (WebAssembly), optional EPSG reprojection - [live](https://www.clearevo.com/geo/)
- **[/qr](public/qr)** - static QR code generator (the QR carries the real link/text as entered - never expires, no redirect), UI in 12 languages, PNG/SVG export - [live](https://www.clearevo.com/qr/)
- **[/audio](public/audio)** - audio extractor/converter via [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm): MP4→MP3, MP3/WAV/FLAC/OGG/Opus/M4A - [live](https://www.clearevo.com/audio/)

All 100% client-side. `./test.sh` runs the engine tests; `./push.sh` deploys the whole site.

## License

GPL v2, like the [Bluetooth GNSS](https://github.com/ykasidit/bluetooth_gnss) app - see [LICENSE](LICENSE).
