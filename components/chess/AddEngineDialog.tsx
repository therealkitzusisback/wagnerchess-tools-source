"use client";

import { ENGINES, engineFile, engineName } from "@/lib/chess/engines";
import { useCanMulti } from "@/components/settings/SettingsProvider";
import { useManifest } from "@/lib/chess/manifest";
import type { SettingsTexts } from "@/lib/settings/texts";
import SettingsDialog from "@/components/settings/SettingsDialog";

// Small window in the middle of the screen: which engine should the new engine window use?
export default function AddEngineDialog({ st, onPick, onClose }: { st: SettingsTexts; onPick: (engineId: string) => void; onClose: () => void }) {
  const manifest = useManifest();
  const a = st.addEngine;
  const canMulti = useCanMulti();
  return (
    <SettingsDialog title={a.title} closeLabel={st.close} onClose={onClose}>
      <p className="wc-row-hint wc-intro">{a.intro}</p>
      <div className="wc-engine-list">
        {ENGINES.filter((d) => canMulti || !d.multi).map((d) => {
          const file = engineFile(d, manifest);
          const unavailable = (manifest !== undefined && !file);
          return (
            <button key={d.id} type="button" className="wc-engine-choice" disabled={unavailable} onClick={() => onPick(d.id)}>
              <span className="name">{engineName(d, manifest)}</span>
              <span className="meta">{unavailable ? a.notInstalled : file ? `${file.sizeMB} MB` : ""}</span>
            </button>
          );
        })}
      </div>
      <div className="wc-dialog-actions">
        <button type="button" className="wc-btn" onClick={onClose}>{a.cancel}</button>
      </div>
    </SettingsDialog>
  );
}
