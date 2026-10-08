import { LoaderCircle } from 'lucide-react';

export default function Spinner({ className = 'h-4 w-4' }) {
  return <LoaderCircle className={`animate-spin ${className}`} />;
}
