import { AppBar, Toolbar, Typography, Button, Box, Alert, Avatar } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';

function Header() {
    const location = useLocation();
    const [logoutError, setLogoutError] = useState('');
    const { settings } = useSettings();

    const handleLogout = async () => {
        setLogoutError('');
        try {
            await auth.signOut();
        } catch (err) {
            console.error('Error signing out:', err);
            setLogoutError(`Failed to log out: ${err.message}`);
        }
    };

    return (
        <Box>
            <AppBar position="static" sx={{ bgcolor: settings.headerColor, boxShadow: '0 4px 8px rgba( | Assistant: 0,0,0,0.2)' }}>
                <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {settings.logoUrl ? (
                            <Avatar
                                src={settings.logoUrl}
                                alt={settings.airlineName}
                                sx={{ width: 40, height: 40, mr: 1 }}
                                variant="square"
                            />
                        ) : (
                            <Typography
                                variant="h6"
                                component={Link}
                                to="/"
                                sx={{ textDecoration: 'none', color: 'white', fontWeight: 'bold' }}
                            >
                                {settings.airlineName}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            color="inherit"
                            component={Link}
                            to="/"
                            sx={{
                                textTransform: 'none',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                                bgcolor: location.pathname === '/' ? 'rgba(255,255,255,0.2)' : 'transparent',
                            }}
                        >
                            Home
                        </Button>
                        <Button
                            color="inherit"
                            component={Link}
                            to="/calculator"
                            sx={{
                                textTransform: 'none',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                                bgcolor: location.pathname === '/calculator' ? 'rgba(255,255,255,0.2)' : 'transparent',
                            }}
                        >
                            Route Calculator
                        </Button>
                        <Button
                            color="inherit"
                            component={Link}
                            to="/routes"
                            sx={{
                                textTransform: 'none',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                                bgcolor: location.pathname === '/routes' ? 'rgba(255,255,255,0.2)' : 'transparent',
                            }}
                        >
                            Manage Routes
                        </Button>
                        {auth.currentUser && (
                            <Button
                                color="inherit"
                                component={Link}
                                to="/customization"
                                sx={{
                                    textTransform: 'none',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                                    bgcolor: location.pathname === '/customization' ? 'rgba(255,255,255,0.2)' : 'transparent',
                                }}
                            >
                                Customization
                            </Button>
                        )}
                        {auth.currentUser ? (
                            <Button
                                color="inherit"
                                onClick={handleLogout}
                                sx={{
                                    textTransform: 'none',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                                }}
                            >
                                Logout
                            </Button>
                        ) : (
                            <Button
                                color="inherit"
                                component={Link}
                                to="/login"
                                sx={{
                                    textTransform: 'none',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                                    bgcolor: location.pathname === '/login' ? 'rgba(255,255,255,0.2)' : 'transparent',
                                }}
                            >
                                Login
                            </Button>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>
            {logoutError && (
                <Alert severity="error" sx={{ m: 2 }} onClose={() => setLogoutError('')}>
                    {logoutError}
                </Alert>
            )}
        </Box>
    );
}

export default Header;