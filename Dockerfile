FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

COPY backend/requirements.txt /app/backend/requirements.txt

RUN pip install --no-cache-dir -r /app/backend/requirements.txt

COPY backend /app/backend
COPY industrial_lab /app/industrial_lab
COPY scripts /app/scripts

RUN chmod +x /app/scripts/production-start.sh

EXPOSE 8000

CMD ["/app/scripts/production-start.sh"]
