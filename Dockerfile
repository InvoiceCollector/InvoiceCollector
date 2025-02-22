# Use the official node image as the base image
FROM node:22
RUN npm config set registry https://registry.npmjs.org/
RUN npm cache clean --force

# Install necessary dependencies for running Chrome
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    apt-transport-https \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] https://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

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
    #&& sed -i 's/let \[page\] = await browser.pages();/let page = await browser.newPage();/g' node_modules/puppeteer-real-browser/lib/cjs/index.js

# Expose the port your app runs on
EXPOSE 8080

# Run the application
CMD ["npm", "run", "start"]
