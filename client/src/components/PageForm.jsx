import dayjs from 'dayjs';
import {useState} from 'react';
import {Form, Button, Card, Image, Dropdown, ListGroup, Col, Row, Alert} from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';


const BlockComponent = (props) => {

  return (
  props.block.type !== "image" ?
  <ListGroup.Item >
    <Row>
  <Col className="col-6">
  <Form.Group  className="mb-3">
      <Form.Label>{props.block.type}</Form.Label>

      {props.block.type === "header" ? <Form.Control type="text" required={true} maxLength={50} value={props.block.value} onChange={event => props.handleBlock(props.block.position, event.target.value)} />
       : 
        <Form.Control type="text" required={true} as="textarea" rows={3} maxLength={300} value={props.block.value} onChange={event => props.handleBlock(props.block.position, event.target.value)} />
       }
  </Form.Group>
  </Col>
  <Col className="col-4"></Col>
  <Col className="col-2 mt-4">
      {props.length !== 1 ? <ArrowButton position={props.block.position} maxlen={props.length} handleOrder={props.handleOrder}/> : <></>}
      <Button variant='danger' className='mt-1 me-2' onClick={() => props.deleteBlock(props.block.position)}><i className="bi bi-trash"></i></Button>
  </Col>
  </Row>
  </ListGroup.Item>
  
  :
  <ListGroup.Item >
    <Row>
      <Col className='col-8'>
      <Card.Img src={`http://localhost:3001/static/${props.block.value}`} style={{"height" : "300px",
        "width": "300px"}}/>
      </Col>
      <Col className='col-2'></Col>
      <Col className='col-2'>
      {props.length !== 1 ? <ArrowButton position={props.block.position} maxlen={props.length} handleOrder={props.handleOrder}/> : <></>}
      <Button variant='danger' className='mt-1 me-2' onClick={() => props.deleteBlock(props.block.position)}><i className="bi bi-trash"></i></Button>
        </Col>
    </Row>
  </ListGroup.Item>

  );
}
const ArrowButton = (props) => {
  
  return (
    <>
    {props.position !== 1 ?
    <Button variant='primary' className='me-2' onClick={() => props.handleOrder("up", props.position) }>
      <i className="bi bi-arrow-up-circle-fill"></i>
    </Button>
    : <></>}
    {props.position !== props.maxlen ?
    <Button variant='primary' className='me-2' onClick={() => props.handleOrder("down", props.position) }>
      <i className="bi bi-arrow-down-circle-fill"></i>
    </Button>
    : <></>}
    </>
  );
}

const PageForm = (props) => {
  const [title, setTitle] = useState(props.page  ? props.page.title : '');
  const [author, setAuthor] = useState(props.page && props.user.role === "Admin" ? props.page.authorID : props.user.id)
  const creazione = (props.page  && props.page.creazione ) ? props.page.creazione.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
  const [pubblicazione, setPubblicazione] = useState((props.page  && props.page.pubblicazione) ? props.page.pubblicazione.format('YYYY-MM-DD') : "");
  const [blocks, setBlocks] = useState(props.page ? props.page.blocks.toSorted((b1, b2) => b1.position - b2.position) : []);
  const [blocksDeleted, setBlocksDeleted] = useState([]);

  const [errorMessage, setErrorMessage] = useState("");
  const images = props.images;

  //needed for select Form
  const actual_user = props.page && props.user.role === "Admin" ? props.users.find((el) => el.id === props.page.authorID) : {id: props.user.id, email: props.user.username , name: props.user.name}
  const users = props.user.role === "Admin" && props.users.filter((u) => u.id !== actual_user.id);
  // useNavigate hook is necessary to change page
  const navigate = useNavigate();
  const location = useLocation();

  // if the film is saved (eventually modified) we return to the list of all films, 
  // otherwise, if cancel is pressed, we go back to the previous location (given by the location state)
  const nextpage = location.state?.nextpage || '/';

  const handleSubmit = (event) => {
    event.preventDefault();
    if(!(blocks.some((b) => b.type === "header") && blocks.some((b) => b.type !== "header"))){
      setErrorMessage("An header and another type of block are needed!")
    }else{
      const page = {
        title: title,
        author: props.user.id,
        creazione: creazione,
        pubblicazione: pubblicazione,
        blocks: blocks
      }
      if(props.user.role === "Admin"){
        page.author = author;
      }
       if(!props.page){
          props.addPage(page);
       }else{
        const page_edited = Object.assign({}, page, {id: props.page.id});
        blocksDeleted.forEach((b) => blocks.push(b));
          props.updatePage(page_edited);
       }
       navigate(`${nextpage}`);
    }
  }

  const addBlock = (type) => {
    const position = blocks.length > 0 ? blocks[blocks.length - 1]["position"] + 1 : 1
    if(type === "header" || type === "paragraph")
        blocks.push({type: type, value: "", position: position, created: true});
    else
        blocks.push({type: "image", value: type, position: position, created: true});
    setBlocks(blocks.map((b) => b));
  }

  const handleBlock = (position, newValue) => {
      setBlocks(blocks.map((b) => {
        if(b.position == position){
          b.value = newValue;
        }
          return b;
      }));
  }

  const handleOrder  = (direction, curPos) => {
    if(direction === "up"){
        setBlocks(blocks.map((block) => {
          if(block.position === curPos)
            block.position = curPos - 1
          else if(block.position === curPos - 1)
            block.position = curPos 
          return block;
        }).sort((b1, b2) => b1.position - b2.position));
    }else{
      setBlocks(blocks.map((block) => {
        if(block.position === curPos)
          block.position = curPos + 1
        else if(block.position === curPos + 1)
          block.position = curPos 
          return block;
      }).sort((b1, b2) => b1.position - b2.position));
    }
}

const deleteBlock = (position) => {
  if(!blocks[position - 1].created){
    const id = blocks[position - 1].id;
    blocksDeleted.push({id: id, deleted: true});
    setBlocksDeleted(blocksDeleted.map((e) => e));
  }
  setBlocks(blocks
            .filter((b) => b.position !== position )
            .map((b) => {
              if(b.position > position)
                b.position = b.position - 1;
              return b; 
            }))
}


  return (
    <>
    <Card border="primary" style={{ width: '50rem' }} bg="light" className='ms-4'>
        <Form className="block-example border border-primary rounded mb-0 form-padding" onSubmit={handleSubmit}>
            <Card.Header>
                    <Form.Group className="mb-3">
                        <Form.Label>Title</Form.Label>
                        <Form.Control type="text" required={true} value={title} onChange={event => setTitle(event.target.value)}/>
                    </Form.Group>
            </Card.Header>
            <Card.Body>
            {props.user.role !== "Admin" || props.users.length === 0? <Card.Text>author: {props.user.name}</Card.Text> : 
                    <>
                    {"Author"}
                    <Form.Select aria-label="Default select example" onChange={(event) => setAuthor(event.target.value)}>
                        <option value={actual_user.id}>{actual_user.email + " - " + actual_user.name}</option>
                        {users.map((u) => <option key={u.id} value={u.id}>{u.email +" - "+u.name}</option>)}
                    </Form.Select>
                    </>
                      }
            <Card.Text>
                  Creazione: {creazione}
            </Card.Text>
              <Form.Group className="mb-3">
                    <Form.Label>Pubblicazione</Form.Label>
                    <Form.Control type="date" max={"3000-12-31"} value={pubblicazione} onChange={event => setPubblicazione(event.target.value)}/>
              </Form.Group>
            <Button variant="success" className='me-4' onClick={() => addBlock("header")}>Add Header</Button>
            <Button variant="success" className='me-4' onClick={() => addBlock("paragraph")}>Add Paragraph</Button>
            <Dropdown drop="end" className='mt-2' onSelect={(eventKey) => addBlock(eventKey)}>
                <Dropdown.Toggle variant="success" id="dropdown-basic">
                  Add Image
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  {props.images.map((url, index) => <Dropdown.Item key={index} eventKey={url}><Card.Img src={`http://localhost:3001/static/${url}`} style={{"height" : "80px",
                "width": "80px"}}/> </Dropdown.Item>)}
                </Dropdown.Menu>
           </Dropdown>
            </Card.Body>
            <ListGroup className="list-group-flush">
              {blocks.map((b, index) => <BlockComponent key={index} block={b} length={blocks.length} handleOrder={handleOrder} handleBlock={handleBlock} deleteBlock={deleteBlock}/>)}
            </ListGroup>
            <Card.Footer>
                <Button className="mb-2 mt-2" variant="primary" type="submit" onSubmit={handleSubmit}>Save</Button>
                &nbsp;
                <Link className="btn btn-danger mb-2 mt-2" to={nextpage}> Cancel </Link>
            </Card.Footer>
          </Form>
          </Card>
           {errorMessage != "" ? <Alert dismissible key={"errorMessage"} variant="danger" onClose={() => setErrorMessage("")} >
           {errorMessage}
         </Alert> 
         : 
         <></>}
         </>
  )

}


export default PageForm;