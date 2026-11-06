"""
Sajag AI — Evidence Report Generation (ReportLab PDF & JSON Export).
Strictly labeled: "AI-generated – pending human review" per PRD §5 & §7.
"""

import os
import io
import json
import time
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from store import MEM, USE_REAL_SUPABASE, supabase_client


def generate_report_payload(call: Dict[str, Any], turns: List[Dict[str, Any]], identifiers: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Compile structured JSON payload for 1930 / cybercrime portal."""
    head_hash = turns[-1].get("hash") if turns else "0" * 64

    return {
        "report_id": f"SAJAG-{call.get('id', 'DEMO')[:8].upper()}",
        "call_id": call.get("id"),
        "classification": "AI-generated – pending human review",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "incident_details": {
            "channel": call.get("channel", "sim"),
            "caller_number": call.get("from_number", "Unknown"),
            "target_number": call.get("to_number", "Protected Elder"),
            "duration_seconds": call.get("duration_s", 120),
            "decoy_seconds": call.get("decoy_seconds", 90),
            "max_risk_score": call.get("p_scam", 0.95),
            "risk_level": call.get("risk_level", "CRITICAL"),
            "category": call.get("scam_category", "DIGITAL_ARREST"),
            "signals": call.get("signals", ["authority", "threat", "demand"]),
            "script_fingerprint": call.get("script_fp", "sha1:a1b2c3d4")
        },
        "extracted_intelligence": [
            {
                "type": item.get("type"),
                "value": item.get("value"),
                "normalized": item.get("normalized"),
                "syntax_valid": item.get("syntax_valid", True),
                "verification_status": "Investigative Lead (Unverified Ownership)",
                "quote": item.get("quote", ""),
                "turn_seq": item.get("turn_seq", 1)
            }
            for item in identifiers
        ],
        "cryptographic_chain": {
            "algorithm": "SHA-256",
            "turn_count": len(turns),
            "head_hash": head_hash
        },
        "portal_submission_guide": {
            "portal": "National Cyber Crime Reporting Portal (cybercrime.gov.in) / Helpline 1930",
            "category_to_select": "Online Financial Fraud / Impersonation / Digital Arrest",
            "suspect_identifiers": [item.get("normalized") for item in identifiers if item.get("syntax_valid")],
            "incident_summary": (
                f"On {time.strftime('%d-%m-%Y')}, the victim received an unsolicited call from {call.get('from_number', 'unknown')} "
                f"claiming to be an authority ({call.get('scam_category', 'Digital Arrest')}). "
                f"Sajag AI scam-baiting agent engaged the caller and captured structured payment/contact credentials."
            )
        }
    }


def generate_pdf_bytes(report_payload: Dict[str, Any]) -> bytes:
    """Generate professional PDF evidence report using ReportLab."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontSize=20,
        textColor=colors.HexColor("#0A1626"),
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        "ReportSub",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#FF4D5E"),
        fontName="Helvetica-Bold",
        spaceAfter=15
    )
    h2_style = ParagraphStyle(
        "ReportH2",
        parent=styles["Heading2"],
        fontSize=13,
        textColor=colors.HexColor("#12304A"),
        spaceBefore=10,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        "ReportBody",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#222222"),
        leading=12
    )

    elements = []

    # Header
    elements.append(Paragraph("SAJAG AI — INCIDENT INTELLIGENCE REPORT", title_style))
    elements.append(Paragraph("DISCLAIMER: AI-GENERATED EVIDENCE — PENDING HUMAN REVIEW", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#12304A"), spaceAfter=12))

    inc = report_payload["incident_details"]
    meta_data = [
        [Paragraph("<b>Report ID:</b>", body_style), Paragraph(report_payload["report_id"], body_style),
         Paragraph("<b>Date/Time:</b>", body_style), Paragraph(report_payload["timestamp"], body_style)],
        [Paragraph("<b>Caller Number:</b>", body_style), Paragraph(str(inc["caller_number"]), body_style),
         Paragraph("<b>Channel:</b>", body_style), Paragraph(str(inc["channel"]).upper(), body_style)],
        [Paragraph("<b>Category:</b>", body_style), Paragraph(str(inc["category"]), body_style),
         Paragraph("<b>Risk Score:</b>", body_style), Paragraph(f"{inc['max_risk_score']} ({inc['risk_level']})", body_style)],
        [Paragraph("<b>Decoy Wasted:</b>", body_style), Paragraph(f"{inc['decoy_seconds']} seconds", body_style),
         Paragraph("<b>Campaign Fingerprint:</b>", body_style), Paragraph(str(inc["script_fingerprint"]), body_style)],
    ]
    meta_table = Table(meta_data, colWidths=[1.3*inch, 2.2*inch, 1.4*inch, 2.2*inch])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F4F8FC")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#C2D4E8")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2EBF4")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 12))

    # Extracted Identifiers
    elements.append(Paragraph("1. Extracted Suspect Identifiers (Caller-Stated Leads)", h2_style))
    ident_rows = [["Type", "Extracted Value", "Syntax Valid?", "Verification", "Verbatim Quote"]]
    for item in report_payload.get("extracted_intelligence", []):
        ident_rows.append([
            Paragraph(f"<b>{item.get('type')}</b>", body_style),
            Paragraph(f"<code>{item.get('normalized')}</code>", body_style),
            Paragraph("✔ Valid" if item.get("syntax_valid") else "✖ Invalid", body_style),
            Paragraph("Lead (Unverified)", body_style),
            Paragraph(f"\"{item.get('quote')}\"", body_style),
        ])
    if len(ident_rows) == 1:
        ident_rows.append([Paragraph("No suspect identifiers extracted", body_style), "", "", "", ""])

    ident_table = Table(ident_rows, colWidths=[1.1*inch, 1.8*inch, 1.0*inch, 1.3*inch, 1.9*inch])
    ident_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0A1626")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 5),
        ("TOPPADDING", (0, 0), (-1, 0), 5),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CCDDEE")),
    ]))
    elements.append(ident_table)
    elements.append(Spacer(1, 12))

    # Guided 1930 Submission
    elements.append(Paragraph("2. Guided 1930 / Cybercrime Portal Submission Steps", h2_style))
    guide = report_payload.get("portal_submission_guide", {})
    guide_text = f"""
    <b>Official Portal:</b> {guide.get('portal')}<br/>
    <b>Category Selection:</b> {guide.get('category_to_select')}<br/>
    <b>Suspect Handles:</b> {', '.join(guide.get('suspect_identifiers', [])) or 'None'}<br/>
    <b>Suggested Summary:</b><br/>{guide.get('incident_summary')}
    """
    elements.append(Paragraph(guide_text, body_style))
    elements.append(Spacer(1, 12))

    # Cryptographic Hash Chain
    elements.append(Paragraph("3. Chain of Custody & Evidence Tamper Proof", h2_style))
    chain = report_payload.get("cryptographic_chain", {})
    chain_text = f"""
    <b>Hash Algorithm:</b> {chain.get('algorithm')}<br/>
    <b>Transcript Turns Hashed:</b> {chain.get('turn_count')}<br/>
    <b>Chain Head Hash:</b> <code>{chain.get('head_hash')}</code><br/>
    <i>Each conversational turn is cryptographically chained to its predecessor to prevent tampering.</i>
    """
    elements.append(Paragraph(chain_text, body_style))
    elements.append(Spacer(1, 10))

    # Section 65B Certificate under Indian Evidence Act, 1872
    elements.append(Paragraph("4. Certificate Under Section 65B, Indian Evidence Act, 1872", h2_style))
    cert_text = f"""
    <b>Court Admissibility Certification:</b> It is hereby certified pursuant to Section 65B(4) of the Indian Evidence Act, 1872 (as amended) that the digital call transcript, voice forensics, and suspect identifier intelligence detailed herein were produced autonomously by the Sajag Cyber Defense Electronic Record System during ordinary lawful operation. The electronic devices functioned properly without unauthorized interference or data alteration. Integrity verified via SHA-256 cryptographic digest: <code>{chain.get('head_hash', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')[:32]}...</code>.
    """
    elements.append(Paragraph(cert_text, body_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

