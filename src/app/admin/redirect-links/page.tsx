"use client";
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { useRouter } from "next/navigation";

import api from "@/lib/axios";

const LINK_TYPES = [
  "RESULT",
  "ANSWERKEY",
  "ADMISSION",
  "ADMITCARD",
  "ONLINEFORM",
  "UPDATE",
  "SYLLABUS",
  "UPCOMING",
  "VERIFICATION",
  "SARKARIYOJANA",
];

const REDIRECT_TYPE = ["internal", "external"];

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function RedirectLinksPage() {
  const [links, setLinks] = useState([]);
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  useEffect(() => {
    async function fetchLinks() {
      const params: any = {
        search,
        date,
        page: page.toString(),
        pageSize: pageSize.toString(),
      };
      if (type) {
        params.type = type;
      }
      
      try {
        const res = await api.get("/redirect-links", { params });
        const { links, total: totalCount } = res.data.data;
        
        let linksArr = links || [];
        
        // If searching and no results, fetch default data
        if (search && linksArr.length === 0) {
          const fallbackParams: any = { page: page.toString(), pageSize: pageSize.toString() };
          if (type) fallbackParams.type = type;
          const fallbackRes = await api.get("/redirect-links", { params: fallbackParams });
          linksArr = fallbackRes.data.data.links || [];
        }
        
        setLinks(linksArr);
        setTotal(totalCount || 0);
      } catch (error) {
        console.error("Failed to fetch links:", error);
      }
    }
    fetchLinks();
  }, [type, search, date, page, pageSize]);

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this redirect link?")) return;
    try {
      await api.delete(`/redirect-links/${id}`);
      // Refresh the list
      setLinks(links => links.filter((l: any) => l._id !== id));
      setTotal(total => total - 1);
    } catch (error) {
      console.error(error);
      alert("Failed to delete redirect link");
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Manage Redirect Links</h1>
        <Button onClick={() => router.push('/admin/redirect-links/create')}>Create Redirect Link</Button>
      </div>
      <Card className="mb-4 p-4 flex flex-wrap gap-4 items-center">
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">All Types</option>
          {LINK_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <Input
          placeholder="Search by title or slug..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
        <Input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <select
          value={pageSize}
          onChange={e => setPageSize(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          {PAGE_SIZE_OPTIONS.map(size => (
            <option key={size} value={size}>{size} / page</option>
          ))}
        </select>
        <Button onClick={() => setPage(1)}>Filter</Button>
      </Card>
      <Table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Title</th>
            <th>Slug</th>
            <th>Tag</th>
            <th>Redirect Type</th>
            <th>Target ID</th>
            <th>External URL</th>
            <th>Active</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {links.map((link: any) => (
            <tr key={link._id}>
              <td>{link.type}</td>
              <td>{link.title}</td>
              <td>{link.slug}</td>
              <td>{link.tag || "-"}</td>
              <td>{link.redirectType}</td>
              <td>{link.targetId}</td>
              <td>{link.externalUrl}</td>
              <td>{link.isActive ? "Yes" : "No"}</td>
              <td>{new Date(link.createdAt).toLocaleDateString()}</td>
              <td>
                <Button size="sm" variant="outline" onClick={() => router.push(`/admin/redirect-links/${link._id}/edit`)}>Edit</Button>
                <Button size="sm" variant="destructive" className="ml-2" onClick={() => handleDelete(link._id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="flex justify-between items-center mt-4">
        <div>
          Page {page} of {Math.ceil(total / pageSize) || 1}
        </div>
        <div className="flex gap-2">
          <Button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            variant="outline"
          >
            Previous
          </Button>
          <Button
            disabled={page * pageSize >= total}
            onClick={() => setPage(page + 1)}
            variant="outline"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
} 