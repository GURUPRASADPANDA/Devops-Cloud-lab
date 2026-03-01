FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    jq \
    openssh-client \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
    ansible==9.3.0 \
    boto3 \
    botocore

RUN ansible-galaxy collection install \
    community.docker \
    community.general \
    ansible.posix

WORKDIR /workspace/ansible

HEALTHCHECK --interval=30s --timeout=5s \
  CMD ansible --version || exit 1
