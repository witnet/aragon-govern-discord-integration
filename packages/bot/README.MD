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

## Available bot commands

### Setup

```
!setup <dao_name> <role>
```

- `dao_name` Name of the deployed DAO that is going to be used.
- `role` Discord role of the users that can create proposals on the Discord channel.

### Proposal
Creates a proposal in the Discord Channel that users can react positively or negatively.

```
!proposal <deadline> <description>
```

- `deadline` Date in UTC with the following format `YYYY MM DD HH:MM:SS` that indicates when the voting time finishes.

- `description` Description of the proposal

## Usage

1. First, you can add this bot to your Discord server at the following link:

    ```https://discord.com/oauth2/authorize?client_id=803668148170784799&scope=bot```
    
2. Once you have added the bot to your server, you can run `!setup` it in the channel you want to start listening for proposals.
   
3. Users can create these proposals using the `!proposal` command, and the bot will read :thumbsup: and :thumbsdown: reactions.
   
4. When the proposal deadline is reached, users can't continue voting. Finally, the bot will create the witnet data request and it will deliver the data to the aragon DAO.
