#!/usr/bin/env bash
# Drop in the Web3Forms access key, ship it, and confirm it is live.
#   ./set-form-key.sh <access-key>
#
# Note: Web3Forms rejects calls from server IPs on the free plan, so the key
# cannot be checked with curl. It is verified by submitting the real form in
# a browser, which is what the site does anyway.
set -euo pipefail
cd "$(dirname "$0")"

KEY="${1:-}"
[ -n "$KEY" ] || { echo "usage: ./set-form-key.sh <access-key>"; exit 1; }

# Web3Forms keys are UUIDs. Catch a mis-paste before it goes live.
if ! printf '%s' "$KEY" | grep -Eq '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'; then
  echo "That does not look like a Web3Forms key (expected a UUID like 1a2b3c4d-....)."
  echo "Got: $KEY"; exit 1
fi

python3 - "$KEY" <<'PY'
import re, sys
key = sys.argv[1]
p = 'assets/js/main.js'; s = open(p).read()
s2 = re.sub(r"(ACCESS_KEY:\s*')[^']*('),?[^\n]*",
             lambda m: m.group(1) + key + m.group(2) + ',', s, count=1)
assert s2 != s, "ACCESS_KEY line not found"
open(p, 'w').write(s2)

p = 'index.html'; s = open(p).read()
n = max(int(x) for x in re.findall(r'\?v=(\d+)', s)) + 1
s = re.sub(r'\?v=\d+', '?v=%d' % n, s)
open(p, 'w').write(s)
print("key written, assets bumped to v=%d" % n)
PY

git add -A
git commit -q -m "Wire up the Web3Forms key so applications reach Steven's inbox"
git push -q origin main
echo "Pushed. Waiting for Vercel..."
for i in $(seq 1 24); do
  if curl -s "https://steven-howard-website.vercel.app/assets/js/main.js" | grep -q "$KEY"; then
    echo
    echo "LIVE. Now send one real test through the form at"
    echo "  https://steven-howard-website.vercel.app/#contact"
    echo "and confirm it lands in stevenhoward@verizon.net."
    exit 0
  fi
  sleep 5
done
echo "Pushed, but not seen live yet. Check the Vercel dashboard."
