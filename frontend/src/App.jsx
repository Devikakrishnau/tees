import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import VideoUpload from './pages/VideoUpload';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import WeeklyReport from './pages/WeeklyReport';
import LiveAnalysis from './pages/LiveAnalysis';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    if (localStorage.getItem('token')) {
      setIsAuthenticated(true);
      setUserRole(localStorage.getItem('role') || '');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setIsAuthenticated(false);
    setUserRole('');
  };

  return (
    <Router>
      <div className="container">
        {isAuthenticated && (
          <nav className="navbar animate-fade-in">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="nav-brand">
                <span className="text-gradient">TEES</span> Analytics
              </div>
            </Link>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {userRole === 'Super Admin' && (
                <Link to="/admin">
                  <button className="btn" style={{ background: 'rgba(139, 92, 246, 0.2)', color: 'white', border: '1px solid rgba(139, 92, 246, 0.5)' }}>Manage Users</button>
                </Link>
              )}
              {userRole !== 'Student' && (
                <Link to="/upload">
                  <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>New Analysis</button>
                </Link>
              )}
              <button className="btn" onClick={handleLogout}>Sign Out</button>
            </div>
          </nav>
        )}
        
        <Routes>
          <Route 
            path="/login" 
            element={!isAuthenticated ? <Login setAuth={(status) => { setIsAuthenticated(status); setUserRole(localStorage.getItem('role')); }} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/upload" 
            element={isAuthenticated && userRole !== 'Student' ? <VideoUpload /> : <Navigate to={userRole === 'Student' ? "/student" : "/login"} />} 
          />
          <Route 
            path="/live/:streamKey" 
            element={isAuthenticated && userRole !== 'Student' ? <LiveAnalysis /> : <Navigate to={userRole === 'Student' ? "/student" : "/login"} />} 
          />
          <Route 
            path="/admin" 
            element={isAuthenticated && userRole === 'Super Admin' ? <AdminDashboard /> : <Navigate to="/" />} 
          />
          <Route 
            path="/student" 
            element={isAuthenticated && userRole === 'Student' ? <StudentDashboard /> : <Navigate to="/" />} 
          />
          <Route 
            path="/report" 
            element={isAuthenticated && userRole !== 'Student' ? <WeeklyReport /> : <Navigate to="/" />} 
          />
          <Route 
            path="/" 
            element={
              isAuthenticated 
                ? (userRole === 'Student' ? <Navigate to="/student" /> : <Dashboard />) 
                : <Navigate to="/login" />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
