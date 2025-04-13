import React, { useEffect, useState } from 'react';
import { 
  Box,
  Button,
  TextField,
  Typography,
  Link,
  Paper,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff,
  Lock,
  Email
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import LogoAndText from "../../assets/logoandtexttransparent.png"
import { login } from '../../utils/authUtils';

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData.username, formData.password, navigate);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#0C151F',
        p: 3
      }}
    >
      
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 550,
          height:"900px",
          p: 4,
          backgroundColor: '#0D1B2A', 
          borderRadius: 2
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <img 
            src={LogoAndText} 
            alt="Company Logo" 
            style={{ height: 200, marginBottom: 16 }} 
          />
          <Typography variant="h4" component="h1" sx={{ color: '#3FB8AF', fontWeight: 600 }}>
            Welcome Back
          </Typography>
          <Typography variant="body2" sx={{ color: '#B0BEC5', mt: 1 }}>
            Sign in to your account
          </Typography>
        </Box>

        {error && (
          <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>
            {error}
          </Typography>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            margin="normal"
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: '#3FB8AF' }} />
                </InputAdornment>
              ),
              sx: { 
                color: '#EAEAEA',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#3FB8AF'
                }
              }
            }}
            InputLabelProps={{
              sx: { color: '#B0BEC5' }
            }}
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: '#3FB8AF' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: '#B0BEC5' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
              sx: { 
                color: '#EAEAEA',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#3FB8AF'
                }
              }
            }}
            InputLabelProps={{
              sx: { color: '#B0BEC5' }
            }}
          />

          <Box sx={{ textAlign: 'right', mt: 1 }}>
            <Link 
              href="/forgot-password" 
              variant="body2" 
              sx={{ color: '#3FB8AF', textDecoration: 'none' }}
            >
              Forgot password?
            </Link>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              mt: 3,
              mb: 2,
              py: 1.5,
              backgroundColor: '#3FB8AF',
              color: '#0D1B2A',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: '#3FB8AF',
                opacity: 0.9
              }
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: '#0D1B2A' }} />
            ) : (
              'Sign In'
            )}
          </Button>

          <Typography variant="body2" sx={{ color: '#B0BEC5', textAlign: 'center' }}>
            Don't have an account?{' '}
            <Link 
              href="/#/sign-up" 
              sx={{ color: '#3FB8AF', textDecoration: 'none' }}
            >
              Sign up
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;