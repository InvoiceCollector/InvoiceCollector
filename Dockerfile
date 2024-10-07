# Use the official puppeteer image as the base image
FROM ghcr.io/puppeteer/puppeteer:23.5.1

# Set the working directory in the container
WORKDIR /usr/app

# Copy necessary files and folder to the working directory
COPY package*.json .
COPY src/ ./src/
COPY collectors/ ./collectors/
COPY test/ ./test/
RUN mkdir media/ log/

# Install dependencies
RUN npm install

# Expose the port your app runs on
EXPOSE 8080

# Command to run your application
CMD ["npm", "run", "start"]
