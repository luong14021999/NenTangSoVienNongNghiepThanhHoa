# Dịch vụ BLAST+ nội bộ (M3.2.4). Xem services/blast/README.md.
FROM node:20-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends ncbi-blast+ \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY server.mjs ./
RUN mkdir -p /data && chown node:node /data
USER node

ENV PORT=8088 DATA_DIR=/data
EXPOSE 8088
VOLUME ["/data"]
HEALTHCHECK --interval=60s --timeout=10s CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.mjs"]
