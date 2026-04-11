# tick-track
A full-stack realtime stock price tracker.

To install the backend dependencies,
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r src/requirements.txt

To run the backend,
cd backend
uvicorn src.main:app --reload

To install the frontend dependencies,
cd frontend
npm install
npm run dev

To run the frontend,
cd frontend
npm run dev
