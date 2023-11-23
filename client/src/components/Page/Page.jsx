import { Card, ListGroup, Button} from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router';
import dayjs from 'dayjs'
import Block from './Block';
import { Link } from 'react-router-dom';


function Page(props){
    const location = useLocation();
    const id = props.page.id;
    const title = props.page.title;
    const author = props.page.author;
    const authID = props.page.authorID;
    const creazione = props.page.creazione ? props.page.creazione.format("YYYY-MM-DD") : 'not defined'
    const pubblicazione = props.page.pubblicazione ? props.page.pubblicazione.format("YYYY-MM-DD") : 'not defined'
    const dirty = props.dirty;
    let status = 'Draft'
    if(props.page.pubblicazione){
        if(!props.page.pubblicazione.isAfter(dayjs()))
            status = 'Published';
        else
            status = 'Programmed';
    }
    const blocks = props.page.blocks.toSorted((b1, b2) => b1.position - b2.position);

    return (
        <>
        <Card border={!dirty ? "primary" : dirty} style={{ width: '50rem' }} bg="light" className='ms-4'>

            <Card.Header>{title}
            </Card.Header>
            <Card.Body>
            <Card.Text>author: {author}</Card.Text>
            <Card.Text>creazione: {creazione}</Card.Text>
            <Card.Text>pubblicazione: {pubblicazione}</Card.Text>
            <Card.Text>status: {status}</Card.Text>
            </Card.Body>
            <ListGroup className="list-group-flush">
                {blocks.map((block) => <ListGroup.Item key={block.position}>
                                            <Block type={block.type} value={block.value}/>
                                        </ListGroup.Item>)}
            </ListGroup>
            <Card.Footer>
                {(props.user && (props.user.id === authID || props.user.role === "Admin")) && props.label === "Back" ? 
                        <>
                        <Button variant='danger' className='mt-1 me-2' onClick={() => props.deletePage(id)}><i className="bi bi-trash"></i></Button> 
                        <Link to={`/edit/${id}`} state={{nextpage: location.pathname}}>
                            <Button variant='primary' className='mt-1 me-2'><i className="bi bi-pen"></i></Button>
                        </Link>
                        </>
                        : <></>}
            </Card.Footer>
        </Card>
        <br />
        </>
    );
}

export default Page;