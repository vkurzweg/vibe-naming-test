import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

/**
 * A responsive container component that uses React-Bootstrap for mobile-first design
 * This component ensures consistent spacing and responsiveness across the application
 */
const ResponsiveContainer = ({ children, fluid = false, className = '', ...props }) => {
  return (
    <Container fluid={fluid} className={`${className}`} {...props}>
      <Row>
        <Col>
          {children}
        </Col>
      </Row>
    </Container>
  );
};

export default ResponsiveContainer;
