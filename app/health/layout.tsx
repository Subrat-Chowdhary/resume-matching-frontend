import PublicLayout from '@/components/Layout/PublicLayout';

export default function HealthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicLayout>{children}</PublicLayout>;
}