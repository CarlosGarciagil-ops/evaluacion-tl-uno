.PHONY: up down test logs

up:
	docker compose up --build

down:
	docker compose down -v

test:
	./scripts/smoke-test.sh

logs:
	docker compose logs -f
