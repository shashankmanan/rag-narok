import React from 'react';
import { 
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  CssBaseline,
  Container
} from '@mui/material';
import { Link } from 'react-router-dom';
import LogoText from "../assets/logo_text.png";
import Logo from "../assets/logo.png";
import { logout } from '../utils/authUtils';
import { useNavigate } from 'react-router-dom';

const NavBar = ({ children }) => {
  const navigate = useNavigate()
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar 
        position="static"
        sx={{
          backgroundColor: '#0D1B2A',
          color: '#EAEAEA',
          py: 1,
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            {/* Left Section - Logo/Text */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <img 
                src={LogoText}
                alt="Logo Text"
                style={{ 
                  height: '60px',
                  marginRight: '16px'
                }}
              />
            </Box>

            {/* Center Section - Main Logo */}
            <Box sx={{ 
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)'
            }}>
              
              <Link to="/">
              <img 
                src={Logo}
                alt="Logo" 
                style={{ 
                  height: '80px',
                }} 
              /> </Link>
            </Box>
          
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                component={Link}
                to="/"
                sx={{
                  color: '#EAEAEA',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Home
              </Button>
              <Button 
                component={Link}
                to="/about"
                sx={{
                  color: '#EAEAEA',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                About
              </Button> 
              
              <Button 
                component={Link}
                onClick={() => logout()}
                variant="outlined"
                sx={{
                  color: '#3FB8AF',
                  borderColor: '#3FB8AF',
                  '&:hover': {
                    borderColor: '#3FB8AF',
                    backgroundColor: 'rgba(63, 184, 175, 0.1)'
                  }
                }}
              >
                Log out
              </Button>
            </Box> 
            
          </Toolbar>
        </Container>
      </AppBar>

      {/* Main Content Area */}
      <Box component="main" sx={{ 
        flexGrow: 1,
        backgroundColor: '#0C151F',
        color: '#EAEAEA',
        pt: 4,
        pb: 8
      }}>
        <Container maxWidth="xl">
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default NavBar;