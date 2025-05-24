import { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState({
        airlineName: 'Airline Manager',
        headerColor: '#1976d2',
        darkMode: false,
        logoUrl: '',
        defaultOrigin: { name: '', iata: '' },
        currency: 'USD',
    });

    const theme = createTheme({
        palette: {
            mode: settings.darkMode ? 'dark' : 'light',
            primary: { main: settings.headerColor },
            background: {
                default: settings.darkMode ? '#121212' : '#f5f5f5',
                paper: settings.darkMode ? '#1e1e1e' : '#ffffff',
            },
        },
    });

    useEffect(() => {
        const fetchSettings = async () => {
            if (!auth.currentUser) return;
            try {
                const settingsRef = doc(db, `users/${auth.currentUser.uid}/settings/customization`);
                const settingsSnap = await getDoc(settingsRef);
                if (settingsSnap.exists()) {
                    setSettings(settingsSnap.data());
                }
            } catch (err) {
                console.error('Error fetching settings:', err);
            }
        };
        fetchSettings();
    }, []);

    const updateSettings = async (newSettings) => {
        if (!auth.currentUser) return;
        try {
            const settingsRef = doc(db, `users/${auth.currentUser.uid}/settings/customization`);
            await setDoc(settingsRef, newSettings);
            setSettings(newSettings);
        } catch (err) {
            console.error('Error saving settings:', err);
            throw err;
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}