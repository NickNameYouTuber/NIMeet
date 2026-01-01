FROM node:18-alpine

WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies (they will be hidden by the bind mount, but the 'node_modules' volume trick fixes that)
RUN npm install

# Copy source (also hidden by bind mount, but useful for image verification)
COPY . .

# Expose port
EXPOSE 5173

# Start the app
CMD ["npm", "run", "dev", "--", "--host"]
