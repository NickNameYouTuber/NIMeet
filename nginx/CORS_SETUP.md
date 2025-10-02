# Обновление конфигурации nginx для поддержки CORS

## Шаги для применения новой конфигурации:

1. **Скопируйте новый файл конфигурации на сервер:**
   ```bash
   sudo cp nginx/meet.nicorp.tech.conf /etc/nginx/sites-available/meet.nicorp.tech
   ```
   
   **Или отредактируйте существующий файл:**
   ```bash
   sudo nano /etc/nginx/sites-available/meet.nicorp.tech
   ```

2. **Проверьте конфигурацию nginx:**
   ```bash
   sudo nginx -t
   ```

3. **Перезагрузите nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

4. **Проверьте статус nginx:**
   ```bash
   sudo systemctl status nginx
   ```

5. **Перезапустите бэкенд для применения новых CORS настроек:**
   ```bash
   # Если используете PM2
   pm2 restart backend
   
   # Или если запускаете напрямую
   sudo systemctl restart your-backend-service
   ```

## Что изменилось:

- ✅ **ИСПРАВЛЕНО**: Убраны дублирующиеся CORS заголовки из nginx
- ✅ **ИСПРАВЛЕНО**: CORS теперь обрабатывается только в бэкенде (Express + Socket.IO)
- ✅ **ИСПРАВЛЕНО**: Добавлены все необходимые origin в бэкенд:
  - `http://localhost:7677` (локальная разработка)
  - `https://meet.nicorp.tech` (продакшн HTTPS)
  - `http://meet.nicorp.tech` (продакшн HTTP)
- ✅ nginx теперь только проксирует запросы без добавления CORS заголовков

## Тестирование CORS:

После применения конфигурации, Tauri приложение должно успешно подключаться к `https://meet.nicorp.tech` без ошибок CORS.

## Если проблемы остаются:

1. Проверьте логи nginx:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   sudo tail -f /var/log/nginx/access.log
   ```

2. Проверьте, что сертификаты SSL действительны:
   ```bash
   sudo certbot certificates
   ```

3. Убедитесь, что бэкенд и фронтенд запущены на правильных портах:
   - Бэкенд: порт 7676
   - Фронтенд: порт 7677
