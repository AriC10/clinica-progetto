import { useState, useEffect, createContext, useContext } from "react"

// ─── API ─────────────────────────────────────────────────────────────────────
const BASE = "http://localhost:8000"
const api = {
  async post(path, body) {
    const token = localStorage.getItem("token")
    const r = await fetch(BASE+path, { method:"POST", headers:{"Content-Type":"application/json",...(token?{"Authorization":`Bearer ${token}`}:{})}, body:JSON.stringify(body) })
    if(!r.ok) throw await r.json()
    return r.json()
  },
  async get(path) {
    const token = localStorage.getItem("token")
    const r = await fetch(BASE+path, { headers:{...(token?{"Authorization":`Bearer ${token}`}:{})} })
    if(!r.ok) throw await r.json()
    return r.json()
  },
  async put(path, body) {
    const token = localStorage.getItem("token")
    const r = await fetch(BASE+path, { method:"PUT", headers:{"Content-Type":"application/json",...(token?{"Authorization":`Bearer ${token}`}:{})}, body:JSON.stringify(body) })
    if(!r.ok) throw await r.json()
    return r.json()
  },
  async del(path) {
    const token = localStorage.getItem("token")
    const r = await fetch(BASE+path, { method:"DELETE", headers:{...(token?{"Authorization":`Bearer ${token}`}:{})} })
    if(!r.ok) throw await r.json()
    return r.json()
  }
}

// ─── CONTEXT ─────────────────────────────────────────────────────────────────
const Ctx = createContext(null)
function useApp() { return useContext(Ctx) }

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function initials(nome, cognome) { return `${nome?.[0]||""}${cognome?.[0]||""}`.toUpperCase() }
function age(dob) {
  if(!dob) return "—"
  const d = new Date(dob), now = new Date()
  return now.getFullYear() - d.getFullYear() - (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0)
}
function fmt(dt) {
  if(!dt) return "—"
  return new Date(dt).toLocaleDateString("it-IT", {day:"2-digit",month:"short",year:"numeric"})
}
const COLORS = ["#4F7FDB","#E07A5F","#3D9A8B","#A37DC3","#E09B3D","#6B8F71","#C3677A"]
function avatarColor(str) { let h=0; for(let c of (str||"")) h=(h*31+c.charCodeAt(0))%COLORS.length; return COLORS[h] }

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
function Avatar({nome,cognome,size=40}) {
  const bg = avatarColor(nome+cognome)
  const s = {width:size,height:size,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:600,fontSize:size*0.35,flexShrink:0}
  return <div style={s}>{initials(nome,cognome)}</div>
}

function Spinner() {
  return <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}><div className="spinner"/></div>
}

function Badge({children,color="blue"}) {
  const colors = {blue:{bg:"#EEF3FB",text:"#2558B8"},green:{bg:"#EAF5EE",text:"#1A7A3A"},amber:{bg:"#FEF3E2",text:"#9A5F0A"},red:{bg:"#FEECEB",text:"#A02A27"},purple:{bg:"#F3EEFE",text:"#6132B0"},gray:{bg:"#F0F0F0",text:"#555"}}
  const c = colors[color]||colors.gray
  return <span style={{background:c.bg,color:c.text,padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>{children}</span>
}

function Modal({title,onClose,children,width=520}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:"var(--card)",borderRadius:16,padding:28,width:"100%",maxWidth:width,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.25)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h3 style={{margin:0,fontSize:18,fontWeight:700,color:"var(--text)"}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:"var(--muted)",lineHeight:1}}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Input({label,value,onChange,type="text",placeholder=""}) {
  return (
    <div style={{marginBottom:14}}>
      {label&&<div style={{fontSize:12,fontWeight:600,color:"var(--muted)",marginBottom:5,textTransform:"uppercase",letterSpacing:.5}}>{label}</div>}
      <input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid var(--border)",background:"var(--input)",color:"var(--text)",fontSize:14,outline:"none",boxSizing:"border-box"}}/>
    </div>
  )
}

function Textarea({label,value,onChange,rows=4,placeholder=""}) {
  return (
    <div style={{marginBottom:14}}>
      {label&&<div style={{fontSize:12,fontWeight:600,color:"var(--muted)",marginBottom:5,textTransform:"uppercase",letterSpacing:.5}}>{label}</div>}
      <textarea value={value||""} onChange={e=>onChange(e.target.value)} rows={rows} placeholder={placeholder}
        style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid var(--border)",background:"var(--input)",color:"var(--text)",fontSize:14,outline:"none",boxSizing:"border-box",resize:"vertical",fontFamily:"inherit"}}/>
    </div>
  )
}

function Btn({children,onClick,variant="secondary",size="md",disabled=false,style:s={}}) {
  const base = {border:"none",borderRadius:8,cursor:disabled?"not-allowed":"pointer",fontWeight:600,fontFamily:"inherit",transition:"all .15s",opacity:disabled?.5:1}
  const vars = {
    primary:{background:"var(--accent)",color:"#fff",padding:size==="sm"?"6px 14px":"9px 20px",fontSize:size==="sm"?13:14},
    secondary:{background:"var(--btn)",color:"var(--text)",padding:size==="sm"?"6px 14px":"9px 20px",fontSize:size==="sm"?13:14},
    danger:{background:"#FEECEB",color:"#A02A27",padding:size==="sm"?"6px 14px":"9px 20px",fontSize:size==="sm"?13:14},
  }
  return <button style={{...base,...vars[variant]||vars.secondary,...s}} onClick={disabled?undefined:onClick}>{children}</button>
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage() {
  const {login} = useApp()
  const [email,setEmail] = useState("demo@clinica.it")
  const [pass,setPass] = useState("demo1234")
  const [err,setErr] = useState("")
  const [loading,setLoading] = useState(false)

  async function handleLogin(e) {
    e&&e.preventDefault()
    setLoading(true); setErr("")
    try { await login(email,pass) }
    catch(e) { setErr(e?.detail||"Credenziali non valide") }
    finally { setLoading(false) }
  }

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg)",padding:16}}>
      <div style={{width:"100%",maxWidth:380}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{width:56,height:56,borderRadius:14,background:"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:26}}>🏥</div>
          <h1 style={{fontSize:26,fontWeight:800,margin:"0 0 6px",color:"var(--text)"}}>Clinica Pro</h1>
          <p style={{color:"var(--muted)",fontSize:14,margin:0}}>Gestionale ambulatorio</p>
        </div>
        <div style={{background:"var(--card)",borderRadius:16,padding:28,boxShadow:"0 4px 24px rgba(0,0,0,.08)"}}>
          <Input label="Email" value={email} onChange={setEmail} type="email"/>
          <Input label="Password" value={pass} onChange={setPass} type="password"/>
          {err && <div style={{background:"#FEECEB",color:"#A02A27",padding:"9px 12px",borderRadius:8,fontSize:13,marginBottom:14}}>{err}</div>}
          <Btn variant="primary" onClick={handleLogin} disabled={loading} style={{width:"100%",marginTop:4}}>
            {loading?"Accesso...":"Accedi"}
          </Btn>
          <div style={{marginTop:16,padding:"12px",background:"var(--surface)",borderRadius:8,fontSize:12,color:"var(--muted)"}}>
            <strong>Demo:</strong> demo@clinica.it / demo1234
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({page,setPage,medico,logout}) {
  const nav = [{id:"dashboard",icon:"⊞",label:"Dashboard"},{id:"pazienti",icon:"👥",label:"Pazienti"},{id:"nuova-visita",icon:"＋",label:"Nuova visita"}]
  return (
    <div style={{width:220,flexShrink:0,background:"var(--card)",borderRight:"1px solid var(--border)",display:"flex",flexDirection:"column",height:"100vh",position:"sticky",top:0}}>
      <div style={{padding:"20px 16px 12px",borderBottom:"1px solid var(--border)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:8,background:"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🏥</div>
          <div><div style={{fontWeight:800,fontSize:15,color:"var(--text)"}}>Clinica Pro</div><div style={{fontSize:11,color:"var(--muted)"}}>Gestionale</div></div>
        </div>
      </div>
      <nav style={{padding:"12px 8px",flex:1}}>
        {nav.map(n=>(
          <div key={n.id} onClick={()=>setPage(n.id)}
            style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,cursor:"pointer",marginBottom:2,background:page===n.id?"var(--accent-soft)":"transparent",color:page===n.id?"var(--accent)":"var(--text)",fontWeight:page===n.id?600:400,transition:"all .15s"}}>
            <span style={{fontSize:16,width:20,textAlign:"center"}}>{n.icon}</span>
            <span style={{fontSize:14}}>{n.label}</span>
          </div>
        ))}
      </nav>
      {medico&&(
        <div style={{padding:"12px 16px",borderTop:"1px solid var(--border)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <Avatar nome={medico.nome} cognome={medico.cognome} size={34}/>
            <div><div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>Dott. {medico.cognome}</div><div style={{fontSize:11,color:"var(--muted)"}}>{medico.specializzazione||"Medico"}</div></div>
          </div>
          <button onClick={logout} style={{width:"100%",padding:"7px",borderRadius:7,border:"1px solid var(--border)",background:"none",cursor:"pointer",fontSize:12,color:"var(--muted)"}}>Esci</button>
        </div>
      )}
    </div>
  )
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({setPage,setSelectedPaziente}) {
  const [stats,setStats] = useState(null)
  useEffect(()=>{api.get("/dashboard/stats").then(setStats).catch(()=>{})},[])

  if(!stats) return <Spinner/>
  return (
    <div style={{padding:28}}>
      <h2 style={{margin:"0 0 6px",fontSize:22,fontWeight:800,color:"var(--text)"}}>Buongiorno 👋</h2>
      <p style={{color:"var(--muted)",margin:"0 0 24px",fontSize:14}}>Ecco il riepilogo di oggi</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:28}}>
        {[{n:stats.n_pazienti,l:"Pazienti totali",icon:"👥",c:"#4F7FDB"},{n:stats.n_visite_mese,l:"Visite questo mese",icon:"📋",c:"#3D9A8B"},{n:stats.n_documenti,l:"Documenti caricati",icon:"📄",c:"#A37DC3"}].map(s=>(
          <div key={s.l} style={{background:"var(--card)",borderRadius:14,padding:"18px 20px",border:"1px solid var(--border)"}}>
            <div style={{fontSize:28,marginBottom:8}}>{s.icon}</div>
            <div style={{fontSize:32,fontWeight:800,color:s.c}}>{s.n}</div>
            <div style={{fontSize:13,color:"var(--muted)",marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>
      <h3 style={{margin:"0 0 14px",fontSize:16,fontWeight:700,color:"var(--text)"}}>Ultime visite</h3>
      <div style={{background:"var(--card)",borderRadius:14,border:"1px solid var(--border)",overflow:"hidden"}}>
        {stats.ultime_visite.map((v,i)=>(
          <div key={v.id} onClick={()=>{setSelectedPaziente(v.paziente_id);setPage("scheda")}}
            style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",borderBottom:i<stats.ultime_visite.length-1?"1px solid var(--border)":"none",cursor:"pointer",transition:"background .1s"}}
            onMouseEnter={e=>e.currentTarget.style.background="var(--surface)"}
            onMouseLeave={e=>e.currentTarget.style.background=""}>
            <Avatar nome={v.nome} cognome={v.cognome} size={38}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,color:"var(--text)",fontSize:14}}>{v.nome} {v.cognome}</div>
              <div style={{fontSize:12,color:"var(--muted)"}}>{v.tipo||"Visita"} · {fmt(v.data)}</div>
            </div>
            <Badge color="green">completata</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── LISTA PAZIENTI ────────────────────────────────────────────────────────────
function ListaPazienti({setPage,setSelectedPaziente}) {
  const [pazienti,setPazienti] = useState([])
  const [search,setSearch] = useState("")
  const [loading,setLoading] = useState(true)
  const [showModal,setShowModal] = useState(false)
  const [form,setForm] = useState({nome:"",cognome:"",data_nascita:"",codice_fiscale:"",telefono:"",email:"",indirizzo:"",anamnesi:"",allergie:"",terapia:""})

  const load = ()=>api.get("/pazienti").then(setPazienti).catch(()=>{}).finally(()=>setLoading(false))
  useEffect(()=>{ load() },[])

  const filtered = pazienti.filter(p=>`${p.nome} ${p.cognome} ${p.codice_fiscale||""}`.toLowerCase().includes(search.toLowerCase()))

  async function save() {
    await api.post("/pazienti",form)
    setShowModal(false)
    setForm({nome:"",cognome:"",data_nascita:"",codice_fiscale:"",telefono:"",email:"",indirizzo:"",anamnesi:"",allergie:"",terapia:""})
    load()
  }

  const f = (k,v)=>setForm(x=>({...x,[k]:v}))

  if(loading) return <Spinner/>
  return (
    <div style={{padding:28}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h2 style={{margin:"0 0 4px",fontSize:22,fontWeight:800,color:"var(--text)"}}>Pazienti</h2>
          <p style={{margin:0,fontSize:14,color:"var(--muted)"}}>{pazienti.length} pazienti nel tuo studio</p>
        </div>
        <Btn variant="primary" onClick={()=>setShowModal(true)}>+ Nuovo paziente</Btn>
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Cerca per nome o codice fiscale..."
        style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid var(--border)",background:"var(--input)",color:"var(--text)",fontSize:14,marginBottom:18,outline:"none",boxSizing:"border-box"}}/>
      <div style={{background:"var(--card)",borderRadius:14,border:"1px solid var(--border)",overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:8,padding:"10px 18px",background:"var(--surface)",borderBottom:"1px solid var(--border)"}}>
          {["PAZIENTE","ETÀ","ULTIMA VISITA","VISITE"].map(h=><div key={h} style={{fontSize:11,fontWeight:700,color:"var(--muted)",letterSpacing:.5}}>{h}</div>)}
        </div>
        {filtered.map((p,i)=>(
          <div key={p.id} onClick={()=>{setSelectedPaziente(p.id);setPage("scheda")}}
            style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:8,padding:"14px 18px",borderBottom:i<filtered.length-1?"1px solid var(--border)":"none",cursor:"pointer",alignItems:"center"}}
            onMouseEnter={e=>e.currentTarget.style.background="var(--surface)"}
            onMouseLeave={e=>e.currentTarget.style.background=""}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <Avatar nome={p.nome} cognome={p.cognome} size={36}/>
              <div><div style={{fontWeight:600,fontSize:14,color:"var(--text)"}}>{p.nome} {p.cognome}</div>{p.codice_fiscale&&<div style={{fontSize:11,color:"var(--muted)"}}>{p.codice_fiscale}</div>}</div>
            </div>
            <div style={{fontSize:14,color:"var(--text)"}}>{age(p.data_nascita)} anni</div>
            <div style={{fontSize:13,color:"var(--muted)"}}>{fmt(p.ultima_visita)}</div>
            <div style={{fontSize:14,color:"var(--text)",fontWeight:600}}>{p.n_visite||0}</div>
          </div>
        ))}
        {filtered.length===0&&<div style={{padding:"32px",textAlign:"center",color:"var(--muted)",fontSize:14}}>Nessun paziente trovato</div>}
      </div>

      {showModal&&(
        <Modal title="Nuovo paziente" onClose={()=>setShowModal(false)} width={600}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
            <Input label="Nome *" value={form.nome} onChange={v=>f("nome",v)}/>
            <Input label="Cognome *" value={form.cognome} onChange={v=>f("cognome",v)}/>
            <Input label="Data di nascita" value={form.data_nascita} onChange={v=>f("data_nascita",v)} type="date"/>
            <Input label="Codice fiscale" value={form.codice_fiscale} onChange={v=>f("codice_fiscale",v)}/>
            <Input label="Telefono" value={form.telefono} onChange={v=>f("telefono",v)}/>
            <Input label="Email" value={form.email} onChange={v=>f("email",v)} type="email"/>
          </div>
          <Input label="Indirizzo" value={form.indirizzo} onChange={v=>f("indirizzo",v)}/>
          <Textarea label="Anamnesi" value={form.anamnesi} onChange={v=>f("anamnesi",v)} rows={3}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
            <Textarea label="Allergie" value={form.allergie} onChange={v=>f("allergie",v)} rows={2}/>
            <Textarea label="Terapia in corso" value={form.terapia} onChange={v=>f("terapia",v)} rows={2}/>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <Btn onClick={()=>setShowModal(false)}>Annulla</Btn>
            <Btn variant="primary" onClick={save} disabled={!form.nome||!form.cognome}>Salva paziente</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── SCHEDA PAZIENTE ───────────────────────────────────────────────────────────
function SchedaPaziente({pazienteId,setPage,setNuovaVisitaFor}) {
  const [paziente,setPaziente] = useState(null)
  const [visite,setVisite] = useState([])
  const [documenti,setDocumenti] = useState([])
  const [appunti,setAppunti] = useState([])
  const [tab,setTab] = useState("panoramica")
  const [newAppunto,setNewAppunto] = useState("")
  const [editMode,setEditMode] = useState(false)
  const [form,setForm] = useState(null)
  const [loading,setLoading] = useState(true)
  const [uploading,setUploading] = useState(false)

  async function loadAll() {
    const [p,v,d,a] = await Promise.all([
      api.get(`/pazienti/${pazienteId}`),
      api.get(`/pazienti/${pazienteId}/visite`),
      api.get(`/pazienti/${pazienteId}/documenti`),
      api.get(`/pazienti/${pazienteId}/appunti`),
    ])
    setPaziente(p); setVisite(v); setDocumenti(d); setAppunti(a); setForm(p)
    setLoading(false)
  }
  useEffect(()=>{ if(pazienteId) loadAll() },[pazienteId])

  async function saveEdit() {
    await api.put(`/pazienti/${pazienteId}`,form)
    setEditMode(false); loadAll()
  }
  async function addAppunto() {
    if(!newAppunto.trim()) return
    await api.post("/appunti",{paziente_id:pazienteId,testo:newAppunto})
    setNewAppunto(""); loadAll()
  }
  async function delAppunto(id) {
    await api.del(`/appunti/${id}`); loadAll()
  }
  async function handleUpload(e) {
    const file = e.target.files?.[0]; if(!file) return
    setUploading(true)
    const fd = new FormData(); fd.append("file",file)
    const token = localStorage.getItem("token")
    await fetch(`${BASE}/documenti/upload?paziente_id=${pazienteId}&descrizione=`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fd})
    setUploading(false); loadAll()
  }

  const ff = (k,v)=>setForm(x=>({...x,[k]:v}))
  const lastVisita = visite[0]

  if(loading) return <Spinner/>
  if(!paziente) return <div style={{padding:28,color:"var(--muted)"}}>Paziente non trovato</div>

  return (
    <div style={{padding:28}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24}}>
        <button onClick={()=>setPage("pazienti")} style={{background:"var(--btn)",border:"1px solid var(--border)",borderRadius:8,padding:"7px 12px",cursor:"pointer",fontSize:13,color:"var(--text)"}}>← Indietro</button>
        <Avatar nome={paziente.nome} cognome={paziente.cognome} size={52}/>
        <div style={{flex:1}}>
          <h2 style={{margin:"0 0 3px",fontSize:22,fontWeight:800,color:"var(--text)"}}>{paziente.nome} {paziente.cognome}</h2>
          <p style={{margin:0,fontSize:13,color:"var(--muted)"}}>
            {paziente.data_nascita&&`Nato il ${fmt(paziente.data_nascita)} · `}{age(paziente.data_nascita)} anni
            {paziente.codice_fiscale&&` · CF: ${paziente.codice_fiscale}`}
          </p>
        </div>
        <Btn variant="primary" onClick={()=>{setNuovaVisitaFor(paziente);setPage("nuova-visita")}}>+ Nuova visita</Btn>
        <Btn onClick={()=>setEditMode(!editMode)}>{editMode?"Annulla":"Modifica"}</Btn>
      </div>

      {/* Edit mode */}
      {editMode&&form&&(
        <div style={{background:"var(--card)",borderRadius:14,padding:20,marginBottom:20,border:"1.5px solid var(--accent)"}}>
          <h4 style={{margin:"0 0 16px",color:"var(--text)"}}>Modifica anagrafica</h4>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0 14px"}}>
            <Input label="Nome" value={form.nome} onChange={v=>ff("nome",v)}/>
            <Input label="Cognome" value={form.cognome} onChange={v=>ff("cognome",v)}/>
            <Input label="Data nascita" value={form.data_nascita} onChange={v=>ff("data_nascita",v)} type="date"/>
            <Input label="Codice fiscale" value={form.codice_fiscale} onChange={v=>ff("codice_fiscale",v)}/>
            <Input label="Telefono" value={form.telefono} onChange={v=>ff("telefono",v)}/>
            <Input label="Email" value={form.email} onChange={v=>ff("email",v)}/>
          </div>
          <Input label="Indirizzo" value={form.indirizzo} onChange={v=>ff("indirizzo",v)}/>
          <Textarea label="Anamnesi" value={form.anamnesi} onChange={v=>ff("anamnesi",v)} rows={3}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
            <Textarea label="Allergie" value={form.allergie} onChange={v=>ff("allergie",v)} rows={2}/>
            <Textarea label="Terapia" value={form.terapia} onChange={v=>ff("terapia",v)} rows={2}/>
          </div>
          <Btn variant="primary" onClick={saveEdit}>Salva modifiche</Btn>
        </div>
      )}

      {/* Tabs */}
      <div style={{display:"flex",gap:4,borderBottom:"2px solid var(--border)",marginBottom:20}}>
        {["panoramica","visite","documenti","appunti"].map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{padding:"8px 18px",border:"none",background:"none",cursor:"pointer",fontSize:14,fontWeight:tab===t?700:400,color:tab===t?"var(--accent)":"var(--muted)",borderBottom:tab===t?"2px solid var(--accent)":"2px solid transparent",marginBottom:-2,textTransform:"capitalize",fontFamily:"inherit"}}>
            {t} {t==="visite"&&visite.length>0&&<span style={{fontSize:11,background:"var(--accent-soft)",color:"var(--accent)",borderRadius:10,padding:"1px 7px",marginLeft:4}}>{visite.length}</span>}
          </button>
        ))}
      </div>

      {/* PANORAMICA */}
      {tab==="panoramica"&&(
        <div>
          {lastVisita&&(
            <div style={{marginBottom:20}}>
              <h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.5}}>Ultimi parametri vitali — {fmt(lastVisita.data)}</h4>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                {[
                  {l:"Pressione",v:lastVisita.pressione_sistolica?`${lastVisita.pressione_sistolica}/${lastVisita.pressione_diastolica}`:"—",u:"mmHg",icon:"🫀"},
                  {l:"SpO2",v:lastVisita.spo2||"—",u:"%",icon:"🫁"},
                  {l:"FC",v:lastVisita.frequenza_cardiaca||"—",u:"bpm",icon:"💓"},
                  {l:"Temperatura",v:lastVisita.temperatura||"—",u:"°C",icon:"🌡️"},
                  {l:"Peso",v:lastVisita.peso||"—",u:"kg",icon:"⚖️"},
                  {l:"Glicemia",v:lastVisita.glicemia||"—",u:"mg/dL",icon:"🩸"},
                ].map(x=>(
                  <div key={x.l} style={{background:"var(--surface)",borderRadius:12,padding:"14px 16px",border:"1px solid var(--border)"}}>
                    <div style={{fontSize:18,marginBottom:6}}>{x.icon}</div>
                    <div style={{fontSize:22,fontWeight:800,color:"var(--text)"}}>{x.v}<span style={{fontSize:13,fontWeight:400,color:"var(--muted)",marginLeft:3}}>{x.v!=="—"?x.u:""}</span></div>
                    <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{x.l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={{background:"var(--card)",borderRadius:12,padding:18,border:"1px solid var(--border)"}}>
              <h4 style={{margin:"0 0 10px",fontSize:13,fontWeight:700,color:"var(--muted)",textTransform:"uppercase"}}>Anamnesi</h4>
              <p style={{margin:0,fontSize:14,color:"var(--text)",lineHeight:1.6}}>{paziente.anamnesi||"Nessuna annotazione"}</p>
            </div>
            <div>
              <div style={{background:"var(--card)",borderRadius:12,padding:18,border:"1px solid var(--border)",marginBottom:12}}>
                <h4 style={{margin:"0 0 10px",fontSize:13,fontWeight:700,color:"var(--muted)",textTransform:"uppercase"}}>Allergie</h4>
                <p style={{margin:0,fontSize:14,color:"var(--text)"}}>{paziente.allergie||"Nessuna allergia nota"}</p>
              </div>
              <div style={{background:"var(--card)",borderRadius:12,padding:18,border:"1px solid var(--border)"}}>
                <h4 style={{margin:"0 0 10px",fontSize:13,fontWeight:700,color:"var(--muted)",textTransform:"uppercase"}}>Terapia in corso</h4>
                <div>{(paziente.terapia||"").split("\n").filter(Boolean).map((t,i)=>(
                  <div key={i} style={{fontSize:13,color:"var(--text)",padding:"4px 0",borderBottom:i<(paziente.terapia||"").split("\n").length-1?"1px solid var(--border)":"none"}}>💊 {t}</div>
                ))}</div>
                {!paziente.terapia&&<p style={{margin:0,fontSize:14,color:"var(--muted)"}}>Nessuna terapia</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISITE */}
      {tab==="visite"&&(
        <div>
          <Btn variant="primary" size="sm" onClick={()=>{setNuovaVisitaFor(paziente);setPage("nuova-visita")}} style={{marginBottom:16}}>+ Nuova visita</Btn>
          {visite.length===0&&<div style={{padding:"32px",textAlign:"center",color:"var(--muted)",background:"var(--surface)",borderRadius:12}}>Nessuna visita registrata</div>}
          {visite.map(v=>(
            <div key={v.id} style={{background:"var(--card)",borderRadius:12,padding:18,marginBottom:12,border:"1px solid var(--border)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div><div style={{fontWeight:700,color:"var(--text)",fontSize:15}}>{v.tipo||"Visita"}</div><div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{fmt(v.data)}</div></div>
                <Badge color="green">completata</Badge>
              </div>
              {v.note&&<p style={{margin:"0 0 12px",fontSize:14,color:"var(--text)",lineHeight:1.6,background:"var(--surface)",padding:"10px 14px",borderRadius:8}}>{v.note}</p>}
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                {v.pressione_sistolica&&<div style={{fontSize:12,color:"var(--muted)"}}><strong style={{color:"var(--text)"}}>PA</strong> {v.pressione_sistolica}/{v.pressione_diastolica} mmHg</div>}
                {v.frequenza_cardiaca&&<div style={{fontSize:12,color:"var(--muted)"}}><strong style={{color:"var(--text)"}}>FC</strong> {v.frequenza_cardiaca} bpm</div>}
                {v.spo2&&<div style={{fontSize:12,color:"var(--muted)"}}><strong style={{color:"var(--text)"}}>SpO2</strong> {v.spo2}%</div>}
                {v.temperatura&&<div style={{fontSize:12,color:"var(--muted)"}}><strong style={{color:"var(--text)"}}>T</strong> {v.temperatura}°C</div>}
                {v.peso&&<div style={{fontSize:12,color:"var(--muted)"}}><strong style={{color:"var(--text)"}}>Peso</strong> {v.peso} kg</div>}
                {v.glicemia&&<div style={{fontSize:12,color:"var(--muted)"}}><strong style={{color:"var(--text)"}}>Glicemia</strong> {v.glicemia} mg/dL</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DOCUMENTI */}
      {tab==="documenti"&&(
        <div>
          <div style={{marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
            <label style={{background:"var(--accent)",color:"#fff",padding:"9px 18px",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:14}}>
              {uploading?"Caricamento...":"+ Carica PDF"}
              <input type="file" accept=".pdf" onChange={handleUpload} style={{display:"none"}}/>
            </label>
          </div>
          {documenti.length===0&&<div style={{padding:"32px",textAlign:"center",color:"var(--muted)",background:"var(--surface)",borderRadius:12}}>Nessun documento caricato</div>}
          {documenti.map(d=>(
            <div key={d.id} style={{display:"flex",alignItems:"center",gap:14,background:"var(--card)",borderRadius:12,padding:"14px 18px",marginBottom:10,border:"1px solid var(--border)"}}>
              <div style={{width:42,height:42,background:"#FEECEB",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#A02A27",flexShrink:0}}>PDF</div>
              <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14,color:"var(--text)"}}>{d.nome_file}</div><div style={{fontSize:12,color:"var(--muted)"}}>{fmt(d.created_at)}</div></div>
              <a href={`${BASE}/documenti/${d.id}/download`} target="_blank" rel="noreferrer"><Btn size="sm">Apri</Btn></a>
            </div>
          ))}
        </div>
      )}

      {/* APPUNTI */}
      {tab==="appunti"&&(
        <div>
          <div style={{background:"var(--card)",borderRadius:12,padding:16,border:"1px solid var(--border)",marginBottom:16}}>
            <Textarea value={newAppunto} onChange={setNewAppunto} placeholder="Aggiungi un appunto clinico..." rows={3}/>
            <Btn variant="primary" size="sm" onClick={addAppunto} disabled={!newAppunto.trim()}>Aggiungi appunto</Btn>
          </div>
          {appunti.length===0&&<div style={{padding:"32px",textAlign:"center",color:"var(--muted)",background:"var(--surface)",borderRadius:12}}>Nessun appunto</div>}
          {appunti.map(a=>(
            <div key={a.id} style={{background:"var(--card)",borderRadius:12,padding:16,marginBottom:10,border:"1px solid var(--border)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{fontSize:12,color:"var(--muted)",marginBottom:8}}>{fmt(a.created_at)}</div>
                <button onClick={()=>delAppunto(a.id)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--muted)",fontSize:16,lineHeight:1}}>🗑</button>
              </div>
              <p style={{margin:0,fontSize:14,color:"var(--text)",lineHeight:1.6}}>{a.testo}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── NUOVA VISITA ─────────────────────────────────────────────────────────────
function NuovaVisita({pazienteFor,setPage}) {
  const [pazienti,setPazienti] = useState([])
  const [form,setForm] = useState({paziente_id:pazienteFor?.id||"",tipo:"",note:"",pressione_sistolica:"",pressione_diastolica:"",frequenza_cardiaca:"",spo2:"",temperatura:"",peso:"",glicemia:""})
  const [saved,setSaved] = useState(false)

  useEffect(()=>{ api.get("/pazienti").then(setPazienti).catch(()=>{}) },[])

  const ff = (k,v)=>setForm(x=>({...x,[k]:v}))

  async function save() {
    const payload = {...form}
    Object.keys(payload).forEach(k=>{ if(payload[k]==="") payload[k]=null })
    payload.paziente_id = Number(payload.paziente_id)
    await api.post("/visite",payload)
    setSaved(true)
    setTimeout(()=>setPage("pazienti"),1500)
  }

  if(saved) return (
    <div style={{padding:28,textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:16}}>✅</div>
      <h3 style={{color:"var(--text)"}}>Visita salvata con successo!</h3>
    </div>
  )

  return (
    <div style={{padding:28,maxWidth:720}}>
      <h2 style={{margin:"0 0 6px",fontSize:22,fontWeight:800,color:"var(--text)"}}>Nuova visita</h2>
      {pazienteFor&&<p style={{color:"var(--muted)",fontSize:14,margin:"0 0 24px"}}>Paziente: <strong>{pazienteFor.nome} {pazienteFor.cognome}</strong></p>}

      <div style={{background:"var(--card)",borderRadius:14,padding:20,border:"1px solid var(--border)",marginBottom:16}}>
        <h4 style={{margin:"0 0 14px",fontSize:13,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.5}}>Paziente e tipo visita</h4>
        {!pazienteFor&&(
          <div style={{marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:600,color:"var(--muted)",marginBottom:5,textTransform:"uppercase",letterSpacing:.5}}>Paziente *</div>
            <select value={form.paziente_id} onChange={e=>ff("paziente_id",e.target.value)}
              style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid var(--border)",background:"var(--input)",color:"var(--text)",fontSize:14,outline:"none"}}>
              <option value="">Seleziona paziente</option>
              {pazienti.map(p=><option key={p.id} value={p.id}>{p.cognome} {p.nome}</option>)}
            </select>
          </div>
        )}
        <Input label="Tipo visita" value={form.tipo} onChange={v=>ff("tipo",v)} placeholder="Es. Controllo pressione, Visita generale..."/>
      </div>

      <div style={{background:"var(--card)",borderRadius:14,padding:20,border:"1px solid var(--border)",marginBottom:16}}>
        <h4 style={{margin:"0 0 14px",fontSize:13,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.5}}>Parametri vitali</h4>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 14px"}}>
          <Input label="Pressione sistolica (mmHg)" value={form.pressione_sistolica} onChange={v=>ff("pressione_sistolica",v)} type="number"/>
          <Input label="Pressione diastolica (mmHg)" value={form.pressione_diastolica} onChange={v=>ff("pressione_diastolica",v)} type="number"/>
          <Input label="FC (bpm)" value={form.frequenza_cardiaca} onChange={v=>ff("frequenza_cardiaca",v)} type="number"/>
          <Input label="SpO2 (%)" value={form.spo2} onChange={v=>ff("spo2",v)} type="number"/>
          <Input label="Temperatura (°C)" value={form.temperatura} onChange={v=>ff("temperatura",v)} type="number"/>
          <Input label="Peso (kg)" value={form.peso} onChange={v=>ff("peso",v)} type="number"/>
          <Input label="Glicemia (mg/dL)" value={form.glicemia} onChange={v=>ff("glicemia",v)} type="number"/>
        </div>
      </div>

      <div style={{background:"var(--card)",borderRadius:14,padding:20,border:"1px solid var(--border)",marginBottom:20}}>
        <Textarea label="Note cliniche" value={form.note} onChange={v=>ff("note",v)} rows={5} placeholder="Descrizione della visita, osservazioni, raccomandazioni..."/>
      </div>

      <div style={{display:"flex",gap:10}}>
        <Btn variant="primary" onClick={save} disabled={!form.paziente_id}>Salva visita</Btn>
        <Btn onClick={()=>setPage("pazienti")}>Annulla</Btn>
      </div>
    </div>
  )
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [token,setToken] = useState(()=>localStorage.getItem("token"))
  const [medico,setMedico] = useState(null)
  const [page,setPage] = useState("dashboard")
  const [selectedPaziente,setSelectedPaziente] = useState(null)
  const [nuovaVisitaFor,setNuovaVisitaFor] = useState(null)
  const [darkMode,setDarkMode] = useState(false)

  useEffect(()=>{
    if(token) api.get("/medici/me").then(setMedico).catch(()=>{ localStorage.removeItem("token"); setToken(null) })
  },[token])

  async function login(email,pass) {
    const data = await api.post("/auth/login",{email,password:pass})
    localStorage.setItem("token",data.token)
    setToken(data.token); setMedico(data.medico)
  }

  function logout() { localStorage.removeItem("token"); setToken(null); setMedico(null); setPage("dashboard") }

  const ctx = {token,medico,login,logout,page,setPage,selectedPaziente,setSelectedPaziente}

  const cssVars = darkMode ? `
    :root { --bg:#0F1117; --card:#1A1D27; --surface:#22263A; --border:#2E3250; --text:#E8EAFF; --muted:#6B7099; --accent:#4F7FDB; --accent-soft:#1E2D52; --btn:#2A2F48; --input:#22263A; }
  ` : `
    :root { --bg:#F5F6FA; --card:#FFFFFF; --surface:#F0F2FA; --border:#E2E5F0; --text:#1A1D2E; --muted:#7A7F9A; --accent:#3B6FD4; --accent-soft:#EEF3FB; --btn:#F0F2FA; --input:#FFFFFF; }
  `

  return (
    <Ctx.Provider value={ctx}>
      <style>{`
        ${cssVars}
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family: 'DM Sans', system-ui, sans-serif; background: var(--bg); color: var(--text); }
        .spinner { width:32px; height:32px; border:3px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation: spin .7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus, textarea:focus, select:focus { border-color: var(--accent) !important; }
        button:hover { opacity: .88; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet"/>

      {!token ? <LoginPage/> : (
        <div style={{display:"flex",minHeight:"100vh"}}>
          <Sidebar page={page} setPage={p=>{ setPage(p); if(p==="nuova-visita") setNuovaVisitaFor(null) }} medico={medico} logout={logout}/>
          <div style={{flex:1,overflowY:"auto",position:"relative"}}>
            {/* Dark mode toggle */}
            <button onClick={()=>setDarkMode(!darkMode)}
              style={{position:"fixed",top:16,right:16,background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:16,zIndex:100}}>
              {darkMode?"☀️":"🌙"}
            </button>

            {page==="dashboard"&&<Dashboard setPage={setPage} setSelectedPaziente={setSelectedPaziente}/>}
            {page==="pazienti"&&<ListaPazienti setPage={setPage} setSelectedPaziente={setSelectedPaziente}/>}
            {page==="scheda"&&<SchedaPaziente pazienteId={selectedPaziente} setPage={setPage} setNuovaVisitaFor={setNuovaVisitaFor}/>}
            {page==="nuova-visita"&&<NuovaVisita pazienteFor={nuovaVisitaFor} setPage={setPage}/>}
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}
