# HONC + Vector Search

This is a sample vector search app using Hono (api), Neon (postgres), Drizzle (orm), and Cloudflare workers (deployment).

We want to be able to preform semantic search across a set of recipe titles (in `data/recipe-titles.json`).

## Dev Commands

Install dependencies
```sh
npm install
```

Migrate database and create embeddings
```sh
# Set up the database
npm run db:generate
npm run db:migrate

# This calls the script in `embeddings/generate` to create embeddings
npm run db:seed
```

Run local development server
```sh
npm run dev
```

Deploy to production (needs cloudflare account)
```sh
npm run deploy

# Set your DATABASE_URL and OPENAI_API_KEY environment variables in the Cloudflare Workers dashboard
```

## Configuring Neon

You need your `DATABASE_URL` from the Neon dashboard, which you set as an environment variable in `.dev.vars`.

Alternatively, you can follow one of the scripts below. You'll need the `jq` command line utility to run these scripts.

### Create a new Database from the command line

```sh
# Authenticate with neon cli
neonctl auth

# Assuming you have a project with this name in neon
PROJECT_NAME=recipe-search-example

# Set project id because the call to `set-context` below needs it
PROJECT_ID=$(neonctl projects list --output=json | jq --arg name "$PROJECT_NAME" '.projects[] | select(.name == $name) | .id')

# Create a new database in your project
neonctl databases create --name=yum_yum --project-id=$PROJECT_ID

# Create a `dev` db branch then set context
BRANCH_NAME=dev
neonctl branches create --name=$BRANCH_NAME
neonctl set-context --project-id=$PROJECT_ID --branch=$BRANCH_NAME

# Finally, add connection string to .dev.vars
DATABASE_URL=$(neonctl connection-string)
echo -e '\nDATABASE_URL='$DATABASE_URL'\n' >> .dev.vars
```

### Create a new project from the command line

Install the neon CLI and follow this script (you'll need the `jq` command line utility). 

> **NOTE** You need to have a paid account to create more than one project. If you don't have a paid account, and you already set up your first Neon project, then this script might fail.

```sh
# Authenticate with neon cli
neonctl auth

# Create project if you haven't already
#
# > *skip this* if you already created a project,
# > and grab the DATABASE_URL from your dashboard
PROJECT_NAME=recipe-search-example
neonctl projects create --name $PROJECT_NAME --set-context

# Set project id because the call to `set-context` below needs it
PROJECT_ID=$(neonctl projects list --output=json | jq --arg name "$PROJECT_NAME" '.projects[] | select(.name == $name) | .id')

# Create a `dev` db branch then set context
BRANCH_NAME=dev
neonctl branches create --name=$BRANCH_NAME
neonctl set-context --project-id=$PROJECT_ID --branch=$BRANCH_NAME

# Finally, add connection string to .dev.vars
DATABASE_URL=$(neonctl connection-string)
echo -e '\nDATABASE_URL='$DATABASE_URL'\n' >> .dev.vars
```