import { SettingsClient } from "@/features/settings/settings-client";
import { getCurrentCompany, getLibrary } from "@/lib/data";
export default async function SettingsPage() { const [company, library] = await Promise.all([getCurrentCompany(), getLibrary()]); if (!company) return null; return <SettingsClient company={company} labor={library.labor} materials={library.materials} />; }
