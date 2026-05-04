import { AppShell } from "@/components/app-shell";
import { getVaultDir } from "@/lib/utils/env";
import { loadSettings } from "@/lib/services/settings-service";

export default async function SettingsPage() {
  const settings = await loadSettings(getVaultDir());

  return (
    <AppShell>
      <main className="rounded-[2rem] border border-white/60 bg-white/78 p-6 shadow-[0_20px_70px_rgba(54,34,20,0.08)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.28em] text-[#8b6f57]">Settings</p>
        <h1 className="mt-3 text-3xl font-semibold text-[#1f130c]">设置</h1>
        <dl className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.4rem] border border-black/6 bg-[rgba(248,243,236,0.95)] p-4">
            <dt className="text-sm text-[#6f5748]">Vault 路径</dt>
            <dd className="mt-2 text-sm text-[#1f130c]">{settings.vaultPath}</dd>
          </div>
          <div className="rounded-[1.4rem] border border-black/6 bg-[rgba(248,243,236,0.95)] p-4">
            <dt className="text-sm text-[#6f5748]">默认主题</dt>
            <dd className="mt-2 text-sm text-[#1f130c]">{settings.defaultTopic || "未设置"}</dd>
          </div>
          <div className="rounded-[1.4rem] border border-black/6 bg-[rgba(248,243,236,0.95)] p-4">
            <dt className="text-sm text-[#6f5748]">Provider</dt>
            <dd className="mt-2 text-sm text-[#1f130c]">{settings.provider}</dd>
          </div>
          <div className="rounded-[1.4rem] border border-black/6 bg-[rgba(248,243,236,0.95)] p-4">
            <dt className="text-sm text-[#6f5748]">Model</dt>
            <dd className="mt-2 text-sm text-[#1f130c]">{settings.model}</dd>
          </div>
        </dl>
      </main>
    </AppShell>
  );
}
