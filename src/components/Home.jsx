import { Box, Typography, Button } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

function Home() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    return (
        <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>
                Welcome to Your Airline
            </Typography>
            <Typography variant="body1" gutterBottom>
                Manage your routes and calculate the best planes for your airline.
            </Typography>
            <Box sx={{ mt: 4 }}>
                <Button variant="contained" component={Link} to="/calculator" sx={{ mr: 2 }}>
                    Route Calculator
                </Button>
                <Button variant="contained" component={Link} to="/routes">
                    Manage Destinations
                </Button>
            </Box>
            <Button variant="outlined" onClick={handleLogout} sx={{ mt: 4 }}>
                Logout
            </Button>
        </Box>
    );
}

export default Home;