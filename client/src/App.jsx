import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import {PageList} from './components/PageLayout.jsx';

import { React, useState, useEffect, useContext } from 'react';
import { Container, Toast } from 'react-bootstrap/'
import { BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import { Navigation } from './components/Navigation';
import {NotFoundLayout, LoginLayout } from './components/PageLayout';
import MessageContext from './messageCtx';

import API from './API.js';
import { AddLayout, EditLayout } from './components/PageLayout.jsx';


function App() {
  const [pageList, setPageList] = useState([]);
  const [dirty, setDirty] = useState(true);

  // This state keeps track if the user is currently logged-in.
  const [loggedIn, setLoggedIn] = useState(false);
  // This state contains the user's info.
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState("");

  const [images, setImages] = useState([]);
  //For Admin 
  const [users, setUsers] = useState([]);

  // If an error occurs, the error message will be shown in a toast.
  const handleErrors = (err) => {
    let msg = '';
    if (err.error) msg = err.error;
    else if (String(err) === "string") msg = String(err);
    else msg = "Unknown Error";
    setMessage(msg); 
  }
  
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        API.getTitle().then((title) => setTitle(title)).catch((e) => handleErrors(e));
        const user = await API.getUserInfo(); 
        setUser(user);
        API.getImages().then((images) => setImages(images)).catch((e) => handleErrors(e));
        setLoggedIn(true); 
        setLoading(false);
        if(user.role === "Admin"){
          API.getUsers().then((users) => setUsers(users)).catch((e) => handleErrors(e));
        }
      } catch (err) {
        setUser(null);
        setLoggedIn(false); 
        setLoading(false);
      }
    };
    init();
  }, []);  // This useEffect is called only the first time the component is mounted.

  /**
   * This function handles the login process.
   * It requires a username and a password inside a "credentials" object.
   */
  const handleLogin = async (credentials) => {
    try {
      setLoading(true);
      const user = await API.logIn(credentials);
      setUser(user);
      API.getImages().then((images) => setImages(images)).catch((e) => handleErrors(e));
      API.getTitle().then((title) => setTitle(title)).catch((e) => handleErrors(e));
      setLoggedIn(true);
      setLoading(false);
      if(user.role === "Admin"){
        API.getUsers().then((users) => setUsers(users)).catch((e) => handleErrors(e));
      }
    } catch (err) {
      // error is handled and visualized in the login form, do not manage error, throw it
      setLoading(false);
      throw err;
    }
  };

  /**
   * This function handles the logout process.
   */ 
  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false);
    // clean up everything
    setUser(null);
  };
  
  return (
    <BrowserRouter>
      <MessageContext.Provider value={{ handleErrors }}>
        {!loading ? <Navigation logout={handleLogout} user={user} loggedIn={loggedIn} title={title} setTitle={setTitle}/> : <></>}
        <Toast show={message !== ''} onClose={() => setMessage('')} delay={4000} autohide bg="danger">
            <Toast.Body>{message}</Toast.Body>
          </Toast>
        <Container fluid className="App">
          <Routes>
              <Route path="/" element={ !loggedIn  ? <PageList pageList={pageList} 
                                                                                setPageList={setPageList} 
                                                                                dirty={dirty} 
                                                                                setDirty={setDirty} 
                                                                                loggedIn={loggedIn}/> : <Navigate replace to='/filter/Front' />
              } />
              <Route path="filter/:filterLabel" element= {loggedIn ? 
                                    <PageList  pageList={pageList} 
                                               setPageList={setPageList} 
                                               dirty={dirty} 
                                               setDirty={setDirty} 
                                               user={user}
                                               loggedIn={loggedIn}/>
                                                        : <Navigate replace to='/'/>}/>
              <Route path="/add" element={loggedIn ? <AddLayout setPageList={setPageList} pages={pageList} users={users} user={user} images={images} setDirty={setDirty}/> : <Navigate replace to='/' />} /> 
              <Route path="/edit/:pageId" element={loggedIn ? <EditLayout setPageList={setPageList} pages={pageList} users={users} user={user} images={images} setDirty={setDirty}/> : <Navigate replace to='/' />} />
              <Route path="*" element={<NotFoundLayout />} />
              <Route path="/login" element={!loggedIn ? <LoginLayout login={handleLogin} /> : <Navigate replace to='/' />} />
          </Routes>
        </Container>
      </MessageContext.Provider>
    </BrowserRouter>
  )
}

export default App
