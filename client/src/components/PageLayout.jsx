import Page from "./Page/Page";
import { LoginForm } from "./Auth";
import PageForm from "./PageForm";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import {ButtonGroup, ToggleButton, Spinner, Row,Col, Button} from "react-bootstrap";
import { useState, useContext, useEffect } from "react";
import MessageContext from "../messageCtx";
import API from "../API";
import dayjs from "dayjs";

function SwitchButton(props){
  const navigate = useNavigate();
  return ( 
      <ButtonGroup bg="light" className="position-fixed top-2 end-0 mt-3 mb-3 me-2">
          <ToggleButton
            key={1}
            id={`radio-1`}
            type="radio"
            variant={'outline-primary'}
            name="radio"
            value={"Front"}
            checked={props.label === "Front"}
            onChange={(e) => {navigate(`/filter/Front`)}}
          >
            {"Front"}
          </ToggleButton>
          <ToggleButton
            key={2}
            id={`radio-2`}
            type="radio"
            variant={'outline-primary'}
            name="radio"
            value={"Back"}
            checked={props.label === "Back"}
            onChange={(e) => {navigate(`/filter/Back`)}}
          >
            {"Back"}
          </ToggleButton>
      </ButtonGroup>
      );
}

function AddButton(props){
  const location = useLocation();
 
  return (   <Link to={`/add`} state={{nextpage: location.pathname}}>
             <Button className="position-fixed bottom-0 end-0 
             btn btn-primary rounded-pill mb-3 me-2">+
             </Button>
             </Link>);
 }

function PageList(props){
  const dirty = props.dirty;
  const setDirty = props.setDirty;
  const filteredPages = props.pageList;

  const {handleErrors} = useContext(MessageContext);

  const { filterLabel } = useParams();
  const filterId = filterLabel || 'Front';

  useEffect(() => {
    setDirty(true);
  }, [filterId])

  useEffect(() => {
    if (dirty) {
      API.getPages(filterId)
        .then(pages => {
          props.setPageList(pages);
          setDirty(false);
        })
        .catch(e => { 
          handleErrors(e); 
          setDirty(false); 
        } ); 
    }
  }, [filterId, dirty]);
  
  const deletePage = (pageID) => {
    props.setPageList(filteredPages.map((p) => {
      let newPage = p;
      if (p.id === pageID) {
        newPage = Object.assign({}, p, { dirty: "danger" });
      }
      return newPage;
    }));
    API.deletePage(pageID)
      .then((v) => { setDirty(true); })
      .catch((e) => handleErrors(e));
  }

    return (
        <>
        {props.loggedIn ? <SwitchButton label={filterLabel}/> : <></>}
        {props.loggedIn && filterId === "Back" ? <AddButton /> : <></>}
        {dirty ? 
        <Button variant="primary" disabled>
          <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true"/>
          Loading...
        </Button> : <></>}
         {filteredPages.map((page) => {
                                        return <Page key={page.id}
                                        page = {page}
                                        label={filterLabel}
                                        user={props.user}
                                        deletePage={deletePage}
                                        dirty={page.dirty}
                                        />
                                        })
                                        }
        </>
    );
}
function NotFoundLayout() {
    return(
        <>
          <h2>This is not the route you are looking for!</h2>
          <Link to="/">
            <Button variant="primary">Go Home!</Button>
          </Link>
        </>
    );
}

/**
 * This layout shuld be rendered while we are waiting a response from the server.
 */
function LoadingLayout(props) {
  return (
    <Row className="vh-100">
      <Col md={4} bg="light" className="below-nav" id="left-sidebar">
      </Col>
      <Col md={8} className="below-nav">
        <h1>CMSmall is loading ...</h1>
      </Col>
    </Row>
  )
}

function LoginLayout(props) {
  return (
    <Row className="vh-100">
      <Col md={12} className="below-nav">
        <LoginForm login={props.login} />
      </Col>
    </Row>
  );
}

function AddLayout(props) {
  const setDirty = props.setDirty;
  const pages = props.pages;
  const setPageList = props.setPageList;
  const {handleErrors} = useContext(MessageContext);
  const users = props.users;

  const addPage = (page) => {
    const nextID = pages.length !==0 ? pages[pages.length -1].id + 1 : 1; //if there are no pages there would be an error
    const dirtyPage = Object.assign({}, page, {id: nextID, dirty: "warning"});
    dirtyPage.creazione = dayjs(dirtyPage.creazione);
    dirtyPage.pubblicazione = dirtyPage.pubblicazione ? dayjs(dirtyPage.pubblicazione) : "";
    setPageList([...pages, dirtyPage]);
    API.addPage(page)
      .then((p) => setDirty(true))
      .catch((err) => handleErrors(err));
  }

  return ( <PageForm addPage={addPage} users={users} user={props.user} images={props.images}/>);
}

function EditLayout(props) {
  const setDirty = props.setDirty;
  const {handleErrors} = useContext(MessageContext);

  const { pageId } = useParams();
  const [page, setPage] = useState(null);
  const users = props.users;
  const pages = props.pages;
  const setPageList = props.setPageList;

  useEffect(() => {
    API.getPage(pageId)
      .then(page => {
        setPage(page);
      })
      .catch(e => {
        handleErrors(e); 
      }); 
  }, [pageId])

  const updatePage = (page) => {
    const dirtyPage = Object.assign({}, page, {dirty: "warning"});
    dirtyPage.creazione = dayjs(dirtyPage.creazione);
    dirtyPage.pubblicazione = dirtyPage.pubblicazione ? dayjs(dirtyPage.pubblicazione) : "";
    dirtyPage.blocks = dirtyPage.blocks.filter((b) => !b.deleted);
    setPageList(pages.map((p) => p.id !== page.id ? p : dirtyPage));
    API.updatePage(page)
      .then((p) => {setDirty(true);})
      .catch((err) => handleErrors(err));
  }

  return ( page ? <PageForm updatePage={updatePage} users={users} user={props.user} images={props.images} page={page} /> : <></>);

}

export {PageList, LoadingLayout, LoginLayout, NotFoundLayout, SwitchButton, AddLayout, EditLayout};