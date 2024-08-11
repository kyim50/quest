import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Masonry from 'react-masonry-css';
import '../styles/AdventureFeed.css';

const AdventureFeed = () => {
  const [posts, setPosts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageUpload, setImageUpload] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [song, setSong] = useState('');
  const [imageSize, setImageSize] = useState({ width: 300, height: 300 });
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const imageRef = useRef(null);

  useEffect(() => {
    const unsubscribe = listenForPosts();
    return () => unsubscribe();
  }, []);

  const listenForPosts = () => {
    const user = auth.currentUser;
    if (!user) {
      console.error("No authenticated user found");
      return () => {};
    }

    const postsQuery = query(
      collection(db, 'adventurePosts'),
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(postsQuery, async (snapshot) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const friendIds = userDoc.data()?.friends || [];

        const newPosts = await Promise.all(
          snapshot.docs.map(async (docSnapshot) => {
            const postData = docSnapshot.data();
            if (postData.userId === user.uid || friendIds.includes(postData.userId)) {
              try {
                const userDocRef = doc(db, 'users', postData.userId);
                const userDocSnapshot = await getDoc(userDocRef);
                const userData = userDocSnapshot.data();
                return {
                  id: docSnapshot.id,
                  ...postData,
                  username: userData?.username || 'Unknown User',
                  userProfilePic: userData?.profilePhoto || '/default-profile.png'
                };
              } catch (error) {
                console.error("Error fetching user data for post:", error);
                return null;
              }
            }
            return null;
          })
        );

        const filteredPosts = newPosts.filter(post => post !== null);
        console.log("Fetched posts:", filteredPosts);
        setPosts(filteredPosts);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    });
  };

  const handleCapture = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageUpload(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!auth.currentUser) {
      alert("You must be logged in to upload an image.");
      return;
    }

    if (!imageUpload) {
      alert("Please select an image first.");
      return;
    }

    try {
      const imageName = `${auth.currentUser.uid}_${Date.now()}`;
      const imageRef = ref(storage, `adventureImages/${imageName}`);
      await uploadBytes(imageRef, imageUpload);
      const downloadURL = await getDownloadURL(imageRef);

      const newPost = {
        userId: auth.currentUser.uid,
        imageUrl: downloadURL,
        caption,
        song,
        imageSize,
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, 'adventurePosts'), newPost);
      console.log("New post added:", newPost);

      setImageUpload(null);
      setImagePreview(null);
      setCaption('');
      setSong('');
      setImageSize({ width: 300, height: 300 });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error uploading post:", error);
      alert("Failed to upload post. Please try again.");
    }
  };

  const handleResize = (e) => {
    if (!imageRef.current) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = imageRef.current.clientWidth;
    const startHeight = imageRef.current.clientHeight;

    const doDrag = (e) => {
      const newWidth = startWidth + e.clientX - startX;
      const newHeight = startHeight + e.clientY - startY;
      setImageSize({ width: newWidth, height: newHeight });
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  const filteredPosts = posts.filter(post =>
    post.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.caption.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="adventure-feed">
      <header className="adventure-header">
        <img 
          src="/quests logo.png" 
          alt="Quests Logo" 
          className="logo" 
          onClick={() => navigate('/home')}
        />
        <button className="add-adventure-btn" onClick={() => setIsModalOpen(true)}>+</button>
        <input
          type="text"
          placeholder="Search adventures..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />
      </header>

      <main className="adventure-main">
        <Masonry
          breakpointCols={{
            default: 4,
            1100: 3,
            700: 2,
            500: 1
          }}
          className="posts-grid"
          columnClassName="posts-grid_column"
        >
          {filteredPosts.map(post => (
            <div key={post.id} className="post-item">
              <img src={post.imageUrl} alt="Adventure" style={{ width: '100%', height: 'auto' }} />
              <div className="post-overlay">
                <p className="post-caption">{post.caption}</p>
                {post.song && <p className="post-song">🎵 {post.song}</p>}
              </div>
              <div className="post-user-info">
                <img src={post.userProfilePic} alt={post.username} className="user-profile-pic" />
                <span className="post-username">{post.username}</span>
              </div>
            </div>
          ))}
        </Masonry>
      </main>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Post New Adventure</h2>
            <div className="file-input-container">
              <label htmlFor="file-upload" className="file-input-label">
                Choose Image
              </label>
              <input 
                id="file-upload"
                type="file" 
                accept="image/*" 
                onChange={handleCapture}
                className="file-input"
              />
            </div>
            {imagePreview && (
              <div 
                className="image-preview-container" 
                style={{ width: `${imageSize.width}px`, height: `${imageSize.height}px` }}
              >
                <img 
                  ref={imageRef}
                  src={imagePreview} 
                  alt="Preview" 
                  className="image-preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div className="resize-handle" onMouseDown={handleResize}></div>
              </div>
            )}
            <input 
              type="text" 
              placeholder="Add a caption..." 
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Add a song..." 
              value={song}
              onChange={(e) => setSong(e.target.value)}
            />
            <div className="modal-actions">
              <button onClick={handleUpload}>Post Adventure</button>
              <button onClick={() => {
                setIsModalOpen(false);
                setImagePreview(null);
                setImageUpload(null);
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdventureFeed;