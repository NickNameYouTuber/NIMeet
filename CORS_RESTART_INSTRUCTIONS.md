# Инструкция по перезапуску бэкенда для применения CORS настроек

## Проблема
CORS ошибки возникают потому, что бэкенд на сервере еще работает со старыми настройками.

## Решение

### 1. Подключитесь к серверу:
```bash
ssh your-server
```

### 2. Перейдите в папку проекта:
```bash
cd /path/to/your/backend
```

### 3. Обновите код:
```bash
git pull origin master
```

### 4. Перезапустите бэкенд:

**Если используете PM2:**
```bash
pm2 restart backend
# или
pm2 restart all
```

**Если используете systemd:**
```bash
sudo systemctl restart your-backend-service
```

**Если запускаете напрямую:**
```bash
# Остановите процесс (Ctrl+C)
# Затем запустите заново:
npm start
# или
node src/server.js
```

### 5. Проверьте статус:

**Для PM2:**
```bash
pm2 status
pm2 logs backend
```

**Для systemd:**
```bash
sudo systemctl status your-backend-service
sudo journalctl -u your-backend-service -f
```

### 6. Проверьте логи на ошибки:
```bash
# Если есть ошибки, проверьте логи
tail -f /var/log/your-app/error.log
```

## Что изменилось в CORS настройках:

- ✅ **ИСПРАВЛЕНО**: Заменен `Access-Control-Allow-Origin: *` на конкретный origin из запроса
- ✅ **ИСПРАВЛЕНО**: Теперь работает с `credentials: 'include'` без ошибок
- ✅ Добавлены все необходимые методы: GET, POST, PUT, DELETE, OPTIONS, PATCH
- ✅ Добавлены все необходимые заголовки
- ✅ `credentials: true` для работы с cookies
- ✅ Дополнительные CORS заголовки в каждом ответе
- ✅ Обновлены nginx настройки для использования `$http_origin`
- ✅ Добавлено логирование для отладки CORS запросов

## КРИТИЧЕСКИ ВАЖНО:
После перезапуска бэкенда и nginx CORS ошибки должны полностью исчезнуть!

**Нужно перезапустить:**
1. Бэкенд (для применения новых CORS настроек)
2. nginx (для применения обновленной конфигурации)
