import { Link, NavLink } from 'react-router-dom';
import { Nav, Navbar as NavbarC } from 'react-bootstrap';
import React, { Component } from 'react';

import css from './Navbar.module.css';
import { logoRectangleTransparent } from '../../assets/images';

interface Props {
  staticNavLinks: {
    name: string;
    path: string;
  }[];
}

export default class Navbar extends Component<Props, {}> {
  render() {
    const { staticNavLinks } = this.props;
    return (
      <NavbarC
        sticky="top"
        expand="md"
        className={`${css.navbarOverride} px-4 mb-4`}
        style={{ backgroundColor: 'color: #2f3031' }}
      >
        <NavbarC.Brand>
          <Link className="navbar-brand" to="/">
            <img
              src={logoRectangleTransparent}
              style={{ width: '150px' }}
              alt="Logo"
            />
          </Link>
        </NavbarC.Brand>
        <NavbarC.Toggle aria-controls="responsive-navbar-nav" />
        <NavbarC.Collapse id="responsive-navbar-nav">
          <Nav
            className="navbar-nav mr-auto navlinks"
            style={{ backgroundColor: 'color: #2f3031' }}
          >
            {staticNavLinks.map((navLink, key) => {
              return (
                <li key={key} className={`nav-item ${css.navLinkContainer}`}>
                  <NavLink
                    className={css.navLink}
                    to={navLink.path}
                    activeClassName={css.navLinkActive}
                    exact
                  >
                    {navLink.name}
                  </NavLink>
                </li>
              );
            })}
          </Nav>
        </NavbarC.Collapse>
      </NavbarC>
    );
  }
}
