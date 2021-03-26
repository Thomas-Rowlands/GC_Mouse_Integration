import React from "react";
import './PhenotypeResultBreakdown.css';
import ResultTable from "../../UtilityComponents/ResultTable";
import $ from "jquery";
import axios from "axios";
import LoadingSpinner from "../../UtilityComponents/LoadingSpinner/LoadingSpinner";
import configData from "../../Config/config.json";
import {Button, Grid, Paper} from "@material-ui/core";

class PhenotypeResultBreakdown extends React.Component {
    constructor(props) {
        super(props);
        this.gwasStudyClicked = this.gwasStudyClicked.bind(this);
        this.experimentClicked = this.experimentClicked.bind(this);
        this.state = {selectedPhenotype: "", breakdownData: null, backBtnClick: null, loading: true};
    }

    componentDidMount() {
        this.getBreakdownData();
    }

    gwasStudyClicked(row) {
        let studyID = $(row.currentTarget).attr("data-id");
        var win = window.open("https://www.gwascentral.org/study/" + studyID, "_blank");
        if (win)
            win.focus();
    }

    experimentClicked(row) {
        let selection = $(row.target).attr("data-id");
    }

    getBreakdownData() {
        let url_string = configData.api_server + "controller.php?type=study&phenotypeBreakdown=&term=" + this.props.selectedPhenotype;
        axios.get(url_string)
            .then((response) => {
                if (response.status === 200) {
                    if (response.data) {
                        this.setState({breakdownData: response.data, loading: false});
                    } else {

                    }
                }
            })
            .catch((error) => {
                console.log("An error occurred retrieving phenotype data.");
            });
    }

    getHumanTerm(breakdownData) {
        if (breakdownData) {
            if (breakdownData["Mappings"].length > 0) {
                return breakdownData["Mappings"][0]["humanID"] + " " + breakdownData["Mappings"][0]["humanLabel"];
            } else {
                return "No mapping found";
            }
        }
    }

    getMouseTerm(breakdownData) {
        if (breakdownData) {
            if (breakdownData["Mappings"].length > 0) {
                return breakdownData["Mappings"][0]["mouseID"] + " " + breakdownData["Mappings"][0]["mouseLabel"];
            } else {
                return "No mapping found";
            }
        }
    }

    getGWASStudies(breakdownData) {
        if (breakdownData) {
            if (breakdownData["GWAS Studies"].length > 0) {

            } else {
                return "0";
            }
        }
    }

    getGeneKnockouts(breakdownData) {
        if (breakdownData) {
            if (breakdownData["Gene Knockouts"].length > 0) {

            } else {
                return "0";
            }
        }
    }

    getHumanSynonyms(breakdownData) {
        if (breakdownData) {
            if (breakdownData["Mappings"][0]["humanSynonyms"].length > 0) {
                return breakdownData["Mappings"][0]["humanSynonyms"].map((synonym, index) =>
                    <li>{synonym}</li>);
            } else {
                return <li>None</li>;
            }
        }
    }

    getMouseSynonyms(breakdownData) {
        if (breakdownData) {
            if (breakdownData["Mappings"][0]["mouseSynonyms"].length > 0) {
                return breakdownData["Mappings"][0]["mouseSynonyms"].map((synonym, index) =>
                    <li>{synonym}</li>);
            } else {
                return <li>None</li>;
            }
        }
    }

    render() {
        const {breakdownData, loading} = this.state;
        return (
            <Paper id="phenotypeResultsContainer" className="container">
                <LoadingSpinner loading={loading}/>
                {this.props.backBtnClick ?
                    <Button variant="contained" color="primary" onClick={this.props.backBtnClick}>Back</Button> : null}
                <div className="phenotype-breakdown-container">
                    <div>
                        <h3 id="Selected-Phenotype" className="col">{this.props.selectedPhenotype}</h3>
                    </div>
                    {/* Mappings */}
                    <Grid container>
                        <Grid item xs>
                            <h4 className="center">Mus Musculus</h4>
                        </Grid>
                        <Grid item xs>
                            <h4 className="center">Homo Sapiens</h4>
                        </Grid>

                    </Grid>
                    <Grid container>
                        <Grid item xs={3} className="col highlight">
                            <span>Mammalian Phenotype Term: </span>
                        </Grid>
                        <Grid item xs={3}>
                            <p id="MP-Matched-Term">{this.getMouseTerm(breakdownData)}</p>
                        </Grid>
                        <Grid item xs={3} className="col highlight">
                            <span>Human Phenotype Term: </span>
                        </Grid>
                        <Grid item xs={3}>
                            <p id="HPO-Matched-Term">{this.getHumanTerm(breakdownData)}</p>
                        </Grid>

                    </Grid>
                    {/* Synonyms */}
                    <Grid container>
                        <Grid item xs={3} className="col highlight">
                            <span>Synonyms: </span>
                        </Grid>
                        <Grid item xs={3} className="col">
                            <ul>
                                {this.getMouseSynonyms(breakdownData)}
                            </ul>
                        </Grid>
                        <Grid item xs={3} className="col highlight">
                            <span>Synonyms: </span>
                        </Grid>
                        <Grid item xs={3} className="col">
                            <ul>
                                {this.getHumanSynonyms(breakdownData)}
                            </ul>
                        </Grid>

                    </Grid>
                    {/*Studies/Experiments*/}
                    <Grid container className="row">
                        <Grid item xs={3} className="col highlight">
                            <span>Gene Knockouts: </span>
                        </Grid>
                        <Grid item xs={3} className="col">
                            <p>{breakdownData ? breakdownData["Gene Knockouts"].length : 0}</p>
                        </Grid>
                        <Grid item xs={3} className="col highlight">
                            <span>GWAS Studies: </span>
                        </Grid>
                        <Grid item xs={3} className="col">
                            <p>{breakdownData ? breakdownData["GWAS Studies"].length : 0}</p>
                        </Grid>

                    </Grid>
                    <Grid container className="row">
                        <Grid item xs className="col center highlight">
                            <span>Gene Knockouts</span>
                        </Grid>
                        <Grid item xs className="col center highlight">
                            <span>GWAS Studies</span>
                        </Grid>
                    </Grid>
                    <Grid container className="row">
                        <Grid item xs={6} className="col center">
                            {breakdownData ? <ResultTable tableData={breakdownData["Gene Knockouts"]}
                                                          onRowClick={this.experimentClicked}/> : null}
                        </Grid>
                        <Grid item xs={6} className="col center">
                            {breakdownData ? <ResultTable tableData={breakdownData["GWAS Studies"]}
                                                          onRowClick={this.gwasStudyClicked}/> : null}
                        </Grid>
                    </Grid>
                </div>
            </Paper>
        );
    }
}

export default PhenotypeResultBreakdown;