import re
from docx import Document
from transcript.transcript_utils import extract_video_id_only, timestamp_to_seconds

def process_transcript(doc):
    text = "\n".join(p.text for p in doc.paragraphs)
    text = re.sub(r'<[^>]+>', '', text)

    video_id = extract_video_id_only(text)
    if not video_id:
        return text, None

    base = f"https://www.youtube.com/watch?v={video_id}"
    lines = []

    for line in text.split("\n"):
        match = re.search(r'(\d{1,2}:\d{2}(?::\d{2})?)', line)
        if match:
            sec = timestamp_to_seconds(match.group(1))
            line += f"  [Reference Link: {base}&t={sec}s]"
        lines.append(line)

    return "\n".join(lines), base
