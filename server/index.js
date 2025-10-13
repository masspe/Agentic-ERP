import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agentic_erp';

const mongoClient = new MongoClient(MONGO_URI, {
  serverSelectionTimeoutMS: 5000
});

let database;

const resolveDatabaseName = () => process.env.MONGO_DB_NAME || mongoClient.options?.dbName || 'agentic_erp';

const app = express();
const PORT = process.env.PORT || 4000;

const ENTITY_TYPES = [
  'customers',
  'suppliers',
  'products',
  'invoices',
  'purchase-orders',
  'quotations',
  'expenses',
  'company-profiles',
  'notification-templates',
  'delivery-orders',
  'subscription-plans',
  'user-subscriptions',
  'subscription-logs',
  'credit-notes',
  'payments',
  'bills',
  'reimbursements',
  'vendor-credits',
  'return-notes',
  'stock-adjustments',
  'warehouses',
  'categories',
  'prospects',
  'visits',
  'tasks',
  'chart-of-accounts',
  'journal-entries',
  'journal-entry-lines',
  'license-keys',
  'users'
];

app.use(cors());
app.use(express.json({ limit: '5mb' }));

const connectToDatabase = async () => {
  if (!database) {
    await mongoClient.connect();
    database = mongoClient.db(resolveDatabaseName());
  }

  return database;
};

const getCollection = (name) => {
  if (!database) {
    throw new Error('Database connection has not been initialised');
  }

  return database.collection(name);
};

const entityCollection = () => getCollection('entities');
const conversationCollection = () => getCollection('conversations');
const messageCollection = () => getCollection('messages');

const toObjectId = (value) => {
  if (!value || !ObjectId.isValid(value)) {
    return null;
  }

  try {
    return new ObjectId(value);
  } catch (_error) {
    return null;
  }
};

const mapRecordToEntity = (record) => {
  if (!record) return null;
  const payload = typeof record.data === 'object' && record.data !== null ? { ...record.data } : {};
  const createdAt = payload.created_date || record.createdAt?.toISOString?.();
  const updatedAt = payload.updated_date || record.updatedAt?.toISOString?.();

  return {
    id: record._id?.toString?.() || record.id,
    ...payload,
    created_date: createdAt,
    updated_date: updatedAt
  };
};

const applyFilters = (entity, filters = {}) => {
  if (!filters || typeof filters !== 'object') {
    return true;
  }

  return Object.entries(filters).every(([key, value]) => {
    if (value === undefined || value === null || value === '') return true;
    const candidate = entity?.[key];
    if (Array.isArray(value)) {
      return value.includes(candidate);
    }
    if (typeof value === 'object') {
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
};

const parseSort = (sort) => {
  if (!sort || typeof sort !== 'string' || sort.trim() === '') {
    return { field: 'createdAt', direction: 'desc' };
  }

  const direction = sort.startsWith('-') ? 'desc' : 'asc';
  const fieldToken = sort.replace(/^[-+]/, '');

  if (['created_date', 'createdAt'].includes(fieldToken)) {
    return { field: 'createdAt', direction };
  }

  if (['updated_date', 'updatedAt'].includes(fieldToken)) {
    return { field: 'updatedAt', direction };
  }

  // Fallback to creation date ordering when unknown fields are requested.
  return { field: 'createdAt', direction };
};

const ensureEntityType = (type) => {
  if (!ENTITY_TYPES.includes(type)) {
    throw new Error(`Unsupported entity type: ${type}`);
  }
};

// --- Entity routes -------------------------------------------------------

app.get('/api/entities/:type', async (req, res) => {
  try {
    const { type } = req.params;
    ensureEntityType(type);

    const { sort, limit = 100, offset = 0 } = req.query;
    const { field, direction } = parseSort(sort);

    const records = await entityCollection()
      .find({ type })
      .sort({ [field]: direction === 'asc' ? 1 : -1 })
      .skip(Number(offset) || 0)
      .limit(Math.min(Number(limit) || 100, 500))
      .toArray();

    res.json(records.map(mapRecordToEntity));
  } catch (error) {
    console.error('List entities failed', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/entities/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    ensureEntityType(type);

    const objectId = toObjectId(id);
    if (!objectId) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    const record = await entityCollection().findOne({ _id: objectId, type });
    if (!record) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    res.json(mapRecordToEntity(record));
  } catch (error) {
    console.error('Get entity failed', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/entities/:type', async (req, res) => {
  try {
    const { type } = req.params;
    ensureEntityType(type);

    const payload = { ...req.body };
    delete payload.id;
    const nowIso = new Date().toISOString();
    const data = {
      ...payload,
      created_date: payload.created_date || nowIso,
      updated_date: payload.updated_date || nowIso
    };

    const createdAt = new Date();
    const result = await entityCollection().insertOne({
      type,
      data,
      createdAt,
      updatedAt: createdAt
    });

    const record = await entityCollection().findOne({ _id: result.insertedId });
    res.status(201).json(mapRecordToEntity(record));
  } catch (error) {
    console.error('Create entity failed', error);
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/entities/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    ensureEntityType(type);

    const objectId = toObjectId(id);
    if (!objectId) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    const existing = await entityCollection().findOne({ _id: objectId, type });
    if (!existing) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    const payload = { ...req.body };
    delete payload.id;
    const nowIso = new Date().toISOString();
    const updatedAt = new Date();

    const data = {
      ...existing.data,
      ...payload,
      updated_date: nowIso
    };

    await entityCollection().updateOne(
      { _id: objectId },
      {
        $set: {
          data,
          updatedAt
        }
      }
    );

    const record = await entityCollection().findOne({ _id: objectId });
    res.json(mapRecordToEntity(record));
  } catch (error) {
    console.error('Update entity failed', error);
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/entities/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    ensureEntityType(type);

    const objectId = toObjectId(id);
    if (!objectId) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    const existing = await entityCollection().findOne({ _id: objectId, type });
    if (!existing) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    await entityCollection().deleteOne({ _id: objectId });
    res.status(204).end();
  } catch (error) {
    console.error('Delete entity failed', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/entities/:type/filter', async (req, res) => {
  try {
    const { type } = req.params;
    ensureEntityType(type);
    const { filters = {} } = req.body || {};

    const records = await entityCollection().find({ type }).toArray();
    const result = records
      .map(mapRecordToEntity)
      .filter((entity) => applyFilters(entity, filters));

    res.json(result);
  } catch (error) {
    console.error('Filter entities failed', error);
    res.status(400).json({ error: error.message });
  }
});

// --- Authentication facade -----------------------------------------------

const authClient = {
  async currentUser(id) {
    if (id) {
      const objectId = toObjectId(id);
      if (objectId) {
        const record = await entityCollection().findOne({ _id: objectId, type: 'users' });
        if (record) {
          return mapRecordToEntity(record);
        }
      }
    }

    const firstUser = await entityCollection()
      .find({ type: 'users' })
      .sort({ createdAt: 1 })
      .limit(1)
      .next();

    return mapRecordToEntity(firstUser);
  }
};

app.get('/api/auth/me', async (req, res) => {
  try {
    const { id } = req.query;
    const user = await authClient.currentUser(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Fetch current user failed', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  res.json({ success: true });
});

app.get('/api/auth/users', async (_req, res) => {
  try {
    const records = await entityCollection().find({ type: 'users' }).toArray();
    res.json(records.map(mapRecordToEntity));
  } catch (error) {
    console.error('List users failed', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/users', async (req, res) => {
  try {
    const payload = { ...req.body };
    const nowIso = new Date().toISOString();

    const createdAt = new Date();
    const recordData = {
      ...payload,
      created_date: payload.created_date || nowIso,
      updated_date: payload.updated_date || nowIso
    };

    const result = await entityCollection().insertOne({
      type: 'users',
      data: recordData,
      createdAt,
      updatedAt: createdAt
    });

    const record = await entityCollection().findOne({ _id: result.insertedId });
    res.status(201).json(mapRecordToEntity(record));
  } catch (error) {
    console.error('Create user failed', error);
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/auth/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const objectId = toObjectId(id);
    if (!objectId) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existing = await entityCollection().findOne({ _id: objectId, type: 'users' });
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    const payload = { ...req.body };
    const nowIso = new Date().toISOString();
    const updatedAt = new Date();

    const data = {
      ...existing.data,
      ...payload,
      updated_date: nowIso
    };

    await entityCollection().updateOne(
      { _id: objectId },
      {
        $set: {
          data,
          updatedAt
        }
      }
    );

    const record = await entityCollection().findOne({ _id: objectId });
    res.json(mapRecordToEntity(record));
  } catch (error) {
    console.error('Update user failed', error);
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/auth/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const objectId = toObjectId(id);
    if (!objectId) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existing = await entityCollection().findOne({ _id: objectId, type: 'users' });
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    await entityCollection().deleteOne({ _id: objectId });
    res.status(204).end();
  } catch (error) {
    console.error('Delete user failed', error);
    res.status(400).json({ error: error.message });
  }
});

// --- AI Assistant (conversation) facade -----------------------------------

const formatConversation = (conversation, includeMessages = false) => {
  if (!conversation) return null;
  const base = {
    id: conversation._id?.toString?.() || conversation.id,
    agent_name: conversation.agentName,
    metadata: conversation.metadata || null,
    created_at: conversation.createdAt?.toISOString?.() || null,
    updated_at: conversation.updatedAt?.toISOString?.() || null
  };

  if (includeMessages) {
    base.messages = (conversation.messages || []).map((message) => ({
      id: message._id?.toString?.() || message.id,
      role: message.role,
      content: message.content,
      created_at: message.createdAt?.toISOString?.() || null
    }));
  }

  return base;
};

app.get('/api/conversations', async (req, res) => {
  try {
    const { agent_name: agentName } = req.query;
    const query = agentName ? { agentName } : {};

    const conversations = await conversationCollection()
      .find(query)
      .sort({ updatedAt: -1 })
      .toArray();

    res.json(conversations.map((conversation) => formatConversation(conversation, false)));
  } catch (error) {
    console.error('List conversations failed', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const objectId = toObjectId(id);
    if (!objectId) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const conversation = await conversationCollection().findOne({ _id: objectId });
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await messageCollection()
      .find({ conversationId: objectId })
      .sort({ createdAt: 1 })
      .toArray();

    res.json(formatConversation({ ...conversation, messages }, true));
  } catch (error) {
    console.error('Get conversation failed', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/conversations', async (req, res) => {
  try {
    const { agent_name: agentName = 'erp_assistant', metadata = {} } = req.body || {};
    const createdAt = new Date();

    const result = await conversationCollection().insertOne({
      agentName,
      metadata,
      createdAt,
      updatedAt: createdAt
    });

    res.status(201).json(
      formatConversation(
        {
          _id: result.insertedId,
          agentName,
          metadata,
          createdAt,
          updatedAt: createdAt,
          messages: []
        },
        true
      )
    );
  } catch (error) {
    console.error('Create conversation failed', error);
    res.status(400).json({ error: error.message });
  }
});

const buildAssistantReply = (content) => {
  if (!content || typeof content !== 'string') {
    return 'Thanks for reaching out. How can I assist you today?';
  }

  return `I heard: "${content.slice(0, 200)}". I'm a demo assistant, so please adapt this response as needed.`;
};

app.post('/api/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, content } = req.body || {};

    const objectId = toObjectId(id);
    if (!objectId) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const conversation = await conversationCollection().findOne({ _id: objectId });
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!role || !content) {
      return res.status(400).json({ error: 'role and content are required' });
    }

    await messageCollection().insertOne({
      conversationId: objectId,
      role,
      content,
      createdAt: new Date()
    });

    // Naive assistant reply for demo purposes.
    if (role !== 'assistant') {
      await messageCollection().insertOne({
        conversationId: objectId,
        role: 'assistant',
        content: buildAssistantReply(content),
        createdAt: new Date()
      });
    }

    const updatedAt = new Date();
    await conversationCollection().updateOne(
      { _id: objectId },
      {
        $set: { updatedAt }
      }
    );

    const messages = await messageCollection()
      .find({ conversationId: objectId })
      .sort({ createdAt: 1 })
      .toArray();

    res.json(
      formatConversation(
        {
          ...conversation,
          updatedAt,
          messages
        },
        true
      )
    );
  } catch (error) {
    console.error('Add message failed', error);
    res.status(400).json({ error: error.message });
  }
});

// --- Utilities -----------------------------------------------------------

app.get('/api/health', async (_req, res) => {
  res.json({ status: 'ok' });
});

const ensureIndexes = async () => {
  await Promise.all([
    entityCollection().createIndex({ type: 1 }),
    entityCollection().createIndex({ createdAt: -1 }),
    entityCollection().createIndex({ updatedAt: -1 }),
    conversationCollection().createIndex({ updatedAt: -1 }),
    messageCollection().createIndex({ conversationId: 1, createdAt: 1 })
  ]);
};

const seedDatabase = async () => {
  const entities = entityCollection();
  const demoEmail = 'demo@agenticerp.test';
  const now = new Date();

  const ensureSeedRecords = async (type, records = []) => {
    if (!Array.isArray(records) || records.length === 0) {
      return {};
    }

    const count = await entities.countDocuments({ type });
    if (count > 0) {
      return {};
    }

    const seedKeyToId = {};

    const documents = records.map((record) => {
      const {
        _seedKey,
        _createdAt,
        _updatedAt,
        created_date: explicitCreated,
        updated_date: explicitUpdated,
        created_by,
        ...rest
      } = record;

      const createdAt = _createdAt ? new Date(_createdAt) : now;
      const updatedAt = _updatedAt ? new Date(_updatedAt) : createdAt;

      const createdDate = explicitCreated || createdAt.toISOString();
      const updatedDate = explicitUpdated || updatedAt.toISOString();

      const data = {
        ...rest,
        created_by: created_by || demoEmail,
        created_date: createdDate,
        updated_date: updatedDate
      };

      return {
        document: {
          type,
          data,
          createdAt,
          updatedAt
        },
        seedKey: _seedKey || null
      };
    });

    const insertResult = await entities.insertMany(documents.map(({ document }) => document));

    Object.values(insertResult.insertedIds).forEach((id, index) => {
      const key = documents[index].seedKey;
      if (key) {
        seedKeyToId[key] = id.toString();
      }
    });

    return seedKeyToId;
  };

  const seedReferences = {};

  // Seed demo user
  const userSeeds = await ensureSeedRecords('users', [
    {
      _seedKey: 'user-demo',
      email: demoEmail,
      name: 'Demo User'
    }
  ]);
  Object.assign(seedReferences, userSeeds);

  // Seed company profile with active subscription
  const companySeeds = await ensureSeedRecords('company-profiles', [
    {
      _seedKey: 'company-demo',
      company_name: 'Agentic ERP Demo',
      currency: 'USD',
      address: '500 Innovation Drive, Suite 12, San Francisco, CA 94105',
      phone: '+1 (415) 555-0110',
      website: 'https://agenticerp.test',
      tax_id: 'DEM-001-2024',
      subscription_status: 'active',
      subscription_ends_at: new Date(now.getFullYear(), now.getMonth() + 6, 15).toISOString(),
      created_by: demoEmail
    }
  ]);
  Object.assign(seedReferences, companySeeds);

  // Supporting reference data
  const categorySeeds = await ensureSeedRecords('categories', [
    {
      _seedKey: 'category-electronics',
      name: 'Electronics',
      description: 'Devices, accessories and gadgets',
      color: '#6366f1',
      is_active: true
    },
    {
      _seedKey: 'category-office',
      name: 'Office Supplies',
      description: 'Workplace consumables and accessories',
      color: '#22c55e',
      is_active: true
    },
    {
      _seedKey: 'category-services',
      name: 'Professional Services',
      description: 'Billable consulting services',
      color: '#f97316',
      is_active: true
    }
  ]);
  Object.assign(seedReferences, categorySeeds);

  const customerSeeds = await ensureSeedRecords('customers', [
    {
      _seedKey: 'customer-acme',
      name: 'Acme Corporation',
      contact_person: 'Laura Chen',
      email: 'accounts@acme.com',
      phone: '+1 (415) 555-1001',
      city: 'San Francisco',
      country: 'USA',
      industry: 'Technology',
      payment_terms: 'net_30',
      status: 'active'
    },
    {
      _seedKey: 'customer-globex',
      name: 'Globex Industries',
      contact_person: 'Miguel Torres',
      email: 'finance@globex.io',
      phone: '+1 (206) 555-2190',
      city: 'Seattle',
      country: 'USA',
      industry: 'Manufacturing',
      payment_terms: 'net_45',
      status: 'active'
    },
    {
      _seedKey: 'customer-initech',
      name: 'Initech Solutions',
      contact_person: 'Priya Desai',
      email: 'billing@initech.co',
      phone: '+1 (617) 555-8891',
      city: 'Boston',
      country: 'USA',
      industry: 'Consulting',
      payment_terms: 'due_on_receipt',
      status: 'prospect'
    }
  ]);
  Object.assign(seedReferences, customerSeeds);

  const supplierSeeds = await ensureSeedRecords('suppliers', [
    {
      _seedKey: 'supplier-nimbus',
      name: 'Nimbus Distribution',
      contact_person: 'Hannah Wright',
      email: 'orders@nimbusdistribution.com',
      phone: '+1 (303) 555-7330',
      city: 'Denver',
      country: 'USA',
      payment_terms: 'net_30',
      rating: 'preferred'
    },
    {
      _seedKey: 'supplier-vertex',
      name: 'Vertex Components',
      contact_person: 'Samuel Rivera',
      email: 'sales@vertexcomponents.net',
      phone: '+1 (602) 555-9401',
      city: 'Phoenix',
      country: 'USA',
      payment_terms: 'net_45',
      rating: 'standard'
    }
  ]);
  Object.assign(seedReferences, supplierSeeds);

  const warehouseSeeds = await ensureSeedRecords('warehouses', [
    {
      _seedKey: 'warehouse-west',
      name: 'West Coast DC',
      location: 'Oakland, CA',
      manager: 'Thomas Blake',
      status: 'active'
    },
    {
      _seedKey: 'warehouse-east',
      name: 'East Coast Hub',
      location: 'Newark, NJ',
      manager: 'Angela Patel',
      status: 'active'
    }
  ]);
  Object.assign(seedReferences, warehouseSeeds);

  const productSeeds = await ensureSeedRecords('products', [
    {
      _seedKey: 'product-sensor',
      name: 'IoT Environment Sensor',
      sku: 'IOT-ENS-001',
      category_id: seedReferences['category-electronics'],
      category_name: 'Electronics',
      warehouse_id: seedReferences['warehouse-west'],
      warehouse_name: 'West Coast DC',
      unit: 'pcs',
      purchase_price: 125.0,
      selling_price: 229.0,
      current_stock: 42,
      minimum_stock: 10,
      status: 'active'
    },
    {
      _seedKey: 'product-router',
      name: 'Industrial Edge Router',
      sku: 'NET-EDG-104',
      category_id: seedReferences['category-electronics'],
      category_name: 'Electronics',
      warehouse_id: seedReferences['warehouse-west'],
      warehouse_name: 'West Coast DC',
      unit: 'pcs',
      purchase_price: 310.0,
      selling_price: 499.0,
      current_stock: 18,
      minimum_stock: 8,
      status: 'active'
    },
    {
      _seedKey: 'product-onboarding',
      name: 'Remote Onboarding Package',
      sku: 'SRV-ONB-310',
      category_id: seedReferences['category-services'],
      category_name: 'Professional Services',
      unit: 'package',
      purchase_price: 0,
      selling_price: 1800.0,
      current_stock: 999,
      minimum_stock: 0,
      status: 'service'
    }
  ]);
  Object.assign(seedReferences, productSeeds);

  const expenseSeeds = await ensureSeedRecords('expenses', [
    {
      _seedKey: 'expense-software',
      description: 'Annual software subscriptions',
      category: 'software',
      status: 'approved',
      amount: 2450.0,
      currency: 'USD',
      date: new Date(now.getFullYear(), now.getMonth(), 4).toISOString(),
      payment_method: 'bank_transfer',
      reference_number: 'EXP-2024-001'
    },
    {
      _seedKey: 'expense-travel',
      description: 'Customer onsite visit',
      category: 'travel',
      status: 'pending',
      amount: 860.75,
      currency: 'USD',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 22).toISOString(),
      payment_method: 'corporate_card',
      reference_number: 'EXP-2024-002'
    },
    {
      _seedKey: 'expense-office',
      description: 'Office supplies restock',
      category: 'office_supplies',
      status: 'paid',
      amount: 320.5,
      currency: 'USD',
      date: new Date(now.getFullYear(), now.getMonth() - 2, 12).toISOString(),
      payment_method: 'cash',
      reference_number: 'EXP-2024-003'
    }
  ]);
  Object.assign(seedReferences, expenseSeeds);

  const quotationSeeds = await ensureSeedRecords('quotations', [
    {
      _seedKey: 'quotation-acme',
      quotation_number: 'QT-2024-001',
      customer_id: seedReferences['customer-acme'],
      customer_name: 'Acme Corporation',
      date: new Date(now.getFullYear(), now.getMonth(), 2).toISOString(),
      expiry_date: new Date(now.getFullYear(), now.getMonth(), 17).toISOString(),
      total_amount: 12450.0,
      currency: 'USD',
      status: 'sent',
      items: [
        {
          product_id: seedReferences['product-sensor'],
          description: 'IoT Environment Sensor',
          quantity: 30,
          unit_price: 229.0,
          total: 6870.0
        }
      ]
    },
    {
      _seedKey: 'quotation-globex',
      quotation_number: 'QT-2024-002',
      customer_id: seedReferences['customer-globex'],
      customer_name: 'Globex Industries',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 12).toISOString(),
      expiry_date: new Date(now.getFullYear(), now.getMonth() - 1, 28).toISOString(),
      total_amount: 8900.0,
      currency: 'USD',
      status: 'accepted',
      items: [
        {
          product_id: seedReferences['product-router'],
          description: 'Industrial Edge Router',
          quantity: 12,
          unit_price: 499.0,
          total: 5988.0
        }
      ]
    }
  ]);
  Object.assign(seedReferences, quotationSeeds);

  const invoiceSeeds = await ensureSeedRecords('invoices', [
    {
      _seedKey: 'invoice-acme',
      invoice_number: 'INV-2024-104',
      customer_id: seedReferences['customer-acme'],
      customer_name: 'Acme Corporation',
      date: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(),
      due_date: new Date(now.getFullYear(), now.getMonth(), 20).toISOString(),
      status: 'sent',
      currency: 'USD',
      subtotal: 6870.0,
      tax: 480.9,
      total_amount: 7350.9,
      notes: 'Net 30 payment terms apply',
      items: [
        {
          product_id: seedReferences['product-sensor'],
          description: 'IoT Environment Sensor',
          quantity: 30,
          unit_price: 229.0,
          total: 6870.0
        }
      ]
    },
    {
      _seedKey: 'invoice-globex',
      invoice_number: 'INV-2024-096',
      customer_id: seedReferences['customer-globex'],
      customer_name: 'Globex Industries',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString(),
      due_date: new Date(now.getFullYear(), now.getMonth(), 15).toISOString(),
      status: 'paid',
      currency: 'USD',
      subtotal: 5988.0,
      tax: 419.16,
      total_amount: 6407.16,
      notes: 'Paid via bank transfer',
      items: [
        {
          product_id: seedReferences['product-router'],
          description: 'Industrial Edge Router',
          quantity: 12,
          unit_price: 499.0,
          total: 5988.0
        }
      ]
    },
    {
      _seedKey: 'invoice-initech',
      invoice_number: 'INV-2024-088',
      customer_id: seedReferences['customer-initech'],
      customer_name: 'Initech Solutions',
      date: new Date(now.getFullYear(), now.getMonth() - 2, 9).toISOString(),
      due_date: new Date(now.getFullYear(), now.getMonth() - 1, 9).toISOString(),
      status: 'overdue',
      currency: 'USD',
      subtotal: 3600.0,
      tax: 252.0,
      total_amount: 3852.0,
      notes: 'Overdue invoice follow-up scheduled',
      items: [
        {
          product_id: seedReferences['product-onboarding'],
          description: 'Remote Onboarding Package',
          quantity: 2,
          unit_price: 1800.0,
          total: 3600.0
        }
      ]
    }
  ]);
  Object.assign(seedReferences, invoiceSeeds);

  const paymentSeeds = await ensureSeedRecords('payments', [
    {
      _seedKey: 'payment-globex',
      payment_number: 'RCPT-2024-058',
      invoice_id: seedReferences['invoice-globex'],
      invoice_number: 'INV-2024-096',
      customer_id: seedReferences['customer-globex'],
      customer_name: 'Globex Industries',
      payment_date: new Date(now.getFullYear(), now.getMonth(), 3).toISOString(),
      amount_received: 6407.16,
      currency: 'USD',
      payment_method: 'bank_transfer',
      reference_number: 'BT-552210'
    },
    {
      _seedKey: 'payment-acme',
      payment_number: 'RCPT-2024-049',
      invoice_id: seedReferences['invoice-acme'],
      invoice_number: 'INV-2024-104',
      customer_id: seedReferences['customer-acme'],
      customer_name: 'Acme Corporation',
      payment_date: new Date(now.getFullYear(), now.getMonth(), 18).toISOString(),
      amount_received: 3675.45,
      currency: 'USD',
      payment_method: 'online_payment',
      reference_number: 'TRX-88342',
      notes: 'Partial payment received'
    }
  ]);
  Object.assign(seedReferences, paymentSeeds);

  const creditNoteSeeds = await ensureSeedRecords('credit-notes', [
    {
      _seedKey: 'creditnote-globex',
      credit_note_number: 'CN-2024-011',
      invoice_id: seedReferences['invoice-globex'],
      invoice_number: 'INV-2024-096',
      customer_id: seedReferences['customer-globex'],
      customer_name: 'Globex Industries',
      date: new Date(now.getFullYear(), now.getMonth(), 7).toISOString(),
      reason: 'Volume discount adjustment',
      status: 'issued',
      total_amount: 250.0,
      currency: 'USD'
    }
  ]);
  Object.assign(seedReferences, creditNoteSeeds);

  const deliveryOrderSeeds = await ensureSeedRecords('delivery-orders', [
    {
      _seedKey: 'delivery-acme',
      delivery_number: 'DO-2024-033',
      invoice_id: seedReferences['invoice-acme'],
      customer_id: seedReferences['customer-acme'],
      customer_name: 'Acme Corporation',
      scheduled_date: new Date(now.getFullYear(), now.getMonth(), 8).toISOString(),
      dispatched_date: new Date(now.getFullYear(), now.getMonth(), 9).toISOString(),
      status: 'delivered',
      driver_name: 'Janet Cruz',
      warehouse_id: seedReferences['warehouse-west'],
      warehouse_name: 'West Coast DC'
    }
  ]);
  Object.assign(seedReferences, deliveryOrderSeeds);

  const purchaseOrderSeeds = await ensureSeedRecords('purchase-orders', [
    {
      _seedKey: 'po-nimbus',
      po_number: 'PO-2024-072',
      supplier_id: seedReferences['supplier-nimbus'],
      supplier_name: 'Nimbus Distribution',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 3).toISOString(),
      expected_delivery: new Date(now.getFullYear(), now.getMonth(), 2).toISOString(),
      status: 'received',
      currency: 'USD',
      total_amount: 9850.0,
      warehouse_id: seedReferences['warehouse-west'],
      warehouse_name: 'West Coast DC',
      items: [
        {
          product_id: seedReferences['product-sensor'],
          description: 'IoT Environment Sensor',
          quantity: 50,
          unit_price: 170.0,
          total: 8500.0
        }
      ]
    },
    {
      _seedKey: 'po-vertex',
      po_number: 'PO-2024-068',
      supplier_id: seedReferences['supplier-vertex'],
      supplier_name: 'Vertex Components',
      date: new Date(now.getFullYear(), now.getMonth() - 2, 14).toISOString(),
      expected_delivery: new Date(now.getFullYear(), now.getMonth() - 1, 5).toISOString(),
      status: 'confirmed',
      currency: 'USD',
      total_amount: 7200.0,
      warehouse_id: seedReferences['warehouse-east'],
      warehouse_name: 'East Coast Hub',
      items: [
        {
          product_id: seedReferences['product-router'],
          description: 'Industrial Edge Router',
          quantity: 20,
          unit_price: 360.0,
          total: 7200.0
        }
      ]
    }
  ]);
  Object.assign(seedReferences, purchaseOrderSeeds);

  const billSeeds = await ensureSeedRecords('bills', [
    {
      _seedKey: 'bill-nimbus',
      bill_number: 'BILL-2024-020',
      supplier_id: seedReferences['supplier-nimbus'],
      supplier_name: 'Nimbus Distribution',
      bill_date: new Date(now.getFullYear(), now.getMonth() - 1, 8).toISOString(),
      due_date: new Date(now.getFullYear(), now.getMonth(), 7).toISOString(),
      status: 'awaiting_payment',
      currency: 'USD',
      total_amount: 9850.0
    },
    {
      _seedKey: 'bill-vertex',
      bill_number: 'BILL-2024-018',
      supplier_id: seedReferences['supplier-vertex'],
      supplier_name: 'Vertex Components',
      bill_date: new Date(now.getFullYear(), now.getMonth() - 2, 20).toISOString(),
      due_date: new Date(now.getFullYear(), now.getMonth() - 1, 20).toISOString(),
      status: 'paid',
      currency: 'USD',
      total_amount: 7200.0
    }
  ]);
  Object.assign(seedReferences, billSeeds);

  const reimbursementSeeds = await ensureSeedRecords('reimbursements', [
    {
      _seedKey: 'reimbursement-travel',
      reimbursement_number: 'RB-2024-014',
      employee_name: 'Jordan Matthews',
      department: 'Sales',
      purpose: 'Client visit travel expenses',
      amount: 480.25,
      currency: 'USD',
      status: 'submitted',
      submitted_date: new Date(now.getFullYear(), now.getMonth(), 6).toISOString()
    },
    {
      _seedKey: 'reimbursement-training',
      reimbursement_number: 'RB-2024-012',
      employee_name: 'Natasha Bryant',
      department: 'Customer Success',
      purpose: 'Certification training course',
      amount: 950.0,
      currency: 'USD',
      status: 'approved',
      submitted_date: new Date(now.getFullYear(), now.getMonth() - 1, 18).toISOString()
    }
  ]);
  Object.assign(seedReferences, reimbursementSeeds);

  const vendorCreditSeeds = await ensureSeedRecords('vendor-credits', [
    {
      _seedKey: 'vendorcredit-nimbus',
      credit_number: 'VC-2024-004',
      supplier_id: seedReferences['supplier-nimbus'],
      supplier_name: 'Nimbus Distribution',
      date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      reason: 'Damaged goods return',
      status: 'open',
      total_amount: 450.0,
      currency: 'USD'
    }
  ]);
  Object.assign(seedReferences, vendorCreditSeeds);

  const returnNoteSeeds = await ensureSeedRecords('return-notes', [
    {
      _seedKey: 'returnnote-acme',
      return_number: 'RN-2024-006',
      customer_id: seedReferences['customer-acme'],
      customer_name: 'Acme Corporation',
      date: new Date(now.getFullYear(), now.getMonth(), 12).toISOString(),
      reason: 'Calibration variance detected',
      status: 'processing',
      total_amount: 229.0,
      currency: 'USD'
    }
  ]);
  Object.assign(seedReferences, returnNoteSeeds);

  await ensureSeedRecords('stock-adjustments', [
    {
      adjustment_number: 'ADJ-2024-003',
      product_id: seedReferences['product-sensor'],
      product_name: 'IoT Environment Sensor',
      adjustment_date: new Date(now.getFullYear(), now.getMonth() - 1, 27).toISOString(),
      quantity_adjusted: -3,
      reason: 'Quality assurance failure',
      status: 'posted'
    }
  ]);

  const prospectSeeds = await ensureSeedRecords('prospects', [
    {
      _seedKey: 'prospect-horizon',
      company_name: 'Horizon Analytics',
      contact_person: 'Emma Li',
      email: 'emma.li@horizonanalytics.ai',
      phone: '+1 (917) 555-6670',
      stage: 'proposal_sent',
      lead_source: 'Webinar',
      estimated_value: 18500.0
    },
    {
      _seedKey: 'prospect-futura',
      company_name: 'Futura Robotics',
      contact_person: 'Arjun Mehta',
      email: 'arjun@futurarobotics.com',
      phone: '+1 (650) 555-0199',
      stage: 'qualification',
      lead_source: 'Partner referral',
      estimated_value: 27600.0
    }
  ]);
  Object.assign(seedReferences, prospectSeeds);

  await ensureSeedRecords('visits', [
    {
      visit_number: 'VIS-2024-021',
      prospect_id: seedReferences['prospect-horizon'],
      company_name: 'Horizon Analytics',
      contact_person: 'Emma Li',
      purpose: 'product_demo',
      scheduled_date: new Date(now.getFullYear(), now.getMonth(), 11).toISOString(),
      status: 'completed',
      notes: 'Strong interest in predictive maintenance module'
    },
    {
      visit_number: 'VIS-2024-019',
      prospect_id: seedReferences['prospect-futura'],
      company_name: 'Futura Robotics',
      contact_person: 'Arjun Mehta',
      purpose: 'requirement_gathering',
      scheduled_date: new Date(now.getFullYear(), now.getMonth(), 19).toISOString(),
      status: 'scheduled',
      notes: 'Follow-up on integration questions'
    }
  ]);

  await ensureSeedRecords('tasks', [
    {
      task_number: 'TASK-2024-045',
      title: 'Prepare implementation roadmap for Acme',
      assignee: 'Laura Chen',
      related_customer_id: seedReferences['customer-acme'],
      due_date: new Date(now.getFullYear(), now.getMonth(), 21).toISOString(),
      priority: 'high',
      status: 'in_progress'
    },
    {
      task_number: 'TASK-2024-041',
      title: 'Update onboarding playbook',
      assignee: 'Jordan Matthews',
      due_date: new Date(now.getFullYear(), now.getMonth(), 25).toISOString(),
      priority: 'medium',
      status: 'not_started'
    }
  ]);

  const chartOfAccountsSeeds = await ensureSeedRecords('chart-of-accounts', [
    {
      _seedKey: 'coa-1000',
      account_number: '1000',
      name: 'Cash and Cash Equivalents',
      type: 'asset',
      subtype: 'current_asset',
      currency: 'USD',
      is_active: true
    },
    {
      _seedKey: 'coa-1100',
      account_number: '1100',
      name: 'Accounts Receivable',
      type: 'asset',
      subtype: 'current_asset',
      currency: 'USD',
      is_active: true
    },
    {
      _seedKey: 'coa-2000',
      account_number: '2000',
      name: 'Accounts Payable',
      type: 'liability',
      subtype: 'current_liability',
      currency: 'USD',
      is_active: true
    },
    {
      _seedKey: 'coa-4000',
      account_number: '4000',
      name: 'Sales Revenue',
      type: 'income',
      subtype: 'operating_income',
      currency: 'USD',
      is_active: true
    },
    {
      _seedKey: 'coa-5000',
      account_number: '5000',
      name: 'Cost of Goods Sold',
      type: 'expense',
      subtype: 'direct_costs',
      currency: 'USD',
      is_active: true
    }
  ]);
  Object.assign(seedReferences, chartOfAccountsSeeds);

  const journalEntrySeeds = await ensureSeedRecords('journal-entries', [
    {
      _seedKey: 'je-invoice-globex',
      entry_number: 'JE-2024-090',
      entry_date: new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString(),
      transaction_type: 'Invoice',
      reference_number: 'INV-2024-096',
      posted_by: 'Demo User',
      description: 'Invoice issued to Globex Industries',
      total_debit: 6407.16,
      total_credit: 6407.16
    },
    {
      _seedKey: 'je-payment-globex',
      entry_number: 'JE-2024-091',
      entry_date: new Date(now.getFullYear(), now.getMonth(), 3).toISOString(),
      transaction_type: 'Payment',
      reference_number: 'RCPT-2024-058',
      posted_by: 'Demo User',
      description: 'Payment received from Globex Industries',
      total_debit: 6407.16,
      total_credit: 6407.16
    },
    {
      _seedKey: 'je-expense-software',
      entry_number: 'JE-2024-098',
      entry_date: new Date(now.getFullYear(), now.getMonth(), 4).toISOString(),
      transaction_type: 'Expense',
      reference_number: 'EXP-2024-001',
      posted_by: 'Demo User',
      description: 'Recorded software subscription expense',
      total_debit: 2450.0,
      total_credit: 2450.0
    }
  ]);
  Object.assign(seedReferences, journalEntrySeeds);

  await ensureSeedRecords('journal-entry-lines', [
    {
      journal_entry_id: seedReferences['je-invoice-globex'],
      account_id: seedReferences['coa-1100'],
      account_number: '1100',
      account_name: 'Accounts Receivable',
      description: 'Recognise receivable for Globex invoice',
      debit: 6407.16,
      credit: 0
    },
    {
      journal_entry_id: seedReferences['je-invoice-globex'],
      account_id: seedReferences['coa-4000'],
      account_number: '4000',
      account_name: 'Sales Revenue',
      description: 'Recognise sales revenue',
      debit: 0,
      credit: 6407.16
    },
    {
      journal_entry_id: seedReferences['je-payment-globex'],
      account_id: seedReferences['coa-1000'],
      account_number: '1000',
      account_name: 'Cash and Cash Equivalents',
      description: 'Payment received via bank transfer',
      debit: 6407.16,
      credit: 0
    },
    {
      journal_entry_id: seedReferences['je-payment-globex'],
      account_id: seedReferences['coa-1100'],
      account_number: '1100',
      account_name: 'Accounts Receivable',
      description: 'Clear customer receivable',
      debit: 0,
      credit: 6407.16
    },
    {
      journal_entry_id: seedReferences['je-expense-software'],
      account_id: seedReferences['coa-5000'],
      account_number: '5000',
      account_name: 'Cost of Goods Sold',
      description: 'Recognise software subscription expense',
      debit: 2450.0,
      credit: 0
    },
    {
      journal_entry_id: seedReferences['je-expense-software'],
      account_id: seedReferences['coa-2000'],
      account_number: '2000',
      account_name: 'Accounts Payable',
      description: 'Pending payment to vendor',
      debit: 0,
      credit: 2450.0
    }
  ]);

  await ensureSeedRecords('subscription-plans', [
    {
      plan_code: 'starter',
      name: 'Starter Plan',
      price: 49,
      billing_cycle: 'monthly',
      features: ['Invoices', 'Expenses', 'Inventory'],
      is_active: true
    },
    {
      plan_code: 'growth',
      name: 'Growth Plan',
      price: 99,
      billing_cycle: 'monthly',
      features: ['All Starter features', 'Advanced analytics', 'Team collaboration'],
      is_active: true
    }
  ]);

  const userSubscriptionSeeds = await ensureSeedRecords('user-subscriptions', [
    {
      _seedKey: 'subscription-demo',
      user_id: seedReferences['user-demo'],
      plan_code: 'growth',
      status: 'active',
      started_at: new Date(now.getFullYear(), now.getMonth() - 1, 10).toISOString(),
      renews_at: new Date(now.getFullYear(), now.getMonth() + 1, 10).toISOString()
    }
  ]);
  Object.assign(seedReferences, userSubscriptionSeeds);

  await ensureSeedRecords('subscription-logs', [
    {
      subscription_id: seedReferences['subscription-demo'] || seedReferences['user-demo'],
      action: 'renewal',
      status: 'success',
      message: 'Subscription renewed automatically',
      logged_at: new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    }
  ]);

  await ensureSeedRecords('notification-templates', [
    {
      template_code: 'invoice_overdue',
      name: 'Invoice Overdue Reminder',
      channel: 'email',
      subject: 'Reminder: Invoice {{invoice_number}} is overdue',
      body: 'Dear {{customer_name}},\n\nOur records show invoice {{invoice_number}} is overdue. Please arrange payment at your earliest convenience.\n\nThank you.'
    },
    {
      template_code: 'payment_received',
      name: 'Payment Received Confirmation',
      channel: 'email',
      subject: 'Payment received - {{payment_number}}',
      body: 'Hi {{customer_name}},\n\nThis is to confirm we received payment {{payment_number}} for {{amount}}. Thank you for your business.'
    }
  ]);

  await ensureSeedRecords('license-keys', [
    {
      license_key: 'AGENTIC-ERP-DEMO-KEY',
      status: 'active',
      issued_to: 'Demo User',
      issued_at: new Date(now.getFullYear(), now.getMonth() - 3, 5).toISOString(),
      expires_at: new Date(now.getFullYear(), now.getMonth() + 9, 5).toISOString()
    }
  ]);
};

const startServer = async () => {
  try {
    await connectToDatabase();
    await ensureIndexes();
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`API server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start API server', error);
    process.exit(1);
  }
};

startServer();

const shutdown = async () => {
  await mongoClient.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
