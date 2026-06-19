import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Activity, Radio, Video, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../axios';

export default function LiveAnalysis() {
  const { streamKey } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Poll the backend for new chunks every 5 seconds
    const fetchLiveData = async () => {
      try {
        const response = await api.get(`/teacher/evaluations/live/${streamKey}`);
        if (response.data.success) {
          setData(response.data.data);
          setError('');
        }
      } catch (err) {
        setError('Connection lost. Attempting to reconnect...');
      } finally {
        setLoading(false);
      }
    };

    fetchLiveData();
    const interval = setInterval(fetchLiveData, 5000);
    return () => clearInterval(interval);
  }, [streamKey]);

  const latestChunk = data.length > 0 ? data[data.length - 1] : null;

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={24} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 2s infinite' }}></div>
            <h2 style={{ margin: 0 }}>Live Monitoring</h2>
          </div>
        </div>
        
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
          Key: <span style={{ color: '#f59e0b' }}>{streamKey}</span>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', padding: '1rem', borderRadius: '8px', color: '#f87171', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {!latestChunk && !loading ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Radio size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '0.5rem', color: 'white' }}>Waiting for Stream...</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
            The AI is waiting to receive video chunks from your custom APK. Ensure your app is pushing to the ingest API with the correct stream key.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
          
          {/* LEFT: MAIN CHARTS & METRICS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* TOP METRICS ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid #10b981' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Student Attention</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>
                  {latestChunk ? latestChunk.student_attention_score : '--'}<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/100</span>
                </div>
              </div>
              
              <div className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid #8b5cf6' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Explanation Quality</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>
                  {latestChunk ? latestChunk.explanation_quality_score : '--'}<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/100</span>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid #f59e0b' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Speaking Speed</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>
                  {latestChunk ? latestChunk.speaking_speed_wpm : '--'} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>WPM</span>
                </div>
              </div>
            </div>

            {/* LIVE CHART (Mock visualization using simple CSS bars for chunks) */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={20} color="#10b981" /> Live Attention Trend
                </h3>
              </div>
              
              <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '4px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {data.slice(-50).map((chunk) => (
                  <div key={chunk.id} style={{ 
                    flex: 1, 
                    background: chunk.student_attention_score > 70 ? '#10b981' : chunk.student_attention_score > 40 ? '#f59e0b' : '#ef4444',
                    height: `${Math.max(5, chunk.student_attention_score)}%`,
                    minWidth: '10px',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease'
                  }}></div>
                ))}
              </div>
            </div>
            
          </div>

          {/* RIGHT: AI LIVE COACHING FEED */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
              Real-Time AI Feedback
            </h3>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.slice(-10).reverse().map(chunk => {
                const feedback = chunk.ai_feedback || {};
                const coaching = feedback.coaching || {};
                const text = coaching.recommendations?.[0] || coaching.strengths?.[0] || 'Analyzing...';
                
                return (
                  <div key={chunk.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', borderLeft: `3px solid ${chunk.student_attention_score > 70 ? '#10b981' : '#f59e0b'}` }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Chunk #{chunk.chunk_index}</div>
                    <div style={{ color: 'white', lineHeight: '1.4' }}>{text}</div>
                    {feedback.transcript && (
                      <div style={{ marginTop: '0.5rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                        "{feedback.transcript}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
