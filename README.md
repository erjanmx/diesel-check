### Diesel Checker

Проверка соблюдения правил в коммерческих разделах форума diesel.elcat.kg

> На форуме существует правило запрещающее поднятие (up) тем в коммерческих разделах чаще одного раза в сутки, однако многие нарушают его

Данное приложение сможет помочь модераторам в проверке, периодически собирая информацию обо всех темах в разных разделах и показывать их в структурированном виде. 

Список отслеживаемых разделов форума находится в [db/forums.json](https://github.com/erjanmx/diesel-check/blob/master/db/forums.json)

Приложение доступно по адресу https://erjanmx.github.io/diesel-check/

## Локальный запуск

Для более частых проверок возможен запуск программы на своем компьютере, для этого необходимо [Скачать zip архив проекта](http://github.com/erjanmx/diesel-check/releases/latest/download/diesel-checker.zip) и запустить файл в зависимости от вашей операционной системы:

#### На Windows
> diesel-checker-win.exe

#### На macOS
> diesel-checker-mac

#### На Linux
> diesel-checker-linux 


## Технические детали

- Для парсинга форума используется [crawler](https://github.com/bda-research/node-crawler) и [cheerio](https://github.com/cheeriojs/cheerio)
- Хранение данных [lowdb](https://github.com/typicode/lowdb)
- Web - [express](https://github.com/expressjs/express) + [vue](https://github.com/vuejs/vue)
- Логирование [winston](https://github.com/winstonjs/winston)
- [socket.io](https://github.com/socketio/socket.io), [moment](https://github.com/moment/moment), [lodash](https://github.com/lodash/lodash), [axios](https://github.com/axios/axios), [dotenv](https://github.com/motdotla/dotenv), [node-cron](https://github.com/node-cron/node-cron), [clipboard.js](https://github.com/zenorocha/clipboard.js)
- Стили [bulma](https://github.com/jgthms/bulma), [balloon.css](https://github.com/kazzkiq/balloon.css)

#### Для запуска из исходного кода

```
git clone git@github.com:erjanmx/diesel-check.git
cd diesel-check 
cp .env.example .env
npm install
npm start
```
