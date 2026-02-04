from flask_cors import CORS
from openai import OpenAI
from config import OPENAI_API_KEY

cors = CORS()
openai_client = OpenAI(api_key=OPENAI_API_KEY)
