.PHONY: build test lint demo clean install dev type-check

install:
	bun install

dev:
	bun run dev

build:
	bun run build

test:
	NODE_OPTIONS="--experimental-vm-modules" npx jest --coverage

test-unit:
	NODE_OPTIONS="--experimental-vm-modules" npx jest tests/unit

lint:
	bun run lint

type-check:
	bun run type-check

demo:
	bun run demo

clean:
	rm -rf dist coverage node_modules

check: lint type-check test
