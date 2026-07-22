#!/bin/sh
# Content-hash build for the fun tools: public/<tool>/ -> dist/<tool>/.
# logic.js is hashed (it changes); vendor wasm/js, icons and manifest copy as-is.
set -e
cd "$(dirname "$0")"
rm -rf dist
n=0
for dir in public/*/; do
  tool=$(basename "$dir")
  node --check "public/$tool/logic.js"
  mkdir -p "dist/$tool"
  cp -r "public/$tool/." "dist/$tool/"
  hash=$(sha256sum "public/$tool/logic.js" | cut -c1-8)
  mv "dist/$tool/logic.js" "dist/$tool/logic.$hash.js"
  sed -i "s|'./logic.js'|'./logic.$hash.js'|" "dist/$tool/index.html"
  grep -q "logic\.$hash\.js" "dist/$tool/index.html"
  n=$((n + 1))
done
echo "build ok -> dist/ ($n tools)"
