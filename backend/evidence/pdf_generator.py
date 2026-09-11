from __future__ import annotations

from io import BytesIO
import logging
from textwrap import wrap

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

from logging_config import get_logger, log_event
from schemas import ScreeningResponse

logger = get_logger("sentinelai.evidence")


def build_evidence_pdf(screening: ScreeningResponse) -> bytes:
    """Create a concise, human-readable screening receipt for the demo workflow.

    It records hashes and decisions, not original biometric templates. A production
    BSA Section 63 certificate workflow needs organization-approved wording and
    signer controls; this report intentionally labels itself as a system receipt.
    """
    log_event(
        logger,
        logging.DEBUG,
        "BUILDING_EVIDENCE_PDF",
        data={"screening_id": screening.screening_id, "decision": screening.decision},
    )
    output = BytesIO()
    pdf = canvas.Canvas(output, pagesize=A4, pageCompression=1)
    width, height = A4
    margin = 20 * mm
    cursor = height - margin

    def line(text: str, size: int = 10, bold: bool = False, gap: float = 5 * mm) -> None:
        nonlocal cursor
        if cursor < margin + 18 * mm:
            pdf.showPage()
            cursor = height - margin
        pdf.setFont("Helvetica-Bold" if bold else "Helvetica", size)
        pdf.drawString(margin, cursor, text)
        cursor -= gap

    pdf.setTitle(f"SentinelAI screening receipt {screening.screening_id}")
    line("SENTINELAI — SCREENING SYSTEM RECEIPT", 15, True, 9 * mm)
    line(f"Screening ID: {screening.screening_id}")
    line(f"Created (UTC): {screening.created_at.isoformat()}")
    line(f"Decision: {screening.decision}     Risk score: {screening.risk_score}/100", 11, True)
    line("", gap=3 * mm)
    line("Tier results", 12, True, 7 * mm)
    for tier in screening.tiers:
        line(f"{tier.tier}. {tier.title}: {tier.status.upper()} — {tier.summary}", 9, gap=4.5 * mm)
    line("", gap=3 * mm)
    line("Audit integrity", 12, True, 7 * mm)
    for key in ("receipt_hash", "previous_hash", "chain_hash"):
        value = str(screening.audit.get(key, "not available"))
        line(f"{key.replace('_', ' ').title()}: {value}", 8, gap=4.5 * mm)
    line("", gap=3 * mm)
    line("Decision notes", 12, True, 7 * mm)
    for reason in screening.reasons:
        for index, section in enumerate(wrap(f"• {reason}", 106)):
            line(section, 9, gap=4.5 * mm if index == 0 else 3.8 * mm)
    line("", gap=3 * mm)
    line("This is a system-generated demonstration receipt. It is not a statutory certificate.", 8)
    pdf.save()
    pdf_bytes = output.getvalue()
    log_event(
        logger,
        logging.INFO,
        "EVIDENCE_PDF_BUILT",
        data={"screening_id": screening.screening_id, "size_bytes": len(pdf_bytes)},
    )
    return pdf_bytes
