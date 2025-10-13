const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const makeRequest = async (path, { method = 'GET', body, headers = {} } = {}) => {
  const requestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (body !== undefined) {
    requestInit.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, requestInit);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request to ${path} failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const matchFiltersLocally = (records, filters = {}) => {
  if (!filters || Object.keys(filters).length === 0) {
    return records;
  }

  return records.filter((record) => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === undefined || value === null || value === '') return true;
      const candidate = record?.[key];
      if (Array.isArray(value)) {
        return value.includes(candidate);
      }
      if (typeof value === 'object' && value !== null) {
        if ('$in' in value && Array.isArray(value.$in)) {
          return value.$in.includes(candidate);
        }
        if ('$ne' in value) {
          return candidate !== value.$ne;
        }
        if ('$contains' in value && typeof candidate === 'string') {
          return candidate.toLowerCase().includes(String(value.$contains).toLowerCase());
        }
      }
      return candidate === value;
    });
  });
};

const createEntityClient = (type) => ({
  name: type,
  async list(sort = '-created_date', limit = 100, offset = 0) {
    const params = new URLSearchParams();
    if (sort) params.set('sort', sort);
    if (limit !== undefined) params.set('limit', String(limit));
    if (offset !== undefined) params.set('offset', String(offset));
    return makeRequest(`/entities/${type}?${params.toString()}`);
  },
  async get(id) {
    return makeRequest(`/entities/${type}/${id}`);
  },
  async create(data) {
    return makeRequest(`/entities/${type}`, { method: 'POST', body: data });
  },
  async update(id, data) {
    return makeRequest(`/entities/${type}/${id}`, { method: 'PUT', body: data });
  },
  async delete(id) {
    return makeRequest(`/entities/${type}/${id}`, { method: 'DELETE' });
  },
  async filter(filters = {}) {
    try {
      return await makeRequest(`/entities/${type}/filter`, { method: 'POST', body: { filters } });
    } catch (error) {
      // Fall back to client-side filtering if the API does not support it.
      const records = await this.list(undefined, 500, 0);
      return matchFiltersLocally(records, filters);
    }
  }
});

const ENTITY_ENDPOINTS = {
  Customer: 'customers',
  Supplier: 'suppliers',
  Product: 'products',
  Invoice: 'invoices',
  PurchaseOrder: 'purchase-orders',
  Quotation: 'quotations',
  Expense: 'expenses',
  CompanyProfile: 'company-profiles',
  NotificationTemplate: 'notification-templates',
  DeliveryOrder: 'delivery-orders',
  SubscriptionPlan: 'subscription-plans',
  UserSubscription: 'user-subscriptions',
  SubscriptionLog: 'subscription-logs',
  CreditNote: 'credit-notes',
  Payment: 'payments',
  Bill: 'bills',
  Reimbursement: 'reimbursements',
  VendorCredit: 'vendor-credits',
  ReturnNote: 'return-notes',
  StockAdjustment: 'stock-adjustments',
  Warehouse: 'warehouses',
  Category: 'categories',
  Prospect: 'prospects',
  Visit: 'visits',
  Task: 'tasks',
  ChartOfAccounts: 'chart-of-accounts',
  JournalEntry: 'journal-entries',
  JournalEntryLine: 'journal-entry-lines',
  LicenseKey: 'license-keys',
  User: 'users'
};

const entityClients = Object.fromEntries(
  Object.entries(ENTITY_ENDPOINTS).map(([key, value]) => [key, createEntityClient(value)])
);

const getStoredUserId = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('agentic-erp:userId');
};

const setStoredUserId = (id) => {
  if (typeof window === 'undefined') return;
  if (id) {
    window.localStorage.setItem('agentic-erp:userId', String(id));
  } else {
    window.localStorage.removeItem('agentic-erp:userId');
  }
};

const authClient = {
  async me() {
    const storedId = getStoredUserId();
    const query = storedId ? `?id=${storedId}` : '';
    const user = await makeRequest(`/auth/me${query}`);
    if (user?.id) {
      setStoredUserId(user.id);
    }
    return user;
  },
  async logout() {
    await makeRequest('/auth/logout', { method: 'POST' });
    setStoredUserId(null);
  },
  async list() {
    return makeRequest('/auth/users');
  },
  async create(data) {
    const user = await makeRequest('/auth/users', { method: 'POST', body: data });
    if (user?.id) {
      setStoredUserId(user.id);
    }
    return user;
  },
  async update(id, data) {
    return makeRequest(`/auth/users/${id}`, { method: 'PUT', body: data });
  },
  async delete(id) {
    if (getStoredUserId() === String(id)) {
      setStoredUserId(null);
    }
    return makeRequest(`/auth/users/${id}`, { method: 'DELETE' });
  }
};

const agentsClient = {
  async listConversations(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.agent_name) {
      searchParams.set('agent_name', params.agent_name);
    }
    const query = searchParams.toString();
    return makeRequest(`/conversations${query ? `?${query}` : ''}`);
  },
  async getConversation(id) {
    return makeRequest(`/conversations/${id}`);
  },
  async createConversation(payload = {}) {
    return makeRequest('/conversations', { method: 'POST', body: payload });
  },
  async addMessage(conversation, message) {
    const id = typeof conversation === 'object' ? conversation.id : conversation;
    return makeRequest(`/conversations/${id}/messages`, { method: 'POST', body: message });
  },
  subscribeToConversation(conversationId, callback, intervalMs = 2000) {
    let active = true;
    const fetchConversation = async () => {
      try {
        const data = await this.getConversation(conversationId);
        if (active && typeof callback === 'function') {
          callback({ messages: data?.messages || [], conversation: data });
        }
      } catch (error) {
        console.error('Conversation subscription error', error);
      }
    };

    fetchConversation();
    const interval = setInterval(fetchConversation, intervalMs);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }
};

const integrationsClient = {
  Core: {
    InvokeLLM: {
      async run() {
        throw new Error('InvokeLLM integration is not implemented in the MongoDB backend.');
      }
    },
    SendEmail: {
      async run() {
        throw new Error('SendEmail integration is not implemented in the MongoDB backend.');
      }
    },
    UploadFile: {
      async run() {
        throw new Error('UploadFile integration is not implemented in the MongoDB backend.');
      }
    },
    GenerateImage: {
      async run() {
        throw new Error('GenerateImage integration is not implemented in the MongoDB backend.');
      }
    },
    ExtractDataFromUploadedFile: {
      async run() {
        throw new Error('ExtractDataFromUploadedFile integration is not implemented in the MongoDB backend.');
      }
    },
    CreateFileSignedUrl: {
      async run() {
        throw new Error('CreateFileSignedUrl integration is not implemented in the MongoDB backend.');
      }
    },
    UploadPrivateFile: {
      async run() {
        throw new Error('UploadPrivateFile integration is not implemented in the MongoDB backend.');
      }
    }
  }
};

export const base44 = {
  entities: entityClients,
  auth: authClient,
  agents: agentsClient,
  integrations: integrationsClient
};
