import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { signInWithEmailAndPassword, signInWithGoogle } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../styles/login.css';

const LoginScreen = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

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
        const user = userCredential.user;
        console.log('User signed in:', user.uid);
        navigate('/home');
      })
      .catch((error) => {
        console.error('Error signing in:', error);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleGoogleLogin = async () => {
    try {
      const user = await signInWithGoogle();
      if (user) {
        navigate('/home');
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <section className="login-container">
      <div className="login-form-container">
        <h1>Login</h1>
        <p className="linktoregister">
          Not a user? <Link to="/register" className="gotoregister" style={{ color: 'rgb(10,145,255)' }}>Create an account here</Link>
        </p>

        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
          {({ isSubmitting }) => (
            <Form className="login-form">
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

              <div className='buttons'>
                <button className="google-login-btn" onClick={handleGoogleLogin} type="button">
                  <img src="/google-logo.png" alt="Google" className="google-logo" />
                </button>
                <button className="loginbtn" type="submit" disabled={isSubmitting}>
                  Login
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
      <div className="blue-rectangle">
        <img className="questsimg" src="/Questslogo white.png" alt="Quests logo" />
        <h3>Welcome Back!</h3>
        <p>We're glad to see you again. Log in to continue where you left off.</p>
      </div>
    </section>
  );
};

export default LoginScreen;