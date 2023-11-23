import { useState } from 'react';
import { Form, Button, Alert, Col, Row } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';

function LoginForm(props) {
  const [username, setUsername] = useState('user1@email.com');
  const [password, setPassword] = useState('secure_password');

  const [show, setShow] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const location = useLocation();
  const navigate = useNavigate();


  const handleSubmit = (event) => {
    event.preventDefault();
    const credentials = { username, password };

    props.login(credentials)
      .then( () => navigate( "/filter/Front" ) )
      .catch((err) => { 
        setErrorMessage(err.error); setShow(true); 
      });
  };

  return (
    <Row className="vh-100 justify-content-md-center">
    <Col md={4} >
    <h1 className="pb-3">Login</h1>

      <Form  onSubmit={handleSubmit}>
          <Alert
            dismissible
            show={show}
            onClose={() => setShow(false)}
            variant="danger">
            {errorMessage}
          </Alert>
          <Form.Group className="mb-3" controlId="username">
            <Form.Label>email</Form.Label>
            <Form.Control
              type="email"
              value={username} placeholder="Example: john.doe@polito.it"
              onChange={(ev) => setUsername(ev.target.value)}
              required={true}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={password} placeholder="Enter the password."
              onChange={(ev) => setPassword(ev.target.value)}
              required={true} minLength={6}
            />
          </Form.Group>
          <Button className="mt-3 me-3" type="submit">Login</Button>
          <Button variant="danger" className="mt-3" onClick={() => navigate('/')}>Cancel</Button>
      </Form>
      </Col>
      </Row>

  )
};

function LogoutButton(props) {
  const navigate = useNavigate();
  return (
    <Button variant="outline-light" className="me-2" onClick={async () => {await props.logout(); navigate('/')}}>Logout</Button>
  )
}

function LoginButton(props) {
  const navigate = useNavigate();
  return (
    <Button variant="outline-light" className="me-2" onClick={()=> navigate('/login')}>Login</Button>
  )
}

export { LoginForm, LogoutButton, LoginButton };