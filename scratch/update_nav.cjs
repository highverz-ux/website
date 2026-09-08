const fs = require('fs');
const files = [
  'index.html',
  'work.html',
  'team.html',
  'creator-niv0ne.html',
  'creator-umarpnj.html'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/(<li><a href="\/team\.html"[^>]*>Team<\/a><\/li>)/g, '$1\n            <li><a href="/why-us.html" class="nav-link" data-cursor="WHY US">Why Us</a></li>');
  fs.writeFileSync(file, content);
});
console.log('Navigation links updated');
