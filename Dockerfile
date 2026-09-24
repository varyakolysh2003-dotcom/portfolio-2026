FROM node:22-alpine
WORKDIR /app
COPY scripts/counter-server.mjs ./scripts/counter-server.mjs
COPY scripts/readers-redis.mjs ./scripts/readers-redis.mjs
ENV PORT=3000
EXPOSE 3000
USER node
CMD ["node", "scripts/counter-server.mjs"]
