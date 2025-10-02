# Use the stable Ubuntu base image
FROM ubuntu:focal

# --- Install Dependencies ---
# Update packages and install curl (needed to get NodeSource)
RUN apt-get update && apt-get install -y curl

# Install Node.js 20.x from NodeSource
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get upgrade -y \
    && apt-get install -y nodejs

# Install Git for repository cloning
RUN apt-get install git -y

# --- Setup Application ---
# Set the working directory inside the container
WORKDIR /home/app

# Copy application files (main.sh must be in LF format!)
COPY main.sh main.sh
COPY script.js script.js
COPY package*.json .

# Install Node dependencies (AWS SDK, ioredis, mime-types)
RUN npm install

# Ensure scripts are executable (optional, but good practice)
RUN chmod +x main.sh
RUN chmod +x script.js

# Use the explicit bash path determined from diagnostics, running the main script.
ENTRYPOINT [ "/usr/bin/bash", "/home/app/main.sh" ]