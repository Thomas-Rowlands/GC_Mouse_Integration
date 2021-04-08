import React from "react";
import './PhenotypeResultBreakdown.css';
import ResultTable from "../../UtilityComponents/ResultTable";
import $ from "jquery";
import axios from "axios";
import LoadingSpinner from "../../UtilityComponents/LoadingSpinner/LoadingSpinner";
import {AppBar, Button, Grid, Paper, Tab, Tabs} from "@material-ui/core";
import TabPanel from "../../UtilityComponents/TabPanel";
import api_server from "../../UtilityComponents/ConfigData";
import {Graph} from "react-d3-graph";

class PhenotypeResultBreakdown extends React.Component {
// the graph configuration, just override the ones you need
    const
    myConfig = {
        nodeHighlightBehavior: true,
        directed: false,
        staticGraphWithDragAndDrop: true,
          d3: {
                alphaTarget: 0.05,
                gravity: -400,
                linkLength: 180,
                linkStrength: 1,
                disableLinkForce: true
              },
        node: {
            color: "blue",
            size: 300,
            highlightStrokeColor: "black",
            labelProperty: "name",
            labelPosition: "bottom",
        },
        link: {
            highlightColor: "lightblue",
            renderLabel: true,
            labelProperty: "linkType"
        },
    };

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
            configData: api_server,
            mappingGraphData: null,
            mappingGraphConfig: null,
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
                        // graph payload (with minimalist structure)
                        let humanTermCoords = [30, 214];
                        let mouseTermCoords = [730, 214];
                        var data = {
                            nodes: [
                                {
                                    id: response.data["Mappings"]["humanID"],
                                    name: response.data["Mappings"]["humanLabel"],
                                    x: humanTermCoords[0],
                                    y: humanTermCoords[1],
                                    color: "red"
                                },
                                {
                                    id: response.data["Mappings"]["mouseID"],
                                    name: response.data["Mappings"]["mouseLabel"],
                                    x: mouseTermCoords[0],
                                    y: mouseTermCoords[1],
                                    color: "blue"
                                }
                            ],
                            links: []
                        };
                        for (var i = 0; i < response.data["Mappings"]["mouseSynonyms"].length; i++) {
                            let mapping = response.data["Mappings"]["mouseSynonyms"][i];
                            let mouseNode = {
                                id: mapping["synonymId"],
                                name: mapping["synonymLabel"],
                                x: mouseTermCoords[0] - 100,
                                y: mouseTermCoords[1] - 85 + (i * 65),
                                color: "lightblue"
                            };
                            let link = {
                                source: mapping["synonymId"],
                                target: response.data["Mappings"]["mouseID"],
                                linkType: "Synonym"
                            };
                            if (!data.nodes.includes(mouseNode)) {
                                data.nodes.push(mouseNode);
                            }
                            if (!data.links.includes(link)) {
                                data.links.push(link);
                            }
                        }
                        for (var i = 0; i < response.data["Mappings"]["humanSynonyms"].length; i++) {
                            let mapping = response.data["Mappings"]["humanSynonyms"][i];
                            let humanNode = {
                                id: mapping["synonymId"],
                                name: mapping["synonymLabel"],
                                x: humanTermCoords[0] + 100,
                                y: humanTermCoords[1] - 85 + (i * 65),
                                color: "orange"
                            };
                            let link = {
                                source: response.data["Mappings"]["humanID"],
                                target: mapping["synonymId"],
                                linkType: "Synonym"
                            };
                            if (!data.nodes.includes(humanNode)) {
                                data.nodes.push(humanNode);
                            }
                            if (!data.links.includes(link)) {
                                data.links.push(link);
                            }
                        }
                        for (var i = 0; i < response.data["Mappings"]["matches"].length; i++) {
                            let match = response.data["Mappings"]["matches"][i];
                            let link = {
                                source: match["humanNodeType"] === "term" ? response.data["Mappings"]["humanID"] : match["humanNodeId"],
                                target: match["mouseNodeType"] === "term" ? response.data["Mappings"]["mouseID"] : match["mouseNodeId"],
                                linkType: match["isExact"] ? "Exact Match" : "Partial Match"
                            }
                            if (!data.links.includes(link)) {
                                data.links.push(link);
                            }
                        }
                        this.setState({breakdownData: response.data, loading: false, mappingGraphData: data});
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
            if (breakdownData["Mappings"]) {
                return breakdownData["Mappings"]["humanID"];
            } else {
                return "No mapping found";
            }
        }
    }

    getHumanTerm(breakdownData) {
        if (breakdownData) {
            if (breakdownData["Mappings"]) {
                return breakdownData["Mappings"]["humanLabel"];
            } else {
                return "No mapping found";
            }
        }
    }

    getMouseTermID(breakdownData) {
        if (breakdownData) {
            if (breakdownData["Mappings"]) {
                return breakdownData["Mappings"]["mouseID"];
            } else {
                return "No mapping found";
            }
        }
    }

    getMouseTerm(breakdownData) {
        if (breakdownData) {
            if (breakdownData["Mappings"]) {
                return breakdownData["Mappings"]["mouseLabel"];
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
            if (breakdownData["Mappings"]["humanSynonyms"].length > 0) {
                return breakdownData["Mappings"]["humanSynonyms"].map((synonym, index) =>
                    <li>{synonym["synonymLabel"]}</li>);
            } else {
                return <li>None</li>;
            }
        }
    }

    getMouseSynonyms(breakdownData) {
        if (breakdownData) {
            if (breakdownData["Mappings"]["mouseSynonyms"].length > 0) {
                return breakdownData["Mappings"]["mouseSynonyms"].map((synonym, index) =>
                    <li>{synonym["synonymLabel"]}</li>);
            } else {
                return <li>None</li>;
            }
        }
    }

    onClickNode = function (nodeId) {
        window.alert(`Clicked node ${nodeId}`);
    };

    onClickLink = function (source, target) {
        window.alert(`Clicked link between ${source} and ${target}`);
    };

    render() {
        const {breakdownData, loading, tabValue, dataTabValue, mappingGraphData} = this.state;
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
                    <TabPanel value={tabValue} index={0} className="subTabMenu">
                        <AppBar position="static" color="default">
                            <Tabs
                                value={dataTabValue}
                                onChange={(e, val) => this.setState({dataTabValue: val})}
                                indicatorColor="primary"
                                textColor="primary"
                                aria-label="full width tabs example"
                                variant="fullWidth"
                                centered
                            >
                                <Tab
                                    label={(breakdownData ? breakdownData["GWAS Studies"].length : 0) + " Human GWAS Studies"}
                                    wrapped/>
                                <Tab
                                    label={(breakdownData ? breakdownData["Gene Knockouts"].length : 0) + " Mouse Gene Knockouts"}
                                    wrapped/>

                            </Tabs>
                        </AppBar>
                        <TabPanel value={dataTabValue} index={0}>
                            {breakdownData ? <ResultTable tableData={breakdownData["GWAS Studies"]}
                                                          onRowClick={this.gwasStudyClicked}/> : null}
                        </TabPanel>
                        <TabPanel value={dataTabValue} index={1}>
                            {breakdownData ? <ResultTable tableData={breakdownData["Gene Knockouts"]}
                                                          onRowClick={this.experimentClicked}/> : null}
                        </TabPanel>

                    </TabPanel>
                    <TabPanel value={tabValue} index={1}>
                        <Grid container>
                            <Grid item xs>
                                <h4 className="center">Homo Sapiens</h4>
                            </Grid>
                            <Grid item xs>
                                <h4 className="center">Mus Musculus</h4>
                            </Grid>

                        </Grid>
                        <Grid container>
                            <Grid item xs={3} className="col highlight">
                                <p>ID</p>
                            </Grid>
                            <Grid item xs={3}>
                                <p id="HPO-Matched-Term">{this.getHumanTermID(breakdownData)}</p>
                            </Grid>
                            <Grid item xs={3} className="col highlight">
                                <p>ID</p>
                            </Grid>
                            <Grid item xs={3}>
                                <p id="MP-Matched-Term">{this.getMouseTermID(breakdownData)}</p>
                            </Grid>
                            <Grid item xs={3} className="col highlight">
                                <p>Term</p>
                            </Grid>
                            <Grid item xs={3}>
                                <p id="HPO-Matched-Term">{this.getHumanTerm(breakdownData)}</p>
                            </Grid>
                            <Grid item xs={3} className="col highlight">
                                <p>Term</p>
                            </Grid>
                            <Grid item xs={3}>
                                <p id="MP-Matched-Term">{this.getMouseTerm(breakdownData)}</p>
                            </Grid>

                        </Grid>
                        <Grid container>
                            <Grid item xs={3} className="col highlight">
                                <p>Synonyms</p>
                            </Grid>
                            <Grid item xs={3} className="col">
                                <ul>
                                    {this.getHumanSynonyms(breakdownData)}
                                </ul>
                            </Grid>
                            <Grid item xs={3} className="col highlight">
                                <p>Synonyms</p>
                            </Grid>
                            <Grid item xs={3} className="col">
                                <ul>
                                    {this.getMouseSynonyms(breakdownData)}
                                </ul>
                            </Grid>

                        </Grid>
                        <Graph
                            id="graph-id" // id is mandatory
                            data={mappingGraphData}
                            config={this.myConfig}
                            onClickNode={this.onClickNode}
                            onClickLink={this.onClickLink}
                        />
                    </TabPanel>


                </div>
            </Paper>
        );
    }
}

export default PhenotypeResultBreakdown;