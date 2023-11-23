'use strict';
/*** Importing modules ***/
const express = require('express');
const morgan = require('morgan');                                  // logging middleware
const cors = require('cors');

const {body, check, validationResult, } = require('express-validator'); // validation middleware

const pageDao = require('./dao-pages'); // module for accessing the films table in the DB
const userDao = require('./dao-users'); // module for accessing the user table in the DB

/*** init express and set-up the middlewares ***/
const app = express();
app.use(morgan('dev'));
app.use('/static', express.static('public'))
app.use(express.json());


/**
 * The "delay" middleware introduces some delay in server responses. To change the delay change the value of "delayTime" (specified in milliseconds).
 * This middleware could be useful for debug purposes, to enabling it uncomment the following lines.
 */ 
/*
const delay = require('express-delay');
app.use(delay(200,2000));*/


/** Set up and enable Cross-Origin Resource Sharing (CORS) **/
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));


/*** Passport ***/

/** Authentication-related imports **/
const passport = require('passport');                              // authentication middleware
const LocalStrategy = require('passport-local');                   // authentication strategy (username and password)

/** Set up authentication strategy to search in the DB a user with a matching password.
 * The user object will contain other information extracted by the method userDao.getUser (i.e., id, username, name).
 **/
passport.use(new LocalStrategy(async function verify(username, password, callback) {
  const user = await userDao.getUser(username, password)
  if(!user)
    return callback(null, false, 'Incorrect username or password');  
    
  return callback(null, user); // NOTE: user info in the session (all fields returned by userDao.getUser, i.e, id, username, name)
}));

// Serializing in the session the user object given from LocalStrategy(verify).
passport.serializeUser(function (user, callback) { // this user is id + username + role 
  callback(null, user);
});

// Starting from the data in the session, we extract the current (logged-in) user.
passport.deserializeUser(function (user, callback) { // this user is id + email + role 
  // if needed, we can do extra check here (e.g., double check that the user is still in the database, etc.)
  // e.g.: return userDao.getUserById(id).then(user => callback(null, user)).catch(err => callback(err, null));

  return callback(null, user); // this will be available in req.user
});

/** Creating the session */
const session = require('express-session');

app.use(session({
  secret: "shhhhh... it's a secret!",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));


/** Defining authentication verification middleware **/
const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({error: 'Not authorized'});
}

/** Defining authorization verification middleware **/
const isAdmin = (req, res, next) => {
  if(req.user.role === "Admin"){
    return next();
  }
  return res.status(401).json({error: 'Not authorized'});
}


/*** Utility Functions ***/

// This function is used to format express-validator errors as strings
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  return `${location}[${param}]: ${msg}`;
};


/*** Users APIs ***/

// POST /api/sessions 
// This route is used for performing login.
app.post('/api/sessions', function(req, res, next) {
  passport.authenticate('local', (err, user, info) => { 
    if (err)
      return next(err);
      if (!user) {
        // display wrong login messages
        return res.status(401).json({ error: info});
      }
      // success, perform the login and extablish a login session
      req.login(user, (err) => {
        if (err)
          return next(err);
        
        // req.user contains the authenticated user, we send all the user info back
        // this is coming from userDao.getUser() in LocalStratecy Verify Fn
        return res.json(req.user);
      });
  })(req, res, next);
});

// GET /api/sessions/current
// This route checks whether the user is logged in or not.
app.get('/api/sessions/current', (req, res) => {
  if(req.isAuthenticated()) {
    res.status(200).json(req.user);}
  else
    res.status(401).json({error: 'Not authenticated'});
});

// DELETE /api/session/current
// This route is used for loggin out the current user.
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.status(200).json({});
  });
});

/*** Pages APIs ***/
app.get('/api/pages/front',
  (req, res) => {
    pageDao.listPages(true)
      .then(pages => res.json(pages))
      .catch((err) => res.status(500).json(err)); // always return a json and an error message
  }
);

app.get('/api/pages/back',
  isLoggedIn,
  (req, res) => {
    // get films that match optional filter in the query
    pageDao.listPages(false)
      // NOTE: "invalid dates" (i.e., missing dates) are set to null during JSON serialization
      .then(pages => res.json(pages))
      .catch((err) => res.status(500).json(err)); // always return a json and an error message
  }
);

app.get('/api/pages/:id',
  isLoggedIn,
  [ check('id').isInt({min: 1}) ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }
    
    const authID = await pageDao.getPageAuthor(req.params.id);
      if(!authID){
        return res.status(404).json({error: "Invalid author"});
      }

      if(req.user.role!=="Admin" && req.user.id !== authID){
          return res.status(401).json({error: "Unauthorized"});
      }

    pageDao.getPage(req.params.id)
      .then(page => res.json(page))
      .catch((err) => res.status(500).json(err)); // always return a json and an error message
  }
);

app.post('/api/pages', isLoggedIn, 
[
  check('title').isLength({min: 1, max:80}),
  check('author').isLength({min: 1, max:50}),
    // only date (first ten chars) and valid ISO
  check('creazione').isLength({min: 10, max: 10}).isISO8601({strict: true}).optional({checkFalsy: true}),
  check('pubblicazione').isLength({min: 10, max: 10}).isISO8601({strict: true}).optional({checkFalsy: true}),
  check("blocks").not().isEmpty(),
  check("blocks").isArray(),
  body('blocks').custom(async blocks => {
    if(blocks.some((b) => !b.type || !b.value || !b.position )){
      throw new Error("Blocks missing props");
    }

    const types = ["header", "paragraph", "image"];
    if (!(blocks.some((b) => b.type === "header") && blocks.some((b) => b.type !== "header")) || blocks.find((b) => !types.includes(b.type))) {
      throw new Error("Blocks inconsistency");
    }

    for (const b of blocks) {
      if (!(typeof b.value === 'string')) {
        throw new Error("Invalid block values");
      }
      switch (b.type) {
        case "header":
          if (b.value.length === 0 || b.value.length > 50)
            throw new Error("Invalid header length");
          break;
        case "paragraph":
          if (b.value.length === 0 || b.value.length > 300)
            throw new Error("Invalid paragraph length");
          break;
        case "image":
          break;
        default:
          throw new Error("Invalid type");
      }
    }

    const positions = Array(blocks.length).fill(0);
    blocks.forEach((b) => { if (b.id || b.created) { positions[b.position - 1] += 1 } });
    if (positions.some((count) => count > 1)) {
      throw new Error("Invalid positions");
    }
  })
],
async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }
    try{
      //const authID = await userDao.getUserID(req.body.author);
        const authID = req.body.author;
        const user = userDao.getUserById(authID);
        if(!user || !authID){
          return res.status(404).json({error: "Invalid author"});
        }
        if(req.user.role!=="Admin" && req.user.id !== authID){
            return res.status(401).json({error: "Unauthorized"});
        }
    const page = {
      title: req.body.title,
      author: parseInt(authID),
      creazione: req.body.creazione,
      pubblicazione: req.body.pubblicazione,
      blocks: req.body.blocks
    }
    const images = await pageDao.getImages();
    if(page.blocks.some((b) => b.type === "image" && !images.includes(b.value)))
      return res.status(404).json({error: "Image not found!"});
    const pageID = await pageDao.createPage(page);
    for(const block of page.blocks){
      const r = await pageDao.createBlock(block, pageID);
    }
    let p = await pageDao.getPage(pageID);
    res.json(p)
  }catch(err){
    res.status(503).json({ error: `Database error during the creation of page ${req.params.id}: ${err}` });
  }
      

})

app.put('/api/pages/:id', 
      isLoggedIn, 
      [
        check('id').isInt({min: 1}),
        check('title').isLength({min: 1, max:80}),
        check('author').isLength({min: 1, max:50}),
          // only date (first ten chars) and valid ISO
        check('creazione').isLength({min: 10, max: 10}).isISO8601({strict: true}).optional({checkFalsy: true}),
        check('pubblicazione').isLength({min: 10, max: 10}).isISO8601({strict: true}).optional({checkFalsy: true}),
        check("blocks").not().isEmpty(),
        check("blocks").isArray(),
        body('blocks').custom(async blocks => {
          if(blocks.some((b) => !b.id && !b.created && !b.deleted)){
            throw new Error("Blocks missing props");
          }

          if(blocks.some((b) => !b.deleted && (!b.type || !b.value || !b.position) )){
            throw new Error("Blocks missing props");
          }

          const types = ["header", "paragraph", "image"];
          if( !(blocks.some((b) => b.type === "header" ) && blocks.some((b) => b.type !== "header")) || blocks.find((b) => !b.deleted && !types.includes(b.type)) ){
            throw new Error("Blocks inconsistency");
          }

          for(const b of blocks){
            if(!b.deleted && !(typeof b.value === 'string')){
              throw new Error("Invalid block values");
            }
            switch(b.type){
              case "header":
                if(b.value.length === 0 || b.value.length > 50)
                    throw new Error("Invalid header length");
                break;
              case "paragraph":
                if(b.value.length === 0 || b.value.length > 300)
                    throw new Error("Invalid paragraph length");
                break;
              case "image":
                break;
            }
          }

          const positions = Array(blocks.length).fill(0);
          blocks.forEach((b) => {if(b.id || b.created) {positions[b.position - 1] += 1}});
          if(positions.some((count) => count > 1)){
            throw new Error("Invalid positions");
          }
        })
      ],
      async (req, res) => {
        const errors = validationResult(req).formatWith(errorFormatter); // format error message
        if (!errors.isEmpty()) {
          return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
        }

        try {

      if (req.body.id !== Number(req.params.id)) {
        return res.status(422).json({ error: 'URL and body id mismatch' });
      }
      let authID = await pageDao.getPageAuthor(req.params.id); //implicitly checks that page exists
      if (!authID) {
        return res.status(404).json({ error: "Page not found" });
      }
      
      if (req.user.role === "Admin") {
        const user = await userDao.getUserById(req.body.author);
        authID = user.id;
        if (!authID) {
          return res.status(404).json({ error: "Invalid author" });
        }
      }

      if (req.user.role !== "Admin" && req.user.id !== authID) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const page = {
        id: req.body.id,
        title: req.body.title,
        author: parseInt(authID),
        creazione: req.body.creazione,
        pubblicazione: req.body.pubblicazione,
      }
      let admin = req.user.role === "Admin" ? true : false;
      const blocks = req.body.blocks;
      blocks.forEach((b) => {
        if (b.id && !pageDao.getBlock(b.id)) {
          return res.status(404).json({ error: "Block doesn't found!" });
        }
      });
      const images = await pageDao.getImages();
      if (blocks.some((b) => b.type === "image" && !images.includes(b.value)))
        return res.status(404).json({ error: "Image not found!" });
      const result = await pageDao.updatePage(page.id, page, admin);
      if (result.error)
        return res.status(404).json(result);
      //upadte blocks: blocks deleted come with json {id: x, deleted: true}
      //blocks inserted comes with json{created: true, ...others}
      for (const block of blocks) {
        if (block.deleted) {
          const result = await pageDao.deleteBlock(block.id, page.id);
          if (result && result.error)
            return res.status(404).json(result);
        } else if (block.created) {
          const result = await pageDao.createBlock(block, page.id);
        } else {
          const result = await pageDao.updateBlock(block.id, block, page.id);
          if (result && result.error)
            return res.status(404).json(result);
        }
      }
      const r = pageDao.getPage(page.id);
      res.json(r);

    } catch (err) {
      res.status(503).json({ error: `Database error during the update of page ${req.params.id}: ${err}` });
    }

  });

app.get('/api/titles',
  async (req, res) => {
    try {
      const result = await pageDao.getCMSTitle();
      if (result.error) {
        return res.status(404).json(result);
      }
      res.json(result);
    } catch (err) {
      res.status(503).json({ error: `Database error during retrieve of title` });
    }
  });

app.put('/api/titles',
  isLoggedIn,
  isAdmin,
  [
    check('title').isLength({ min: 1, max: 50 })
  ],
  async (req, res) => {
    try {
      const result = await pageDao.updateCMSTitle(req.body.title);
      if (result.error) {
        return res.status(404).json(result);
      }
      res.json(result);
    } catch (err) {
      res.status(503).json({ error: `Database error during retrieve of title` });
    } 
      });

      app.delete('/api/pages/:id',
          isLoggedIn,
          [ check('id').isInt() ],
          async (req, res) => {
            try {
              
              const errors = validationResult(req).formatWith(errorFormatter); // format error message
              if (!errors.isEmpty()) {
                return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
              }
              const authID = await pageDao.getPageAuthor(req.params.id);
              if(req.user.role!=="Admin" && req.user.id !== authID){
                  return res.status(401).json({error: "Unauthorized"});
              }
              //deleting blocks entries in db
              const page = await pageDao.getPage(req.params.id);
              if(page.error){
                return res.status(404).json(page);
              }
              for(const block of page.blocks){
                const result = await pageDao.deleteBlock(block.id, req.params.id);
                if(result !== null ){
                  return res.status(404).json(result);
                }
              }
              //deleting page entry in db
              const result = await pageDao.deletePage(authID, req.params.id);
              if (result == null)
                return res.json({}); 
              else
                return res.status(404).json(result);
            } catch (err) {
              res.status(503).json({ error: `Database error during the deletion of page ${req.params.id}: ${err} ` });
            }
          }
      );

      app.get('/api/images', 
      isLoggedIn,
      async (req, res) => {
        try{
          const result = await pageDao.getImages();
          res.json(result);
        }catch(err){
          res.status(503).json({ error: `Database error during retrieve of images` });
        } 
      });

      app.get('/api/users', 
      isLoggedIn,
      isAdmin,
      async (req, res) => {
        try{
          const result = await userDao.getUsers();
          if(result.error){
            return res.status(404).json(result);
          }
          res.json(result);
        }catch(err){
          res.status(503).json({ error: `Database error during retrieve of users` });
        } 
      });


//Activating the server
const PORT = 3001;
app.listen(PORT, ()=>console.log(`Server running on http://localhost:${PORT}/`));
