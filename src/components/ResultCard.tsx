'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface ResultCardProps {
  result: {
    id: string;
    title: string;
    organization: string;
    examDate: string;
    resultDate: string;
    totalQualified: number;
    createdAt: string;
  };
}

export default function ResultCard({ result }: ResultCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-blue-600 mb-2">
            <Link href={`/results/${result.id}`} className="hover:underline">
              {result.title}
            </Link>
          </h3>
          <div className="space-y-2 text-gray-600">
            <p>
              <strong>Organization:</strong> {result.organization}
            </p>
            <p>
              <strong>Exam Date:</strong>{' '}
              {new Date(result.examDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Result Date:</strong>{' '}
              {new Date(result.resultDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Total Qualified:</strong> {result.totalQualified}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded mb-2">
            New
          </span>
          <span className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(result.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
      <div className="mt-4">
        <Link
          href={`/results/${result.id}`}
          className="text-blue-600 hover:text-blue-800"
        >
          View Result →
        </Link>
      </div>
    </div>
  );
} 