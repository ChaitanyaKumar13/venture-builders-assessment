FROM node:20-alpine
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:4003
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3002
CMD ["npm", "start"]
