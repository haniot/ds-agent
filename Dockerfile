FROM node:12.13.1

# Create app directory
RUN mkdir -p /usr/src/ds
WORKDIR /usr/src/ds

# Install app dependencies
COPY package.json /usr/src/ds/
RUN npm install

# Copy app source
COPY . /usr/src/ds

# Build app
RUN npm run build

EXPOSE 9000
EXPOSE 9001

CMD ["npm", "start"]
