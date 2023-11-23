import { Card } from "react-bootstrap";

function Block(props){
    const type = props.type;
    const value = props.value;

    const renderBlock = () => {
        switch(type){
            case 'header':
                return <h1>{value}</h1>;
            case 'paragraph':
                return <p>{value}</p>;
            case 'image':
                return <Card.Img src={`http://localhost:3001/static/${value}`} style={{"height" : "300px",
                "width": "300px"}}/>;
            default:
                return <></>
        }
    };

    return (
        <>
        {renderBlock()}
        </>
    );
}

export default Block;