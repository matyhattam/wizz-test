const express = require('express');
const bodyParser = require('body-parser');
const db = require('./models');
const { where } = require('sequelize');
const { Op } = require("sequelize");
const axios = require('axios');

const app = express();

app.use(bodyParser.json());
app.use(express.static(`${__dirname}/static`));

app.get('/api/games', (req, res) => db.Game.findAll()
  .then(games => res.send(games))
  .catch((err) => {
    console.log('There was an error querying games', JSON.stringify(err));
    return res.send(err);
  }));

app.post('/api/games', (req, res) => {
  const { publisherId, name, platform, storeId, bundleId, appVersion, isPublished } = req.body;
  return db.Game.create({ publisherId, name, platform, storeId, bundleId, appVersion, isPublished })
    .then(game => res.send(game))
    .catch((err) => {
      console.log('***There was an error creating a game', JSON.stringify(err));
      return res.status(400).send(err);
    });
});

app.delete('/api/games/:id', (req, res) => {
  // eslint-disable-next-line radix
  const id = parseInt(req.params.id);
  return db.Game.findByPk(id)
    .then(game => game.destroy({ force: true }))
    .then(() => res.send({ id }))
    .catch((err) => {
      console.log('***Error deleting game', JSON.stringify(err));
      res.status(400).send(err);
    });
});

app.put('/api/games/:id', (req, res) => {
  // eslint-disable-next-line radix
  const id = parseInt(req.params.id);
  return db.Game.findByPk(id)
    .then((game) => {
      const { publisherId, name, platform, storeId, bundleId, appVersion, isPublished } = req.body;
      return game.update({ publisherId, name, platform, storeId, bundleId, appVersion, isPublished })
        .then(() => res.send(game))
        .catch((err) => {
          console.log('***Error updating game', JSON.stringify(err));
          res.status(400).send(err);
        });
    });
});

app.get('/api/games/search', (req, res) => {
  const { name = '', platform } = req.query;    
  db.Game.findAll({
  where: {
    ...(name ? { name: { [Op.substring]: name } } : {}),
    ...(platform ? { platform } : {})
  }
})
  .then(games => res.send(games))
  .catch((err) => {
    console.log('There was an error querying games', JSON.stringify(err));
    return res.send(err);
  })
});

app.post('/api/games/populate', async (req, res) => {
  try {
    const iosGamesList = 'https://wizz-technical-test-dev.s3.eu-west-3.amazonaws.com/ios.top100.json';
    const androidGamesList = 'https://wizz-technical-test-dev.s3.eu-west-3.amazonaws.com/android.top100.json';
    const { data: iosData } = await axios.get(iosGamesList);
    const { data: androidData } = await axios.get(androidGamesList); 
    const games = [];

    iosData.forEach(game => {
      if (game[1] && game[1].name) {
        games.push({
          name: game[1].name,
          platform: 'ios'
        });
      }
    });

    androidData.forEach(game => {
      if (game[1] && game[1].name) {
        games.push({
          name: game[1].name,
          platform: 'android'
        });
      }
    });

    // Not very good way to check for duplicates 
    // I would have made a unique index with name and plateform in the model to check for duplicate
    const existing = await db.Game.findAll({
      attributes: ['name', 'platform'],
      raw: true
    });
    const existingPairs = new Set(existing.map(g => `${g.name}-${g.platform}`));
    
    const newGames = games.filter(
      g => !existingPairs.has(`${g.name}-${g.platform}`)
    );

    await db.Game.bulkCreate(newGames, { 
      ignoreDuplicates: true,
      individualHooks: true    
    });

    res.send({ message: 'Games populated successfully', count: newGames.length });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to populate games' });
  }
});

app.delete('/api/games', async (req, res) => {
  try {
    await db.Game.destroy({
      where: {},
      truncate: true
    });
    res.send({ message: 'All games deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to delete games' });
  }
});

app.listen(3000, () => {
  console.log('Server is up on port 3000');
});

module.exports = app;
