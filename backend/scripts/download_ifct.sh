#!/bin/bash
set -e

echo "Downloading IFCT 2017 Compositions..."
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
mkdir -p "$DIR/../data/ifct2017"
curl -k -L -o "$DIR/../data/ifct2017/compositions.csv" "https://unpkg.com/@ifct2017/compositions/index.csv"

echo "IFCT 2017 data downloaded successfully to data/ifct2017/compositions.csv"
