export default function Home() {
  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>LinkedIn Leaderboard API</h1>
      <p>This is a web service that creates engagement leaderboards for LinkedIn creators.</p>
      
      <h2>API Endpoint</h2>
      <p><strong>POST</strong> <code>/api/leaderboard</code></p>
      
      <h3>Request Body:</h3>
      <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
{`{
  "LinkedinURL": "https://www.linkedin.com/in/username",
  "days": 7
}`}
      </pre>
      
      <h3>Example cURL:</h3>
      <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
{`curl -X POST [YOUR-DOMAIN]/api/leaderboard \\
  -H "Content-Type: application/json" \\
  -d '{
    "LinkedinURL": "https://www.linkedin.com/in/username",
    "days": 7
  }'`}
      </pre>
      
      <p>The API returns a ranked leaderboard of all people who engaged with the LinkedIn creator's posts (reactions, comments, reposts) within the specified timeframe.</p>
      
      <h3>Features:</h3>
      <ul>
        <li>Configurable scoring system</li>
        <li>Complete engagement data aggregation</li>
        <li>Smart pagination handling</li>
        <li>Error resilience</li>
        <li>Rich metadata responses</li>
      </ul>
    </div>
  );
} 