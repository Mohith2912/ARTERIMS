.PHONY: api test web demo

api:
	py -3 -m uvicorn artemis.api.main:app --reload

test:
	py -3 -m pytest -q

web:
	cd web && npm install && npm run dev

demo:
	py -3 -m artemis.api.seed && py -3 -m uvicorn artemis.api.main:app --host 0.0.0.0 --port 8000
