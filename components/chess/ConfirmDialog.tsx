"use client";

import SettingsDialog from "@/components/settings/SettingsDialog";

// A small question window in the middle of the screen (instead of the native browser dialog).
export default function ConfirmDialog({
  title, message, okLabel, cancelLabel, closeLabel, onOk, onCancel,
}: {
  title: string; message: string; okLabel: string; cancelLabel: string; closeLabel: string; onOk: () => void; onCancel: () => void;
}) {
  return (
    <SettingsDialog title={title} closeLabel={closeLabel} onClose={onCancel}>
      <p className="wc-intro">{message}</p>
      <div className="wc-dialog-actions wc-two">
        <button type="button" className="wc-btn" onClick={onCancel}>{cancelLabel}</button>
        <button type="button" className="wc-btn wc-btn-primary" onClick={onOk} autoFocus>{okLabel}</button>
      </div>
    </SettingsDialog>
  );
}
