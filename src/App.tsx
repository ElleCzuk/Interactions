import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from './firebase'; 
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';

// Interfaces para TypeScript
interface HistoryEntry {
  type: 'positivo' | 'negativo';
  emocion: string;
  habito: string;
  timestamp: string;
}

interface Person {
  name: string;
  history: HistoryEntry[];
}

const DATA = {
  negativo: { 
    emociones: ['Frustrada', 'Triste', 'Enojada', 'Ansiosa', 'Sola', 'Cansada'], 
    habitos: ['Comida compulsiva', 'Gasto innecesario', 'Aislamiento', 'Scroll infinito', 'Procrastinar'] 
  },
  positivo: { 
    emociones: ['Paz', 'Energía', 'Motivación', 'Amada', 'Tranquila', 'Inspirada'], 
    habitos: ['Hice ejercicio', 'Comí sano', 'Avancé en mis proyectos', 'Medité', 'Dormí bien'] 
  }
};

export default function App() {
  const [people, setPeople] = useState<Person[]>([]); 
  const [control, setControl] = useState(100);
  const [modal, setModal] = useState<{idx: number, type: 'positivo' | 'negativo'} | null>(null);
  const [detailModal, setDetailModal] = useState<number | null>(null);
  const [temp, setTemp] = useState({ emocion: '', habito: '' });
  const [newName, setNewName] = useState('');
  const [isLoaded, setIsLoaded] = useState(false); // Para evitar que el autosave pise datos vacíos al inicio

  // 1. Cargar último estado desde Firebase al iniciar
  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, "registros_continuos"), orderBy("fecha", "desc"), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const lastDoc = querySnapshot.docs[0].data();
          setPeople(lastDoc.vinculos || []);
          setControl(lastDoc.nivelControl ?? 100);
        }
      } catch (e) {
        console.error("Error cargando datos iniciales:", e);
      } finally {
        setIsLoaded(true);
      }
    };
    fetchData();
  }, []);

  // 2. Autosave a Firebase (solo si ya se cargaron los datos iniciales)
  useEffect(() => {
    if (!isLoaded || people.length === 0) return;
    
    const timer = setTimeout(async () => {
      try {
        await addDoc(collection(db, "registros_continuos"), { 
          fecha: serverTimestamp(), 
          nivelControl: control, 
          vinculos: people 
        });
      } catch (e) { 
        console.error("Autosave error", e); 
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [people, control, isLoaded]);

  const confirmRegistration = () => {
    if (modal !== null && temp.emocion && temp.habito) {
      const up = [...people];
      up[modal.idx].history.push({ 
        type: modal.type, 
        ...temp, 
        timestamp: new Date().toISOString() 
      });
      setPeople(up);
      setControl(p => modal.type === 'negativo' ? Math.max(0, p - 8) : Math.min(100, p + 4));
      setModal(null); 
      setTemp({ emocion: '', habito: '' });
    }
  };

  const getTagStyle = (isSelected: boolean, type: 'positivo' | 'negativo'): React.CSSProperties => ({
    padding: '10px 14px',
    borderRadius: '12px',
    fontSize: '0.7rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: isSelected 
      ? `1.5px solid ${type === 'positivo' ? '#4ade80' : '#ff4d4d'}` 
      : '1px solid rgba(255, 255, 255, 0.1)',
    background: isSelected 
      ? (type === 'positivo' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 77, 77, 0.2)') 
      : 'rgba(255, 255, 255, 0.03)',
    color: isSelected ? 'white' : 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(5px)',
  });

  return (
    <div className="app-container">
      <h1 className="main-title">INTERACTIONS</h1>

      <div className="stability-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 400, opacity: 0.5, letterSpacing: '1px' }}>ESTABILIDAD</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 300 }}>{control}%</span>
        </div>
        <div className="bar-track">
          <motion.div 
            className="bar-fill" 
            animate={{ width: `${control}%` }} 
            transition={{ type: 'spring', stiffness: 45, damping: 12 }} 
          />
        </div>
      </div>

      <div style={{ display: 'grid', gap: '6px' }}>
        {people.map((person, idx) => (
          <div key={idx} className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 15px' }}>
            <div onClick={() => setDetailModal(idx)} style={{ flex: 1, cursor: 'pointer' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>{person.name}</span>
              <p style={{ fontSize: '0.45rem', opacity: 0.3, margin: 0 }}>ver mapa →</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setModal({idx, type: 'negativo'})} style={btnSimsNeg}>-</button>
              <button onClick={() => setModal({idx, type: 'positivo'})} style={btnSimsPos}>+</button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {detailModal !== null && (
          <div className="modal-overlay">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={modalGlassStyle}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '15px', fontWeight: 300 }}>{people[detailModal].name}</h2>
              <div className="history-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                {people[detailModal].history.length > 0 ? (
                  people[detailModal].history.map((h, i) => (
                    <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: h.type === 'positivo' ? '#4ade80' : '#ff4d4d', opacity: 0.8 }} />
                  ))
                ) : ( <p style={{ fontSize: '0.7rem', opacity: 0.3 }}>Sin registros</p> )}
              </div>
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  onClick={() => { if(window.confirm(`¿Eliminar vínculo?`)) { setPeople(people.filter((_, i) => i !== detailModal)); setDetailModal(null); } }}
                  style={{ background: 'none', border: 'none', color: '#ff4d4d', fontSize: '0.65rem', cursor: 'pointer', opacity: 0.6 }}
                >
                  ELIMINAR VÍNCULO
                </button>
                <button onClick={() => setDetailModal(null)} style={btnConfirm}>Cerrar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal && (
          <div className="modal-overlay" style={{ zIndex: 110 }}>
            <motion.div initial={{ y: 30 }} animate={{ y: 0 }} className="glass-card" style={modalGlassStyle}>
              <p style={{ textAlign: 'center', fontSize: '0.7rem', opacity: 0.5, marginBottom: '20px' }}>REGISTRO: {people[modal.idx].name}</p>
              
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '0.6rem', opacity: 0.3, marginBottom: '10px' }}>SENTIMIENTO</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {DATA[modal.type].emociones.map(e => (
                    <button key={e} onClick={() => setTemp({...temp, emocion: e})} style={getTagStyle(temp.emocion === e, modal.type)}>{e}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <p style={{ fontSize: '0.6rem', opacity: 0.3, marginBottom: '10px' }}>HÁBITO ASOCIADO</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {DATA[modal.type].habitos.map(h => (
                    <button key={h} onClick={() => setTemp({...temp, habito: h})} style={getTagStyle(temp.habito === h, modal.type)}>{h}</button>
                  ))}
                </div>
              </div>

              <button 
                disabled={!temp.emocion || !temp.habito} 
                onClick={confirmRegistration} 
                style={{ ...btnConfirm, opacity: (!temp.emocion || !temp.habito) ? 0.3 : 1 }}
              >
                REGISTRAR
              </button>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'white', opacity: 0.3, width: '100%', marginTop: '15px', fontSize: '0.7rem' }}>Cancelar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="glass-card" style={{ marginTop: 'auto', padding: '10px 15px', display: 'flex', gap: '10px' }}>
        <input 
          value={newName} 
          onChange={(e) => setNewName(e.target.value)} 
          placeholder="Nuevo vínculo..." 
          style={{ background: 'transparent', border: 'none', color: 'white', flex: 1, outline: 'none', fontSize: '0.75rem' }} 
        />
        <button 
          onClick={() => { if(newName) { setPeople([...people, {name: newName, history: []}]); setNewName(''); } }} 
          style={{ background: 'white', color: 'black', border: 'none', borderRadius: '10px', padding: '5px 12px', fontWeight: 600, fontSize: '0.65rem' }}
        >
          ADD
        </button>
      </div>
    </div>
  );
}

const modalGlassStyle: React.CSSProperties = {
  maxWidth: '350px',
  width: '90%',
  background: 'rgba(15, 15, 18, 0.8)',
  backdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '25px'
};

const btnSimsNeg: React.CSSProperties = { background: 'rgba(255, 77, 77, 0.1)', border: 'none', color: '#ff4d4d', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1rem' };
const btnSimsPos: React.CSSProperties = { background: 'rgba(74, 222, 128, 0.1)', border: 'none', color: '#4ade80', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1rem' };
const btnConfirm: React.CSSProperties = { width: '100%', padding: '16px', borderRadius: '18px', background: 'white', color: 'black', fontWeight: 600, border: 'none', cursor: 'pointer' };