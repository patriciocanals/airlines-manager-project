import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import Home from './components/Home.jsx';
import Login from './components/Login.jsx';
import RouteCalculator from './components/RouteCalculator.jsx';
import RouteManager from './components/RouteManager.jsx';
import { Container } from '@mui/material';

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Container maxWidth="lg">
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
        <Route path="/calculator" element={user ? <RouteCalculator /> : <Navigate to="/login" />} />
        <Route path="/routes" element={user ? <RouteManager /> : <Navigate to="/login" />} />
      </Routes>
    </Container>
  );
}

export default App;