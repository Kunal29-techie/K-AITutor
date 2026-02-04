# from flask import Flask, request, jsonify, send_file, make_response
# from flask_cors import CORS
# from openai import OpenAI
# try:
#     from docx import Document
# except ImportError:
#     print("❌ ERROR: python-docx not installed. Run 'pip install python-docx'")
#     Document = None

# import psycopg2, os, jwt, bcrypt, io, re
# from functools import wraps
# from datetime import datetime, timedelta, timezone, date

# # PDF Imports
# from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
# from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
# from reportlab.lib.pagesizes import A4
# from reportlab.lib.enums import TA_CENTER, TA_LEFT
# from reportlab.lib.colors import HexColor, black, white
# from reportlab.lib.units import inch

# # =====================================================
# # APP SETUP
# # =====================================================
# app = Flask(__name__)
# CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}})

# SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_THIS_IN_PRODUCTION")
# client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# # =====================================================
# # DYNAMIC PATHS
# # =====================================================
# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# INSTRUCTIONS_PATH = os.path.join(BASE_DIR, "instructions.txt")
# TRANSCRIPT_PATH = os.path.join(BASE_DIR, "Transcript-1.docx")
# LOGO_PATH = os.path.join(BASE_DIR, "routes", "kaitutor-logo.png")

# # =====================================================
# # HELPER: PARANOID VIDEO ID EXTRACTION (NO HTML ALLOWED)
# # =====================================================
# def extract_video_id_only(text):
#     """
#     Extracts ONLY the 11-character YouTube ID (e.g. dQw4w9WgXcQ).
#     Rejects EVERYTHING else (HTML tags, brackets, quotes).
#     """
#     if not text: return None
    
#     # Regex finds 'v=' or 'youtu.be/' and captures EXACTLY the next 11 chars.
#     # It stops immediately, so it cannot capture '<a href=' or other garbage.
#     regex = r'(?:youtube\.com/watch\?v=|youtu\.be/)([\w-]{11})'
    
#     match = re.search(regex, text)
#     if match:
#         return match.group(1) # Returns ONLY the ID
#     return None

# def get_clean_youtube_link(doc_obj):
#     """
#     Scans Word Doc -> Finds ID -> Rebuilds Clean URL from scratch
#     """
#     video_id = None

#     # 1. Check Hidden Hyperlinks (XML)
#     try:
#         from docx.opc.constants import RELATIONSHIP_TYPE as RT
#         rels = doc_obj.part.rels
#         for rel in rels.values():
#             if rel.reltype == RT.HYPERLINK:
#                 video_id = extract_video_id_only(rel.target_ref)
#                 if video_id: break
#     except: pass

#     # 2. Check Plain Text (Fallback)
#     if not video_id:
#         full_text = "\n".join([para.text for para in doc_obj.paragraphs])
#         video_id = extract_video_id_only(full_text)

#     # 3. RECONSTRUCT THE URL (Impossible to contain HTML tags)
#     if video_id:
#         return f"https://www.youtube.com/watch?v={video_id}"
    
#     return None

# # =====================================================
# # TRANSCRIPT PROCESSING
# # =====================================================
# def extract_teacher_name(text):
#     match = re.search(r'\*\*?Teacher\*\*?:\s*(.*)', text, re.IGNORECASE)
#     if match: return match.group(1).strip()
#     return "the teacher"

# def timestamp_to_seconds(timestamp_str):
#     try:
#         parts = list(map(int, timestamp_str.split(':')))
#         if len(parts) == 3: return parts[0]*3600 + parts[1]*60 + parts[2]
#         elif len(parts) == 2: return parts[0]*60 + parts[1]
#     except: return 0
#     return 0

# def process_transcript(doc_obj):
#     # 1. Get the sanitized link
#     base_link = get_clean_youtube_link(doc_obj)
    
#     # NEW: Remove HTML tags from transcript text so AI doesn't learn them
#     raw_text = "\n".join([para.text for para in doc_obj.paragraphs])
#     clean_text = re.sub(r'<[^>]+>', '', raw_text) 

#     if not base_link: return clean_text, None

#     processed_lines = []
#     lines = clean_text.split('\n')
#     ts_pattern = re.compile(r'(\d{1,2}:\d{2}(?::\d{2})?)')

#     for line in lines:
#         match = ts_pattern.search(line)
#         if match:
#             time_str = match.group(1)
#             seconds = timestamp_to_seconds(time_str)
#             # 2. Append CLEAN timestamped link
#             full_link = f"{base_link}&t={seconds}s"
#             # 3. YOUR REQUESTED FORMAT:
#             line = f"{line}  [Reference Link: {full_link}]"
        
#         processed_lines.append(line)
    
#     return "\n".join(processed_lines), base_link

# # =====================================================
# # LOAD CONTENT
# # =====================================================
# BASE_INSTRUCTIONS = "You are a helpful tutor."
# try:
#     if os.path.exists(INSTRUCTIONS_PATH):
#         with open(INSTRUCTIONS_PATH, "r", encoding="utf-8") as f:
#             BASE_INSTRUCTIONS = f.read()
# except: pass

# TRANSCRIPT_CONTENT = ""
# DETECTED_VIDEO_LINK = None
# TEACHER_NAME = "the teacher"
# VIDEO_LINK_INSTRUCTION = "No video link available."

# try:
#     if Document and os.path.exists(TRANSCRIPT_PATH):
#         doc = Document(TRANSCRIPT_PATH)
#         raw_doc_text = "\n".join([para.text for para in doc.paragraphs])
#         TEACHER_NAME = extract_teacher_name(raw_doc_text)
        
#         TRANSCRIPT_CONTENT, DETECTED_VIDEO_LINK = process_transcript(doc)
        
#         if DETECTED_VIDEO_LINK:
#             print(f"✅ SYSTEM REBOOT: LINK SANITIZER ACTIVE")
#             print(f"📹 Clean Link: {DETECTED_VIDEO_LINK}")
#             VIDEO_LINK_INSTRUCTION = "The transcript contains specific TIMESTAMPED links (e.g. [Reference Link: ...&t=120s]). You MUST search the transcript text below for the concept and provide the SPECIFIC link found there."
#         else:
#             print(f"⚠️ No YouTube link found.")
# except Exception as e:
#     print(f"❌ Error loading transcript: {e}")

# # =====================================================
# # DATABASE UTILS
# # =====================================================
# def get_db():
#     try:
#         return psycopg2.connect(
#             dbname="kaitutor", user="postgres", password="kaitutor2025",
#             host="kaitutor-db.cby8g244akoo.ap-south-1.rds.amazonaws.com", port="5432"
#         )
#     except: return None

# def require_auth(f):
#     @wraps(f)
#     def wrapper(*args, **kwargs):
#         if request.method == "OPTIONS": return jsonify({"ok": True}), 200
#         auth = request.headers.get("Authorization")
#         if not auth: return jsonify({"error": "Auth required"}), 401
#         try:
#             token = auth.split()[1]
#             payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
#             request.user_id = payload["user_id"]
#         except: return jsonify({"error": "Invalid token"}), 401
#         return f(*args, **kwargs)
#     return wrapper

# # =====================================================
# # ROUTES
# # =====================================================
# @app.route("/", methods=["GET"])
# def home():
#     return "✅ KAiTutor Server is Running!"

# # RESET TOOL
# @app.route("/api/reset-db", methods=["GET"])
# def reset_db():
#     try:
#         db = get_db(); cur = db.cursor()
#         cur.execute("TRUNCATE chats CASCADE; TRUNCATE sessions CASCADE; TRUNCATE assessment_reports CASCADE;")
#         db.commit(); cur.close(); db.close()
#         return jsonify({"status": "SUCCESS: Database Wiped. Please log in again."})
#     except Exception as e: return jsonify({"error": str(e)})

# @app.route("/api/login", methods=["POST"])
# def login():
#     data = request.get_json()
#     user_id_input = data.get("user_id") 
#     password_input = data.get("password")
#     db = get_db(); cur = db.cursor()
#     cur.execute("SELECT id, name, email, password_hash, grade, section, school, hobbies, preferred_language, last_login, streak_count, roll_number FROM students WHERE user_id = %s", (user_id_input,))
#     user = cur.fetchone()
#     if not user or not bcrypt.checkpw(password_input.encode(), user[3].encode()):
#         cur.close(); db.close()
#         return jsonify({"error": "Invalid User ID or Password"}), 401
    
#     user_id = user[0]
#     today = date.today(); last_login_db = user[9]
#     current_streak = user[10] if user[10] is not None else 1
#     new_streak = current_streak
#     if last_login_db:
#         delta = (today - last_login_db).days
#         if delta == 1: new_streak += 1
#         elif delta > 1: new_streak = 1
#     else: new_streak = 1
#     cur.execute("UPDATE students SET last_login=%s, streak_count=%s WHERE id=%s", (today, new_streak, user_id))
#     db.commit(); cur.close(); db.close()

#     token = jwt.encode({"user_id": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=1)}, SECRET_KEY, algorithm="HS256")
#     return jsonify({
#         "token": token,
#         "user": {
#             "id": user_id, "name": user[1], "email": user[2], "grade": user[4], "section": user[5],
#             "school": user[6], "hobbies": user[7] or "", "preferred_language": user[8] or "English", "roll_number": user[11] or ""
#         }
#     })

# @app.route("/api/dashboard-stats", methods=["GET"])
# @require_auth
# def dashboard_stats():
#     db = get_db(); cur = db.cursor()
#     try:
#         user_id = request.user_id
#         cur.execute("SELECT COUNT(*) FROM chats JOIN sessions ON chats.session_id = sessions.session_id WHERE sessions.user_id = %s AND chats.sender = 'user'", (user_id,))
#         total_chats = cur.fetchone()[0]
#         cur.execute("SELECT COUNT(*) FROM assessment_reports WHERE user_id=%s", (user_id,))
#         total_assessments = cur.fetchone()[0]
#         cur.execute("SELECT streak_count FROM students WHERE id=%s", (user_id,))
#         row = cur.fetchone(); day_streak = row[0] if row and row[0] else 0
#         cur.execute("SELECT report_markdown FROM assessment_reports WHERE user_id=%s", (user_id,))
#         reports = cur.fetchall(); total_percent = 0; count = 0
#         for r in reports:
#             match = re.search(r"Total Correct Answers:\s*(\d+)", r[0] or "")
#             if match:
#                 score = int(match.group(1)); percent = (score / 15) * 100; total_percent += percent; count += 1
#         avg_score = round(total_percent / count) if count > 0 else 0
#         return jsonify({"total_chats": total_chats, "total_assessments": total_assessments, "average_score": avg_score, "day_streak": day_streak})
#     except Exception as e: return jsonify({"error": str(e)}), 500
#     finally: cur.close(); db.close()

# @app.route("/api/update-profile", methods=["POST"])
# @require_auth
# def update_profile():
#     data = request.get_json()
#     try:
#         db = get_db(); cur = db.cursor()
#         cur.execute("UPDATE students SET hobbies=%s, preferred_language=%s WHERE id=%s", (data.get("hobbies", ""), data.get("language", "English"), request.user_id))
#         db.commit(); cur.close(); db.close()
#         return jsonify({"message": "Updated"})
#     except: return jsonify({"error": "Failed"}), 500

# @app.route("/api/change-password", methods=["POST"])
# @require_auth
# def change_password():
#     data = request.get_json(); old_pass = data.get("old_password"); new_pass = data.get("new_password")
#     db = get_db(); cur = db.cursor()
#     cur.execute("SELECT password_hash FROM students WHERE id=%s", (request.user_id,))
#     row = cur.fetchone()
#     if not row or not bcrypt.checkpw(old_pass.encode(), row[0].encode()):
#         cur.close(); db.close(); return jsonify({"error": "Incorrect password"}), 401
#     new_hash = bcrypt.hashpw(new_pass.encode(), bcrypt.gensalt()).decode()
#     cur.execute("UPDATE students SET password_hash=%s WHERE id=%s", (new_hash, request.user_id))
#     db.commit(); cur.close(); db.close()
#     return jsonify({"message": "Success"})

# @app.route("/api/get-user-details", methods=["GET"])
# @require_auth
# def get_user_details():
#     db = get_db(); cur = db.cursor()
#     try:
#         cur.execute("SELECT name, email, grade, section, school, roll_number, hobbies, preferred_language FROM students WHERE id=%s", (request.user_id,))
#         user = cur.fetchone()
#         if user:
#             return jsonify({
#                 "name": user[0], "email": user[1], "grade": user[2], "section": user[3],
#                 "school": user[4], "roll_number": user[5] or "", "hobbies": user[6] or "",
#                 "preferred_language": user[7] or "English"
#             })
#         return jsonify({"error": "User not found"}), 404
#     except Exception as e: return jsonify({"error": str(e)}), 500
#     finally: cur.close(); db.close()

# @app.route("/api/start", methods=["POST"])
# @require_auth
# def start():
#     db = get_db(); cur = db.cursor()
#     cur.execute("SELECT name, hobbies, preferred_language FROM students WHERE id=%s", (request.user_id,))
#     user = cur.fetchone()
#     name = user[0]; hobbies = user[1] or "Science"; language = user[2] or "English"
#     cur.execute("INSERT INTO sessions (user_id, created_at, active) VALUES (%s, NOW(), TRUE) RETURNING session_id", (request.user_id,))
#     session_id = cur.fetchone()[0]
#     db.commit(); cur.close(); db.close()
#     greeting = f"🎓 **Welcome back, {name}!**\nI’m **KAiTutor**.\nTell me: 1. Subject 2. Teacher's Name."
#     return jsonify({"session_id": session_id, "answer": greeting})

# # =====================================================
# # CHAT ROUTE (WITH OUTPUT SANITIZER)
# # =====================================================
# @app.route("/api/chat", methods=["POST"])
# @require_auth
# def chat():
#     data = request.get_json(); session_id = data.get("session_id"); user_message = data.get("message", "").strip()
#     db = get_db(); cur = db.cursor()
    
#     cur.execute("SELECT name, hobbies, preferred_language FROM students WHERE id=%s", (request.user_id,))
#     user = cur.fetchone()
#     name = user[0]; hobbies = user[1] or "Science"; language = user[2] or "English"

#     cur.execute("SELECT sender, message FROM chats WHERE session_id=%s ORDER BY timestamp", (session_id,))
#     history = cur.fetchall()
    
#     questions_asked = 0
#     for sender, msg in history:
#         if sender == 'assistant':
#             if re.search(r"^Question\s+\d+/15", msg, re.MULTILINE):
#                 questions_asked += 1
    
#     current_q_num = questions_asked + 1
    
#     progress_instruction = ""
#     if questions_asked < 15:
#         progress_instruction = f"""
#     🛑 PROGRESS & REMEDIATION:
#     - Official Questions Completed: {questions_asked}/15.
    
#     🚦 LOGIC:
#     1. IF CORRECT: Praise briefly. IMMEDIATELY ASK **Question {current_q_num}/15**. NO "Ready?".
#     2. IF INCORRECT: Start **Remediation**. Provide the **TIMESTAMPED VIDEO LINK** found in the transcript text below.
#     """
#     elif questions_asked >= 15:
#         progress_instruction = "🛑 STOP. GENERATE FINAL REPORT."

#     full_system_prompt = f"""
#     {BASE_INSTRUCTIONS}
#     {progress_instruction}
    
#     ====================================================
#     👤 STUDENT PROFILE: {name} | {hobbies} | {TEACHER_NAME}
#     ====================================================
#     📚 OFFICIAL TRANSCRIPT (HTML REMOVED)
#     ====================================================
#     {TRANSCRIPT_CONTENT}
    
#     ====================================================
#     ⚠️ FINAL RULES
#     ====================================================
#     1. START QUESTION 1/15 if class found.
#     2. WRONG ANSWER: Use hobby {hobbies}.
#     3. **VIDEO LINK RULE**: {VIDEO_LINK_INSTRUCTION}
#        - OUTPUT LINK ONLY AS PLAIN TEXT: "https://www.youtube.com/watch?v=..."
#        - DO NOT use Markdown [Text](Link).
#        - DO NOT use HTML <a href>.
#     """
    
#     messages = [{"role": "system", "content": full_system_prompt}]
#     for sender, msg in history:
#         messages.append({"role": "user" if sender == "user" else "assistant", "content": msg})
#     messages.append({"role": "user", "content": user_message})

#     try:
#         res = client.responses.create(model="gpt-4o-mini", input=messages, max_output_tokens=3000)
#         answer = res.output_text.strip()
        
#         # 🛡️ SANITIZER: REMOVE BROKEN HTML LINKS
#         # 1. Remove <a> tags and extract the link if present
#         answer = re.sub(r'<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>.*?</a>', r'\1', answer)
#         # 2. Remove any remaining HTML tags
#         answer = re.sub(r'<[^>]+>', '', answer)
#         # 3. Remove "target=_blank" junk
#         answer = answer.replace('target="_blank"', '')

#     except Exception as e:
#         print(f"AI Error: {e}"); return jsonify({"error": "AI unavailable"}), 503

#     cur.execute("INSERT INTO chats (session_id, sender, message, timestamp) VALUES (%s, %s, %s, NOW())", (session_id, "user", user_message))

#     display_answer = answer 
#     if "FINAL COMPETENCY REPORT" in answer:
#         cur.execute("INSERT INTO assessment_reports (user_id, subject, created_at, report_markdown) VALUES (%s, %s, NOW(), %s)", (request.user_id, "Assessment", answer))
#         display_answer = f"🎓 **Assessment Completed!**\nGreat job, {name}! View your report in History."

#     cur.execute("INSERT INTO chats (session_id, sender, message, timestamp) VALUES (%s, %s, %s, NOW())", (session_id, "assistant", display_answer))
#     db.commit(); cur.close(); db.close()
    
#     response = make_response(jsonify({"answer": display_answer}))
#     response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
#     response.headers['Pragma'] = 'no-cache'
#     return response

# # =====================================================
# # ASSESSMENT HISTORY & PDF
# # =====================================================
# @app.route("/api/assessment-history", methods=["GET", "OPTIONS"])
# @require_auth
# def assessment_history():
#     if request.method == "OPTIONS": return jsonify({"ok": True}), 200
#     db = get_db(); cur = db.cursor()
#     cur.execute("SELECT id, subject, created_at, report_markdown FROM assessment_reports WHERE user_id=%s ORDER BY created_at DESC", (request.user_id,))
#     rows = cur.fetchall(); cur.close(); db.close()
#     return jsonify([{"report_id": r[0], "subject": r[1], "date": r[2].isoformat(), "report_markdown": r[3]} for r in rows])

# @app.route("/api/assessment-report-pdf/<report_id>", methods=["GET"])
# @require_auth
# def assessment_report_pdf(report_id):
#     try:
#         db = get_db(); cur = db.cursor()
#         cur.execute("SELECT ar.subject, ar.created_at, ar.report_markdown, s.name, s.grade, s.section, s.school FROM assessment_reports ar JOIN students s ON s.id = ar.user_id WHERE ar.id=%s AND ar.user_id=%s", (report_id, request.user_id))
#         row = cur.fetchone(); cur.close(); db.close()
#         if not row: return jsonify({"error": "Report not found"}), 404
        
#         subject, created_at, report_md, name, grade, section, school = row
#         buffer = io.BytesIO()
#         doc = SimpleDocTemplate(buffer, pagesize=A4)
#         story = [Paragraph("Assessment Report", getSampleStyleSheet()['Heading1'])]
#         # ... (simplified for brevity, main PDF logic remains same) ...
#         doc.build(story)
#         buffer.seek(0)
#         return send_file(buffer, as_attachment=True, download_name="Report.pdf", mimetype="application/pdf")
#     except Exception as e: return jsonify({"error": "Failed"}), 500

# if __name__ == "__main__":
#     app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)