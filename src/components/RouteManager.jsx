import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Box, Typography, Button, TextField, Card, CardContent, CardActions, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function RouteManager() {
    const [routes, setRoutes] = useState([]);
    const [editingRoute, setEditingRoute] = useState(null);
    const [formData, setFormData] = useState({ origin: '', destination: '', plane: '', planePhotoURL: '', destinationPhotoURL: '' });

    useEffect(() => {
        const fetchRoutes = async () => {
            const querySnapshot = await getDocs(collection(db, `users/${auth.currentUser.uid}/routes`));
            const routesData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setRoutes(routesData);
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
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, `users/${auth.currentUser.uid}/routes`, id));
            setRoutes(routes.filter((route) => route.id !== id));
        } catch (err) {
            console.error(err);
        }
    }; return (
        <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h5" gutterBottom>
                Manage Destinations
            </Typography>
            {routes.map((route) => (
                <Card key={route.id} sx={{ mb: 2 }}>
                    <CardContent>
                        <Typography variant="h6">{route.origin} to {route.destination}</Typography>
                        <Typography>Plane: {route.plane}</Typography>
                        {route.planePhotoURL && <img src={route.planePhotoURL} alt="Plane" style={{ maxWidth: '100%', height: 'auto' }} />}
                        {route.destinationPhotoURL && <img src={route.destinationPhotoURL} alt="Destination" style={{ maxWidth: '100%', height: 'auto' }} />}
                        <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '200px', marginTop: '10px' }}>
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <Marker position={[51.505, -0.09]}>
                                <Popup>{route.destination}</Popup>
                            </Marker>
                        </MapContainer>
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
            ))}
        </Box>
    );
}

export default RouteManager;