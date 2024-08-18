docker compose -f database/docker-compose.yml up -d
docker compose -f web-client/docker-compose.yml up -d
docker compose -f backend/docker-compose.yml up -d
docker compose -f coder.yml up -d

