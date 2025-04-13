import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import { styled } from "@mui/system";
import Logo from "../assets/logo.png";
import { Link } from "react-router-dom";

const Root = styled(Box)({
  width: '100vw',
  height: '100vh',
  backgroundColor: '#0C151F',
  color: '#F5F5F5',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '3rem 1.5rem',
  overflow: 'hidden',
});


export default function LandingPage() {
  console.log("in landing page")
  return (
    <Root>
      <Container maxWidth="sm">
        {/* Logo */}
        <Stack spacing={2} alignItems="center">
          <Box
            component="img"
            src={Logo} // Replace with actual logo path
            alt="Ragnarok Logo"
            sx={{ width: 320, height: 200}}
          />
          <Typography variant="h6" fontWeight="bold" letterSpacing={1.5}>
            RAGNAROK
          </Typography>
        </Stack>

        {/* Headline */}
        <Stack spacing={2} textAlign="center" mt={6}>
          <Typography variant="h3" fontWeight={800}>
            Intelligence Reborn
          </Typography>
          <Typography variant="body1">
            Query the End. Discover the Beginning. <br />
            Turn documents into actionable insights with cutting-edge RAG agents.
          </Typography>
        </Stack>

        {/* CTA Button */}
        <Box textAlign="center" mt={4}>
          <Link to="/dashboard">
            <Button
              variant="contained"
              size="large"
              sx={{
                backgroundColor: "#3FB8AF",
                color: "#0D1B2A",
                paddingX: 4,
                paddingY: 1.5,
                fontWeight: 600,
                borderRadius: 2,
                textTransform: "none",
                boxShadow: 3,
                '&:hover': { opacity: 0.9 },
              }}
            >
              Get Started
            </Button>
          </Link>
        </Box>

        {/* Footer Links */}
        <Stack direction="row" spacing={4} justifyContent="center" mt={6}>
          <Typography
            variant="body2"
            component="a"
            href="#"
            sx={{ color: "#B0BEC5", '&:hover': { color: '#ffffff' }, cursor: 'pointer' }}
          >
            Learn More
          </Typography>
          <Typography
            variant="body2"
            component="a"
            href="#"
            sx={{ color: "#B0BEC5", '&:hover': { color: '#ffffff' }, cursor: 'pointer' }}
          >
            Contact
          </Typography>
        </Stack>
      </Container>
    </Root>
  );
}
