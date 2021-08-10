FROM node:16-buster
WORKDIR /opt/app/
COPY app/package.json app/package-lock.json ./
RUN npm ci
COPY app/ ./
RUN npm run build
CMD ["npm", "start"]
