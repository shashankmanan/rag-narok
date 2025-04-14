import { HashRouter, Routes, Route, useNavigate,Outlet } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard'
import NavLayout from './layouts/NavLayout';
import { useState,useEffect } from 'react';
import ErrorPage from './pages/ErrorPage';
import RegisterPage from './pages/auth/RegisterPage';

export default function Router() {
  console.log("in router")
const ProtectedRoute = ()  => {
  console.log("checkin route")
  const navigate = useNavigate()
  useEffect(() => {
    if (!localStorage.getItem('ragnarok_token')) 
      navigate('/login', { replace: true });
  }, [navigate]);
  console.log("logged in")
  return <Outlet />;
}

  return (
    <HashRouter>
        <Routes>
          <Route path="/" element={
              <LandingPage />
          } />
          
          <Route path="/login" element={
              <Login />
          } />

          <Route path="/sign-up" element={
              <RegisterPage />
          } />




        <Route element={<ProtectedRoute />}>
          <Route element={<NavLayout />}>
            <Route path="/dashboard" element={
                <Dashboard />
            } />
          </Route>
        </Route>  
         <Route path = "*" element={<ErrorPage/>}></Route>
        </Routes>
    </HashRouter>
  );
}