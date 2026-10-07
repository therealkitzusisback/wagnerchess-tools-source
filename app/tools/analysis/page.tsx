import { redirect } from "next/navigation";

// The Analysis Room used to live here. Old links and bookmarks are forwarded.
export default async function OldAnalysisAddress({ searchParams }: { searchParams: Promise<{ file?: string }> }) {
  const { file } = await searchParams;
  redirect(file && /^[0-9a-f-]{36}$/i.test(file) ? `/tools/analysisroom?file=${file}` : "/tools/analysisroom");
}
