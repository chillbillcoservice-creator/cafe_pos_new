
import { CustomerOrderClient } from './customer-order-client';

export default async function CustomerOrderPage(props: { params: Promise<{ tableId: string }> }) {
  const params = await props.params;
  return (
    <div className="bg-background min-h-screen">
      <CustomerOrderClient tableId={params.tableId} />
    </div>
  );
}
