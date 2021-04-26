import React from 'react';
// import { undraw404 } from '../../assets/images';
import { Button } from '../../components';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';

export default function Error404() {
  return (
    <Container style={{ height: window.innerHeight * 0.6 }}>
      <Row>
        <Col
          style={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column'
          }}
        >
          <h1 className="text-center">404</h1>
          <h3 className="my-5 text-center">
            Uh oh! This page got abducted by aliens. Sorry!
          </h3>
          <Link to={'/'}>
            <Button onClick={() => {}}>Back to Home</Button>
          </Link>
        </Col>
      </Row>
    </Container>
  );
}
