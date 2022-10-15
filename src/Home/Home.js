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
        return (
            <div>
                <div className={"page-help-container"}>
                    <h3> Homology search interfaces </h3>
                    The homology search interfaces allow you to search for GWAS and mouse knockout genes
                    associated with mapped human and mouse phenotypes. See our <a target="_blank"
                                                                                  href="https://help.gwascentral.org/how-to-guides/how-to-use-the-homology-interfaces/">help
                    page</a> for further details.
                </div>
                <Grid className={classes.root} container direction="row" justifyContent="center" alignItems="center"
                      spacing={10}>
                    <Grid item xs={spacing}>
                        <Link to="/PhenotypeSearch">
                            <MainMenuItem url="/PhenotypeSearch" image="images/bootstrap-icons-1.3.0/search.svg"
                                          alt="image of magnifying glass."
                                          heading="Phenotype Search"
                                          body="Find GWAS and mouse genes by searching with ontology terms"/>
                        </Link>

                    </Grid>
                    <Grid item xs={spacing}>
                        <Link to="/OntologyHierarchy">
                            <MainMenuItem url="/OntologyHierarchy" image="images/bootstrap-icons-1.3.0/bezier2.svg"
                                          alt="image of a bezier curve between two points."
                                          heading="Phenotype Ontology Hierarchy"
                                          body="Browse ontology hierarchies to find GWAS and mouse genes."/>
                        </Link>
                    </Grid>

                    <Grid item xs={spacing}>
                        <Link to="/Genome">
                            <MainMenuItem url="/Genome" image="images/bootstrap-icons-1.3.0/dna-strand.svg"
                                          alt="image of a DNA double helix."
                                          heading="Genomic Region View"
                                          body="Explore the genome for GWAS variants and human orthologues of mouse genes"/>
                        </Link>
                    </Grid>
                </Grid>
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

export default withStyles(useStyles)(Home);