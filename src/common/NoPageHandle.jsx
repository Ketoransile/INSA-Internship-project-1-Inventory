import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotPageHandle = ({ message, navigateTo }) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ padding: 4, textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>
        {message}
      </Typography>
      <Button
        variant="outlined"
        onClick={() => navigate(navigateTo)}
        sx={{ marginTop: 2 }}
      >
        Go Back
      </Button>
    </Box>
  );
};

export default NotPageHandle;