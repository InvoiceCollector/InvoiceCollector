curl -X POST \
    -H "Content-Type: application/json" \
    -d "{\"webhook\":\"$1\",\"collector\":\"$2\",\"params\":{\"username\":\"$3\",\"password\":\"$4\"}}" \
    127.0.0.1:8080/api/v1/collect
