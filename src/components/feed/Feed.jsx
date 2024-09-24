import React, { useState, useEffect } from 'react';
import './Feed.css';
import QuestCard from './card/QuestCard';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, getDocs } from '../../firebase';

function Feed() {
  const [quests, setQuests] = useState([]);

  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    try {
      const questsRef = collection(db, 'quests');
      const q = query(questsRef, orderBy('createdAt', 'desc'), limit(20)); // Adjust limit as needed
      const querySnapshot = await getDocs(q);
      const fetchedQuests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setQuests(fetchedQuests);
    } catch (error) {
      console.error('Error fetching quests:', error);
    }
  };

  return (
    <div className="feed">
      <QuestCard aspectRatio={3/4}/>
      <QuestCard aspectRatio={9/16}/>
      <QuestCard aspectRatio={1/1}/>
      <QuestCard aspectRatio={3/4}/>
      <QuestCard aspectRatio={1/1}/>
      <QuestCard aspectRatio={9/16}/>
      <QuestCard aspectRatio={1/1}/>
      <QuestCard aspectRatio={1/1}/>
      <QuestCard aspectRatio={9/16}/>
      <QuestCard aspectRatio={3/4}/>
      <QuestCard aspectRatio={9/16}/>
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
