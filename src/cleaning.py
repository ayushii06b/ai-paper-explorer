from collections import Counter
import re
import unicodedata


def find_repeated_lines(pages, threshold=0.5):
    if not pages:
        return set()

    counts = Counter()

    for page in pages:
        lines = set(
            line.strip()
            for line in page["text"].splitlines()
            if line.strip()
        )

        for line in lines:
            counts[line] += 1

    n_pages = len(pages)
    return {
        line
        for line, count in counts.items()
        if count / n_pages >= threshold
    }


def remove_repeated_lines(text, repeated_lines):
    lines = text.splitlines()

    return "\n".join(
        line
        for line in lines
        if line.strip() not in repeated_lines
    )


def remove_page_numbers(text):
    lines = text.splitlines()

    return "\n".join(
        line
        for line in lines
        if not re.fullmatch(r"\s*\d+\s*", line)
    )


def clean_text(text):
    """
    Cleans extracted text by:
    1. Normalizing Unicode ligatures (fi, fl, ffi, ffl) into clean standard characters.
    2. Reconstructing hyphenated words split across line breaks (e.g., 'interac-\ntions' -> 'interactions').
    3. Removing standalone page number lines.
    Preserves mathematical expressions and technical terminology.
    """
    if not text:
        return ""

    # 1. Unicode normalization (handles ligatures such as \ufb01 -> fi, \ufb02 -> fl)
    text = unicodedata.normalize('NFKD', text)

    # 2. De-hyphenate words broken across line breaks
    text = re.sub(r'(\b[a-zA-Z]+)-\s*\n\s*([a-zA-Z]+\b)', r'\1\2', text)

    # 3. Remove standalone page numbers
    text = remove_page_numbers(text)

    return text
