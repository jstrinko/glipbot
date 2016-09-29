## Get Started

Pls follow steps below to run and test the bot.

1. Install

```javascript
npm Install
```

2. Get a test account from [Glip.com](glip.com)
3. Make a ~/lists directory
4. Translator requires a developer test key from https://tech.yandex.com/keys (stored in env under YANDEX_API_KEY)
5. use following command to start the bot

```javascript
node example/bin/example.js -u [glip account email] -p [glip account password]
```

6. Add the test account to one of your group in Glip
7. send following message in the group to test the bot

```
!stock rng
```