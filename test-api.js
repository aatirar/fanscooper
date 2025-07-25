// Simple test script for the LinkedIn Leaderboard API
// Usage: node test-api.js [linkedin-url] [days]

const https = require('https');
const http = require('http');

async function testAPI(linkedinUrl, days, baseUrl = 'http://localhost:3000') {
  const requestData = JSON.stringify({
    LinkedinURL: linkedinUrl,
    days: parseInt(days)
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestData)
    }
  };

  // Parse the URL to determine protocol and setup options
  const url = new URL(`${baseUrl}/api/leaderboard`);
  const client = url.protocol === 'https:' ? https : http;
  
  options.hostname = url.hostname;
  options.port = url.port || (url.protocol === 'https:' ? 443 : 3000);
  options.path = url.pathname;

  return new Promise((resolve, reject) => {
    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            response: response
          });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(requestData);
    req.end();
  });
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node test-api.js <linkedin-url> <days> [base-url]');
    console.log('Example: node test-api.js "https://www.linkedin.com/in/username" 7');
    console.log('         node test-api.js "https://www.linkedin.com/in/username" 7 "https://your-app.vercel.app"');
    process.exit(1);
  }

  const linkedinUrl = args[0];
  const days = args[1];
  const baseUrl = args[2] || 'http://localhost:3000';

  console.log('Testing LinkedIn Leaderboard API...');
  console.log(`LinkedIn URL: ${linkedinUrl}`);
  console.log(`Days: ${days}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log('---');

  try {
    const startTime = Date.now();
    const result = await testAPI(linkedinUrl, days, baseUrl);
    const endTime = Date.now();
    
    console.log(`Status Code: ${result.statusCode}`);
    console.log(`Response Time: ${endTime - startTime}ms`);
    console.log('---');
    
    if (result.response.success) {
      console.log('✅ Success!');
      console.log(`Found ${result.response.data.leaderboard.length} people in leaderboard`);
      console.log(`Analyzed ${result.response.data.metadata.postsAnalyzed} posts`);
      console.log(`Total engagement: ${result.response.data.metadata.aggregates.totalEngagement}`);
      
      if (result.response.data.leaderboard.length > 0) {
        console.log('\nAll People:');
        result.response.data.leaderboard.forEach(person => {
          console.log(`${person.rank}. ${person.name} - Score: ${person['total score']} (${person.reactions}R, ${person.comments}C, ${person.reposts}S)`);
        });
        
        if (result.response.data.leaderboard.length > 25) {
          console.log(`\n... and ${result.response.data.leaderboard.length - 25} more people`);
        }
      }
      
      if (result.response.data.metadata.errors) {
        console.log('\n⚠️  Errors encountered:');
        result.response.data.metadata.errors.forEach(error => {
          console.log(`- ${error}`);
        });
      }
    } else {
      console.log('❌ Error!');
      console.log(`Error: ${result.response.error}`);
      console.log(`Message: ${result.response.message}`);
      if (result.response.details) {
        console.log(`Details: ${result.response.details}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Request failed!');
    console.log(`Error: ${error.message}`);
  }
}

main(); 