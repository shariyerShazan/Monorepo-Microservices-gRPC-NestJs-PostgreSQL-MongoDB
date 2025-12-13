FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm install
RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 50052

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
