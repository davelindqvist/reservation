ARG NODE_VERSION=21.6.2

FROM node:${NODE_VERSION}-alpine

WORKDIR /usr/src/app

COPY ["package.json", "package-lock.json", "tsconfig.json", ".env", "./"]

COPY ./src ./src

RUN npm install

CMD ["npm", "run", "dev"]
