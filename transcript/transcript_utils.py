import re

def extract_video_id_only(text):
    if not text:
        return None
    regex = r'(?:youtube\.com/watch\?v=|youtu\.be/)([\w-]{11})'
    match = re.search(regex, text)
    return match.group(1) if match else None

def timestamp_to_seconds(timestamp):
    parts = list(map(int, timestamp.split(':')))
    if len(parts) == 3:
        return parts[0]*3600 + parts[1]*60 + parts[2]
    if len(parts) == 2:
        return parts[0]*60 + parts[1]
    return 0
