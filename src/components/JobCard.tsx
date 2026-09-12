'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    organization: string;
    location: string;
    salary: string;
    lastDate: string;
    createdAt: string;
    applyLink: string;
  };
}

export default function JobCard({ job }: JobCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-blue-600 mb-2">
            <Link href={`/jobs/${job.id}`} className="hover:underline">
              {job.title}
            </Link>
          </h3>
          <div className="space-y-2 text-gray-600">
            <p>
              <strong>Organization:</strong> {job.organization}
            </p>
            <p>
              <strong>Location:</strong> {job.location}
            </p>
            <p>
              <strong>Salary:</strong> {job.salary}
            </p>
            <p>
              <strong>Last Date:</strong>{' '}
              {new Date(job.lastDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded mb-2">
            New
          </span>
          <span className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <Link
          href={`/jobs/${job.id}`}
          className="text-blue-600 hover:text-blue-800"
        >
          View Details →
        </Link>
        <Link
          href={job.applyLink}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Apply Now
        </Link>
      </div>
    </div>
  );
} 