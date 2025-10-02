# NIMeet Desktop App (Tauri)

Этот проект настроен для сборки десктопного приложения с помощью Tauri.

## Что уже настроено:

✅ **Tauri CLI** установлен  
✅ **Конфигурация** создана  
✅ **Иконки** сгенерированы  
✅ **Скрипты сборки** добавлены  

## Как собрать приложение:

### 1. Убедитесь, что Rust установлен
```bash
rustc --version
```

Если Rust не установлен, установите его:
```bash
winget install Rustlang.Rust.MSVC
```

### 2. Перезапустите терминал
После установки Rust перезапустите PowerShell или Command Prompt.

### 3. Соберите приложение

#### Для разработки (dev режим):
```bash
npm run tauri:dev
```

#### Для продакшена (создание exe файла):
```bash
npm run tauri:build
```

## Структура проекта:

```
frontend/
├── src-tauri/           # Tauri конфигурация
│   ├── Cargo.toml       # Rust зависимости
│   ├── tauri.conf.json  # Конфигурация Tauri
│   ├── build.rs         # Rust build скрипт
│   ├── src/
│   │   └── main.rs      # Rust код
│   └── icons/           # Иконки приложения
├── src/                 # React код
├── package.json         # Node.js зависимости
└── generate-icons.js    # Скрипт генерации иконок
```

## Особенности конфигурации:

- **Размер окна**: 1200x800 (минимум 800x600)
- **Иконки**: Автоматически генерируются из SVG
- **Права доступа**: Настроены для видеозвонков
- **Порт разработки**: 7677 (как в Docker)

## Команды:

- `npm run dev` - Запуск React dev сервера
- `npm run tauri:dev` - Запуск Tauri в dev режиме
- `npm run tauri:build` - Сборка exe файла
- `npm run generate-icons` - Генерация иконок

## Результат сборки:

После `npm run tauri:build` exe файл будет в папке:
`frontend/src-tauri/target/release/bundle/msi/`

## Возможные проблемы:

1. **Rust не найден** - перезапустите терминал
2. **Порт занят** - убедитесь, что Docker не запущен
3. **Ошибки сборки** - проверьте логи в консоли
4. **link.exe not found** - установите Visual Studio Build Tools с C++ компонентами:
   ```powershell
   # Скачать установщик
   Invoke-WebRequest -Uri "https://aka.ms/vs/17/release/vs_buildtools.exe" -OutFile "$env:TEMP\vs_buildtools.exe"
   
   # Установить с C++ компонентами
   Start-Process -FilePath "$env:TEMP\vs_buildtools.exe" -ArgumentList "--wait", "--add", "Microsoft.VisualStudio.Workload.VCTools", "--includeRecommended", "--quiet" -Wait
   ```
5. **Ошибка в build.rs** - убедитесь, что файл содержит правильный Rust код:
   ```rust
   fn main() {
       tauri_build::build()
   }
   ```
6. **Ошибка с icon.ico** - перегенерируйте иконки правильным способом:
   ```bash
   npm run generate-icons
   ```
7. **API URL ошибки** - в десктопном приложении автоматически используется `https://meet.nicorp.tech`

## Следующие шаги:

1. Перезапустите терминал
2. Запустите `npm run tauri:dev` для тестирования
3. Запустите `npm run tauri:build` для создания exe файла
