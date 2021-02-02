# @adi/bot

Contains the logic for Aragon's discord bot:

- Can listen for commands in a discord server.
- Can retrieve the reactions of a message in a channel.

## Setup

To run this bot, you have to create a `.env` file next to `.env_example` with the necessary secrets to run the bot

## Available commands

### start

Run compiled code creating a bot instance and starting listen to commands in the discord server

```sh
  yarn start
```

### dev:listen

Build the code and create a bot instance to listen to commands in the Discord server.

```sh
  yarn dev:listen 
```

### Run tests

```sh
  yarn test
```

### Clean

```sh
  yarn clean 
```

### Run linter

```sh
  yarn lint
```
