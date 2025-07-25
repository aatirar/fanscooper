const LinkedInAPI = require('../../lib/linkedin-api');
const LeaderboardGenerator = require('../../lib/leaderboard');

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
      message: 'This endpoint only accepts POST requests.'
    });
  }

  try {
    // Validate request body
    const { LinkedinURL, days } = req.body;

    if (!LinkedinURL) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: LinkedinURL',
        message: 'Please provide a LinkedIn profile URL in the format: https://www.linkedin.com/in/username'
      });
    }

    if (!days || typeof days !== 'number' || days <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid days parameter',
        message: 'Please provide a positive number for the days parameter.'
      });
    }

    // Validate LinkedIn URL format
    const linkedinUrlPattern = /https?:\/\/(?:www\.)?linkedin\.com\/in\/[^/?]+/;
    if (!linkedinUrlPattern.test(LinkedinURL)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid LinkedIn URL format',
        message: 'Please provide a valid LinkedIn profile URL in the format: https://www.linkedin.com/in/username'
      });
    }

    // Validate environment variables
    if (!process.env.RAPIDAPI_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
        message: 'API key not configured. Please contact administrator.'
      });
    }

    // Initialize services
    const linkedinAPI = new LinkedInAPI();
    const leaderboardGenerator = new LeaderboardGenerator();

    // Log the request for debugging
    console.log(`Processing leaderboard request for: ${LinkedinURL}, days: ${days}`);

    // Get engagement data from LinkedIn APIs
    let engagementData;
    try {
      engagementData = await linkedinAPI.getEngagementData(LinkedinURL, days);
    } catch (error) {
      console.error('LinkedIn API error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch LinkedIn data',
        message: error.message,
        details: 'There was an error retrieving data from LinkedIn. Please check the LinkedIn URL and try again.'
      });
    }

    // Check if we have any posts to analyze
    if (engagementData.aggregates.postsAnalyzed === 0) {
      return res.status(200).json({
        success: true,
        data: {
          leaderboard: [],
          metadata: {
            totalPeople: 0,
            postsAnalyzed: 0,
            aggregates: {
              totalReactions: 0,
              totalComments: 0,
              totalReposts: 0,
              totalEngagement: 0
            },
            scoringConfig: leaderboardGenerator.config.scoring,
            message: `No posts found within the last ${days} days for this profile.`,
            errors: engagementData.errors.length > 0 ? engagementData.errors : null
          }
        }
      });
    }

    // Generate leaderboard
    const result = await leaderboardGenerator.generateLeaderboard(engagementData);

    // Add request metadata to the response
    result.data.metadata.requestInfo = {
      linkedinUrl: LinkedinURL,
      daysAnalyzed: days,
      processedAt: new Date().toISOString()
    };

    // Log successful completion
    console.log(`Leaderboard generated successfully. Found ${result.data.leaderboard.length} people from ${engagementData.aggregates.postsAnalyzed} posts.`);

    // Return successful response
    return res.status(200).json(result);

  } catch (error) {
    // Log the error for debugging
    console.error('Unexpected error in leaderboard API:', error);

    // Return generic error response
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing your request.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Add CORS headers if needed
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}; 