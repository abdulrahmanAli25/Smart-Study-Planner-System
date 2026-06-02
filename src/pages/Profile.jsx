import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tabs, Tab } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    student_id: user?.student_id || '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [linkedSubjects, setLinkedSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notificationPreferences, setNotificationPreferences] = useState({
    email_notifications: true,
    task_reminders: true,
    group_updates: true,
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/profile`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      setLinkedSubjects(response.data.subjects || []);
    } catch (err) {
      console.error('Failed to fetch profile data:', err);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/profile/update`,
        profileData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/profile/change-password`,
        {
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      setSuccess('Password changed successfully!');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    try {
      setLoading(true);
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/profile/notifications`,
        notificationPreferences,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      setSuccess('Notification preferences updated!');
    } catch (err) {
      setError('Failed to update notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <>
      <Navbar user={user} onLogout={logout} />
      <Container className="py-5">
        <div className="mb-5">
          <h1>Profile Settings</h1>
          <p className="text-muted">Manage your account and preferences</p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Row>
          <Col lg={8}>
            <Tabs defaultActiveKey="personal" className="mb-4">
              {/* Personal Information Tab */}
              <Tab eventKey="personal" title="Personal Information">
                <Card>
                  <Card.Body className="p-4">
                    <Form onSubmit={handleProfileUpdate}>
                      <Form.Group className="mb-4">
                        <Form.Label>Full Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={profileData.full_name}
                          onChange={(e) =>
                            setProfileData({ ...profileData, full_name: e.target.value })
                          }
                        />
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control
                          type="email"
                          value={profileData.email}
                          disabled
                        />
                        <Form.Text className="d-block mt-2">
                          Email cannot be changed
                        </Form.Text>
                      </Form.Group>

                      {!isAdmin && (
                        <Form.Group className="mb-4">
                          <Form.Label>Student ID</Form.Label>
                          <Form.Control
                            type="text"
                            value={profileData.student_id}
                            disabled
                          />
                          <Form.Text className="d-block mt-2">
                            Student ID cannot be changed
                          </Form.Text>
                        </Form.Group>
                      )}

                      <Button
                        variant="primary"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Tab>

              {/* Password Change Tab */}
              <Tab eventKey="password" title="Change Password">
                <Card>
                  <Card.Body className="p-4">
                    <Form onSubmit={handlePasswordChange}>
                      <Form.Group className="mb-4">
                        <Form.Label>Current Password</Form.Label>
                        <Form.Control
                          type="password"
                          placeholder="Enter your current password"
                          value={passwordData.current_password}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              current_password: e.target.value,
                            })
                          }
                        />
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label>New Password</Form.Label>
                        <Form.Control
                          type="password"
                          placeholder="Enter new password"
                          value={passwordData.new_password}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              new_password: e.target.value,
                            })
                          }
                        />
                        <Form.Text className="d-block mt-2">
                          Must be at least 8 characters
                        </Form.Text>
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label>Confirm New Password</Form.Label>
                        <Form.Control
                          type="password"
                          placeholder="Confirm new password"
                          value={passwordData.confirm_password}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirm_password: e.target.value,
                            })
                          }
                        />
                      </Form.Group>

                      <Button
                        variant="warning"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? 'Updating...' : 'Change Password'}
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Tab>

              {/* Notifications Tab */}
              {!isAdmin && (
                <Tab eventKey="notifications" title="Notifications">
                  <Card>
                    <Card.Body className="p-4">
                      <Form>
                        <Form.Group className="mb-4">
                          <Form.Check
                            type="switch"
                            id="email-notifications"
                            label="Email Notifications"
                            checked={notificationPreferences.email_notifications}
                            onChange={(e) =>
                              setNotificationPreferences({
                                ...notificationPreferences,
                                email_notifications: e.target.checked,
                              })
                            }
                          />
                          <Form.Text className="d-block mt-2">
                            Receive email notifications for important updates
                          </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-4">
                          <Form.Check
                            type="switch"
                            id="task-reminders"
                            label="Task Reminders"
                            checked={notificationPreferences.task_reminders}
                            onChange={(e) =>
                              setNotificationPreferences({
                                ...notificationPreferences,
                                task_reminders: e.target.checked,
                              })
                            }
                          />
                          <Form.Text className="d-block mt-2">
                            Get reminders for upcoming task deadlines
                          </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-4">
                          <Form.Check
                            type="switch"
                            id="group-updates"
                            label="Group Updates"
                            checked={notificationPreferences.group_updates}
                            onChange={(e) =>
                              setNotificationPreferences({
                                ...notificationPreferences,
                                group_updates: e.target.checked,
                              })
                            }
                          />
                          <Form.Text className="d-block mt-2">
                            Receive notifications for group activities
                          </Form.Text>
                        </Form.Group>

                        <Button
                          variant="success"
                          onClick={handleNotificationUpdate}
                          disabled={loading}
                        >
                          {loading ? 'Saving...' : 'Save Preferences'}
                        </Button>
                      </Form>
                    </Card.Body>
                  </Card>
                </Tab>
              )}

              {/* Linked Subjects Tab */}
              {!isAdmin && (
                <Tab eventKey="subjects" title="My Subjects">
                  <Card>
                    <Card.Body className="p-4">
                      {linkedSubjects.length > 0 ? (
                        <div>
                          {linkedSubjects.map((subject) => (
                            <div
                              key={subject.id}
                              className="p-3 border-bottom d-flex justify-content-between align-items-center"
                            >
                              <div>
                                <h6 className="mb-1">{subject.name}</h6>
                                <small className="text-muted">Code: {subject.code}</small>
                              </div>
                              <span className="badge bg-primary">Enrolled</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted">
                          No subjects enrolled yet. Wait for admin to assign subjects.
                        </p>
                      )}
                    </Card.Body>
                  </Card>
                </Tab>
              )}
            </Tabs>
          </Col>

          {/* User Info Card */}
          <Col lg={4}>
            <Card className="info-card">
              <Card.Body className="text-center">
                <div className="avatar mb-3">
                  <div className="avatar-placeholder">
                    {user?.full_name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                </div>
                <h5>{user?.full_name}</h5>
                <p className="text-muted mb-2">{user?.email}</p>
                <span className={`badge bg-${user?.role === 'admin' ? 'danger' : 'success'}`}>
                  {user?.role?.toUpperCase()}
                </span>
                <div className="mt-4 pt-4 border-top">
                  <div className="mb-3">
                    <small className="text-muted d-block">Status</small>
                    <span className="badge bg-success">{user?.status?.toUpperCase()}</span>
                  </div>
                  {!isAdmin && user?.student_id && (
                    <div>
                      <small className="text-muted d-block">Student ID</small>
                      <span>{user?.student_id}</span>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Profile;
