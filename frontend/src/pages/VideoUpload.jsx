import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Video, Link as LinkIcon, Radio, FileVideo } from 'lucide-react';
import api from '../axios';

export default function VideoUpload() {
  const [activeTab, setActiveTab] = useState('url'); // 'url', 'upload', 'live'
  const [videoUrl, setVideoUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [file, setFile] = useState(null);
  const [classId, setClassId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [liveStreamType, setLiveStreamType] = useState('youtube'); // 'youtube', 'custom'
  const [streamKey, setStreamKey] = useState('');

  // Generate a random stream key when Custom API is selected
  const handleLiveStreamTypeChange = (type) => {
    setLiveStreamType(type);
    if (type === 'custom' && !streamKey) {
      setStreamKey('sk_live_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      let response;
      
      if (activeTab === 'url' || (activeTab === 'live' && liveStreamType === 'youtube')) {
        const payloadUrl = activeTab === 'url' ? videoUrl : liveUrl;
        if (!payloadUrl) throw new Error("URL is required");
        
        response = await api.post('/teacher/evaluations/analyze', {
          video_url: payloadUrl,
          class_id: classId || null
        });
      } else if (activeTab === 'upload') {
        if (!file) throw new Error("Please select a video file to upload");
        
        const formData = new FormData();
        formData.append('video_file', file);
        if (classId) formData.append('class_id', classId);
        
        response = await api.post('/teacher/evaluations/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else if (activeTab === 'live' && liveStreamType === 'custom') {
        // Initialize the custom live stream session
        response = await api.post('/teacher/evaluations/live/start', {
          stream_key: streamKey,
          class_id: classId || null
        });
        
        if (response.data.success) {
          navigate(`/live/${streamKey}`);
          return;
        }
      }

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setError(response.data.message || 'Analysis trigger failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error connecting to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', marginTop: '5vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '650px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <UploadCloud size={32} color="var(--accent-primary)" />
          <h2>New AI Video Analysis</h2>
        </div>

        {/* TAB NAVIGATION */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '12px' }}>
          <button 
            type="button"
            onClick={() => { setActiveTab('url'); setError(''); }}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: 600, transition: 'all 0.2s', background: activeTab === 'url' ? 'rgba(124,58,237,0.3)' : 'transparent', color: activeTab === 'url' ? '#fff' : 'rgba(255,255,255,0.5)' }}
          >
            <LinkIcon size={18} /> Video URL
          </button>
          <button 
            type="button"
            onClick={() => { setActiveTab('upload'); setError(''); }}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: 600, transition: 'all 0.2s', background: activeTab === 'upload' ? 'rgba(124,58,237,0.3)' : 'transparent', color: activeTab === 'upload' ? '#fff' : 'rgba(255,255,255,0.5)' }}
          >
            <FileVideo size={18} /> Upload File
          </button>
          <button 
            type="button"
            onClick={() => { setActiveTab('live'); handleLiveStreamTypeChange(liveStreamType); setError(''); }}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: 600, transition: 'all 0.2s', background: activeTab === 'live' ? 'rgba(124,58,237,0.3)' : 'transparent', color: activeTab === 'live' ? '#fff' : 'rgba(255,255,255,0.5)' }}
          >
            <Radio size={18} /> Live Stream
          </button>
        </div>
        
        {success ? (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--success)', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Analysis Queued Successfully!</h3>
            <p>Our AI is currently processing the content. You will be redirected shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {error && <div style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.9rem' }}>{error}</div>}
            
            {/* DYNAMIC TAB CONTENT */}
            {activeTab === 'url' && (
              <div className="animate-fade-in">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  Class Recording URL (Zoom, Vimeo, YouTube) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0 0.75rem' }}>
                  <Video size={20} color="var(--text-secondary)" />
                  <input type="url" required placeholder="https://example.com/recording.mp4" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: 'none', color: 'white', outline: 'none' }} />
                </div>
              </div>
            )}

            {activeTab === 'upload' && (
              <div className="animate-fade-in">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  Upload Video File (.mp4, .mov) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '12px', padding: '2.5rem 1rem', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <UploadCloud size={40} color={file ? '#10b981' : 'var(--text-secondary)'} style={{ marginBottom: '1rem' }} />
                  {file ? (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#10b981', fontWeight: 600, marginBottom: '0.25rem' }}>{file.name}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: 'white', fontWeight: 600, marginBottom: '0.25rem' }}>Click to browse or drag file here</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Maximum file size: 500 MB</div>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/mp4,video/quicktime,video/x-msvideo" style={{ display: 'none' }} />
                </div>
              </div>
            )}

            {activeTab === 'live' && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="radio" name="streamType" checked={liveStreamType === 'youtube'} onChange={() => handleLiveStreamTypeChange('youtube')} />
                    <span>YouTube / RTMP URL</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="radio" name="streamType" checked={liveStreamType === 'custom'} onChange={() => handleLiveStreamTypeChange('custom')} />
                    <span>Custom APK (API/WebRTC)</span>
                  </label>
                </div>

                {liveStreamType === 'youtube' ? (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                      Live Stream Endpoint (YouTube Live, RTMP, etc) <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0 0.75rem' }}>
                      <Radio size={20} color="var(--text-secondary)" />
                      <input type="url" required placeholder="https://youtube.com/live/..." value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: 'none', color: 'white', outline: 'none' }} />
                    </div>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '8px', padding: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 1rem', color: '#a78bfa' }}>Custom APK Configuration</h4>
                    <p style={{ margin: '0 0 1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      To analyze video from your custom app in real-time, configure your app to push WebRTC/video chunks to the following API endpoint using this unique stream key.
                    </p>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>API Ingest URL</label>
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px', fontFamily: 'monospace', color: '#10b981', wordBreak: 'break-all' }}>
                        https://tees.bodhiplus.com/api/stream/ingest
                      </div>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Stream Key</label>
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px', fontFamily: 'monospace', color: '#f59e0b', fontSize: '1.1rem', letterSpacing: '1px' }}>
                        {streamKey}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* COMMON FIELDS */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Class ID (Optional)
              </label>
              <input type="number" placeholder="e.g. 101" value={classId} onChange={(e) => setClassId(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" onClick={() => navigate('/')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', flex: 1 }}>
                Cancel
              </button>
              <button className="btn" type="submit" disabled={loading || (activeTab === 'upload' && !file)} style={{ flex: 2 }}>
                {loading ? 'Starting...' : (activeTab === 'live' ? 'Start Live Monitoring' : 'Analyze Content')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
