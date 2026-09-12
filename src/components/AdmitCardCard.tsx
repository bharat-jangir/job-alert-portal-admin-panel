'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface AdmitCardCardProps {
  admitCard: {
    id: string;
    title: string;
    organization: string;
    examDate: string;
    downloadStartDate: string;
    lastDateToDownload: string;
    createdAt: string;
  };
}

export default function AdmitCardCard({ admitCard }: AdmitCardCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-blue-600 mb-2">
            <Link href={`/admit-cards/${admitCard.id}`} className="hover:underline">
              {admitCard.title}
            </Link>
          </h3>
          <div className="space-y-2 text-gray-600">
            <p>
              <strong>Organization:</strong> {admitCard.organization}
            </p>
            <p>
              <strong>Exam Date:</strong>{' '}
              {new Date(admitCard.examDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Download Start Date:</strong>{' '}
              {new Date(admitCard.downloadStartDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Last Date to Download:</strong>{' '}
              {new Date(admitCard.lastDateToDownload).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mb-2">
            Coming Soon
          </span>
          <span className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(admitCard.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
      <div className="mt-4">
        <Link
          href={`/admit-cards/${admitCard.id}`}
          className="text-blue-600 hover:text-blue-800"
        >
          Download →
        </Link>
      </div>
    </div>
  );
} 