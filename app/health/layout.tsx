import AuthWrapper from '@/components/Layout/AuthWrapper';

export default function HealthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthWrapper>{children}</AuthWrapper>;
}