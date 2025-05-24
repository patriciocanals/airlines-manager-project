import { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import RouteCalculator from './components/RouteCalculator';
import RouteManager from './components/RouteManager';
import Login from './components/Login';
import Home from './components/Home';
import Header from './components/Header';
import Customization from './components/Customization';
import RouteDetails from './components/RouteDetails';
import { Box } from '@mui/material';

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        if (window.location.pathname === '/login') {
          navigate('/', { replace: true });
        }
      } else {
        if (!['/login', '/signup'].includes(window.location.pathname)) {
          navigate('/login', { replace: true });
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  return (
    <>
      <Header />
      <Box sx={{ mt: 2 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/calculator" element={<RouteCalculator />} />
          <Route path="/routes" element={<RouteManager />} />
          <Route path="/login" element={<Login />} />
          <Route path="/customization" element={<Customization />} />
          <Route path="/route/:id" element={<RouteDetails />} />
        </Routes>
      </Box>
    </>
  );
}

export default App;