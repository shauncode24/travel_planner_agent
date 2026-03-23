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
    base = getSampleStyleSheet()

    def ps(name, **kw):
        return ParagraphStyle(name, **kw)

    return {
        "title": ps("yt_title",
            fontSize=26, leading=32, textColor=AMBER,
            fontName="Helvetica-Bold", alignment=TA_LEFT,
            spaceAfter=4),

        "subtitle": ps("yt_subtitle",
            fontSize=11, leading=16, textColor=TEXT_DIM,
            fontName="Helvetica", alignment=TA_LEFT,
            spaceAfter=14),

        "h2": ps("yt_h2",
            fontSize=15, leading=20, textColor=AMBER,
            fontName="Helvetica-Bold", alignment=TA_LEFT,
            spaceBefore=14, spaceAfter=6),

        "h3": ps("yt_h3",
            fontSize=9, leading=12, textColor=TEXT_DIM,
            fontName="Helvetica-Bold", alignment=TA_LEFT,
            spaceBefore=10, spaceAfter=5,
            textTransform="uppercase"),

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

        "footer": ps("yt_footer",
            fontSize=8, leading=11, textColor=TEXT_DIM,
            fontName="Helvetica", alignment=TA_CENTER),
    }


# ── Inline markdown → ReportLab XML ──────────────────────────────────────────

def _inline(text: str) -> str:
    """Convert **bold** and basic chars to reportlab XML."""
    # escape & < > first (not already escaped)
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    # **bold**
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    # restore Rs. sign (safe in reportlab)
    text = text.replace("&#8377;", "Rs.")
    return text


# ── Parse markdown sections ───────────────────────────────────────────────────

def _parse_table(header_line: str, rows_text: str):
    """Returns (header_list, rows_list_of_lists)."""
    headers = [c.strip() for c in header_line.split("|") if c.strip()]
    rows = []
    for row in rows_text.strip().split("\n"):
        if not row.strip() or re.match(r"^\s*\|?[-| :]+\|?\s*$", row):
            continue
        cells = [c.strip() for c in row.split("|") if c.strip()]
        if cells:
            rows.append(cells)
    return headers, rows


# ── PDF builder ───────────────────────────────────────────────────────────────

def generate_pdf(itinerary_markdown: str) -> bytes:
    """
    Parse the itinerary markdown and produce a styled PDF.
    Returns raw PDF bytes.
    """
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
    banner_data = [["✈  YATRA AI  —  Travel Itinerary"]]
    banner = Table(banner_data, colWidths=[content_width])
    banner.setStyle(TableStyle([
        ("BACKGROUND",  (0, 0), (-1, -1), DARK_BG),
        ("TEXTCOLOR",   (0, 0), (-1, -1), AMBER),
        ("FONTNAME",    (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE",    (0, 0), (-1, -1), 13),
        ("ALIGN",       (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING",  (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING",(0,0), (-1, -1), 10),
        ("ROUNDEDCORNERS", [6]),
    ]))
    story.append(banner)
    story.append(Spacer(1, 10))

    # ── Parse lines ──────────────────────────────────────────────────────────
    lines = itinerary_markdown.split("\n")
    i = 0

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # H2
        if stripped.startswith("## "):
            text = stripped[3:].strip()
            story.append(Paragraph(_inline(text), S["h2"]))
            story.append(HRFlowable(width="100%", thickness=0.5,
                                    color=AMBER, spaceAfter=4))
            i += 1
            continue

        # H3
        if stripped.startswith("### "):
            text = stripped[4:].strip()
            story.append(Paragraph(text.upper(), S["h3"]))
            i += 1
            continue

        # Table (look-ahead)
        if stripped.startswith("|") and i + 1 < len(lines):
            next_line = lines[i + 1].strip()
            if re.match(r"^\|?[-| :]+\|?$", next_line):
                # collect table rows
                header_line = stripped
                rows_lines = []
                j = i + 2
                while j < len(lines) and lines[j].strip().startswith("|"):
                    rows_lines.append(lines[j].strip())
                    j += 1

                headers, rows = _parse_table(header_line, "\n".join(rows_lines))

                # Build table data
                col_count = max(len(headers), max((len(r) for r in rows), default=0))
                # Pad headers / rows
                while len(headers) < col_count:
                    headers.append("")
                rows = [r + [""] * (col_count - len(r)) for r in rows]

                # Style header cells bold
                table_data = [[Paragraph(f"<b>{_inline(h)}</b>", ParagraphStyle(
                    "th", fontSize=9, textColor=TEXT_DIM, fontName="Helvetica-Bold",
                    leading=12, alignment=TA_LEFT))
                    for h in headers]]

                for row in rows:
                    table_data.append([
                        Paragraph(_inline(cell), ParagraphStyle(
                            "td", fontSize=10, textColor=TEXT_MAIN,
                            fontName="Helvetica", leading=13, alignment=TA_LEFT))
                        for cell in row
                    ])

                col_w = content_width / col_count
                tbl = Table(table_data, colWidths=[col_w] * col_count,
                            repeatRows=1)
                tbl.setStyle(TableStyle([
                    ("BACKGROUND",    (0, 0), (-1, 0),   CARD_BG),
                    ("BACKGROUND",    (0, 1), (-1, -1),  DARK_BG),
                    ("ROWBACKGROUNDS",(0, 1), (-1, -1),  [DARK_BG, CARD_BG]),
                    ("GRID",          (0, 0), (-1, -1),  0.4, BORDER),
                    ("TOPPADDING",    (0, 0), (-1, -1),  5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1),  5),
                    ("LEFTPADDING",   (0, 0), (-1, -1),  8),
                    ("RIGHTPADDING",  (0, 0), (-1, -1),  8),
                    ("VALIGN",        (0, 0), (-1, -1),  "MIDDLE"),
                ]))
                story.append(tbl)
                story.append(Spacer(1, 8))
                i = j
                continue

        # List item
        if stripped.startswith("- ") or stripped.startswith("• "):
            text = stripped[2:].strip()
            # Check if it starts with **Day X** pattern
            if re.match(r"^\*\*Day \d+", text):
                story.append(Paragraph(_inline(text), S["bold_li"]))
            else:
                story.append(Paragraph("• " + _inline(text), S["li"]))
            i += 1
            continue

        # Bold standalone line (e.g. **Day 1 — Theme**)
        if stripped.startswith("**") and stripped.endswith("**") and len(stripped) > 4:
            text = stripped[2:-2]
            story.append(Spacer(1, 6))
            day_style = ParagraphStyle("day_hdr",
                fontSize=11, leading=15, textColor=GREEN,
                fontName="Helvetica-Bold", leftIndent=0, spaceAfter=4)
            story.append(Paragraph(_inline("**" + text + "**"), day_style))
            i += 1
            continue

        # Normal paragraph (skip separator lines)
        if stripped and not re.match(r"^[-=]{3,}$", stripped):
            story.append(Paragraph(_inline(stripped), S["body"]))
            i += 1
            continue

        # Blank line → small spacer
        story.append(Spacer(1, 4))
        i += 1

    # ── Footer ───────────────────────────────────────────────────────────────
    story.append(Spacer(1, 14))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Generated by Yatra AI  •  All prices in Rs.  •  yatra.ai",
        S["footer"]
    ))

    # ── Build ────────────────────────────────────────────────────────────────
    def _on_page(canvas, doc):
        """Dark background + page number on every page."""
        canvas.saveState()
        canvas.setFillColor(DARK_BG)
        canvas.rect(0, 0, PAGE_W, PAGE_H, fill=True, stroke=False)
        # Page number
        canvas.setFillColor(TEXT_DIM)
        canvas.setFont("Helvetica", 8)
        canvas.drawCentredString(PAGE_W / 2, 10 * mm,
                                 f"Page {doc.page}")
        canvas.restoreState()

    doc.build(story, onFirstPage=_on_page, onLaterPages=_on_page)
    return buf.getvalue()