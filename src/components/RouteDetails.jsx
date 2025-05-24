import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Box, Typography, Alert, Container, Button } from '@mui/material';
import { Link } from 'react-router-dom';

function RouteDetails() {
    const { id } = useParams();
    const [route, setRoute] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRoute = async () => {
            setError('');
            if (!auth.currentUser) {
                setError('Please log in to view route details');
                return;
            }
            try {
                const routeRef = doc(db, `users/${auth.currentUser.uid}/routes`, id);
                const routeSnap = await getDoc(routeRef);
                if (routeSnap.exists()) {
                    setRoute({ id: routeSnap.id, ...routeSnap.data() });
                } else {
                    setError('Route not found');
                }
            } catch (err) {
                console.error('Error fetching route:', err);
                setError(`Failed to load route: ${err.message}`);
            }
        };
        fetchRoute();
    }, [id]);

    if (!route && !error) return null;

    return (
        <Container sx={{ py: 4 }}>
            <Typography variant="h5" gutterBottom>
                Route Details
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {route && (
                <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                    <Typography variant="h6">
                        {route.origin} ({route.originIata}) to {route.destination} ({route.destinationIata})
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                        <strong>Aircraft:</strong> {route.plane}
                    </Typography>
                    <Typography variant="body1">
                        <strong>Weekly Frequencies:</strong> {route.dailyTrips * 7} flights
                    </Typography>
                    <Typography variant="body1">
                        <strong>Daily Flights:</strong> {route.dailyTrips} round trips
                    </Typography>
                    <Typography variant="body1">
                        <strong>Distance:</strong> {route.distance} km
                    </Typography>
                    <Typography variant="body1">
                        <strong>Airport Category:</strong> {route.airportCategory}
                    </Typography>
                    <Typography variant="body1">
                        <strong>Turnaround Time:</strong> {route.turnaroundTime} hours
                    </Typography>
                    <Typography variant="body1">
                        <strong>Using Two Planes:</strong> {route.useTwoPlanes ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="body1">
                        <strong>Registrations:</strong> {route.registration}{route.registration2 ? `, ${route.registration2}` : ''}
                    </Typography>
                    <Typography variant="body1">
                        <strong>Seat Config:</strong> Economy: {route.seatConfig.economy}, Business: {route.seatConfig.business}, First: {route.seatConfig.first}
                    </Typography>
                    <Typography variant="body1">
                        <strong>Ticket Prices:</strong> Economy: ${route.ticketPrices.economy}, Business: ${route.ticketPrices.business}, First: ${route.ticketPrices.first}
                    </Typography>
                    <Typography variant="body1">
                        <strong>Cargo Demand:</strong> {route.demand.cargo} tons
                    </Typography>
                    {route.notes && (
                        <Typography variant="body1">
                            <strong>Notes:</strong> {route.notes}
                        </Typography>
                    )}
                    {route.destinationPhotoURL && (
                        <Box sx={{ mt: 2 }}>
                            <img src={route.destinationPhotoURL} alt="Destination" style={{ maxWidth: '100%', height: 'auto' }} />
                        </Box>
                    )}
                    <Button
                        variant="contained"
                        component={Link}
                        to="/routes"
                        sx={{ mt: 2 }}
                    >
                        Back to Routes
                    </Button>
                </Box>
            )}
        </Container>
    );
}

export default RouteDetails;