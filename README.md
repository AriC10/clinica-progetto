# Clinica Pro — Gestionale Ambulatoriale

App full-stack per la gestione di un ambulatorio medico.

## Stack
- **Frontend**: React 18 + Vite
- **Backend**: Python FastAPI
- **Database**: SQLite (sviluppo) / PostgreSQL (produzione)
- **Auth**: JWT Bearer token

## Avvio rapido (sviluppo locale)

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Apri http://localhost:5173

**Credenziali demo:** `demo@clinica.it` / `demo1234`

---

## Avvio con Docker (produzione)
```bash
docker-compose up --build
```
Apri http://localhost:3000

---

## Struttura progetto
```
clinica/
├── backend/
│   ├── main.py          # FastAPI app + SQLite DB
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Intera app React (componenti, pagine, API)
│   │   └── main.jsx     # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── docker-compose.yml   # Per deploy con PostgreSQL
```

## API Endpoints

| Metodo | Path | Descrizione |
|--------|------|-------------|
| POST | /auth/login | Login medico |
| GET | /medici/me | Profilo medico corrente |
| GET | /pazienti | Lista pazienti del medico |
| POST | /pazienti | Nuovo paziente |
| GET | /pazienti/{id} | Dettaglio paziente |
| PUT | /pazienti/{id} | Modifica paziente |
| GET | /pazienti/{id}/visite | Lista visite |
| POST | /visite | Nuova visita |
| GET | /pazienti/{id}/documenti | Lista documenti |
| POST | /documenti/upload | Carica PDF |
| GET | /documenti/{id}/download | Scarica PDF |
| GET | /pazienti/{id}/appunti | Lista appunti |
| POST | /appunti | Nuovo appunto |
| DELETE | /appunti/{id} | Elimina appunto |
| GET | /dashboard/stats | Statistiche dashboard |

## Note per la produzione
- Cambia `SECRET_KEY` in `main.py` con una stringa sicura
- Usa PostgreSQL tramite Docker Compose
- Configura HTTPS (Nginx + Let's Encrypt)
- Backup automatico con pg_dump schedulato
- Rispetta le normative GDPR per i dati sanitari
