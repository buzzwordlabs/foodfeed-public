import React from 'react';
import { logoRectangleTransparent } from '../../assets/images';
import { Text } from '../../components';
import { Link } from 'react-router-dom';

const smallDevice = window.innerWidth <= 760;

export default function Footer() {
  const now = new Date();
  return (
    <>
      <hr className="my-0 mt-4" />
      <footer
        className="page-footer font-small"
        style={{
          padding: !smallDevice ? '2rem 3rem' : '0',
          bottom: 0
        }}
      >
        <div className="container-fluid text-center text-md-left">
          <div className="row">
            <div className="col-sm-8 col-12 offset-sm-2 mt-md-0 mt-3">
              <Link to="/">
                <img
                  src={logoRectangleTransparent}
                  className="logo d-block mx-auto mb-3"
                  alt="FoodFeed Logo"
                />
              </Link>
            </div>
          </div>
        </div>
        <div className="text-center my-2 ">
          <Link style={{ textDecoration: 'none' }} to="/privacy-policy">
            Privacy Policy
          </Link>
        </div>
        <div className="text-center mt-2 mb-3">
          <Link style={{ textDecoration: 'none' }} to="/terms-of-service">
            Terms of Service
          </Link>
          <Text a="center" className="mb-2 mt-4" style={{ fontSize: '1rem' }}>
            <span role="img" aria-label="red map pin">
              📍
            </span>{' '}
            Made with{' '}
            <span role="img" aria-label="red heart">
              ❤️
            </span>{' '}
            in Phoenix, AZ
          </Text>
          <Text a="center" className="my-2" style={{ fontSize: '1rem' }}>
            <span role="img" aria-label="email envelope">
              📧
            </span>{' '}
            hello@buzzwordlabs.com
          </Text>
        </div>
        <div className="footer-copyright text-center mb-3 ">
          <Text a="center" s="sm">
            © {now.getFullYear()} Buzzword Labs Inc. All rights reserved.
          </Text>
        </div>
        <div
          style={{
            fontSize: '0.7rem',
            textAlign: 'center',
            color: 'lightgray'
          }}
        >
          Icons made by
          <a
            style={{ color: 'lightgray' }}
            href="https://www.flaticon.com/authors/vectors-market"
            title="Vectors Market"
          >
            {' '}
            Vectors Market
          </a>
          ,
          <a
            style={{ color: 'lightgray' }}
            href="https://www.flaticon.com/authors/freepik"
            title="Freepik"
          >
            {' '}
            Freepik
          </a>
          , and
          <a
            style={{ color: 'lightgray' }}
            href="https://www.flaticon.com/authors/dinosoftlabs"
            title="DinosoftLabs"
          >
            {' '}
            DinosoftLabs{' '}
          </a>
          from{' '}
          <a
            style={{ color: 'lightgray' }}
            href="https://www.flaticon.com/"
            title="Flaticon"
          >
            flaticon
          </a>
        </div>
      </footer>
    </>
  );
}
