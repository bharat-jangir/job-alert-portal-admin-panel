'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';

interface Update {
  id: string;
  title: string;
  link: string;
  date: string;
}

interface Job {
  id: string;
  title: string;
  organization: string;
  totalPosts: number;
  lastDate: string;
  qualification: string;
  postedDate: string;
  link: string;
}

interface Result {
  id: string;
  title: string;
  organization: string;
  date: string;
  link: string;
}

interface AdmitCard {
  id: string;
  title: string;
  organization: string;
  date: string;
  link: string;
}

interface AnswerKey {
  id: string;
  title: string;
  organization: string;
  date: string;
  link: string;
}

export default function ContentManager() {
  const [dailyUpdates, setDailyUpdates] = useState<Update[]>([]);
  const [latestResults, setLatestResults] = useState<Result[]>([]);
  const [latestAdmitCards, setLatestAdmitCards] = useState<AdmitCard[]>([]);
  const [latestAnswerKeys, setLatestAnswerKeys] = useState<AnswerKey[]>([]);

  useEffect(() => {
    // Set today's date
    const todayDate = document.getElementById('todayDate');
    if (todayDate) {
      todayDate.textContent = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }

    // Fetch daily updates
    fetchDailyUpdates();
    // Fetch latest results
    fetchLatestResults();
    // Fetch latest admit cards
    fetchLatestAdmitCards();
    // Fetch latest answer keys
    fetchLatestAnswerKeys();
  }, []);

  const fetchDailyUpdates = async () => {
    try {
      const { data } = await api.get('/daily-updates');
      setDailyUpdates(data);
    } catch (error) {
      console.error('Error fetching daily updates:', error);
    }
  };

  const fetchLatestResults = async () => {
    try {
      const { data } = await api.get('/latest-results');
      setLatestResults(data);
    } catch (error) {
      console.error('Error fetching latest results:', error);
    }
  };

  const fetchLatestAdmitCards = async () => {
    try {
      const { data } = await api.get('/latest-admit-cards');
      setLatestAdmitCards(data);
    } catch (error) {
      console.error('Error fetching latest admit cards:', error);
    }
  };

  const fetchLatestAnswerKeys = async () => {
    try {
      const { data } = await api.get('/latest-answer-keys');
      setLatestAnswerKeys(data);
    } catch (error) {
      console.error('Error fetching latest answer keys:', error);
    }
  };

  return (
    <>
      {/* Daily Updates */}
      <div className="space-y-3 daily-updates">
        {dailyUpdates.map((update) => (
          <div key={update.id} className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <Link href={update.link} className="text-gray-700 hover:text-blue-600">
              {update.title}
            </Link>
            <span className="text-sm text-gray-500 ml-2">{update.date}</span>
          </div>
        ))}
      </div>

      {/* Latest Results */}
      <div id="latestResults" className="space-y-4">
        {latestResults.map((result) => (
          <div key={result.id} className="flex justify-between items-center">
            <Link href={result.link} className="text-gray-700 hover:text-blue-600">
              {result.title}
            </Link>
            <span className="text-sm text-gray-500">{result.date}</span>
          </div>
        ))}
      </div>

      {/* Latest Admit Cards */}
      <div id="latestAdmitCards" className="space-y-4">
        {latestAdmitCards.map((admitCard) => (
          <div key={admitCard.id} className="flex justify-between items-center">
            <Link href={admitCard.link} className="text-gray-700 hover:text-blue-600">
              {admitCard.title}
            </Link>
            <span className="text-sm text-gray-500">{admitCard.date}</span>
          </div>
        ))}
      </div>

      {/* Latest Answer Keys */}
      <div id="latestAnswerKeys" className="space-y-4">
        {latestAnswerKeys.map((answerKey) => (
          <div key={answerKey.id} className="flex justify-between items-center">
            <Link href={answerKey.link} className="text-gray-700 hover:text-blue-600">
              {answerKey.title}
            </Link>
            <span className="text-sm text-gray-500">{answerKey.date}</span>
          </div>
        ))}
      </div>
    </>
  );
} 