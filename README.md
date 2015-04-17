# NodeProject

## This is a One-Side Application which enables you to bet against your friends

Project for TUM Javascript Technology Seminar 2015
## Installation

Installation der dependencies

```
    npm install
```


## Execution

### Start Fake Server
To start the fake server which delivers events call

```
    node fake-server.js
```

This server is executed on port 3001 by default

You can start a new game with
```
    HTTP GET localhost:3001/api/startMatch?lengthMatch=GAME_LENGTH_IN_SECONDS
```

### Start Application Server
Real Server 

```
    node server.js
```