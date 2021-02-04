FROM node:current-alpine3.12

# Read the GitHub API token and release version from --build-arg
ARG GITHUB_API_TOKEN
ARG VERSION

# Install dependencies not included in the base image
RUN apk update
RUN apk upgrade
RUN apk --no-cache add bash ca-certificates curl

# Update CA certificates
RUN update-ca-certificates

# Check out latest release of this repository
RUN mkdir /data
COPY . /data
RUN chmod +x /data/downloader.sh
RUN /data/downloader.sh

# Navigate to the nodejs root package, install dependencies and build the project
WORKDIR /data/source
RUN npm install yarn
RUN yarn
RUN node ./node_modules/.bin/lerna bootstrap
RUN yarn build

# Set the entrypoint and main command
# Runs the bot by default, but CMD can be overriden when running a container so it runs the reactions monitor server
ENTRYPOINT ["node"]
CMD ["./packages/bot/dist/index.js"]