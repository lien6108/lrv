import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, runQuery, allQuery, getQuery } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../client/dist')));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3001;

// Initialize DB and start server
initDb().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => console.error("Database initialization failed:", err));

// State variables to track the current draw session
// In a production app, this might be persisted. For simplicity, we keep it in memory
let currentDrawOrderIndex = 1; 

// Broadcast current state to all clients
async function broadcastState() {
  try {
    const users = await allQuery('SELECT * FROM users ORDER BY order_index ASC');
    const currentUser = users.find(u => u.has_drawn === 0);
    
    // If no one is left to draw, currentUser is undefined
    const state = {
      currentUser: currentUser || null,
      allFinished: !currentUser
    };
    
    io.emit('state_update', state);
  } catch (err) {
    console.error("Error broadcasting state:", err);
  }
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send immediate state on connection
  broadcastState();

  socket.on('spin_started', (data) => {
    socket.broadcast.emit('spin_started', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// --- REST APIs for Admin ---

// GET state
app.get('/api/state', async (req, res) => {
  res.json({ currentDrawOrderIndex });
});

app.post('/api/state/reset', async (req, res) => {
  await runQuery('DELETE FROM users');
  await runQuery('UPDATE prizes SET remaining = quantity');
  await runQuery('DELETE FROM draw_results');
  broadcastState();
  res.json({ success: true });
});

// Prize Pools
app.get('/api/prize-pools', async (req, res) => {
  const pools = await allQuery('SELECT * FROM prize_pools');
  res.json(pools);
});
app.post('/api/prize-pools', async (req, res) => {
  const { name } = req.body;
  const result = await runQuery('INSERT INTO prize_pools (name) VALUES (?)', [name]);
  res.json({ id: result.lastID, name });
});

// Users
app.get('/api/users', async (req, res) => {
  const users = await allQuery(`
    SELECT u.*, p.name as pool_name 
    FROM users u 
    LEFT JOIN prize_pools p ON u.prize_pool_id = p.id 
    ORDER BY u.order_index ASC
  `);
  res.json(users);
});
app.post('/api/users', async (req, res) => {
  const { name, order_index, prize_pool_id } = req.body;
  
  const existing = await getQuery('SELECT * FROM users WHERE order_index = ?', [order_index]);
  if (existing) {
    return res.status(400).json({ error: '該抽籤順序已被使用' });
  }

  try {
    const result = await runQuery(
      'INSERT INTO users (name, order_index, prize_pool_id) VALUES (?, ?, ?)',
      [name, order_index, prize_pool_id]
    );
    broadcastState();
    res.json({ id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: '新增失敗，可能違反資料庫限制' });
  }
});
app.delete('/api/users/all', async (req, res) => {
  await runQuery('DELETE FROM users');
  broadcastState();
  res.json({ success: true });
});
app.delete('/api/users/:id', async (req, res) => {
  const user = await getQuery('SELECT order_index FROM users WHERE id = ?', [req.params.id]);
  if (user) {
    await runQuery('DELETE FROM users WHERE id = ?', [req.params.id]);
    await runQuery('UPDATE users SET order_index = order_index - 1 WHERE order_index > ?', [user.order_index]);
    broadcastState();
  }
  res.json({ success: true });
});

// Prizes
app.get('/api/prizes', async (req, res) => {
  const prizes = await allQuery(`
    SELECT p.*, pool.name as pool_name 
    FROM prizes p 
    LEFT JOIN prize_pools pool ON p.prize_pool_id = pool.id
  `);
  res.json(prizes);
});
app.post('/api/prizes', async (req, res) => {
  const { name, image_url, quantity, prize_pool_id } = req.body;
  const result = await runQuery(
    'INSERT INTO prizes (name, image_url, quantity, remaining, prize_pool_id) VALUES (?, ?, ?, ?, ?)',
    [name, image_url, quantity, quantity, prize_pool_id]
  );
  res.json({ id: result.lastID });
});
app.delete('/api/prizes/:id', async (req, res) => {
  await runQuery('DELETE FROM prizes WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});
app.put('/api/prizes/:id', async (req, res) => {
  const { quantity, remaining } = req.body;
  await runQuery('UPDATE prizes SET quantity = ?, remaining = ? WHERE id = ?', [quantity, remaining, req.params.id]);
  res.json({ success: true });
});

// Results
app.get('/api/results', async (req, res) => {
  const results = await allQuery(`
    SELECT r.id, u.name as user_name, p.name as prize_name, r.timestamp
    FROM draw_results r
    JOIN users u ON r.user_id = u.id
    JOIN prizes p ON r.prize_id = p.id
    ORDER BY r.timestamp DESC
  `);
  res.json(results);
});

// Catch-all route to serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// --- User Draw Action ---
app.post('/api/draw', async (req, res) => {
  const { user_id } = req.body;
  
  try {
    // 1. Verify user exists and is eligible
    const user = await getQuery('SELECT * FROM users WHERE id = ?', [user_id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.has_drawn === 1) return res.status(400).json({ error: 'User already drawn' });

    // Verify it's their turn
    const users = await allQuery('SELECT * FROM users ORDER BY order_index ASC');
    const currentUserToDraw = users.find(u => u.has_drawn === 0);
    if (!currentUserToDraw || currentUserToDraw.id !== user.id) {
      return res.status(403).json({ error: 'Not your turn' });
    }

    // 2. Get available prizes for this user's pool
    const availablePrizes = await allQuery(
      'SELECT * FROM prizes WHERE prize_pool_id = ? AND remaining > 0', 
      [user.prize_pool_id]
    );

    if (availablePrizes.length === 0) {
      // Mark user as drawn even though no prizes
      await runQuery('UPDATE users SET has_drawn = 1 WHERE id = ?', [user.id]);
      broadcastState();
      return res.status(400).json({ error: 'No prizes left in your pool' });
    }

    // 3. Random logic (simple random based on remaining count)
    // To make it weighted by 'remaining', we expand the array
    let pool = [];
    availablePrizes.forEach(p => {
      for(let i=0; i<p.remaining; i++) {
        pool.push(p);
      }
    });
    
    const randomIndex = Math.floor(Math.random() * pool.length);
    const wonPrize = pool[randomIndex];

    // 4. Update Database transactionally (simplified since sqlite doesn't force transactions trivially via our wrapper)
    await runQuery('UPDATE prizes SET remaining = remaining - 1 WHERE id = ?', [wonPrize.id]);
    await runQuery('INSERT INTO draw_results (user_id, prize_id) VALUES (?, ?)', [user.id, wonPrize.id]);
    await runQuery('UPDATE users SET has_drawn = 1 WHERE id = ?', [user.id]);

    // 5. Broadcast to everyone that the draw happened (triggers animation on frontend)
    // Delay broadcasting to give the frontend's spinner time to show suspense
    setTimeout(() => {
      io.emit('draw_event', { user, prize: wonPrize });
      broadcastState(); // Broadcast new state immediately after the result
    }, 3000); // 3 seconds spin delay

    res.json({ success: true, prize: wonPrize });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
