import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { airplanes } from '../assets/planes.js'; // Usa 'airplanes' desde planes.js
import { TextField, Button, Box, Typography, MenuItem, Select, InputLabel, Alert } from '@mui/material';

function RouteCalculator() {
    const [demand, setDemand] = useState({ economy: 0, business: 0, first: 0, cargo: 0 });
    const [route, setRoute] = useState({ origin: '', destination: '', plane: '' });
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleCalculate = () => {
        const plane = airplanes.find((p) => `${p.brand} ${p.model}` === route.plane); // Usa 'airplanes'
        if (!plane) {
            setError('Please select a plane');
            return;
        }

        const { economy, business, first, cargo } = demand;
        const planeCapacity = {
            economy: plane.pax,
            business: Math.floor(plane.pax / 2),
            first: Math.floor(plane.pax / 4),
            cargo: 0, // No hay datos de carga en el JSON
        };

        const tripsNeeded = Math.max(
            Math.ceil(economy / planeCapacity.economy),
            Math.ceil(business / planeCapacity.business),
            Math.ceil(first / planeCapacity.first),
            Math.ceil(cargo / planeCapacity.cargo || 1) // Evita división por cero
        );

        setResult({
            plane: `${plane.brand} ${plane.model}`,
            trips: tripsNeeded,
            totalPassengers: economy + business * 2 + first * 4,
            totalCargo: cargo,
            img: plane.img,
        });
        setError('');
    };

    const handleSaveRoute = async () => {
        if (!route.origin || !route.destination || !route.plane) {
            setError('Please fill all fields');
            return;
        }
        try {
            await addDoc(collection(db, `users/${auth.currentUser.uid}/routes`), {
                origin: route.origin,
                destination: route.destination,
                plane: route.plane,
                demand: demand,
                planePhotoURL: getPlaneImage(route.plane),
                createdAt: new Date(),
            });
            localStorage.setItem('lastRoute', JSON.stringify({ ...route, demand }));
            setRoute({ origin: '', destination: '', plane: '' });
            setDemand({ economy: 0, business: 0, first: 0, cargo: 0 });
            setResult(null);
            setError('Route saved successfully');
        } catch (err) {
            setError(err.message);
        }
    };

    const getPlaneImage = (planeName) => {
        const plane = airplanes.find((p) => `${p.brand} ${p.model}` === planeName); // Usa 'airplanes'
        return plane && plane.img ? `/images/${plane.img}` : '';
    };

    return (
        <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h5" gutterBottom>
                Route Calculator
            </Typography>
            {error && <Alert severity={error.includes('successfully') ? 'success' : 'error'} sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
                label="Origin"
                value={route.origin}
                onChange={(e) => setRoute({ ...route, origin: e.target.value })}
                fullWidth
                margin="normal"
            />
            <TextField
                label="Destination"
                value={route.destination}
                onChange={(e) => setRoute({ ...route, destination: e.target.value })}
                fullWidth
                margin="normal"
            />
            <InputLabel id="plane-select-label">Select Plane</InputLabel>
            <Select
                labelId="plane-select-label"
                value={route.plane}
                onChange={(e) => setRoute({ ...route, plane: e.target.value })}
                fullWidth
                sx={{ mb: 2 }}
            >
                <MenuItem value="">Select a plane</MenuItem>
                {airplanes.map((plane) => ( // Usa 'airplanes'
                    <MenuItem key={`${plane.brand} ${plane.model}`} value={`${plane.brand} ${plane.model}`}>
                        {plane.brand} {plane.model} ({plane.pax} seats)
                    </MenuItem>
                ))}
            </Select>
            <TextField
                label="Economy Demand"
                type="number"
                value={demand.economy}
                onChange={(e) => setDemand({ ...demand, economy: Number(e.target.value) })}
                fullWidth
                margin="normal"
            />
            <TextField
                label="Business Demand"
                type="number"
                value={demand.business}
                onChange={(e) => setDemand({ ...demand, business: Number(e.target.value) })}
                fullWidth
                margin="normal"
            />
            <TextField
                label="First Demand"
                type="number"
                value={demand.first}
                onChange={(e) => setDemand({ ...demand, first: Number(e.target.value) })}
                fullWidth
                margin="normal"
            />
            <TextField
                label="Cargo Demand"
                type="number"
                value={demand.cargo}
                onChange={(e) => setDemand({ ...demand, cargo: Number(e.target.value) })}
                fullWidth
                margin="normal"
            />
            <Button variant="contained" onClick={handleCalculate} fullWidth sx={{ mt: 2 }}>
                Calculate
            </Button>
            {result && (
                <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
                    <Typography><strong>Plane:</strong> {result.plane}</Typography>
                    <Typography><strong>Trips Needed:</strong> {result.trips}</Typography>
                    <Typography><strong>Total Passengers:</strong> {result.totalPassengers}</Typography>
                    <Typography><strong>Total Cargo:</strong> {result.totalCargo}</Typography>
                    {result.img && <img src={`/images/${result.img}`} alt={result.plane} style={{ maxWidth: '100%', height: 'auto' }} />}
                    <Button variant="contained" onClick={handleSaveRoute} fullWidth sx={{ mt: 2 }}>
                        Save Route
                    </Button>
                </Box>
            )}
        </Box>
    );
}

export default RouteCalculator;