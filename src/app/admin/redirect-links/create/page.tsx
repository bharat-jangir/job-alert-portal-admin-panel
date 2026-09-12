"use client";
import React, { useState } from "react";
import RedirectLinkForm from "../components/RedirectLinkForm";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";

import api from "@/lib/axios";

export default function CreateRedirectLinkPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(data: any) {
    setLoading(true);
    try {
      await api.post("/redirect-links", data);
      router.push("/admin/redirect-links");
    } catch (error) {
      console.error(error);
      alert("Failed to create redirect link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Create Redirect Link</h1>
      <Card className="p-4 max-w-xl mx-auto">
        <RedirectLinkForm onSubmit={handleSubmit} loading={loading} />
      </Card>
    </div>
  );
} 