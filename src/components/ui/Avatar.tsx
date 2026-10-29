import { useEffect, useState } from 'react';

export function Avatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  return (
    <span className={className} aria-hidden="true">
      {src && !failed ? (
        <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      ) : (
        name.trim().slice(0, 1).toUpperCase()
      )}
    </span>
  );
}
