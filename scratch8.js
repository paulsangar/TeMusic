const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envPath = require('path').resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length > 0) env[key] = rest.join('=').replace(/['"]/g, '').trim();
});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: users } = await supabase.from('users').select('*').limit(1);
  // POST to tracks
  const response1 = await fetch('https://api.spotify.com/v1/playlists/56QDBOYv7c4BEjQrliyUwd/tracks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${users[0].access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ uris: [] }) // Empty array just to test endpoint existence
  });
  const data1 = await response1.json().catch(() => ({}));
  console.log('POST /tracks response:', response1.status, data1);
  
  // POST to items
  const response2 = await fetch('https://api.spotify.com/v1/playlists/56QDBOYv7c4BEjQrliyUwd/items', {
    method: 'POST',
    headers: { Authorization: `Bearer ${users[0].access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ uris: [] })
  });
  const data2 = await response2.json().catch(() => ({}));
  console.log('POST /items response:', response2.status, data2);
}
run();
