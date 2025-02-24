# Use an official Node.js image
FROM node:22-alpine

# Create /app directory
RUN mkdir -p /opt/app

# Set the working directory
WORKDIR /opt/app

# Copy package.json and package-lock.json first to leverage caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port (should match your app's port)
EXPOSE 4000

# Start the app
CMD ["npm", "start"]