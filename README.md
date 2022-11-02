# Download Jira attachment

Download all issue attachments in Jira project

## Prerequisites

Make sure these steps done firstly:

- Install dependencies by running this command from the root project directory:

  ```
  yarn install
  ```

- Copy `.env.example` and rename to `.env` then update values

It's ready!

## Run

In the root project directory, run:

```
yarn start
```

The attachments will be downloaded to `jira-attachments` directory (default) in this project or the directory you provided in `.env`
