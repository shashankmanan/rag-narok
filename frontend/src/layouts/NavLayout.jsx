import React from "react";
import NavBar from "../components/NavBar";
import { Outlet } from "react-router-dom";

const NavLayout = () => {
  return (
    <>
      <NavBar>
      <main><Outlet /></main>
      </NavBar>
    </>
  );
};

export default NavLayout;
