interface PhotoInfoProps {
  filename: string | null;
  dateTaken: string | null;
  dateModified: string | null;
}

export function PhotoInfo({ filename, dateTaken, dateModified }: PhotoInfoProps) {
  if (!filename) return null;

  const displayDate = dateTaken ?? dateModified;
  let formattedDate = "";
  if (displayDate) {
    try {
      formattedDate = new Date(displayDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      formattedDate = displayDate;
    }
  }

  return (
    <div className="text-center text-sm text-framory-text/80">
      <p className="font-medium">{filename}</p>
      {formattedDate && <p className="text-framory-muted">{formattedDate}</p>}
    </div>
  );
}
