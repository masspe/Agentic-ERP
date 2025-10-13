import { JournalEntry, JournalEntryLine, CompanyProfile, User } from "@/api/entities";

/**
 * Helper function to create journal entries automatically from transactions
 */
export class JournalEntryHelper {
  
  static async getDefaultAccounts() {
    const user = await User.me();
    if (!user) return null;
    
    const profiles = await CompanyProfile.filter({ created_by: user.email });
    if (profiles.length === 0) return null;
    
    return profiles[0];
  }

  /**
   * Create journal entry for an invoice
   */
  static async createInvoiceEntry(invoice) {
    try {
      const profile = await this.getDefaultAccounts();
      if (!profile) return null;
      
      const user = await User.me();
      
      // Create journal entry
      const entry = await JournalEntry.create({
        entry_date: invoice.date,
        transaction_id: invoice.id,
        transaction_type: 'Invoice',
        description: `Invoice ${invoice.invoice_number} - ${invoice.customer_name}`,
        total_debit: invoice.total_amount,
        total_credit: invoice.total_amount,
        posted_by: user.email,
        posted_date: new Date().toISOString(),
        reference_number: invoice.invoice_number,
        status: 'posted'
      });

      // Create lines
      const lines = [];
      
      // Debit: Accounts Receivable
      lines.push({
        journal_entry_id: entry.id,
        account_number: profile.default_ar_account,
        account_name: 'Accounts Receivable',
        description: `Invoice from ${invoice.customer_name}`,
        debit: invoice.total_amount,
        credit: 0,
        entity_id: invoice.customer_id,
        entity_name: invoice.customer_name
      });

      // Credit: Sales Revenue
      lines.push({
        journal_entry_id: entry.id,
        account_number: profile.default_sales_account,
        account_name: 'Sales Revenue',
        description: 'Sales revenue',
        debit: 0,
        credit: invoice.subtotal,
        tax_type: invoice.vat_type
      });

      // Credit: VAT Payable
      if (invoice.tax_amount > 0) {
        lines.push({
          journal_entry_id: entry.id,
          account_number: profile.default_vat_payable_account,
          account_name: 'VAT Payable',
          description: 'VAT on sales',
          debit: 0,
          credit: invoice.tax_amount,
          tax_rate: invoice.items?.[0]?.tax_rate || 5,
          tax_type: invoice.vat_type
        });
      }

      await Promise.all(lines.map(line => JournalEntryLine.create(line)));
      
      return entry;
    } catch (error) {
      console.error('Error creating invoice journal entry:', error);
      return null;
    }
  }

  /**
   * Create journal entry for a payment
   */
  static async createPaymentEntry(payment) {
    try {
      const profile = await this.getDefaultAccounts();
      if (!profile) return null;
      
      const user = await User.me();
      
      const entry = await JournalEntry.create({
        entry_date: payment.payment_date,
        transaction_id: payment.id,
        transaction_type: 'Payment',
        description: `Payment ${payment.payment_number} - ${payment.customer_name}`,
        total_debit: payment.amount_received,
        total_credit: payment.amount_received,
        posted_by: user.email,
        posted_date: new Date().toISOString(),
        reference_number: payment.payment_number,
        status: 'posted'
      });

      const lines = [
        {
          journal_entry_id: entry.id,
          account_number: profile.default_cash_bank_account,
          account_name: 'Cash/Bank',
          description: `Payment received from ${payment.customer_name}`,
          debit: payment.amount_received,
          credit: 0,
          entity_id: payment.customer_id,
          entity_name: payment.customer_name
        },
        {
          journal_entry_id: entry.id,
          account_number: profile.default_ar_account,
          account_name: 'Accounts Receivable',
          description: 'Payment against invoice',
          debit: 0,
          credit: payment.amount_received,
          entity_id: payment.customer_id,
          entity_name: payment.customer_name
        }
      ];

      await Promise.all(lines.map(line => JournalEntryLine.create(line)));
      
      return entry;
    } catch (error) {
      console.error('Error creating payment journal entry:', error);
      return null;
    }
  }

  /**
   * Create journal entry for an expense
   */
  static async createExpenseEntry(expense) {
    try {
      const profile = await this.getDefaultAccounts();
      if (!profile) return null;
      
      const user = await User.me();
      
      const entry = await JournalEntry.create({
        entry_date: expense.date,
        transaction_id: expense.id,
        transaction_type: 'Expense',
        description: expense.description,
        total_debit: expense.amount + (expense.tax_amount || 0),
        total_credit: expense.amount + (expense.tax_amount || 0),
        posted_by: user.email,
        posted_date: new Date().toISOString(),
        reference_number: `EXP-${expense.id.slice(0, 8)}`,
        status: 'posted'
      });

      const lines = [];
      
      // Debit: Expense Account
      const expenseAccount = profile.default_expense_accounts_map?.[expense.category] || profile.default_expense_accounts_map?.other || '5000';
      lines.push({
        journal_entry_id: entry.id,
        account_number: expenseAccount,
        account_name: `${expense.category.replace('_', ' ')} Expense`,
        description: expense.description,
        debit: expense.amount,
        credit: 0
      });

      // Debit: VAT Receivable (if recoverable)
      if (expense.tax_amount > 0) {
        lines.push({
          journal_entry_id: entry.id,
          account_number: profile.default_vat_receivable_account,
          account_name: 'VAT Receivable',
          description: 'Recoverable VAT',
          debit: expense.tax_amount,
          credit: 0
        });
      }

      // Credit: Cash/Bank
      lines.push({
        journal_entry_id: entry.id,
        account_number: profile.default_cash_bank_account,
        account_name: 'Cash/Bank',
        description: 'Payment for expense',
        debit: 0,
        credit: expense.amount + (expense.tax_amount || 0)
      });

      await Promise.all(lines.map(line => JournalEntryLine.create(line)));
      
      return entry;
    } catch (error) {
      console.error('Error creating expense journal entry:', error);
      return null;
    }
  }

  /**
   * Create journal entry for a bill (purchase)
   */
  static async createBillEntry(bill) {
    try {
      const profile = await this.getDefaultAccounts();
      if (!profile) return null;
      
      const user = await User.me();
      
      const entry = await JournalEntry.create({
        entry_date: bill.date,
        transaction_id: bill.id,
        transaction_type: 'Bill',
        description: `Bill ${bill.bill_number} - ${bill.supplier_name}`,
        total_debit: bill.total_amount,
        total_credit: bill.total_amount,
        posted_by: user.email,
        posted_date: new Date().toISOString(),
        reference_number: bill.bill_number,
        status: 'posted'
      });

      const lines = [
        {
          journal_entry_id: entry.id,
          account_number: profile.default_cogs_account || '5100',
          account_name: 'Cost of Goods Sold',
          description: 'Purchase from supplier',
          debit: bill.subtotal,
          credit: 0
        }
      ];

      if (bill.tax_amount > 0) {
        lines.push({
          journal_entry_id: entry.id,
          account_number: profile.default_vat_receivable_account,
          account_name: 'VAT Receivable',
          description: 'VAT on purchases',
          debit: bill.tax_amount,
          credit: 0,
          tax_rate: bill.items?.[0]?.tax_rate || 5,
          tax_type: bill.vat_type
        });
      }

      lines.push({
        journal_entry_id: entry.id,
        account_number: profile.default_ap_account,
        account_name: 'Accounts Payable',
        description: `Bill from ${bill.supplier_name}`,
        debit: 0,
        credit: bill.total_amount,
        entity_id: bill.supplier_id,
        entity_name: bill.supplier_name
      });

      await Promise.all(lines.map(line => JournalEntryLine.create(line)));
      
      return entry;
    } catch (error) {
      console.error('Error creating bill journal entry:', error);
      return null;
    }
  }

  /**
   * Create journal entry for a credit note
   */
  static async createCreditNoteEntry(creditNote) {
    try {
      const profile = await this.getDefaultAccounts();
      if (!profile) return null;
      
      const user = await User.me();
      
      const entry = await JournalEntry.create({
        entry_date: creditNote.date,
        transaction_id: creditNote.id,
        transaction_type: 'CreditNote',
        description: `Credit Note ${creditNote.credit_note_number} - ${creditNote.customer_name}`,
        total_debit: creditNote.total_amount,
        total_credit: creditNote.total_amount,
        posted_by: user.email,
        posted_date: new Date().toISOString(),
        reference_number: creditNote.credit_note_number,
        status: 'posted'
      });

      const lines = [
        {
          journal_entry_id: entry.id,
          account_number: profile.default_sales_account,
          account_name: 'Sales Revenue',
          description: 'Sales return/adjustment',
          debit: creditNote.subtotal,
          credit: 0
        }
      ];

      if (creditNote.tax_amount > 0) {
        lines.push({
          journal_entry_id: entry.id,
          account_number: profile.default_vat_payable_account,
          account_name: 'VAT Payable',
          description: 'VAT adjustment',
          debit: creditNote.tax_amount,
          credit: 0
        });
      }

      lines.push({
        journal_entry_id: entry.id,
        account_number: profile.default_ar_account,
        account_name: 'Accounts Receivable',
        description: `Credit note for ${creditNote.customer_name}`,
        debit: 0,
        credit: creditNote.total_amount,
        entity_id: creditNote.customer_id,
        entity_name: creditNote.customer_name
      });

      await Promise.all(lines.map(line => JournalEntryLine.create(line)));
      
      return entry;
    } catch (error) {
      console.error('Error creating credit note journal entry:', error);
      return null;
    }
  }
}