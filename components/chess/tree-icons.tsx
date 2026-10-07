// Small icons for the folder trees (file tree in the Analysis Room and the library): drawn here, no licence needed.
export function Chevron({ open }: { open: boolean }) {
  return (
    <svg className="ti ti-chevron" viewBox="0 0 16 16" aria-hidden="true" style={{ transform: open ? "rotate(90deg)" : undefined }}>
      <path d="M6 3.5L10.5 8L6 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FolderIcon({ open }: { open?: boolean }) {
  return open ? (
    <svg className="ti ti-folder" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h4l1.6 1.8H16.5A1.5 1.5 0 0 1 18 7.3V8H5.4a1.5 1.5 0 0 0-1.45 1.1L2 15.5V5.5Z" fill="#d9a93c" />
      <path d="M4.2 9.4A1 1 0 0 1 5.2 8.7H18.4a.7.7 0 0 1 .67.9l-1.7 5.9A1.5 1.5 0 0 1 15.9 16.6H3.5a.7.7 0 0 1-.67-.9l1.37-4.3Z" fill="#f0c25a" />
    </svg>
  ) : (
    <svg className="ti ti-folder" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h4l1.6 1.8h7.4A1.5 1.5 0 0 1 18 7.3v7.2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 2 14.5V5.5Z" fill="#e0ae3d" />
    </svg>
  );
}

export function FileIcon() {
  return (
    <svg className="ti ti-file" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5 2.5h6.2L15.5 7v10a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5Z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M11 2.8V7h4.2M7 10.5h6M7 13.5h6" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
