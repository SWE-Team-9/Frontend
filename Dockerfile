FROM node:20

RUN npm install -g pnpm

WORKDIR /app

COPY my-app/package.json my-app/pnpm-lock.yaml ./

RUN pnpm install

COPY my-app/ .

EXPOSE 3000

CMD ["pnpm", "run", "dev"]