import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Brain, Users, TrendingUp, Eye, Mic, BookOpen, ChevronDown, ChevronUp, Video, Zap, Star, MessageSquare, Trash2 } from 'lucide-react';
import ReactPlayer from 'react-player';
import api from '../axios';

/* ─────────────────────────────────────────
   Video Embed Helper
───────────────────────────────────────── */
function VideoEmbed({ url, playerRef }) {
  if (!url) return null;
  
  return (
    <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
      <ReactPlayer
        ref={playerRef}
        url={url}
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0 }}
        controls={true}
        config={{
          youtube: {
            playerVars: { showinfo: 1 }
          }
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────
   Animated Circular Score Ring
───────────────────────────────────────── */
function ScoreRing({ score, size = 120, stroke = 10, color = '#7c3aed', label }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
        <text
          x="50%" y="50%"
          textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize={size * 0.22} fontWeight="700"
          style={{ transform: 'rotate(90deg)', transformOrigin: '50% 50%' }}
        >
          {Math.round(score)}
        </text>
      </svg>
      {label && <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', maxWidth: size }}>{label}</span>}
    </div>
  );
}

/* ─────────────────────────────────────────
   Animated Progress Bar
───────────────────────────────────────── */
function MetricBar({ label, value, max = 100, color = '#7c3aed', unit = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const getStatus = (pct) => pct >= 80 ? { text: 'Excellent', color: '#10b981' } : pct >= 60 ? { text: 'Good', color: '#f59e0b' } : { text: 'Needs Work', color: '#ef4444' };
  const status = getStatus(pct);

  return (
    <div style={{ marginBottom: '1.1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: status.color, fontWeight: 600 }}>{status.text}</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>{typeof value === 'number' ? value.toFixed(0) : value}{unit}</span>
        </div>
      </div>
      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: '4px',
          background: `linear-gradient(90deg, ${color}aa, ${color})`,
          transition: 'width 1.4s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: `0 0 10px ${color}55`
        }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Track Card (Visual / Audio / Content)
───────────────────────────────────────── */
function TrackCard({ icon: Icon, title, color, metrics, metricConfig }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${color}33`,
      borderRadius: '16px',
      padding: '1.5rem',
      flex: 1,
      minWidth: '250px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: `${color}22`, padding: '0.6rem', borderRadius: '10px' }}>
          <Icon size={20} color={color} />
        </div>
        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'white' }}>{title}</span>
      </div>
      {metricConfig.map(({ key, label, max, unit }) => (
        <MetricBar key={key} label={label} value={metrics[key] ?? 0} max={max ?? 100} color={color} unit={unit ?? ''} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   Coaching Section
───────────────────────────────────────── */
function CoachingSection({ feedback }) {
  const lines = (feedback || '').split('\n').filter(l => l.trim());
  const sections = { explainability: [], strengths: [], weaknesses: [], recommendations: [] };
  let current = 'explainability';
  lines.forEach(line => {
    if (line.includes('Explainability')) current = 'explainability';
    else if (line.includes('Strengths')) current = 'strengths';
    else if (line.includes('Areas for Improvement')) current = 'weaknesses';
    else if (line.includes('Coaching Recommendations')) current = 'recommendations';
    else if (line.trim().startsWith('-')) sections[current].push(line.replace('-', '').trim());
  });

  const cards = [
    { key: 'explainability', title: 'AI Analysis', icon: Brain, color: '#8b5cf6', items: sections.explainability },
    { key: 'strengths', title: 'Strengths', icon: Star, color: '#10b981', items: sections.strengths },
    { key: 'weaknesses', title: 'Areas to Improve', icon: Zap, color: '#f59e0b', items: sections.weaknesses },
    { key: 'recommendations', title: 'Coaching Tips', icon: MessageSquare, color: '#6366f1', items: sections.recommendations },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
      {cards.map(({ key, title, icon: Icon, color, items }) => (
        <div key={key} style={{
          background: 'rgba(255,255,255,0.025)',
          border: `1px solid ${color}33`,
          borderRadius: '14px', padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Icon size={16} color={color} />
            <span style={{ fontWeight: 700, fontSize: '0.85rem', color }}>{title}</span>
          </div>
          {items.length > 0
            ? items.map((item, i) => (
              <div key={i} style={{
                fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)',
                padding: '0.4rem 0', borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                lineHeight: 1.5
              }}>
                {item}
              </div>
            ))
            : <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No data yet</div>
          }
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   Timeline
───────────────────────────────────────── */
function Timeline({ segments, onSeek }) {
  // Helper to parse 'M:SS' or 'H:MM:SS' into seconds
  const parseTime = (timeStr) => {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  };

  return (
    <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px', background: 'linear-gradient(to bottom, #7c3aed, #6366f1)' }} />
      {segments.map((seg, i) => (
        <div 
          key={i} 
          onClick={() => onSeek && onSeek(parseTime(seg.start))}
          style={{ position: 'relative', marginBottom: '1rem', cursor: onSeek ? 'pointer' : 'default' }}
        >
          <div style={{
            position: 'absolute', left: '-1.9rem', top: '0.2rem',
            width: '10px', height: '10px', borderRadius: '50%',
            background: '#7c3aed', border: '2px solid #1e1e3f',
            boxShadow: '0 0 6px #7c3aed'
          }} />
          <div 
            style={{ background: 'rgba(255,255,255,0.025)', borderRadius: '10px', padding: '0.75rem 1rem', border: '1px solid transparent', transition: 'all 0.2s ease' }}
            onMouseEnter={(e) => {
              if (onSeek) {
                e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)';
                e.currentTarget.style.background = 'rgba(124,58,237,0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
            }}
          >
            <span style={{ fontWeight: 700, color: '#a78bfa', fontSize: '0.78rem', marginRight: '0.75rem' }}>
              [{seg.start} – {seg.end}]
            </span>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem' }}>{seg.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   Recent Evaluations Sidebar
───────────────────────────────────────── */
function EvalList({ evals, activeId, onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {evals.map((e) => {
        const isActive = e.id === activeId;
        return (
          <div
            key={e.id}
            onClick={() => onSelect(e)}
            style={{
              padding: '0.9rem 1rem',
              borderRadius: '12px',
              cursor: 'pointer',
              background: isActive ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.03)',
              border: isActive ? '1px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.06)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {e.class_id ? `Class #${e.class_id}` : 'Quick Analysis'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>
                  {new Date(e.created_at).toLocaleString()}
                </div>
              </div>
              {e.overall_quality_index === 0 ? (
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.15)', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)' }}>REJECTED</span>
              ) : (
                <div style={{
                  fontWeight: 800, fontSize: '1.2rem',
                  color: (e.overall_quality_index || 0) >= 80 ? '#10b981' : (e.overall_quality_index || 0) >= 60 ? '#f59e0b' : '#ef4444'
                }}>
                  {(e.overall_quality_index || 0).toFixed(0)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Dashboard
───────────────────────────────────────── */
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEval, setSelectedEval] = useState(null);
  const playerRef = useRef(null);
  const navigate = useNavigate();

  const handleSeek = (seconds) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds, 'seconds');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/teacher/evaluations/dashboard');
        if (response.data.success) {
          setData(response.data.data);
          if (response.data.data.recent_evaluations?.length > 0) {
            setSelectedEval(response.data.data.recent_evaluations[0]);
          }
        } else {
          setError('Failed to fetch dashboard data');
        }
      } catch (err) {
        setError('Error connecting to backend');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assessment? This will permanently remove the AI analysis data. (The original video is not affected).")) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.delete(`/teacher/evaluations/${id}`);
      if (response.data.success) {
        const updatedEvals = data.recent_evaluations.filter(e => e.id !== id);
        setData({ ...data, recent_evaluations: updatedEvals });
        setSelectedEval(updatedEvals.length > 0 ? updatedEvals[0] : null);
      }
    } catch (err) {
      alert("Failed to delete assessment. Ensure you have the right permissions.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: 48, height: 48, border: '4px solid rgba(124,58,237,0.2)', borderTop: '4px solid #7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Loading AI insights...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !data || !data.latest_report) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <Video size={48} color="rgba(255,255,255,0.2)" />
      <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
        {error || 'No evaluations yet. Submit a video to see your AI analysis!'}
      </p>
      <button onClick={() => navigate('/upload')} style={{
        padding: '0.75rem 1.5rem', borderRadius: '10px', cursor: 'pointer',
        background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: 'white', border: 'none', fontWeight: 600
      }}>
        Analyze First Video
      </button>
    </div>
  );

  const latestReport = data.latest_report;
  const ai = selectedEval?.ai_feedback ?? {};
  const features = ai.multimodal_features ?? null;
  const overallScore = selectedEval?.overall_quality_index ?? latestReport.weekly_quality_index;
  const attention = selectedEval?.student_attention_score ?? latestReport.avg_student_attention_score;
  const explanation = selectedEval?.explanation_quality_score ?? latestReport.avg_explanation_quality_score;
  const wpm = selectedEval?.speaking_speed_wpm ?? latestReport.avg_speaking_speed_wpm;
  const timeline = selectedEval?.timeline_breakdown ?? [];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* ── HEADER ── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>AI Evaluation Studio</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: '0.25rem 0 0' }}>Multimodal Teaching Analysis</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => navigate('/report')} style={{
            padding: '0.6rem 1.2rem', borderRadius: '10px', cursor: 'pointer',
            background: 'rgba(255,255,255,0.07)', color: 'white', border: '1px solid rgba(255,255,255,0.12)', fontWeight: 500
          }}>Weekly Report</button>
          <button onClick={() => navigate('/upload')} style={{
            padding: '0.6rem 1.2rem', borderRadius: '10px', cursor: 'pointer',
            background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: 'white', border: 'none', fontWeight: 600
          }}>+ New Analysis</button>
        </div>
      </header>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* ── OVERALL SCORE HERO ── */}
          {overallScore === 0 ? (
            /* Rejection Banner */
            <div className="glass-panel" style={{ padding: '2rem 2.5rem', background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))', border: '1px solid rgba(239,68,68,0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                <div style={{ background: 'rgba(239,68,68,0.2)', padding: '1rem', borderRadius: '12px', flexShrink: 0 }}>
                  <span style={{ fontSize: '2rem' }}>⚠️</span>
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 0.5rem', color: '#f87171', fontSize: '1.3rem', fontWeight: 800 }}>Video Rejected — Not a Teaching Video</h2>
                  <p style={{ margin: '0 0 1rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                    {selectedEval ? new Date(selectedEval.created_at).toLocaleString() : ''}
                  </p>
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '1rem' }}>
                    <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit', color: 'rgba(255,255,255,0.75)', fontSize: '0.88rem', lineHeight: 1.7 }}>
                      {ai?.summary?.replace('⚠️ NOT A TEACHING VIDEO\n\n', '') || 'This video was flagged as non-educational content.'}
                    </pre>
                  </div>
                  <button onClick={() => navigate('/upload')} style={{ marginTop: '1.25rem', padding: '0.65rem 1.5rem', borderRadius: '10px', cursor: 'pointer', background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: 'white', border: 'none', fontWeight: 600 }}>
                    Upload a Teaching Video
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Normal Score Hero */
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem 2.5rem', background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(99,102,241,0.1))', border: '1px solid rgba(124,58,237,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2.5rem' }}>
                <ScoreRing score={overallScore || 0} size={130} stroke={12} color="#7c3aed" />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.4rem', fontWeight: 800 }}>
                        {selectedEval?.class_id ? `Class #${selectedEval.class_id}` : 'Latest Analysis'}
                      </h2>
                      <p style={{ margin: '0 0 1.25rem', color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>
                        {selectedEval ? new Date(selectedEval.created_at).toLocaleString() : '—'}
                      </p>
                    </div>
                    {selectedEval && (
                      <button onClick={() => handleDelete(selectedEval.id)} style={{
                        background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)',
                        padding: '0.5rem 0.75rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600
                      }}>
                        <Trash2 size={14} /> Delete
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    {[
                      { label: 'Engagement', val: attention, color: '#10b981', icon: Users },
                      { label: 'Explanation', val: explanation, color: '#8b5cf6', icon: Brain },
                      { label: 'Speaking', val: wpm, color: '#f59e0b', icon: Mic, unit: ' WPM', max: 200 },
                    ].map(({ label, val, color, icon: Icon, unit = '', max = 100 }) => (
                      <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                          <Icon size={14} color={color} />
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>{label}</span>
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '1.3rem', color }}>
                          {(val || 0).toFixed(0)}{unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {selectedEval?.video_url && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', marginTop: '-0.5rem' }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Source Video</h3>
                  <VideoEmbed url={selectedEval.video_url} playerRef={playerRef} />
                </div>
              )}
            </div>
          )}


          {/* ── MULTIMODAL AI BREAKDOWN ── */}
          {features ? (
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Brain size={20} color="#8b5cf6" /> Deep AI Feature Breakdown
              </h2>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <TrackCard
                  icon={Eye} title="Visual Track" color="#6366f1"
                  metrics={features.visual ?? {}}
                  metricConfig={[
                    { key: 'eye_contact_score', label: 'Eye Contact' },
                    { key: 'facial_engagement_score', label: 'Facial Engagement' },
                    { key: 'head_orientation_score', label: 'Head Orientation' },
                    { key: 'gesture_score', label: 'Gesture Frequency' },
                    { key: 'posture_score', label: 'Posture Quality' },
                    { key: 'movement_score', label: 'Movement' },
                  ]}
                />
                <TrackCard
                  icon={Mic} title="Audio Track" color="#f59e0b"
                  metrics={features.audio ?? {}}
                  metricConfig={[
                    { key: 'wpm', label: 'Speaking Speed', max: 200, unit: ' WPM' },
                    { key: 'pause_score', label: 'Pause Quality' },
                    { key: 'voice_confidence_score', label: 'Voice Confidence' },
                    { key: 'filler_count', label: 'Filler Words', max: 30, unit: ' words' },
                  ]}
                />
                <TrackCard
                  icon={BookOpen} title="Content Track" color="#10b981"
                  metrics={features.content ?? {}}
                  metricConfig={[
                    { key: 'clarity_score', label: 'Concept Clarity' },
                    { key: 'structure_score', label: 'Lesson Structure' },
                    { key: 'example_score', label: 'Real-World Examples' },
                    { key: 'coverage_score', label: 'Topic Coverage' },
                    { key: 'content_quality_score', label: 'Overall Quality' },
                  ]}
                />
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <Brain size={32} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
              <p style={{ margin: 0 }}>Submit a new video to unlock the Deep AI Breakdown panel with Visual, Audio & Content analysis.</p>
            </div>
          )}

          {/* ── AI COACHING SECTION ── */}
          {ai.summary && (
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Zap size={20} color="#f59e0b" /> AI Coaching Report
              </h2>
              <CoachingSection feedback={ai.summary} />
            </div>
          )}

          {/* ── TRANSCRIPT TIMELINE ── */}
          {timeline.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Activity size={20} color="#6366f1" /> Transcript Timeline
              </h2>
              <Timeline segments={timeline} onSeek={handleSeek} />
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="glass-panel" style={{ padding: '1.5rem', position: 'sticky', top: '1rem' }}>
          <h2 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Video size={16} color="#a78bfa" /> Analysis History
          </h2>
          {data.recent_evaluations?.length > 0 ? (
            <EvalList
              evals={data.recent_evaluations}
              activeId={selectedEval?.id}
              onSelect={setSelectedEval}
            />
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
              No evaluations yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
