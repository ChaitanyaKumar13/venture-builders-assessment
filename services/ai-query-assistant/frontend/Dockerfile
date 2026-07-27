FROM node:20-alpine
WORKDIR /app

# NEXT_PUBLIC_* must be present at build time (Next inlines it into the bundle).
ARG NEXT_PUBLIC_API_URL=http://localhost:4001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
