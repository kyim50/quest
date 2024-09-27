import React, { useState, useEffect } from 'react';
import './Feed.css';
import QuestCard, { DummyCard } from './card/QuestCard';
import { db } from '../../firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  deleteDoc,
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
      }));
      setQuests(fetchedQuests);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'quests', id));
      setQuests(quests.filter((quest) => quest.id !== id));
    } catch (error) {
      console.error('Error deleting quest:', error);
    }
  };

  const dummyCards = [
    { aspectRatio: 3 / 4 },
    { aspectRatio: 9 / 16 },
    { aspectRatio: 1 / 1 },
    { aspectRatio: 3 / 4 },
    { aspectRatio: 1 / 1 },
    { aspectRatio: 9 / 16 },
    { aspectRatio: 1 / 1 },
    { aspectRatio: 1 / 1 },
    { aspectRatio: 9 / 16 },
    { aspectRatio: 3 / 4 },
    { aspectRatio: 9 / 16 },
  ];

  const combinedCards = [...quests, ...dummyCards];
  combinedCards.sort(() => Math.random() - 0.5); // Shuffle the array

  return (
    <div className="feed">
      {combinedCards.map((card, index) => 
        card.id ? (
          <QuestCard
            key={card.id}
            imageUrl={card.imageUrl}
            aspectRatio={card.aspectRatio}
            time={card.time}
            user={card.user}
            description={card.description}
            onClick={() => handleDelete(card.id)}
          />
        ) : (
          <DummyCard key={`dummy-${index}`} aspectRatio={card.aspectRatio} />
        )
      )}
    </div>
  );
}

export default Feed;