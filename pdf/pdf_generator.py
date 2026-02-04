import io
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.colors import black, HexColor


def generate_assessment_pdf(
    *,
    student_name: str,
    grade: str,
    section: str,
    school: str,
    subject: str,
    created_at: str,
    report_markdown: str
):
    """
    Returns: BytesIO buffer containing PDF
    """

    buffer = io.BytesIO()
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "Title",
        parent=styles["Heading1"],
        alignment=TA_CENTER,
        textColor=HexColor("#1a237e")
    )

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    story = []

    # Title
    story.append(Paragraph("Assessment Report", title_style))
    story.append(Spacer(1, 20))

    # Student Info Table
    info_table = Table(
        [
            ["Name", student_name],
            ["Grade", f"{grade} - {section}"],
            ["School", school],
            ["Subject", subject],
            ["Date", created_at],
        ],
        colWidths=[120, 350]
    )

    info_table.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.5, black),
                ("BACKGROUND", (0, 0), (0, -1), HexColor("#eeeeee")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )

    story.append(info_table)
    story.append(Spacer(1, 20))

    # Report Content (Markdown treated as plain text)
    for line in report_markdown.split("\n"):
        if line.strip():
            story.append(Paragraph(line, styles["Normal"]))
            story.append(Spacer(1, 8))

    doc.build(story)
    buffer.seek(0)
    return buffer
