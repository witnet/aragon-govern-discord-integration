# :wrench: This is still under development :wrench:

# aragon-govern-discord-integration

Enables voting on Aragon Govern using Discord reactions. Powered by Witnet.

This repository uses lerna as a monorepo tool. Currently, there are two packages:

- Bot. Contains the logic for Aragon's discord bot.

- Server. It initialize the bot and behaves as API middleware to retrieve data.## Install dependencies of all packages.

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

Remove depdencies and compiled code

```sh
  yarn clean 
```

### Release a new version

This repository uses [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) and updates CHANGELOG file running the following command:

```sh
  lerna version --conventional-commits
```
