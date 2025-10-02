const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Проверка установки Tauri...\n');

// Проверяем наличие файлов
const requiredFiles = [
  'src-tauri/Cargo.toml',
  'src-tauri/tauri.conf.json',
  'src-tauri/src/main.rs',
  'src-tauri/icons/32x32.png',
  'src-tauri/icons/128x128.png',
  'src-tauri/icons/icon.ico'
];

console.log('📁 Проверка файлов:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// Проверяем зависимости
console.log('\n📦 Проверка зависимостей:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const hasTauriCli = packageJson.devDependencies && packageJson.devDependencies['@tauri-apps/cli'];
  const hasTauriApi = packageJson.devDependencies && packageJson.devDependencies['@tauri-apps/api'];
  
  console.log(`  ${hasTauriCli ? '✅' : '❌'} @tauri-apps/cli`);
  console.log(`  ${hasTauriApi ? '✅' : '❌'} @tauri-apps/api`);
} catch (error) {
  console.log('  ❌ Ошибка чтения package.json');
}

// Проверяем скрипты
console.log('\n🔧 Проверка скриптов:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const scripts = packageJson.scripts || {};
  
  const requiredScripts = ['tauri:dev', 'tauri:build', 'generate-icons'];
  requiredScripts.forEach(script => {
    const exists = scripts[script];
    console.log(`  ${exists ? '✅' : '❌'} ${script}`);
  });
} catch (error) {
  console.log('  ❌ Ошибка чтения package.json');
}

// Проверяем Rust
console.log('\n🦀 Проверка Rust:');
try {
  execSync('rustc --version', { stdio: 'pipe' });
  console.log('  ✅ Rust установлен');
} catch (error) {
  console.log('  ❌ Rust не найден - установите через: winget install Rustlang.Rust.MSVC');
}

console.log('\n🎉 Проверка завершена!');
console.log('\n📖 Следующие шаги:');
console.log('1. Перезапустите терминал (если Rust не найден)');
console.log('2. Запустите: npm run tauri:dev');
console.log('3. Для сборки exe: npm run tauri:build');
