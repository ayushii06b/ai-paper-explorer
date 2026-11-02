from collections import Counter
import re
import unicodedata


def find_repeated_lines(pages, threshold=0.5):
    """Identifies recurring header/footer lines present across more than `threshold` fraction of pages."""
    if not pages:
        return set()

    counts = Counter()

    for page in pages:
        lines = set(
            line.strip()
            for line in page.get("text", "").splitlines()
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
    """Strips identified recurring headers and footers from page text."""
    if not text or not repeated_lines:
        return text or ""

    lines = text.splitlines()
    return "\n".join(
        line
        for line in lines
        if line.strip() not in repeated_lines
    )


def remove_page_numbers(text):
    """Removes standalone page number lines or 'Page X' lines."""
    if not text:
        return ""

    lines = text.splitlines()
    cleaned = []
    for line in lines:
        stripped = line.strip()
        # Matches standalone numbers or 'Page X', 'page X of Y'
        if re.fullmatch(r"(?i)(?:page\s+)?\d+(?:\s+of\s+\d+)?", stripped):
            continue
        cleaned.append(line)

    return "\n".join(cleaned)


def clean_text(text):
    """
    Cleans extracted PDF text while preserving mathematical expressions,
    paragraph boundaries, and technical terminology.

    1. Unicode normalization (replaces ligatures like fi, fl, ffi).
    2. De-hyphenates words broken across line breaks while preserving compounds (e.g., self-attention).
    3. Merges soft line breaks within paragraphs into single spaces.
    4. Removes standalone page numbers and excessive whitespace.
    """
    if not text:
        return ""

    # 1. Unicode normalization (NFKD normalizes \ufb01 -> fi, \ufb02 -> fl, etc.)
    text = unicodedata.normalize("NFKD", text)

    # 2. Preserve compound prefixes split across lines with hyphen (e.g., 'self-\nattention' -> 'self-attention')
    text = re.sub(
        r"(?i)\b(self|cross|multi|feed|state|pre|post|co|non)-\s*(?:\r?\n)+\s*([a-z]+)\b",
        r"\1-\2",
        text
    )

    # De-hyphenate general words broken by column justification (e.g., 'transfor-\nmer' -> 'transformer')
    text = re.sub(
        r"([a-zA-Z]{2,})-\s*(?:\r?\n)+\s*([a-zA-Z]{2,})",
        r"\1\2",
        text
    )

    # 3. Remove standalone page numbers
    text = remove_page_numbers(text)

    # 4. Normalize soft line breaks:
    # Double newlines represent true paragraph breaks and must be preserved.
    # Single newlines within continuous text are merged into spaces,
    # except when the line looks like an equation, list item, or heading.
    paragraphs = re.split(r"\n\s*\n", text)
    cleaned_paras = []

    for para in paragraphs:
        lines = [ln.strip() for ln in para.splitlines() if ln.strip()]
        if not lines:
            continue

        merged_lines = []
        for line in lines:
            # If previous line doesn't end with sentence terminal or is a bullet, join with space
            if not merged_lines:
                merged_lines.append(line)
            else:
                prev = merged_lines[-1]
                # Check if current line starts a list item or equation
                is_list_or_eq = bool(re.match(r"^[-*•(\[\d+.]", line))
                prev_ends_hard = bool(re.search(r"[:.!?]\s*$", prev))

                if is_list_or_eq or prev_ends_hard:
                    merged_lines.append(line)
                else:
                    merged_lines[-1] = f"{prev} {line}"

        cleaned_paras.append("\n".join(merged_lines))

    # Join paragraphs with double newlines
    cleaned_text = "\n\n".join(cleaned_paras)

    # Clean multiple consecutive horizontal spaces
    cleaned_text = re.sub(r"[ \t]+", " ", cleaned_text)

    return cleaned_text.strip()
