import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await prisma.systemSetting.findMany();
  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--huef-green)]">Administrator</p>
        <h1 className="mt-1 text-3xl font-extrabold text-[var(--huef-green-dark)]">System configuration</h1>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
