import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  ListGroup,
  Card,
  Button,
  Form,
  Modal,
  Spinner,
  Alert,
  InputGroup,
} from 'react-bootstrap';
import { FaPlus, FaSearch, FaUserPlus } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import BasicChat from '../components/ui/basic-chat';
import './Groups.css';

const Groups = () => {
  const { user, logout } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    subject_id: '',
  });
  const [inviteData, setInviteData] = useState({
    email: '',
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupMessages();
      fetchGroupMembers();
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/student/groups`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      setGroups(response.data.groups || []);
      if (response.data.groups && response.data.groups.length > 0) {
        setSelectedGroup(response.data.groups[0]);
      }
    } catch (err) {
      setError('Failed to load groups');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupMessages = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/student/groups/${selectedGroup.id}/messages`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const fetchGroupMembers = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/student/groups/${selectedGroup.id}/members`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      setGroupMembers(response.data.members || []);
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/student/groups/${selectedGroup.id}/messages`,
        { message: newMessage },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      setNewMessage('');
      fetchGroupMessages();
    } catch (err) {
      setError('Failed to send message');
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupData.name) {
      setError('Group name is required');
      return;
    }

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/student/groups`,
        newGroupData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      fetchGroups();
      setShowCreateModal(false);
      setNewGroupData({ name: '', subject_id: '' });
    } catch (err) {
      setError('Failed to create group');
    }
  };

  const handleSendInvite = async () => {
    if (!inviteData.email) {
      setError('Email is required');
      return;
    }

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/student/groups/${selectedGroup.id}/invite`,
        inviteData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      setShowInviteModal(false);
      setInviteData({ email: '' });
      fetchGroupMembers();
    } catch (err) {
      setError('Failed to send invite');
    }
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <>
      <Navbar user={user} onLogout={logout} />
      <Container fluid className="py-4">
        {error && <Alert variant="danger">{error}</Alert>}

        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Study Groups</h1>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <FaPlus className="me-2" />
            Create Group
          </Button>
        </div>

        <Row className="groups-layout">
          {/* Sidebar */}
          <Col lg={3} className="mb-4 mb-lg-0">
            <Card className="sidebar-card">
              <Card.Body>
                <InputGroup className="mb-3">
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search groups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>

                <h6 className="mb-3">My Groups ({filteredGroups.length})</h6>
                <ListGroup>
                  {filteredGroups.map((group) => (
                    <ListGroup.Item
                      key={group.id}
                      action
                      active={selectedGroup?.id === group.id}
                      onClick={() => setSelectedGroup(group)}
                      className="group-item"
                    >
                      <div className="fw-bold">{group.name}</div>
                      <small className="text-muted">{group.member_count} members</small>
                    </ListGroup.Item>
                  ))}
                </ListGroup>

                {filteredGroups.length === 0 && (
                  <Alert variant="info" className="mt-3">
                    No groups found. Create one to get started!
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Main Area */}
          <Col lg={9}>
            {selectedGroup ? (
              <div className="groups-content">
                <Row>
                  {/* Chat Area */}
                  <Col lg={8} className="mb-4 mb-lg-0">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h5 className="mb-0">{selectedGroup.name}</h5>
                        <small className="text-muted">{selectedGroup.subject}</small>
                      </div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => setShowInviteModal(true)}
                      >
                        <FaUserPlus className="me-2" />
                        Invite
                      </Button>
                    </div>

                    <BasicChat
                      userName={selectedGroup.name}
                      userAvatar="https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=120&q=80"
                      userOnline={true}
                      messages={(messages || []).map((m) => ({
                        id: String(m.id),
                        content: m.message,
                        sender: m.sender_id === user?.id ? 'me' : 'other',
                      }))}
                      newMessage={newMessage}
                      setNewMessage={setNewMessage}
                      onSendMessage={handleSendMessage}
                    />
                  </Col>

                  {/* Members Area */}
                  <Col lg={4}>
                    <Card>
                      <Card.Header>
                        <h6 className="mb-0">Members ({groupMembers.length})</h6>
                      </Card.Header>
                      <Card.Body>
                        <ListGroup variant="flush">
                          {groupMembers.map((member) => (
                            <ListGroup.Item key={member.id} className="d-flex justify-content-between">
                              <div>
                                <div className="fw-bold">{member.full_name}</div>
                                <small className="text-muted">
                                  {member.student_id}
                                </small>
                              </div>
                              <span
                                className={`badge bg-${
                                  member.status === 'active' ? 'success' : 'warning'
                                }`}
                              >
                                {member.status}
                              </span>
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            ) : (
              <Card>
                <Card.Body className="text-center py-5">
                  <p className="text-muted">Select a group to start chatting</p>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>

        {/* Create Group Modal */}
        <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Create New Group</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Group Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter group name"
                  value={newGroupData.name}
                  onChange={(e) =>
                    setNewGroupData({ ...newGroupData, name: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Subject (Optional)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Related subject"
                  value={newGroupData.subject_id}
                  onChange={(e) =>
                    setNewGroupData({ ...newGroupData, subject_id: e.target.value })
                  }
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateGroup}>
              Create Group
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Invite Modal */}
        <Modal show={showInviteModal} onHide={() => setShowInviteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Invite to {selectedGroup?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter email to invite"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSendInvite}>
              Send Invite
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
};

export default Groups;
