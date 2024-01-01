curl -X POST \
    -H "Content-Type: application/json" \
    -d '{"username":"$1","password":"$2"}' \
    127.0.0.1:3000/api/v1/collect/Free
