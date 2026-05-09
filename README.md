# sidebridge-yamabico

This is a Side Bridge server running on Node.js created for testing the Side Bridge Protocol for [Side Search](https://github.com/Cizzuk/Side-Search).

This Bridge does not have connections to any other assistants. It simply appends "..." to the user's message and returns the response.

*Also, this is my TypeScript practice project.*

## Usage

### Build

```bash
npm run build
```

### Start Bridge

```bash
npm run start
```

When there is a request from Side Search while the server is running, Bridge returns a response. The request and response bodies are displayed in the console.

## Config

There is a constant in main.ts for modifying the Bridge test configuration.
