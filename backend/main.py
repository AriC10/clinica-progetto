from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import sqlite3, hashlib, jwt, os, shutil, uuid

app = FastAPI(title="Clinica API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "https://clinica-frontend.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "clinica-demo-secret-2024"
ALGORITHM = "HS256"
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

security = HTTPBearer()

# ─── DATABASE ────────────────────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect("clinica.db", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    db = get_db()
    db.executescript("""
    CREATE TABLE IF NOT EXISTS medici (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        cognome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        specializzazione TEXT,
        created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS pazienti (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medico_id INTEGER NOT NULL,
        nome TEXT NOT NULL,
        cognome TEXT NOT NULL,
        data_nascita TEXT,
        codice_fiscale TEXT,
        telefono TEXT,
        email TEXT,
        indirizzo TEXT,
        anamnesi TEXT,
        allergie TEXT,
        terapia TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (medico_id) REFERENCES medici(id)
    );
    CREATE TABLE IF NOT EXISTS visite (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paziente_id INTEGER NOT NULL,
        medico_id INTEGER NOT NULL,
        data TEXT DEFAULT (datetime('now')),
        tipo TEXT,
        note TEXT,
        pressione_sistolica INTEGER,
        pressione_diastolica INTEGER,
        frequenza_cardiaca INTEGER,
        spo2 REAL,
        temperatura REAL,
        peso REAL,
        glicemia REAL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (paziente_id) REFERENCES pazienti(id),
        FOREIGN KEY (medico_id) REFERENCES medici(id)
    );
    CREATE TABLE IF NOT EXISTS documenti (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paziente_id INTEGER NOT NULL,
        medico_id INTEGER NOT NULL,
        nome_file TEXT NOT NULL,
        file_path TEXT NOT NULL,
        tipo TEXT DEFAULT 'pdf',
        descrizione TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (paziente_id) REFERENCES pazienti(id)
    );
    CREATE TABLE IF NOT EXISTS appunti (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paziente_id INTEGER NOT NULL,
        medico_id INTEGER NOT NULL,
        testo TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (paziente_id) REFERENCES pazienti(id)
    );
    """)
    # Seed demo data
    existing = db.execute("SELECT id FROM medici WHERE email='demo@clinica.it'").fetchone()
    if not existing:
        pw = hashlib.sha256("demo1234".encode()).hexdigest()
        db.execute("INSERT INTO medici (nome,cognome,email,password_hash,specializzazione) VALUES (?,?,?,?,?)",
                   ("Marco","Bianchi","demo@clinica.it",pw,"Medicina Generale"))
        db.execute("INSERT INTO medici (nome,cognome,email,password_hash,specializzazione) VALUES (?,?,?,?,?)",
                   ("Sara","Conti","sara@clinica.it",hashlib.sha256("demo1234".encode()).hexdigest(),"Cardiologia"))
        db.commit()
        medico_id = db.execute("SELECT id FROM medici WHERE email='demo@clinica.it'").fetchone()["id"]
        pazienti_seed = [
            (medico_id,"Mario","Rossi","1957-06-03","RSSMRA57H03H501Z","333-1234567","mario.rossi@email.it","Via Roma 12, Milano",
             "Ipertensione arteriosa in trattamento. Dislipidemia. Ex fumatore.","Nessuna allergia nota","Ramipril 5mg 1cp/die\nAtorvast 20mg sera"),
            (medico_id,"Laura","Verdi","1970-03-15","VRDLRA70C55F205X","347-9876543","","Via Garibaldi 45, Roma",
             "Diabete tipo 2. Ipotiroidismo.","Penicillina","Metformina 500mg 2cp/die\nLevotiroxina 50mcg mattino"),
            (medico_id,"Giorgio","Conti","1952-11-20","CNTGRG52S20G702B","329-5551234","giorgio@email.it","Corso Italia 8, Torino",
             "Cardiopatia ischemica. Fibrillazione atriale parossistica.","ASA","Bisoprololo 5mg 1cp/die\nWarfarin 5mg"),
            (medico_id,"Anna","Ferrari","1985-07-08","FRRNNA85L48F205Y","366-2223344","anna.ferrari@email.it","Via Nazionale 23, Bologna",
             "Nessuna patologia rilevante. Controlli periodici.","Lattosio",""),
        ]
        for p in pazienti_seed:
            db.execute("INSERT INTO pazienti (medico_id,nome,cognome,data_nascita,codice_fiscale,telefono,email,indirizzo,anamnesi,allergie,terapia) VALUES (?,?,?,?,?,?,?,?,?,?,?)", p)
        db.commit()
        pids = [r["id"] for r in db.execute("SELECT id FROM pazienti WHERE medico_id=?",(medico_id,)).fetchall()]
        visite_seed = [
            (pids[0],medico_id,"2025-04-15","Controllo pressione","Pressione leggermente elevata. Ridotta dose Ramipril per 2 settimane.",132,86,74,97,36.7,78,108),
            (pids[0],medico_id,"2025-02-20","Visita cardiologica","ECG nella norma. Continuare terapia attuale.",128,82,70,98,36.5,77,105),
            (pids[1],medico_id,"2025-04-14","Controllo glicemia","Glicemia a digiuno 142. Rivalutare dieta.",125,80,78,99,36.8,65,142),
            (pids[2],medico_id,"2025-04-12","Visita generale","Aritmia controllata. INR nella norma.",135,88,68,96,36.4,82,None),
            (pids[3],medico_id,"2025-03-02","Visita generale","Paziente in buone condizioni generali.",115,75,72,99,36.6,60,None),
        ]
        for v in visite_seed:
            db.execute("INSERT INTO visite (paziente_id,medico_id,data,tipo,note,pressione_sistolica,pressione_diastolica,frequenza_cardiaca,spo2,temperatura,peso,glicemia) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", v)
        appunti_seed = [
            (pids[0],medico_id,"Paziente riferisce lieve capogiro mattutino. Monitorare nei prossimi giorni."),
            (pids[1],medico_id,"Richiamare tra 2 settimane per controllo glicemia dopo modifica dieta."),
            (pids[2],medico_id,"Prossima visita di controllo INR entro 1 mese."),
        ]
        for a in appunti_seed:
            db.execute("INSERT INTO appunti (paziente_id,medico_id,testo) VALUES (?,?,?)", a)
        db.commit()
    db.close()

init_db()

# ─── AUTH ─────────────────────────────────────────────────────────────────────

def create_token(medico_id: int, email: str):
    payload = {"sub": str(medico_id), "email": email, "exp": datetime.utcnow() + timedelta(hours=12)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_current_medico(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return {"id": int(payload["sub"]), "email": payload["email"]}
    except:
        raise HTTPException(status_code=401, detail="Token non valido")

# ─── MODELS ───────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str

class PazienteCreate(BaseModel):
    nome: str
    cognome: str
    data_nascita: Optional[str] = None
    codice_fiscale: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    indirizzo: Optional[str] = None
    anamnesi: Optional[str] = None
    allergie: Optional[str] = None
    terapia: Optional[str] = None

class VisitaCreate(BaseModel):
    paziente_id: int
    tipo: Optional[str] = None
    note: Optional[str] = None
    pressione_sistolica: Optional[int] = None
    pressione_diastolica: Optional[int] = None
    frequenza_cardiaca: Optional[int] = None
    spo2: Optional[float] = None
    temperatura: Optional[float] = None
    peso: Optional[float] = None
    glicemia: Optional[float] = None

class AppuntoCreate(BaseModel):
    paziente_id: int
    testo: str

# ─── ROUTES ───────────────────────────────────────────────────────────────────

@app.post("/auth/login")
def login(req: LoginRequest):
    db = get_db()
    pw_hash = hashlib.sha256(req.password.encode()).hexdigest()
    medico = db.execute("SELECT * FROM medici WHERE email=? AND password_hash=?", (req.email, pw_hash)).fetchone()
    db.close()
    if not medico:
        raise HTTPException(status_code=401, detail="Credenziali non valide")
    token = create_token(medico["id"], medico["email"])
    return {"token": token, "medico": dict(medico)}

@app.get("/medici/me")
def get_me(me=Depends(get_current_medico)):
    db = get_db()
    m = db.execute("SELECT id,nome,cognome,email,specializzazione FROM medici WHERE id=?", (me["id"],)).fetchone()
    db.close()
    return dict(m)

@app.get("/pazienti")
def list_pazienti(me=Depends(get_current_medico)):
    db = get_db()
    rows = db.execute("""
        SELECT p.*, 
        (SELECT data FROM visite WHERE paziente_id=p.id ORDER BY data DESC LIMIT 1) as ultima_visita,
        (SELECT COUNT(*) FROM visite WHERE paziente_id=p.id) as n_visite,
        (SELECT COUNT(*) FROM documenti WHERE paziente_id=p.id) as n_documenti
        FROM pazienti p WHERE p.medico_id=? ORDER BY p.cognome
    """, (me["id"],)).fetchall()
    db.close()
    return [dict(r) for r in rows]

@app.post("/pazienti")
def create_paziente(p: PazienteCreate, me=Depends(get_current_medico)):
    db = get_db()
    cur = db.execute("""INSERT INTO pazienti (medico_id,nome,cognome,data_nascita,codice_fiscale,telefono,email,indirizzo,anamnesi,allergie,terapia)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
        (me["id"],p.nome,p.cognome,p.data_nascita,p.codice_fiscale,p.telefono,p.email,p.indirizzo,p.anamnesi,p.allergie,p.terapia))
    db.commit()
    row = db.execute("SELECT * FROM pazienti WHERE id=?", (cur.lastrowid,)).fetchone()
    db.close()
    return dict(row)

@app.get("/pazienti/{pid}")
def get_paziente(pid: int, me=Depends(get_current_medico)):
    db = get_db()
    p = db.execute("SELECT * FROM pazienti WHERE id=? AND medico_id=?", (pid, me["id"])).fetchone()
    db.close()
    if not p: raise HTTPException(404, "Paziente non trovato")
    return dict(p)

@app.put("/pazienti/{pid}")
def update_paziente(pid: int, p: PazienteCreate, me=Depends(get_current_medico)):
    db = get_db()
    db.execute("""UPDATE pazienti SET nome=?,cognome=?,data_nascita=?,codice_fiscale=?,telefono=?,email=?,
        indirizzo=?,anamnesi=?,allergie=?,terapia=? WHERE id=? AND medico_id=?""",
        (p.nome,p.cognome,p.data_nascita,p.codice_fiscale,p.telefono,p.email,p.indirizzo,p.anamnesi,p.allergie,p.terapia,pid,me["id"]))
    db.commit()
    row = db.execute("SELECT * FROM pazienti WHERE id=?", (pid,)).fetchone()
    db.close()
    return dict(row)

@app.get("/pazienti/{pid}/visite")
def get_visite(pid: int, me=Depends(get_current_medico)):
    db = get_db()
    rows = db.execute("SELECT * FROM visite WHERE paziente_id=? ORDER BY data DESC", (pid,)).fetchall()
    db.close()
    return [dict(r) for r in rows]

@app.post("/visite")
def create_visita(v: VisitaCreate, me=Depends(get_current_medico)):
    db = get_db()
    cur = db.execute("""INSERT INTO visite (paziente_id,medico_id,tipo,note,pressione_sistolica,pressione_diastolica,
        frequenza_cardiaca,spo2,temperatura,peso,glicemia) VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
        (v.paziente_id,me["id"],v.tipo,v.note,v.pressione_sistolica,v.pressione_diastolica,
         v.frequenza_cardiaca,v.spo2,v.temperatura,v.peso,v.glicemia))
    db.commit()
    row = db.execute("SELECT * FROM visite WHERE id=?", (cur.lastrowid,)).fetchone()
    db.close()
    return dict(row)

@app.get("/pazienti/{pid}/documenti")
def get_documenti(pid: int, me=Depends(get_current_medico)):
    db = get_db()
    rows = db.execute("SELECT * FROM documenti WHERE paziente_id=? ORDER BY created_at DESC", (pid,)).fetchall()
    db.close()
    return [dict(r) for r in rows]

@app.post("/documenti/upload")
async def upload_documento(paziente_id: int, descrizione: str = "", file: UploadFile = File(...), me=Depends(get_current_medico)):
    ext = os.path.splitext(file.filename)[1]
    fname = f"{uuid.uuid4()}{ext}"
    fpath = os.path.join(UPLOAD_DIR, fname)
    with open(fpath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    db = get_db()
    cur = db.execute("INSERT INTO documenti (paziente_id,medico_id,nome_file,file_path,descrizione) VALUES (?,?,?,?,?)",
        (paziente_id, me["id"], file.filename, fpath, descrizione))
    db.commit()
    row = db.execute("SELECT * FROM documenti WHERE id=?", (cur.lastrowid,)).fetchone()
    db.close()
    return dict(row)

@app.get("/documenti/{doc_id}/download")
def download_doc(doc_id: int, me=Depends(get_current_medico)):
    db = get_db()
    doc = db.execute("SELECT * FROM documenti WHERE id=?", (doc_id,)).fetchone()
    db.close()
    if not doc or not os.path.exists(doc["file_path"]):
        raise HTTPException(404, "File non trovato")
    return FileResponse(doc["file_path"], filename=doc["nome_file"])

@app.get("/pazienti/{pid}/appunti")
def get_appunti(pid: int, me=Depends(get_current_medico)):
    db = get_db()
    rows = db.execute("SELECT * FROM appunti WHERE paziente_id=? AND medico_id=? ORDER BY created_at DESC", (pid, me["id"])).fetchall()
    db.close()
    return [dict(r) for r in rows]

@app.post("/appunti")
def create_appunto(a: AppuntoCreate, me=Depends(get_current_medico)):
    db = get_db()
    cur = db.execute("INSERT INTO appunti (paziente_id,medico_id,testo) VALUES (?,?,?)", (a.paziente_id, me["id"], a.testo))
    db.commit()
    row = db.execute("SELECT * FROM appunti WHERE id=?", (cur.lastrowid,)).fetchone()
    db.close()
    return dict(row)

@app.delete("/appunti/{aid}")
def delete_appunto(aid: int, me=Depends(get_current_medico)):
    db = get_db()
    db.execute("DELETE FROM appunti WHERE id=? AND medico_id=?", (aid, me["id"]))
    db.commit()
    db.close()
    return {"ok": True}

@app.get("/dashboard/stats")
def dashboard_stats(me=Depends(get_current_medico)):
    db = get_db()
    n_pazienti = db.execute("SELECT COUNT(*) FROM pazienti WHERE medico_id=?", (me["id"],)).fetchone()[0]
    n_visite_mese = db.execute("SELECT COUNT(*) FROM visite WHERE medico_id=? AND strftime('%Y-%m',data)=strftime('%Y-%m','now')", (me["id"],)).fetchone()[0]
    n_documenti = db.execute("SELECT COUNT(*) FROM documenti WHERE medico_id=?", (me["id"],)).fetchone()[0]
    ultime_visite = db.execute("""
        SELECT v.*, p.nome, p.cognome FROM visite v
        JOIN pazienti p ON p.id=v.paziente_id
        WHERE v.medico_id=? ORDER BY v.data DESC LIMIT 5
    """, (me["id"],)).fetchall()
    db.close()
    return {
        "n_pazienti": n_pazienti,
        "n_visite_mese": n_visite_mese,
        "n_documenti": n_documenti,
        "ultime_visite": [dict(r) for r in ultime_visite]
    }
