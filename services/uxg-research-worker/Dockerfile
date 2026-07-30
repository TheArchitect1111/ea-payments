# UXG Research Worker — Crawl4AI sidecar (NOT bundled into Vercel)
FROM unclecode/crawl4ai:0.6.0-r1

WORKDIR /app

USER root
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY app /app/app
COPY schemas /app/schemas

ENV PYTHONUNBUFFERED=1 \
    UXG_RESEARCH_MAX_PAGES=12 \
    UXG_RESEARCH_MAX_DEPTH=2 \
    UXG_RESEARCH_JOB_TIMEOUT_SEC=120 \
    PORT=8080

EXPOSE 8080

# Token must be provided at runtime — refuse empty in app startup for /v1/crawl
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
