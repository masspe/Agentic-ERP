
import React, { useState } from "react";
import { 
    Building, 
    FileText, 
    Landmark, 
    CreditCard, 
    Languages, 
    Star,
    Settings as SettingsIcon
} from "lucide-react";
import { useLocalization } from "../components/contexts/LocalizationContext";

import SettingsLayout from "../components/settings/SettingsLayout";
import CompanyInfo from "../components/settings/CompanyInfo";
import InvoiceCustomization from "../components/settings/InvoiceCustomization";
import DocumentCustomization from "../components/settings/DocumentCustomization";
import TaxesCurrency from "../components/settings/TaxesCurrency";
import PaymentGateways from "../components/settings/PaymentGateways";
import Localization from "../components/settings/Localization";
import SubscriptionBilling from "../components/settings/SubscriptionBilling";

export default function Settings() {
    const [activeSection, setActiveSection] = useState('company');
    const { t } = useLocalization();

    const settingsNav = [
        { id: 'company', label: t('settings.nav_company'), icon: Building, component: CompanyInfo },
        { id: 'invoice', label: t('settings.nav_invoice'), icon: FileText, component: InvoiceCustomization },
        { id: 'documents', label: t('settings.nav_documents'), icon: SettingsIcon, component: DocumentCustomization },
        { id: 'taxes', label: t('settings.nav_taxes'), icon: Landmark, component: TaxesCurrency },
        { id: 'gateways', label: t('settings.nav_gateways'), icon: CreditCard, component: PaymentGateways },
        { id: 'localization', label: t('settings.nav_language'), icon: Languages, component: Localization },
        { id: 'billing', label: t('settings.nav_billing'), icon: Star, component: SubscriptionBilling },
    ];

    const ActiveComponent = settingsNav.find(nav => nav.id === activeSection)?.component;

    return (
        <div className="p-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">{t('settings.title')}</h1>
                <p className="text-slate-600 mt-1">{t('settings.description')}</p>
            </div>
            <SettingsLayout 
                navItems={settingsNav}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
            >
                {ActiveComponent && <ActiveComponent />}
            </SettingsLayout>
        </div>
    );
}
