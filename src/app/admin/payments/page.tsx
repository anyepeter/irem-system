import { requireAdmin } from "@/lib/auth";
import { getAllPaymentHistory } from "@/actions/ticket";
import { PaymentHistoryClient } from "@/components/tickets/payment-history-client";

export default async function AdminPaymentsPage() {
    const admin = await requireAdmin();
    const { payments, total } = await getAllPaymentHistory({ page: 1, limit: 20 });

    return (
        <PaymentHistoryClient
            user={{
                username: admin.username,
                avatar: admin.avatar,
                role: admin.role,
            }}
            initialPayments={JSON.parse(JSON.stringify(payments))}
            initialTotal={total}
            basePath="/admin/payments"
        />
    );
}
