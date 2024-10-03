// Feed.jsx
import React, { useState, useEffect } from 'react';
import './Feed.css';
import QuestCard from './card/QuestCard';
import { db } from '../../firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';

function Feed() {
  const [quests, setQuests] = useState([]);

  useEffect(() => {
    const questsRef = collection(db, 'quests');
    const q = query(questsRef, orderBy('createdAt', 'desc'), limit(20));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedQuests = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        comments: doc.data().comments || [],
      }));
      setQuests(fetchedQuests);
    });

    return () => unsubscribe();
  }, []);

  const handleAddComment = async (questId, commentText) => {
    try {
      const questRef = doc(db, 'quests', questId);
      const newComment = {
        userName: 'Current User', // Replace with actual user data
        userPhoto: 'https://example.com/user-photo.jpg', // Replace with actual user photo
        text: commentText,
        createdAt: new Date(),
      };
      await updateDoc(questRef, {
        comments: arrayUnion(newComment),
      });
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const dummyCards = [
    { aspectRatio: '3:4' },
    { aspectRatio: '9:16' },
    { aspectRatio: '1:1' },
    { aspectRatio: '3:4' },
    { aspectRatio: '1:1' },
    { aspectRatio: '9:16' },
    { aspectRatio: '1:1' },
    { aspectRatio: '1:1' },
    { aspectRatio: '9:16' },
    { aspectRatio: '3:4' },
    { aspectRatio: '9:16' },
  ];

  const combinedCards = [...quests, ...dummyCards];
  combinedCards.sort(() => Math.random() - 0.5); // Shuffle the array

  return (
    <div className="feed">
      {combinedCards.map((card, index) => 
        card.id ? (
          <QuestCard
            key={card.id}
            id={card.id}
            imageUrl={card.imageUrl}
            aspectRatio={card.aspectRatio}
            time={card.time}
            user={card.user}
            description={card.description}
            comments={card.comments}
            onAddComment={handleAddComment}
          />
        ) : (
          <QuestCard
            key={`dummy-${index}`}
            imageUrl="https://media.tenor.com/o_5RQarGvJ0AAAAM/kiss.gif"
            aspectRatio={card.aspectRatio}
            time="8:08 PM"
            user="Kiity :3"
            description="I am cat and i love yuu"
            comments={[]}
            onAddComment={() => {}}
          />
        )
      )}
    </div>
  );
}

export default Feed;