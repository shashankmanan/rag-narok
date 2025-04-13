import React, { useState } from 'react';
import { 
  Box,
  Button,
  TextField,
  Typography,
  Link,
  Paper,
  InputAdornment,
  IconButton,
  CircularProgress,
  FormControl,
  FormHelperText
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff,
  Person,
  Email,
  Lock,
  Badge
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../utils/authUtils';
import LogoAndTextTrans from "../../assets/logoandtexttransparent.png"

const RegisterPage = () => {

  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: ''
  });

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Valid email is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user types
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: null
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await registerUser(formData);
      navigate('/login');
    } catch (err) {
        console.log(err)
      setErrors({
        ...errors,
        server: err.response?.data?.detail || 'Registration failed'
      });
    } finally {
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
        background: 'linear-gradient(135deg, #0C151F 0%, #1A3240 50%, #0C151F 100%)',
        p: 3
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 500,
          p: 4,
          backgroundColor: 'rgba(13, 27, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          borderRadius: 2
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <img 
            src={LogoAndTextTrans}
            alt="Ragnarok Logo" 
            style={{ height: 150, marginBottom: 16 }} 
          />
          <Typography variant="h4" component="h1" sx={{ color: '#3FB8AF', fontWeight: 600 }}>
            Create Account
          </Typography>
          <Typography variant="body2" sx={{ color: '#B0BEC5', mt: 1 }}>
            Join the intelligence revolution
          </Typography>
        </Box>

        {errors.server && (
          <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>
            {errors.server}
          </Typography>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <FormControl fullWidth error={!!errors.name} sx={{ mb: 2 }}>
            <TextField
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: '#3FB8AF' }} />
                  </InputAdornment>
                ),
                sx: { 
                  color: '#EAEAEA',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: errors.name ? 'error.main' : '#3FB8AF'
                  }
                }
              }}
              InputLabelProps={{
                sx: { color: '#B0BEC5' }
              }}
            />
            {errors.name && <FormHelperText>{errors.name}</FormHelperText>}
          </FormControl>

          <FormControl fullWidth error={!!errors.username} sx={{ mb: 2 }}>
            <TextField
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Badge sx={{ color: '#3FB8AF' }} />
                  </InputAdornment>
                ),
                sx: { 
                  color: '#EAEAEA',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: errors.username ? 'error.main' : '#3FB8AF'
                  }
                }
              }}
              InputLabelProps={{
                sx: { color: '#B0BEC5' }
              }}
            />
            {errors.username && <FormHelperText>{errors.username}</FormHelperText>}
          </FormControl>

          <FormControl fullWidth error={!!errors.email} sx={{ mb: 2 }}>
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
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
                    borderColor: errors.email ? 'error.main' : '#3FB8AF'
                  }
                }
              }}
              InputLabelProps={{
                sx: { color: '#B0BEC5' }
              }}
            />
            {errors.email && <FormHelperText>{errors.email}</FormHelperText>}
          </FormControl>

          <FormControl fullWidth error={!!errors.password} sx={{ mb: 2 }}>
            <TextField
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
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
                    borderColor: errors.password ? 'error.main' : '#3FB8AF'
                  }
                }
              }}
              InputLabelProps={{
                sx: { color: '#B0BEC5' }
              }}
            />
            {errors.password && <FormHelperText>{errors.password}</FormHelperText>}
          </FormControl>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              mt: 2,
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
              'Create Account'
            )}
          </Button>

          <Typography variant="body2" sx={{ color: '#B0BEC5', textAlign: 'center' }}>
            Already have an account?{' '}
            <Link 
              href="/#/login" 
              sx={{ color: '#3FB8AF', textDecoration: 'none' }}
            >
              Sign in
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegisterPage;