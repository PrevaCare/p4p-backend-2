import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";

const [searchFilter] = useState(""); // Combined search filter for city and pin code
const [minPrice] = useState(0);
const [maxPrice] = useState(10000); // Set a reasonable default max price
