curl -X POST \
    -H "Content-Type: application/json" \
    -d "{\"webhook\":\"$0\",\"collector\":\"$1\",\"params\":{\"username\":\"$2\",\"password\":\"$3\"}}" \
    127.0.0.1:8080/api/v1/collect
