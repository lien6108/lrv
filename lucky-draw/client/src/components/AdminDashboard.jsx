import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../config';

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  const [pools, setPools] = useState([]);
  const [users, setUsers] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [results, setResults] = useState([]);

  // Form states
  const [newPool, setNewPool] = useState('');
  const [newUser, setNewUser] = useState({ name: '', order_index: '', prize_pool_id: '' });
  const [newPrize, setNewPrize] = useState({ name: '', quantity: '', prize_pool_id: '', image_url: '' });

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const socket = io(API_URL);
      socket.on('state_update', fetchData);
      socket.on('draw_event', fetchData);

      return () => {
        socket.off('state_update');
        socket.off('draw_event');
        socket.disconnect();
      };
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    const urls = ['/api/prize-pools', '/api/users', '/api/prizes', '/api/results'];
    try {
      const [pRes, uRes, prRes, rRes] = await Promise.all(urls.map(url => fetch(`${API_URL}${url}`)));
      setPools(await pRes.json());
      setUsers(await uRes.json());
      setPrizes(await prRes.json());
      setResults(await rRes.json());
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') { // Simple hardcoded password
      setIsAuthenticated(true);
    } else {
      alert('密碼錯誤！');
    }
  };

  const handleAddPool = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/api/prize-pools`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newPool })
    });
    setNewPool('');
    fetchData();
  };

  const nextOrderIndex = users.length > 0 ? Math.max(...users.map(u => u.order_index)) + 1 : 1;

  const handleAddUser = async (e) => {
    e.preventDefault();
    const orderToUse = nextOrderIndex;

    if (users.some(u => u.order_index === orderToUse)) {
      alert(`防呆提示：抽籤順序「${orderToUse}」已被使用，請選擇其他順序！`);
      return;
    }

    const res = await fetch(`${API_URL}/api/users`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newUser, order_index: orderToUse })
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || '新增失敗');
      return;
    }

    setNewUser({ name: '', order_index: '', prize_pool_id: '' });
    fetchData();
  };

  const handleAddPrize = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/api/prizes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPrize)
    });
    setNewPrize({ name: '', quantity: '', prize_pool_id: '', image_url: '' });
    fetchData();
  };

  const deleteUser = async (id) => {
    if (confirm('確定要刪除這位使用者嗎？')) {
      await fetch(`${API_URL}/api/users/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const clearUsers = async () => {
    if (confirm('確定要清空所有參與者嗎？這將無法復原。')) {
      await fetch(`${API_URL}/api/users/all`, { method: 'DELETE' });
      fetchData();
    }
  };

  const deletePrize = async (id) => {
    if (confirm('確定要刪除這項獎品嗎？')) {
      await fetch(`${API_URL}/api/prizes/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const resetSystem = async () => {
    if (confirm('警告：這將清空所有抽獎紀錄並重置獎品數量。確定執行？')) {
      try {
        const res = await fetch(`${API_URL}/api/state/reset`, { method: 'POST' });
        if (res.ok) {
          alert('清空完成！');
          fetchData();
        } else {
          alert('重設失敗，請檢查網路連線。');
        }
      } catch (err) {
        alert('連線失敗。');
      }
    }
  };

  const exportCSV = () => {
    // UTF-8 BOM helps Excel recognize the encoding properly
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "時間,得獎者,抽中獎品\n";
    results.forEach(r => {
      let row = `"${new Date(r.timestamp).toLocaleString()}","${r.user_name}","${r.prize_name}"`;
      csvContent += row + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "draw_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated) {
    return (
      <div className="glass-panel" style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
        <h2>管理員登入</h2>
        <p className="mb-4 text-sm text-secondary">預設密碼為 <strong>admin123</strong></p>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="請輸入後台密碼"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit" style={{ width: '100%' }}>登入</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

      {/* 側邊導覽列 */}
      <nav className="glass-panel" style={{ position: 'sticky', top: '2rem', minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ marginBottom: '0.5rem', color: 'var(--primary-color)' }}>選單</h3>
        <a href="#pools" style={{ color: 'var(--text-primary)', textDecoration: 'none', padding: '0.5rem', borderRadius: '8px' }} onMouseOver={e => e.target.style.background='rgba(255,255,255,0.1)'} onMouseOut={e => e.target.style.background='transparent'}>🎁 1. 獎品池管理</a>
        <a href="#users" style={{ color: 'var(--text-primary)', textDecoration: 'none', padding: '0.5rem', borderRadius: '8px' }} onMouseOver={e => e.target.style.background='rgba(255,255,255,0.1)'} onMouseOut={e => e.target.style.background='transparent'}>👥 2. 參與者順序</a>
        <a href="#prizes" style={{ color: 'var(--text-primary)', textDecoration: 'none', padding: '0.5rem', borderRadius: '8px' }} onMouseOver={e => e.target.style.background='rgba(255,255,255,0.1)'} onMouseOut={e => e.target.style.background='transparent'}>🏆 3. 獎品管理</a>
        <a href="#results" style={{ color: 'var(--text-primary)', textDecoration: 'none', padding: '0.5rem', borderRadius: '8px' }} onMouseOver={e => e.target.style.background='rgba(255,255,255,0.1)'} onMouseOut={e => e.target.style.background='transparent'}>📊 4. 抽獎結果</a>
        <hr style={{ borderColor: 'var(--glass-border)', margin: '1rem 0' }} />
        <button className="danger" onClick={resetSystem} style={{ width: '100%', fontSize: '0.9rem' }}>一鍵重設資料</button>
      </nav>

      {/* 主要內容區 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <h1>管理員後台</h1>
        </div>

        {/* POOLS */}
        <div id="pools" className="glass-panel" style={{ scrollMarginTop: '2rem' }}>
          <h3>1. 獎品池管理</h3>
          <form onSubmit={handleAddPool} className="flex gap-4 mb-4">
            <input placeholder="輸入新獎品池名稱" value={newPool} onChange={e => setNewPool(e.target.value)} required />
            <button type="submit">新增</button>
          </form>
          <div className="table-responsive">
            <table>
              <thead><tr><th>編號</th><th>獎品池名稱</th></tr></thead>
              <tbody>
                {pools.length === 0 && <tr><td colSpan="2">尚未新增獎品池。</td></tr>}
                {pools.map(p => <tr key={p.id}><td>{p.id}</td><td>{p.name}</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>

        {/* USERS */}
        <div id="users" className="glass-panel" style={{ scrollMarginTop: '2rem' }}>
          <div className="flex justify-between items-center mb-4" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0 }}>2. 參與者管理 (抽籤順序)</h3>
            {users.length > 0 && <button type="button" className="danger" onClick={clearUsers} style={{ padding: '0.4rem 1rem' }}>清空抽獎者</button>}
          </div>
          <form onSubmit={handleAddUser}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div style={{ flex: 1, minWidth: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem 1rem', marginBottom: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', boxSizing: 'border-box' }}>
                順序：<strong style={{ fontSize: '1.2rem', color: 'var(--primary-color)', marginLeft: '0.5rem' }}>{nextOrderIndex}</strong>
              </div>
              <input style={{ flex: 1, minWidth: '150px' }} placeholder="參與者名稱 (例如: 王大明)" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} required />
              <select style={{ flex: 1, minWidth: '150px' }} value={newUser.prize_pool_id} onChange={e => setNewUser({ ...newUser, prize_pool_id: e.target.value })} required>
                <option value="">-- 指派預設獎品池 --</option>
                {pools.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <button type="submit" className="mb-4">新增參與者</button>
          </form>
          <div className="table-responsive">
            <table>
              <thead><tr><th>順序</th><th>名稱</th><th>專屬獎品池</th><th>狀態</th><th>操作</th></tr></thead>
              <tbody>
                {users.length === 0 && <tr><td colSpan="5">尚未新增參與者。</td></tr>}
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.order_index}</td>
                    <td>{u.name}</td>
                    <td>{u.pool_name}</td>
                    <td>{u.has_drawn ? '✅ 已抽' : '⏳ 等待中'}</td>
                    <td><button className="danger" style={{ padding: '0.2rem 0.5rem' }} onClick={() => deleteUser(u.id)}>刪除</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PRIZES */}
        <div id="prizes" className="glass-panel" style={{ scrollMarginTop: '2rem' }}>
          <h3>3. 獎品管理</h3>
          <form onSubmit={handleAddPrize}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <input style={{ flex: 1, minWidth: '150px' }} placeholder="獎品名稱" value={newPrize.name} onChange={e => setNewPrize({ ...newPrize, name: e.target.value })} required />
              <input style={{ flex: 1, minWidth: '150px' }} type="number" placeholder="數量" value={newPrize.quantity} onChange={e => setNewPrize({ ...newPrize, quantity: e.target.value })} required />
              <select style={{ flex: 1, minWidth: '150px' }} value={newPrize.prize_pool_id} onChange={e => setNewPrize({ ...newPrize, prize_pool_id: e.target.value })} required>
                <option value="">-- 指派至指定獎品池 --</option>
                {pools.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <input placeholder="圖片網址 (選填)" value={newPrize.image_url} onChange={e => setNewPrize({ ...newPrize, image_url: e.target.value })} />
            <button type="submit" className="mb-4 mt-4">新增獎品</button>
          </form>
          <div className="table-responsive">
            <table>
              <thead><tr><th>獎品名稱</th><th>所屬池</th><th>剩餘/總數</th><th>操作</th></tr></thead>
              <tbody>
                {prizes.length === 0 && <tr><td colSpan="4">尚未新增獎品。</td></tr>}
                {prizes.map(p => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.pool_name}</td>
                    <td>{p.remaining}/{p.quantity}</td>
                    <td><button className="danger" style={{ padding: '0.2rem 0.5rem' }} onClick={() => deletePrize(p.id)}>刪除</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RESULTS */}
        <div id="results" className="glass-panel" style={{ scrollMarginTop: '2rem' }}>
          <div className="flex justify-between items-center mb-4" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3>最後得獎結果清單</h3>
            {results.length > 0 && <button onClick={exportCSV}>匯出為 CSV 檔</button>}
          </div>
          <div className="table-responsive">
            <table>
              <thead><tr><th>抽取時間</th><th>得獎者</th><th>獲得獎項</th></tr></thead>
              <tbody>
                {results.length === 0 ? <tr><td colSpan="3">目前尚未產生任何抽獎結果。</td></tr> : null}
                {results.map(r => (
                  <tr key={r.id}>
                    <td>{new Date(r.timestamp).toLocaleString()}</td>
                    <td>{r.user_name}</td>
                    <td><strong style={{ color: 'var(--primary-color)' }}>{r.prize_name}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
