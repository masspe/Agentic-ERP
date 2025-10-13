import React from 'react';
import OfflinePaymentMethods from './OfflinePaymentMethods';

export default function PaymentGateways() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold">Payment Methods</h3>
                <p className="text-sm text-slate-500">Configure offline payment options for your invoices and customer transactions.</p>
            </div>
            
            <OfflinePaymentMethods />
        </div>
    );
}