import { signUpWithEmailAndPassword } from './firebase.js'; // Note the .js extension

const initialUsers = [
  { email: 'user1@example.com', password: 'password1', name: 'User One' },
  { email: 'user2@example.com', password: 'password2', name: 'User Two' },
  // Add more users as needed
];

initialUsers.forEach(async (user) => {
  try {
    await signUpWithEmailAndPassword(user.email, user.password, user.name);
    console.log(`User ${user.name} signed up successfully`);
  } catch (error) {
    console.error(`Error signing up user ${user.name}:`, error);
  }
});
