FROM node:14-alpine3.15

WORKDIR "/usr/app"

COPY ./package.json ./

RUN npm install

COPY . .

ENTRYPOINT ["node", "src/index.js"]
