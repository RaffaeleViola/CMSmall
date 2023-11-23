'use strict';

/* Data Access Object (DAO) module for accessing films data */

const db = require('./db');
const dayjs = require("dayjs");


exports.listBlocks = (pageID) => {
  return new Promise((resolve, reject) => {
    const sql_blocks = 'SELECT * FROM blocks WHERE page=? '
        db.all(sql_blocks, [pageID], (err, rows) => {
          if (err) reject(err);
          const blks = rows.sort((a, b) => a.position - b.position);
          resolve(blks);
        });
      });
};

exports.getBlock = (blockID) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM blocks WHERE id=?'
    db.get(sql,[blockID], (err, row) => {
      if(err) reject(err);
      resolve(row);
    })
  })
}


exports.listPages = (front) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT p.id, p.title, p.author, u.name, p.creazione, p.pubblicazione, b.id as block_id, b.type, b.value, b.position FROM pages as p, blocks as b, users as u WHERE p.id = b.page AND p.author=u.id';
    db.all(sql, [], (err, rows) => {
      if (err) { reject(err); }
      let pages_group = {};
      rows.forEach((p) => {
        // WARNING: the database returns only lowercase fields. So, to be compliant with the client-side, we convert "watchdate" to the camelCase version ("watchDate").
        const {id, title, author, name, creazione, pubblicazione, block_id, type, value, position} = p;
        const block = {id: block_id, type: type, value: value, position: position};
        if(!pages_group[id]){
          pages_group[id] = {id: id, title: title, authorID: author, author: name, creazione: creazione, pubblicazione: pubblicazione, blocks: []};
        }
        pages_group[id]["blocks"].push(block);
        
      });
      const pages = Object.values(pages_group);
     //Ordering for the front page
      if (front){
        resolve(pages.filter((p) => {
          if(!(p.pubblicazione)) //pubblicazione can be null
            return false;
          const data_pub = dayjs(p.pubblicazione);
          const now = dayjs();
          if(now.isSame(data_pub) || data_pub.isBefore(now)){
            return true;
          }else{
            return false;
          }

        }).sort((p1, p2) => {
          //redudant
          if(!(p1.pubblicazione)) return  1;   
          if(!(p2.pubblicazione)) return -1;
          return dayjs(p1.pubblicazione).diff(dayjs(p2.pubblicazione), 'day');
        }));
      }else resolve(pages);
    });
  });
};

exports.getPage = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT p.id as id, p.title, p.author, u.name, p.creazione, p.pubblicazione, b.id as block_id, b.type, b.value, b.position FROM pages as p, blocks as b, users as u WHERE p.id= ? AND p.id = b.page AND p.author=u.id';
    
    db.all(sql, [id], (err, rows) => {
      if (err) {
        reject(err);
      }
      if (rows == undefined) {
        resolve({ error: 'Page not found.' });
      } else {
        
        const {id, title, author, name, creazione, pubblicazione, block_id, type, value, position} = rows[0];
        const page = {id: id, title: title, authorID: author, author: name, creazione: creazione, pubblicazione: pubblicazione, blocks: []};
        rows.forEach((p) => {
          const {id, title, author, creazione, pubblicazione, block_id, type, value, position} = p;
          const block = {id: block_id, type: type, value: value, position: position};
          page["blocks"].push(block);
        });   
        resolve(page);
      }
    });
  });
};

exports.createPage = (page) => {
  // our database is configured to have a NULL value for films without rating
  if (page.pubblicazione == "")
    page.pubblicazione = null;

  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO pages (title, author, creazione, pubblicazione) VALUES(?, ?, ?, ?)';
    db.run(sql, [page.title, page.author, page.creazione, page.pubblicazione], function (err) {
      if (err) {
        reject(err);
      }
      resolve(this.lastID);
    });
  });
};

exports.deleteBlock = (blockID, pageID) => {
  // our database is configured to have a NULL value for films without rating
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM blocks WHERE id=? AND page=?';
    db.run(sql, [blockID, pageID], function (err) {
      if (err) {
        reject(err);
      }
      if (this.changes !== 1)
        resolve({ error: 'No block deleted.' });
      else
        resolve(null);
    });
  });
};

exports.updateBlock = (blockID, block, pageID) => {

  return new Promise((resolve, reject) => {
    const sql = 'UPDATE blocks SET value=?, position=? WHERE id=? AND page=?';
    db.run(sql, [block.value, block.position, blockID, pageID], function (err) {
      if (err) {
        reject(err);
      }
      if (this.changes !== 1) {
        resolve({ error: 'No block was updated.' });
      } else {
        resolve(exports.getBlock(blockID)); 
      }
    });
  });
};

exports.createBlock = (block, pageID) => {

  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO blocks (page, type, value, position) VALUES(?, ?, ?, ?)';
    db.run(sql, [pageID, block.type, block.value, block.position], function (err) {
      if (err) {
        reject(err);
      }
      resolve(exports.getBlock(this.lastID));
    });
  });
};

exports.updatePage = (pageID, page, admin) => {
  if (page.pubblicazione == "")
    page.pubblicazione = null;
  return new Promise((resolve, reject) => {
    if(!admin){
      const sql = 'UPDATE pages SET title=?, pubblicazione=? WHERE id=? AND author=?';
      db.run(sql, [page.title, page.pubblicazione, pageID, page.author], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(exports.getPage(pageID)); 
        }
      });
    }else{
      const sql = 'UPDATE pages SET title=?, author=?, creazione=?, pubblicazione=? WHERE id=?';
      db.run(sql, [page.title, page.author, page.creazione, page.pubblicazione, pageID], function (err) {
        if (err) {
          reject(err);
        }else {
         resolve({message: "Confirmed"});
        }
      });
    }
  });
}

exports.getCMSTitle = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM titles'
    db.get(sql, [], (err, row) => {
      if (err) {
        reject(err);
      }
      if (row.title == undefined) {
        resolve({ error: 'Title not found.' });
      } else {
        resolve(row.title);
      }
    })
  })
}

exports.updateCMSTitle = (title) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE titles SET title=? WHERE id=?'
    db.run(sql, [title, 1], function (err){
      if (err) {
        reject(err);
      }
      if (this.changes !== 1) {
        resolve({ error: 'No title was updated.' });
      } else {
        resolve(exports.getCMSTitle()); 
      }
    })
  })
}

exports.deletePage = (authorID, pageID) => {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM pages WHERE id=? AND author=?';
    db.run(sql, [pageID, authorID], function (err) {
      if (err) {
        reject(err);
      }
      if (this.changes !== 1)
        resolve({ error: 'No page deleted.' });
      else
        resolve(null);
    });
  });  
}

exports.getImages = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM images'
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      }
        resolve(rows.map((r) => r.url));
    })
  })
}

exports.getPageAuthor = (pageID) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT author FROM pages as p WHERE p.id = ?'
    db.get(sql, [pageID], (err, row) => {
      if (err) {
        reject(err);
      }
        resolve(row.author);
    })
  })
}

