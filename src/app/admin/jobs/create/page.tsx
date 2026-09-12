'use client';

import { useRouter } from 'next/navigation';
import { JobForm } from '../components/JobForm';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CreateJobPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/admin/jobs');
  };

  return (
    <>
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Create New Job</h1>
          <Link href="/admin/jobs">
            <Button variant="outline">Back to Jobs</Button>
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <JobForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
    </>
  );
} 