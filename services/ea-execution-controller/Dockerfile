FROM node:22-bookworm-slim AS base
ARG OPA_VERSION=1.8.0
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
  && curl -L -o /usr/local/bin/opa "https://openpolicyagent.org/downloads/v${OPA_VERSION}/opa_linux_amd64_static" \
  && chmod +x /usr/local/bin/opa \
  && opa version \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
COPY policy ./policy
RUN npm run build && opa test policy
CMD ["npm", "run", "start"]
