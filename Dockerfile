FROM node:20-slim

# Install LibreOffice (for DOCX/PPTX/XLSX conversion) and ImageMagick (for images)
RUN apt-get update && apt-get install -y \
    libreoffice \
    imagemagick \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Ensure upload temp dir exists
RUN mkdir -p /tmp/liteparse-uploads

EXPOSE 3000
CMD ["node", "src/index.js"]
