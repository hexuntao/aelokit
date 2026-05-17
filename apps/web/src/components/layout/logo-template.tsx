import { websiteConfig } from '@/config/website';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function TemplateLogo({ className }: { className?: string }) {
  const logo = websiteConfig.metadata.images?.logoLight ?? '/aelokit-logo.png';

  return (
    <Image
      src={logo}
      alt="AeloKit logo"
      title="AeloKit"
      width={96}
      height={96}
      unoptimized
      className={cn('size-8 rounded-md', className)}
    />
  );
}
