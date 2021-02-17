import React from 'react';
import './App.css';
// @ts-ignore
import Home from "./Home.js";
// @ts-ignore
import {TransitionGroup, CSSTransition} from "react-transition-group";
// @ts-ignore
import {HashRouter, Route, Switch} from "react-router-dom";
import PhenotypeSearch from "../PhenotypeSearch/PhenotypeSearch";
import OntologyHierarchy from "../OntologyHierarchy/OntologyHierarchy";

function App() {
    return (<div className="App">
            <header className="App-header">
            </header>
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
                </Switch>
            </HashRouter>
        </div>
    );
}

export default App;
