import React from "react";
import NavBar from "../components/NavBar";

const NavLayout = ({ children }) => {
  return (
    <>
      <NavBar>
      <main>{children}</main>
      </NavBar>
    </>
  );
};

export default NavLayout;
