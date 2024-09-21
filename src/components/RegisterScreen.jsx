import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { signUpWithEmailAndPassword, db, getDefaultProfilePhotoURL, signUpWithGoogle } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../styles/register.css';

const RegisterScreen = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const initialValues = {
    name: '',
    email: '',
    password: ''
  };

  const validationSchema = Yup.object({
    name: Yup.string().required('Name required'),
    email: Yup.string().email('Invalid email address').required('Email required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password required')
  });

  const onSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      setRegisterError('');
      const userCredential = await signUpWithEmailAndPassword(values.email, values.password, values.name);
      if (!userCredential || !userCredential.user) {
        throw new Error('Failed to sign up');
      }

      const user = userCredential.user;
      console.log('User signed up successfully:', user);

      const defaultPhotoURL = await getDefaultProfilePhotoURL();

      await setDoc(doc(db, 'users', user.uid), {
        name: values.name,
        email: values.email,
        profilePhoto: defaultPhotoURL,
        bio: '',
        isActive: true
      });

      console.log('User data added to Firestore');
      navigate('/login');
    } catch (error) {
      console.error('Error signing up:', error);
      setRegisterError('Failed to sign up. Please check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setRegisterError('');
      const user = await signUpWithGoogle();
      console.log('Google user signed up:', user);
      navigate('/login');
    } catch (error) {
      console.error('Error signing up with Google:', error);
      setRegisterError('Error signing up with Google');
    }
  };

  return (
    <section className="register-container">
      <div className="register-form-container">
        <h2 className="createacc">Create New Account</h2>
        <p className="aauser">
          Already a user? <Link to="/login" style={{ color: 'rgb(10,145,255)' }}>Login here.</Link>
        </p>
        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
          {({ isSubmitting, errors, touched }) => (
            <Form className="register-form">
              <Field className="username" type="text" name="name" placeholder="Name" />
              
              <Field type="email" name="email" placeholder="Email" />
              
              <div className="password-container">
                <Field
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                />
                <div
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  role="button"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
              
              <div className="error-container">
                {(errors.name && touched.name) || (errors.email && touched.email) || (errors.password && touched.password) ? (
                  <div className="error-message">{errors.name || errors.email || errors.password}</div>
                ) : registerError ? (
                  <div className="error-message">{registerError}</div>
                ) : null}
              </div>
              
              <div className="button-container">
                <button className="google-register-btn" onClick={handleGoogleSignUp} type="button">
                  <img src="/google-logo.png" alt="Google" className="google-logo" />
                </button>
                <button className="register-btn" type="submit" disabled={isSubmitting}>Register</button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
      
      <div className="blue-rectangle">
        <img className="questsimg" src="/Questslogo white.png" alt="Quests logo" />
        <h3>Welcome!</h3>
        <p>Join our community today and unlock a world of possibilities. Connect, share, and grow with us!</p>
      </div>
    </section>
  );
};

export default RegisterScreen;