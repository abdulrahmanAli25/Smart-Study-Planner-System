import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Nav, Tab } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './LandingLogin.css';

const LandingLogin = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('student-login');
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  
  const [studentLogin, setStudentLogin] = useState({
    email: '',
    password: '',
  });

  const [adminLogin, setAdminLogin] = useState({
    email: '',
    password: '',
  });

  const [setupAdmin, setSetupAdmin] = useState({
    token: '',
    email: '',
    password: '',
    full_name: 'Admin User',
  });
  const [setupSuccess, setSetupSuccess] = useState('');
  const [setupError, setSetupError] = useState('');

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    if (!studentLogin.email || !studentLogin.password) {
      setErrors({ email: 'Email and password are required' });
      return;
    }

    const result = await login(studentLogin.email, studentLogin.password);
    if (result.success) {
      if (result.user.role === 'student') {
        navigate('/dashboard');
      } else {
        setGeneralError('Invalid credentials for student login');
      }
    } else {
      setGeneralError(result.error);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    if (!adminLogin.email || !adminLogin.password) {
      setErrors({ email: 'Email and password are required' });
      return;
    }

    const result = await login(adminLogin.email, adminLogin.password);
    if (result.success) {
      if (result.user.role === 'admin') {
        navigate('/admin');
      } else {
        setGeneralError('Invalid credentials for admin login');
      }
    } else {
      setGeneralError(result.error);
    }
  };

  const handleSetupAdmin = async (e) => {
    e.preventDefault();
    setSetupError('');
    setSetupSuccess('');
    if (!setupAdmin.token || !setupAdmin.email || !setupAdmin.password) {
      setSetupError('Token, email and password are required.');
      return;
    }
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/create`,
        {
          token: setupAdmin.token,
          email: setupAdmin.email,
          password: setupAdmin.password,
          full_name: setupAdmin.full_name || 'Admin User',
          student_id: 'ADMIN001',
        }
      );
      setSetupSuccess(response.data.message || 'Admin created. Use Admin Login tab to sign in.');
      setSetupAdmin({ token: '', email: '', password: '', full_name: 'Admin User' });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Setup failed';
      setSetupError(msg);
    }
  };

  return (
    <div className="landing-page">
      <Container className="py-5">
        <div className="text-center mb-5">
          <h1 className="display-4 fw-bold">Smart Study Planner</h1>
          <p className="lead text-muted">Organize your studies efficiently</p>
        </div>

        <div className="row justify-content-center">
          <div className="col-md-6">
            <Card className="shadow-lg">
              <Card.Body>
                <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                  <Nav variant="tabs" className="mb-4">
                    <Nav.Item>
                      <Nav.Link eventKey="student-login">Student Login</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="admin-login">Admin Login</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="setup-admin">Setup admin</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="about">About</Nav.Link>
                    </Nav.Item>
                  </Nav>

                  <Tab.Content>
                    {/* Student Login Tab */}
                    <Tab.Pane eventKey="student-login">
                      {generalError && <Alert variant="danger">{generalError}</Alert>}
                      <Form onSubmit={handleStudentLogin}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email Address</Form.Label>
                          <Form.Control
                            type="email"
                            placeholder="Enter your email"
                            value={studentLogin.email}
                            onChange={(e) =>
                              setStudentLogin({ ...studentLogin, email: e.target.value })
                            }
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Password</Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Enter your password"
                            value={studentLogin.password}
                            onChange={(e) =>
                              setStudentLogin({ ...studentLogin, password: e.target.value })
                            }
                          />
                        </Form.Group>

                        <Button
                          variant="primary"
                          type="submit"
                          className="w-100 mb-3"
                          disabled={loading}
                        >
                          {loading ? 'Logging in...' : 'Login'}
                        </Button>

                        <p className="text-center">
                          Don't have an account?{' '}
                          <Link to="/register" className="text-decoration-none">
                            Register here
                          </Link>
                        </p>
                      </Form>
                    </Tab.Pane>

                    {/* Admin Login Tab */}
                    <Tab.Pane eventKey="admin-login">
                      {generalError && <Alert variant="danger">{generalError}</Alert>}
                      <Form onSubmit={handleAdminLogin}>
                        <Form.Group className="mb-3">
                          <Form.Label>Admin Email</Form.Label>
                          <Form.Control
                            type="email"
                            placeholder="Enter admin email"
                            value={adminLogin.email}
                            onChange={(e) =>
                              setAdminLogin({ ...adminLogin, email: e.target.value })
                            }
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Password</Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Enter admin password"
                            value={adminLogin.password}
                            onChange={(e) =>
                              setAdminLogin({ ...adminLogin, password: e.target.value })
                            }
                          />
                        </Form.Group>

                        <Button
                          variant="warning"
                          type="submit"
                          className="w-100"
                          disabled={loading}
                        >
                          {loading ? 'Logging in...' : 'Admin Login'}
                        </Button>

                        <p className="text-center mt-3">
                          Don't have an admin account? Use the <strong>Setup admin</strong> tab (requires token from backend .env).
                        </p>
                      </Form>
                    </Tab.Pane>

                    {/* Setup admin (Option B: token-based) */}
                    <Tab.Pane eventKey="setup-admin">
                      {setupSuccess && <Alert variant="success">{setupSuccess}</Alert>}
                      {setupError && <Alert variant="danger">{setupError}</Alert>}
                      <Form onSubmit={handleSetupAdmin}>
                        <Form.Group className="mb-3">
                          <Form.Label>Admin creation token</Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Value of ADMIN_CREATION_TOKEN from backend .env"
                            value={setupAdmin.token}
                            onChange={(e) =>
                              setSetupAdmin({ ...setupAdmin, token: e.target.value })
                            }
                          />
                          <Form.Text className="text-muted">
                            Set this in backend .env (see .env.example).
                          </Form.Text>
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Admin email</Form.Label>
                          <Form.Control
                            type="email"
                            placeholder="admin@example.com"
                            value={setupAdmin.email}
                            onChange={(e) =>
                              setSetupAdmin({ ...setupAdmin, email: e.target.value })
                            }
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Password</Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Choose a secure password"
                            value={setupAdmin.password}
                            onChange={(e) =>
                              setSetupAdmin({ ...setupAdmin, password: e.target.value })
                            }
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Full name (optional)</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Admin User"
                            value={setupAdmin.full_name}
                            onChange={(e) =>
                              setSetupAdmin({ ...setupAdmin, full_name: e.target.value })
                            }
                          />
                        </Form.Group>
                        <Button variant="outline-primary" type="submit" className="w-100">
                          Create admin account
                        </Button>
                      </Form>
                    </Tab.Pane>

                    {/* About Tab */}
                    <Tab.Pane eventKey="about">
                      <div className="about-content">
                        <h5>About Smart Study Planner</h5>
                        <p>
                          Smart Study Planner is a comprehensive platform designed to help students and
                          administrators manage study tasks, collaborate with peers, and track academic progress.
                        </p>
                        <h6>Key Features:</h6>
                        <ul>
                          <li>Task Management - Create and track study tasks</li>
                          <li>Group Collaboration - Join study groups and collaborate</li>
                          <li>Real-time Chat - Communicate within groups</li>
                          <li>Calendar View - Visualize deadlines</li>
                          <li>Admin Dashboard - Manage students and subjects</li>
                        </ul>
                      </div>
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default LandingLogin;
