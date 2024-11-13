import fetch from 'node-fetch';

async function makeRequest() {
  try {
    const res = await fetch('http://localhost:3000/');
    const data = await res.json();
    console.log('Response:', res.status, data);

    const rateLimitRemaining = res.headers.get('X-RateLimit-Remaining');
    const rateLimitRetryAfter = res.headers.get('X-RateLimit-Retry-After');

    console.log(`Remaining: ${rateLimitRemaining}, Retry After: ${rateLimitRetryAfter || 'N/A'}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

setInterval(makeRequest, 1000); // Send a request every second
