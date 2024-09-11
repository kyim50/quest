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

  const initialValues = {
    name: '',
    email: '',
    password: ''
  };

  const validationSchema = Yup.object({
    name: Yup.string().required('Required'),
    email: Yup.string().email('Invalid email address').required('Required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Required')
  });

  const onSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
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
      setErrors({ general: 'Failed to sign up. Please check your details and try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const user = await signUpWithGoogle();
      console.log('Google user signed up:', user);
      navigate('/login');
    } catch (error) {
      console.error('Error signing up with Google:', error);
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
          {({ isSubmitting, errors }) => (
            <Form className="register-form">
              <Field className="username" type="text" name="name" placeholder="Username" required />
              <ErrorMessage name="name" component="div" style={{ color: 'red' }} />
              
              <Field type="email" name="email" placeholder="Email" required />
              <ErrorMessage name="email" component="div" style={{ color: 'red' }} />
              
              <div className="password-container">
                <Field
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  required
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
              <ErrorMessage name="password" component="div" style={{ color: 'red' }} />
              
              <div className="button-container">
                <button className="google-register-btn" onClick={handleGoogleSignUp} type="button">
                  <img src="/google-logo.png" alt="Google" className="google-logo" />
                </button>
                <button className="register-btn" type="submit" disabled={isSubmitting}>Register</button>
              </div>
              
              {errors.general && <div style={{ color: 'red', marginTop: '10px' }}>{errors.general}</div>}
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