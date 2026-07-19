# Use a lightweight base image for now as a placeholder
FROM alpine:latest

# =======================================================================
# PARTICIPANT TODO: Replace this with your actual backend Dockerfile!
# =======================================================================
# You are free to use ANY backend language or framework (Node.js, Python, Java, Go, etc.).
# There are no specifications on the tech stack. Just ensure that your server starts
# and exposes the port you defined in your docker-compose.yml.
#
# --- Example 1: Node.js (Express/NestJS/Fastify) ---
# FROM node:20-alpine
# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .
# EXPOSE 3000
# CMD ["node", "index.js"]
#
# --- Example 2: Python (FastAPI/Flask/Django) ---
# FROM python:3.11-slim
# WORKDIR /app
# COPY requirements.txt .
# RUN pip install -r requirements.txt
# COPY . .
# EXPOSE 8000
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
#
# --- Example 3: Go ---
# FROM golang:1.21-alpine
# WORKDIR /app
# COPY . .
# RUN go build -o main .
# EXPOSE 8080
# CMD ["./main"]

# This is just a placeholder command to keep the container running for now
CMD ["echo", "Backend not implemented yet. Please update backend/Dockerfile!"] && tail -f /dev/null
