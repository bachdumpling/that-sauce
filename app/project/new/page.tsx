import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import NewProjectForm from "../components/new-project-form";

export default async function NewProjectPage() {
  // Check authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-bold">Create New Project</h1>
      <NewProjectForm />
    </div>
  );
}
