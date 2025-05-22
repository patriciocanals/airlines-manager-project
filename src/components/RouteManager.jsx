import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Box, Typography, Button, TextField, Card, CardContent, CardActions, IconButton, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { airplanes } from '../assets/planes.js';

function RouteManager() {
    const [routes, setRoutes] = useState([]);
    const [editingRoute, setEditingRoute] = useState(null);
    const [formData, setFormData] = useState({ origin: '', destination: '', plane: '', planePhotoURL: '', destinationPhotoURL: '' });
    const [coordinates, setCoordinates] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRoutes = async () => {
            try {
                setLoading(true);
                const querySnapshot = await getDocs(collection(db, `users/${auth.currentUser.uid}/routes`));
                const routesData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setRoutes(routesData);

                // Obtener coordenadas para cada destino
                for (const route of routesData) {
                    if (!coordinates[route.destination]) {
                        try {
                            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(route.destination)}&format=json`);
                            const data = await response.json();
                            if (data[0]) {
                                setCoordinates((prev) => ({
                                    ...prev,
                                    [route.destination]: [parseFloat(data[0].lat), parseFloat(data[0].lon)],
                                }));
                            }
                        } catch (err) {
                            console.error(`Error fetching coordinates for ${route.destination}:`, err);
                        }
                    }
                }
            } catch (err) {
                setError('Failed to load routes: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchRoutes();
    }, []);

    const handleEdit = (route) => {
        setEditingRoute(route.id);
        setFormData({
            origin: route.origin,
            destination: route.destination,
            plane: route.plane,
            planePhotoURL: route.planePhotoURL || '',
            destinationPhotoURL: route.destinationPhotoURL || '',
        });
    };

    const handleUpdate = async (id) => {
        try {
            await updateDoc(doc(db, `users/${auth.currentUser.uid}/routes`, id), formData);
            setEditingRoute(null);
            setFormData({ origin: '', destination: '', plane: '', planePhotoURL: '', destinationPhotoURL: '' });
            const querySnapshot = await getDocs(collection(db, `users/${auth.currentUser.uid}/routes`));
            setRoutes(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            setError('Route updated successfully');
        } catch (err) {
            setError('Failed to update route: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, `users/${auth.currentUser.uid}/routes`, id));
            setRoutes(routes.filter((route) => route.id !== id));
            setError('Route deleted successfully');
        } catch (err) {
            setError('Failed to delete route: ' + err.message);
        }
    };

    const getPlaneImage = (planeName) => {
        const plane = airplanes.find((p) => `${p.brand} ${p.model}` === planeName);
        return plane && plane.img ? `/images/${plane.img}` : '';
    };

    return (
        <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h5" gutterBottom>
                Manage Destinations
            </Typography>
            {error && <Alert severity={error.includes('successfully') ? 'success' : 'error'} sx={{ mb: 2 }}>{error}</Alert>}
            {loading ? (
                <Typography>Loading routes...</Typography>
            ) : routes.length === 0 ? (
                <Typography>No routes found.</Typography>
            ) : (
                routes.map((route) => (
                    <Card key={route.id} sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6">{route.origin} to {route.destination}</Typography>
                            <Typography>Plane: {route.plane}</Typography>
                            <Typography>
                                Demand: {route.demand.economy} Economy, {route.demand.business} Business, {route.demand.first} First,{' '}
                                {route.demand.cargo} Cargo
                            </Typography>
                            {getPlaneImage(route.plane) && <img src={getPlaneImage(route.plane)} alt={route.plane} style={{ maxWidth: '100%', height: 'auto' }} />}
                            {route.destinationPhotoURL && (
                                <img src={route.destinationPhotoURL} alt="Destination" style={{ maxWidth: '100%', height: 'auto' }} />
                            )}
                            {coordinates[route.destination] && (
                                <MapContainer center={coordinates[route.destination]} zoom={13} style={{ height: '200px', marginTop: '10px' }}>
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    />
                                    <Marker position={coordinates[route.destination]}>
                                        <Popup>{route.destination}</Popup>
                                    </Marker>
                                </MapContainer>
                            )}
                        </CardContent>
                        <CardActions>
                            <IconButton onClick={() => handleEdit(route)}>
                                <EditIcon />
                            </IconButton>
                            <IconButton onClick={() => handleDelete(route.id)}>
                                <DeleteIcon />
                            </IconButton>
                        </CardActions>
                        {editingRoute === route.id && (
                            <Box sx={{ p: 2 }}>
                                <TextField
                                    label="Origin"
                                    value={formData.origin}
                                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                                    fullWidth
                                    margin="normal"
                                />
                                <TextField
                                    label="Destination"
                                    value={formData.destination}
                                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                    fullWidth
                                    margin="normal"
                                />
                                <TextField
                                    label="Plane"
                                    value={formData.plane}
                                    onChange={(e) => setFormData({ ...formData, plane: e.target.value })}
                                    fullWidth
                                    margin="normal"
                                />
                                <TextField
                                    label="Plane Photo URL"
                                    value={formData.planePhotoURL}
                                    onChange={(e) => setFormData({ ...formData, planePhotoURL: e.target.value })}
                                    fullWidth
                                    margin="normal"
                                />
                                <TextField
                                    label="Destination Photo URL"
                                    value={formData.destinationPhotoURL}
                                    onChange={(e) => setFormData({ ...formData, destinationPhotoURL: e.target.value })}
                                    fullWidth
                                    margin="normal"
                                />
                                <Button variant="contained" onClick={() => handleUpdate(route.id)} fullWidth sx={{ mt: 2 }}>
                                    Update Route
                                </Button>
                            </Box>
                        )}
                    </Card>
                ))
            )}
        </Box>
    );
}

export default RouteManager;