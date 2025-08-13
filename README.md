# Readme
### Remarks
#### Search for duplicates
As explained in the comments, not knowing how Sequalize and being new to node, I made a pretty quick way to look for duplicates before adding games in db, which is not working that well.
In prod I would have added a unique index between name and plateform to check for duplicates before adding
I didn't do the transfer from search to index, everything is in index in order to not used much more than 2 hours
Didn't do any vue.js would have took me too much time as i know barely nothing about it

```js
module.exports = (sequelize, DataTypes) => {
  const Game = sequelize.define('Game', {
    publisherId: DataTypes.STRING,
    name: DataTypes.STRING,
    platform: DataTypes.STRING,
    storeId: DataTypes.STRING,
    bundleId: DataTypes.STRING,
    appVersion: DataTypes.STRING,
    isPublished: DataTypes.BOOLEAN,
  }, {
    indexes: [
      {
        unique: true,
        fields: ['name', 'platform']
      }
    ]
  });

  return Game;
};
```

### Testing
Everything is basicaly tested using curl in the terminal, exemple:  
```
curl "http://localhost:3000/api/games/search?name=hel&platform=ios"
```
```
curl -X POST "http://localhost:3000/api/games/populate"
```

# Theory Assignments

### Question 1:
We are planning to put this project in production. According to you, what are the missing pieces to make this project production ready?
Please elaborate an action plan.
Action Plan:
#### Phase 1: Security & Database
- Migrate from SQLite to PostgreSQL/MySQL
- Implement proper database indexing (add unique constraint on name+platform)
- Add input validation middleware
- Implement rate limiting
- Set up environment variables
- Add database backup stategy
- Add authentication
- Add input validation and sanitization

#### Phase 2: Error Handling & Logging
- Implement structured logging
- Add comprehensive error handling
- Set up error monitoring
- Add request/response logging

#### Phase 3: Performance & Monitoring & scalabity
- Implement pagination for API endpoints
- Set up application monitoring
- Load balancing

#### Phase 4: Deployment & DevOps
- Set up CI/CD pipeline
- Implement process management
- Add automated testing in pipeline

### Question 2:
Let's pretend our data team is now delivering new files every day into the S3 bucket, and our service needs to ingest those files
every day through the populate API. Could you describe a suitable solution to automate this? Feel free to propose architectural changes.

#### What do we want:
Right now, you have to manually tell your service to read a JSON file from S3 and insert it into the database.
We want this to happen automatically when the data team drops a new file into the S3 bucket.

#### Steps:
- Data team uploads a file to the S3 bucket.
- S3 instantly send a event notification to tell AWS Lambda
- Lambda runs a small script that calls your API’s /populate endpoint and passes the file’s URL.
- The API downloads the file, processes it, and saves the data in your database.
