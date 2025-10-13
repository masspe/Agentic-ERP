import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
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

const mapRecordToEntity = (record) => {
  if (!record) return null;
  const payload = typeof record.data === 'object' && record.data !== null ? { ...record.data } : {};
  const createdAt = payload.created_date || record.createdAt?.toISOString();
  const updatedAt = payload.updated_date || record.updatedAt?.toISOString();

  return {
    id: record.id,
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

    const records = await prisma.entityRecord.findMany({
      where: { type },
      orderBy: { [field]: direction },
      skip: Number(offset) || 0,
      take: Math.min(Number(limit) || 100, 500)
    });

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

    const record = await prisma.entityRecord.findUnique({ where: { id: Number(id) } });
    if (!record || record.type !== type) {
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
    const now = new Date().toISOString();
    const data = {
      ...payload,
      created_date: payload.created_date || now,
      updated_date: payload.updated_date || now
    };

    const record = await prisma.entityRecord.create({
      data: {
        type,
        data
      }
    });

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

    const existing = await prisma.entityRecord.findUnique({ where: { id: Number(id) } });
    if (!existing || existing.type !== type) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    const payload = { ...req.body };
    delete payload.id;
    const now = new Date().toISOString();

    const record = await prisma.entityRecord.update({
      where: { id: existing.id },
      data: {
        data: {
          ...existing.data,
          ...payload,
          updated_date: now
        }
      }
    });

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

    const existing = await prisma.entityRecord.findUnique({ where: { id: Number(id) } });
    if (!existing || existing.type !== type) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    await prisma.entityRecord.delete({ where: { id: existing.id } });
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

    const records = await prisma.entityRecord.findMany({ where: { type } });
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
      const record = await prisma.entityRecord.findUnique({ where: { id: Number(id) } });
      if (record && record.type === 'users') {
        return mapRecordToEntity(record);
      }
    }

    const firstUser = await prisma.entityRecord.findFirst({
      where: { type: 'users' },
      orderBy: { createdAt: 'asc' }
    });

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
    const records = await prisma.entityRecord.findMany({ where: { type: 'users' } });
    res.json(records.map(mapRecordToEntity));
  } catch (error) {
    console.error('List users failed', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/users', async (req, res) => {
  try {
    const payload = { ...req.body };
    const now = new Date().toISOString();

    const record = await prisma.entityRecord.create({
      data: {
        type: 'users',
        data: {
          ...payload,
          created_date: payload.created_date || now,
          updated_date: payload.updated_date || now
        }
      }
    });

    res.status(201).json(mapRecordToEntity(record));
  } catch (error) {
    console.error('Create user failed', error);
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/auth/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.entityRecord.findUnique({ where: { id: Number(id) } });
    if (!existing || existing.type !== 'users') {
      return res.status(404).json({ error: 'User not found' });
    }

    const payload = { ...req.body };
    const now = new Date().toISOString();

    const record = await prisma.entityRecord.update({
      where: { id: existing.id },
      data: {
        data: {
          ...existing.data,
          ...payload,
          updated_date: now
        }
      }
    });

    res.json(mapRecordToEntity(record));
  } catch (error) {
    console.error('Update user failed', error);
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/auth/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.entityRecord.findUnique({ where: { id: Number(id) } });
    if (!existing || existing.type !== 'users') {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.entityRecord.delete({ where: { id: existing.id } });
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
    id: conversation.id,
    agent_name: conversation.agentName,
    metadata: conversation.metadata || null,
    created_at: conversation.createdAt?.toISOString?.() || null,
    updated_at: conversation.updatedAt?.toISOString?.() || null
  };

  if (includeMessages) {
    base.messages = (conversation.messages || []).map((message) => ({
      id: message.id,
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
    const conversations = await prisma.conversation.findMany({
      where: agentName ? { agentName } : undefined,
      orderBy: { updatedAt: 'desc' }
    });

    res.json(conversations.map((conversation) => formatConversation(conversation, false)));
  } catch (error) {
    console.error('List conversations failed', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await prisma.conversation.findUnique({
      where: { id: Number(id) },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(formatConversation(conversation, true));
  } catch (error) {
    console.error('Get conversation failed', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/conversations', async (req, res) => {
  try {
    const { agent_name: agentName = 'erp_assistant', metadata = {} } = req.body || {};

    const conversation = await prisma.conversation.create({
      data: {
        agentName,
        metadata
      },
      include: { messages: true }
    });

    res.status(201).json(formatConversation(conversation, true));
  } catch (error) {
    console.error('Create conversation failed', error);
    res.status(400).json({ error: error.message });
  }
});

const buildAssistantReply = (content) => {
  if (!content || typeof content !== 'string') {
    return 'Thanks for reaching out. How can I assist you today?';
  }

  return `I heard: "${content.slice(0, 200)}". I\'m a demo assistant, so please adapt this response as needed.`;
};

app.post('/api/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, content } = req.body || {};

    const conversation = await prisma.conversation.findUnique({ where: { id: Number(id) } });
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!role || !content) {
      return res.status(400).json({ error: 'role and content are required' });
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role,
        content
      }
    });

    // Naive assistant reply for demo purposes.
    if (role !== 'assistant') {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: buildAssistantReply(content)
        }
      });
    }

    const updated = await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });

    res.json(formatConversation(updated, true));
  } catch (error) {
    console.error('Add message failed', error);
    res.status(400).json({ error: error.message });
  }
});

// --- Utilities -----------------------------------------------------------

app.get('/api/health', async (_req, res) => {
  res.json({ status: 'ok' });
});

const seedDatabase = async () => {
  const existingUsers = await prisma.entityRecord.count({ where: { type: 'users' } });
  if (existingUsers === 0) {
    await prisma.entityRecord.create({
      data: {
        type: 'users',
        data: {
          email: 'demo@agenticerp.test',
          name: 'Demo User',
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString()
        }
      }
    });
  }

  const existingCompanyProfiles = await prisma.entityRecord.count({ where: { type: 'company-profiles' } });
  if (existingCompanyProfiles === 0) {
    await prisma.entityRecord.create({
      data: {
        type: 'company-profiles',
        data: {
          company_name: 'Agentic ERP Demo',
          currency: 'USD',
          created_by: 'demo@agenticerp.test',
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString()
        }
      }
    });
  }
};

seedDatabase()
  .catch((error) => {
    console.error('Database seed failed', error);
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`API server listening on http://localhost:${PORT}`);
    });
  });

const shutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
