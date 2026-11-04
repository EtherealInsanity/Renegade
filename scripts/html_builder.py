#!/usr/bin/env python3
"""
Renegade Reader - Static HTML Reader Builder
Compiles source chapters from chapters/*.txt into static standalone HTML pages in website/read/
"""

import os
import re
import json

def main():
    chapters_dir = "chapters"
    meta_path = "website/meta/chapters.json"
    template_path = "website/template.html"
    output_dir = "website/read"

    os.makedirs(output_dir, exist_ok=True)

    if not os.path.exists(meta_path) or not os.path.exists(template_path):
        print(f"Error: Missing {meta_path} or {template_path}")
        return

    with open(meta_path, "r", encoding="utf-8") as f:
        chapters = json.load(f)

    with open(template_path, "r", encoding="utf-8") as f:
        template = f.read()

    total_chapters = len(chapters)
    print(f"Compiling {total_chapters} chapters into static reader pages...")

    for idx, ch in enumerate(chapters):
        ch_num = ch["chapter"]
        txt_path = os.path.join(chapters_dir, f"{ch_num}.txt")
        if not os.path.exists(txt_path):
            continue

        with open(txt_path, "r", encoding="utf-8") as f:
            lines = f.read().split("\n")

        title = ch["title"]
        body_lines = []
        skip_lines = 0

        for line_idx, line in enumerate(lines):
            if skip_lines > 0:
                skip_lines -= 1
                continue

            line = line.strip()
            if not line:
                continue

            if line.startswith("<title>"):
                continue

            # Cultivation status / Dao window
            if line == "+":
                window_lines = ['<div class="dao_window">']
                for sub_line in lines[line_idx + 1:]:
                    skip_lines += 1
                    sub_line = sub_line.strip()
                    if sub_line == "+":
                        break
                    if sub_line.startswith("["):
                        window_lines.append(f'<h4 class="dao_window_title">{sub_line}</h4>')
                    else:
                        window_lines.append(f'<p>{sub_line}</p>')
                window_lines.append('</div>')
                body_lines.extend(window_lines)
                continue

            # Tag handlers
            if line.startswith("<!>"):
                clean_l = line.replace("<!>", "").strip()
                body_lines.append(f'<div class="dao_divine"><p>{clean_l}</p></div>')
            elif line.startswith("<@>"):
                clean_l = line.replace("<@>", "").strip()
                body_lines.append(f'<div class="dao_mantra"><p>{clean_l}</p></div>')
            elif line.startswith("<#>"):
                clean_l = line.replace("<#>", "").strip()
                body_lines.append(f'<div class="dao_slaughter"><p>{clean_l}</p></div>')
            elif line.startswith("<&>"):
                clean_l = line.replace("<&>", "").strip()
                body_lines.append(f'<div class="dao_quote"><p>{clean_l}</p></div>')
            elif line.startswith("<?>"):
                clean_l = line.replace("<?>", "").strip()
                body_lines.append(f'<div class="dao_note"><p>{clean_l}</p></div>')
            elif line == "***" or line == "---":
                body_lines.append('<hr class="dao_divider">')
            else:
                body_lines.append(f'<p>{line}</p>')

        content_html = "\n".join(body_lines)

        # Navigation target links
        if idx == 0:
            prev_href = "#"
            prev_label = "First Chapter"
            prev_disabled = "disabled"
        else:
            prev_num = chapters[idx - 1]["chapter"]
            prev_href = f"/read/ch_{prev_num}"
            prev_label = f"Ch. {prev_num}"
            prev_disabled = ""

        if idx == total_chapters - 1:
            next_href = "#"
            next_label = "Final Chapter"
            next_disabled = "disabled"
        else:
            next_num = chapters[idx + 1]["chapter"]
            next_href = f"/read/ch_{next_num}"
            next_label = f"Ch. {next_num}"
            next_disabled = ""

        page_html = template
        page_html = page_html.replace("{{TITLE}}", title)
        page_html = page_html.replace("{{CHAPTER_NUM}}", str(ch_num))
        page_html = page_html.replace("{{BOOK_TITLE}}", f"Book {ch['book']}: {ch['book_title']}")
        page_html = page_html.replace("{{WORD_COUNT}}", f"{ch['word_count']:,}")
        page_html = page_html.replace("{{READ_TIME}}", str(ch['read_time']))
        page_html = page_html.replace("{{CONTENT}}", content_html)
        page_html = page_html.replace("{{PREV_HREF}}", prev_href)
        page_html = page_html.replace("{{PREV_LABEL}}", prev_label)
        page_html = page_html.replace("{{PREV_DISABLED}}", prev_disabled)
        page_html = page_html.replace("{{NEXT_HREF}}", next_href)
        page_html = page_html.replace("{{NEXT_LABEL}}", next_label)
        page_html = page_html.replace("{{NEXT_DISABLED}}", next_disabled)

        out_file = os.path.join(output_dir, f"ch_{ch_num}.html")
        with open(out_file, "w", encoding="utf-8") as out_f:
            out_f.write(page_html)

    print(f"Compilation complete! All {total_chapters} chapters generated in {output_dir}/")


if __name__ == "__main__":
    main()
