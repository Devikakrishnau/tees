import { useState, useEffect } from 'react';
import { BookOpen, Video, Calendar } from 'lucide-react';

export default function StudentDashboard() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mocking the enrolled classes for the student MVP view
  useEffect(() => {
    setTimeout(() => {
      setClasses([
        { id: 101, title: 'Introduction to Physics', teacher: 'Dr. Smith', next_session: 'Today, 2:00 PM', recordings: 12 },
        { id: 102, title: 'Advanced Calculus', teacher: 'Prof. Johnson', next_session: 'Tomorrow, 10:00 AM', recordings: 8 },
        { id: 105, title: 'World History', teacher: 'Mrs. Davis', next_session: 'Friday, 1:00 PM', recordings: 24 },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
        <div style={{ color: 'var(--accent-primary)', fontSize: '1.5rem' }}>Loading your classes...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Student Portal</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Welcome back! Here are your enrolled classes.</p>
      </header>

      <div className="dashboard-grid">
        {classes.map(cls => (
          <div key={cls.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>{cls.title}</h3>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{cls.teacher}</span>
              </div>
              <BookOpen size={24} color="var(--accent-secondary)" />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <Calendar size={16} /> Next Session: {cls.next_session}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <Video size={16} /> {cls.recordings} Recorded Lectures
              </div>
            </div>
            
            <button className="btn" style={{ marginTop: 'auto', padding: '0.5rem', width: '100%', background: 'rgba(255,255,255,0.1)' }}>
              Enter Class
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
