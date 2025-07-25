# LinkedIn Leaderboard API

A Vercel-hosted web service that creates engagement leaderboards for LinkedIn creators by analyzing reactions, comments, and reposts on their posts within a specified timeframe.

## Features

- **Configurable Scoring**: Easily adjust point values for different engagement types
- **Comprehensive Data**: Aggregates reactions, comments, and reposts across all posts
- **Smart Pagination**: Automatically fetches all relevant posts within the specified timeframe
- **Error Resilience**: Continues processing even if some API calls fail
- **Rich Metadata**: Returns detailed analytics and aggregate statistics

## API Endpoint

**URL**: `POST /api/leaderboard`

### Request Body

```json
{
  "LinkedinURL": "https://www.linkedin.com/in/username",
  "days": 7
}
```

### Parameters

- `LinkedinURL` (string, required): LinkedIn profile URL in the format `https://www.linkedin.com/in/username`
- `days` (number, required): Number of days to look back for posts (must be positive)

### Response Format

```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "name": "John Doe",
        "profile url": "https://www.linkedin.com/in/johndoe",
        "display pic": "https://media.licdn.com/.../profile-photo.jpg",
        "reactions": 15,
        "comments": 3,
        "reposts": 2,
        "total engagement": 20,
        "total score": 20
      }
    ],
    "metadata": {
      "totalPeople": 50,
      "postsAnalyzed": 5,
      "aggregates": {
        "totalReactions": 245,
        "totalComments": 87,
        "totalReposts": 23,
        "totalEngagement": 355
      },
      "scoringConfig": {
        "reaction": 1,
        "comment": 1,
        "repost": 1
      },
      "requestInfo": {
        "linkedinUrl": "https://www.linkedin.com/in/username",
        "daysAnalyzed": 7,
        "processedAt": "2024-01-15T10:30:00.000Z"
      },
      "errors": null
    }
  }
}
```

## Setup and Deployment

### Prerequisites

- Node.js 18+ 
- Vercel account
- RapidAPI key for LinkedIn API access

### Environment Variables

Create a `.env.local` file (for local development) or configure environment variables in Vercel:

```
RAPIDAPI_KEY=your_rapidapi_key_here
```

### Local Development

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual API key
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Test the API**:
   ```bash
   curl -X POST http://localhost:3000/api/leaderboard \
     -H "Content-Type: application/json" \
     -d '{"LinkedinURL": "https://www.linkedin.com/in/username", "days": 7}'
   ```

### Vercel Deployment

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel**:
   ```bash
   vercel env add RAPIDAPI_KEY
   ```
   
   Or configure via the Vercel dashboard under Project Settings > Environment Variables.

4. **Deploy with environment variables**:
   ```bash
   vercel --prod
   ```

## Configuration

### Scoring Configuration

Modify `config/scoring.json` to adjust point values for different engagement types:

```json
{
  "scoring": {
    "reaction": 1,    // Points per reaction (like, love, etc.)
    "comment": 3,     // Points per comment
    "repost": 2       // Points per repost/share
  }
}
```

Changes to this file require a redeploy to take effect.

## API Integration

This service integrates with the LinkedIn API via RapidAPI and uses four endpoints:

1. **Profile Posts**: Gets all posts from a profile within the timeframe
2. **Post Reactions**: Gets all people who reacted to each post
3. **Post Comments**: Gets all people who commented on each post  
4. **Post Reposts**: Gets all people who reposted each post

## Error Handling

The API is designed to be resilient:

- **Partial Failures**: If some API calls fail, the service continues and returns partial results
- **No Data**: Returns empty leaderboard with appropriate messaging if no posts are found
- **Invalid Input**: Returns detailed validation errors for malformed requests
- **API Errors**: Returns meaningful error messages when LinkedIn API calls fail

## Response Codes

- `200`: Success (including empty results)
- `400`: Bad request (invalid parameters)
- `405`: Method not allowed (only POST is supported)
- `500`: Server error (API failures, configuration issues)

## Rate Limiting

The LinkedIn APIs have no rate limits according to the documentation, but the service includes built-in pagination handling to efficiently process large amounts of data.

## Limitations

- **LinkedIn API Scope**: Can only access publicly available engagement data
- **Historical Data**: Limited to posts within the last 30 days (LinkedIn API limitation)
- **Profile Pictures**: Comment API doesn't provide profile pictures, so some entries may have null display pics
- **Processing Time**: Large profiles with many posts may take longer to process

## Troubleshooting

### Common Issues

1. **Invalid LinkedIn URL**: Ensure URL is in format `https://www.linkedin.com/in/username`
2. **API Key Issues**: Verify RAPIDAPI_KEY is correctly set in environment variables
3. **No Results**: Check if the profile has public posts within the specified timeframe
4. **Timeout**: Increase Vercel function timeout in `vercel.json` if needed

### Debug Information

In development mode, detailed error information is included in API responses. Check Vercel function logs for additional debugging information.

## License

MIT License - feel free to modify and use for your projects. 