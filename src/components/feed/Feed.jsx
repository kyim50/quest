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
    const q = query(questsRef, orderBy('createdAt', 'desc'), limit(20)); // Order by createdAt in descending order

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedQuests = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setQuests(fetchedQuests);
    });

    return () => unsubscribe(); // Cleanup the listener on component unmount
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'quests', id));
      setQuests(quests.filter((quest) => quest.id !== id));
    } catch (error) {
      console.error('Error deleting quest:', error);
    }
  };

  return (
    <div className="feed">
      {/* {quests.map((quest) => (
        <QuestCard
          key={quest.id}
          imageUrl={quest.imageUrl}
          aspectRatio={quest.aspectRatio}
          time={quest.time}
          user={quest.user}
          description={quest.description}
          onClick={() => handleDelete(quest.id)}
        />
      ))} */}
      <DummyCard aspectRatio={3 / 4} />
      <DummyCard aspectRatio={9 / 16} />
      <DummyCard aspectRatio={1 / 1} />
      <DummyCard aspectRatio={3 / 4} />
      <DummyCard aspectRatio={1 / 1} />
      <DummyCard aspectRatio={9 / 16} />
      <DummyCard aspectRatio={1 / 1} />
      <DummyCard aspectRatio={1 / 1} />
      <DummyCard aspectRatio={9 / 16} />
      <DummyCard aspectRatio={3 / 4} />
      <DummyCard aspectRatio={9 / 16} />
    </div>
  );
}

export default Feed;
