import React from 'react';
import $ from 'jquery';
import {Button, InputGroup, FormControl, Container, Row, Col} from 'react-bootstrap';
import ResultTable from "../UtilityComponents/ResultTable";
import axios from "axios";
import LoadingSpinner from "../UtilityComponents/LoadingSpinner/LoadingSpinner";
import configData from '../Config/config.json';
import './OntologyHierarchy.css';
import Tree from 'react-animated-tree';

class OntologyHierarchy extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};
        this.getRootMP = this.getRootMP.bind(this);
    }

    getRootMP() {
        this.setState({loading: true});
        let url_string = configData.api_server + "controller.php?type=ontology&ontologySearch=&term=GET_ROOT&ontology=MP";
        axios.get(url_string)
            .then((response) => {
                if (response.status === 200) {
                    if (response.data) {
                        this.setState({mpTree: response.data, loading: false});
                    } else {

                    }
                }
            })
            .catch((error) => {
                console.log("An error occurred retrieving phenotype data.");
            });
    }

    render() {
        const {tableData, liveSearchResults, loading, searchOpen, selectedSpecies} = this.state;
        const treeStyles = {
            left: 40,
            color: 'black',
            fill: 'black',
            width: '100%'
        };
        const typeStyles = {
            fontSize: '2em',
            verticalAlign: 'middle'
        };
        return <div>
            <Container>
                <Row>
                    <Col>
                        <div id="humanTreeWrapper" className="treeWrapper">
                            <div className="ontologySearchWrapper">
                                <InputGroup className="input-group mb-3 mx-auto">
                                    <FormControl id="userSearchInput" autoComplete="off" placeholder="testing..."/>
                                    <Button variant="flat" size="xxl" id="search_btn"
                                            onClick={this.searchClick}>Search</Button>
                                </InputGroup>
                            </div>
                            <LoadingSpinner loading={loading}/>
                            <Tree content="MP" type="ITEM" canHide open style={treeStyles}>
                                {this.getRootMP}
                            </Tree>

                        </div>
                    </Col>
                    <Col>
                        <div id="mouseTreeWrapper" className="treeWrapper reversed">
                            <Tree content="main" type="ITEM" canHide open style={treeStyles}>
                                <Tree content="hello" type={<span style={typeStyles}>🙀</span>} canHide/>
                                <Tree content="subtree with children" canHide>
                                    <Tree content="hello"/>
                                    <Tree content="sub-subtree with children">
                                        <Tree content="child 1" style={{color: '#63b1de'}}/>
                                        <Tree content="child 2" style={{color: '#63b1de'}}/>
                                        <Tree content="child 3" style={{color: '#63b1de'}}/>
                                    </Tree>
                                    <Tree content="hello"/>
                                </Tree>
                                <Tree content="hello" canHide/>
                                <Tree content="hello" canHide/>
                            </Tree>
                        </div>
                    </Col>
                </Row>

            </Container>


        </div>

    }
}

export default OntologyHierarchy;