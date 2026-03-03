# Stage 1: Build frontend
FROM node:20-slim AS frontend-build
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --ignore-scripts
COPY frontend/ ./
RUN npm run build

# Stage 2: Install Python dependencies
FROM python:3.14-slim AS backend-deps
WORKDIR /build
COPY backend/pyproject.toml ./
RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir . 

# Stage 3: Runtime
FROM python:3.14-slim
WORKDIR /app

COPY --from=backend-deps /opt/venv /opt/venv
COPY --from=frontend-build /build/dist /app/static
COPY backend/app /app/app

ENV PATH="/opt/venv/bin:$PATH"
ENV FRAMORY_PHOTO_ROOT=/photos
ENV FRAMORY_DB_PATH=/data/framory.db
ENV FRAMORY_CACHE_PATH=/data/cache

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
