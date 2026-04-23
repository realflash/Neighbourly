.PHONY: lint code-scan test-e2e test-e2e-system

lint:
	cd frontend && npx eslint . || true

code-scan:
	echo "No code scan defined"

test-e2e:
	cd frontend && npx playwright test

test-e2e-system:
	echo "No system e2e defined"
