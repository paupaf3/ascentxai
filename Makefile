.PHONY: install test test-watch test-coverage typecheck format format-fix \
        analyze github-test resume-extract linkedin-extract \
        clean check help

.DEFAULT_GOAL := help

install:
	npm install

test:
	npm test

test-watch:
	npm run test:watch

test-coverage:
	npm run test:coverage

typecheck:
	npx tsc --noEmit

format:
	npx prettier --check .

format-fix:
	npx prettier --write .

analyze:
	npm run analyze -- $(ARGS)

github-test:
	npm run github:test -- $(ARGS)

resume-extract:
	npm run resume:extract -- $(ARGS)

linkedin-extract:
	npm run linkedin:extract -- $(ARGS)

clean:
	rm -rf logs/ coverage/

check: typecheck format test

help:
	@echo 'AscentX.ai — available targets:'
	@echo ''
	@echo '  install          npm install'
	@echo '  test             Run tests (vitest)'
	@echo '  test-watch       Run tests in watch mode'
	@echo '  test-coverage    Run tests with coverage report'
	@echo '  typecheck        TypeScript type-check (tsc --noEmit)'
	@echo '  format           Check formatting (prettier)'
	@echo '  format-fix       Auto-fix formatting'
	@echo '  analyze          Run full analysis: make analyze ARGS="<args>"'
	@echo '  github-test      Test GitHub API: make github-test ARGS="profile <user>"'
	@echo '  resume-extract   Test resume extraction: make resume-extract ARGS="<pdf>"'
	@echo '  linkedin-extract Test LinkedIn extraction: make linkedin-extract ARGS="<pdf>"'
	@echo '  clean            Remove logs/ and coverage/'
	@echo '  check            Run typecheck + format + test (pre-commit gate)'
	@echo '  help             Show this help'
	@echo ''
	@echo 'Usage: make <target> [ARGS="..."]'
