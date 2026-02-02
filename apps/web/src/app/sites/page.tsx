import { fetchSites } from "@/lib/api";
import SitesClient from "./SitesClient";

export default async function SitesPage() {
  const sites = await fetchSites();
  return <SitesClient initialSites={sites} />;
}