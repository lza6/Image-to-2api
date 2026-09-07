// 临时清理脚本：删除 .benchmarks 下的中间产物（xml/txt/log/zip/json），
// 保留 e2e-*.png 与 resp-shots/ 子目录。基于 §A2 已确认无 CI/测试/fixture 引用。
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', '.benchmarks');
const keep = new Set(['e2e-desktop.png', 'e2e-mobile.png']);
let deleted = 0, kept = [];
for (const f of fs.readdirSync(dir)) {
  const full = path.join(dir, f);
  const st = fs.statSync(full);
  if (st.isFile()) {
    if (keep.has(f)) { kept.push(f); }
    else { fs.unlinkSync(full); deleted++; }
  }
}
console.log('deleted:', deleted);
console.log('kept files:', kept);
console.log('resp-shots:', fs.readdirSync(path.join(dir, 'resp-shots')));
