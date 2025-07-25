# LinkedIn Leaderboard API

This is a Next.js application that provides an API for generating a "Top Fans" leaderboard for a given LinkedIn profile.

## How it works

The API endpoint at `/api/leaderboard` accepts a POST request with a LinkedIn profile URL and a number of days. It then uses a third-party API (via RapidAPI) to fetch all the posts, reactions, comments, and reposts for that profile within the specified timeframe. It then calculates a score for each person who engaged with the content and returns a ranked leaderboard.

## Deployment

This project is designed for easy deployment to [Vercel](https://vercel.com/).

### 1. Push to a Git Repository

Deploying to Vercel requires your project to be in a Git repository (GitHub, GitLab, or Bitbucket).

### 2. Import to Vercel

1.  Sign up for a Vercel account.
2.  From your dashboard, click "Add New... > Project".
3.  Import the Git repository for this project.
4.  Vercel will automatically detect that this is a Next.js project and configure the build settings.

### 3. Configure Environment Variables

The application requires a `RAPIDAPI_KEY` to function.

1.  In your Vercel project, go to "Settings" > "Environment Variables".
2.  Add a new environment variable:
    *   **Name:** `RAPIDAPI_KEY`
    *   **Value:** Your RapidAPI key for the LinkedIn API.

### 4. Deploy

Click the "Deploy" button. Vercel will build and deploy your application.

## API Usage

Once deployed, you can make a POST request to the `/api/leaderboard` endpoint.

**URL:** `https://your-project-name.vercel.app/api/leaderboard`

**Method:** `POST`

**Headers:**

*   `Content-Type: application/json`

**Body (raw JSON):**

```json
{
  "LinkedinURL": "https://www.linkedin.com/in/username",
  "days": 30
}
```

### Example `curl` request:

```bash
curl -X POST \
  https://your-project-name.vercel.app/api/leaderboard \
  -H 'Content-Type: application/json' \
  -d '{
    "LinkedinURL": "https://www.linkedin.com/in/username",
    "days": 30
  }'
```

Replace `your-project-name.vercel.app` with your actual Vercel deployment URL. 