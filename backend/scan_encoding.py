# backend/scan_encoding.py
import os
import re
from pathlib import Path

# Define the root of your application code
CODE_ROOT = Path(__file__).parent / "konnaxion"
BOM_CHAR = '\ufeff'
NBSP_CHAR = '\u00a0'
ERROR_COUNT = 0

print(f"--- Scanning Python files in: {CODE_ROOT} ---")

for root, _, files in os.walk(CODE_ROOT):
    for file_name in files:
        if not file_name.endswith(".py"):
            continue

        file_path = Path(root) / file_name
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except UnicodeDecodeError:
            print(f"[ERROR] Could not decode file: {file_path}. Check for binary content.")
            ERROR_COUNT += 1
            continue

        # 1. Check for BOM character (U+FEFF)
        if BOM_CHAR in content:
            print(f"[BOM ERROR] Found BOM character in: {file_path}")
            ERROR_COUNT += 1

        # 2. Check for Non-Breaking Space (U+00A0)
        if NBSP_CHAR in content:
            print(f"[NBSP ERROR] Found non-breaking space in: {file_path}")
            
            # Find the exact lines for easier fixing
            for line_num, line in enumerate(content.splitlines(), 1):
                if NBSP_CHAR in line:
                    # Show context for easy finding
                    clean_line = re.sub(NBSP_CHAR, ' [NBSP] ', line.strip())
                    print(f"  Line {line_num}: {clean_line}")
            ERROR_COUNT += 1
            
if ERROR_COUNT == 0:
    print("\n✅ Scan Complete. No critical invisible characters found.")
else:
    print(f"\n❌ Scan Complete. Found {ERROR_COUNT} issues. Fix the listed files before restarting.")