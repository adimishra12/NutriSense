#!/usr/bin/env python3
"""Import IFCT 2017 + curated Indian foods."""

import argparse
import sys
import os

# Add backend dir to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.curated_import import import_curated_foods
from app.services.ifct_import import import_ifct_foods

def main() -> None:
    parser = argparse.ArgumentParser(description="Import Indian food catalogs")
    parser.add_argument(
        "--replace-ifct",
        action="store_true",
        help="Replace existing IFCT rows"
    )
    args = parser.parse_args()

    import_ifct_foods(replace=args.replace_ifct)
    import_curated_foods()

if __name__ == "__main__":
    main()
