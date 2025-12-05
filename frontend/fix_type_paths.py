#!/usr/bin/env python3
import os
import re
from pathlib import Path

def fix_type_file(file_path):
    """타입 파일의 import 경로를 수정합니다."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # import 문에서 경로 추출
    import_match = re.search(r"import \* as entry from '([^']+)'", content)
    type_match = re.search(r"typeof import\('([^']+)'\)", content)
    
    if not import_match or not type_match:
        return False
    
    current_import_path = import_match.group(1)
    current_type_path = type_match.group(1)
    
    # 타겟 파일 경로 추출 (src/app/...)
    target_match = re.search(r"src/app/[^']+", current_import_path)
    if not target_match:
        return False
    
    target_file = target_match.group(0)
    file_dir = os.path.dirname(file_path)
    
    # 올바른 상대 경로 계산
    try:
        correct_path = os.path.relpath(target_file, file_dir)
        # Windows 경로 구분자를 Unix 스타일로 변경
        correct_path = correct_path.replace('\\', '/')
    except ValueError:
        return False
    
    # 경로가 다르면 수정
    if current_import_path != correct_path:
        # import 문 수정
        content = re.sub(
            r"import \* as entry from '[^']+'",
            f"import * as entry from '{correct_path}'",
            content
        )
        # typeof import 문 수정
        content = re.sub(
            r"typeof import\('[^']+'\)",
            f"typeof import('{correct_path}')",
            content
        )
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    
    return False

def main():
    frontend_dir = Path(__file__).parent
    types_dir = frontend_dir / 'ios' / 'App' / 'App' / 'public' / 'types' / 'app'
    
    if not types_dir.exists():
        print(f"타입 디렉토리를 찾을 수 없습니다: {types_dir}")
        return
    
    fixed_count = 0
    for ts_file in types_dir.rglob('*.ts'):
        if fix_type_file(ts_file):
            print(f"수정됨: {ts_file.relative_to(frontend_dir)}")
            fixed_count += 1
    
    print(f"\n총 {fixed_count}개 파일이 수정되었습니다.")

if __name__ == '__main__':
    main()
