FROM node:8.12.0

RUN mkdir /service

WORKDIR /service

COPY . .
RUN ls -la
RUN npm install

# RUN node index

EXPOSE 8080