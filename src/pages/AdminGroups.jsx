import React, { useState, useEffect } from 'react';
import {
  Container,
  Table,
  Button,
  Modal,
  Spinner,
  Alert,
  Card,
  Form,
} from 'react-bootstrap';
import { FaDownload } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './AdminGroups.css';

const AdminGroups = () => {
  const { user, logout } = useAuth();
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterSubject, setFilterSubject] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    fetchGroups();
    fetchSubjects();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [groups, filterSubject, startDate, endDate]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/groups`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      setGroups(response.data.groups || []);
    } catch (err) {
      setError('Failed to load groups');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/subjects`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      setSubjects(response.data.subjects || []);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...groups];

    // Filter by subject
    if (filterSubject !== 'all') {
      filtered = filtered.filter((group) => group.subject_id === filterSubject);
    }

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter((group) => new Date(group.created_at) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((group) => new Date(group.created_at) <= end);
    }

    setFilteredGroups(filtered);
  };

  const handleViewDetails = (group) => {
    setSelectedGroup(group);
    setShowDetailModal(true);
  };

  const handleRemoveGroup = async (groupId) => {
    if (
      window.confirm(
        'Are you sure you want to remove this group? This action cannot be undone.'
      )
    ) {
      try {
        await axios.delete(
          `${process.env.REACT_APP_API_URL}/api/admin/groups/${groupId}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
          }
        );
        fetchGroups();
        setShowDetailModal(false);
      } catch (err) {
        setError('Failed to remove group');
      }
    }
  };

  const exportToCSV = () => {
    const headers = ['Group Name', 'Subject', 'Created By', 'Members Count', 'Created Date'];
    const rows = filteredGroups.map((group) => [
      group.name,
      group.subject,
      group.created_by_name,
      group.member_count,
      new Date(group.created_at).toLocaleDateString(),
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'groups_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <Navbar user={user} onLogout={logout} />
      <Container className="py-5">
        {error && <Alert variant="danger">{error}</Alert>}

        <div className="d-flex justify-content-between align-items-center mb-5">
          <h1>Group Monitoring</h1>
          <Button
            variant="success"
            onClick={exportToCSV}
            disabled={filteredGroups.length === 0}
          >
            <FaDownload className="me-2" />
            Export to CSV
          </Button>
        </div>

        {/* Filter Section */}
        <Card className="mb-5 filter-card">
          <Card.Body>
            <div className="row g-3">
              <div className="col-md-4">
                <Form.Label>Filter by Subject</Form.Label>
                <Form.Select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                >
                  <option value="all">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </Form.Select>
              </div>
              <div className="col-md-4">
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            {(filterSubject !== 'all' || startDate || endDate) && (
              <div className="mt-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setFilterSubject('all');
                    setStartDate('');
                    setEndDate('');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Groups Table */}
        <Card>
          <Card.Header>
            <h5 className="mb-0">All Groups ({filteredGroups.length})</h5>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table hover>
                <thead className="table-dark">
                  <tr>
                    <th>Group Name</th>
                    <th>Subject</th>
                    <th>Created By</th>
                    <th>Members</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.length > 0 ? (
                    filteredGroups.map((group) => (
                      <tr key={group.id}>
                        <td>
                          <strong>{group.name}</strong>
                        </td>
                        <td>{group.subject || 'N/A'}</td>
                        <td>{group.created_by_name}</td>
                        <td>
                          <span className="badge bg-info">
                            {group.member_count} members
                          </span>
                        </td>
                        <td>{new Date(group.created_at).toLocaleDateString()}</td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleViewDetails(group)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemoveGroup(group.id)}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        No groups found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>

        {/* Group Details Modal */}
        <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{selectedGroup?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedGroup && (
              <div>
                <div className="mb-4">
                  <h6 className="text-muted">Subject</h6>
                  <p>{selectedGroup.subject || 'Not specified'}</p>
                </div>

                <div className="mb-4">
                  <h6 className="text-muted">Created By</h6>
                  <p>{selectedGroup.created_by_name}</p>
                </div>

                <div className="mb-4">
                  <h6 className="text-muted">Created Date</h6>
                  <p>{new Date(selectedGroup.created_at).toLocaleString()}</p>
                </div>

                <div className="mb-4">
                  <h6 className="text-muted">Members ({selectedGroup.member_count})</h6>
                  {selectedGroup.members && selectedGroup.members.length > 0 ? (
                    <ul className="list-unstyled">
                      {selectedGroup.members.map((member) => (
                        <li key={member.id} className="mb-2">
                          <strong>{member.full_name}</strong>
                          <br />
                          <small className="text-muted">
                            ID: {member.student_id} • Status: {member.status}
                          </small>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted">No members</p>
                  )}
                </div>

                <div className="mb-4">
                  <h6 className="text-muted">Description</h6>
                  <p>
                    {selectedGroup.description || 'No description provided'}
                  </p>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
              Close
            </Button>
            <Button
              variant="danger"
              onClick={() => handleRemoveGroup(selectedGroup?.id)}
            >
              Remove Group
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
};

export default AdminGroups;
