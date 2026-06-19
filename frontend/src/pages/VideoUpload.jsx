import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Video } from 'lucide-react';
import api from '../axios';

export default function VideoUpload() {
  const [videoUrl, setVideoUrl] = useState('');
  const [classId, setClassId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await api.post('/teacher/evaluations/analyze', {
        video_url: videoUrl,
        class_id: classId || null
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setError(response.data.message || 'Analysis trigger failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error connecting to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', marginTop: '5vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <UploadCloud size={32} color="var(--accent-primary)" />
          <h2>New AI Video Analysis</h2>
        </div>
        
        {success ? (
          <div style={{ 
            background: 'rgba(16, 185, 129, 0.1)', 
            border: '1px solid rgba(16, 185, 129, 0.2)',
            color: 'var(--success)',
            padding: '1.5rem',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Analysis Queued Successfully!</h3>
            <p>Our AI is currently reviewing the class. You will be redirected to the dashboard shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {error && <div style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</div>}
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Class Recording URL (Zoom, Drive, etc.) <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0 0.75rem' }}>
                <Video size={20} color="var(--text-secondary)" />
                <input 
                  type="url" 
                  required
                  placeholder="https://example.com/recording.mp4"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Class ID (Optional)
              </label>
              <input 
                type="number" 
                placeholder="e.g. 101"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.2)',
                  color: 'white',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button 
                type="button" 
                onClick={() => navigate('/')}
                style={{ 
                  background: 'transparent', 
                  border: '1px solid rgba(255,255,255,0.2)', 
                  color: 'white', 
                  padding: '0.75rem 1.5rem', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Cancel
              </button>
              <button className="btn" type="submit" disabled={loading} style={{ flex: 2 }}>
                {loading ? 'Submitting to AI...' : 'Analyze Video'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
