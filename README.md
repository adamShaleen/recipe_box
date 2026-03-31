# Recipe Box

A mobile-first web application for browsing and AI-modifying cooking recipes. Select a base recipe, adjust ingredients and dietary preferences through structured UI controls, and get an AI-generated modified recipe powered by Amazon Bedrock and RAG.

## How It Works

1. **Browse** — Filter and explore a curated collection of seeded recipes by cuisine, protein, dietary tags, or category.
2. **Select** — Tap a recipe to view its full ingredients, steps, and details.
3. **Modify** — Toggle ingredients on/off, swap items, adjust servings, apply dietary filters (keto, vegan, gluten-free, etc.), or shift the cuisine style — all through buttons, chips, sliders, and dropdowns. No typing required.
4. **Generate** — The app retrieves relevant techniques and ingredients from other recipes in the collection (RAG), then sends everything to Claude Haiku on Bedrock to produce a coherent modified recipe.

## Architecture Overview

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────────┐
│  React SPA  │──────▶│  API Gateway     │──────▶│  Lambda         │
│  (Vercel)   │◀──────│  + API Key Auth  │◀──────│  (Node.js 20)   │
└─────────────┘       └──────────────────┘       └────────┬────────┘
                                                          │
                                          ┌───────────────┼───────────────┐
                                          ▼               ▼               ▼
                                   ┌────────────┐  ┌───────────┐  ┌───────────┐
                                   │  DynamoDB   │  │  S3       │  │  Bedrock  │
                                   │  (recipes)  │  │  (FAISS)  │  │  (Haiku + │
                                   └────────────┘  └───────────┘  │  Titan)   │
                                                                  └───────────┘
```

- **Frontend:** React + TypeScript SPA built with Vite, deployed to Vercel
- **API:** REST API via API Gateway, backed by Lambda handlers
- **Data:** DynamoDB single-table design for recipe storage and metadata
- **Vector Search:** FAISS index stored in S3, loaded into Lambda for similarity search during recipe modification
- **AI:** Titan Embeddings for vectorization, Claude Haiku for recipe generation
- **Auth:** API key passed in `x-api-key` header, validated in Lambda middleware

## Prerequisites

- **Node.js** 20.x or later
- **npm** 9+ (ships with Node 20)
- **AWS CLI** configured with credentials that have permissions for CDK deployment
- **AWS CDK CLI** (`npm install -g aws-cdk`)
- **Amazon Bedrock model access** enabled in your AWS account for:
  - `anthropic.claude-3-haiku-20240307-v1:0`
  - `amazon.titan-embed-text-v1`
- **Vercel account** for frontend hosting
- **Vercel CLI** (`npm install -g vercel`)

## Project Structure

```
recipe-box/
├── packages/
│   ├── shared/       # Shared TypeScript types, constants, recipe schema
│   ├── infra/        # AWS CDK infrastructure stack
│   ├── api/          # Lambda handler code and services
│   └── web/          # React frontend (Vite)
├── data/
│   └── recipes.json  # Seed recipe collection
├── CLAUDE.md         # AI assistant project context
└── README.md
```

This is an npm workspaces monorepo. All packages share a common TypeScript config, ESLint config, and Prettier config from the root.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

This installs dependencies for all workspaces.

### 2. Build shared types

```bash
npm run build --workspace=packages/shared
```

### 3. Configure environment

Create a `.env` file in `packages/web/`:

```env
VITE_API_URL=<your API Gateway URL after deploy>
VITE_API_KEY=<your chosen API key>
```

Set the API key in AWS Systems Manager Parameter Store (or as a CDK context variable) before deploying:

```bash
aws ssm put-parameter \
  --name "/recipe-box/api-key" \
  --value "your-secret-api-key" \
  --type SecureString
```

### 4. Deploy AWS infrastructure

```bash
# Bootstrap CDK (first time only)
cd packages/infra
npx cdk bootstrap

# Deploy
npx cdk deploy
```

This deploys the DynamoDB table, S3 bucket, Lambda functions, API Gateway, and runs the seed custom resource to populate recipes and build the FAISS index.

### 5. Run the frontend locally

```bash
cd packages/web
npm run dev
```

The dev server starts at `http://localhost:5173`.

### 6. Deploy frontend to Vercel

```bash
cd packages/web
vercel --prod
```

Configure the environment variables (`VITE_API_URL`, `VITE_API_KEY`) in the Vercel dashboard.

## Development

### Available Scripts

From the repo root:

| Command                             | Description                        |
| ----------------------------------- | ---------------------------------- |
| `npm install`                       | Install all workspace dependencies |
| `npm run build --workspaces`        | Build all packages                 |
| `npm test --workspaces`             | Run all tests                      |
| `npm run lint --workspaces`         | Lint all packages                  |
| `npm run format:check --workspaces` | Check formatting                   |
| `npm run format --workspaces`       | Auto-fix formatting                |

From individual packages:

| Command           | Location         | Description                     |
| ----------------- | ---------------- | ------------------------------- |
| `npm run dev`     | `packages/web`   | Start Vite dev server           |
| `npm test`        | Any package      | Run Jest tests for that package |
| `npm run build`   | Any package      | Build that package              |
| `npx cdk deploy`  | `packages/infra` | Deploy AWS stack                |
| `npx cdk diff`    | `packages/infra` | Preview infrastructure changes  |
| `npx cdk destroy` | `packages/infra` | Tear down AWS stack             |

### Adding a New Recipe

Add the recipe to `data/recipes.json` following the schema defined in `packages/shared/src/types/recipe.ts`, then redeploy the infrastructure to re-run the seed process:

```bash
cd packages/infra && npx cdk deploy
```

The seed process is idempotent — existing recipes are skipped and only new entries are written to DynamoDB and indexed in FAISS.

### Testing

All tests use Jest with `ts-jest`. AWS SDK calls are mocked with `aws-sdk-client-mock`. React components are tested with `@testing-library/react`.

```bash
# Run all tests with coverage
npm test --workspaces -- --coverage

# Run tests for a specific package
npm test --workspace=packages/api

# Run a specific test file
npm test --workspace=packages/api -- --testPathPattern=modify-recipe
```

### Linting and Formatting

ESLint uses flat config with `@typescript-eslint`. Prettier handles formatting. Both are enforced from the root config.

```bash
# Lint with auto-fix
npm run lint --workspaces -- --fix

# Format all files
npm run format --workspaces
```

## Recipe Data Schema

Each recipe in `data/recipes.json` follows this structure:

```json
{
  "id": "chicken-parmesan",
  "name": "Chicken Parmesan",
  "description": "Classic Italian-American breaded chicken with marinara and melted mozzarella.",
  "cuisine": "italian",
  "protein": "chicken",
  "tags": ["comfort-food", "baked", "cheese"],
  "servings": 4,
  "prepTimeMinutes": 20,
  "cookTimeMinutes": 30,
  "ingredients": [
    {
      "id": "ing-001",
      "name": "chicken breast",
      "amount": 4,
      "unit": "pieces",
      "category": "protein",
      "swappable": true
    }
  ],
  "steps": [
    {
      "order": 1,
      "instruction": "Preheat oven to 425°F.",
      "durationMinutes": null
    }
  ]
}
```

Key fields for the modification UI:

- `ingredients[].category` — Groups ingredients for UI sections (protein, produce, dairy, pantry, seasoning)
- `ingredients[].swappable` — Controls whether the swap dropdown appears for that ingredient
- `tags` — Used for browsing/filtering and as metadata for embeddings

## Modification Flow (Technical Detail)

When the user taps "Generate Modified Recipe":

1. **Prompt construction:** `prompt.service.ts` converts the `ModificationRequest` (structured data from UI controls) into natural language describing what changes the user wants.
2. **Embedding:** The constructed modification description is embedded via Titan Embeddings.
3. **RAG retrieval:** The embedding is searched against the FAISS index to find the top-K most relevant recipe chunks (techniques, ingredient combinations, preparation methods from other recipes).
4. **Generation:** A prompt is assembled containing the original recipe, retrieved context, and the modification instructions, then sent to Claude Haiku.
5. **Response:** Haiku returns a complete modified recipe which is parsed and returned to the frontend in the standard recipe format.

## Cost Estimates

For a personal/low-traffic app:

| Service               | Free Tier                  | Estimated Monthly Cost        |
| --------------------- | -------------------------- | ----------------------------- |
| DynamoDB              | 25 GB, 25 RCU/WCU          | $0                            |
| Lambda                | 1M requests, 400K GB-sec   | $0                            |
| API Gateway           | 1M calls (first 12 months) | $0                            |
| S3                    | 5 GB, 20K GET requests     | $0                            |
| Bedrock (Haiku)       | Pay per token              | ~$0.50-2.00 with moderate use |
| Bedrock (Titan Embed) | Pay per token              | <$0.01 (seed only)            |
| **Total**             |                            | **~$0.50-2.00/month**         |

Bedrock has no free tier, but Haiku is extremely cheap. A single recipe modification costs roughly $0.001-0.005 in tokens.

## License

Private project — not licensed for distribution.
