// app/api/proxy/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  
  if (!url) {
    return new Response('Missing URL parameter', { status: 400 });
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    return new Response('Invalid URL', { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProxyBot/1.0)',
      },
    });

    if (!response.ok) {
      return new Response(`Failed to fetch: ${response.statusText}`, { 
        status: response.status 
      });
    }

    const contentType = response.headers.get('content-type') || 'text/html';
    const content = await response.text();
    
    return new Response(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=300',
        'X-Frame-Options': 'ALLOWALL',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response('Failed to load content', { status: 500 });
  }
}