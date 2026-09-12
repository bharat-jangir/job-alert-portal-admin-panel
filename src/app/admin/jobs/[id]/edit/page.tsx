'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { JobForm } from '../../components/JobForm';
import { toast } from 'sonner';
import api from '@/lib/axios';

export default function EditJobPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const jobId = params.id;

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const fetchJob = async () => {
    try {
      const { data } = await api.get(`/jobs/id/${jobId}`);
      console.log(job)
      setJob(data.data);
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Failed to load job');
      router.push('/admin/jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push('/admin/jobs');
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!job) {
    return <div>Job not found</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Edit Job</h1>
        <JobForm job={job} onSuccess={handleSuccess} />
      </div>
    </div>
  );
} 