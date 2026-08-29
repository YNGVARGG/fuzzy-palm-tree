# The agent — a Pipecat voice bot (Twilio transport).
# Modeled on the official PhoneLLM example's Dockerfile (see reference/phonellm/).
#
# NOTE: if dailyco/pipecat-base is unreachable from your VPS, fall back to:
#   FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim
#   RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
FROM dailyco/pipecat-base:latest

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy from the cache instead of linking since it's a mounted volume
ENV UV_LINK_MODE=copy

WORKDIR /app

# Install the project's dependencies (uv creates uv.lock on first build)
COPY pyproject.toml ./
RUN --mount=type=cache,target=/root/.cache/uv     uv sync --no-install-project --no-dev

# Copy the application code
COPY phone_agent.py tenant.py business_context.py business_tools.py ./
COPY tenants ./tenants

# Serve inbound calls from Twilio by default (override with docker compose run)
CMD ["uv", "run", "phone_agent.py", "-t", "twilio"]
