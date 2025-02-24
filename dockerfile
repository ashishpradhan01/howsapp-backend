# Use an official Node.js image
FROM node:22-alpine

# Install required dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Create /app directory
RUN mkdir -p /opt/app

# Set the working directory
WORKDIR /opt/app

# Copy package.json and package-lock.json first to leverage caching
COPY package.json package-lock.json ./

# Install dependencies (including Puppeteer)
RUN npm install

# Set Puppeteer to use system-installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium-browser"

# Copy the rest of the application
COPY . .

# Expose the application port
EXPOSE 4000

# Ensure Chromium runs correctly in a container
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Start the app
CMD ["npm", "start"]
