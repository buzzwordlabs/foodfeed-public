import React from 'react';
import Footer from '../Footer/Footer';
import Navbar from '../Navbar/Navbar';
import staticRoutes, { StaticRouteNames } from '../../routes/staticRoutes';

const routes: StaticRouteNames[] = ['About', 'FAQ', 'Home', 'Contact'];
const navbarLinks = staticRoutes.filter((route) => routes.includes(route.name));

const Layout = (props: any) => {
  return (
    <>
      <Navbar staticNavLinks={navbarLinks} />
      {props.children}
      <Footer />
    </>
  );
};

export default Layout;
