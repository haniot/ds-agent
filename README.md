
# Data Sync Agent Service
[![License][license-image]][license-url] [![Node][node-image]][node-url] [![Travis][travis-image]][travis-url] [![Coverage][coverage-image]][coverage-url] [![Dependencies][dependencies-image]][dependencies-url] [![DependenciesDev][dependencies-dev-image]][dependencies-dev-url] [![Vulnerabilities][known-vulnerabilities-image]][known-vulnerabilities-url] [![Commit][last-commit-image]][last-commit-url] [![Releases][releases-image]][releases-url] [![Contributors][contributors-image]][contributors-url]  [![Swagger][swagger-image]][swagger-url] 

Microservice responsible for data synchronization of FitBit platform with HANIoT platform.

**Main features:**
- Fitbit access token management;
- Automatically sync Fitbit data:
  - Sleep
  - Physical Activity
  - Weight
  - Time Series: steps, distance, calories, active minutes (minutesFairlyActive + minutesVeryActive) and heart rate
- Publish sync data to a message channel;
- Fitbit access token revocation.
 
## Prerequisites
- [Node 13.0.0+](https://nodejs.org/en/download/)
- [ConnectionMongodb Server 4.0.0+](https://www.mongodb.com/download-center/community)
- [Redis Server 5.0.0+](https://redis.io/download)
- [RabbitMQ 3.8.0+](https://www.rabbitmq.com/download.html)

---

## Set the environment variables
The application settings are defined by environment variables. To define the settings, make a copy of the `.env.example` file, naming for `.env`. After that, open and edit the settings as needed. The following environments variables are available:

| VARIABLE | DESCRIPTION  | DEFAULT |
|-----|-----|-----|
| `NODE_ENV` | Defines the environment in which the application runs. You can set: `test` _(in this environment, the database defined in `MONGODB_URI_TEST` is used and the logs are disabled for better visualization of the test output)_, `development` _(in this environment, all log levels are enabled)_ and `production` _(in this environment, only the warning and error logs are enabled)_. | `development` |
| `PORT_HTTP` | Port used to listen for HTTP requests. Any request received on this port is redirected to the HTTPS port. | `9000` |
| `PORT_HTTPS` | Port used to listen for HTTPS requests. Do not forget to provide the private key and the SSL/TLS certificate. See the topic [generate certificates](#generate-certificates). | `9001` |
| `SSL_KEY_PATH` | SSL/TLS certificate private key. | `.certs/server.key` |
| `SSL_CERT_PATH` | SSL/TLS certificate. | `.certs/server.crt` |
| `MONGODB_URI` | Database connection URI used if the application is running in development or production environment. The [URI specifications ](https://docs.mongodb.com/manual/reference/connection-string) defined by MongoDB are accepted. For example: `mongodb://user:pass@host:port/database?options`. | `mongodb://127.0.0.1:27017`<br/>`/ds-agent` |
| `MONGODB_URI_TEST` | Database connection URI used if the application is running in test environment. The [URI specifications ](https://docs.mongodb.com/manual/reference/connection-string) defined by MongoDB are accepted. For example: `mongodb://user:pass@host:port/database?options`. | `mongodb://127.0.0.1:27017`<br/>`/ds-agent-test` |
| `MONGODB_ENABLE_TLS` | Enables/Disables connection to TLS. When TLS is used for connection, client certificates are required (`MONGODB_KEY_PATH`, `MONGODB_CA_PATH`). | `false` |
| `MONGODB_KEY_PATH` | Client certificate and key in .pem format to connect to MongoDB | `.certs/mongodb/client.pem` |
| `MONGODB_CA_PATH` | MongoDB Certificate of the Authentication entity (CA) | `.certs/mongodb/ca.pem` |
| `REDIS_URI` | Redis database connection URI. Using for sync jobs. | `redis://127.0.0.1:6379` |
| `RABBITMQ_URI` | URI for connection to RabbitMQ. The [URI specifications ](https://www.rabbitmq.com/uri-spec.html). For example: `amqp://user:pass@host:port/vhost`. When TLS is used for connection the protocol is amqps and client certificates are required (`RABBITMQ_CERT_PATH`, `RABBITMQ_KEY_PATH`, `RABBITMQ_CA_PATH`) | `amqp://guest:guest`<br/>`@127.0.0.1:5672` |
| `RABBITMQ_CERT_PATH` | RabbitMQ Certificate | `.certs/rabbitmq/cert.pem` |
| `RABBITMQ_KEY_PATH` | RabbitMQ Key | `.certs/rabbitmq/key.pem` |
| `RABBITMQ_CA_PATH` | RabbitMQ Certificate of the Authentication entity (CA). | `.certs/rabbitmq/ca.pem` |
| `FITBIT_CLIENT_ID` | Client Id for Fitbit Application responsible to manage user data. | `CLIENT_ID_HERE` |
| `FITBIT_CLIENT_SECRET` | Client Secret for Fitbit Application responsible to manage user data. | `CLIENT_SECRET_HERE` |
| `EXPRESSION_AUTO_SYNC` | Defines how often the application will automatically sync user data in the background according to the crontab expression. | `0 0 * * 0` |
| `EXPRESSION_INACTIVE_USERS` | Defines how often the application will automatically look for inactive users to invalidate them in the background according to the crontab expression. | `0 * * * *` |
| `DAYS_INACTIVE_USERS` | Number of days used to invalidate Fitbit access for an inactive user. | `14` |

## Generate Certificates
For development and testing environments the easiest and fastest way is to generate your own self-signed certificates. These certificates can be used to encrypt data as well as certificates signed by a CA, but users will receive a warning that the certificate is not trusted for their computer or browser. Therefore, self-signed certificates should only be used in non-production environments, that is, development and testing environments. To do this, run the `create-self-signed-certs.sh` script in the root of the repository.
```sh
chmod +x ./create-self-signed-certs.sh
./create-self-signed-certs.sh
```
The following files will be created: `ca.crt`, `server.crt` and `server.key`.

In production environments its highly recommended to always use valid certificates and provided by a certificate authority (CA). A good option is [Let's Encrypt](https://letsencrypt.org)  which is a CA that provides  free certificates. The service is provided by the Internet Security Research Group (ISRG). The process to obtain the certificate is extremely simple, as it is only required to provide a valid domain and prove control over it. With Let's Encrypt, you do this by using [software](https://certbot.eff.org/) that uses the ACME protocol, which typically runs on your host. If you prefer, you can use the service provided by the [SSL For Free](https://www.sslforfree.com/)  website and follow the walkthrough. The service is free because the certificates are provided by Let's Encrypt, and it makes the process of obtaining the certificates less painful.


## Installation and Execution
#### 1. Install dependencies  
```sh  
npm install    
```
 
#### 2. Build  
Build the project. The build artifacts will be stored in the `dist/` directory.  
```sh  
npm run build    
```

#### 3. Run Server  
```sh  
npm start
```
Build the project and initialize the microservice. **Useful for production/deployment.**  
```sh  
npm run build && npm start
```
## Running the tests

#### All tests  
Run unit testing, integration and coverage by [Mocha](https://mochajs.org/) and [Instanbul](https://istanbul.js.org/).  
```sh  
npm test
```

#### Unit test
```sh  
npm run test:unit
```
  
#### Integration test
```sh  
npm run test:integration
```

#### Coverage  test
```sh  
npm run test:cov
```
Navigate to the `coverage` directory and open the `index.html` file in the browser to see the result. Some statistics are also displayed in the terminal.

### Generating code documentation  
```sh  
npm run build:doc
```
The html documentation will be generated in the /docs directory by [typedoc](https://typedoc.org/).

## Using Docker  
In the Docker Hub, you can find the image of the most recent version of this repository. With this image it is easy to create your own containers.
```sh
docker run haniot/ds-agent
```
This command will download the latest image and create a container with the default settings.

You can also create the container by passing the settings that are desired by the environment variables. The supported settings are the same as those defined in ["Set the environment variables"](#set-the-environment-variables). See the following example:
```sh
docker run --rm \
  -e PORT_HTTP=9000 \
  -e PORT_HTTPS=9001 \
  -v $(pwd)/.certs:/etc \  
  -e SSL_KEY_PATH=.certs/server.key \
  -e SSL_CERT_PATH=.certs/server.crt \  
  -e MONGODB_ENABLE_TLS=false \
  -e MONGODB_URI="mongodb://HOSTNAME:27017/haniot-ds-agent" \
  -e RABBITMQ_URI="amqp://guest:guest@HOSTNAME:5672" \  
  -e REDIS_URI="redis://HOSTNAME:6379" \
  -e FITBIT_CLIENT_ID="YOUR_FITBIT_CLIENT_ID" \
  -e FITBIT_CLIENT_SECRET="YOUR_FITBIT_CLIENT_SECRET" \
  -e EXPRESSION_AUTO_SYNC="0 0 * * 0" \
  -e EXPRESSION_INACTIVE_USERS="0 * * * *" \
  -e DAYS_INACTIVE_USERS="14" \
  --name haniot-ds-agent \     
  haniot/ds-agent-service
```
If the ConnectionMongodb or RabbitMQ instance is in the host local, add the `--net=host` statement when creating the container, this will cause the docker container to communicate with its local host.
```sh
docker run --rm \
  --net=host \
  ...
```
To generate your own docker image, run the following command:
```sh
docker build -t image_name:tag .
```
-------

### Fitbit Client Errors Published in Message Bus
This microservice has a particular way of managing errors from the Fitbit Client, which is responsible for communicating with the Fitbit Server to interact with platform user data. When an error is generated by the client, it is published to the message channel with the following structure:
```
{
    "user_id": "5a62be07de34500146d9c544",
    "error": {
        "code": 1581, 
        "message": "The message is here", 
        "description": "The description is here"   
    }
}
```
The `code` parameter is an internal implementation of the API, which serves to map the generated errors. The following table illustrates the mapping of these errors as implemented in the API:

| code |  reference | message  | description |
|-----|-----|-----|-----|
|1011|  Expired Access Token | Access token expired. | The access token has been expired and needs to be refreshed. | 
|1012|  Invalid Access Token | Access token invalid. | The access token is invalid. Please make a new Fitbit Auth Data request and try again. | 
|1021|  Invalid Refresh Token | Refresh token invalid. | The refresh token is invalid. Please make a new Fitbit Auth Data request and try again. | 
|1401|  Invalid Client Credentials | Invalid Fitbit Client data.| The Fitbit Client credentials are invalid. The operation cannot be performed. | 
|1429|  Too Many Requests | Data request limit for user has expired.  | Please wait a minimum of one hour and try make the operation again. | 
|1500|  Generic Error | The message from error. | The description from error. | 

[//]: # (These are reference links used in the body of this note.)
[license-image]: https://img.shields.io/badge/license-Apache%202-blue.svg
[license-url]: https://github.com/haniot/ds-agent/blob/master/LICENSE
[node-image]: https://img.shields.io/badge/node-%3E%3D%2012.0.0-brightgreen.svg
[node-url]: https://nodejs.org
[travis-image]: https://travis-ci.com/haniot/ds-agent.svg?branch=master
[travis-url]: https://travis-ci.com/haniot/ds-agent
[coverage-image]: https://coveralls.io/repos/github/haniot/ds-agent/badge.svg
[coverage-url]: https://coveralls.io/github/haniot/ds-agent?branch=master
[known-vulnerabilities-image]: https://snyk.io/test/github/haniot/ds-agent/badge.svg
[known-vulnerabilities-url]: https://snyk.io/test/github/haniot/ds-agent
[dependencies-image]: https://david-dm.org/haniot/ds-agent.svg
[dependencies-url]: https://david-dm.org/haniot/ds-agent
[dependencies-dev-image]: https://david-dm.org/haniot/ds-agent/dev-status.svg
[dependencies-dev-url]: https://david-dm.org/haniot/ds-agent?type=dev
[swagger-image]: https://img.shields.io/badge/swagger-v1-brightgreen.svg
[swagger-url]: https://app.swaggerhub.com/apis-docs/nutes.haniot/ds-agent/v1
[last-commit-image]: https://img.shields.io/github/last-commit/haniot/ds-agent.svg
[last-commit-url]: https://github.com/haniot/ds-agent/commits
[releases-image]: https://img.shields.io/github/release-date/haniot/ds-agent.svg
[releases-url]: https://github.com/haniot/ds-agent/releases
[contributors-image]: https://img.shields.io/github/contributors/haniot/ds-agent.svg
[contributors-url]: https://github.com/haniot/ds-agent/graphs/contributors
