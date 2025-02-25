# Use an official Puppeteer image
FROM ghcr.io/puppeteer/puppeteer:24.2.0

# Temporarily switch to root user to install packages
USER root

# Install Google Chrome manually
RUN apt-get update && apt-get install -y wget curl unzip \
    && wget -q -O /tmp/google-chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && dpkg -i /tmp/google-chrome.deb || apt-get install -fy \
    && rm /tmp/google-chrome.deb \
    && apt-get clean

# Switch back to non-root user (pptruser)
USER pptruser

# Set Puppeteer to use installed Chrome
ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/google-chrome-stable"

# Set the working directory
WORKDIR /usr/src/app

# Set user permissions
RUN mkdir -p /usr/src/app && chown -R pptruser:pptruser /usr/src/app

# Copy package.json and package-lock.json first
COPY --chown=pptruser:pptruser package*.json ./

# Install dependencies
RUN npm install --unsafe-perm

# Copy the rest of the application
COPY --chown=pptruser:pptruser . .

# Expose the application port
EXPOSE 4000

# Start the app
CMD ["npm", "start"]
