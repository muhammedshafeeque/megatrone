import { connectToAi } from './connectivity.js';
import connectDB from '../../config/db.js';
import { collections } from '../../constants/Constants.js';
import { terminal } from '../../terminal.js';
// Ensure schemas are imported so arango-typed registers models/features
import '../../schema/targetSchema.js';
import '../../schema/scanShema.js';
import '../../schema/toolsSchema.js';

// -------- Memory (DB-backed context for chats) --------
const MEMORY_COLLECTION = 'memory_messages';

const ensureMemoryCollection = async () => {
  const db = await connectDB();
  // Create collection if it doesn't exist
  await db.query(
    `LET c = DOCUMENT(@cn)
     RETURN 1`,
    { cn: MEMORY_COLLECTION }
  ).catch(async () => {
    await db.query(`CREATE COLLECTION ${MEMORY_COLLECTION}`);
  });
};

export const saveMemoryMessage = async ({ sessionId, role, content }) => {
  if (!sessionId || !role || !content) return;
  const db = await connectDB();
  await ensureMemoryCollection();
  await db.query(
    `INSERT { sessionId: @sessionId, role: @role, content: @content, createdAt: DATE_NOW() } IN ${MEMORY_COLLECTION}`,
    { sessionId, role, content }
  );
};

export const loadMemoryMessages = async ({ sessionId, limit = 20 }) => {
  if (!sessionId) return [];
  const db = await connectDB();
  await ensureMemoryCollection();
  const cursor = await db.query(
    `FOR m IN ${MEMORY_COLLECTION}
       FILTER m.sessionId == @sessionId
       SORT m.createdAt ASC
       LIMIT @limit
       RETURN m`,
    { sessionId, limit }
  );
  const items = await cursor.all();
  return items.map((m) => ({ role: m.role, content: m.content }));
};

// Simple chat completion with Mistral
export const aiChat = async (prompt, { model = 'mistral-small-latest', system = null } = {}) => {
  const client = connectToAi();
  const messages = [];
  if (system) {
    messages.push({ role: 'system', content: system });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await client.chat.complete({
    model,
    messages,
  });

  const choice = response?.choices?.[0]?.message;
  return {
    role: choice?.role || 'assistant',
    content: choice?.content || '',
    raw: response,
  };
};

// Chat with DB memory (LangChain-style context)
export const aiChatWithMemory = async (
  prompt,
  { sessionId, model = 'mistral-small-latest', system = null, maxHistory = 20 } = {}
) => {
  const client = connectToAi();

  const history = sessionId ? await loadMemoryMessages({ sessionId, limit: maxHistory }) : [];
  const messages = [];
  if (system) {
    messages.push({ role: 'system', content: system });
  }
  messages.push(...history);
  messages.push({ role: 'user', content: prompt });

  const response = await client.chat.complete({
    model,
    messages,
  });

  const choice = response?.choices?.[0]?.message;
  const assistantMessage = choice?.content || '';

  if (sessionId) {
    await saveMemoryMessage({ sessionId, role: 'user', content: prompt });
    await saveMemoryMessage({ sessionId, role: 'assistant', content: assistantMessage });
  }

  return {
    role: choice?.role || 'assistant',
    content: assistantMessage,
    raw: response,
  };
};

// Embeddings helper (batch-friendly)
export const aiEmbed = async (inputs, { model = 'mistral-embed' } = {}) => {
  const client = connectToAi();
  const texts = Array.isArray(inputs) ? inputs : [inputs];
  const { data } = await client.embeddings.create({
    model,
    input: texts,
  });
  return data.map((d) => d.embedding);
};

// 1) Use the Tool (MCP-ish orchestration via terminal)
export const useTheTool = async ({ command, colorize = true } = {}) => {
  if (!command || !command.trim()) {
    throw new Error('useTheTool: command is required');
  }
  const logs = await terminal(command, { colorize });
  return logs;
};

// 2) Search on DB (RAG over Arango test data)
export const searchOnDb = async ({ queryText, limit = 10 } = {}) => {
  if (!queryText || !queryText.trim()) {
    throw new Error('searchOnDb: queryText is required');
  }
  const db = await connectDB();
  const aql = `
    LET q = @q
    LET scans = (
      FOR s IN ${collections.SCANS}
        FILTER LIKE(LOWER(s.result), LOWER(q), true) || LIKE(LOWER(s.interestingAnalysis), LOWER(q), true)
        LIMIT @limit
        RETURN s
    )
    LET targets = (
      FOR t IN ${collections.TARGET}
        FILTER LIKE(LOWER(t.ip), LOWER(q), true) || (
          LENGTH(t.services) > 0 && SOME svc IN t.services SATISFIES LIKE(LOWER(svc), LOWER(q), true) END
        )
        LIMIT @limit
        RETURN t
    )
    RETURN { scans, targets }
  `;
  const cursor = await db.query(aql, { q: queryText, limit });
  const [{ scans = [], targets = [] } = {}] = await cursor.all();

  const context = [
    ...targets.map((t) => `Target ${t._key || t.ip}: ip=${t.ip} ports=${(t.ports||[]).join(',')} services=${(t.services||[]).join(',')}`),
    ...scans.map((s) => `Scan ${s._key || s.command}: tool=${s.tool} target=${s.target} summary=${(s.interestingAnalysis||'').slice(0,200)}`)
  ].join('\n');

  return { scans, targets, context };
};

// 3) Analyze the test results (RAG)
export const analyzeTestResults = async ({ question, context }) => {
  const system = 'You are a cybersecurity analyst. Use the provided context to answer precisely. If unsure, say you are unsure.';
  const prompt = `Context:\n${context}\n\nQuestion: ${question}\nAnswer:`;
  const response = await aiChat(prompt, { system });
  return response.content;
};

// Format data (deterministic structuring)
export const formatData = ({ scans = [], targets = [], analysis = '' } = {}) => {
  return {
    summary: {
      numTargets: targets.length,
      numScans: scans.length,
    },
    targets: targets.map((t) => ({
      id: t._key || null,
      ip: t.ip,
      ports: t.ports || [],
      services: t.services || [],
      lastScan: t.lastScan || null,
      createdAt: t.createdAt || null,
      updatedAt: t.updatedAt || null,
    })),
    scans: scans.map((s) => ({
      id: s._key || null,
      target: s.target,
      tool: s.tool,
      command: s.command,
      resultPreview: (s.result || '').slice(0, 500),
      interestingAnalysis: s.interestingAnalysis || '',
      createdAt: s.createdAt || null,
      updatedAt: s.updatedAt || null,
    })),
    analysis,
  };
};

// Connect with nodes (lightweight relationship discovery)
export const connectWithNodes = async ({ ip, limit = 10 } = {}) => {
  if (!ip) {
    throw new Error('connectWithNodes: ip is required');
  }
  const db = await connectDB();
  const aql = `
    LET ip = @ip
    LET t = FIRST(FOR v IN ${collections.TARGET} FILTER v.ip == ip RETURN v)
    LET scans = (
      FOR s IN ${collections.SCANS}
        FILTER s.target == t.ip
        LIMIT @limit
        RETURN s
    )
    RETURN { target: t, scans }
  `;
  const cursor = await db.query(aql, { ip, limit });
  const [{ target = null, scans = [] } = {}] = await cursor.all();

  return {
    nodes: [
      target ? { type: 'target', id: target._key || target.ip, label: target.ip } : null,
      ...scans.map((s) => ({ type: 'scan', id: s._key || s.command, label: `${s.tool}:${(s.command||'').slice(0,30)}` }))
    ].filter(Boolean),
    edges: scans
      .filter(Boolean)
      .map((s) => ({ from: target?._key || target?.ip || 'target', to: s._key || s.command, type: 'HAS_SCAN' })),
  };
};

// 4) Analysis the test result and returning interested values as JSON
export const analysisTestRsultAndRetuningInterestedValuesAsJson = async ({ testResult }) => {
  const system = 'You are a cybersecurity analyst. Use the provided context to answer precisely. If unsure, say you are unsure.';
  const prompt = `Context:\n${testResult}\n\nReturn the interesting values  or information as a JSON object. eg:{ip:192.168.1.1, ports:[80,443], services:[http,https], os:Linux, version:1.0.0, etc.}`;
  const response = await aiChat(prompt, { system });
  return response.content;
};