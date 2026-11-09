from ollama import chat
import re

MODEL_NAME = "qwen2.5:1.5b"


def find_relevant_pdf_text(pdf_text: str, question: str) -> str:
    stop_words = {
        "what", "is", "an", "a", "the", "of", "in", "on",
        "and", "or", "to", "for", "from", "with", "does",
        "do", "how", "why", "which", "who", "are", "was",
        "were", "be", "it", "this", "that", "according",
        "explain", "define", "describe", "tell", "about"
    }

    question_words = {
        word.lower()
        for word in re.findall(r"\b[a-zA-Z]{3,}\b", question)
        if word.lower() not in stop_words
    }

    normalized_text = re.sub(r"\s+", " ", pdf_text).strip()
    sentences = re.split(r"(?<=[.!?])\s+", normalized_text)

    scored = []

    for sentence in sentences:
        words = {
            word.lower()
            for word in re.findall(r"\b[a-zA-Z]{3,}\b", sentence)
            if word.lower() not in stop_words
        }

        score = len(question_words.intersection(words))

        if score > 0:
            scored.append((score, sentence.strip()))

    if not scored:
        return ""

    scored.sort(key=lambda item: item[0], reverse=True)

    # Include the strongest matches, preserving document order.
    best_score = scored[0][0]
    selected = [
        sentence for score, sentence in scored
        if score == best_score
    ]

    return "\n".join(selected[:5])


def generate_ai_response(prompt: str, history=None) -> str:
    messages = [
        {
            "role": "system",
            "content": """
You are StudyMate AI, a friendly college study assistant.
Use simple student-friendly English.
Keep answers focused and accurate.
Use Markdown headings, bullets and examples when useful.
For exam questions, write clear exam-ready answers.
Do not invent facts. Say when you are unsure.
"""
        }
    ]

    if history:
        for item in history:
            if item.get("role") in ("user", "assistant"):
                messages.append({
                    "role": item["role"],
                    "content": item["content"]
                })

    messages.append({"role": "user", "content": prompt})

    response = chat(model=MODEL_NAME, messages=messages)
    return response.message.content


def generate_pdf_summary(pdf_text: str) -> str:
    if len(pdf_text.split()) < 20:
        return "Not enough readable content in this PDF to generate a reliable summary."

    response = chat(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": """
You are an accurate academic PDF summarizer.

STRICT RULES:
- Use ONLY the supplied PDF text.
- Never add outside facts, examples or assumptions.
- Preserve the document's meaning.
- Do not guess missing information.
- Organize the summary with headings and bullet points.
- If the text is incomplete, clearly mention that.
"""
            },
            {
                "role": "user",
                "content": f"Summarize this PDF:\n\n{pdf_text[:30000]}"
            }
        ],
        options={"temperature": 0}
    )

    return response.message.content


def generate_pdf_answer(pdf_text: str, question: str) -> str:
    relevant_text = find_relevant_pdf_text(pdf_text, question)

    if not relevant_text:
        return "This information is not clearly available in the uploaded PDF."

    response = chat(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": """
You are StudyMate AI, a careful academic PDF tutor.

Use ONLY the supplied PDF information.
Do not add outside facts, examples or assumptions.
Do not claim the PDF says something it does not say.
If the supplied information does not answer the question, say:
"This information is not clearly available in the uploaded PDF."

Return these two sections:

**Original PDF information:**
Quote the relevant sentence or sentences exactly.

**Simple Explanation:**
Explain only the quoted information in easy English.
If the source is already simple, keep the explanation short.
"""
            },
            {
                "role": "user",
                "content": f"""
PDF INFORMATION:
{relevant_text}

STUDENT QUESTION:
{question}

Answer only from the supplied PDF information.
"""
            }
        ],
        options={"temperature": 0}
    )

    return response.message.content


def generate_pdf_topics(pdf_text: str) -> str:
    response = chat(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": """
You identify important study topics from academic documents.
Use ONLY the supplied PDF text.
Do not invent topics or add outside information.
Return up to 8 topics supported by the document.
Explain each topic briefly using only the document.
Use a numbered Markdown list.
"""
            },
            {
                "role": "user",
                "content": f"Identify important topics from this PDF:\n\n{pdf_text[:30000]}"
            }
        ],
        options={"temperature": 0}
    )

    return response.message.content


def generate_pdf_questions(pdf_text: str) -> str:
    response = chat(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": """
You create study questions from academic documents.
Use ONLY the supplied PDF text.
Do not require outside knowledge.
Create up to 8 useful questions.
Prefer a mix of definition, explanation and short-answer questions.
Do not invent facts.
Return a numbered Markdown list.
"""
            },
            {
                "role": "user",
                "content": f"Create important study questions from this PDF:\n\n{pdf_text[:30000]}"
            }
        ],
        options={"temperature": 0}
    )

    return response.message.content