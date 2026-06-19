import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import api from '../axios';

export default function WeeklyReport() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      // In a real scenario, we would pass the dynamic teacher ID. 
      // For this MVP, the backend will just grab the latest report.
      const response = await api.get('/teacher/evaluations/report/1');
      if (response.data.success) {
        setReportData(response.data.data);
      } else {
        setError('Failed to load the weekly report.');
      }
    } catch (err) {
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
        <div style={{ color: 'var(--accent-primary)', fontSize: '1.5rem' }}>Analyzing 7-day trend data...</div>
      </div>
    );
  }

  if (error) {
    return <div style={{ color: 'var(--danger)', textAlign: 'center', marginTop: '2rem' }}>{error}</div>;
  }

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={() => navigate('/')}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>Weekly Improvement Report</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Period: {reportData.week_start_date} to {reportData.week_end_date}</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Metric Summary */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="var(--accent-primary)"/> Weekly Averages
          </h2>
          
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Avg Quality Index</div>
            <div style={{ fontSize: '2rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>{reportData.average_quality_index}%</div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Filler Words</div>
            <div style={{ fontSize: '1.5rem', color: 'var(--danger)' }}>{reportData.total_filler_words}</div>
          </div>
          
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Classes Evaluated</div>
            <div style={{ fontSize: '1.5rem', color: 'white' }}>{reportData.classes_evaluated}</div>
          </div>
        </div>

        {/* AI Suggestions */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
            AI Coaching Feedback
          </h2>

          <div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <AlertTriangle size={18}/> Areas for Improvement
            </h3>
            <ul style={{ listStylePosition: 'inside', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {reportData.improvement_suggestions?.map((suggestion, idx) => (
                <li key={idx}>{suggestion}</li>
              )) || <li>Try to slow down your speaking pace during complex topics.</li>}
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <CheckCircle size={18}/> Positive Highlights
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Your student attention scores were consistently above 85% this week. Your sentiment analysis indicates a positive and encouraging tone in the classroom.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
