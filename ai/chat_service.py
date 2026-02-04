import re
from extensions import openai_client

def run_chat(messages):
    res = openai_client.responses.create(
        model="gpt-4o-mini",
        input=messages,
        max_output_tokens=3000
    )

    answer = res.output_text.strip()
    answer = re.sub(r'<[^>]+>', '', answer)
    return answer
