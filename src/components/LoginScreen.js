import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { signInWithEmailAndPassword, signInWithGoogle } from '../firebase'; // Import signInWithGoogle
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaGoogle } from 'react-icons/fa'; // Import icons
import '../styles/login.css'; // Custom styles




const LoginScreen = () => {
  const navigate = useNavigate(); // Initialize navigate
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

  const initialValues = {
    email: '',
    password: ''
  };

  const validationSchema = Yup.object({
    email: Yup.string().email('Invalid email address').required('Required'),
    password: Yup.string().required('Required')
  });

  const onSubmit = (values, { setSubmitting }) => {
    signInWithEmailAndPassword(values.email, values.password)
      .then((userCredential) => {
        // User signed in successfully
        const user = userCredential.user;
        console.log('User signed in:', user.uid);
        navigate('/home'); // Redirect to home screen
      })
      .catch((error) => {
        // Handle error
        console.error('Error signing in:', error);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  // Function to toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Function to handle Google login
  const handleGoogleLogin = async () => {
    try {
      const user = await signInWithGoogle(); // Use the signInWithGoogle function
      if (user) {
        navigate('/home'); // Redirect to home screen
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <div className="login-screen">

      <div className="container">
        <h1>Login</h1>

        

        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
          {({ isSubmitting }) => (
            <Form className="register-form">
              <Field type="email" name="email" placeholder="Email Address" required />
              <ErrorMessage name="email" component="div" style={{ color: 'red' }} />
              
              <div className="password-container">
                <Field
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  required
                />
                <span
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  role="button"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              <ErrorMessage name="password" component="div" style={{ color: 'red' }} />

              <button type="submit" disabled={isSubmitting}>
                Login
              </button>
            </Form>
          )}
        </Formik>

        <div className="separator"></div> {/* Thin line separating the buttons */}
          {/* Google login button */}
          <a href="#" className="google-login-link" onClick={handleGoogleLogin}>
          <FaGoogle /> Login with Google
        </a>
        <p className="or-text">or</p>

        <p className="login-section">
          <Link to="/register" className="register-btn">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
