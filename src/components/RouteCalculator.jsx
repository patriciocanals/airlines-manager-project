import { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { airplanes } from '../assets/planes.js';
import {
  TextField,
  Button,
  Box,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useSettings } from '../context/SettingsContext';

function RouteCalculator() {
  const [origin, setOrigin] = useState('');
  const [originIata, setOriginIata] = useState('');
  const [destination, setDestination] = useState('');
  const [destinationIata, setDestinationIata] = useState('');
  const [demand, setDemand] = useState({ economy: 0, business: 0, first: 0, cargo: 0 });
  const [airportCategory, setAirportCategory] = useState('');
  const [distance, setDistance] = useState('');
  const [turnaroundTime, setTurnaroundTime] = useState('');
  const [useTwoPlanes, setUseTwoPlanes] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [selectedPlane, setSelectedPlane] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [modalData, setModalData] = useState({
    registration: '',
    registration2: '',
    seatConfig: { economy: 0, business: 0, first: 0 },
    ticketPrices: { economy: 0, business: 0, first: 0 },
    dailyTrips: 0,
    notes: '',
    destinationPhotoURL: '',
  });
  const { settings } = useSettings();

  useEffect(() => {
    setOrigin(settings.defaultOrigin.name);
    setOriginIata(settings.defaultOrigin.iata);
  }, [settings.defaultOrigin]);

  const turnaroundTimeOptions = [];
  for (let hours = 0; hours <= 12; hours++) {
    for (let minutes = 0; minutes < 60; minutes += 15) {
      const time = `${hours}:${minutes.toString().padStart(2, '0')}`;
      const decimalHours = hours + minutes / 60;
      if (decimalHours > 0) {
        turnaroundTimeOptions.push({ label: time, value: decimalHours.toFixed(2) });
      }
    }
  }

  const handleCalculate = () => {
    setError('');
    setResults([]);

    if (!origin || !originIata || !destination || !destinationIata || !airportCategory || !distance || !turnaroundTime || isNaN(distance) || distance <= 0) {
      setError('Please fill all fields with valid values');
      return;
    }
    if (!/^[A-Z]{3}$/.test(originIata) || !/^[A-Z]{3}$/.test(destinationIata)) {
      setError('Origin and Destination IATA codes must be 3 uppercase letters');
      return;
    }
    if (demand.economy < 0 || demand.business < 0 || demand.first < 0 || demand.cargo < 0) {
      setError('Demand values cannot be negative');
      return;
    }

    const distanceNum = Number(distance);
    const categoryNum = Number(airportCategory);
    const turnaroundTimeNum = Number(turnaroundTime);
    const numPlanes = useTwoPlanes ? 2 : 1;

    const totalSeats = demand.economy + demand.business * 2 + demand.first * 4;
    const frequency = Math.floor(24 / turnaroundTimeNum) * 2 * numPlanes;
    const minPax = Math.ceil(totalSeats / frequency);

    const viablePlanes = airplanes.filter((plane) => {
      return plane.cat <= categoryNum && plane.range >= distanceNum && plane.pax >= minPax;
    });

    if (viablePlanes.length === 0) {
      setError('No planes can operate this route based on category, range, or capacity');
      return;
    }

    const planeResults = viablePlanes
      .map((plane) => {
        const config = {
          economy: Math.ceil(demand.economy / frequency),
          business: Math.ceil(demand.business / frequency),
          first: Math.ceil(demand.first / frequency),
          cargo: Math.ceil(demand.cargo / frequency),
        };
        return {
          plane: `${plane.brand} ${plane.model}`,
          frequency,
          pax: plane.pax,
          minPax,
          config,
          img: plane.img,
        };
      })
      .sort((a, b) => a.pax - b.pax);

    setResults(planeResults);
  };

  const handleOpenModal = (result) => {
    setSelectedPlane(result);
    setModalData({
      registration: '',
      registration2: '',
      seatConfig: {
        economy: result.config.economy,
        business: result.config.business,
        first: result.config.first,
      },
      ticketPrices: { economy: 0, business: 0, first: 0 },
      dailyTrips: result.frequency,
      notes: '',
      destinationPhotoURL: '',
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedPlane(null);
    setModalData({
      registration: '',
      registration2: '',
      seatConfig: { economy: 0, business: 0, first: 0 },
      ticketPrices: { economy: 0, business: 0, first: 0 },
      dailyTrips: 0,
      notes: '',
      destinationPhotoURL: '',
    });
  };

  const handleSaveRoute = async () => {
    if (!auth.currentUser) {
      setError('You must be logged in to save a route');
      return;
    }

    if (!modalData.registration) {
      setError('Please fill Registration field');
      return;
    }
    if (!/^[A-Z0-9-]{5,10}$/.test(modalData.registration)) {
      setError('Registration must be 5-10 alphanumeric characters or hyphens');
      return;
    }
    if (useTwoPlanes && !modalData.registration2) {
      setError('Please fill Registration for the second plane');
      return;
    }
    if (useTwoPlanes && !/^[A-Z0-9-]{5,10}$/.test(modalData.registration2)) {
      setError('Second Registration must be 5-10 alphanumeric characters or hyphens');
      return;
    }
    if (useTwoPlanes && modalData.registration === modalData.registration2) {
      setError('Registrations for the two planes must be different');
      return;
    }
    const totalSeatsConfig = modalData.seatConfig.economy + modalData.seatConfig.business * 2 + modalData.seatConfig.first * 4;
    if (totalSeatsConfig > selectedPlane.pax) {
      setError(`Total seats (${totalSeatsConfig}) exceed plane capacity (${selectedPlane.pax})`);
      return;
    }
    if (modalData.dailyTrips > selectedPlane.frequency || modalData.dailyTrips <= 0) {
      setError(`Daily trips must be between 1 and ${selectedPlane.frequency}`);
      return;
    }
    if (modalData.destinationPhotoURL && !/^https?:\/\/\S+\.(png|jpg|jpeg)$/i.test(modalData.destinationPhotoURL)) {
      setError('Destination photo URL must be a valid PNG, JPG, or JPEG URL');
      return;
    }

    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/routes`), {
        origin,
        originIata,
        destination,
        destinationIata,
        plane: selectedPlane.plane,
        demand,
        airportCategory: Number(airportCategory),
        distance: Number(distance),
        turnaroundTime: Number(turnaroundTime),
        useTwoPlanes,
        planePhotoURL: getPlaneImage(selectedPlane.plane),
        registration: modalData.registration,
        registration2: useTwoPlanes ? modalData.registration2 : null,
        seatConfig: modalData.seatConfig,
        ticketPrices: modalData.ticketPrices,
        dailyTrips: modalData.dailyTrips,
        notes: modalData.notes,
        destinationPhotoURL: modalData.destinationPhotoURL || null,
        createdAt: new Date(),
      });
      localStorage.setItem('lastRoute', JSON.stringify({ origin, originIata, destination, destinationIata, plane: selectedPlane.plane, demand }));
      setOrigin(settings.defaultOrigin.name);
      setOriginIata(settings.defaultOrigin.iata);
      setDestination('');
      setDestinationIata('');
      setDemand({ economy: 0, business: 0, first: 0, cargo: 0 });
      setAirportCategory('');
      setDistance('');
      setTurnaroundTime('');
      setUseTwoPlanes(false);
      setResults([]);
      setSelectedPlane(null);
      setOpenModal(false);
      setError('Route saved successfully');
    } catch (err) {
      console.error('Error saving route:', err);
      setError(`Failed to save route: ${err.message}`);
    }
  };

  const getPlaneImage = (planeName) => {
    const plane = airplanes.find((p) => `${p.brand} ${p.model}` === planeName);
    return plane && plane.img ? `/images/${plane.img}` : '';
  };

  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Route Calculator
      </Typography>
      {error && <Alert severity={error.includes('successfully') ? 'success' : 'error'} sx={{ mb: 2 }}>{error}</Alert>}
      <TextField
        label="Origin Airport (e.g., Madrid-Barajas)"
        value={origin}
        onChange={(e) => setOrigin(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Origin IATA (e.g., MAD)"
        value={originIata}
        onChange={(e) => setOriginIata(e.target.value.toUpperCase())}
        fullWidth
        margin="normal"
        inputProps={{ maxLength: 3 }}
      />
      <TextField
        label="Destination Airport (e.g., Sevilla)"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Destination IATA (e.g., SVQ)"
        value={destinationIata}
        onChange={(e) => setDestinationIata(e.target.value.toUpperCase())}
        fullWidth
        margin="normal"
        inputProps={{ maxLength: 3 }}
      />
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
        label="First Class Demand"
        type="number"
        value={demand.first}
        onChange={(e) => setDemand({ ...demand, first: Number(e.target.value) })}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Cargo Demand (tons)"
        type="number"
        value={demand.cargo}
        onChange={(e) => setDemand({ ...demand, cargo: Number(e.target.value) })}
        fullWidth
        margin="normal"
      />
      <InputLabel id="category-select-label">Airport Category (1-10)</InputLabel>
      <Select
        labelId="category-select-label"
        value={airportCategory}
        onChange={(e) => setAirportCategory(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      >
        <MenuItem value="">Select category</MenuItem>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((cat) => (
          <MenuItem key={cat} value={cat}>
            Category {cat}
          </MenuItem>
        ))}
      </Select>
      <TextField
        label="Distance (km)"
        type="number"
        value={distance}
        onChange={(e) => setDistance(e.target.value)}
        fullWidth
        margin="normal"
      />
      <InputLabel id="turnaround-select-label">Turnaround Time</InputLabel>
      <Select
        labelId="turnaround-select-label"
        value={turnaroundTime}
        onChange={(e) => setTurnaroundTime(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      >
        <MenuItem value="">Select time</MenuItem>
        {turnaroundTimeOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      <FormControlLabel
        control={<Checkbox checked={useTwoPlanes} onChange={(e) => setUseTwoPlanes(e.target.checked)} />}
        label="Use two planes of the same model"
      />
      <Button variant="contained" onClick={handleCalculate} fullWidth sx={{ mt: 2, mb: 4 }}>
        Calculate
      </Button>
      {results.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Recommended Planes
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Plane</TableCell>
                  <TableCell>Capacity (seats)</TableCell>
                  <TableCell>Min Seats Needed</TableCell>
                  <TableCell>Frequency (trips/day)</TableCell>
                  <TableCell>Config (Eco/Bus/First/Cargo)</TableCell>
                  <TableCell>Image</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.plane}>
                    <TableCell>{result.plane}</TableCell>
                    <TableCell>{result.pax}</TableCell>
                    <TableCell>{result.minPax}</TableCell>
                    <TableCell>{result.frequency}</TableCell>
                    <TableCell>
                      {result.config.economy}/{result.config.business}/{result.config.first}/{result.config.cargo}
                    </TableCell>
                    <TableCell>
                      {result.img && <img src={`/images/${result.img}`} alt={result.plane} style={{ maxWidth: '100px', height: 'auto' }} />}
                    </TableCell>
                    <TableCell>
                      <Button variant="outlined" onClick={() => handleOpenModal(result)}>
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
      <Dialog open={openModal} onClose={handleCloseModal}>
        <DialogTitle>Configure Route for {selectedPlane?.plane}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Calculated Config: {selectedPlane?.config.economy}/{selectedPlane?.config.business}/{selectedPlane?.config.first}/{selectedPlane?.config.cargo}
            <br />
            Max Capacity: {selectedPlane?.pax} seats | Max Trips/Day: {selectedPlane?.frequency}
          </Typography>
          <TextField
            label="Registration (Plane 1)"
            value={modalData.registration}
            onChange={(e) => setModalData({ ...modalData, registration: e.target.value.toUpperCase() })}
            fullWidth
            margin="normal"
            inputProps={{ maxLength: 10 }}
          />
          {useTwoPlanes && (
            <TextField
              label="Registration (Plane 2)"
              value={modalData.registration2}
              onChange={(e) => setModalData({ ...modalData, registration2: e.target.value.toUpperCase() })}
              fullWidth
              margin="normal"
              inputProps={{ maxLength: 10 }}
            />
          )}
          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            Seat Configuration
          </Typography>
          <TextField
            label="Economy Seats"
            type="number"
            value={modalData.seatConfig.economy}
            onChange={(e) => setModalData({ ...modalData, seatConfig: { ...modalData.seatConfig, economy: Number(e.target.value) } })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Business Seats"
            type="number"
            value={modalData.seatConfig.business}
            onChange={(e) => setModalData({ ...modalData, seatConfig: { ...modalData.seatConfig, business: Number(e.target.value) } })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="First Class Seats"
            type="number"
            value={modalData.seatConfig.first}
            onChange={(e) => setModalData({ ...modalData, seatConfig: { ...modalData.seatConfig, first: Number(e.target.value) } })}
            fullWidth
            margin="normal"
          />
          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            Ticket Prices (USD)
          </Typography>
          <TextField
            label="Economy Price"
            type="number"
            value={modalData.ticketPrices.economy}
            onChange={(e) => setModalData({ ...modalData, ticketPrices: { ...modalData.ticketPrices, economy: Number(e.target.value) } })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Business Price"
            type="number"
            value={modalData.ticketPrices.business}
            onChange={(e) => setModalData({ ...modalData, ticketPrices: { ...modalData.ticketPrices, business: Number(e.target.value) } })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="First Class Price"
            type="number"
            value={modalData.ticketPrices.first}
            onChange={(e) => setModalData({ ...modalData, ticketPrices: { ...modalData.ticketPrices, first: Number(e.target.value) } })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Daily Trips"
            type="number"
            value={modalData.dailyTrips}
            onChange={(e) => setModalData({ ...modalData, dailyTrips: Number(e.target.value) })}
            fullWidth
            margin="normal"
          />
          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            Destination Photo URL (for promotion)
          </Typography>
          <TextField
            label="Photo URL (PNG/JPG/JPEG)"
            value={modalData.destinationPhotoURL}
            onChange={(e) => setModalData({ ...modalData, destinationPhotoURL: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Notes"
            value={modalData.notes}
            onChange={(e) => setModalData({ ...modalData, notes: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button onClick={handleSaveRoute} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default RouteCalculator;