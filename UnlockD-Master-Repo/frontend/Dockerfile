# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all other project files
COPY . .

# Expose Vite's default port
EXPOSE 5173

# Start Vite dev server on all network interfaces
CMD ["npm", "run", "dev", "--", "--host"]
