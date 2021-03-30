import React from "react";
import './PhenotypeResultBreakdown.css';
import ResultTable from "../../UtilityComponents/ResultTable";
import $ from "jquery";
import axios from "axios";
import LoadingSpinner from "../../UtilityComponents/LoadingSpinner/LoadingSpinner";
import {AppBar, Button, Grid, Paper, Tab, Tabs} from "@material-ui/core";
import TabPanel from "../../UtilityComponents/TabPanel";
import api_server from "../../UtilityComponents/ConfigData";

class PhenotypeResultBreakdown extends React.Component {
    constructor(props) {
        super(props);
        this.gwasStudyClicked = this.gwasStudyClicked.bind(this);
        this.experimentClicked = this.experimentClicked.bind(this);
        this.state = {
            selectedPhenotype: "",
            breakdownData: null,
            backBtnClick: null,
            loading: true,
            tabValue: 0,
            dataTabValue: 0,
            configData: api_server
        };
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
        let url_string = this.state.configData.api_server + "controller.php?type=study&phenotypeBreakdown=&term=" + this.props.selectedPhenotype;
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

    getHumanTermID(breakdownData) {
        if (breakdownData) {
            if (breakdownData["Mappings"].length > 0) {
                return breakdownData["Mappings"][0]["humanID"];
            } else {
                return "No mapping found";
            }
        }
    }

    getHumanTerm(breakdownData) {
        if (breakdownData) {
            if (breakdownData["Mappings"].length > 0) {
                return breakdownData["Mappings"][0]["humanLabel"];
            } else {
                return "No mapping found";
            }
        }
    }

    getMouseTermID(breakdownData) {
        if (breakdownData) {
            if (breakdownData["Mappings"].length > 0) {
                return breakdownData["Mappings"][0]["mouseID"];
            } else {
                return "No mapping found";
            }
        }
    }

    getMouseTerm(breakdownData) {
        if (breakdownData) {
            if (breakdownData["Mappings"].length > 0) {
                return breakdownData["Mappings"][0]["mouseLabel"];
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
        const {breakdownData, loading, tabValue, dataTabValue} = this.state;
        return (
            <Paper id="phenotypeResultsContainer" className="container">
                <LoadingSpinner loading={loading}/>
                {this.props.backBtnClick ?
                    <Button variant="contained" color="primary" onClick={this.props.backBtnClick}>Back</Button> : null}
                <div className="phenotype-breakdown-container">
                    <AppBar position="static" color="default">
                        <Tabs
                            value={tabValue}
                            onChange={(e, val) => this.setState({tabValue: val})}
                            indicatorColor="primary"
                            textColor="primary"
                            variant="fullWidth"
                            aria-label="full width tabs example"
                        >
                            <Tab label="Data"/>
                            <Tab label="Mapping"/>

                        </Tabs>
                    </AppBar>
                    <TabPanel value={tabValue} index={0}>
                        <AppBar position="static" color="default">
                            <Tabs
                                value={dataTabValue}
                                onChange={(e, val) => this.setState({dataTabValue: val})}
                                indicatorColor="primary"
                                textColor="primary"
                                variant="fullWidth"
                                aria-label="full width tabs example"
                            >
                                <Tab
                                    label={(breakdownData ? breakdownData["Gene Knockouts"].length : 0) + " Mouse Gene Knockouts"}/>
                                <Tab
                                    label={(breakdownData ? breakdownData["GWAS Studies"].length : 0) + " Human GWAS Studies"}/>
                            </Tabs>
                        </AppBar>
                        <TabPanel value={dataTabValue} index={0}>
                            {breakdownData ? <ResultTable tableData={breakdownData["Gene Knockouts"]}
                                                          onRowClick={this.experimentClicked}/> : null}
                        </TabPanel>
                        <TabPanel value={dataTabValue} index={1}>
                            {breakdownData ? <ResultTable tableData={breakdownData["GWAS Studies"]}
                                                          onRowClick={this.gwasStudyClicked}/> : null}
                        </TabPanel>
                    </TabPanel>
                    <TabPanel value={tabValue} index={1}>
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
                                <p>ID</p>
                            </Grid>
                            <Grid item xs={3}>
                                <p id="MP-Matched-Term">{this.getMouseTermID(breakdownData)}</p>
                            </Grid>
                            <Grid item xs={3} className="col highlight">
                                <p>ID</p>
                            </Grid>
                            <Grid item xs={3}>
                                <p id="HPO-Matched-Term">{this.getHumanTermID(breakdownData)}</p>
                            </Grid>
                            <Grid item xs={3} className="col highlight">
                                <p>Term</p>
                            </Grid>
                            <Grid item xs={3}>
                                <p id="MP-Matched-Term">{this.getMouseTerm(breakdownData)}</p>
                            </Grid>
                            <Grid item xs={3} className="col highlight">
                                <p>Term</p>
                            </Grid>
                            <Grid item xs={3}>
                                <p id="HPO-Matched-Term">{this.getHumanTerm(breakdownData)}</p>
                            </Grid>
                        </Grid>
                        <Grid container>
                            <Grid item xs={3} className="col highlight">
                                <p>Synonyms</p>
                            </Grid>
                            <Grid item xs={3} className="col">
                                <ul>
                                    {this.getMouseSynonyms(breakdownData)}
                                </ul>
                            </Grid>
                            <Grid item xs={3} className="col highlight">
                                <p>Synonyms</p>
                            </Grid>
                            <Grid item xs={3} className="col">
                                <ul>
                                    {this.getHumanSynonyms(breakdownData)}
                                </ul>
                            </Grid>
                        </Grid>
                    </TabPanel>


                </div>
            </Paper>
        );
    }
}

export default PhenotypeResultBreakdown;