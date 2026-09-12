'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, Loader2, Megaphone } from 'lucide-react';

interface Job {
  _id: string;
  title: string;
  organization: string;
  location: string;
  lastDate: string;
  isActive: boolean;
  isBulletin: boolean;
  createdAt: string;
}

interface JobsResponse {
  data: {
    jobs: Job[];
    total: number;
  }
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const itemsPerPage = 10;

  // Create a debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchJobs();
  }, [currentPage, debouncedSearchTerm]);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      setIsSearching(true);
      const { data } = await api.get<JobsResponse>('/jobs', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearchTerm || undefined
        }
      });
      setJobs(data.data.jobs);
      setTotalJobs(data.data.total);
      setTotalPages(Math.ceil(data.data.total / itemsPerPage));
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      await api.delete(`/jobs/id/${id}`);
      toast.success('Job deleted successfully');
      fetchJobs();
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  const handleToggleBulletin = async (id: string) => {
    try {
      await api.patch(`/jobs/bulletins/${id}/toggle`);
      setJobs(jobs.map(j => j._id === id ? { ...j, isBulletin: !j.isBulletin } : j));
      toast.success('Bulletin status updated');
    } catch (error) {
      toast.error('Failed to update bulletin status');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    // Calculate start and end page numbers
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pages.push(
        <button
          key="first"
          onClick={() => handlePageChange(1)}
          className="px-3 py-1 rounded hover:bg-gray-100"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="start-ellipsis" className="px-2">
            ...
          </span>
        );
      }
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded ${
            currentPage === i
              ? 'bg-blue-500 text-white'
              : 'hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }

    // Add ellipsis and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="end-ellipsis" className="px-2">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key="last"
          onClick={() => handlePageChange(totalPages)}
          className="px-3 py-1 rounded hover:bg-gray-100"
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Jobs</h1>
        <Link href="/admin/jobs/create">
          <Button>Create New Job</Button>
        </Link>
      </div>

      <div className="mb-4 relative">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="search"
            placeholder="Search jobs by title, organization, or location..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
          )}
        </div>
        {debouncedSearchTerm && (
          <div className="mt-2 text-sm text-gray-500">
            Showing results for: <span className="font-medium">{debouncedSearchTerm}</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Last Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  {debouncedSearchTerm ? (
                    <div className="text-gray-500">
                      No jobs found matching "{debouncedSearchTerm}"
                    </div>
                  ) : (
                    <div className="text-gray-500">No jobs found</div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job._id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>{job.organization}</TableCell>
                  <TableCell>{job.location}</TableCell>
                  <TableCell>{new Date(job.lastDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-sm ${
                      job.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {job.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2 items-center">
                      <Button
                        variant={job.isBulletin ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleBulletin(job._id)}
                        className={job.isBulletin ? "bg-orange-500 hover:bg-orange-600 text-white border-transparent" : "text-gray-500"}
                        title={job.isBulletin ? "Remove from Bulletin" : "Add to Bulletin"}
                      >
                        <Megaphone className="h-4 w-4" />
                      </Button>
                      <Link href={`/admin/jobs/${job._id}/edit`}>
                        <Button variant="outline" size="sm">Edit</Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(job._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center space-x-2">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {renderPagination()}
          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {!isLoading && (
        <div className="mt-2 text-sm text-gray-500 text-center">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalJobs)} of {totalJobs} jobs
        </div>
      )}
    </div>
  );
} 