import React from 'react';
import './gwascentral.css';
import './App.css';

// @ts-ignore
import Home from "./Home.js";
// @ts-ignore
import {TransitionGroup, CSSTransition} from "react-transition-group";
// @ts-ignore
import {HashRouter, Route, Switch} from "react-router-dom";
import PhenotypeSearch from "../PhenotypeSearch/PhenotypeSearch";
import OntologyHierarchy from "../OntologyHierarchy/OntologyHierarchy";
import Genome from "../Genome/Genome";

class App extends React.Component {

    constructor(props) {
        super(props);
        this.routes = [{path: '/', name: 'Home', Component: Home},
            {path: '/PhenotypeSearch', name: 'Phenotype', Component: PhenotypeSearch},
            {path: '/OntologyHierarchy', name: 'Ontology', Component: OntologyHierarchy},
            {path: '/Genome', name: 'Genome', Component: Genome},
            {path: '/Genome/:termID', name: 'Genome', Component: Genome},
        ];
    }

    render() {
        return (
            <div>
                <header className="App-header">
                    <div style={{width: "100%"}}>
                        <img src="/images/gwas-central-logo.png" alt=""
                             style={{
                                 verticalAlign: "bottom",
                                 position: "absolute",
                                 top: "20px",
                                 left: "70px",
                                 cursor: "pointer"
                             }}/>
                        <div id="header_menulinks">
                            <div id="h_menulinks" style={{paddingRight: "0.5em"}}>
                                <a href="https://www.gwascentral.org/info/data/database-content">Data</a>&nbsp;&nbsp;
                                <a href="https://www.gwascentral.org/info/how-to/submit-data">Submit</a>&nbsp;&nbsp;
                                <a href="https://www.gwascentral.org/info/data/download">Download</a>&nbsp;&nbsp;
                                <a href="https://www.gwascentral.org/info">Help</a>
                            </div>
                        </div>
                        <div style={{float: "right", paddingTop: "1.5em", paddingRight: "1em", clear: "right"}}>
                            <form action="/search" name="searchform" id="searchform">
                                {/*<fieldset>*/}
                                {/*    <img src="/images/options/search.png" alt="">&nbsp;<input name="q" type="text"*/}
                                {/*                                                              id="minisearch"*/}
                                {/*                                                              size="18" value=""*/}
                                {/*                                                              alt=""*/}
                                {/*                                                              autoComplete="off"*/}
                                {/*                                                              className="ac_input"><label>&nbsp;</label>*/}
                                {/*</fieldset>*/}
                            </form>
                        </div>
                        <div className="explore_panel">
                            <div style={{width: "100%"}}>
                                <div style={{float: "right", width: "100%"}}>
                                    <div className="main-tab-container">
                                        <div className="main-tab">
                                            <div style={{width: "106px"}}><a
                                                href="https://www569.lamp.le.ac.uk/#/"
                                                style={{fontSize: "0.8em"}}/></div>
                                            <a href="https://www569.lamp.le.ac.uk/#/"
                                               style={{fontSize: "0.8em"}}>
                                                <img src="/images/mouse.svg" alt=""
                                                     style={{width: "32px", height: "32px"}}/><br/>
                                                <div style={{height: "2em", marginTop: "0.5em"}}>Homology</div>
                                            </a></div>
                                    </div>
                                    <div className="main-tab-container">
                                        <div className="main-tab">
                                            <div style={{"width": "106px"}}><a
                                                href="https://www.gwascentral.org/gwasphenomap"
                                                style={{fontSize: "0.8em"}}/></div>
                                            <a href="https://www.gwascentral.org/gwasphenomap"
                                               style={{fontSize: "0.8em"}}>
                                                <img src="/images/section/compass.png" alt=""
                                                     style={{width: "32px", height: "32px"}}/> <br/>
                                                <div style={{height: "2em", marginTop: "0.5em"}}>PhenoMap</div>
                                            </a>
                                        </div>
                                    </div>
                                    <div className="main-tab-container">
                                        <div className="main-tab">
                                            <div style={{width: "106px"}}><a href="https://www.gwascentral.org/biomart"
                                                                             style={{fontSize: "0.8em"}}/>
                                            </div>
                                            <a href="https://www.gwascentral.org/biomart" style={{fontSize: "0.8em"}}>
                                                <img src="/images/section/gwasmart.png" alt=""
                                                     style={{width: "32px", height: "32px"}}/><br/>
                                                <div style={{height: "2em", marginTop: "0.5em"}}>GWAS Mart</div>
                                            </a></div>
                                    </div>
                                    <div className="main-tab-container">
                                        <div className="main-tab">
                                            <div style={{width: "106px"}}><a href="https://www.gwascentral.org/browser"
                                                                             style={{fontSize: "0.8em"}}/>
                                            </div>
                                            <a href="https://www.gwascentral.org/browser" style={{fontSize: "0.8em"}}>
                                                <img src="/images/section/browser.png" alt=""
                                                     style={{width: "32px", height: "32px"}}/><br/>
                                                <div style={{height: "2em", marginTop: "0.5em"}}>Browser</div>
                                            </a></div>
                                    </div>
                                    <div className="main-tab-container">
                                        <div className="main-tab">
                                            <div style={{width: "106px"}}><a href="https://www.gwascentral.org/markers"
                                                                             style={{fontSize: "0.8em"}}/>
                                            </div>
                                            <a href="https://www.gwascentral.org/markers" style={{fontSize: "0.8em"}}>
                                                <img src="/images/section/markers.png" alt=""
                                                     style={{width: "32px", height: "32px"}}/><br/>
                                                <div style={{height: "2em", marginTop: "0.5em"}}>Markers</div>
                                            </a></div>
                                    </div>
                                    <div className="main-tab-container">
                                        <div className="main-tab">
                                            <div style={{width: "106px"}}><a href="https://www.gwascentral.org/studies"
                                                                             style={{fontSize: "0.8em"}}/>
                                            </div>
                                            <a href="https://www.gwascentral.org/studies" style={{fontSize: "0.8em"}}>
                                                <img src="/images/section/studies.png" alt=""
                                                     style={{width: "32px", height: "32px"}}/><br/>
                                                <div style={{height: "2em", marginTop: "0.5em"}}>Study List</div>
                                            </a></div>
                                    </div>
                                    <div className="main-tab-container">
                                        <div className="main-tab">
                                            <div style={{width: "106px"}}><a
                                                href="https://www.gwascentral.org/generegion"
                                                style={{fontSize: "0.8em"}}/></div>
                                            <a href="https://www.gwascentral.org/generegion"
                                               style={{fontSize: "0.8em"}}>
                                                <img src="/images/section/genes.png" alt=""
                                                     style={{width: "32px", height: "32px"}}/><br/>
                                                <div style={{height: "2em", marginTop: "0.5em"}}>Gene/Region</div>
                                            </a></div>
                                    </div>
                                    <div className="main-tab-container">
                                        <div className="main-tab">
                                            <div style={{width: "106px"}}><a
                                                href="https://www.gwascentral.org/phenotypes"
                                                style={{fontSize: "0.8em"}}/></div>
                                            <a href="https://www.gwascentral.org/phenotypes"
                                               style={{fontSize: "0.8em"}}>
                                                <img src="/images/section/phenotypes.png" alt=""
                                                     style={{width: "32px", height: "32px"}}/><br/>
                                                <div style={{height: "2em", marginTop: "0.5em"}}>Phenotypes</div>
                                            </a></div>
                                    </div>
                                </div>

                                <div style={{float: "right", width: "100%"}} className="main-tab-base-row">
                                    <div className="main-tab-container">
                                        <div className="main-tab-base"/>
                                    </div>
                                    <div className="main-tab-container">
                                        <div className="main-tab-base"/>
                                    </div>
                                    <div className="main-tab-container">
                                        <div className="main-tab-base"/>
                                    </div>
                                    <div className="main-tab-container">
                                        <div className="main-tab-base"/>
                                    </div>
                                    <div className="main-tab-container">
                                        <div className="main-tab-base"/>
                                    </div>
                                    <div className="main-tab-container">
                                        <div className="main-tab-base"/>
                                    </div>
                                    <div className="main-tab-container">
                                        <div className="main-tab-base"/>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </header>
                <div className="App">
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
                                                <Component/>
                                            </div>
                                        </CSSTransition>
                                    )}
                                </Route>
                            ))}

                    </HashRouter>
                </div>
            </div>

        );
    }
}

export default App;
