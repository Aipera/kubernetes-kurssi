FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node controller.js ./
USER node
CMD ["node", "controller.js"]
