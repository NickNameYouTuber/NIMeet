# Docker Развертывание NIMeet

Полное руководство по запуску NIMeet через Docker Compose.

## Требования

- Docker 20.10+
- Docker Compose 2.0+

## Быстрый старт (Development)

### 1. Запуск всего проекта одной командой

```bash
docker-compose up
```

Или в фоновом режиме:
```bash
docker-compose up -d
```

### 2. Доступ к приложению

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017

### 3. Остановка

```bash
docker-compose down
```

Остановка с удалением volumes (БД будет очищена):
```bash
docker-compose down -v
```

## Детальные команды

### Сборка образов

```bash
docker-compose build
```

Пересборка без кеша:
```bash
docker-compose build --no-cache
```

### Просмотр логов

Все сервисы:
```bash
docker-compose logs -f
```

Конкретный сервис:
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Перезапуск сервисов

Все:
```bash
docker-compose restart
```

Конкретный сервис:
```bash
docker-compose restart backend
```

### Выполнение команд внутри контейнера

Backend:
```bash
docker-compose exec backend sh
```

Frontend:
```bash
docker-compose exec frontend sh
```

MongoDB:
```bash
docker-compose exec mongodb mongosh
```

### Просмотр статуса

```bash
docker-compose ps
```

## Production развертывание

### 1. Подготовка переменных окружения

Создайте файл `.env` из `.env.docker`:

```bash
cp .env.docker .env
```

Измените значения:
- `MONGO_ROOT_USERNAME` - имя администратора MongoDB
- `MONGO_ROOT_PASSWORD` - пароль администратора MongoDB
- `JWT_SECRET` - секретный ключ для JWT (минимум 32 символа)
- `CLIENT_URL` - URL вашего frontend в production
- `REACT_APP_API_URL` - URL вашего backend API
- `REACT_APP_SOCKET_URL` - URL вашего Socket.io сервера

### 2. Запуск production версии

```bash
docker-compose -f docker-compose.prod.yml --env-file .env up -d
```

### 3. Проверка статуса

```bash
docker-compose -f docker-compose.prod.yml ps
```

### 4. Просмотр логов

```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### 5. Остановка

```bash
docker-compose -f docker-compose.prod.yml down
```

## Структура Docker файлов

```
NIMeet/
├── docker-compose.yml          # Development конфигурация
├── docker-compose.prod.yml     # Production конфигурация
├── .env.docker                 # Пример переменных окружения
├── backend/
│   ├── Dockerfile              # Development образ
│   ├── Dockerfile.prod         # Production образ (multi-stage)
│   └── .dockerignore
├── frontend/
│   ├── Dockerfile              # Development образ
│   ├── Dockerfile.prod         # Production образ (nginx)
│   ├── nginx.conf             # Конфигурация nginx
│   └── .dockerignore
└── .dockerignore
```

## Development режим

### Особенности:

- **Hot Reload**: Изменения в коде автоматически применяются
- **Volumes**: Код монтируется из хоста в контейнер
- **Логи**: Подробные логи для отладки
- **MongoDB**: Без аутентификации для простоты

### Порты:

- Frontend: 3000
- Backend: 5000
- MongoDB: 27017

### Volumes:

- `mongodb_data`: Данные MongoDB (сохраняются между перезапусками)
- `./backend:/app`: Код backend (hot reload)
- `./frontend:/app`: Код frontend (hot reload)

## Production режим

### Особенности:

- **Multi-stage builds**: Оптимизированные образы
- **Nginx**: Статические файлы frontend через nginx
- **MongoDB Authentication**: Безопасное подключение
- **Node Production**: Без dev зависимостей
- **Gzip**: Сжатие статики
- **Health checks**: Проверка здоровья сервисов

### Порты:

- Frontend (nginx): 80
- Backend: 5000
- MongoDB: 27017 (только внутри сети)

### Оптимизации:

1. **Frontend**:
   - Build оптимизирован для production
   - Gzip сжатие
   - Кеширование статики
   - Proxy для API через nginx

2. **Backend**:
   - Только production зависимости
   - Multi-stage build
   - Минимальный образ alpine
   - Запуск от непривилегированного пользователя

3. **MongoDB**:
   - Persistent volume
   - Аутентификация включена
   - Изолированная сеть

## Управление данными

### Backup MongoDB

```bash
docker-compose exec mongodb mongodump --out /data/backup
docker cp nimeet-mongodb:/data/backup ./mongodb-backup
```

### Restore MongoDB

```bash
docker cp ./mongodb-backup nimeet-mongodb:/data/backup
docker-compose exec mongodb mongorestore /data/backup
```

### Очистка volumes

```bash
docker-compose down -v
```

⚠️ **Внимание**: Это удалит все данные из БД!

## Troubleshooting

### Проблема: Порты заняты

Измените порты в `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Frontend
  - "5001:5000"  # Backend
```

### Проблема: Frontend не подключается к Backend

Проверьте переменные окружения:
```bash
docker-compose exec frontend env | grep REACT_APP
```

Убедитесь что `REACT_APP_API_URL` и `REACT_APP_SOCKET_URL` правильные.

### Проблема: MongoDB не запускается

Проверьте логи:
```bash
docker-compose logs mongodb
```

Очистите volume и перезапустите:
```bash
docker-compose down -v
docker-compose up mongodb
```

### Проблема: Hot reload не работает

Для Windows добавьте в frontend service:
```yaml
environment:
  - CHOKIDAR_USEPOLLING=true
```

### Проблема: Out of memory

Увеличьте лимиты памяти в Docker Desktop:
- Settings → Resources → Memory (минимум 4GB)

### Проблема: Медленная сборка

Используйте BuildKit:
```bash
DOCKER_BUILDKIT=1 docker-compose build
```

## Мониторинг

### Просмотр использования ресурсов

```bash
docker stats
```

### Просмотр процессов

```bash
docker-compose top
```

### Инспекция контейнера

```bash
docker-compose exec backend sh -c "ps aux"
```

## CI/CD интеграция

### GitHub Actions пример

```yaml
name: Build and Push Docker Images

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build images
        run: docker-compose -f docker-compose.prod.yml build
      
      - name: Push to registry
        run: |
          docker-compose -f docker-compose.prod.yml push
```

## Лучшие практики

### Development:

1. Используйте `docker-compose up -d` для фонового режима
2. Регулярно обновляйте образы: `docker-compose pull`
3. Очищайте неиспользуемые образы: `docker system prune`
4. Используйте `.dockerignore` для исключения ненужных файлов

### Production:

1. Всегда используйте конкретные версии образов (не `latest`)
2. Храните `.env` в безопасном месте (НЕ в git)
3. Используйте secrets для чувствительных данных
4. Настройте health checks
5. Используйте reverse proxy (nginx/traefik) с SSL
6. Настройте автоматические backups MongoDB
7. Мониторинг и логирование (ELK, Prometheus)

## Дополнительная конфигурация

### SSL/HTTPS с Let's Encrypt

Добавьте Traefik или nginx-proxy с Let's Encrypt companion для автоматических SSL сертификатов.

### Масштабирование

Для масштабирования backend:
```bash
docker-compose up -d --scale backend=3
```

Потребуется load balancer (nginx/traefik).

### Мониторинг

Добавьте в `docker-compose.yml`:
```yaml
services:
  prometheus:
    image: prom/prometheus
    # конфигурация...
  
  grafana:
    image: grafana/grafana
    # конфигурация...
```

## Полезные команды

```bash
docker-compose up -d                    # Запуск в фоне
docker-compose down                     # Остановка
docker-compose logs -f [service]        # Логи
docker-compose ps                       # Статус
docker-compose restart [service]        # Перезапуск
docker-compose exec [service] sh        # Shell в контейнере
docker-compose build --no-cache         # Пересборка
docker system prune -a                  # Очистка всего
docker volume ls                        # Список volumes
docker network ls                       # Список сетей
```

## Заключение

Docker Compose упрощает развертывание NIMeet:
- ✅ Одна команда для запуска всего стека
- ✅ Изолированное окружение
- ✅ Легкое переключение между dev/prod
- ✅ Консистентность между разработкой и production
- ✅ Простое масштабирование

Для production рекомендуется использовать оркестраторы как Kubernetes или Docker Swarm для большей надежности и масштабируемости.

