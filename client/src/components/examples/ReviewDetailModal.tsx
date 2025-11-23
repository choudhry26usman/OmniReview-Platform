import { useState } from 'react';
import { ReviewDetailModal } from '../ReviewDetailModal';
import { Button } from '@/components/ui/button';

export default function ReviewDetailModalExample() {
  const [open, setOpen] = useState(false);

  const mockReview = {
    id: "1",
    marketplace: "Amazon" as const,
    title: "Product arrived damaged",
    content: "The product packaging was damaged and the item inside was broken. Very disappointed with the quality control.",
    customerName: "John Smith",
    rating: 2,
    sentiment: "negative" as const,
    category: "defect",
    severity: "high",
    status: "open",
    createdAt: new Date(),
    aiSuggestedReply: "Dear John, we sincerely apologize for the damaged product you received. We'd like to send you a replacement immediately.",
  };

  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      <ReviewDetailModal
        open={open}
        onOpenChange={setOpen}
        review={mockReview}
      />
    </div>
  );
}
