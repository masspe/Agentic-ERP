import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Sales from "./Sales";

import Purchase from "./Purchase";

import Suppliers from "./Suppliers";

import Inventory from "./Inventory";

import Customers from "./Customers";

import Expenses from "./Expenses";

import Reports from "./Reports";

import Settings from "./Settings";

import Admin from "./Admin";

import DeliveryOrders from "./DeliveryOrders";

import InvoicePrintPage from "./InvoicePrintPage";

import CreateInvoice from "./CreateInvoice";

import CreditNotes from "./CreditNotes";

import Payments from "./Payments";

import Quotations from "./Quotations";

import Bills from "./Bills";

import Reimbursements from "./Reimbursements";

import VendorCredits from "./VendorCredits";

import ReturnNotes from "./ReturnNotes";

import BalanceSheet from "./BalanceSheet";

import CashFlow from "./CashFlow";

import Landing from "./Landing";

import Categories from "./Categories";

import Prospects from "./Prospects";

import Visits from "./Visits";

import Tasks from "./Tasks";

import ChartOfAccounts from "./ChartOfAccounts";

import JournalEntries from "./JournalEntries";

import GeneralLedger from "./GeneralLedger";

import TrialBalance from "./TrialBalance";

import AIAssistant from "./AIAssistant";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Sales: Sales,
    
    Purchase: Purchase,
    
    Suppliers: Suppliers,
    
    Inventory: Inventory,
    
    Customers: Customers,
    
    Expenses: Expenses,
    
    Reports: Reports,
    
    Settings: Settings,
    
    Admin: Admin,
    
    DeliveryOrders: DeliveryOrders,
    
    InvoicePrintPage: InvoicePrintPage,
    
    CreateInvoice: CreateInvoice,
    
    CreditNotes: CreditNotes,
    
    Payments: Payments,
    
    Quotations: Quotations,
    
    Bills: Bills,
    
    Reimbursements: Reimbursements,
    
    VendorCredits: VendorCredits,
    
    ReturnNotes: ReturnNotes,
    
    BalanceSheet: BalanceSheet,
    
    CashFlow: CashFlow,
    
    Landing: Landing,
    
    Categories: Categories,
    
    Prospects: Prospects,
    
    Visits: Visits,
    
    Tasks: Tasks,
    
    ChartOfAccounts: ChartOfAccounts,
    
    JournalEntries: JournalEntries,
    
    GeneralLedger: GeneralLedger,
    
    TrialBalance: TrialBalance,
    
    AIAssistant: AIAssistant,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Sales" element={<Sales />} />
                
                <Route path="/Purchase" element={<Purchase />} />
                
                <Route path="/Suppliers" element={<Suppliers />} />
                
                <Route path="/Inventory" element={<Inventory />} />
                
                <Route path="/Customers" element={<Customers />} />
                
                <Route path="/Expenses" element={<Expenses />} />
                
                <Route path="/Reports" element={<Reports />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/DeliveryOrders" element={<DeliveryOrders />} />
                
                <Route path="/InvoicePrintPage" element={<InvoicePrintPage />} />
                
                <Route path="/CreateInvoice" element={<CreateInvoice />} />
                
                <Route path="/CreditNotes" element={<CreditNotes />} />
                
                <Route path="/Payments" element={<Payments />} />
                
                <Route path="/Quotations" element={<Quotations />} />
                
                <Route path="/Bills" element={<Bills />} />
                
                <Route path="/Reimbursements" element={<Reimbursements />} />
                
                <Route path="/VendorCredits" element={<VendorCredits />} />
                
                <Route path="/ReturnNotes" element={<ReturnNotes />} />
                
                <Route path="/BalanceSheet" element={<BalanceSheet />} />
                
                <Route path="/CashFlow" element={<CashFlow />} />
                
                <Route path="/Landing" element={<Landing />} />
                
                <Route path="/Categories" element={<Categories />} />
                
                <Route path="/Prospects" element={<Prospects />} />
                
                <Route path="/Visits" element={<Visits />} />
                
                <Route path="/Tasks" element={<Tasks />} />
                
                <Route path="/ChartOfAccounts" element={<ChartOfAccounts />} />
                
                <Route path="/JournalEntries" element={<JournalEntries />} />
                
                <Route path="/GeneralLedger" element={<GeneralLedger />} />
                
                <Route path="/TrialBalance" element={<TrialBalance />} />
                
                <Route path="/AIAssistant" element={<AIAssistant />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}