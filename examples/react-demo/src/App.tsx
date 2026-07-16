import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  // ── 页面加载时输出一组带类型前缀的日志 ──────────────────────
  // 打开 DevTools → Console 即能看到效果

  // 类型前缀测试
  console.log('[info] 用户已登录');
  console.log('[warn] 密码即将过期，请尽快修改');
  console.log('[error] 服务器无响应 (code: 500)');
  console.log('[success] 数据加载完成，共 128 条记录');

  // 无类型前缀 — 使用默认样式
  console.log('普通日志，无类型标签');

  // 未在 typeStyles 中定义的类型 — 回退到默认样式
  console.log('[debug] 这是一条调试日志，未在配置中定义 debug 样式');

  // 非字符串第一个参数 — 也会使用默认样式
  console.log({ page: 'home', loaded: true });

  // 带附加参数的调用
  console.log('[info] 渲染组件', { component: 'App', time: Date.now() });

  // 仅类型标签，无后续消息正文
  console.log('[info]');

  const handleClick = () => {
    const next = count + 1;
    setCount(next);
    console.log('[info] 按钮被点击，新计数 =', next);
  };

  const handleMultiLog = () => {
    console.log('[success] 批量操作完成');
    console.log('[warn] 部分资源未释放');
    console.log('[error] 连接超时，已重试 3 次');
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 32 }}>
      <h1>🎨 Vite Console Plugin — Dynamic Styles Demo</h1>
      <p>
        Open <strong>DevTools → Console</strong> (F12) to see the styled logs.
      </p>

      <div style={{ marginTop: 24 }}>
        <button
          onClick={handleClick}
          style={{
            padding: '10px 20px',
            fontSize: 16,
            cursor: 'pointer',
            marginRight: 12,
          }}
        >
          Click me (count: {count})
        </button>
        <button
          onClick={handleMultiLog}
          style={{
            padding: '10px 20px',
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          Multi-type log burst
        </button>
      </div>

      <div style={{ marginTop: 24, color: '#666', lineHeight: 1.8 }}>
        <p><strong>Plugin config:</strong></p>
        <ul>
          <li>Global prefix: <code>🎯</code> (rendered with default gray style)</li>
          <li><code>[info]</code> → blue badge</li>
          <li><code>[warn]</code> → yellow badge with border</li>
          <li><code>[error]</code> → red badge, bold</li>
          <li><code>[success]</code> → green badge</li>
          <li>Unrecognised / no prefix → default gray style</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
