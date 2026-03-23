"""
pdf_generator.py — Converts a Yatra AI markdown itinerary to a beautiful PDF.
Uses reportlab Platypus for rich layout.
"""

import re
import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── Colour palette (mirrors the UI) ──────────────────────────────────────────
AMBER       = colors.HexColor("#E8920A")
DARK_BG     = colors.HexColor("#1A1C2E")
CARD_BG     = colors.HexColor("#20223A")
TEXT_MAIN   = colors.HexColor("#E8E5DC")
TEXT_DIM    = colors.HexColor("#9A9690")
BORDER      = colors.HexColor("#2E3050")
GREEN       = colors.HexColor("#3CC88C")
BLUE        = colors.HexColor("#6496FF")
WHITE       = colors.white
BLACK       = colors.black

PAGE_W, PAGE_H = A4
MARGIN_H = 18 * mm
MARGIN_V = 20 * mm


# ── Style helpers ─────────────────────────────────────────────────────────────

def _styles():
    def ps(name, **kw):
        return ParagraphStyle(name, **kw)

    return {
        "title": ps("yt_title",
            fontSize=24, leading=30, textColor=AMBER,
            fontName="Helvetica-Bold", alignment=TA_LEFT,
            spaceAfter=4),

        "subtitle": ps("yt_subtitle",
            fontSize=11, leading=16, textColor=TEXT_DIM,
            fontName="Helvetica", alignment=TA_LEFT,
            spaceAfter=14),

        "h2": ps("yt_h2",
            fontSize=14, leading=18, textColor=AMBER,
            fontName="Helvetica-Bold", alignment=TA_LEFT,
            spaceBefore=12, spaceAfter=5),

        "h3": ps("yt_h3",
            fontSize=8, leading=11, textColor=TEXT_DIM,
            fontName="Helvetica-Bold", alignment=TA_LEFT,
            spaceBefore=10, spaceAfter=4),

        "body": ps("yt_body",
            fontSize=10, leading=15, textColor=TEXT_MAIN,
            fontName="Helvetica", alignment=TA_LEFT,
            spaceAfter=3),

        "li": ps("yt_li",
            fontSize=10, leading=15, textColor=TEXT_MAIN,
            fontName="Helvetica", alignment=TA_LEFT,
            leftIndent=12, spaceAfter=3),

        "bold_li": ps("yt_bold_li",
            fontSize=10, leading=15, textColor=AMBER,
            fontName="Helvetica-Bold", alignment=TA_LEFT,
            leftIndent=12, spaceAfter=2),

        "day_header": ps("yt_day_hdr",
            fontSize=11, leading=15, textColor=GREEN,
            fontName="Helvetica-Bold", alignment=TA_LEFT,
            spaceBefore=8, spaceAfter=4),

        "note": ps("yt_note",
            fontSize=9, leading=13, textColor=TEXT_DIM,
            fontName="Helvetica", alignment=TA_LEFT,
            leftIndent=8, spaceAfter=4),

        "blockquote": ps("yt_bq",
            fontSize=10, leading=15, textColor=TEXT_DIM,
            fontName="Helvetica", alignment=TA_LEFT,
            leftIndent=10, rightIndent=10,
            spaceAfter=6, backColor=CARD_BG,
            borderPad=5),

        "footer": ps("yt_footer",
            fontSize=8, leading=11, textColor=TEXT_DIM,
            fontName="Helvetica", alignment=TA_CENTER),
    }


# ── Pre-process: fix currency and strip LLM lazy placeholders ────────────────

def _preprocess(text: str) -> str:
    """
    1. Replace Unicode rupee sign (U+20B9) and its HTML entity with 'Rs.'
       because ReportLab's built-in Helvetica/Times fonts do not include
       that glyph and render it as a filled square (black box).
    2. Convert any remaining $ amounts to Rs. (x84).
    3. Strip known LLM lazy-placeholder strings that pollute the output.
    4. Remove budget table rows that still contain XX,XXX placeholders.
    """

    # 1. Unicode rupee → Rs.
    text = text.replace("\u20b9", "Rs.")    # ₹ character
    text = text.replace("&#8377;", "Rs.")   # HTML entity
    text = text.replace("&amp;#8377;", "Rs.")

    # 2. $N or $N,NNN.NN → Rs.X  (multiply by 84)
    def dollar_to_rs(m):
        raw = m.group(1).replace(",", "")
        try:
            val = float(raw)
            rs  = int(round(val * 84))
            return f"Rs.{rs:,}"
        except ValueError:
            return m.group(0)

    text = re.sub(r"\$([0-9,]+(?:\.[0-9]{1,2})?)", dollar_to_rs, text)

    # 3. Strip known LLM placeholder/lazy lines
    lazy_patterns = [
        r"\[Continue with different activities[^\]]*\]",
        r"\[Repeat for every day[^\]]*\]",
        r"\[Add more days[^\]]*\]",
        r"\[Continue similarly[^\]]*\]",
        r"Explore More Places:.*",
        # Bare placeholder map link with no real URL filled in
        r"\[Google Maps - [^\]]+\]\(https://www\.google\.com/maps/search/[A-Za-z+%20]+\)",
    ]
    for pat in lazy_patterns:
        text = re.sub(pat, "", text, flags=re.IGNORECASE)

    # 4. Drop budget table rows where the cost cell is still XX,XXX
    #    (keep rows that have a real number of 3+ digits or contain TOTAL/Remaining)
    cleaned = []
    for line in text.split("\n"):
        if re.search(r"Rs\.\s*XX|Rs\.XX|\bXX,XXX\b|\| *XX", line, re.IGNORECASE):
            if not re.search(r"\d{3,}", line) and \
               not re.search(r"total|remaining", line, re.IGNORECASE):
                continue  # skip this placeholder row
        cleaned.append(line)
    text = "\n".join(cleaned)

    return text


# ── Inline markdown → ReportLab XML ──────────────────────────────────────────

def _inline(text: str) -> str:
    """
    Escape XML special chars, then convert **bold** and *italic*.
    Markdown links [label](url) are reduced to just the label because
    ReportLab Paragraph cannot render clickable hyperlinks inline.
    Call AFTER _preprocess so Rs. is already in place.
    """
    # XML escape (must come first)
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    # **bold**
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)

    # *italic* (not touching ** already converted)
    text = re.sub(r"(?<!\*)\*([^*\n]+?)\*(?!\*)", r"<i>\1</i>", text)

    # Markdown links [label](url) → label only
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)

    return text


# ── Parse markdown table ──────────────────────────────────────────────────────

def _parse_table(header_line: str, rows_text: str):
    headers = [c.strip() for c in header_line.split("|") if c.strip()]
    rows = []
    for row in rows_text.strip().split("\n"):
        if not row.strip() or re.match(r"^\s*\|?[-| :]+\|?\s*$", row):
            continue
        cells = [c.strip() for c in row.split("|") if c.strip()]
        if cells:
            rows.append(cells)
    return headers, rows


# ── Column width heuristics ───────────────────────────────────────────────────

def _col_widths(headers, content_width):
    """Proportional widths: wider for descriptive columns, narrower for short ones."""
    n = len(headers)
    if n == 0:
        return []
    weights = []
    for h in headers:
        hl = h.lower()
        if any(k in hl for k in ("description", "details", "activity", "specialty",
                                  "amenities", "why visit", "info")):
            weights.append(3.0)
        elif any(k in hl for k in ("book", "link", "find", "how to")):
            weights.append(1.8)
        elif any(k in hl for k in ("time", "fee", "cost", "price", "rating",
                                    "duration", "cost (rs")):
            weights.append(1.3)
        else:
            weights.append(1.6)
    total = sum(weights)
    return [content_width * w / total for w in weights]


# ── PDF builder ───────────────────────────────────────────────────────────────

def generate_pdf(itinerary_markdown: str) -> bytes:
    """
    Parse the itinerary markdown and produce a styled PDF.
    Returns raw PDF bytes.
    """
    # Pre-process: fix currency symbols, strip placeholders
    itinerary_markdown = _preprocess(itinerary_markdown)

    buf = io.BytesIO()
    S = _styles()

    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=MARGIN_H,
        rightMargin=MARGIN_H,
        topMargin=MARGIN_V,
        bottomMargin=MARGIN_V,
        title="Yatra AI Itinerary",
        author="Yatra AI",
    )

    content_width = PAGE_W - 2 * MARGIN_H
    story = []

    # ── Header banner ────────────────────────────────────────────────────────
    banner_data = [["  YATRA AI  -  Travel Itinerary"]]
    banner = Table(banner_data, colWidths=[content_width])
    banner.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), DARK_BG),
        ("TEXTCOLOR",     (0, 0), (-1, -1), AMBER),
        ("FONTNAME",      (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, -1), 13),
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(banner)
    story.append(Spacer(1, 10))

    # ── Parse lines ──────────────────────────────────────────────────────────
    lines = itinerary_markdown.split("\n")
    i = 0

    while i < len(lines):
        line     = lines[i]
        stripped = line.strip()

        # Blank line → small spacer
        if not stripped:
            story.append(Spacer(1, 4))
            i += 1
            continue

        # Horizontal rule
        if re.match(r"^[-=*]{3,}$", stripped):
            story.append(HRFlowable(width="100%", thickness=0.4,
                                    color=BORDER, spaceAfter=4))
            i += 1
            continue

        # H1
        if stripped.startswith("# ") and not stripped.startswith("## "):
            story.append(Paragraph(_inline(stripped[2:].strip()), S["title"]))
            i += 1
            continue

        # H2
        if stripped.startswith("## "):
            story.append(Spacer(1, 5))
            story.append(Paragraph(_inline(stripped[3:].strip()), S["h2"]))
            story.append(HRFlowable(width="100%", thickness=0.5,
                                    color=AMBER, spaceAfter=4))
            i += 1
            continue

        # H3
        if stripped.startswith("### "):
            story.append(Paragraph(stripped[4:].strip().upper(), S["h3"]))
            i += 1
            continue

        # Markdown table (look-ahead for separator row)
        if stripped.startswith("|") and i + 1 < len(lines):
            next_stripped = lines[i + 1].strip()
            if re.match(r"^\|?[-| :]+\|?$", next_stripped):
                header_line = stripped
                rows_lines  = []
                j = i + 2
                while j < len(lines) and lines[j].strip().startswith("|"):
                    rows_lines.append(lines[j].strip())
                    j += 1

                headers, rows = _parse_table(header_line, "\n".join(rows_lines))

                if headers:
                    col_count = max(len(headers),
                                    max((len(r) for r in rows), default=0))
                    while len(headers) < col_count:
                        headers.append("")
                    rows = [r + [""] * (col_count - len(r)) for r in rows]

                    col_w = _col_widths(headers, content_width)

                    th_style = ParagraphStyle("th", fontSize=8, textColor=TEXT_DIM,
                                              fontName="Helvetica-Bold", leading=11,
                                              alignment=TA_LEFT)
                    td_style = ParagraphStyle("td", fontSize=9, textColor=TEXT_MAIN,
                                              fontName="Helvetica", leading=13,
                                              alignment=TA_LEFT)

                    table_data = [[Paragraph(_inline(h), th_style) for h in headers]]
                    for row in rows:
                        table_data.append(
                            [Paragraph(_inline(cell), td_style) for cell in row]
                        )

                    tbl = Table(table_data, colWidths=col_w, repeatRows=1)
                    tbl.setStyle(TableStyle([
                        ("BACKGROUND",     (0, 0), (-1, 0),  CARD_BG),
                        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [DARK_BG, CARD_BG]),
                        ("GRID",           (0, 0), (-1, -1), 0.4, BORDER),
                        ("TOPPADDING",     (0, 0), (-1, -1), 5),
                        ("BOTTOMPADDING",  (0, 0), (-1, -1), 5),
                        ("LEFTPADDING",    (0, 0), (-1, -1), 7),
                        ("RIGHTPADDING",   (0, 0), (-1, -1), 7),
                        ("VALIGN",         (0, 0), (-1, -1), "TOP"),
                    ]))
                    story.append(tbl)
                    story.append(Spacer(1, 8))

                i = j
                continue

        # Blockquote
        if stripped.startswith("> "):
            story.append(Paragraph(_inline(stripped[2:].strip()), S["blockquote"]))
            i += 1
            continue

        # List item
        if re.match(r"^[-•*] ", stripped):
            text = stripped[2:].strip()
            if re.match(r"^\*\*Day \d+", text):
                story.append(Paragraph(_inline(text), S["day_header"]))
            else:
                story.append(Paragraph("- " + _inline(text), S["li"]))
            i += 1
            continue

        # Numbered list
        if re.match(r"^\d+\.\s", stripped):
            text = re.sub(r"^\d+\.\s*", "", stripped)
            story.append(Paragraph(_inline(text), S["li"]))
            i += 1
            continue

        # Bold standalone line → Day header
        if (stripped.startswith("**") and stripped.endswith("**")
                and len(stripped) > 4 and "\n" not in stripped):
            inner = stripped[2:-2]
            story.append(Spacer(1, 5))
            story.append(Paragraph(_inline("**" + inner + "**"), S["day_header"]))
            i += 1
            continue

        # Italic note line
        if (stripped.startswith("*") and stripped.endswith("*")
                and not stripped.startswith("**")):
            story.append(Paragraph(_inline(stripped), S["note"]))
            i += 1
            continue

        # Regular paragraph
        story.append(Paragraph(_inline(stripped), S["body"]))
        i += 1

    # ── Footer ───────────────────────────────────────────────────────────────
    story.append(Spacer(1, 14))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Generated by Yatra AI  |  All prices in Rs.  |  yatra.ai",
        S["footer"]
    ))

    # ── Build ────────────────────────────────────────────────────────────────
    def _on_page(canvas, doc):
        """Dark background + page number on every page."""
        canvas.saveState()
        canvas.setFillColor(DARK_BG)
        canvas.rect(0, 0, PAGE_W, PAGE_H, fill=True, stroke=False)
        canvas.setFillColor(TEXT_DIM)
        canvas.setFont("Helvetica", 8)
        canvas.drawCentredString(PAGE_W / 2, 10 * mm, f"Page {doc.page}")
        canvas.restoreState()

    doc.build(story, onFirstPage=_on_page, onLaterPages=_on_page)
    return buf.getvalue()