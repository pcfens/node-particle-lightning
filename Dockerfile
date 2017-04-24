FROM node:7.9-alpine

COPY . /app
WORKDIR /app
RUN npm install

EXPOSE 8080
ENTRYPOINT ["node", "app.js"]
