import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import { NotificationTemplate } from "@/api/entities";
import { Skeleton } from "@/components/ui/skeleton";

export default function EmailNotificationsEditor() {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [currentTemplate, setCurrentTemplate] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTemplates = async () => {
            setIsLoading(true);
            const data = await NotificationTemplate.list();
            setTemplates(data);
            if (data.length > 0) {
                const initialTemplate = data[0];
                setSelectedTemplateId(initialTemplate.id);
                setCurrentTemplate(initialTemplate);
            }
            setIsLoading(false);
        };
        fetchTemplates();
    }, []);

    const handleSelect = (id) => {
        setSelectedTemplateId(id);
        setCurrentTemplate(templates.find(t => t.id === id));
    };

    const handleChange = (e) => {
        setCurrentTemplate(p => ({...p, [e.target.name]: e.target.value}));
    };

    const handleSave = async () => {
        if (!currentTemplate) return;
        await NotificationTemplate.update(currentTemplate.id, { subject: currentTemplate.subject, body: currentTemplate.body });
        alert("Template saved!");
    };
    
    if(isLoading) return <Skeleton className="w-full h-96"/>;

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div>
                    <Label className="font-semibold">Select Template to Edit</Label>
                    <Select value={selectedTemplateId} onValueChange={handleSelect}>
                        <SelectTrigger><SelectValue placeholder="Choose a template..." /></SelectTrigger>
                        <SelectContent>
                            {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                {currentTemplate && (
                    <div className="p-4 border rounded-lg space-y-4 bg-slate-50">
                        <p className="text-sm text-slate-500">You can use placeholders like: {'`{{customer_name}}`'}, {'`{{invoice_number}}`'}, {'`{{amount}}`'}, and {'`{{company_name}}`'}.</p>
                        <div><Label>Subject</Label><Input name="subject" value={currentTemplate.subject} onChange={handleChange}/></div>
                        <div><Label>Body</Label><Textarea name="body" value={currentTemplate.body} onChange={handleChange} rows={12}/></div>
                    </div>
                )}
            </div>
             <div className="flex justify-end pt-6 border-t"><Button onClick={handleSave} disabled={!currentTemplate}><Save className="w-4 h-4 mr-2" /> Save Email Template</Button></div>
        </div>
    );
}