import PublicLayout from '@/components/Layout/PublicLayout';

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicLayout>{children}</PublicLayout>;
}