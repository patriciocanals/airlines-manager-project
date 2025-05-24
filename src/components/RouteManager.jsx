import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import {
    Box,
    Typography,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
} from '@mui/material';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Static airport coordinates (extend as needed)
const airportCoords = {
    MAD: { name: 'Madrid-Barajas', lat: 40.4719, lng: -3.5626 },
    SVQ: { name: 'Sevilla', lat: 37.4180, lng: -5.8931 },
    BCN: { name: 'Barcelona-El Prat', lat: 41.2971, lng: 2.0785 },
    // Add more airports as needed
};

function RouteManager() {
    const [routes, setRoutes] = useState([]);
    const [error, setError] = useState('');
    const [editRoute, setEditRoute] = useState(null);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [editData, setEditData] = useState({
        origin: '',
        originIata: '',
        destination: '',
        destinationIata: '',
        plane: '',
        dailyTrips: 0,
        notes: '',
    });

    useEffect(() => {
        const fetchRoutes = async () => {
            setError('');
            if (!auth.currentUser) {
                setError('Please log in to view routes');
                return;
            }
            try {
                const routesRef = collection(db, `users/${auth.currentUser.uid}/routes`);
                const querySnapshot = await getDocs(routesRef);
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

    const handleDelete = async (id) => {
        if (!auth.currentUser) {
            setError('You must be logged in to delete a route');
            return;
        }
        try {
            await deleteDoc(doc(db, `users/${auth.currentUser.uid}/routes`, id));
            setRoutes(routes.filter((route) => route.id !== id));
            setError('Route deleted successfully');
        } catch (err) {
            console.error('Error deleting route:', err);
            setError(`Failed to delete route: ${err.message}`);
        }
    };

    const handleOpenEditModal = (route) => {
        setEditRoute(route);
        setEditData({
            origin: route.origin,
            originIata: route.originIata,
            destination: route.destination,
            destinationIata: route.destinationIata,
            plane: route.plane,
            dailyTrips: route.dailyTrips,
            notes: route.notes || '',
        });
        setOpenEditModal(true);
    };

    const handleCloseEditModal = () => {
        setOpenEditModal(false);
        setEditRoute(null);
        setEditData({
            origin: '',
            originIata: '',
            destination: '',
            destinationIata: '',
            plane: '',
            dailyTrips: 0,
            notes: '',
        });
    };

    const handleEdit = async () => {
        if (!auth.currentUser) {
            setError('You must be logged in to edit a route');
            return;
        }
        if (!editData.origin || !editData.originIata || !editData.destination || !editData.destinationIata || !editData.plane || editData.dailyTrips <= 0) {
            setError('Please fill all required fields with valid values');
            return;
        }
        if (!/^[A-Z]{3}$/.test(editData.originIata) || !/^[A-Z]{3}$/.test(editData.destinationIata)) {
            setError('IATA codes must be 3 uppercase letters');
            return;
        }
        try {
            const routeRef = doc(db, `users/${auth.currentUser.uid}/routes`, editRoute.id);
            await updateDoc(routeRef, {
                origin: editData.origin,
                originIata: editData.originIata,
                destination: editData.destination,
                destinationIata: editData.destinationIata,
                plane: editData.plane,
                dailyTrips: Number(editData.dailyTrips),
                notes: editData.notes,
            });
            setRoutes(
                routes.map((route) =>
                    route.id === editRoute.id ? { ...route, ...editData, dailyTrips: Number(editData.dailyTrips) } : route
                )
            );
            setOpenEditModal(false);
            setError('Route updated successfully');
        } catch (err) {
            console.error('Error updating route:', err);
            setError(`Failed to update route: ${err.message}`);
        }
    };

    return (
        <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
            <Typography variant="h5" gutterBottom>
                Manage Routes
            </Typography>
            {error && <Alert severity={error.includes('successfully') ? 'success' : 'error'} sx={{ mb: 2 }}>{error}</Alert>}
            {routes.length > 0 && (
                <Box sx={{ mb: 4, height: 400 }}>
                    <MapContainer center={[40, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        {routes.map((route) => {
                            const origin = airportCoords[route.originIata];
                            const destination = airportCoords[route.destinationIata];
                            if (!origin || !destination) return null;
                            const positions = [
                                [origin.lat, origin.lng],
                                [destination.lat, destination.lng],
                            ];
                            return (
                                <Box key={route.id}>
                                    <Polyline positions={positions} color="blue" />
                                    <Marker position={[origin.lat, origin.lng]}>
                                        <Popup>{route.origin} ({route.originIata})</Popup>
                                    </Marker>
                                    <Marker position={[destination.lat, destination.lng]}>
                                        <Popup>{route.destination} ({route.destinationIata})</Popup>
                                    </Marker>
                                </Box>
                            );
                        })}
                    </MapContainer>
                </Box>
            )}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Origin</TableCell>
                            <TableCell>Destination</TableCell>
                            <TableCell>Plane</TableCell>
                            <TableCell>Daily Trips</TableCell>
                            <TableCell>Notes</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {routes.map((route) => (
                            <TableRow key={route.id}>
                                <TableCell>
                                    {route.origin} ({route.originIata})
                                </TableCell>
                                <TableCell>
                                    {route.destination} ({route.destinationIata})
                                </TableCell>
                                <TableCell>{route.plane}</TableCell>
                                <TableCell>{route.dailyTrips}</TableCell>
                                <TableCell>{route.notes || '-'}</TableCell>
                                <TableCell>
                                    <Button onClick={() => handleOpenEditModal(route)} sx={{ mr: 1 }}>
                                        Edit
                                    </Button>
                                    <Button onClick={() => handleDelete(route.id)} color="error">
                                        Delete
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Dialog open={openEditModal} onClose={handleCloseEditModal}>
                <DialogTitle>Edit Route</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Origin Airport"
                        value={editData.origin}
                        onChange={(e) => setEditData({ ...editData, origin: e.target.value })}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Origin IATA"
                        value={editData.originIata}
                        onChange={(e) => setEditData({ ...editData, originIata: e.target.value.toUpperCase() })}
                        fullWidth
                        margin="normal"
                        inputProps={{ maxLength: 3 }}
                    />
                    <TextField
                        label="Destination Airport"
                        value={editData.destination}
                        onChange={(e) => setEditData({ ...editData, destination: e.target.value })}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Destination IATA"
                        value={editData.destinationIata}
                        onChange={(e) => setEditData({ ...editData, destinationIata: e.target.value.toUpperCase() })}
                        fullWidth
                        margin="normal"
                        inputProps={{ maxLength: 3 }}
                    />
                    <TextField
                        label="Plane"
                        value={editData.plane}
                        onChange={(e) => setEditData({ ...editData, plane: e.target.value })}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Daily Trips"
                        type="number"
                        value={editData.dailyTrips}
                        onChange={(e) => setEditData({ ...editData, dailyTrips: Number(e.target.value) })}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Notes"
                        value={editData.notes}
                        onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                        fullWidth
                        margin="normal"
                        multiline
                        rows={3}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditModal}>Cancel</Button>
                    <Button onClick={handleEdit} variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default RouteManager;