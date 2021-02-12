import React from 'react';
import './App.css';
import MainMenuItem from "./Components/MainMenuItem";
import {Link} from 'react-router-dom';
// @ts-ignore
import $ from 'jquery';
import 'jqueryui';

class Home extends React.Component {
    componentDidMount() {
        document.title = "GWAS Central - Homology";
    }

    render() {
        return (<div className="menu">
            <div className="row">
                <div className="col">
                    <Link to="/PhenotypeSearch">
                        <MainMenuItem url="/PhenotypeSearch" image="images/bootstrap-icons-1.3.0/search.svg"
                                      alt="image of magnifying glass."
                                      heading="Phenotype Search" body="Text search by phenotype for matching human GWAS & mouse gene knockout comparative results,
                        showing homology data."/>
                    </Link>

                </div>
                <div className="col">
                    <Link to="/Ontology">
                        <MainMenuItem url="/Ontology" image="images/bootstrap-icons-1.3.0/bezier2.svg"
                                      alt="image of a bezier curve between two points."
                                      heading="Phenotype Ontology Hierarchy"
                                      body="Text search by phenotype for matching human GWAS & mouse gene knockout comparative results,
                        showing homology data."/>
                    </Link>
                </div>

                <div className="col">
                    <Link to="/Genome">
                        <MainMenuItem url="/Genome" image="images/bootstrap-icons-1.3.0/dna-strand.svg"
                                      alt="image of a DNA double helix."
                                      heading="Genome Browser/Gene Symbol Search" body="Text search by phenotype for matching human GWAS & mouse gene knockout comparative results,
                        showing homology data."/>
                    </Link>

                </div>
            </div>
        </div>);
    }
}

$(document).ready(function () {
    $(".menu-option").hover(function () {
        $(".menu-option:not(:hover)").css("background-color", "#e2e2e2");
    }, function () {
        $(".menu-option").css("background-color", "white");
    });
});

export default Home;