import AuthWrapper from '@/components/Layout/AuthWrapper';

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthWrapper>{children}</AuthWrapper>;
}