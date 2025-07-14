import AuthWrapper from '@/components/Layout/AuthWrapper';

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthWrapper>{children}</AuthWrapper>;
}