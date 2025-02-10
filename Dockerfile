# Use the official node image as the base image
FROM node:22

# Install necessary dependencies for running Chrome
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    apt-transport-https \
    chromium \
    chromium-driver \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

ENV CHROME_BIN=/usr/bin/chromium

# Set the working directory in the container
WORKDIR /usr/app/

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install Node.js dependencies
RUN npm update
RUN npm install

# Copy the rest of the application code
COPY tsconfig.json ./tsconfig.json
COPY src/ ./src/
COPY views/ ./views/
COPY test/ ./test/
COPY locales/ ./locales/
RUN mkdir media/ log/

# Expose the port your app runs on
EXPOSE 8080

# Run the application
CMD ["npm", "run", "start"]
