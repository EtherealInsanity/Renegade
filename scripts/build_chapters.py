#!/usr/bin/env python3
"""
Renegade Reader - Chapter Extraction and Normalization Pipeline
Processes raw EPUB xhtml files into sanitized, tagged chapter text and generates novel metadata.
"""

import os
import re
import glob
import json

CANONICAL_BOOKS = [
    {"book": 1, "title": "The Mediocre Youth", "start": 1, "end": 64},
    {"book": 2, "title": "The Bloody Image of Cultivation", "start": 65, "end": 140},
    {"book": 3, "title": "Famous in the Sea of Devils", "start": 141, "end": 200},
    {"book": 4, "title": "Clean Sweep", "start": 201, "end": 395},
    {"book": 5, "title": "Cultivation Planet Crystal", "start": 396, "end": 473},
    {"book": 6, "title": "Arriving on Tian Yun", "start": 474, "end": 658},
    {"book": 7, "title": "Fame Shakes Allheaven Star System", "start": 659, "end": 920},
    {"book": 8, "title": "Alliance's Secret", "start": 921, "end": 1140},
    {"book": 9, "title": "Peak of the Cloud Sea", "start": 1141, "end": 1478},
    {"book": 10, "title": "Rampage Through the Inner Realm", "start": 1479, "end": 1613},
    {"book": 11, "title": "Mysteries of the Ancient Era", "start": 1614, "end": 1793},
    {"book": 12, "title": "Tenth Sun of the Immortal Astral Continent", "start": 1794, "end": 2002},
    {"book": 13, "title": "Light of the Coming End", "start": 2003, "end": 2088}
]

MISSING_TITLES = {
    359: "Chapter 359 – War Chariot's Wrath",
    538: "Chapter 538 – You Are Not Qualified!",
    939: "Chapter 939 – Ji Xiantian",
    1056: "Chapter 1056 – Prelude to Tuo Sen's Chaos",
    1057: "Chapter 1057 – Broken Sword",
    1058: "Chapter 1058 – Outsider",
    1059: "Chapter 1059 – Can You See Through It?",
    1060: "Chapter 1060 – Fleeing the Crisis",
    1061: "Chapter 1061 – Awakening",
    1066: "Chapter 1066 – Escape",
    1067: "Chapter 1067 – Clashing",
    1068: "Chapter 1068 – Fusion",
    1069: "Chapter 1069 – Conjecture",
    1070: "Chapter 1070 – Loosening the Seal",
    1082: "Chapter 1082 – Vermilion Bird Divine Emperor",
    1101: "Chapter 1101 – Trembling",
    1102: "Chapter 1102 – You Are Seeking Death!",
    1113: "Chapter 1113 – Self-Destruction",
    1114: "Chapter 1114 – Sent Back",
    1115: "Chapter 1115 – Consecutive Slashes",
    1116: "Chapter 1116 – Leaving the Vortex",
    1117: "Chapter 1117 – One Loss, Two Tribulations",
    1131: "Chapter 1131 – One Against Three"
}

TYPO_REPLACEMENTS = [
    (r"\bWang lin\b", "Wang Lin"),
    (r"\bTeng Hua Yuan\b", "Teng Huayuan"),
    (r"\bLi Mu Wan\b", "Li Muwan"),
    (r"\bQing shui\b", "Qing Shui"),
    (r"\bTa Sen\b", "Tuo Sen"),
    (r"([A-Za-z]+)[’']S\b", r"\1's"),  # Fix uppercase possessive 'S typos (e.g. Lin’S -> Lin's)
]


def clean_text(text):
    for pattern, repl in TYPO_REPLACEMENTS:
        text = re.sub(pattern, repl, text)
    return text


def get_book_info(ch_num):
    for b in CANONICAL_BOOKS:
        if b["start"] <= ch_num <= b["end"]:
            return b
    return {"book": 13, "title": "Light of the Coming End", "start": 2003, "end": 2088}


def main():
    epub_dir = "epub_extracted/EPUB"
    chapters_out = "chapters"
    meta_out = "website/meta"

    os.makedirs(chapters_out, exist_ok=True)
    os.makedirs(meta_out, exist_ok=True)

    chapter_files = sorted(glob.glob(os.path.join(epub_dir, "chapter_*.xhtml")))
    print(f"Discovered {len(chapter_files)} chapter xhtml files in {epub_dir}")

    if not chapter_files:
        print(f"No EPUB source files in {epub_dir}; keeping existing metadata in {meta_out}")
        return

    total_words_novel = 0
    chapters_meta = []

    for fpath in chapter_files:
        fname = os.path.basename(fpath)
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()

        h1_match = re.search(r"<h1>(.*?)</h1>", content)
        raw_title = h1_match.group(1).strip() if h1_match else ""

        # Determine numerical chapter index
        ch_num_match = re.search(r"Chapter\s+(\d+)", raw_title, re.IGNORECASE)
        if not ch_num_match:
            # Fallback to filename
            num_from_fn = re.search(r"chapter_(\d+)", fname)
            ch_num = int(num_from_fn.group(1)) if num_from_fn else len(chapters_meta) + 1
        else:
            ch_num = int(ch_num_match.group(1))

        # Check for missing/blank title
        if ch_num in MISSING_TITLES:
            title = MISSING_TITLES[ch_num]
        elif re.match(r"^Chapter\s+\d+\s*[-–—:]*\s*$", raw_title, re.IGNORECASE) or not raw_title:
            title = f"Chapter {ch_num}"
        else:
            title = raw_title

        # Clean title typos
        title = clean_text(title)
        # Normalize dashes in title
        title = re.sub(r"\s*[-–—]\s*", " – ", title, count=1)

        # Extract paragraphs
        paragraphs = re.findall(r"<p>(.*?)</p>", content, re.DOTALL)
        clean_paragraphs = []
        for p in paragraphs:
            # Strip internal html tags
            p_clean = re.sub(r"<.*?>", "", p).strip()
            if not p_clean:
                continue
            # Skip if paragraph is identical duplicate of the chapter title
            norm_p = re.sub(r"\s+", " ", p_clean).lower()
            norm_t = re.sub(r"\s+", " ", title).lower()
            if norm_p == norm_t or norm_p == f"chapter {ch_num}":
                continue
            p_clean = clean_text(p_clean)
            clean_paragraphs.append(p_clean)

        # Calculate word count
        all_words = re.findall(r"[\w'-]+", " ".join(clean_paragraphs))
        word_count = len(all_words)
        total_words_novel += word_count
        read_time = max(1, (word_count + 249) // 250)

        book_info = get_book_info(ch_num)

        # Write chapter source file
        txt_path = os.path.join(chapters_out, f"{ch_num}.txt")
        with open(txt_path, "w", encoding="utf-8") as out_f:
            out_f.write(f"<title>{title}\n")
            for p in clean_paragraphs:
                out_f.write(f"{p}\n")

        chapters_meta.append({
            "chapter": ch_num,
            "title": title,
            "book": book_info["book"],
            "book_title": book_info["title"],
            "word_count": word_count,
            "read_time": read_time,
            "file": f"{ch_num}.txt"
        })

    # Sort chapters metadata
    chapters_meta.sort(key=lambda x: x["chapter"])

    # Write metadata JSON files
    with open(os.path.join(meta_out, "chapters.json"), "w", encoding="utf-8") as f:
        json.dump(chapters_meta, f, ensure_ascii=False, indent=2)

    # Populate each canonical book with chs and word counts
    books_data = []
    for b in CANONICAL_BOOKS:
        b_chs = [c for c in chapters_meta if c["book"] == b["book"]]
        b_words = sum(c["word_count"] for c in b_chs)
        books_data.append({
            "book": b["book"],
            "title": b["title"],
            "start": b["start"],
            "end": b["end"],
            "chs": len(b_chs),
            "words": b_words,
            "total_chapters": len(b_chs),
            "total_words": b_words,
            "chapters": [{"chapter": c["chapter"], "title": c["title"], "word_count": c["word_count"]} for c in b_chs]
        })

    with open(os.path.join(meta_out, "books.json"), "w", encoding="utf-8") as f:
        json.dump(books_data, f, ensure_ascii=False, indent=2)

    stats = {
        "title": "Renegade Immortal",
        "author": "Er Gen (耳根)",
        "total_chapters": len(chapters_meta),
        "total_words": total_words_novel,
        "total_books": len(CANONICAL_BOOKS),
        "source": "Official Web Novel Translation",
        "default_theme": "slaughter",
        "books": [{"book": b["book"], "title": b["title"], "chs": b["chs"], "words": b["words"]} for b in books_data]
    }
    with open(os.path.join(meta_out, "stats.json"), "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

    print(f"Successfully processed {len(chapters_meta)} chapters!")
    print(f"Total novel word count: {total_words_novel:,} words across {len(CANONICAL_BOOKS)} books.")
    print("Metadata written to website/meta/chapters.json, books.json, and stats.json.")


if __name__ == "__main__":
    main()
