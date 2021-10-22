FROM node:14-alpine
RUN apk --no-cache add bash curl grep tzdata

# Create app directory
RUN mkdir -p /usr/src/ds
WORKDIR /usr/src/ds

# Install app dependencies
COPY package.json package-lock.json /usr/src/ds/
RUN npm install

# Copy app source
COPY . /usr/src/ds

# Build app
RUN npm run build

EXPOSE 9000
EXPOSE 9001

CMD ["npm", "start"]
