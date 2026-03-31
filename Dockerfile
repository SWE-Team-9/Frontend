FROM node:20

WORKDIR /app

# 1. Copy package files (this grabs both package.json and package-lock.json)
COPY my-app/package*.json ./

# 2. Install dependencies using standard npm
RUN npm install

# 3. Copy the rest of your source code
COPY my-app/ .

# 4. Build the Next.js application for production
RUN npm run build

# 5. Tell Node.js to run in highly optimized production mode
ENV NODE_ENV=production

EXPOSE 3000

# 6. Start the production server
CMD ["npm", "run", "start"]