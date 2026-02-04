from flask import Blueprint, send_file, jsonify
from auth.auth_utils import require_auth
from db.connection import get_connection
from pdf.pdf_generator import generate_assessment_pdf

assessment_bp = Blueprint("assessment", __name__)


@assessment_bp.route("/api/assessment-report-pdf/<int:report_id>", methods=["GET"])
@require_auth
def assessment_pdf(report_id):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB unavailable"}), 503

    cur = conn.cursor()
    cur.execute(
        """
        SELECT
            ar.subject,
            ar.created_at,
            ar.report_markdown,
            s.name,
            s.grade,
            s.section,
            s.school
        FROM assessment_reports ar
        JOIN students s ON s.id = ar.user_id
        WHERE ar.id = %s AND ar.user_id = %s
        """,
        (report_id, request.user_id)
    )

    row = cur.fetchone()
    if not row:
        return jsonify({"error": "Report not found"}), 404

    subject, created_at, report_md, name, grade, section, school = row

    pdf_buffer = generate_assessment_pdf(
        student_name=name,
        grade=grade,
        section=section,
        school=school,
        subject=subject,
        created_at=created_at.strftime("%Y-%m-%d"),
        report_markdown=report_md,
    )

    return send_file(
        pdf_buffer,
        as_attachment=True,
        download_name="Assessment_Report.pdf",
        mimetype="application/pdf"
    )
