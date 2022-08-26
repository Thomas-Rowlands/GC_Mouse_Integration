import React from 'react';
import './App.css';
// @ts-ignore
import Home from "./Home.js";
// @ts-ignore
import {CSSTransition} from "react-transition-group";
// @ts-ignore
import {HashRouter, Route} from "react-router-dom";
import PhenotypeSearch from "../PhenotypeSearch/PhenotypeSearch";
import OntologyHierarchy from "../OntologyHierarchy/OntologyHierarchy";
import Genome from "../Genome/Genome";
import LoadingSpinner from "../UtilityComponents/LoadingSpinner/LoadingSpinner";
import {ThemeProvider} from "@material-ui/styles";
import GCTheme from "./theme";
import "./gwascentral.css";

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
        };
        this.routes = [{path: '/', name: 'Home', Component: Home},
            {path: '/PhenotypeSearch', name: 'Phenotype', Component: PhenotypeSearch},
            {path: '/OntologyHierarchy', name: 'Ontology', Component: OntologyHierarchy},
            {path: '/Genome', name: 'Genome', Component: Genome},
            {path: '/Genome/:termID', name: 'Genome', Component: Genome},
        ];
        this.nodeRef = React.createRef();
    }

    setLoading = (status) => {
        this.setState({loading: status});
    }

    render() {
        return (
            <div>
                <div className="floatholder" style={{height: "20%"}}>
                    <div id="header">
                        <div className="floatholder" style={{height: "20%"}}>
                            <div id="header">
                                <div>
                                    <div>
                                        <div style={{width: "100%"}}>
                                            <img onClick={() => window.href = 'https://www.gwascentral.org/index'}
                                                 src="https://www.gwascentral.org/images/gwas-central-logo.png"
                                                 alt="logo"
                                                 style={{
                                                     verticalAlign: "bottom",
                                                     position: "absolute",
                                                     top: "20px",
                                                     left: "70px"
                                                 }}/>
                                            <div id="header_menulinks">
                                                <div style={{
                                                    float: "left",
                                                    clear: "left",
                                                    color: "red",
                                                    fontSize: "1.1em",
                                                    fontWeight: "bold",
                                                    display: "none"
                                                }}></div>
                                                <div id="h_menulinks" style={{paddingRight: "0.5em"}}>
                                                    <a href="https://help.gwascentral.org/info/data">Data</a>&nbsp;&nbsp;
                                                    <a href="https://help.gwascentral.org/info/help#how_to_submit">Submit</a>&nbsp;&nbsp;
                                                    <a href="https://help.gwascentral.org/info/download">Download</a>&nbsp;&nbsp;
                                                    <a href="https://help.gwascentral.org/info/help">Help</a>
                                                </div>
                                            </div>
                                            <div style={{
                                                float: "right",
                                                paddingTop: "1.5em",
                                                paddingRight: "1em",
                                                clear: "right"
                                            }}>
                                                <form action="https://www.gwascentral.org/search"
                                                      name="searchform"
                                                      id="searchform">
                                                    <fieldset>
                                                        <img
                                                            src="https://www.gwascentral.org/images/options/search.png"
                                                            alt="search"/>&nbsp;<input name="q"
                                                                                       type="text"
                                                                                       id="minisearch"
                                                                                       size="18"
                                                                                       title="Enter keywords (e.g. an author name, title etc), MeSH phenotype annotation (e.g. type 2 diabetes), a gene name/feature (e.g. BRCA1), a chromosomal region (e.g. 12p33.33) or HGVbaseG2P/dbSNP marker identifier (e.g. rs699)"/><label>&nbsp;</label>
                                                    </fieldset>
                                                </form>
                                            </div>
                                            <div className="explore_panel">
                                                <div style={{width: "100%"}}>
                                                    <div style={{float: "right", width: "100%"}}>
                                                        <div className="main-tab-container">
                                                            <div className="main-tab-selected">
                                                                <a href="https://www.gwascentral.org/homology"
                                                                   style={{fontSize: "0.8em"}}>
                                                                    <div style={{width: "106px"}}></div>
                                                                    <img
                                                                        src="https://www.gwascentral.org/images/section/homology.png"
                                                                        alt=""
                                                                        style={{width: "32px", height: "32px"}}/><br/>
                                                                    <div
                                                                        style={{
                                                                            height: "2em",
                                                                            marginTop: "0.5em",
                                                                            top: "0.25em",
                                                                            zIndex: 10,
                                                                            position: "relative"
                                                                        }}>Homology
                                                                    </div>
                                                                </a>
                                                            </div>
                                                        </div>
                                                        <div className="main-tab-container">
                                                            <div className="main-tab"><a
                                                                href="https://www.gwascentral.org/gwasphenomap"
                                                                style={{fontSize: "0.8em"}}>
                                                                <div style={{width: "106px"}}></div>
                                                                <img
                                                                    src="https://www.gwascentral.org/images/section/compass.png"
                                                                    alt=""
                                                                    style={{width: "32px", height: "32px"}}/><br/>
                                                                <div
                                                                    style={{height: "2em", marginTop: "0.5em"}}>PhenoMap
                                                                </div>
                                                            </a>
                                                            </div>
                                                        </div>
                                                        <div className="main-tab-container">
                                                            <div className="main-tab"><a
                                                                href="https://www.gwascentral.org/biomart"
                                                                style={{fontSize: "0.8em"}}>
                                                                <div style={{width: "106px"}}></div>
                                                                <img
                                                                    src="https://www.gwascentral.org/images/section/gwasmart.png"
                                                                    alt=""
                                                                    style={{width: "32px", height: "32px"}}/><br/>
                                                                <div
                                                                    style={{height: "2em", marginTop: "0.5em"}}>GWAS
                                                                    Mart
                                                                </div>
                                                            </a>
                                                            </div>
                                                        </div>
                                                        <div className="main-tab-container">
                                                            <div className="main-tab"><a
                                                                href="https://www.gwascentral.org/browser"
                                                                style={{fontSize: "0.8em"}}>
                                                                <div style={{width: "106px"}}></div>
                                                                <img
                                                                    src="https://www.gwascentral.org/images/section/browser.png"
                                                                    alt=""
                                                                    style={{width: "32px", height: "32px"}}/><br/>
                                                                <div
                                                                    style={{height: "2em", marginTop: "0.5em"}}>Browser
                                                                </div>
                                                            </a>
                                                            </div>
                                                        </div>
                                                        <div className="main-tab-container">
                                                            <div className="main-tab"><a
                                                                href="https://www.gwascentral.org/markers"
                                                                style={{fontSize: "0.8em"}}>
                                                                <div style={{width: "106px"}}></div>
                                                                <img
                                                                    src="https://www.gwascentral.org/images/section/markers.png"
                                                                    alt=""
                                                                    style={{width: "32px", height: "32px"}}/><br/>
                                                                <div
                                                                    style={{height: "2em", marginTop: "0.5em"}}>Markers
                                                                </div>
                                                            </a>
                                                            </div>
                                                        </div>
                                                        <div className="main-tab-container">
                                                            <div className="main-tab"><a
                                                                href="https://www.gwascentral.org/studies"
                                                                style={{fontSize: "0.8em"}}>
                                                                <div style={{width: "106px"}}>
                                                                </div>
                                                                <img
                                                                    src="https://www.gwascentral.org/images/section/studies.png"
                                                                    alt=""
                                                                    style={{width: "32px", height: "32px"}}/><br/>
                                                                <div
                                                                    style={{height: "2em", marginTop: "0.5em"}}>Study
                                                                    List
                                                                </div>
                                                            </a>
                                                            </div>
                                                        </div>
                                                        <div className="main-tab-container">
                                                            <div className="main-tab"><a
                                                                href="https://www.gwascentral.org/generegion"
                                                                style={{fontSize: "0.8em"}}>
                                                                <div style={{width: "106px"}}>
                                                                </div>
                                                                <img
                                                                    src="https://www.gwascentral.org/images/section/genes.png"
                                                                    alt=""
                                                                    style={{width: "32px", height: "32px"}}/><br/>
                                                                <div
                                                                    style={{
                                                                        height: "2em",
                                                                        marginTop: "0.5em"
                                                                    }}>Gene/Region
                                                                </div>
                                                            </a>
                                                            </div>
                                                        </div>
                                                        <div className="main-tab-container">
                                                            <div className="main-tab"><a
                                                                href="https://www.gwascentral.org/phenotypes"
                                                                style={{fontSize: "0.8em"}}>
                                                                <div style={{width: "106px"}}></div>
                                                                <img
                                                                    src="https://www.gwascentral.org/images/section/phenotypes.png"
                                                                    alt=""
                                                                    style={{width: "32px", height: "32px"}}/><br/>
                                                                <div
                                                                    style={{
                                                                        height: "2em",
                                                                        marginTop: "0.5em"
                                                                    }}>Phenotypes
                                                                </div>
                                                            </a>
                                                            </div>
                                                        </div>
                                                    </div>


                                                    <div style={{float: "right", width: "100%"}}
                                                         className="main-tab-base-row">
                                                        <div className="main-tab-container">
                                                            <div className="main-tab-base-selected"
                                                                 style={{width: "6.5em", marginLeft: "0.5em"}}>
                                                                <img src="/images/main-tab-base.gif"/>
                                                            </div>
                                                        </div>

                                                        <div className="main-tab-container">
                                                            <div className="main-tab-base"></div>
                                                        </div>

                                                        <div className="main-tab-container">
                                                            <div className="main-tab-base"></div>
                                                        </div>
                                                        <div className="main-tab-container">
                                                            <div className="main-tab-base"></div>
                                                        </div>
                                                        <div className="main-tab-container">
                                                            <div className="main-tab-base"></div>
                                                        </div>
                                                        <div className="main-tab-container">
                                                            <div className="main-tab-base"></div>
                                                        </div>
                                                        <div className="main-tab-container">
                                                            <div className="main-tab-base"></div>
                                                        </div>
                                                        <div className="main-tab-container">
                                                            <div className="main-tab-base"></div>
                                                        </div>
                                                        <div className="main-tab-container">
                                                            <div className="main-tab-base"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="App">
                        <LoadingSpinner loading={this.state.loading}/>
                        <HashRouter>
                            {this.routes.map(({path, Component}) => (
                                <Route key={path} exact path={path}>
                                    {({match}) => (
                                        <CSSTransition
                                            in={match != null}
                                            timeout={300}
                                            classNames="page"
                                            unmountOnExit
                                        >
                                            <div className="page">
                                                <ThemeProvider theme={GCTheme}>
                                                    <Component
                                                        setLoading={this.setLoading}/>
                                                </ThemeProvider>
                                            </div>
                                        </CSSTransition>
                                    )}
                                </Route>
                            ))}

                        </HashRouter>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
