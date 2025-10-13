import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Download, Mail, MessageSquare } from 'lucide-react';
import PDFGenerator from './PDFGenerator';
import { useToast } from '../contexts/ToastContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SendEmail } from '@/api/integrations';

export default function DocumentActions({ document, documentType, company, customerOrSupplier }) {
    const { showSuccessToast, showErrorToast } = useToast();
    const [isSending, setIsSending] = useState(false);

    const handleDownload = async () => {
        try {
            await PDFGenerator.generateAndDownload(document, company, documentType, customerOrSupplier);
            showSuccessToast('PDF generation started. Use your browser\'s print dialog to save the PDF.');
        } catch (error) {
            console.error(`Error downloading ${documentType}:`, error);
            showErrorToast(`Failed to download ${documentType}.`);
        }
    };

    const handleSendViaEmail = async () => {
        if (!customerOrSupplier?.email) {
            showErrorToast("Recipient email address is not available.");
            return;
        }

        setIsSending(true);
        try {
            const emailBody = `
                <p>Dear ${customerOrSupplier.name},</p>
                <p>Please find your ${documentType.replace('_', ' ')} (${document.invoice_number || document.quote_number || document.po_number}).</p>
                <p>You can download it from your account or contact us for assistance.</p>
                <p>Thank you for your business.</p>
                <br>
                <p>Best regards,</p>
                <p>${company?.company_name || 'Your Company'}</p>
            `;

            await SendEmail({
                to: customerOrSupplier.email,
                subject: `Your ${documentType.replace('_', ' ')} from ${company?.company_name || 'RDA Invoice'}`,
                body: emailBody
            });

            showSuccessToast('Email notification sent successfully.');

        } catch (error) {
            console.error(`Error sending ${documentType} via email:`, error);
            showErrorToast('Failed to send email. Please try again.');
        } finally {
            setIsSending(false);
        }
    };
    
    const handleSendViaWhatsApp = () => {
        const message = `Hello ${customerOrSupplier?.name}, your ${documentType.replace('_', ' ')} ${document.invoice_number || document.quote_number} is ready. Please contact us to download it.`;
        const whatsappUrl = `https://wa.me/${customerOrSupplier?.phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="flex gap-2">
            <Button onClick={handleDownload} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
            </Button>
            
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <Send className="w-4 h-4 mr-2" />
                        Send
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleSendViaEmail} disabled={isSending}>
                        <Mail className="w-4 h-4 mr-2" />
                        Send via Email
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSendViaWhatsApp}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Send via WhatsApp
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}