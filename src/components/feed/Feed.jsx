import React, { useState, useEffect } from 'react';
import './Feed.css';
import QuestCard from './card/QuestCard';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

function Feed() {
  const [quests, setQuests] = useState([]);

  useEffect(() => {
    const questsRef = collection(db, 'quests');
    const q = query(questsRef, orderBy('createdAt', 'desc'), limit(20)); // Order by createdAt in descending order

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedQuests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setQuests(fetchedQuests);
    });

    return () => unsubscribe(); // Cleanup the listener on component unmount
  }, []);

  return (
    <div className="feed">
      {quests.map((quest) => (
        <QuestCard
          key={quest.id}
          imageUrl={quest.imageUrl}
          aspectRatio={quest.aspectRatio}
          time={quest.time}
          user={quest.user}
          description={quest.description}
        />
      ))}
    </div>
  );
}

export default Feed;
