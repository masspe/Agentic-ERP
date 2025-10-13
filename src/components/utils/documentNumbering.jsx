import { CompanyProfile, User } from '@/api/entities';
import { format } from 'date-fns';

const documentTypeMapping = {
  'invoice': 'sales_invoice',
  'purchase_order': 'purchase_order',
  'quotation': 'quotation',
  'sales_order': 'sales_order',
  'delivery_note': 'delivery_note',
  'credit_note': 'credit_note',
  'debit_note': 'debit_note'
};

export const generateDocumentNumber = async (documentType, userEmail) => {
  try {
    const profiles = await CompanyProfile.filter({ created_by: userEmail });
    if (profiles.length === 0) {
      // Create default profile if none exists
      const defaultProfile = createDefaultProfile();
      const createdProfile = await CompanyProfile.create(defaultProfile);
      return generateNumberFromProfile(createdProfile, documentType);
    }

    const profile = profiles[0];
    const number = generateNumberFromProfile(profile, documentType);
    
    // Update the counter and reset date if needed
    await updateDocumentCounter(profile, documentType);
    
    return number;
  } catch (error) {
    console.error('Error generating document number:', error);
    return `${documentType.toUpperCase()}-001`;
  }
};

const createDefaultProfile = () => {
  const defaultData = { company_name: "Default Company" };
  Object.values(documentTypeMapping).forEach(docType => {
    defaultData[`${docType}_prefix`] = getDefaultPrefix(docType);
    defaultData[`${docType}_counter`] = 0;
    defaultData[`${docType}_reset_option`] = 'none';
    defaultData[`${docType}_last_reset_date`] = format(new Date(), 'yyyy-MM-dd');
  });
  return defaultData;
};

const getDefaultPrefix = (docType) => {
  const prefixMap = {
    'sales_invoice': 'INV-',
    'purchase_order': 'PO-',
    'quotation': 'QUO-',
    'sales_order': 'SO-',
    'delivery_note': 'DN-',
    'credit_note': 'CN-',
    'debit_note': 'DBN-'
  };
  return prefixMap[docType] || 'DOC-';
};

const generateNumberFromProfile = (profile, documentType) => {
  const dbDocType = documentTypeMapping[documentType] || documentType;
  const prefix = profile[`${dbDocType}_prefix`] || getDefaultPrefix(dbDocType);
  const resetOption = profile[`${dbDocType}_reset_option`] || 'none';
  let counter = (profile[`${dbDocType}_counter`] || 0) + 1;
  const lastResetDate = profile[`${dbDocType}_last_reset_date`];

  // Check if reset is needed
  const now = new Date();
  const lastReset = lastResetDate ? new Date(lastResetDate) : new Date();

  if (resetOption === 'yearly' && now.getFullYear() > lastReset.getFullYear()) {
    counter = 1;
  } else if (resetOption === 'monthly' && 
    (now.getFullYear() > lastReset.getFullYear() || 
     (now.getFullYear() === lastReset.getFullYear() && now.getMonth() > lastReset.getMonth()))) {
    counter = 1;
  }

  // Generate number based on reset option
  let numberSuffix;
  switch (resetOption) {
    case 'yearly':
      numberSuffix = `${now.getFullYear()}-${counter.toString().padStart(3, '0')}`;
      break;
    case 'monthly':
      numberSuffix = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${counter.toString().padStart(3, '0')}`;
      break;
    default:
      numberSuffix = counter.toString().padStart(3, '0');
  }

  return `${prefix}${numberSuffix}`;
};

const updateDocumentCounter = async (profile, documentType) => {
  try {
    const dbDocType = documentTypeMapping[documentType] || documentType;
    const resetOption = profile[`${dbDocType}_reset_option`] || 'none';
    let counter = (profile[`${dbDocType}_counter`] || 0) + 1;
    const lastResetDate = profile[`${dbDocType}_last_reset_date`];

    const now = new Date();
    const lastReset = lastResetDate ? new Date(lastResetDate) : new Date();
    let shouldUpdateResetDate = false;

    // Check if reset is needed
    if (resetOption === 'yearly' && now.getFullYear() > lastReset.getFullYear()) {
      counter = 1;
      shouldUpdateResetDate = true;
    } else if (resetOption === 'monthly' && 
      (now.getFullYear() > lastReset.getFullYear() || 
       (now.getFullYear() === lastReset.getFullYear() && now.getMonth() > lastReset.getMonth()))) {
      counter = 1;
      shouldUpdateResetDate = true;
    }

    // Prepare update data
    const updateData = {
      [`${dbDocType}_counter`]: counter
    };

    if (shouldUpdateResetDate) {
      updateData[`${dbDocType}_last_reset_date`] = format(now, 'yyyy-MM-dd');
    }

    await CompanyProfile.update(profile.id, updateData);
  } catch (error) {
    console.error('Error updating document counter:', error);
  }
};