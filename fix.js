const fs = require('fs');

const doReplaceAll = (file, from, to) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.split(from).join(to);
  fs.writeFileSync(file, content);
};

doReplaceAll('src/client/index.html', 'color: #6B7280;', 'color: var(--text-secondary);');
doReplaceAll('src/client/index.html', 'color: #111827;', 'color: var(--text-primary);');

doReplaceAll('src/client/main.js', 'background:#F3F4F6;color:#111827;', 'background:var(--sidebar-bg);color:var(--text-primary);');

doReplaceAll('src/client/views/dashboard.js', 'color: #111827; margin-bottom: 16px;', 'color: var(--text-primary); margin-bottom: 16px;');
doReplaceAll('src/client/views/dashboard.js', 'color: #6B7280; margin-top: 4px;', 'color: var(--text-secondary); margin-top: 4px;');
doReplaceAll('src/client/views/dashboard.js', 'color: #6B7280;"', 'color: var(--text-secondary);"');
doReplaceAll('src/client/views/dashboard.js', 'color: #6B7280;', 'color: var(--text-secondary);');
doReplaceAll('src/client/views/dashboard.js', 'background: #F3F4F6; color: #111827;', 'background: var(--sidebar-bg); color: var(--text-primary);');
doReplaceAll('src/client/views/dashboard.js', 'color: #111827;">', 'color: var(--text-primary);">');

doReplaceAll('src/client/views/tasks.js', 'color: #111827; margin-bottom: 8px;', 'color: var(--text-primary); margin-bottom: 8px;');
doReplaceAll('src/client/views/tasks.js', 'color: #6B7280; line-height: 1.5;', 'color: var(--text-secondary); line-height: 1.5;');
doReplaceAll('src/client/views/tasks.js', 'color: #6B7280; margin-bottom: 4px;', 'color: var(--text-secondary); margin-bottom: 4px;');
doReplaceAll('src/client/views/tasks.js', 'color: #111827;">General', 'color: var(--text-primary);">General');
doReplaceAll('src/client/views/tasks.js', 'color: #111827;">Today', 'color: var(--text-primary);">Today');
doReplaceAll('src/client/views/tasks.js', 'background: #E5E7EB; color: #111827;', 'background: var(--sidebar-bg); color: var(--text-primary);');
doReplaceAll('src/client/views/tasks.js', 'color: #6B7280; font-weight: 600; letter-spacing: 0.05em;', 'color: var(--text-secondary); font-weight: 600; letter-spacing: 0.05em;');
doReplaceAll('src/client/views/tasks.js', 'color: #111827;">${escapeHTML(assigneeName)}', 'color: var(--text-primary);">${escapeHTML(assigneeName)}');
doReplaceAll('src/client/views/tasks.js', 'color: #111827; margin-bottom: 16px;">Subtasks', 'color: var(--text-primary); margin-bottom: 16px;">Subtasks');
doReplaceAll('src/client/views/tasks.js', "color: ${isDone ? '#9CA3AF' : '#111827'};", "color: ${isDone ? '#9CA3AF' : 'var(--text-primary)'};");
doReplaceAll('src/client/views/tasks.js', 'color: #6B7280;">No subtasks', 'color: var(--text-secondary);">No subtasks');
doReplaceAll('src/client/views/tasks.js', 'background: #F3F4F6; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #6B7280;', 'background: var(--sidebar-bg); border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary);');

doReplaceAll('src/client/views/task-create-modal.js', 'color: #111827;">New Task', 'color: var(--text-primary);">New Task');
doReplaceAll('src/client/views/task-create-modal.js', 'background: #F3F4F6; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #6B7280;', 'background: var(--sidebar-bg); border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary);');
doReplaceAll('src/client/views/task-create-modal.js', 'color: #6B7280; letter-spacing: 0.05em;', 'color: var(--text-secondary); letter-spacing: 0.05em;');
doReplaceAll('src/client/views/task-create-modal.js', 'background-color: #F3F4F6; color: #111827;', 'background-color: var(--sidebar-bg); color: var(--text-primary);');
doReplaceAll('src/client/views/task-create-modal.js', 'background: #F3F4F6; color: #111827; display: flex;', 'background: var(--sidebar-bg); color: var(--text-primary); display: flex;');
doReplaceAll('src/client/views/task-create-modal.js', 'color: #6B7280;">${escapeHTML(u.firstName)}', 'color: var(--text-secondary);">${escapeHTML(u.firstName)}');
doReplaceAll('src/client/views/task-create-modal.js', 'background: #F3F4F6; color: #6B7280;', 'background: var(--sidebar-bg); color: var(--text-secondary);');
doReplaceAll('src/client/views/task-create-modal.js', "o.style.color = '#6B7280';", "o.style.color = 'var(--text-secondary)';");
doReplaceAll('src/client/views/task-create-modal.js', "o.style.background = '#F3F4F6';", "o.style.background = 'var(--sidebar-bg)';");

console.log('Done!');
