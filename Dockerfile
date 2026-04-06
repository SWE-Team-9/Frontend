FROM node:20

WORKDIR /app

# 1. Copy package files (this grabs both package.json and package-lock.json)
COPY my-app/package*.json ./

# 2. Install dependencies using standard npm
RUN npm install

# 3. Copy the rest of your source code
COPY my-app/ .

# --- NEW: Catch args and set env vars before the build ---
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY
# ---------------------------------------------------------

# 4. Build the Next.js application for production
RUN npm run build

# 5. Tell Node.js to run in highly optimized production mode
ENV NODE_ENV=production

EXPOSE 3000

# 6. Start the production server
CMD ["npm", "run", "start"]
