# @adi/server

Return a JSON object with the number of positive and negative reactions.

## Setup

To run this bot, you have to create a `.env` file next to `.env_example` with the necessary secrets to run the bot

## Example call

```sh
  curl localhost:3000?channel_id=123456&message_id=123456
```

## Available commands

### start

Run compiled code starting the server. It listens on `:3000` by default.

```sh
  yarn start
```

### dev

Build the code and run it to start the server on `:3000` by default.

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
