import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const acceptInvite = async (invite) => {
    try {
      setError('');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/student/groups/${invite.group_id}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      fetchDashboardData();
    } catch (err) {
      setError('Failed to accept invitation');
      console.error(err);
    }
  };

  const declineInvite = async (invite) => {
    try {
      setError('');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/student/groups/${invite.group_id}/decline`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      fetchDashboardData();
    } catch (err) {
      setError('Failed to decline invitation');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/student/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      setDashboardData(response.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      <Container className="py-5">
        {error && <Alert variant="danger">{error}</Alert>}

        {/* Welcome Section */}
        <div className="mb-5">
          <h1 className="display-6">Welcome, {user?.full_name || 'Student'}!</h1>
          <p className="text-muted">Here's your study overview</p>
        </div>

        {/* Statistics Cards */}
        <Row className="mb-5">
          <Col md={4} className="mb-3">
            <Card className="stat-card">
              <Card.Body className="text-center">
                <h2 className="text-primary">
                  {dashboardData?.total_tasks || 0}
                </h2>
                <p className="text-muted">Total Tasks</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-3">
            <Card className="stat-card">
              <Card.Body className="text-center">
                <h2 className="text-warning">
                  {dashboardData?.upcoming_deadlines || 0}
                </h2>
                <p className="text-muted">Upcoming Deadlines</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-3">
            <Card className="stat-card">
              <Card.Body className="text-center">
                <h2 className="text-success">
                  {dashboardData?.active_groups || 0}
                </h2>
                <p className="text-muted">Active Groups</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* My Subjects Section */}
        <div className="mb-5">
          <h3>My Subjects</h3>
          <Row>
            {dashboardData?.subjects && dashboardData.subjects.length > 0 ? (
              dashboardData.subjects.map((subject) => (
                <Col md={4} key={subject.id} className="mb-3">
                  <Card className="subject-card">
                    <Card.Body>
                      <Card.Title>{subject.name}</Card.Title>
                      <Card.Text className="text-muted">
                        Code: {subject.code}
                      </Card.Text>
                      <Button variant="outline-primary" size="sm">
                        View Details
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            ) : (
              <Col>
                <Alert variant="info">
                  No subjects enrolled. Wait for admin to assign subjects.
                </Alert>
              </Col>
            )}
          </Row>
        </div>

        {/* Recent Tasks Section */}
        <div className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>Recent Tasks</h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/tasks')}
            >
              View All
            </Button>
          </div>
          {dashboardData?.recent_tasks && dashboardData.recent_tasks.length > 0 ? (
            <div className="task-list">
              {dashboardData.recent_tasks.map((task) => (
                <Card key={task.id} className="mb-3">
                  <Card.Body>
                    <div className="d-flex justify-content-between">
                      <div>
                        <Card.Title className="mb-1">{task.title}</Card.Title>
                        <Card.Text className="small text-muted">
                          {task.subject} • Due: {new Date(task.due_date).toLocaleDateString()}
                        </Card.Text>
                      </div>
                      <span className={`badge bg-${task.status === 'completed' ? 'success' : 'warning'}`}>
                        {task.status}
                      </span>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          ) : (
            <Alert variant="info">No recent tasks</Alert>
          )}
        </div>

        {/* Group Invitations Section */}
        <div className="mb-5">
          <h3>Group Invitations</h3>
          {dashboardData?.pending_invites && dashboardData.pending_invites.length > 0 ? (
            <div className="invitations-list">
              {dashboardData.pending_invites.map((invite) => (
                <Card key={invite.id} className="mb-2">
                  <Card.Body className="d-flex justify-content-between align-items-center">
                    <div>
                      <Card.Title className="mb-0">{invite.group_name}</Card.Title>
                      <Card.Text className="small text-muted mb-0">
                        Subject: {invite.subject}
                      </Card.Text>
                    </div>
                    <div>
                      <Button
                        variant="success"
                        size="sm"
                        className="me-2"
                        onClick={() => acceptInvite(invite)}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => declineInvite(invite)}
                      >
                        Decline
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          ) : (
            <Alert variant="info">No pending invitations</Alert>
          )}
        </div>

        {/* Quick Actions */}
        <Row className="mb-5">
          <Col md={6} className="mb-3">
            <Button
              variant="primary"
              size="lg"
              className="w-100"
              onClick={() => navigate('/tasks')}
            >
              + Add New Task
            </Button>
          </Col>
          <Col md={6} className="mb-3">
            <Button
              variant="success"
              size="lg"
              className="w-100"
              onClick={() => navigate('/groups')}
            >
              + Join or Create Group
            </Button>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default StudentDashboard;
