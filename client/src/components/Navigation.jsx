import {Navbar, Container, Form, Button} from 'react-bootstrap';
import { LoginButton, LogoutButton } from './Auth';
import { useState } from 'react';
import API from '../API';


function Navigation(props){
    const [modify, setModify] = useState(false);
    const [newTitle, setNewTitle] = useState(props.title);
    const handleSubmit = (event) => {
        event.preventDefault();
        API.updateTitle({"title": newTitle})
            .then((t) => props.setTitle(t))
            .catch((e) => handleErrors(e));
        setModify(false);
    }

    return (
        <Navbar bg='primary' data-bs-theme="dark" className='mb-3'>
            <Container fluid>
                    <Navbar.Brand>
                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="24" fill="currentColor" className="bi bi-pc-display-horizontal" viewBox="0 0 16 16">
                            <path d="M1.5 0A1.5 1.5 0 0 0 0 1.5v7A1.5 1.5 0 0 0 1.5 10H6v1H1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-5v-1h4.5A1.5 1.5 0 0 0 16 8.5v-7A1.5 1.5 0 0 0 14.5 0h-13Zm0 1h13a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-7a.5.5 0 0 1 .5-.5ZM12 12.5a.5.5 0 1 1 1 0 .5.5 0 0 1-1 0Zm2 0a.5.5 0 1 1 1 0 .5.5 0 0 1-1 0ZM1.5 12h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1ZM1 14.25a.25.25 0 0 1 .25-.25h5.5a.25.25 0 1 1 0 .5h-5.5a.25.25 0 0 1-.25-.25Z"/>
                        </svg>
                    </Navbar.Brand>
                    <Navbar.Brand>
                        {!props.user ||  props.user.role !== "Admin" ? 
                        <>
                        <h2> {props.title ? props.title : "Waiting for title..."}</h2>
                        </>
                         : 
                        !modify ? <>
                                    <h2> {props.title ? props.title : "Waiting for title..."}</h2>
                                    {newTitle ? <Button className="mb-1 mt-1" variant="secondary" onClick={() => setModify(true)}><i className="bi bi-pen"></i></Button> : <></>}
                                  </>
                        :
                        
                        <Form className="block-example border border-primary rounded mb-0 form-padding" onSubmit={handleSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Control type="text" required={true} value={newTitle} onChange={event => setNewTitle(event.target.value)}/>
                            </Form.Group>
                            <Button className="mb-1 mt-1 me-2" variant="success" type="submit" onSubmit={handleSubmit}><i className="bi bi-check-lg"></i></Button>
                            <Button className="mb-1 mt-1" variant="danger" onClick={() => {setModify(false); setNewTitle(props.title);}}><i className="bi bi-x-lg"></i></Button>
                         </Form>
                         }

                    </Navbar.Brand>
                    <Navbar.Brand>
                        {props.loggedIn ? <LogoutButton logout={props.logout} /> : <LoginButton />}
                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="24" className="bi bi-person-circle" viewBox="0 0 16 16">
                        <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                        <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
                        </svg>
                    </Navbar.Brand>
            </Container>

        </Navbar>
    );
}

export { Navigation };