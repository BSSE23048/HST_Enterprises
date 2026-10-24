import { useState } from 'react';
import { catalogueCategories, type CatalogueProduct } from './catalogueData';
import { Icon } from './Icons';

interface ApprovedPhoto {
  productId: string;
  variant: string;
  src: string;
  alt: string;
  manufacturerSource: string;
  reusePermission: string;
}

// Add only locally hosted, exact-variant photographs with documented permission.
// New public assets must also be included in the deployment asset allowlist.
const approvedPhotos: readonly ApprovedPhoto[] = [];
const illustrations = [
  { icon: 'power', label: 'Circuit protection' },
  { icon: 'automation', label: 'Motor control' },
  { icon: 'install', label: 'Sensors & automation' },
  { icon: 'cable', label: 'Cables & wires' },
  { icon: 'supply', label: 'Panels & mounting' },
  { icon: 'power', label: 'Switches & indicators' },
  { icon: 'maintenance', label: 'Cable accessories' },
] as const;

export default function ProductVisual({ product, variant }: { product: CatalogueProduct; variant: string }) {
  const [failedSource, setFailedSource] = useState('');
  const photo = approvedPhotos.find(item => item.productId === product.id && item.variant === variant);
  const illustration = illustrations[catalogueCategories.indexOf(product.category)] || illustrations[0];
  if (photo && photo.src !== failedSource) return <div className="catalogue-visual"><img src={photo.src} alt={photo.alt} width={640} height={480} loading="lazy" decoding="async" onError={() => setFailedSource(photo.src)}/></div>;
  return <div className="catalogue-visual catalogue-illustration" aria-label={`${illustration.label}: category illustration, not a product photograph`}>
    <span className="catalogue-visual-label">{illustration.label}</span>
    <Icon name={illustration.icon} size={64}/>
    <span className="catalogue-visual-caption">Category illustration</span>
  </div>;
}
