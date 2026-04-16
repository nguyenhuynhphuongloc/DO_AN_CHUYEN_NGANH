import { redirect } from 'next/navigation';

type ReviewRedirectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReviewRedirectPage({ params }: ReviewRedirectPageProps) {
  const { id } = await params;
  redirect(`/receipts/upload?receiptId=${id}`);
}
