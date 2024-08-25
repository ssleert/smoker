while true; do
curl -s --request GET \
  --url http://localhost:8000/api/v1/post/feed/0 \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bGlkIjoiMDFKNU0xWllESEpUSEhTUkhRVFpSR1gzQlIiLCJ1c2VybmFtZSI6InNzbGVlcnQiLCJleHAiOjE3MjcyMDA5ODF9.yNzUVQBNpYCj8_kkZKCJHcN6aH7ml76fOIliDnptoWM' &> /dev/null &
done
