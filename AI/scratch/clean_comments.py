import os
import re

def remove_comments_and_docstrings(source):

    source = re.sub(r'(|\'\'\'.*?\'\'\')', '', source, flags=re.DOTALL)

    lines = source.splitlines()
    clean_lines = []
    for line in lines:
        line_no_comment = re.sub(r'(?<![\'"])(
        if line_no_comment or not line.strip():
            clean_lines.append(line_no_comment)

    return "\n".join(clean_lines)

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".py"):
                path = os.path.join(root, file)
                print(f"Cleaning: {path}")
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()

                clean_content = remove_comments_and_docstrings(content)

                with open(path, 'w', encoding='utf-8') as f:
                    f.write(clean_content)

if __name__ == "__main__":
    target_dir = r"f:\GitHub\DO_AN_CHUYEN_NGANH\AI"
    process_directory(target_dir)