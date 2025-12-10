# Health Copilot

A personal health management assistant built with:

- Next.js + Tailwind
- Supabase (auth, database, storage)
- FastAPI backend for health pipelines
- Agentic AI integration (coming soon)

## Setup

### Frontend
npm install  
npm run dev  

### Backend
cd backend  
python -m venv venv  
venv\Scripts\activate  
pip install -r requirements.txt  
uvicorn main:app --reload --port 8000
