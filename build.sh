#!/bin/sh
# Content-hash build for the fun tools: public/{doctor,calc,isearch,hex} -> dist/.
# Each tool = index.html (inline UI) + logic.js (pure, tested). Only logic.js needs
# hashing; index.html is served no-cache.
set -e
cd "$(dirname "$0")"
rm -rf dist
for tool in doctor calc isearch hex; do
  node --check "public/$tool/logic.js"
  mkdir -p "dist/$tool"
  hash=$(sha256sum "public/$tool/logic.js" | cut -c1-8)
  cp "public/$tool/logic.js" "dist/$tool/logic.$hash.js"
  sed "s|'./logic.js'|'./logic.$hash.js'|" "public/$tool/index.html" > "dist/$tool/index.html"
  grep -q "logic\.$hash\.js" "dist/$tool/index.html"
done
echo "build ok -> dist/ (4 tools)"
