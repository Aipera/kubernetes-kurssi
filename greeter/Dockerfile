FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node app.js ./
USER node
CMD ["node", "app.js"]
