import React from 'react';
import { Navbar as BootstrapNavbar, Container, Nav, Button, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
  const isAdmin = user?.role === 'admin';

  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="lg" sticky="top">
      <Container>
        <BootstrapNavbar.Brand as={Link} to={isAdmin ? '/admin' : '/dashboard'} className="fw-bold">
          📚 Smart Study Planner
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {!isAdmin && (
              <>
                <Nav.Link as={Link} to="/dashboard">
                  Dashboard
                </Nav.Link>
                <Nav.Link as={Link} to="/tasks">
                  Tasks
                </Nav.Link>
                <Nav.Link as={Link} to="/groups">
                  Groups
                </Nav.Link>
              </>
            )}
            {isAdmin && (
              <>
                <Nav.Link as={Link} to="/admin">
                  Dashboard
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/groups">
                  Groups
                </Nav.Link>
              </>
            )}

            <Dropdown align="end" className="ms-3">
              <Dropdown.Toggle variant="outline-light" size="sm">
                <FaUser className="me-2" />
                {user?.full_name || 'User'}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item as={Link} to="/profile">
                  Profile
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={onLogout}>
                  <FaSignOutAlt className="me-2" />
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;
