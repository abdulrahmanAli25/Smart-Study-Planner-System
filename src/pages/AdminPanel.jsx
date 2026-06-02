import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  Modal,
  Spinner,
  Alert,
  Tabs,
  Tab,
} from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState({
    total_students: 0,
    pending_approvals: 0,
    active_groups: 0,
  });
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [newSubject, setNewSubject] = useState({
    code: '',
    name: '',
  });
  const [editingSubject, setEditingSubject] = useState(null);

  const [showStudentSubjectsModal, setShowStudentSubjectsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [studentSubjectsLoading, setStudentSubjectsLoading] = useState(false);
  const [studentSubjectsSaving, setStudentSubjectsSaving] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchStudents();
    fetchSubjects();
    fetchActivityLog();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/dashboard`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      setDashboardStats(response.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/students`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      setStudents(response.data.students || []);
    } catch (err) {
      setError('Failed to load students');
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

  const fetchActivityLog = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/activity-log`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      setActivityLog(response.data.activities || []);
    } catch (err) {
      console.error('Failed to fetch activity log:', err);
    }
  };

  const handleApproveStudent = async (studentId) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/students/${studentId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      fetchStudents();
      fetchDashboardData();
    } catch (err) {
      setError('Failed to approve student');
    }
  };

  const handleRejectStudent = async (studentId) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/students/${studentId}/reject`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      fetchStudents();
      fetchDashboardData();
    } catch (err) {
      setError('Failed to reject student');
    }
  };

  const handleSuspendStudent = async (studentId) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/students/${studentId}/suspend`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      fetchStudents();
      fetchDashboardData();
    } catch (err) {
      setError('Failed to suspend student');
    }
  };

  const handleAddSubject = async () => {
    if (!newSubject.code || !newSubject.name) {
      setError('Code and name are required');
      return;
    }

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/subjects`,
        newSubject,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      fetchSubjects();
      setShowModal(false);
      setNewSubject({ code: '', name: '' });
    } catch (err) {
      setError('Failed to add subject');
    }
  };

  const handleUpdateSubject = async () => {
    if (!editingSubject?.id || !editingSubject.code || !editingSubject.name) {
      setError('Code and name are required');
      return;
    }

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/admin/subjects/${editingSubject.id}`,
        { code: editingSubject.code, name: editingSubject.name },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      fetchSubjects();
      setShowModal(false);
      setEditingSubject(null);
    } catch (err) {
      setError('Failed to update subject');
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await axios.delete(
          `${process.env.REACT_APP_API_URL}/api/admin/subjects/${subjectId}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
          }
        );
        fetchSubjects();
      } catch (err) {
        setError('Failed to delete subject');
      }
    }
  };

  const openStudentSubjects = async (student) => {
    setError('');
    setSelectedStudent(student);
    setSelectedSubjectIds([]);
    setShowStudentSubjectsModal(true);
    setStudentSubjectsLoading(true);

    try {
      const resp = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/students/${student.id}/subjects`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      setSelectedSubjectIds(resp.data.subject_ids || []);
    } catch (err) {
      console.error(err);
      const details = err?.response?.data?.details;
      setError(details ? `Failed to load student subjects: ${details}` : 'Failed to load student subjects');
    } finally {
      setStudentSubjectsLoading(false);
    }
  };

  const toggleStudentSubject = (subjectId) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  };

  const saveStudentSubjects = async () => {
    if (!selectedStudent) return;
    setError('');
    setStudentSubjectsSaving(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/students/${selectedStudent.id}/subjects`,
        { subject_ids: selectedSubjectIds },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      setShowStudentSubjectsModal(false);
      setSelectedStudent(null);
      setSelectedSubjectIds([]);
    } catch (err) {
      console.error(err);
      const details = err?.response?.data?.details;
      setError(details ? `Failed to save student subjects: ${details}` : 'Failed to save student subjects');
    } finally {
      setStudentSubjectsSaving(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.student_id.toLowerCase().includes(searchQuery.toLowerCase())
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
      <Container className="py-5">
        {error && <Alert variant="danger">{error}</Alert>}

        <h1 className="mb-5">Admin Dashboard</h1>

        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
          {/* Dashboard Tab */}
          <Tab eventKey="dashboard" title="Dashboard">
            <Row className="mb-5">
              <Col md={4} className="mb-3">
                <Card className="stat-card">
                  <Card.Body className="text-center">
                    <h2 className="text-primary">{dashboardStats.total_students}</h2>
                    <p className="text-muted">Total Students</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4} className="mb-3">
                <Card className="stat-card">
                  <Card.Body className="text-center">
                    <h2 className="text-warning">{dashboardStats.pending_approvals}</h2>
                    <p className="text-muted">Pending Approvals</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4} className="mb-3">
                <Card className="stat-card">
                  <Card.Body className="text-center">
                    <h2 className="text-success">{dashboardStats.active_groups}</h2>
                    <p className="text-muted">Active Groups</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row>
              <Col lg={8}>
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Recent Activity</h5>
                  </Card.Header>
                  <Card.Body>
                    {activityLog.length > 0 ? (
                      <div className="activity-log">
                        {activityLog.map((activity) => (
                          <div key={activity.id} className="activity-item mb-3">
                            <div className="d-flex justify-content-between">
                              <div>
                                <h6 className="mb-1">{activity.action}</h6>
                                <small className="text-muted">{activity.user_name}</small>
                              </div>
                              <small className="text-muted">
                                {new Date(activity.created_at).toLocaleString()}
                              </small>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">No recent activities</p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={4}>
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Quick Stats</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-3">
                      <small className="text-muted d-block">Active Students</small>
                      <h4>
                        {students.filter((s) => s.status === 'active').length}
                      </h4>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted d-block">Pending Approvals</small>
                      <h4>
                        {students.filter((s) => s.status === 'pending').length}
                      </h4>
                    </div>
                    <div>
                      <small className="text-muted d-block">Total Subjects</small>
                      <h4>{subjects.length}</h4>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>

          {/* Student Management Tab */}
          <Tab eventKey="students" title="Student Management">
            <Card>
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">All Students ({filteredStudents.length})</h5>
                  <Form.Control
                    type="text"
                    placeholder="Search by name, email, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '300px' }}
                  />
                </div>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table hover>
                    <thead className="table-dark">
                      <tr>
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Joined Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr key={student.id}>
                          <td>{student.student_id}</td>
                          <td>{student.full_name}</td>
                          <td>{student.email}</td>
                          <td>
                            <span
                              className={`badge bg-${
                                student.status === 'active'
                                  ? 'success'
                                  : student.status === 'pending'
                                  ? 'warning'
                                  : 'danger'
                              }`}
                            >
                              {student.status}
                            </span>
                          </td>
                          <td>{new Date(student.created_at).toLocaleDateString()}</td>
                          <td>
                            {student.status === 'pending' && (
                              <>
                                <Button
                                  variant="success"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleApproveStudent(student.id)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleRejectStudent(student.id)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {student.status === 'active' && (
                              <>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => openStudentSubjects(student)}
                                >
                                  Assign subjects
                                </Button>
                                <Button
                                  variant="warning"
                                  size="sm"
                                  onClick={() => handleSuspendStudent(student.id)}
                                >
                                  Suspend
                                </Button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Tab>

          {/* Subject Management Tab */}
          <Tab eventKey="subjects" title="Subject Management">
            <div className="mb-4">
              <Button
                variant="primary"
                onClick={() => {
                  setModalType('add');
                  setShowModal(true);
                }}
              >
                + Add Subject
              </Button>
            </div>

            <Row>
              {subjects.map((subject) => (
                <Col md={4} key={subject.id} className="mb-3">
                  <Card>
                    <Card.Body>
                      <Card.Title>{subject.name}</Card.Title>
                      <Card.Text className="text-muted">
                        Code: <strong>{subject.code}</strong>
                      </Card.Text>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            setEditingSubject(subject);
                            setModalType('edit');
                            setShowModal(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteSubject(subject.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            {subjects.length === 0 && (
              <Alert variant="info">No subjects created yet</Alert>
            )}
          </Tab>
        </Tabs>

        {/* Add/Edit Subject Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>
              {modalType === 'add' ? 'Add New Subject' : 'Edit Subject'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Subject Code</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., CS101"
                  value={editingSubject?.code || newSubject.code}
                  onChange={(e) => {
                    if (editingSubject) {
                      setEditingSubject({ ...editingSubject, code: e.target.value });
                    } else {
                      setNewSubject({ ...newSubject, code: e.target.value });
                    }
                  }}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Subject Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Introduction to Computer Science"
                  value={editingSubject?.name || newSubject.name}
                  onChange={(e) => {
                    if (editingSubject) {
                      setEditingSubject({ ...editingSubject, name: e.target.value });
                    } else {
                      setNewSubject({ ...newSubject, name: e.target.value });
                    }
                  }}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (modalType === 'add') {
                  handleAddSubject();
                  setEditingSubject(null);
                } else {
                  handleUpdateSubject();
                }
              }}
            >
              {modalType === 'add' ? 'Add Subject' : 'Update Subject'}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Student Subject Assignment Modal */}
        <Modal
          show={showStudentSubjectsModal}
          onHide={() => {
            if (studentSubjectsSaving) return;
            setShowStudentSubjectsModal(false);
            setSelectedStudent(null);
            setSelectedSubjectIds([]);
          }}
        >
          <Modal.Header closeButton={!studentSubjectsSaving}>
            <Modal.Title>
              Assign subjects
              {selectedStudent ? ` — ${selectedStudent.full_name}` : ''}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {studentSubjectsLoading ? (
              <div className="d-flex justify-content-center py-4">
                <Spinner animation="border" />
              </div>
            ) : subjects.length === 0 ? (
              <Alert variant="info">No subjects yet. Create subjects first.</Alert>
            ) : (
              <Form>
                {subjects.map((subj) => (
                  <Form.Check
                    key={subj.id}
                    type="checkbox"
                    id={`student-subject-${subj.id}`}
                    label={`${subj.code} — ${subj.name}`}
                    checked={selectedSubjectIds.includes(subj.id)}
                    onChange={() => toggleStudentSubject(subj.id)}
                    className="mb-2"
                    disabled={studentSubjectsSaving}
                  />
                ))}
              </Form>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                if (studentSubjectsSaving) return;
                setShowStudentSubjectsModal(false);
                setSelectedStudent(null);
                setSelectedSubjectIds([]);
              }}
              disabled={studentSubjectsSaving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={saveStudentSubjects}
              disabled={studentSubjectsLoading || studentSubjectsSaving || !selectedStudent}
            >
              {studentSubjectsSaving ? 'Saving…' : 'Save'}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
};

export default AdminPanel;
