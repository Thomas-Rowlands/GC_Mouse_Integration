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

function App() {
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
                            <a href="/info/data/database-content">Data</a>&nbsp;&nbsp;
                            <a href="/info/how-to/submit-data">Submit</a>&nbsp;&nbsp;
                            <a href="/info/data/download">Download</a>&nbsp;&nbsp;
                            <a href="/info">Help</a>
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
                                        <div style={{"width": "106px"}}><a href="/gwasphenomap"
                                                                           style={{fontSize: "0.8em"}}/></div>
                                        <a href="/gwasphenomap" style={{fontSize: "0.8em"}}>
                                            <img src="/images/section/compass.png" alt=""
                                                 style={{width: "32px", height: "32px"}}/> <br/>
                                            <div style={{height: "2em", marginTop: "0.5em"}}>PhenoMap</div>
                                        </a>
                                    </div>
                                </div>
                                <div className="main-tab-container">
                                    <div className="main-tab">
                                        <div style={{width:"106px"}}><a href="/biomart" style={{fontSize: "0.8em"}}/>
                                        </div>
                                        <a href="/biomart" style={{fontSize:"0.8em"}}>
                                            <img src="/images/section/gwasmart.png" alt=""
                                                 style={{width:"32px", height:"32px"}}/><br/>
                                            <div style={{height:"2em", marginTop:"0.5em"}}>GWAS Mart</div>
                                        </a></div>
                                </div>
                                <div className="main-tab-container">
                                    <div className="main-tab">
                                        <div style={{width:"106px"}}><a href="/browser" style={{fontSize: "0.8em"}}/>
                                        </div>
                                        <a href="/browser" style={{fontSize:"0.8em"}}>
                                            <img src="/images/section/browser.png" alt=""
                                                 style={{width:"32px", height:"32px"}}/><br/>
                                            <div style={{height:"2em", marginTop:"0.5em"}}>Browser</div>
                                        </a></div>
                                </div>
                                <div className="main-tab-container">
                                    <div className="main-tab">
                                        <div style={{width:"106px"}}><a href="/markers" style={{fontSize: "0.8em"}}/>
                                        </div>
                                        <a href="/markers" style={{fontSize:"0.8em"}}>
                                            <img src="/images/section/markers.png" alt=""
                                                 style={{width:"32px", height:"32px"}}/><br/>
                                            <div style={{height:"2em", marginTop:"0.5em"}}>Markers</div>
                                        </a></div>
                                </div>
                                <div className="main-tab-container">
                                    <div className="main-tab">
                                        <div style={{width:"106px"}}><a href="/studies" style={{fontSize: "0.8em"}}/>
                                        </div>
                                        <a href="/studies" style={{fontSize:"0.8em"}}>
                                            <img src="/images/section/studies.png" alt=""
                                                 style={{width:"32px", height:"32px"}}/><br/>
                                            <div style={{height:"2em", marginTop:"0.5em"}}>Study List</div>
                                        </a></div>
                                </div>
                                <div className="main-tab-container">
                                    <div className="main-tab">
                                        <div style={{width:"106px"}}><a href="/generegion"
    style={{fontSize: "0.8em"}}/></div>
                                        <a href="/generegion" style={{fontSize:"0.8em"}}>
                                            <img src="/images/section/genes.png" alt=""
                                                 style={{width:"32px",height:"32px"}}/><br/>
                                            <div style={{height:"2em", marginTop:"0.5em"}}>Gene/Region</div>
                                        </a></div>
                                </div>
                                <div className="main-tab-container">
                                    <div className="main-tab">
                                        <div style={{width:"106px"}}><a href="/phenotypes"
    style={{fontSize: "0.8em"}}/></div>
                                        <a href="/phenotypes" style={{fontSize: "0.8em"}}>
                                            <img src="/images/section/phenotypes.png" alt=""
                                                 style={{width:"32px", height:"32px"}}/><br/>
                                            <div style={{height:"2em", marginTop:"0.5em"}}>Phenotypes</div>
                                        </a></div>
                                </div>
                            </div>

                            <div style={{float:"right", width:"100%"}} className="main-tab-base-row">
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
                <Switch>
                    <Route exact path="/">
                        <Home/>
                    </Route>
                    <Route exact path="/PhenotypeSearch">
                        <PhenotypeSearch/>
                    </Route>
                    <Route exact path="/OntologyHierarchy">
                        <OntologyHierarchy/>
                    </Route>
                    <Route exact path="/Genome">
                        <Genome/>
                    </Route>
                </Switch>
            </HashRouter>
        </div>
        </div>

    );
}

export default App;
