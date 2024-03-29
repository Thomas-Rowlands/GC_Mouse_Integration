import React from "react";
import './PhenotypeResultBreakdown.css';
import ResultTable from "../../UtilityComponents/ResultTable";
import axios from "axios";
import {
    AppBar,
    Button,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Tab,
    Tabs, Typography,
    withStyles
} from "@material-ui/core";
import TabPanel from "../../UtilityComponents/TabPanel";
import api_server from "../../UtilityComponents/ConfigData";
import {Graph} from "react-d3-graph";
import _ from "lodash";
import InfoDialog from "../../UtilityComponents/InfoDialog";

const useStyles = theme => ({
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
    },
    selectEmpty: {
        marginTop: theme.spacing(2),
    },
    autoComplete: {
        width: "50%",
        marginLeft: "auto",
        marginRight: "auto",
    },
    radio: {
        width: "50%",
        marginLeft: "auto",
        marginRight: "auto"
    },
});

class PhenotypeResultBreakdown extends React.Component {
// the graph configuration, just override the ones you need
    const
    myConfig = {
        nodeHighlightBehavior: true,
        directed: false,
        staticGraphWithDragAndDrop: true,
        d3: {
            alphaTarget: 0.05,
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
            labelProperty: "linkType",
            strokeWidth: 3,
            fontSize: 10
        },
    };

    constructor(props) {
        super(props);
        this.gwasStudyClicked = this.gwasStudyClicked.bind(this);
        this.triggerGenotypeEvent = this.triggerGenotypeEvent.bind(this);
        this.state = {
            mousePhenotype: "",
            humanPhenotype: "",
            breakdownData: null,
            backBtnClick: null,
            loading: false,
            tabValue: 0,
            dataTabValue: 0,
            configData: api_server,
            mappingGraphData: null,
            mappingGraphConfig: null,
            humanOntology: "",
            mousePval: 0,
            humanPval: 0,
            hasData: false
        };
    }

    componentDidMount() {
        this.getBreakdownData();
    }

    getSnapshotBeforeUpdate(prevProps) {
        return{updateRequired: (this.props.mousePhenotype !== prevProps.mousePhenotype || this.props.humanPhenotype !== prevProps.humanPhenotype)};
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (snapshot.updateRequired) {
            this.getBreakdownData();
        }
    }

    gwasStudyClicked(study) {
        let studyID = study.currentTarget.getAttribute("data-link");
        var win = window.open("https://www.gwascentral.org/study/" + studyID, "_blank");
        if (win)
            win.focus();
    }


    getBreakdownData() {
        this.setState({loading: true});
        if (this.props.setLoading)
            this.props.setLoading(true);
        let mousePhenotype = this.props.mousePhenotype ? this.props.mousePhenotype : "";
        let humanPhenotype = this.props.humanPhenotype ? this.props.humanPhenotype : "";
        let humanOntology = this.props.humanOntology ? this.props.humanOntology : "";
        let url_string = this.state.configData.api_server + "controller.php?type=study&phenotypeBreakdown=&mouseTerm=" + mousePhenotype + "&humanTerm=" + humanPhenotype + "&humanOntology=" + humanOntology;
        axios.get(url_string)
            .then((response) => {
                if (response.status === 200) {
                    if (response.data) {
                        let dataTabValue = response.data["GWAS Studies"].length > 0 ? 0 : 1;
                        // graph payload (with minimalist structure)
                        if (!Array.isArray(response.data["Mappings"])) {
                            let i;
                            let humanTermCoords = [50, 214];
                            let mouseTermCoords = [750, 214];
                            let data = {
                                nodes: [
                                    {
                                        id: response.data["Mappings"]["humanNodeId"],
                                        name: response.data["Mappings"]["humanLabel"],
                                        x: humanTermCoords[0],
                                        y: humanTermCoords[1],
                                        color: "red",
                                        symbolType: "square"
                                    },
                                    {
                                        id: response.data["Mappings"]["mouseNodeId"],
                                        name: response.data["Mappings"]["mouseLabel"],
                                        x: mouseTermCoords[0],
                                        y: mouseTermCoords[1],
                                        color: "blue",
                                        symbolType: "square"
                                    }
                                ],
                                links: []
                            };

                            for (i = 0; i < response.data["Mappings"]["mouseSynonyms"].length; i++) {
                                let mapping = response.data["Mappings"]["mouseSynonyms"][i];
                                let mouseNode = {
                                    id: mapping["synonymId"],
                                    name: mapping["synonymLabel"],
                                    x: mouseTermCoords[0] - 175,
                                    y: mouseTermCoords[1] - 105 + (i * 65),
                                    color: "lightblue"
                                };
                                let link = {
                                    source: mapping["synonymId"],
                                    target: response.data["Mappings"]["mouseNodeId"],
                                    linkType: "Synonym"
                                };
                                if (!data.nodes.includes(mouseNode)) {
                                    data.nodes.push(mouseNode);
                                }
                                if (!data.links.includes(link)) {
                                    data.links.push(link);
                                }
                            }
                            for (i = 0; i < response.data["Mappings"]["humanSynonyms"].length; i++) {
                                let mapping = response.data["Mappings"]["humanSynonyms"][i];
                                let humanNode = {
                                    id: mapping["synonymId"],
                                    name: mapping["synonymLabel"],
                                    x: humanTermCoords[0] + 175,
                                    y: humanTermCoords[1] - 105 + (i * 65),
                                    color: "orange"
                                };
                                let link = {
                                    source: response.data["Mappings"]["humanNodeId"],
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
                            for (i = 0; i < response.data["Mappings"]["matches"].length; i++) {
                                let match = response.data["Mappings"]["matches"][i];
                                let source = _.find(data.nodes, function (node) {
                                    if (node.id === match["humanNodeId"])
                                        return true;
                                });
                                let target = _.find(data.nodes, function (node) {
                                    if (node.id === match["mouseNodeId"])
                                        return true;
                                });
                                let link = {
                                    source: source ? match["humanNodeId"] : response.data["Mappings"]["humanNodeId"],
                                    target: target ? match["mouseNodeId"] : response.data["Mappings"]["mouseNodeId"],
                                    linkType: match["mappingType"] + " Mapping"
                                }
                                if (!data.links.includes(link)) {
                                    data.links.push(link);
                                }
                            }
                            this.setState({
                                breakdownData: response.data,
                                dataTabValue: dataTabValue,
                                mappingGraphData: data,
                                loading: false,
                                hasData: true
                            });
                        } else {
                            this.setState({
                                breakdownData: response.data,
                                dataTabValue: dataTabValue,
                                mappingGraphData: null,
                                hasData: true,
                                loading: false
                            }, this.props.setLoading(false));
                        }
                    } else {
                        this.setState({breakdownData: null, loading: false, mappingGraphData: null, hasData: false},
                            this.props.setLoading(false));
                    }
                }
                if (this.props.parentComponent === "PhenotypeSearch")
                    this.props.setLoading(false);
            })
            .catch((error) => {
                console.log("An error occurred retrieving phenotype data.");
                this.setState({breakdownData: null, loading:false, mappingGraphData: null});
                this.props.setLoading(false);
            });
    }

    getHumanTermID(breakdownData) {
        if (breakdownData) {
            if (breakdownData["Mappings"]["humanID"]) {
                return breakdownData["Mappings"]["humanID"];
            } else {
                return "No mapping found";
            }
        }
    }

    getHumanTerm(breakdownData) {
        if (breakdownData) {
            if (breakdownData["Mappings"]["humanLabel"]) {
                return breakdownData["Mappings"]["humanLabel"];
            } else {
                return "No mapping found";
            }
        }
    }

    getMouseTermID(breakdownData) {
        if (breakdownData) {
            if (breakdownData["Mappings"]["mouseID"]) {
                return breakdownData["Mappings"]["mouseID"];
            } else {
                return "No mapping found";
            }
        }
    }

    getMouseTerm(breakdownData) {
        if (breakdownData) {
            if (breakdownData["Mappings"]["mouseLabel"]) {
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
            if (breakdownData["Mappings"]["humanSynonyms"] && breakdownData["Mappings"]["humanSynonyms"].length > 0) {
                return breakdownData["Mappings"]["humanSynonyms"].map((synonym, index) =>
                    <li>{synonym["synonymLabel"]}</li>);
            } else {
                return <li>None</li>;
            }
        }
    }

    getMouseSynonyms(breakdownData) {
        if (breakdownData) {
            if (breakdownData["Mappings"]["mouseSynonyms"] && breakdownData["Mappings"]["mouseSynonyms"].length > 0) {
                return breakdownData["Mappings"]["mouseSynonyms"].map((synonym, index) =>
                    <li>{synonym["synonymLabel"]}</li>);
            } else {
                return <li>None</li>;
            }
        }
    }

    openGenePage(gene_key) {
        gene_key = gene_key.currentTarget.getAttribute("data-link");
        window.open("https://www.mousephenotype.org/data/genes/" + gene_key, "_blank").focus();
    }

    openProcedurePage(procedure_key) {
        procedure_key = procedure_key.currentTarget.getAttribute("data-link");
        window.open("https://web.mousephenotype.org/impress/ProcedureInfo?procID=" + procedure_key, "_blank").focus();
    }

    openParameterPage(parameter_key) {
        let procedure_key = parameter_key.currentTarget.previousSibling.getAttribute("data-link");
        parameter_key = parameter_key.currentTarget.getAttribute("data-link");
        window.open("https://web.mousephenotype.org/impress/OntologyInfo?procID=" + procedure_key + "#" + parameter_key, "_blank").focus();
    }

    humanPValChanged = (e) => {
        this.setState({humanPval: e.target.value});
    }

    mousePValChanged = (e) => {
        this.setState({mousePval: e.target.value});
    }

    getExperimentData() {
        let data = this.state.breakdownData["Gene Knockouts"];
        let pval = this.state.mousePval;
        let filtered = [];
        for (var i = 0; i < data.length; i++) {
            if (data[i]["-log P-value"] >= pval)
                filtered.push(data[i]);
        }
        return filtered;
    }

    getGWASData() {
        let data = this.state.breakdownData["GWAS Studies"];
        let pval = this.state.humanPval;
        let filtered = [];
        for (var i = 0; i < data.length; i++) {
            if (data[i]["-log P-value"] >= pval)
                filtered.push(data[i]);
        }
        return filtered;
    }

    triggerGenotypeEvent() {
        this.props.genotypeHandler();
    }

    getGWASInfoText = () => {
        return `
        Human GWAS study records containing marker associations with the selected phenotype (and descendant ontology terms) are displayed below.
        
        Use the dropdown menu to filter results by -log p-value. 
        `;
    }

    getKnockoutInfoText = () => {
        return `
        IMPC mouse gene knockout experiments containing associations with the selected phenotype (and descendant ontology terms) are displayed below.
        
        Use the dropdown menu to filter results by -log p-value. 
        `;
    }

    render() {
        const {breakdownData,loading, tabValue, dataTabValue, mappingGraphData, hasData} = this.state;
        const {classes} = this.props;
        if (loading)
            return (
                <div></div>
            );
        if (hasData)
            return (
                <div>
                    <Paper id="phenotypeResultsContainer" className="container">
                        {this.props.backBtnClick ?
                            <Button variant="contained" color="primary"
                                    onClick={this.props.backBtnClick}>Back</Button> : null}
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
                                <AppBar position="static" color="default" style={{maxWidth:"100%", overflowX: "scroll"}}>
                                    <Tabs
                                        value={dataTabValue}
                                        onChange={(e, val) => val > 1 ? e.preventDefault() : this.setState({dataTabValue: val})}
                                        indicatorColor="primary"
                                        textColor="primary"
                                        aria-label="full width tabs example"
                                        style={{width: "auto"}}
                                        centered
                                    >
                                        <Tab
                                            label={(breakdownData ? breakdownData["GWAS Studies"].length : 0) + " Human GWAS Studies"}
                                            wrapped/>
                                        <Tab
                                            label={(breakdownData ? breakdownData["Gene Knockouts"].length : 0) + " Mouse Gene Knockouts"}
                                            wrapped/>
                                        <Button className="tab-button" variant="contained" color="primary" onClick={() => this.triggerGenotypeEvent()}>Genotype</Button>
                                    </Tabs>
                                </AppBar>
                                <TabPanel value={dataTabValue} index={0}>
                                    <div style={{width: "100%"}}>
                                        <FormControl style={{marginLeft: "36%"}} className={classes.formControl}
                                                     onChange={this.humanPValChanged}>
                                            <InputLabel shrink>Human P-value</InputLabel>
                                            <Select value={this.state.humanPval} className={classes.selectEmpty}
                                                    id="human_pval_select"
                                                    onChange={this.humanPValChanged}>
                                                <MenuItem value={0}>0</MenuItem>
                                                <MenuItem value={1}>1</MenuItem>
                                                <MenuItem value={2}>2</MenuItem>
                                                <MenuItem value={3}>3</MenuItem>
                                                <MenuItem value={4}>4</MenuItem>
                                                <MenuItem value={5}>5</MenuItem>
                                                <MenuItem value={6}>6</MenuItem>
                                                <MenuItem value={7}>7</MenuItem>
                                                <MenuItem value={8}>8</MenuItem>
                                                <MenuItem value={9}>9</MenuItem>
                                                <MenuItem value={10}>10</MenuItem>
                                            </Select>
                                        </FormControl><InfoDialog title={"GWAS Records"} contentText={this.getGWASInfoText()}/>
                                    </div>

                                    {breakdownData ?
                                        <ResultTable isSearchResult={false} orderBy={"name"} hiddenHeaders={["id"]} dataHeaders={{"name": "id"}}
                                                     hoverDataMap={{"name": "id"}}
                                                     cellClickHandlers={{"name": this.gwasStudyClicked}}
                                                     tableData={this.getGWASData()}/> : null}
                                </TabPanel>
                                <TabPanel value={dataTabValue} index={1}>
                                    <div style={{width: "100%"}}>
                                        <FormControl style={{marginLeft: "36%"}} className={classes.formControl}>
                                            <InputLabel shrink>Mouse P-value</InputLabel>
                                            <Select value={this.state.mousePval} className={classes.selectEmpty} id="select"
                                                    onChange={this.mousePValChanged}>
                                                <MenuItem value={0}>0</MenuItem>
                                                <MenuItem value={1}>1</MenuItem>
                                                <MenuItem value={2}>2</MenuItem>
                                                <MenuItem value={3}>3</MenuItem>
                                                <MenuItem value={4}>4</MenuItem>
                                                <MenuItem value={5}>5</MenuItem>
                                                <MenuItem value={6}>6</MenuItem>
                                                <MenuItem value={7}>7</MenuItem>
                                                <MenuItem value={8}>8</MenuItem>
                                                <MenuItem value={9}>9</MenuItem>
                                                <MenuItem value={10}>10</MenuItem>
                                            </Select>
                                        </FormControl><InfoDialog title={"IMPC Gene Knockout Experiments"} contentText={this.getKnockoutInfoText()}/>
                                    </div>

                                    {breakdownData ? <ResultTable isSearchResult={false}  orderBy={"Gene"} cellClickHandlers={{
                                        "Gene": this.openGenePage,
                                        "Procedure": this.openProcedurePage,
                                        "Parameter": this.openParameterPage
                                    }} dataHeaders={{
                                        "Gene": "Gene Key",
                                        "Parameter": "Parameter Key",
                                        "Procedure": "Procedure Key"
                                    }} hiddenHeaders={["Procedure Key", "Parameter Key", "Gene Key"]}
                                                                  tableData={this.getExperimentData()}/> : null}
                                </TabPanel>
                            </TabPanel>
                            <TabPanel value={tabValue} index={1}>
                                {
                                    breakdownData && !Array.isArray(breakdownData["Mappings"]) ? (<div>
                                            <Grid container>
                                                <Grid item xs>
                                                    <h4 className="center">Human</h4>
                                                </Grid>
                                                <Grid item xs>
                                                    <h4 className="center">Mouse</h4>
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
                                            <Grid container>
                                                <Grid item xs={3} className="col">
                                                    <svg className="legendIcon" xmlns="http://www.w3.org/2000/svg">
                                                        <rect x="15%" y="15%" width="1em" height="1em" fill="red"/>
                                                    </svg>
                                                    {this.props.humanOntology === "MESH" ? " MeSH Term" : " HPO Term"}
                                                </Grid>
                                                <Grid item xs={3} className="col">
                                                    <svg className="legendIcon" xmlns="http://www.w3.org/2000/svg">
                                                        <rect x="15%" y="15%" width="1em" height="1em" fill="blue"/>
                                                    </svg>
                                                    {" MP Term"}
                                                </Grid>
                                            </Grid>
                                            <Grid container>
                                                <Grid item xs={3} className="col">
                                                    <svg className="legendIcon" xmlns="http://www.w3.org/2000/svg">
                                                        <circle cx="9" cy="9" r="0.5em" fill="orange"/>
                                                    </svg>
                                                    {this.props.humanOntology === "MESH" ? " MeSH Synonym" : " HPO Synonym"}
                                                </Grid>
                                                <Grid item xs={3} className="col">
                                                    <svg className="legendIcon" xmlns="http://www.w3.org/2000/svg">
                                                        <circle cx="9" cy="9" r="0.5em" fill="lightblue"/>
                                                    </svg>
                                                    {" MP Synonym"}
                                                </Grid>
                                            </Grid>
                                            <Graph
                                                id="graph-id" // id is mandatory
                                                data={mappingGraphData}
                                                config={this.myConfig}
                                            />
                                        </div>
                                    ) : <p>No mappings identified.</p>
                                }

                            </TabPanel>
                        </div>
                    </Paper>
                </div>
            );
        else if (!loading)
            return (
              <div>
                  <Paper id="phenotypeResultsContainer" className="container">
                      <Typography>No results found for {this.props.humanPhenotype ? this.props.humanPhenotype : this.props.mousePhenotype}</Typography>
                  </Paper>
              </div>
            );
        else
            return null;
    }
}

export default withStyles(useStyles)(PhenotypeResultBreakdown);