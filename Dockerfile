# Use the official node image as the base image
FROM node:22

# Set the working directory in the container
WORKDIR /usr/app

# Copy necessary files and folder to the working directory
COPY package*.json .
COPY tsconfig.json ./tsconfig.json
COPY src/ ./src/
COPY public/ ./public/
COPY test/ ./test/
RUN mkdir media/ log/

# Set puppeteer env variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium

# Install dependencies
RUN npm install

# Install Chromium manually
RUN apt-get update && apt-get install -y chromium

# Expose the port your app runs on
EXPOSE 8080
