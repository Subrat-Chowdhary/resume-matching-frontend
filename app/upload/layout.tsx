import PublicLayout from '@/components/Layout/PublicLayout';

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicLayout>{children}</PublicLayout>;
}