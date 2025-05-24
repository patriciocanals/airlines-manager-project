import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { Box, Typography, TextField, Button, Alert, Divider } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import GoogleIcon from '@mui/icons-material/Google';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                navigate('/', { replace: true });
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleEmailLogin = async () => {
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setError('Login successful');
        } catch (err) {
            console.error('Email login error:', err);
            setError(`Failed to log in: ${err.message}`);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            setError('Login successful');
        } catch (err) {
            console.error('Google login error:', err);
            setError(`Failed to log in: ${err.message}`);
        }
    };

    return (
        <Box sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 4 }}>
            <Typography variant="h5" gutterBottom align="center">
                Login
            </Typography>
            {error && <Alert severity={error.includes('successful') ? 'success' : 'error'} sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                margin="normal"
                variant="outlined"
            />
            <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                margin="normal"
                variant="outlined"
            />
            <Button
                variant="contained"
                onClick={handleEmailLogin}
                fullWidth
                sx={{ mt: 2, mb: 2 }}
            >
                Log In with Email
            </Button>
            <Divider sx={{ my: 2 }}>OR</Divider>
            <Button
                variant="outlined"
                onClick={handleGoogleLogin}
                fullWidth
                startIcon={<GoogleIcon />}
                sx={{ mb: 2 }}
            >
                Log In with Google
            </Button>
            <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                Don't have an account? <Link to="/signup">Sign Up</Link>
            </Typography>
        </Box>
    );
}

export default Login;