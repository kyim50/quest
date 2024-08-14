import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { signUpWithEmailAndPassword, db, getDefaultProfilePhotoURL, signUpWithGoogle } from '../firebase'; // Adjust the path if necessary
import { doc, setDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaGoogle } from 'react-icons/fa'; // Import eye and Google icons from react-icons
import '../styles/register.css'; // Custom styles

const RegisterScreen = () => {
  const navigate = useNavigate();

  // State to toggle password visibility
  const [showPassword, setShowPassword] = useState(false);

  const initialValues = {
    name: '',
    email: '',
    password: ''
  };

  const validationSchema = Yup.object({
    name: Yup.string().required('Required'),
    email: Yup.string().email('Invalid email address').required('Required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Required') // Updated validation
  });

  const onSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      // Sign up the user with email and password
      const userCredential = await signUpWithEmailAndPassword(values.email, values.password, values.name);
      if (!userCredential || !userCredential.user) {
        throw new Error('Failed to sign up');
      }

      const user = userCredential.user;
      console.log('User signed up successfully:', user);

      // Get the default profile photo URL
      const defaultPhotoURL = await getDefaultProfilePhotoURL();

      // Save user data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: values.name,
        email: values.email,
        profilePhoto: defaultPhotoURL, // Use the default photo URL
        bio: '',
        isActive: true // Ensure isActive is set to true
      });

      console.log('User data added to Firestore');
      navigate('/login'); // Redirect to the login screen
    } catch (error) {
      console.error('Error signing up:', error);
      setErrors({ general: 'Failed to sign up. Please check your details and try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Function to handle Google registration
  const handleGoogleSignUp = async () => {
    try {
      const user = await signUpWithGoogle();
      console.log('Google user signed up:', user);
      navigate('/login'); // Redirect to the login screen
    } catch (error) {
      console.error('Error signing up with Google:', error);
    }
  };

  return (
    <section className="register-container">
    
        <h2 className="createacc" >Create New Account</h2>
        <p className="aauser">
          Already a user? <Link to="/login" style={{ color: 'rgb(10,145,255)' }}>Login here.</Link>
        </p>
        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
          {({ isSubmitting, errors }) => (
            <Form className="register-form">
            <Field className="username" type="text" name="name" placeholder="Username" />
            <ErrorMessage name="name" component="div" style={{ color: 'red' }} />
            <Field type="email" name="email" placeholder="Email" />
            <ErrorMessage name="email" component="div" style={{ color: 'red' }} />
            
            {/* Password input with toggle icon */}
            <div className="password-container">
                <Field type={showPassword ? "text" : "password"} name="password" placeholder="Password" />
                <div className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
            </div>
            <ErrorMessage name="password" component="div" style={{ color: 'red' }} />
            
            <div className="button-container">
                <button className="google-register-btn" onClick={handleGoogleSignUp}>
                    <FaGoogle /> Register with Google
                </button>
                <button type="submit" disabled={isSubmitting}>Register</button>
                
            </div>
            
            {errors.general && <div style={{ color: 'red', marginTop: '10px' }}>{errors.general}</div>}
        </Form>
        
          )}
        </Formik>

        
     
    </section>
  );
};

export default RegisterScreen;
