import { ReviewCard } from '../ReviewCard';

export default function ReviewCardExample() {
  return (
    <div className="p-6">
      <ReviewCard
        id="example-1"
        marketplace="Amazon"
        title="Product arrived damaged, very disappointed"
        content="I ordered this product with high expectations, but it arrived with visible damage to the packaging and the item itself."
        customerName="John Smith"
        rating={2}
        sentiment="negative"
        category="defect"
        severity="high"
        status="open"
        createdAt={new Date()}
        onViewDetails={() => console.log('View details clicked')}
      />
    </div>
  );
}
