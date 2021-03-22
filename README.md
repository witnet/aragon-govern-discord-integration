# :wrench: This is still under development :wrench:

# aragon-govern-discord-integration

Enables voting on Aragon Govern using Discord reactions. Powered by [Witnet](https://www.witnet.io/).

This repository uses lerna as a monorepo tool. Currently, there are two packages:

- [Bot]: contains the logic for Aragon's conversational discord bot.
- [Server]: acts as a middleware to read message reactions from the Discord API, and then publish the results through a public REST API.

## Available commands

### Install dependencies and build

```sh
yarn
yarn bootstrap
```

### Run tests

```sh
yarn test
```

### Run linter

```sh
yarn lint
```

### Run clean

Remove dependencies and compiled code.

```sh
yarn clean 
```

### Release a new version

This repository uses [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) and updates CHANGELOG file running the following command:

```sh
lerna version --conventional-commits
```

[Bot]: packages/bot
[Server]: packages/server