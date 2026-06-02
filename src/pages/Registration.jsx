import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../context/AuthContext';
import './Registration.css';

const validationSchema = yup.object().shape({
  student_id: yup
    .string()
    .required('Student ID is required')
    .min(5, 'Student ID must be at least 5 characters'),
  full_name: yup
    .string()
    .required('Full name is required')
    .min(3, 'Name must be at least 3 characters'),
  email: yup
    .string()
    .email('Invalid email address')
    .required('Email is required'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[0-9]/, 'Password must contain a number')
    .matches(/[a-zA-Z]/, 'Password must contain a letter'),
  confirm_password: yup
    .string()
    .required('Confirm password is required')
    .oneOf([yup.ref('password'), null], 'Passwords must match'),
});

const Registration = () => {
  const navigate = useNavigate();
  const { register: registerUser, loading } = useAuth();
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      student_id: '',
      full_name: '',
      email: '',
      password: '',
      confirm_password: '',
    },
  });

  const onSubmit = async (data) => {
    setErrorMessage('');
    setSuccessMessage('');

    const registrationData = {
      student_id: data.student_id,
      full_name: data.full_name,
      email: data.email,
      password: data.password,
    };

    const result = await registerUser(registrationData);
    if (result.success) {
      setSuccessMessage(
        result.message ||
        'Registration successful! Your account is pending admin approval. You will be redirected to login.'
      );
      reset();
      setTimeout(() => navigate('/'), 3000);
    } else {
      setErrorMessage(result.error);
    }
  };

  return (
    <div className="registration-page">
      <Container className="py-5">
        <div className="text-center mb-5">
          <h1 className="display-4 fw-bold">Create Account</h1>
          <p className="lead text-muted">Join Smart Study Planner as a Student</p>
        </div>

        <div className="row justify-content-center">
          <div className="col-md-6">
            <Card className="shadow-lg">
              <Card.Body className="p-5">
                {successMessage && <Alert variant="success">{successMessage}</Alert>}
                {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

                <Form onSubmit={handleSubmit(onSubmit)}>
                  <Form.Group className="mb-3">
                    <Form.Label>Student ID</Form.Label>
                    <Controller
                      name="student_id"
                      control={control}
                      render={({ field }) => (
                        <Form.Control
                          {...field}
                          type="text"
                          placeholder="Enter your student ID"
                          isInvalid={!!errors.student_id}
                        />
                      )}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.student_id?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Full Name</Form.Label>
                    <Controller
                      name="full_name"
                      control={control}
                      render={({ field }) => (
                        <Form.Control
                          {...field}
                          type="text"
                          placeholder="Enter your full name"
                          isInvalid={!!errors.full_name}
                        />
                      )}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.full_name?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Controller
                      name="email"
                      control={control}
                      render={({ field }) => (
                        <Form.Control
                          {...field}
                          type="email"
                          placeholder="Enter your email"
                          isInvalid={!!errors.email}
                        />
                      )}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.email?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Controller
                      name="password"
                      control={control}
                      render={({ field }) => (
                        <Form.Control
                          {...field}
                          type="password"
                          placeholder="Create a strong password"
                          isInvalid={!!errors.password}
                        />
                      )}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.password?.message}
                    </Form.Control.Feedback>
                    <Form.Text className="d-block mt-2">
                      Password must be at least 8 characters with numbers and letters
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Confirm Password</Form.Label>
                    <Controller
                      name="confirm_password"
                      control={control}
                      render={({ field }) => (
                        <Form.Control
                          {...field}
                          type="password"
                          placeholder="Confirm your password"
                          isInvalid={!!errors.confirm_password}
                        />
                      )}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.confirm_password?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? 'Registering...' : 'Register'}
                  </Button>

                  <p className="text-center">
                    Already have an account?{' '}
                    <Link to="/" className="text-decoration-none">
                      Login here
                    </Link>
                  </p>
                </Form>

                <div className="alert alert-info mt-4">
                  <small>
                    <strong>Note:</strong> Your account will be pending admin approval after
                    registration. You'll receive an email once approved.
                  </small>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Registration;
