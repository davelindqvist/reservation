ARG NODE_VERSION=21.6.2

FROM node:${NODE_VERSION}-alpine

ENV NODE_ENV production \
    NODE_PATH=./build

WORKDIR /home/node/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 8000

CMD ["node", "run", "start"]
