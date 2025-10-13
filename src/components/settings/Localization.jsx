import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocalization } from '../contexts/LocalizationContext';
import { Save, Loader2, Globe } from 'lucide-react';
import { Toaster, toast } from 'sonner';

const languageOptions = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو' }
];

export default function Localization() {
    const { language, setLanguage, t } = useLocalization();
    const [selectedLanguage, setSelectedLanguage] = useState(language);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const success = await setLanguage(selectedLanguage);
        if (success) {
            toast.success(t('settings.language_saved'));
            setTimeout(() => window.location.reload(), 1500);
        } else {
            toast.error('Failed to save language settings');
        }
        setIsSaving(false);
    };

    const hasChanges = selectedLanguage !== language;

    return (
        <>
            <Toaster />
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-600" />
                        {t('settings.language_title')}
                    </CardTitle>
                    <CardDescription>{t('settings.language_description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="w-full md:w-2/3">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t('settings.language_select')}
                        </label>
                        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('settings.language_select')} />
                            </SelectTrigger>
                            <SelectContent>
                                {languageOptions.map(lang => (
                                    <SelectItem key={lang.code} value={lang.code}>
                                        <div className="flex items-center gap-2">
                                            <span>{lang.nativeName}</span>
                                            <span className="text-xs text-slate-500">({lang.name})</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500 mt-2">
                            {language === 'ar' || language === 'ur' 
                                ? 'The interface will adapt to right-to-left layout for Arabic and Urdu.'
                                : 'The interface language will update after saving and reloading.'}
                        </p>
                    </div>

                    <div className="pt-4 border-t">
                        <Button 
                            onClick={handleSave} 
                            disabled={isSaving || !hasChanges}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    {t('settings.save_changes')}
                                </>
                            )}
                        </Button>
                        {hasChanges && (
                            <p className="text-sm text-amber-600 mt-2">
                                * The page will reload after saving to apply the new language
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </>
    );
}