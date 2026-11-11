import { useState } from "react";
export function Asset({
  src,
  alt,
  className = "",
  enlarge = false,
}: {
  src: string;
  alt: string;
  className?: string;
  enlarge?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <div className={`asset-placeholder ${className}`}>
        <span aria-hidden="true">▧</span>
        <span>{alt}</span>
        <small>รอภาพจากหน่วยงาน</small>
      </div>
    );
  const img = (
    <img
      className={className}
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
    />
  );
  return enlarge ? (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      aria-label={`${alt} (เปิดภาพขยายในแท็บใหม่)`}
    >
      {img}
    </a>
  ) : (
    img
  );
}
