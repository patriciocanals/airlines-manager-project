import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import {
    Box,
    Typography,
    Alert,
    Card,
    CardMedia,
    CardContent,
    IconButton,
    Container,
    Button,
} from '@mui/material';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

function Home() {
    const [routes, setRoutes] = useState([]);
    const [error, setError] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const { settings } = useSettings();

    useEffect(() => {
        const fetchRoutes = async () => {
            setError('');
            if (!auth.currentUser) {
                setError('Please log in to view recent destinations');
                return;
            }

            try {
                const routesRef = collection(db, `users/${auth.currentUser.uid}/routes`);
                const q = query(routesRef, orderBy('createdAt', 'desc'), limit(6));
                const querySnapshot = await getDocs(q);
                const routesData = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setRoutes(routesData);
            } catch (err) {
                console.error('Error fetching routes:', err);
                setError(`Failed to load routes: ${err.message}`);
            }
        };

        fetchRoutes();
    }, []);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % Math.max(routes.length, 1));
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + routes.length) % Math.max(routes.length, 1));
    };

    useEffect(() => {
        const interval = setInterval(() => {
            handleNext();
        }, 5000);
        return () => clearInterval(interval);
    }, [routes.length]);

    const formatAirport = (name, iata) => `${name} (${iata})`;

    return (
        <Container sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4, fontWeight: 'bold' }}>
                Discover {settings.airlineName}'s Latest Destinations
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {routes.length === 0 && !error && (
                <Typography variant="body1" align="center">
                    No routes available. Create one in the <Link to="/calculator">Route Calculator</Link>.
                </Typography>
            )}
            {routes.length > 0 && (
                <Box sx={{ position: 'relative', maxWidth: 800, mx: 'auto' }}>
                    <Box sx={{ overflow: 'hidden' }}>
                        <Box
                            sx={{
                                display: 'flex',
                                transform: `translateX(-${currentIndex * 100}%)`,
                                transition: 'transform 0.5s ease',
                            }}
                        >
                            {routes.map((route) => (
                                <Box key={route.id} sx={{ minWidth: '100%', p: 2 }}>
                                    <Card sx={{ maxWidth: 600, mx: 'auto', boxShadow: 3 }}>
                                        <CardMedia
                                            component="img"
                                            height="300"
                                            image={route.destinationPhotoURL || '/images/fallback.jpg'}
                                            alt={`${route.destination} photo`}
                                            sx={{ objectFit: 'cover' }}
                                        />
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                {formatAirport(route.origin, route.originIata)} to{' '}
                                                {formatAirport(route.destination, route.destinationIata)}
                                            </Typography>
                                            <Typography variant="body1">
                                                <strong>Daily Flights:</strong> {route.dailyTrips /2}
                                            </Typography>
                                            <Typography variant="body1">
                                                <strong>Weekly Frequencies:</strong> {(route.dailyTrips / 2) * 7} flights
                                            </Typography>
                                            <Typography variant="body1">
                                                <strong>Aircraft:</strong> {route.plane}
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                component={Link}
                                                to={`/route/${route.id}`}
                                                sx={{ mt: 2 }}
                                            >
                                                View Route Details
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                    <IconButton
                        onClick={handlePrev}
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: 0,
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                        }}
                    >
                        <ArrowBackIos />
                    </IconButton>
                    <IconButton
                        onClick={handleNext}
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            right: 0,
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                        }}
                    >
                        <ArrowForwardIos />
                    </IconButton>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        {routes.map((_, index) => (
                            <Box
                                key={index}
                                sx={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    bgcolor: index === currentIndex ? settings.headerColor : 'grey.400',
                                    mx: 0.5,
                                    cursor: 'pointer',
                                }}
                                onClick={() => setCurrentIndex(index)}
                            />
                        ))}
                    </Box>
                </Box>
            )}
        </Container>
    );
}

export default Home;