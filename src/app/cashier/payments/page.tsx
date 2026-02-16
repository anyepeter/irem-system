import { requireRole } from "@/lib/auth";
import { getAllPaymentHistory } from "@/actions/ticket";
import { PaymentHistoryClient } from "@/components/tickets/payment-history-client";

export default async function CashierPaymentsPage() {
    const cashier = await requireRole("CASHIER");
    const { payments, total } = await getAllPaymentHistory({ page: 1, limit: 20 });

    return (
        <PaymentHistoryClient
            user={{
                username: cashier.username,
                avatar: cashier.avatar,
                role: cashier.role,
            }}
            initialPayments={JSON.parse(JSON.stringify(payments))}
            initialTotal={total}
            basePath="/cashier/payments"
        />
    );
}
