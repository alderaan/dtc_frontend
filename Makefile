.PHONY: docker-build

docker-build:
	docker buildx build --platform linux/amd64 -t registry.correlion.ai/dtc-frontend:latest --push . 