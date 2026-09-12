"use client";
import React, { useEffect, useState } from "react";
import RedirectLinkForm from "../../components/RedirectLinkForm";
import { Card } from "@/components/ui/card";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/axios";

export default function EditRedirectLinkPage() {
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get(`/redirect-links/${id}`);
        const data = res.data.data || res.data;
        setInitialData({
          type: data.type ?? "",
          targetId: data.targetId ?? "",
          slug: data.slug ?? "",
          tag: data.tag ?? "",
          title: data.title ?? "",
          externalUrl: data.externalUrl ?? "",
          redirectType: data.redirectType ?? "internal",
          isActive: data.isActive ?? false,
        });
      } catch (error) {
        console.error("Failed to fetch redirect link", error);
      }
    }
    if (id) fetchData();
  }, [id]);

  async function handleSubmit(data: any) {
    setLoading(true);
    try {
      await api.patch(`/redirect-links/${id}`, data);
      router.push("/admin/redirect-links");
    } catch (error) {
      console.error(error);
      alert("Failed to update redirect link");
    } finally {
      setLoading(false);
    }
  }

  if (!initialData) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Redirect Link</h1>
      <Card className="p-4 max-w-xl mx-auto">
        <RedirectLinkForm initialData={initialData} onSubmit={handleSubmit} loading={loading} />
      </Card>
    </div>
  );
} 