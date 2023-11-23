'use strict'
import dayjs from 'dayjs';

const SERVER_URL = 'http://localhost:3001/api/';


/**
 * A utility function for parsing the HTTP response.
 */
function getJson(httpResponsePromise) {
  // server API always return JSON, in case of error the format is the following { error: <message> } 
  return new Promise((resolve, reject) => {
    httpResponsePromise
      .then((response) => {
        if (response.ok) {

         // the server always returns a JSON, even empty {}. Never null or non json, otherwise the method will fail
         response.json()
            .then( json => resolve(json) )
            .catch( err => reject({ error: "Cannot parse server response" }))

        } else {
          // analyzing the cause of error
          response.json()
            .then(obj => 
              reject(obj)
              ) // error msg in the response body
            .catch(err => reject({ error: "Cannot parse server response" })) // something else
        }
      })
      .catch(err => 
        reject({ error: "Cannot communicate"})
      ) // connection error
  });
}

/**
 * Getting from the server side and returning the list of films.
 * The list of films could be filtered in the server-side through the optional parameter: filter.
 */
const getPages = async (front) => {
  // film.watchDate could be null or a string in the format YYYY-MM-DD
  return getJson(
    front == "Back" 
      ? fetch(SERVER_URL + 'pages/back', { credentials: 'include' })
      : fetch(SERVER_URL + 'pages/front')
  ).then( json => {
    return json.map((page) => {
      const clientPage = {
        id: page.id,
        title: page.title,
        authorID: page.authorID,
        author: page.author,
        creazione: page.creazione,
        pubblicazione: page.pubblicazione,
        blocks: page.blocks
      }
      if (page.creazione)
        clientPage.creazione = dayjs(page.creazione);
      if (page.pubblicazione)
        clientPage.pubblicazione = dayjs(page.pubblicazione);
      return clientPage;
    })
  })
}

const getPage = async (pageId) => {
  // film.watchDate could be null or a string in the format YYYY-MM-DD
  return getJson(
    fetch(SERVER_URL + `pages/${pageId}`, { credentials: 'include' })
  ).then( page => {
      const clientPage = {
        id: page.id,
        title: page.title,
        author: page.author,
        authorID: page.authorID,
        creazione: page.creazione,
        pubblicazione: page.pubblicazione,
        blocks: page.blocks
      }
      if (page.creazione)
        clientPage.creazione = dayjs(page.creazione);
      if (page.pubblicazione)
        clientPage.pubblicazione = dayjs(page.pubblicazione);
      return clientPage;
  })
}



/**
 * This function wants a film object as parameter. If the filmId exists, it updates the film in the server side.
 */
function updatePage(page) {
  if (page && page.creazione && (page.creazione instanceof dayjs))
      page.creazione = page.creazione.format("YYYY-MM-DD");
  return getJson(
    fetch(SERVER_URL + "pages/" + page.id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(page) 
    })
  )
}

/**
 * This funciton adds a new film in the back-end library.
 */
function addPage(page) {
  if (page && page.creazione && (page.creazione instanceof dayjs))
      page.creazione = page.creazione.format("YYYY-MM-DD");
  return getJson(
    fetch(SERVER_URL + "pages/", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(page) 
    })
  )
}

/**
 * This function deletes a film from the back-end library.
 */
function deletePage(pageID) {
  return getJson(
    fetch(SERVER_URL + "pages/" + pageID, {
      method: 'DELETE',
      credentials: 'include'
    })
  )
}

const getTitle = async () => {
    return getJson(
        fetch(SERVER_URL + 'titles')
    ).then(title => title);
};

function updateTitle(title) {
    return getJson(
      fetch(SERVER_URL + "titles", {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(title) 
      })
    )
}

function getImages() {
  return getJson(
    fetch(SERVER_URL + "images", {
      credentials: 'include'
    })
  )
}

function getUsers() {
  return getJson(
    fetch(SERVER_URL + "users", {
      credentials: 'include'
    })
  )
}
  
/**
 * This function wants username and password inside a "credentials" object.
 * It executes the log-in.
 */
const logIn = async (credentials) => {
  return getJson(fetch(SERVER_URL + 'sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',  // this parameter specifies that authentication cookie must be forwared
    body: JSON.stringify(credentials),
  })
  )
};

/**
 * This function is used to verify if the user is still logged-in.
 * It returns a JSON object with the user info.
 */
const getUserInfo = async () => {
  return getJson(fetch(SERVER_URL + 'sessions/current', {
    // this parameter specifies that authentication cookie must be forwared
    credentials: 'include'
  })
  )
};

/**
 * This function destroy the current user's session and execute the log-out.
 */
const logOut = async() => {
  return getJson(fetch(SERVER_URL + 'sessions/current', {
    method: 'DELETE',
    credentials: 'include'  // this parameter specifies that authentication cookie must be forwared
  })
  )
}

const API = {logIn, getUserInfo, logOut, getPages, updatePage, deletePage, addPage, getTitle, updateTitle, getImages, getPage, getUsers};
export default API;