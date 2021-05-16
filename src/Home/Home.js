import React from 'react';
import './App.css';
import MainMenuItem from "./Components/MainMenuItem";
import {Link} from 'react-router-dom';
// @ts-ignore
import $ from 'jquery';
import 'jqueryui';
import {Grid, withStyles} from "@material-ui/core";

const useStyles = theme => ({
    root: {
        flexGrow: 1,
        marginTop: 50,
    },
});

class Home extends React.Component {
    componentDidMount() {
        document.title = "GWAS Central - Homology";
    }

    render() {
        const {classes} = this.props;
        const spacing = 3;
        return (<Grid className={classes.root} container direction="row" justify="center" alignItems="center" spacing={10}>
            <Grid item xs={spacing}>
                <Link to="/PhenotypeSearch">
                    <MainMenuItem url="/PhenotypeSearch" image="images/bootstrap-icons-1.3.0/search.svg"
                                  alt="image of magnifying glass."
                                  heading="Phenotype Search" body="Text search by phenotype for matching human GWAS & mouse gene knockout comparative results,
                        showing homology data."/>
                </Link>

            </Grid>
            <Grid item xs={spacing}>
                <Link to="/OntologyHierarchy">
                    <MainMenuItem url="/OntologyHierarchy" image="images/bootstrap-icons-1.3.0/bezier2.svg"
                                  alt="image of a bezier curve between two points."
                                  heading="Phenotype Ontology Hierarchy"
                                  body="Ontology mapping visualisation with orthologue data."/>
                </Link>
            </Grid>

            <Grid item xs={spacing}>
                <Link to="/Genome">
                    <MainMenuItem url="/Genome" image="images/bootstrap-icons-1.3.0/dna-strand.svg"
                                  alt="image of a DNA double helix."
                                  heading="Genome Browser/Gene Symbol Search"
                                  body="Interactive genome browser for human/mouse orthologue data."/>
                </Link>
            </Grid>
        </Grid>);
    }
}

$(document).ready(function () {
    $(".menu-option").hover(function () {
        $(".menu-option:not(:hover)").css("background-color", "#e2e2e2");
    }, function () {
        $(".menu-option").css("background-color", "white");
    });
});

export default withStyles(useStyles)(Home);