import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Table,
  Button,
  Form,
  Modal,
  Spinner,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
} from 'react-bootstrap';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Tasks.css';

const localizer = momentLocalizer(moment);

const Tasks = () => {
  const { user, logout } = useAuth();
  const [viewMode, setViewMode] = useState('list');
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('due_date');
  const [showModal, setShowModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    subject_id: '',
    due_date: '',
    status: 'pending',
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [tasks, filterStatus, sortBy]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/student/tasks`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      setTasks(response.data.tasks || []);
    } catch (err) {
      setError('Failed to load tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...tasks];

    // Apply filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((task) => task.status === filterStatus);
    }

    // Check for overdue
    if (filterStatus === 'overdue') {
      filtered = tasks.filter((task) => {
        const dueDate = new Date(task.due_date);
        return dueDate < new Date() && task.status !== 'completed';
      });
    }

    // Apply sort
    filtered.sort((a, b) => {
      if (sortBy === 'due_date') {
        return new Date(a.due_date) - new Date(b.due_date);
      } else if (sortBy === 'priority') {
        return (a.priority || 0) - (b.priority || 0);
      }
      return 0;
    });

    setFilteredTasks(filtered);
  };

  const handleAddTask = async () => {
    if (!newTask.title) {
      setError('Title is required');
      return;
    }

    try {
      if (editingTaskId) {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/student/tasks/${editingTaskId}`,
          newTask,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
          }
        );
      } else {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/student/tasks`,
          newTask,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
          }
        );
      }
      fetchTasks();
      setShowModal(false);
      setEditingTaskId(null);
      setNewTask({
        title: '',
        description: '',
        subject_id: '',
        due_date: '',
        status: 'pending',
      });
    } catch (err) {
      setError(editingTaskId ? 'Failed to update task' : 'Failed to create task');
    }
  };

  const openEditTask = (task) => {
    setError('');
    setEditingTaskId(task.id);
    // Convert stored due_date to yyyy-mm-dd for <input type="date">
    const dateOnly = task.due_date ? new Date(task.due_date).toISOString().slice(0, 10) : '';
    setNewTask({
      title: task.title || '',
      description: task.description || '',
      subject_id: task.subject_id || '',
      due_date: dateOnly,
      status: task.status || 'pending',
    });
    setShowModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/student/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      fetchTasks();
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  const calendarEvents = filteredTasks.map((task) => ({
    id: task.id,
    title: task.title,
    start: new Date(task.due_date),
    end: new Date(task.due_date),
    resource: task,
  }));

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
          <h1>Tasks</h1>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            + Add Task
          </Button>
        </div>

        {/* Controls */}
        <Row className="mb-4">
          <Col md={3}>
            <Form.Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="due_date">Sort by Due Date</option>
              <option value="priority">Sort by Priority</option>
            </Form.Select>
          </Col>
          <Col md={6} className="text-end">
            <ToggleButtonGroup
              type="radio"
              name="view"
              value={viewMode}
              onChange={setViewMode}
            >
              <ToggleButton id="list-view" variant="outline-primary" value="list">
                List View
              </ToggleButton>
              <ToggleButton id="calendar-view" variant="outline-primary" value="calendar">
                Calendar View
              </ToggleButton>
            </ToggleButtonGroup>
          </Col>
        </Row>

        {/* List View */}
        {viewMode === 'list' && (
          <div className="table-responsive">
            <Table hover>
              <thead className="table-dark">
                <tr>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <tr key={task.id}>
                      <td>{task.title}</td>
                      <td>{task.subject}</td>
                      <td>{new Date(task.due_date).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge bg-${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => openEditTask(task)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      No tasks found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        )}

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="calendar-container">
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
            />
          </div>
        )}

        {/* Add Task Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>{editingTaskId ? 'Edit Task' : 'Add New Task'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Task description"
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Due Date</Form.Label>
                <Form.Control
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={newTask.status}
                  onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </Form.Select>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={handleAddTask}>
              {editingTaskId ? 'Update Task' : 'Add Task'}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in-progress':
      return 'info';
    case 'pending':
      return 'warning';
    case 'overdue':
      return 'danger';
    default:
      return 'secondary';
  }
};

export default Tasks;
