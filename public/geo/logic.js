// geo converter logic. Pure, tested.

// single-file vector outputs only (multi-file outputs like Shapefile/MapInfo
// would need zipping; shapefile works as INPUT via multi-select)
export const OUT_FORMATS = [
  { drv: 'GeoJSON', ext: 'geojson', label: 'GeoJSON' },
  { drv: 'GPX', ext: 'gpx', label: 'GPX' },
  { drv: 'KML', ext: 'kml', label: 'KML' },
  { drv: 'GPKG', ext: 'gpkg', label: 'GeoPackage' },
  { drv: 'CSV', ext: 'csv', label: 'CSV' },
  { drv: 'SQLite', ext: 'sqlite', label: 'SQLite/Spatialite' },
  { drv: 'DXF', ext: 'dxf', label: 'DXF (CAD)' },
  { drv: 'FlatGeobuf', ext: 'fgb', label: 'FlatGeobuf' },
];

// browser wasm memory is the ceiling, not gdal
export const WARN_BYTES = 100 * 1024 * 1024;
export const MAX_BYTES = 300 * 1024 * 1024;

// null = ok, string = refuse reason, {warn} = proceed with warning
export function sizeCheck(totalBytes) {
  if (totalBytes > MAX_BYTES) {
    return `total input ${(totalBytes / 1048576).toFixed(0)} MB exceeds the ${MAX_BYTES / 1048576} MB in-browser limit (WebAssembly memory) - split the data or use desktop ogr2ogr`;
  }
  if (totalBytes > WARN_BYTES) return { warn: `large input (${(totalBytes / 1048576).toFixed(0)} MB) - conversion may be slow, keep the tab in front` };
  return null;
}

export function buildArgs(drv, tSrs) {
  const args = ['-f', drv];
  if (tSrs && tSrs.trim()) args.push('-t_srs', tSrs.trim());
  return args;
}

export function outName(inputName, ext) {
  return inputName.replace(/\.[^.]+$/, '') + '.' + ext;
}

// quick sanity hint for shapefile inputs
export function shpHint(names) {
  const lower = names.map((n) => n.toLowerCase());
  const hasShp = lower.some((n) => n.endsWith('.shp'));
  if (hasShp && !lower.some((n) => n.endsWith('.dbf'))) {
    return 'a .shp needs its sibling .dbf (and .shx/.prj) - select them together';
  }
  return null;
}
