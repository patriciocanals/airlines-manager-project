import { useState } from 'react';
import { Box, Typography, TextField, Button, Alert, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel } from '@mui/material';
import { useSettings } from '../context/SettingsContext';
import { auth } from '../firebase';

function Customization() {
    const { settings, updateSettings } = useSettings();
    const [formData, setFormData] = useState(settings);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('defaultOrigin')) {
            const key = name.split('.')[1];
            setFormData({ ...formData, defaultOrigin: { ...formData.defaultOrigin, [key]: value } });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleDarkModeToggle = (e) => {
        setFormData({ ...formData, darkMode: e.target.checked });
    };

    const handleSave = async () => {
        setError('');
        if (!auth.currentUser) {
            setError('You must be logged in to save settings');
            return;
        }
        if (!formData.airlineName) {
            setError('Airline name is required');
            return;
        }
        if (!/^[A-Z]{3}$/.test(formData.defaultOrigin.iata)) {
            setError('IATA code must be 3 uppercase letters');
            return;
        }
        if (!formData.defaultOrigin.name) {
            setError('Default origin airport name is required');
            return;
        }
        if (formData.logoUrl && !/^https?:\/\/\S+\.(png|jpg|jpeg)$/i.test(formData.logoUrl)) {
            setError('Logo URL must be a valid PNG, JPG, or JPEG');
            return;
        }
        try {
            await updateSettings(formData);
            setError('Settings saved successfully');
        } catch (err) {
            setError(`Failed to save settings: ${err.message}`);
        }
    };

    return (
        <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h5" gutterBottom>
                Customization
            </Typography>
            {error && <Alert severity={error.includes('successfully') ? 'success' : 'error'} sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
                label="Airline Name"
                name="airlineName"
                value={formData.airlineName}
                onChange={handleChange}
                fullWidth
                margin="normal"
            />
            <TextField
                label="Header Color (Hex)"
                name="headerColor"
                value={formData.headerColor}
                onChange={handleChange}
                fullWidth
                margin="normal"
                type="color"
            />
            <FormControlLabel
                control={<Switch checked={formData.darkMode} onChange={handleDarkModeToggle} />}
                label="Dark Mode"
            />
            <TextField
                label="Logo URL (PNG/JPG/JPEG)"
                name="logoUrl"
                value={formData.logoUrl}
                onChange={handleChange}
                fullWidth
                margin="normal"
            />
            <TextField
                label="Default Origin Airport (e.g., Madrid-Barajas)"
                name="defaultOrigin.name"
                value={formData.defaultOrigin.name}
                onChange={handleChange}
                fullWidth
                margin="normal"
            />
            <TextField
                label="Default Origin IATA (e.g., MAD)"
                name="defaultOrigin.iata"
                value={formData.defaultOrigin.iata}
                onChange={handleChange}
                fullWidth
                margin="normal"
                inputProps={{ maxLength: 3 }}
            />
            <FormControl fullWidth margin="normal">
                <InputLabel>Currency</InputLabel>
                <Select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                >
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                    <MenuItem value="GBP">GBP</MenuItem>
                </Select>
            </FormControl>
            <Button
                variant="contained"
                onClick={handleSave}
                fullWidth
                sx={{ mt: 2 }}
            >
                Save Settings
            </Button>
        </Box>
    );
}

export default Customization;