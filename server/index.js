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
  const nowIso = new Date().toISOString();

  const existingUsers = await entities.countDocuments({ type: 'users' });
  if (existingUsers === 0) {
    const createdAt = new Date();
    await entities.insertOne({
      type: 'users',
      data: {
        email: 'demo@agenticerp.test',
        name: 'Demo User',
        created_date: nowIso,
        updated_date: nowIso
      },
      createdAt,
      updatedAt: createdAt
    });
  }

  const existingCompanyProfiles = await entities.countDocuments({ type: 'company-profiles' });
  if (existingCompanyProfiles === 0) {
    const createdAt = new Date();
    await entities.insertOne({
      type: 'company-profiles',
      data: {
        company_name: 'Agentic ERP Demo',
        currency: 'USD',
        created_by: 'demo@agenticerp.test',
        created_date: nowIso,
        updated_date: nowIso
      },
      createdAt,
      updatedAt: createdAt
    });
  }
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
