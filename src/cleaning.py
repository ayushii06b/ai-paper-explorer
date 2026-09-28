from collections import Counter
import re

def find_repeated_lines(pages, threshold = 0.5):

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
    text = remove_page_numbers(text)

    return text