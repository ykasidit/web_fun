# clearevo fun tools

Eight small in-browser tools, one directory each under `public/`, deployed on [www.clearevo.com](https://www.clearevo.com/tools/) - live link on each tool below:

- **[/dicom](public/dicom)** - DICOM viewer for CT/MRI scan CDs (zip / folder / streamed over HTTP Range): reads the CD's DICOMDIR index then pulls only the slices you view, so a gigabyte CD opens on a phone reading a few MB. Series browser, window/level, pan/zoom/measure/tags, JPEG-lossless + baseline decode, EN/ไทย, photo-app touch. 100% client-side ([dicom-parser](https://github.com/cornerstonejs/dicomParser) + [jpeg-lossless-decoder-js](https://github.com/rii-mango/JPEGLosslessDecoderJS)) - [live](https://www.clearevo.com/dicom/)
- **[/doctor](public/doctor)** - 'almost' Emacs `M-x doctor` (ELIZA psychotherapist, RET-twice submit) - [live](https://www.clearevo.com/doctor/)
- **[/calc](public/calc)** - 'almost' Emacs `M-x calc` (RPN stack, *Calc Trail* pane, RET dup / TAB swap / n / & / Q / U undo) - [live](https://www.clearevo.com/calc/)
- **[/isearch](public/isearch)** - 'almost' Emacs isearch over pasted/opened text (C-s / C-r, smart case, authentic Failing/Wrapped messages) - [live](https://www.clearevo.com/isearch/)
- **[/hex](public/hex)** - ClearEvo hex viewer/editor: edit bytes, search hex/text/numbers (u8..i64, LE/BE)/**bit sequences at any bit offset** (bless-style), save edited file - [live](https://www.clearevo.com/hex/)
- **[/geo](public/geo)** - GIS vector format converter: GDAL `ogr2ogr` via [gdal3.js](https://github.com/bugra9/gdal3.js) (WebAssembly), optional EPSG reprojection - [live](https://www.clearevo.com/geo/)
- **[/qr](public/qr)** - static QR code generator (the QR carries the real link/text as entered - never expires, no redirect), UI in 12 languages, PNG/SVG export - [live](https://www.clearevo.com/qr/)
- **[/audio](public/audio)** - audio extractor/converter via [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm): MP4→MP3, MP3/WAV/FLAC/OGG/Opus/M4A - [live](https://www.clearevo.com/audio/)

All 100% client-side. `./test.sh` runs the engine tests; `./push.sh` deploys the whole site.

## Demo scans (DICOM viewer)

The DICOM viewer's demo cases are the **author's own CT and MRI scans**, anonymized
(patient tags replaced), which show a left superior semicircular canal dehiscence
(SCDS). Kasidit Yusuf releases these anonymized scans under **GPL v2** - free to use for
testing, development, teaching and demos. Each demo streams live from the site or can be
downloaded as a full CD zip (with `LICENSE.txt` inside). Not a medical record for anyone
else; not for diagnosis.

## License

GPL v2, like the [Bluetooth GNSS](https://github.com/ykasidit/bluetooth_gnss) app - see [LICENSE](LICENSE).
