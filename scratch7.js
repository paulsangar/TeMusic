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
  const response = await fetch('https://api.spotify.com/v1/playlists/56QDBOYv7c4BEjQrliyUwd/items?limit=5', {
    headers: { Authorization: `Bearer ${users[0].access_token}` }
  });
  const data = await response.json();
  if (data.error) console.log('Error:', data.error);
  else console.log('Items length:', data.items?.length, 'Total:', data.total);
}
run();
